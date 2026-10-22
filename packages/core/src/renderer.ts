import { blockLift, cameraPose, clampPan, pathPose, terrainHalfSize, viewShift, type Pose, type ViewInsets } from './camera.js';
import type { Heightfield } from './heightfield.js';
import { MAX_SCENES, SCENE_SETTLED, mergeSettings, resolveSettings, toUniforms, type CameraMotion, type Settings, type SettingsInput } from './settings.js';
import { mixTheme, parseColor, resolveTheme, rgbaToCss, type RGBA, type ResolvedTheme, type ThemeColours } from './theme.js';
import { findShape } from './shapes.js';
import { VERTEX_100, VERTEX_300, wrapFragment } from './shader/common.glsl.js';
import { TOPOGRAPHIC_FRAGMENT } from './shader/topographic.glsl.js';
import { detectTier, readDeviceSignals, stepTier, tierFor, type TierId } from './quality.js';
import { createTerrainPass } from './terrain3d.js';
import { snapshotFrame, type SnapshotRegion } from './snapshot.js';
import { encodeVideo } from './video.js';
import { findLocation, loadLocation } from './locations/builtin.js';

export interface RendererOptions {
  /** Highest device pixel ratio to render at. Lines are anti-aliased in the shader, so 2 is plenty. */
  maxPixelRatio?: number;
  /** Upper bound on rendered pixels (width x height). The canvas is scaled down past this. */
  maxPixels?: number;
  /** Skip WebGL2 and use WebGL1 (mainly for testing the fallback path). */
  forceWebGL1?: boolean;
  /** Keep drawing while a 3D view is visible, so fps can be read. */
  benchmark?: boolean;
  /** The most frames to draw each second, such as 30 on a phone. Omit it, or pass 0, to draw on every display frame. */
  maxFps?: number;
  /** The GPU the WebGL context asks for. Omit it for `low-power` on a phone and `default` elsewhere. */
  powerPreference?: WebGLPowerPreference;
}

/** The options `setOptions` can change while the renderer runs. */
export type LiveRendererOptions = Pick<RendererOptions, 'maxPixelRatio' | 'maxPixels' | 'maxFps'>;

export interface UpdateOptions {
  /** Jump to the target scene and the theme's dark amount at once, instead of fading. */
  instant?: boolean;
}

/** Where a blended background is now. */
export interface BlendState {
  /** The weight of each scene, from 0 to 1, in the order of `scenes`. */
  weights: number[];
  /** 0 is the light theme and 1 the dark theme. Between, the colours are mixed. */
  dark: number;
}

export interface SnapshotOptions {
  /** Animation time in milliseconds. Defaults to the current frame. */
  frame?: number;
  /** Output size in pixels. Defaults to the live drawing size (of the region, with one); one side alone keeps the aspect ratio. */
  width?: number;
  height?: number;
  /**
   * Only this part of the view, in fractions from the top-left corner. The whole view is drawn at the size
   * that makes the region `width × height`, so the image is exactly that slice of what is on screen.
   */
  region?: SnapshotRegion;
  /** Draws the 3D view with this camera path, at its pose for `frame`: the same picture as that frame of `record`. */
  motion?: CameraMotion;
  /**
   * Drawn only into this image. The live view is put back before the call yields, so the page does not
   * flash and no second WebGL context is required.
   */
  patch?: SettingsInput;
  /** Elevation grid used only for this image. Omit to keep the live one. */
  field?: Heightfield | null;
}

export type RendererStatus = 'webgl2' | 'webgl1' | 'fallback' | 'lost' | 'destroyed';

export interface RendererStats {
  /** Animation frames per second while the view is moving. */
  fps: number;
  /** Milliseconds spent drawing one frame. */
  frameMs: number;
  /** Mesh segments along one side. 0 in 2D. */
  mesh: number;
  /** The quality tier actually drawing. `auto` has already been resolved. */
  quality: TierId;
}

export interface RecordOptions {
  /** Clip length. Defaults to 4 seconds. */
  seconds?: number;
  /** Defaults to 24. */
  fps?: number;
  width?: number;
  height?: number;
  /** Terrain time at the first frame, in milliseconds. Defaults to 0. */
  frame?: number;
  format?: 'mp4' | 'webm';
  /** Camera path for the clip. Defaults to the current path, or a slow orbit when that path is still. */
  motion?: CameraMotion;
}

export interface Topography {
  /**
   * Merges, clamps and applies new settings; only changed uniforms are sent to the GPU. With `scenes`
   * set, a new target scene and a new theme mode fade in, unless `instant` is true.
   */
  update(patch: SettingsInput, opts?: UpdateOptions): void;
  /** Changes the pixel budget or the frame rate cap while the renderer runs. Values you leave out stay. */
  setOptions(options: LiveRendererOptions): void;
  /** The scene weights and the dark amount drawn now. */
  readonly blend: BlendState;
  /** Renders one frame off-screen and returns a PNG. The live canvas is not resized. */
  snapshot(opts?: SnapshotOptions): Promise<Blob>;
  /** Renders a 3D clip with a moving camera. The live canvas is not resized. */
  record(opts?: RecordOptions): Promise<Blob>;
  /**
   * Use a real elevation grid for the contours, or null for the procedural shape. The grid stays until
   * the `location` setting changes.
   */
  setHeightfield(field: Heightfield | null): void;
  /**
   * Stops drawing while another WebGL view (a map, a snapshot batch) needs the GPU.
   * The paper colour stays. Pass false to draw again.
   */
  hold(paused: boolean): void;
  /**
   * The space page UI covers on each side of the view, in CSS pixels. The 3D picture slides (a lens
   * shift, not a camera move) so the terrain centres in the part left free. Snapshots and clips ignore
   * it and centre in their own frame. 2D is not moved. Null clears it.
   */
  setInsets(insets: Partial<ViewInsets> | null): void;
  /** The insets in use, all zero by default. */
  readonly insets: ViewInsets;
  /** The pan kept over the terrain as it is drawn now, the same limit the renderer applies. */
  clampPan(panX: number, panZ: number): [number, number];
  destroy(): void;
  readonly settings: Settings;
  readonly status: RendererStatus;
  readonly stats: RendererStats;
  /** Where the 3D camera is now, along its motion path. Azimuth 0 looks from the south, with north up. */
  readonly pose: Pose;
  readonly canvas: HTMLCanvasElement;
}

type GL = WebGLRenderingContext | WebGL2RenderingContext;
const DEFAULTS: Required<Omit<RendererOptions, 'forceWebGL1' | 'benchmark' | 'powerPreference'>> = { maxPixelRatio: 2, maxPixels: 1920 * 1080 * 2, maxFps: 0 };
/** Scene weights move toward their target by 1 - exp(-dt * rate) each frame, dt in seconds. */
const SCENE_RATE = 4.5;
/** The dark amount moves toward its target the same way, at this rate. */
const DARK_RATE = 6;
/** The longest frame step a fade takes, in seconds, so a slow frame does not jump. */
const BLEND_STEP_MAX = 0.05;

/** True while any weight or the dark amount is further than SCENE_SETTLED from its target. */
function blendMoving(state: BlendState, target: number, darkTarget: number): boolean {
  return state.weights.some((w, i) => Math.abs((i === target ? 1 : 0) - w) > SCENE_SETTLED)
    || Math.abs(darkTarget - state.dark) > SCENE_SETTLED;
}

/**
 * One frame of fading: moves weights and the dark amount toward their targets. Returns true while any
 * still moved, judged before the step, as the reference loop does: the frame that settles is drawn last.
 */
export function stepBlend(state: BlendState, target: number, darkTarget: number, dtSeconds: number): boolean {
  const moving = blendMoving(state, target, darkTarget);
  const dt = Math.min(BLEND_STEP_MAX, Math.max(0, dtSeconds));
  const k = 1 - Math.exp(-dt * SCENE_RATE);
  for (let i = 0; i < state.weights.length; i++) state.weights[i] += ((i === target ? 1 : 0) - state.weights[i]) * k;
  state.dark += (darkTarget - state.dark) * (1 - Math.exp(-dt * DARK_RATE));
  return moving;
}
const QUAD = new Float32Array([-1, -1, 3, -1, -1, 3]);
/** Uniform arrays, sent from a Float32Array, by the size of one element. Other values are single vectors. */
const ARRAY_UNIFORMS: Record<string, 1 | 4> = { uParams: 1, uSceneWeight: 1, uSceneShape: 1, uSceneInk: 4 };

export function createTopography(el: HTMLElement, input: SettingsInput = {}, options: RendererOptions = {}): Topography {
  const opts = { ...DEFAULTS, ...options };
  const doc = el.ownerDocument;
  const view = doc.defaultView ?? window;

  let settings = resolveSettings(input);
  let status: RendererStatus = 'fallback';
  let gl: GL | null = null;
  let program: WebGLProgram | null = null;
  const locations = new Map<string, WebGLUniformLocation | null>();
  const sent = new Map<string, string>();
  const terrain = createTerrainPass();
  let heightField: Heightfield | null = null;
  let heightVersion = 0;
  let heightTex: WebGLTexture | null = null;
  let uploadedVersion = -1;
  /** The location setting the drawn grid comes from, and the load of a built-in one. */
  let shownLocation: Settings['location'] = null;
  let locationLoad: Promise<void> | null = null;
  let locationToken = 0;
  let quadBuffer: WebGLBuffer | null = null;
  let statFps = 0;
  let statFrame = 0;
  let ema = 0;

  let frameMs = 0;
  /** How far the camera has gone along its path, in milliseconds at the path's own pace. A speed change keeps the pose. */
  let pathMs = 0;
  let lastNow = 0;
  let raf = 0;
  let inView = true;
  let held = false;
  let theme: ResolvedTheme;
  /** The theme in light and in dark mode, for the colours between them while the dark amount fades. */
  let lightTheme: ResolvedTheme;
  let darkTheme: ResolvedTheme;
  let col = 0.3;
  /** Scene weights and the dark amount. They start settled on their targets. */
  const blend: BlendState = { weights: [], dark: 0 };
  /** True while a weight or the dark amount has not reached its target. */
  let fading = false;
  /** When the last frame was drawn, for the frame rate cap. */
  let lastDraw = 0;
  const sceneWeights = new Float32Array(MAX_SCENES);
  const sceneShapes = new Float32Array(MAX_SCENES);
  const sceneInks = new Float32Array(MAX_SCENES * 4);
  let insets: ViewInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  let recoveryTimer = 0;
  const signals = readDeviceSignals(view);
  let tierId: TierId = detectTier(signals);
  const gaps: number[] = [];
  let sawFast = false;
  let gapTick = 0;
  const paramsBuf = new Float32Array(16);
  let heightBytes = new Uint8Array(4);

  let canvas = doc.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  el.prepend(canvas);

  const reducedMotion = view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const darkScheme = view.matchMedia?.('(prefers-color-scheme: dark)');

  const probe = doc.createElement('canvas').getContext('2d');
  const computeColor = (css: string): string | null => {
    if (!probe) return null;
    probe.fillStyle = '#010203';
    probe.fillStyle = css;
    const out = String(probe.fillStyle);
    return out === '#010203' && css.trim() !== '#010203' ? null : out;
  };
  const refreshTheme = () => {
    const cs = view.getComputedStyle(el);
    const env = { cssVar: (n: string) => cs.getPropertyValue(n), computeColor, prefersDark: !!darkScheme?.matches };
    theme = resolveTheme(settings.theme, env);
    lightTheme = resolveTheme({ ...settings.theme, mode: 'light' }, env);
    darkTheme = resolveTheme({ ...settings.theme, mode: 'dark' }, env);
    canvas.style.background = rgbaToCss(theme.paper);
    // A scene ink can name a CSS colour that depends on the page, so read it again.
    inkCache.clear();
  };
  /** The colours to draw with now: the theme, or a mix while the dark amount fades. */
  const colours = (): ThemeColours => (blend.dark === theme.dark ? theme : mixTheme(lightTheme, darkTheme, blend.dark));
  /** A scene's own ink, parsed once per colour string. */
  const inkCache = new Map<string, RGBA | null>();
  const sceneInk = (css: string): RGBA | null => {
    if (!inkCache.has(css)) {
      const parsed = parseColor(css) ?? parseColor(computeColor(css) ?? '');
      if (!parsed) console.warn(`[topographic] scene ink "${css}" is not a colour, using the theme ink`);
      inkCache.set(css, parsed);
    }
    return inkCache.get(css)!;
  };

  /** Fits the weights to the scene list. With `instant`, or with no weights yet, they jump to the target. */
  function syncBlend(instant: boolean): void {
    const n = settings.scenes.length;
    const fresh = blend.weights.length === 0;
    blend.weights.length = n;
    for (let i = 0; i < n; i++) {
      if (instant || fresh) blend.weights[i] = i === settings.scene ? 1 : 0;
      else blend.weights[i] ??= 0;
    }
    // A plain renderer switches its theme at once; only a blended background fades it.
    if (instant || n === 0) blend.dark = theme.dark;
    fading = n > 0 && blendMoving(blend, settings.scene, theme.dark);
  }

  function compile(type: number, src: string): WebGLShader | null {
    const sh = gl!.createShader(type)!;
    gl!.shaderSource(sh, src);
    gl!.compileShader(sh);
    if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS) && !gl!.isContextLost()) {
      console.error('[topographic] shader compile failed:', gl!.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  function initGL(): boolean {
    const attrs: WebGLContextAttributes = {
      alpha: true, premultipliedAlpha: false, antialias: false, depth: true, stencil: false,
      // A phone already has one full-screen context. High-performance asks iOS for a bigger GPU pool.
      powerPreference: opts.powerPreference ?? (signals.mobile ? 'low-power' : 'default'),
    };
    let webgl2 = false;
    if (!gl) {
      if (!opts.forceWebGL1) gl = canvas.getContext('webgl2', attrs);
      webgl2 = !!gl;
      if (!gl) gl = canvas.getContext('webgl', attrs);
    } else webgl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    if (!gl) return false;
    if (!webgl2 && !gl.getExtension('OES_standard_derivatives')) return false;
    const vs = compile(gl.VERTEX_SHADER, webgl2 ? VERTEX_300 : VERTEX_100);
    const fs = compile(gl.FRAGMENT_SHADER, wrapFragment(TOPOGRAPHIC_FRAGMENT, webgl2));
    if (!vs || !fs) return false;
    program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
      console.error('[topographic] program link failed:', gl.getProgramInfoLog(program));
      return false;
    }
    gl.useProgram(program);
    quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);
    locations.clear();
    sent.clear();
    setStatus(webgl2 ? 'webgl2' : 'webgl1');
    return true;
  }

  function set(name: string, value: number | ArrayLike<number>): void {
    if (!gl || !program) return;
    const key = typeof value === 'number' ? String(value) : Array.prototype.join.call(value, ',');
    if (sent.get(name) === key) return;
    sent.set(name, key);
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    const loc = locations.get(name)!;
    if (loc === null) return;
    if (typeof value === 'number') gl.uniform1f(loc, value);
    else if (value instanceof Float32Array) {
      if (ARRAY_UNIFORMS[name] === 4) gl.uniform4fv(loc, value);
      else gl.uniform1fv(loc, value);
    }
    else if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
    else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
    else gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
  }

  function setStatus(next: RendererStatus): void {
    status = next;
    canvas.dataset.gl = next;
  }

  function applySettings(): void {
    const u = toUniforms(settings, paramsBuf);
    const c = colours();
    set('uParams', u.uParams);
    set('uStyle', u.uStyle);
    set('uSeed', u.uSeed);
    set('uCenter', u.uCenter);
    set('uFade', u.uFade);
    set('uDark', c.dark);
    set('uInk', c.ink);
    set('uPaper', c.paper);
    const n = settings.scenes.length;
    set('uSceneCount', n);
    if (n === 0) return;
    for (let i = 0; i < n; i++) {
      const scene = settings.scenes[i];
      const ink = (scene.ink ? sceneInk(scene.ink) : null) ?? c.ink;
      sceneWeights[i] = blend.weights[i];
      sceneShapes[i] = findShape(scene.shape)!.index;
      sceneInks.set(ink, i * 4);
    }
    set('uSceneWeight', sceneWeights);
    set('uSceneShape', sceneShapes);
    set('uSceneInk', sceneInks);
  }

  let cssW = 0, cssH = 0;
  function resize(): void {
    const rect = el.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    const tier = tierFor(settings.quality, signals, tierId);
    let ratio = Math.min(view.devicePixelRatio || 1, opts.maxPixelRatio, tier.maxPixelRatio);
    const budget = Math.sqrt(Math.min(opts.maxPixels, tier.maxPixels) / (cssW * cssH * ratio * ratio));
    if (budget < 1) ratio *= budget;
    const bw = Math.max(1, Math.round(cssW * ratio));
    const bh = Math.max(1, Math.round(cssH * ratio));
    // Assigning canvas width drops the drawing buffer and allocates a new one.
    // iOS does not reliably free the previous buffer, so a dock resize that
    // reports the same size must not touch it.
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    draw();
  }

  function uploadHeight(): void {
    if (!gl || (heightTex && uploadedVersion === heightVersion)) return;
    if (!heightTex) heightTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, heightTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    if (!heightField) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    } else {
      const { samples, size } = heightField;
      const need = samples.length * 4;
      if (heightBytes.length !== need) heightBytes = new Uint8Array(need);
      for (let i = 0; i < samples.length; i++) {
        // 16 bits across R (high byte) and G (low byte): 8 bits leave staircase contours on flat ground.
        const v = Math.round(Math.min(1, Math.max(0, samples[i])) * 65535);
        const p = i * 4;
        heightBytes[p] = v >> 8; heightBytes[p + 1] = v & 255; heightBytes[p + 2] = 0; heightBytes[p + 3] = 255;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, heightBytes);
    }
    gl.activeTexture(gl.TEXTURE0);
    uploadedVersion = heightVersion;
  }

  function bindHeightSampler(): void {
    if (!gl || !program) return;
    uploadHeight();
    if (!locations.has('uHeightTex')) locations.set('uHeightTex', gl.getUniformLocation(program, 'uHeightTex'));
    const sampler = locations.get('uHeightTex');
    if (sampler) gl.uniform1i(sampler, 1);
  }

  function paint2d(w: number, h: number): void {
    if (!gl || !program) return;
    gl.useProgram(program);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
    gl.disableVertexAttribArray(3);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    set('uRes', [w, h]);
    set('uTime', frameMs / 1000);
    col = columnOf();
    set('uCol', col);
    set('uHasHeight', heightField ? 1 : 0);
    set('uHeightAspect', heightField?.aspect || 1);
    set('uView', [settings.view2d.x, settings.view2d.y, settings.view2d.zoom]);
    applySettings();
    bindHeightSampler();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** The faded centre column's half-width, as a fraction of the view height. */
  function columnOf(): number {
    return Math.min(settings.column, cssW / 2) / cssH;
  }

  /** The pose with its pan kept over the terrain drawn at this aspect ratio. */
  function framed(pose: Pose, aspect: number): Pose {
    const half = terrainHalfSize(aspect, settings.extent, heightField ? heightField.aspect : null);
    const [panX, panZ] = clampPan(pose.panX ?? 0, pose.panZ ?? 0, half);
    return { ...pose, panX, panZ };
  }

  /** Draws a frame. `live` frames take the lens shift for the page's insets; exports centre in their own frame. */
  function paint(w = canvas.width, h = canvas.height, pose?: Pose, force3d = false, live = true): void {
    if (!gl || !program || gl.isContextLost() || status === 'lost' || status === 'destroyed' || held) return;
    gl.viewport(0, 0, w, h);
    const three = force3d || settings.mode === '3d';
    if (three) {
      uploadHeight();
      const aspect = w / Math.max(1, h);
      const at = framed(pose ?? pathPose(settings.camera, pathMs / 1000), aspect);
      // Centre the block itself, then move it into the part of the page the UI leaves free. Endless
      // terrain is framed by the same block-sized middle, so switching the extent keeps the framing.
      const block = terrainHalfSize(aspect, 'block', heightField ? heightField.aspect : null);
      const [sx, sy] = live ? viewShift(insets, cssW, cssH) : [0, 0];
      terrain.draw(gl, status === 'webgl2', {
        width: w, height: h, settings, theme: colours(), frameMs, col: columnOf(),
        pose: at,
        field: heightField,
        heightVersion,
        shift: [sx, sy + blockLift(at, aspect, block)],
        meshCap: tierFor(settings.quality, signals, tierId).meshCap,
      });
      if (terrain.ok) return;
    }
    paint2d(w, h);
  }

  function draw(w = canvas.width, h = canvas.height, pose?: Pose, force3d = false): void {
    paint(w, h, pose, force3d);
  }

  const shouldAnimate = () => {
    if (held || (status !== 'webgl2' && status !== 'webgl1') || !inView || doc.visibilityState === 'hidden') return false;
    // A fade runs to its end even with reduced motion; the terrain itself holds still.
    if (fading) return true;
    if (reducedMotion?.matches) return false;
    if (opts.benchmark && settings.mode === '3d') return true;
    if (settings.motion.speed > 0) return true;
    return settings.mode === '3d' && settings.camera.motion !== 'still';
  };

  function tick(now: number): void {
    raf = 0;
    // iOS can drop the drawing buffer without a context-lost event. The canvas goes black and the
    // process may follow. Treat a zero buffer like a loss so the page rebuilds it.
    if ((status === 'webgl2' || status === 'webgl1') && gl && canvas.width > 0 && (gl.isContextLost() || gl.drawingBufferWidth === 0)) {
      setStatus('lost');
      lastNow = 0;
      scheduleRecovery();
      return;
    }
    // The frame rate cap skips display frames; the next drawn frame takes the whole step.
    if (opts.maxFps > 0 && now - lastDraw < 1000 / opts.maxFps - 2) { schedule(); return; }
    lastDraw = now;
    const dt = lastNow ? Math.min(100, Math.max(0, now - lastNow)) : 0;
    lastNow = now;
    if (dt > 0) {
      ema = ema ? ema * 0.88 + dt * 0.12 : dt;
      statFrame = ema;
      statFps = 1000 / ema;
      if (dt < 12) sawFast = true;
      gaps.push(dt);
      if (gaps.length > 30) gaps.shift();
      gapTick++;
      if (settings.quality === 'auto' && gapTick % 24 === 0) {
        const next = stepTier(tierId, gaps, sawFast);
        if (next !== tierId) { tierId = next; gaps.length = 0; resize(); }
      }
    }
    // Like the fade's own loop, the weights keep closing in on the target after they have settled.
    if (settings.scenes.length) fading = stepBlend(blend, settings.scene, theme.dark, dt / 1000);
    // A blended background takes the fade's 50 ms step for time too, so a slow frame keeps the same pace.
    if (!reducedMotion?.matches) frameMs += settings.scenes.length ? Math.min(dt, BLEND_STEP_MAX * 1000) : dt;
    if (settings.mode === '3d') pathMs += dt * settings.camera.speed;
    draw();
    schedule();
  }
  function schedule(): void {
    if (!shouldAnimate()) { if (raf) view.cancelAnimationFrame(raf); raf = 0; lastNow = 0; return; }
    if (!raf) raf = view.requestAnimationFrame(tick);
  }
  const restart = () => { schedule(); draw(); };

  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  const intersection = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([entry]) => { inView = entry?.isIntersecting ?? true; schedule(); }) : null;
  const onSchemeChange = () => { refreshTheme(); syncBlend(false); draw(); schedule(); };
  function dropGpu(): void {
    if (gl && !gl.isContextLost()) {
      if (program) gl.deleteProgram(program);
      if (quadBuffer) gl.deleteBuffer(quadBuffer);
      if (heightTex) gl.deleteTexture(heightTex);
    }
    // dispose clears the terrain pass even when the context is already lost.
    if (gl) terrain.dispose(gl);
    program = null;
    quadBuffer = null;
    heightTex = null;
    uploadedVersion = -1;
    locations.clear();
    sent.clear();
  }

  /** Builds shaders again on the current context, after a loss or a fresh canvas. */
  function rebuildGpu(): boolean {
    dropGpu();
    if (!gl || gl.isContextLost()) return false;
    if (!initGL()) { setStatus('fallback'); return false; }
    resize();
    schedule();
    return true;
  }

  function listen(target: HTMLCanvasElement): void {
    target.addEventListener('webglcontextlost', onLost);
    target.addEventListener('webglcontextrestored', onRestored);
  }

  /**
   * iOS often never fires webglcontextrestored after a memory loss, and the canvas stays blank.
   * If the context is still lost shortly after, throw the canvas away and make a new one.
   */
  function scheduleRecovery(): void {
    view.clearTimeout(recoveryTimer);
    recoveryTimer = view.setTimeout(() => {
      if (status !== 'lost') return;
      const old = canvas;
      old.removeEventListener('webglcontextlost', onLost);
      old.removeEventListener('webglcontextrestored', onRestored);
      dropGpu();
      try { gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* already gone */ }
      gl = null;
      const next = doc.createElement('canvas');
      next.setAttribute('aria-hidden', 'true');
      next.style.cssText = old.style.cssText;
      next.style.background = old.style.background;
      old.replaceWith(next);
      canvas = next;
      listen(next);
      if (!initGL()) { setStatus('fallback'); return; }
      resize();
      schedule();
    }, 700);
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    if (status === 'destroyed') return;
    setStatus('lost');
    if (raf) view.cancelAnimationFrame(raf);
    raf = 0;
    lastNow = 0;
    scheduleRecovery();
  };
  const onRestored = () => {
    if (status === 'destroyed') return;
    view.clearTimeout(recoveryTimer);
    if (!rebuildGpu()) scheduleRecovery();
  };

  refreshTheme();
  if (!initGL()) {
    setStatus('fallback');
    console.warn('[topographic] WebGL unavailable, showing the paper colour');
  }
  listen(canvas);
  doc.addEventListener('visibilitychange', schedule);
  reducedMotion?.addEventListener?.('change', restart);
  darkScheme?.addEventListener?.('change', onSchemeChange);
  resizeObserver?.observe(el);
  intersection?.observe(el);
  /** Draws a w×h frame off-screen and reads back `rect` (bottom-up GL coordinates), or all of it. */
  function readback(w: number, h: number, pixels: Uint8Array, pose?: Pose, force3d = false, rect = { x: 0, y: 0, width: w, height: h }): void {
    if (!gl) return;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    const fbo = gl.createFramebuffer();
    const depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    try {
      paint(w, h, pose, force3d, false);
      gl.readPixels(rect.x, rect.y, rect.width, rect.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    } finally {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      gl.deleteFramebuffer(fbo);
      gl.deleteRenderbuffer(depth);
      gl.deleteTexture(tex);
    }
  }

  function showField(field: Heightfield | null): void {
    heightField = field;
    heightVersion += 1;
    draw();
    schedule();
  }

  /** Follows the location setting: a grid shows at once, a built-in id loads its own file first. */
  function syncLocation(): void {
    const next = settings.location;
    if (next === shownLocation) return;
    shownLocation = next;
    const token = ++locationToken;
    locationLoad = null;
    if (next === null || typeof next !== 'string') { showField(next); return; }
    // Flat ground draws only the paper while the grid loads, rather than the generated terrain.
    showField({ samples: new Float32Array(4), size: 2, aspect: findLocation(next)?.aspect ?? 1 });
    locationLoad = loadLocation(next).then(
      (field) => { if (token === locationToken && status !== 'destroyed') showField(field); },
      (error: unknown) => {
        if (token !== locationToken || status === 'destroyed') return;
        console.warn(`[topographic] location "${next}" could not be loaded`, error);
        showField(null);
      },
    ).finally(() => { if (token === locationToken) locationLoad = null; });
  }

  syncBlend(true);
  resize();
  schedule();
  syncLocation();

  return {
    get settings() { return settings; },
    get status() { return status; },
    get pose() { return framed(pathPose(settings.camera, pathMs / 1000), cssW / Math.max(1, cssH)); },
    get insets() { return { ...insets }; },
    clampPan(panX, panZ) {
      const p = framed({ azimuth: 0, elevation: 0, radius: 0, panX, panZ }, cssW / Math.max(1, cssH));
      return [p.panX ?? 0, p.panZ ?? 0];
    },
    get canvas() { return canvas; },
    get blend() { return { weights: [...blend.weights], dark: blend.dark }; },
    get stats() {
      return {
        fps: Math.round(statFps),
        frameMs: Number(statFrame.toFixed(2)),
        mesh: settings.mode === '3d' ? terrain.mesh : 0,
        quality: tierFor(settings.quality, signals, tierId).id,
      };
    },
    update(patch, o = {}) {
      if (status === 'destroyed') return;
      settings = mergeSettings(settings, patch);
      if (patch.theme) refreshTheme();
      syncBlend(Boolean(o.instant));
      if (patch.quality !== undefined) resize();
      else draw();
      schedule();
      syncLocation();
    },
    setOptions(next) {
      if (status === 'destroyed') return;
      // A ratio or pixel count must be above 0; a frame cap of 0 means no cap.
      for (const key of ['maxPixelRatio', 'maxPixels', 'maxFps'] as const) {
        const v = next[key];
        if (typeof v === 'number' && !Number.isNaN(v) && (v > 0 || (key === 'maxFps' && v === 0))) opts[key] = v;
      }
      resize();
      schedule();
    },
    setHeightfield(field) {
      if (status === 'destroyed') return;
      // A built-in location still loading must not replace this grid when it arrives.
      locationToken += 1;
      locationLoad = null;
      showField(field);
    },
    hold(paused) {
      if (status === 'destroyed' || held === paused) return;
      held = paused;
      if (paused) {
        if (raf) view.cancelAnimationFrame(raf);
        raf = 0;
        lastNow = 0;
        return;
      }
      draw();
      schedule();
    },
    setInsets(next) {
      if (status === 'destroyed') return;
      const side = (v: number | undefined) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : 0);
      const n = { top: side(next?.top), right: side(next?.right), bottom: side(next?.bottom), left: side(next?.left) };
      if (n.top === insets.top && n.right === insets.right && n.bottom === insets.bottom && n.left === insets.left) return;
      insets = n;
      if (settings.mode === '3d') draw();
    },
    async snapshot(o = {}) {
      if (locationLoad) await locationLoad;
      if (!gl || !program || (status !== 'webgl2' && status !== 'webgl1')) throw new Error('[topographic] snapshot needs WebGL');
      const f = snapshotFrame(canvas.width, canvas.height, o);
      const w = f.width;
      const h = f.height;
      const max = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
      if (w < 1 || h < 1 || f.frameWidth > max || f.frameHeight > max) throw new Error(`[topographic] snapshot size must be 1..${max}px`);
      const savedFrame = frameMs;
      const savedSettings = settings;
      const savedField = heightField;
      const savedVersion = heightVersion;
      const savedBlend = { weights: [...blend.weights], dark: blend.dark };
      if (o.frame !== undefined) frameMs = o.frame;
      // A patched image draws its own settings settled: its scene in full and its theme's colours.
      if (o.patch) { settings = mergeSettings(settings, o.patch); refreshTheme(); syncBlend(true); }
      if (o.field !== undefined) { heightField = o.field; heightVersion += 1; }
      const pose = o.motion ? cameraPose({ ...settings.camera, motion: o.motion }, frameMs / 1000)
        : o.frame !== undefined ? cameraPose(settings.camera, o.frame / 1000) : undefined;
      const pixels = new Uint8Array(w * h * 4);
      const rect = { x: f.x, y: f.frameHeight - f.y - h, width: w, height: h };
      try { readback(f.frameWidth, f.frameHeight, pixels, pose, Boolean(o.motion), rect); }
      finally {
        frameMs = savedFrame;
        settings = savedSettings;
        if (o.patch) { refreshTheme(); blend.weights = savedBlend.weights; blend.dark = savedBlend.dark; syncBlend(false); }
        if (o.field !== undefined) { heightField = savedField; heightVersion = savedVersion; uploadedVersion = -1; }
        draw();
      }
      // GL rows run bottom-up; flip into an ImageData
      const out = doc.createElement('canvas');
      out.width = w; out.height = h;
      const ctx = out.getContext('2d')!;
      const img = ctx.createImageData(w, h);
      const row = w * 4;
      for (let y = 0; y < h; y++) img.data.set(pixels.subarray((h - 1 - y) * row, (h - y) * row), y * row);
      ctx.putImageData(img, 0, 0);
      return new Promise<Blob>((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error('[topographic] PNG encoding failed'))), 'image/png'));
    },
    async record(o = {}) {
      if (locationLoad) await locationLoad;
      if (!gl || !program || (status !== 'webgl2' && status !== 'webgl1')) throw new Error('[topographic] video needs WebGL');
      const fps = Math.min(60, Math.max(1, Math.round(o.fps ?? 24)));
      const seconds = Math.min(12, Math.max(0.5, o.seconds ?? 4));
      const frames = Math.max(1, Math.round(seconds * fps));
      const aspect = canvas.width / Math.max(1, canvas.height);
      let w = Math.round(o.width ?? (o.height ? o.height * aspect : 960));
      let h = Math.round(o.height ?? (o.width ? o.width / aspect : Math.round(960 / aspect)));
      if (o.width === undefined && o.height === undefined) { w = 960; h = 540; }
      w -= w % 2; h -= h % 2;
      const max = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
      if (w < 2 || h < 2 || w > max || h > max) throw new Error(`[topographic] video size must be 2..${max}px`);
      const motion = o.motion ?? (settings.camera.motion === 'still' ? 'orbit' : settings.camera.motion);
      // The camera's own path keeps its speed; any other path runs at its own pace.
      const camera = { ...settings.camera, motion, speed: motion === settings.camera.motion ? settings.camera.speed : 1 };
      const saved = frameMs;
      const start = o.frame ?? 0;
      const surface = doc.createElement('canvas');
      surface.width = w; surface.height = h;
      const ctx = surface.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('[topographic] video export needs a 2D canvas');
      const pixels = new Uint8Array(w * h * 4);
      const img = ctx.createImageData(w, h);
      const row = w * 4;
      try {
        return await encodeVideo({
          format: o.format ?? 'mp4', width: w, height: h, fps, frames, canvas: surface,
          renderFrame: (i) => {
            const t = i / fps;
            frameMs = start + t * 1000;
            readback(w, h, pixels, cameraPose(camera, t), true);
            for (let y = 0; y < h; y++) img.data.set(pixels.subarray((h - 1 - y) * row, (h - y) * row), y * row);
            ctx.putImageData(img, 0, 0);
          },
        });
      } finally {
        frameMs = saved;
        draw();
        schedule();
      }
    },
    destroy() {
      if (status === 'destroyed') return;
      setStatus('destroyed');
      view.clearTimeout(recoveryTimer);
      if (raf) view.cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      intersection?.disconnect();
      doc.removeEventListener('visibilitychange', schedule);
      reducedMotion?.removeEventListener?.('change', restart);
      darkScheme?.removeEventListener?.('change', onSchemeChange);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (gl) terrain.dispose(gl);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      gl = null; program = null;
      canvas.remove();
    },
  };
}
