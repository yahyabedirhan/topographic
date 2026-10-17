import { track, type PerformanceSample } from './analytics';
import { browserName, frameHealth, gpuName, isMobile, noteFirstFrame, osFamily, qualityTier } from './device';

const fpsSamples: number[] = [];

/** Called by the readout each time it reads the renderer stats. Keeps a bounded list. */
export function noteFps(fps: number): void {
  if (fps > 0) noteFirstFrame();
  if (fps > 0 && fpsSamples.length < 200) fpsSamples.push(fps);
}

/** The value at fraction `q` of the sorted list, or null when it is empty. */
export function quantile(values: number[], q: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

/** The display refresh rate from one second of animation frames, snapped to a common value. */
function measureRefresh(): Promise<number | null> {
  return new Promise((resolve) => {
    const gaps: number[] = [];
    let last = 0;
    const step = (t: number) => {
      if (last) gaps.push(t - last);
      last = t;
      if (gaps.length < 60) requestAnimationFrame(step);
      else {
        const gap = quantile(gaps, 0.5);
        if (!gap) { resolve(null); return; }
        const hz = 1000 / gap;
        resolve([30, 60, 75, 90, 120, 144, 165, 240].reduce((a, b) => (Math.abs(b - hz) < Math.abs(a - hz) ? b : a)));
      }
    };
    requestAnimationFrame(step);
    window.setTimeout(() => resolve(null), 3000);
  });
}

/** Sends one performance sample about 20 s into the visit, unless the tab was hidden by then. */
export function schedulePerformanceSample(delay = 20_000): void {
  let hidden = document.visibilityState === 'hidden';
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') hidden = true; });
  window.setTimeout(async () => {
    if (hidden) return;
    const refresh = await measureRefresh();
    if (hidden) return;
    const sample: PerformanceSample = {
      fps_median: quantile(fpsSamples, 0.5),
      fps_p10: quantile(fpsSamples, 0.1),
      refresh_hz: refresh,
      quality_tier: qualityTier(),
      viewport: `${innerWidth}x${innerHeight}`,
      dpr: Math.round(devicePixelRatio * 100) / 100,
      gpu: gpuName(),
      device_memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
      browser: browserName(),
      platform: isMobile() ? 'mobile' : 'desktop',
      os: osFamily(),
      ...frameHealth(),
      view_mode: document.querySelector('.pt-mode[aria-pressed="true"]') ? '3d' : '2d',
    };
    track('performance_sample', sample);
  }, delay);
}
