/** Coarse device facts shared by the performance sample and error tags. No identifiers. */

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
