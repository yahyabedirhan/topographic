import { describe, expect, it } from 'vitest';
import { cropRegion } from './png';

describe('cropRegion', () => {
  it('is null for the window shape and for the screen size', () => {
    expect(cropRegion(1.6, 2560, 1600)).toBeNull();
    expect(cropRegion(1.6, 0, 0)).toBeNull();
  });

  it('cuts a phone from a wide view along x, centred by default', () => {
    const r = cropRegion(1.6, 1170, 2532)!;
    expect(r.height).toBe(1);
    expect(r.width).toBeCloseTo((1170 / 2532) / 1.6, 6);
    expect(r.x).toBeCloseTo((1 - r.width) / 2, 6);
    expect(cropRegion(1.6, 1170, 2532, 1)!.x + r.width).toBeCloseTo(1, 6);
    expect(cropRegion(1.6, 1170, 2532, 0)!.x).toBe(0);
  });

  it('cuts 16:9 from a 16:10 view along y', () => {
    const r = cropRegion(1.6, 1920, 1080, 0)!;
    expect(r).toMatchObject({ x: 0, y: 0, width: 1 });
    expect(r.height).toBeCloseTo(0.9, 6);
  });
});
