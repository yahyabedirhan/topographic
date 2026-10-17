/** Coarse device facts shared by the performance sample and error tags. No identifiers. */
import type { SuperProperties } from './analytics';

let gpuCache: string | null | undefined;

/**
 * The unmasked GPU renderer string, read from a canvas that already holds a WebGL context.
 * It never creates a context of its own, since a phone can have only a few alive.
 */
export function gpuName(): string | null {
  if (gpuCache) return gpuCache;
  for (const canvas of document.querySelectorAll('canvas')) {
    // getContext returns the existing context for a matching type and null for any other.
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) continue;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
    if (name) return (gpuCache = name.slice(0, 120));
  }
  gpuCache = undefined;
  return null;
}

/** Browser family and whether it runs on a phone or tablet. Not the full user agent. */
export function browserName(ua = navigator.userAgent): string {
  const mobile = /Mobi|iPhone|iPad|Android/.test(ua) ? ' mobile' : '';
  const name = /Edg\//.test(ua) ? 'edge'
    : /Firefox\/|FxiOS/.test(ua) ? 'firefox'
      : /CriOS|Chrome\//.test(ua) ? 'chrome'
        : /Safari\//.test(ua) ? 'safari' : 'other';
  return name + mobile;
}

/** The quality tier the renderer settled on, written by the readout. */
export function qualityTier(): string | null {
  return document.documentElement.dataset.tier || null;
}

/** Operating system family from the user agent. Never a version. */
export function osFamily(ua = navigator.userAgent): string {
  return /iPhone|iPad|iPod/.test(ua) ? 'ios'
    : /Android/.test(ua) ? 'android'
      : /Windows/.test(ua) ? 'windows'
        : /Mac OS X|Macintosh/.test(ua) ? 'macos'
          : /CrOS/.test(ua) ? 'chromeos'
            : /Linux/.test(ua) ? 'linux' : 'other';
}

export function isMobile(ua = navigator.userAgent): boolean {
  return /Mobi|iPhone|iPad|Android/.test(ua);
}

export function viewportClass(width = innerWidth): 'phone' | 'tablet' | 'desktop' {
  return width <= 720 ? 'phone' : width <= 1100 ? 'tablet' : 'desktop';
}

let initialMode: '2d' | '3d' = '2d';
/** Called once with the view mode the page opened in. */
export function noteInitialMode(mode: '2d' | '3d'): void { initialMode = mode; }

/** The super properties registered once after PostHog starts. */
export function superProperties(): SuperProperties {
  const mobile = isMobile();
  return {
    site: 'topographic',
    app: 'topographic',
    app_version: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev',
    viewport_class: viewportClass(),
    is_mobile: mobile,
    platform: mobile ? 'mobile' : 'desktop',
    os: osFamily(),
    initial_view_mode: initialMode,
  };
}

// ---------------------------------------------------------------- Frame health, for the performance sample

let contextLosses = 0;
let longFrames: number | null = null;
let firstFrameMs: number | null = null;

/** Counts lost WebGL contexts and long animation frames from page start. Cheap: no per-frame work. */
export function watchFrameHealth(): void {
  addEventListener('webglcontextlost', () => { contextLosses += 1; }, true);
  try {
    const types = PerformanceObserver.supportedEntryTypes ?? [];
    const type = types.includes('long-animation-frame') ? 'long-animation-frame' : types.includes('longtask') ? 'longtask' : null;
    if (!type) return;
    longFrames = 0;
    new PerformanceObserver((list) => { longFrames = (longFrames ?? 0) + list.getEntries().length; }).observe({ type, buffered: true });
  } catch { longFrames = null; }
}

/** Called by the readout the first time the renderer reports a frame rate. */
export function noteFirstFrame(): void {
  if (firstFrameMs === null) firstFrameMs = Math.round(performance.now());
}

export function frameHealth() {
  return { context_losses: contextLosses, long_frames: longFrames, first_frame_ms: firstFrameMs };
}
