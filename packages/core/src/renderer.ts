import { mergeSettings, resolveSettings, toUniforms, type Settings, type SettingsInput } from './settings.js';
import { resolveTheme, rgbaToCss, type ResolvedTheme } from './theme.js';
import { VERTEX_100, VERTEX_300, wrapFragment } from './shader/common.glsl.js';
import { TOPOGRAPHY_FRAGMENT } from './shader/topography.glsl.js';

export interface RendererOptions {
  /** Highest device pixel ratio to render at. Lines are anti-aliased in the shader, so 2 is plenty. */
  maxPixelRatio?: number;
  /** Upper bound on rendered pixels (width x height). The canvas is scaled down past this. */
  maxPixels?: number;
  /** Skip WebGL2 and use WebGL1 (mainly for testing the fallback path). */
  forceWebGL1?: boolean;
}

export interface SnapshotOptions {
  /** Animation time in milliseconds. Defaults to the current frame. */
  frame?: number;
  /** Output size in pixels. Defaults to the live drawing size; one side alone keeps the aspect ratio. */
  width?: number;
  height?: number;
}

export type RendererStatus = 'webgl2' | 'webgl1' | 'fallback' | 'lost' | 'destroyed';

export interface Topography {
  /** Merges, clamps and applies new settings; only changed uniforms are sent to the GPU. */
  update(patch: SettingsInput): void;
  /** Renders one frame off-screen and returns a PNG. The live canvas is not resized. */
  snapshot(opts?: SnapshotOptions): Promise<Blob>;
  destroy(): void;
  readonly settings: Settings;
  readonly status: RendererStatus;
  readonly canvas: HTMLCanvasElement;
}

type GL = WebGLRenderingContext | WebGL2RenderingContext;
const DEFAULTS: Required<Omit<RendererOptions, 'forceWebGL1'>> = { maxPixelRatio: 2, maxPixels: 1920 * 1080 * 2 };
const QUAD = new Float32Array([-1, -1, 3, -1, -1, 3]);

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
      console.error('[topography] shader compile failed:', gl!.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  function initGL(): boolean {
    const attrs: WebGLContextAttributes = { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false };
    let webgl2 = false;
    if (!gl) {
      if (!opts.forceWebGL1) gl = canvas.getContext('webgl2', attrs);
      webgl2 = !!gl;
      if (!gl) gl = canvas.getContext('webgl', attrs);
    } else webgl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
    if (!gl) return false;
    if (!webgl2 && !gl.getExtension('OES_standard_derivatives')) return false;
    const vs = compile(gl.VERTEX_SHADER, webgl2 ? VERTEX_300 : VERTEX_100);
    const fs = compile(gl.FRAGMENT_SHADER, wrapFragment(TOPOGRAPHY_FRAGMENT, webgl2));
    if (!vs || !fs) return false;
    program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
      console.error('[topography] program link failed:', gl.getProgramInfoLog(program));
      return false;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
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
    col = Math.min(300, cssW / 2) / cssH;
    draw();
  }

  function draw(w = canvas.width, h = canvas.height): void {
    if (!gl || !program || status === 'lost' || status === 'destroyed') return;
    gl.viewport(0, 0, w, h);
    set('uRes', [w, h]);
    set('uTime', frameMs / 1000);
    set('uCol', col);
    applySettings();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const shouldAnimate = () =>
    (status === 'webgl2' || status === 'webgl1') && settings.motion.speed > 0 && inView && doc.visibilityState !== 'hidden' && !reducedMotion?.matches;

  function tick(now: number): void {
    raf = 0;
    const dt = Math.min(100, now - lastNow);
    lastNow = now;
    frameMs += dt;
    draw();
    schedule();
  }
  function schedule(): void {
    if (!shouldAnimate()) { if (raf) view.cancelAnimationFrame(raf); raf = 0; return; }
    if (!raf) { lastNow = performance.now(); raf = view.requestAnimationFrame(tick); }
  }
  const restart = () => { schedule(); draw(); };

  const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  const intersection = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver(([entry]) => { inView = entry?.isIntersecting ?? true; schedule(); }) : null;
  const onSchemeChange = () => { refreshTheme(); draw(); };
  const onLost = (e: Event) => { e.preventDefault(); status = 'lost'; schedule(); };
  const onRestored = () => { program = null; if (initGL()) { resize(); schedule(); } else status = 'fallback'; };

  refreshTheme();
  if (!initGL()) {
    status = 'fallback';
    console.warn('[topography] WebGL unavailable, showing the paper colour');
  }
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  doc.addEventListener('visibilitychange', schedule);
  reducedMotion?.addEventListener?.('change', restart);
  darkScheme?.addEventListener?.('change', onSchemeChange);
  resizeObserver?.observe(el);
  intersection?.observe(el);
  resize();
  schedule();

  return {
    get settings() { return settings; },
    get status() { return status; },
    canvas,
    update(patch) {
      if (status === 'destroyed') return;
      settings = mergeSettings(settings, patch);
      if (patch.theme) refreshTheme();
      draw();
      schedule();
    },
    async snapshot(o = {}) {
      if (!gl || !program || (status !== 'webgl2' && status !== 'webgl1')) throw new Error('[topography] snapshot needs WebGL');
      const aspect = canvas.width / canvas.height;
      const w = Math.round(o.width ?? (o.height ? o.height * aspect : canvas.width));
      const h = Math.round(o.height ?? (o.width ? o.width / aspect : canvas.height));
      const max = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
      if (w < 1 || h < 1 || w > max || h > max) throw new Error(`[topography] snapshot size must be 1..${max}px`);
      const savedFrame = frameMs;
      if (o.frame !== undefined) frameMs = o.frame;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      const pixels = new Uint8Array(w * h * 4);
      try {
        draw(w, h);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      } finally {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(fbo);
        gl.deleteTexture(tex);
        frameMs = savedFrame;
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
      return new Promise<Blob>((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error('[topography] PNG encoding failed'))), 'image/png'));
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
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      gl = null; program = null;
      canvas.remove();
    },
  };
}
