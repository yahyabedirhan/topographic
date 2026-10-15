import { cameraPose, type Pose } from './camera.js';
import type { Heightfield } from './heightfield.js';
import { mergeSettings, resolveSettings, toUniforms, type CameraMotion, type Settings, type SettingsInput } from './settings.js';
import { resolveTheme, rgbaToCss, type ResolvedTheme } from './theme.js';
import { VERTEX_100, VERTEX_300, wrapFragment } from './shader/common.glsl.js';
import { TOPOGRAPHIC_FRAGMENT } from './shader/topographic.glsl.js';
import { createTerrainPass } from './terrain3d.js';
import { snapshotFrame, type SnapshotRegion } from './snapshot.js';
import { encodeVideo } from './video.js';

export interface RendererOptions {
  /** Highest device pixel ratio to render at. Lines are anti-aliased in the shader, so 2 is plenty. */
  maxPixelRatio?: number;
  /** Upper bound on rendered pixels (width x height). The canvas is scaled down past this. */
  maxPixels?: number;
  /** Skip WebGL2 and use WebGL1 (mainly for testing the fallback path). */
  forceWebGL1?: boolean;
  /** Keep drawing while a 3D view is visible, so fps can be read. */
  benchmark?: boolean;
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
}

export type RendererStatus = 'webgl2' | 'webgl1' | 'fallback' | 'lost' | 'destroyed';

export interface RendererStats {
  /** Animation frames per second while the view is moving. */
  fps: number;
  /** Milliseconds spent drawing one frame. */
  frameMs: number;
  /** Mesh segments along one side. 0 in 2D. */
  mesh: number;
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

export interface TopographicBackground {
  /** Merges, clamps and applies new settings; only changed uniforms are sent to the GPU. */
  update(patch: SettingsInput): void;
  /** Renders one frame off-screen and returns a PNG. The live canvas is not resized. */
  snapshot(opts?: SnapshotOptions): Promise<Blob>;
  /** Renders a 3D clip with a moving camera. The live canvas is not resized. */
  record(opts?: RecordOptions): Promise<Blob>;
  /** Use a real elevation grid for the contours, or null for the procedural style. */
  setHeightfield(field: Heightfield | null): void;
  destroy(): void;
  readonly settings: Settings;
  readonly status: RendererStatus;
  readonly stats: RendererStats;
  /** Where the 3D camera is now, along its motion path. Azimuth 0 looks from the south, with north up. */
  readonly pose: Pose;
  readonly canvas: HTMLCanvasElement;
}

type GL = WebGLRenderingContext | WebGL2RenderingContext;
const DEFAULTS: Required<Omit<RendererOptions, 'forceWebGL1' | 'benchmark'>> = { maxPixelRatio: 2, maxPixels: 1920 * 1080 * 2 };
const TEXT_COLUMN_HALF_WIDTH_PX = 300;
const QUAD = new Float32Array([-1, -1, 3, -1, -1, 3]);

export function createTopographicBackground(el: HTMLElement, input: SettingsInput = {}, options: RendererOptions = {}): TopographicBackground {
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
  let quadBuffer: WebGLBuffer | null = null;
  let statFps = 0;
  let statFrame = 0;
  let statDraw = 0;
  let lastSample = 0;
  let ema = 0;

  let frameMs = 0;
  let lastNow = 0;
  let raf = 0;
  let inView = true;
  let theme: ResolvedTheme;
  let col = 0.3;

  const canvas = doc.createElement('canvas');
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
    theme = resolveTheme(settings.theme, { cssVar: (n) => cs.getPropertyValue(n), computeColor, prefersDark: !!darkScheme?.matches });
    canvas.style.background = rgbaToCss(theme.paper);
  };

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
    const attrs: WebGLContextAttributes = { alpha: true, premultipliedAlpha: false, antialias: false, depth: true, stencil: false };
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
    status = webgl2 ? 'webgl2' : 'webgl1';
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
    else if (name === 'uParams') gl.uniform1fv(loc, value as Float32Array);
    else if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
    else gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
  }

  function applySettings(): void {
    const u = toUniforms(settings);
    set('uParams', u.uParams);
    set('uStyle', u.uStyle);
    set('uSeed', u.uSeed);
    set('uCenter', u.uCenter);
    set('uFade', u.uFade);
    set('uDark', theme.dark);
    set('uInk', theme.ink);
    set('uPaper', theme.paper);
  }

  let cssW = 0, cssH = 0;
  function resize(): void {
    const rect = el.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    let ratio = Math.min(view.devicePixelRatio || 1, opts.maxPixelRatio);
    const budget = Math.sqrt(opts.maxPixels / (cssW * cssH * ratio * ratio));
    if (budget < 1) ratio *= budget;
    canvas.width = Math.max(1, Math.round(cssW * ratio));
    canvas.height = Math.max(1, Math.round(cssH * ratio));
    col = Math.min(TEXT_COLUMN_HALF_WIDTH_PX, cssW / 2) / cssH;
    draw();
    sampleDraw();
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
      const rgba = new Uint8Array(samples.length * 4);
      for (let i = 0; i < samples.length; i++) {
        // 16 bits across R (high byte) and G (low byte): 8 bits leave staircase contours on flat ground.
        const v = Math.round(Math.min(1, Math.max(0, samples[i])) * 65535);
        const p = i * 4;
        rgba[p] = v >> 8; rgba[p + 1] = v & 255; rgba[p + 2] = 0; rgba[p + 3] = 255;
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
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
    set('uCol', col);
    set('uHasHeight', heightField ? 1 : 0);
    set('uHeightAspect', heightField?.aspect || 1);
    applySettings();
    bindHeightSampler();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function paint(w = canvas.width, h = canvas.height, pose?: Pose, force3d = false): void {
    if (!gl || !program || status === 'lost' || status === 'destroyed') return;
    gl.viewport(0, 0, w, h);
    const three = force3d || settings.mode === '3d';
    if (three) {
      uploadHeight();
      terrain.draw(gl, status === 'webgl2', {
        width: w, height: h, settings, theme, frameMs, col,
        pose: pose ?? cameraPose(settings.camera, frameMs / 1000),
        field: heightField,
        heightVersion,
      });
      if (terrain.ok) return;
    }
    paint2d(w, h);
  }

  function draw(w = canvas.width, h = canvas.height, pose?: Pose, force3d = false): void {
    paint(w, h, pose, force3d);
  }

  function sampleDraw(): void {
    if (!gl || settings.mode !== '3d' || !terrain.ok) return;
    const now = performance.now();
    if (now - lastSample < 700 && statDraw > 0) return;
    lastSample = now;
    gl.finish();
    const t = performance.now();
    for (let i = 0; i < 4; i++) paint();
    gl.finish();
    statDraw = Math.max(0, (performance.now() - t) / 4);
    if (!shouldAnimate()) {
      statFrame = statDraw;
      statFps = statDraw > 0 ? 1000 / statDraw : 0;
    }
  }

  const shouldAnimate = () => {
    if ((status !== 'webgl2' && status !== 'webgl1') || !inView || doc.visibilityState === 'hidden' || reducedMotion?.matches) return false;
    if (opts.benchmark && settings.mode === '3d') return true;
    if (settings.motion.speed > 0) return true;
    return settings.mode === '3d' && settings.camera.motion !== 'still';
  };

  function tick(now: number): void {
    raf = 0;
    const dt = lastNow ? Math.min(100, Math.max(0, now - lastNow)) : 0;
    lastNow = now;
    if (dt > 0) {
      ema = ema ? ema * 0.88 + dt * 0.12 : dt;
      statFrame = ema;
      statFps = 1000 / ema;
    }
    frameMs += dt;
    draw();
    schedule();
  }
  function schedule(): void {
    if (!shouldAnimate()) { if (raf) view.cancelAnimationFrame(raf); raf = 0; lastNow = 0; return; }
    if (!raf) raf = view.requestAnimationFrame(tick);
  }
  const restart = () => { schedule(); draw(); sampleDraw(); };

  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  const intersection = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([entry]) => { inView = entry?.isIntersecting ?? true; schedule(); }) : null;
  const onSchemeChange = () => { refreshTheme(); draw(); };
  const onLost = (e: Event) => { e.preventDefault(); status = 'lost'; schedule(); };
  const onRestored = () => {
    program = null;
    heightTex = null;
    uploadedVersion = -1;
    if (gl) terrain.dispose(gl);
    if (initGL()) { resize(); schedule(); } else status = 'fallback';
  };

  refreshTheme();
  if (!initGL()) {
    status = 'fallback';
    console.warn('[topographic] WebGL unavailable, showing the paper colour');
  }
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
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
      paint(w, h, pose, force3d);
      gl.readPixels(rect.x, rect.y, rect.width, rect.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    } finally {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      gl.deleteFramebuffer(fbo);
      gl.deleteRenderbuffer(depth);
      gl.deleteTexture(tex);
    }
  }

  resize();
  schedule();

  return {
    get settings() { return settings; },
    get status() { return status; },
    get pose() { return cameraPose(settings.camera, frameMs / 1000); },
    canvas,
    get stats() {
      return {
        fps: Math.round(statFps),
        frameMs: Number((shouldAnimate() ? statFrame : (statDraw > 0 ? statDraw : statFrame)).toFixed(2)),
        mesh: settings.mode === '3d' ? terrain.mesh : 0,
      };
    },
    update(patch) {
      if (status === 'destroyed') return;
      settings = mergeSettings(settings, patch);
      if (patch.theme) refreshTheme();
      draw();
      sampleDraw();
      schedule();
    },
    setHeightfield(field) {
      if (status === 'destroyed') return;
      heightField = field;
      heightVersion += 1;
      draw();
      sampleDraw();
      schedule();
    },
    async snapshot(o = {}) {
      if (!gl || !program || (status !== 'webgl2' && status !== 'webgl1')) throw new Error('[topographic] snapshot needs WebGL');
      const f = snapshotFrame(canvas.width, canvas.height, o);
      const w = f.width;
      const h = f.height;
      const max = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
      if (w < 1 || h < 1 || f.frameWidth > max || f.frameHeight > max) throw new Error(`[topographic] snapshot size must be 1..${max}px`);
      const savedFrame = frameMs;
      if (o.frame !== undefined) frameMs = o.frame;
      const pose = o.motion ? cameraPose({ ...settings.camera, motion: o.motion }, frameMs / 1000) : undefined;
      const pixels = new Uint8Array(w * h * 4);
      const rect = { x: f.x, y: f.frameHeight - f.y - h, width: w, height: h };
      try { readback(f.frameWidth, f.frameHeight, pixels, pose, Boolean(o.motion), rect); }
      finally { frameMs = savedFrame; draw(); }
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
            readback(w, h, pixels, cameraPose({ ...settings.camera, motion }, t), true);
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
      status = 'destroyed';
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
