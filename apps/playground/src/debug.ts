/**
 * Playground heartbeat. This module is imported only when a build sets
 * `VITE_TOPOGRAPHIC_DEBUG=1`. A normal build does not include it.
 *
 * It records errors, context loss, how many WebGL contexts are alive, canvas size and memory.
 * Batches go to `./__debug`. A host with no such path drops them, and the page keeps running.
 */

type Line = Record<string, unknown>;

const lines: Line[] = [];
let contexts = 0;
let peakContexts = 0;
let gpuBytes = 0;
let peakGpu = 0;
let started = false;

function noteGpu(n: number): void {
  gpuBytes += n;
  if (gpuBytes > peakGpu) peakGpu = gpuBytes;
}

function track(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
  contexts += 1;
  if (contexts > peakContexts) peakContexts = contexts;
  const tex = gl.texImage2D.bind(gl);
  gl.texImage2D = function (this: WebGLRenderingContext, ...args: never[]) {
    const w = typeof args[3] === 'number' ? args[3] as number : 0;
    const h = typeof args[4] === 'number' ? args[4] as number : 0;
    if (w > 0 && h > 0) noteGpu(w * h * 4);
    return (tex as (...a: never[]) => void).apply(this, args);
  } as typeof gl.texImage2D;
  const buf = gl.bufferData.bind(gl);
  gl.bufferData = ((target: number, data: BufferSource | number, usage: number) => {
    const n = typeof data === 'number' ? data : (data?.byteLength ?? 0);
    noteGpu(n);
    return buf(target, data as ArrayBufferView, usage);
  }) as typeof gl.bufferData;
  const rb = gl.renderbufferStorage.bind(gl);
  gl.renderbufferStorage = ((target: number, format: number, w: number, h: number) => {
    noteGpu(w * h * 4);
    return rb(target, format, w, h);
  }) as typeof gl.renderbufferStorage;
  gl.canvas.addEventListener('webglcontextlost', () => {
    contexts = Math.max(0, contexts - 1);
    push({ kind: 'webglcontextlost', contexts });
  });
  gl.canvas.addEventListener('webglcontextrestored', () => {
    contexts += 1;
    push({ kind: 'webglcontextrestored', contexts });
  });
}

function canvases() {
  return [...document.querySelectorAll('canvas')].map((c) => ({
    w: c.width, h: c.height, css: [Math.round(c.clientWidth), Math.round(c.clientHeight)],
  }));
}

function push(line: Line): void {
  const row = { t: Date.now(), ...line };
  lines.push(row);
  const box = document.getElementById('pt-debug');
  if (!box) return;
  const p = document.createElement('p');
  p.textContent = JSON.stringify(row);
  box.append(p);
  while (box.childElementCount > 8) box.firstElementChild?.remove();
}

function flush(): void {
  if (!lines.length) return;
  const body = lines.splice(0, lines.length).map((l) => JSON.stringify(l)).join('\n');
  const url = new URL('./__debug', location.href).href;
  try {
    if (!navigator.sendBeacon(url, body)) void fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch { /* a static host has no endpoint */ }
}

function beat(): void {
  const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  const backing = canvases().reduce((n, c) => n + c.w * c.h * 6, 0);
  push({
    kind: 'beat',
    contexts, peakContexts, gpuBytes, peakGpu,
    backing,
    heap: mem?.usedJSHeapSize ?? null,
    dpr: devicePixelRatio,
    tier: document.documentElement.dataset.tier ?? '',
    region: document.documentElement.dataset.region ?? '',
    visibility: document.visibilityState,
    canvases: canvases(),
  });
  flush();
}

/** Starts the heartbeat. Call this only from a debug build. */
export function installDebug(): void {
  if (started) return;
  started = true;
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, attrs?: unknown) {
    const gl = orig.call(this, type, attrs as CanvasRenderingContext2DSettings);
    if (gl && String(type).startsWith('webgl')) track(gl as WebGLRenderingContext);
    return gl;
  } as typeof orig;

  window.addEventListener('error', (e) => push({ kind: 'error', msg: e.message }));
  window.addEventListener('unhandledrejection', (e) => push({ kind: 'rejection', msg: String(e.reason) }));
  const wrap = (level: 'error' | 'warn') => {
    const prev = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      push({ kind: level, msg: args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ').slice(0, 400) });
      prev(...args);
    };
  };
  wrap('error');
  wrap('warn');
  document.addEventListener('visibilitychange', () => push({ kind: 'visibility', state: document.visibilityState }));
  window.addEventListener('pagehide', () => { push({ kind: 'pagehide' }); flush(); });

  const box = document.createElement('div');
  box.id = 'pt-debug';
  box.setAttribute('aria-hidden', 'true');
  Object.assign(box.style, {
    position: 'fixed', zIndex: '80', left: '8px', top: '8px', maxWidth: '70vw', maxHeight: '40vh', overflow: 'hidden',
    padding: '6px 8px', borderRadius: '10px', background: 'rgba(0,0,0,.72)', color: '#fff',
    font: '10px/1.35 ui-monospace,monospace', pointerEvents: 'none', whiteSpace: 'pre-wrap',
  });
  document.body.append(box);
  push({ kind: 'debug', href: location.href });
  window.setInterval(beat, 500);
}
