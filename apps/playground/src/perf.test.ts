import { describe, expect, it } from 'vitest';
import { createLowFpsWatch } from './perf';

/** Feeds one sample every 500 ms from `start` and returns the time of the first true, or null. */
function firstFire(watch: ReturnType<typeof createLowFpsWatch>, samples: [fps: number, paused: boolean][], start = 0): number | null {
  for (const [i, [fps, paused]] of samples.entries()) {
    const now = start + i * 500;
    if (watch.sample(now, fps, paused)) return now;
  }
  return null;
}

const run = (n: number, fps: number, paused = false) => Array.from({ length: n }, () => [fps, paused] as [number, boolean]);

describe('low fps watch', () => {
  it('fires after the warmup once the rate stays below 30 for the hold', () => {
    expect(firstFire(createLowFpsWatch(), run(40, 20))).toBe(10_000);
  });

  it('does not fire at 30 fps or above', () => {
    expect(firstFire(createLowFpsWatch(), run(60, 30))).toBeNull();
  });

  it('starts the hold again after one good sample', () => {
    expect(firstFire(createLowFpsWatch(), [...run(16, 20), [45, false], ...run(30, 20)])).toBe(13_500);
  });

  it('starts the warmup again after a pause, such as a hidden tab or a place loading', () => {
    expect(firstFire(createLowFpsWatch(), [...run(16, 20), [20, true], ...run(30, 20)])).toBe(18_500);
  });

  it('ignores samples with no frames yet', () => {
    expect(firstFire(createLowFpsWatch(), [...run(10, 0), ...run(30, 20)])).toBe(15_000);
  });
});
