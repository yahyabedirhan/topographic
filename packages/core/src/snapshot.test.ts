import { describe, expect, it } from 'vitest';
import { snapshotFrame } from './snapshot.js';

describe('snapshotFrame', () => {
  it('draws the output size without a region', () => {
    expect(snapshotFrame(2560, 1600, { width: 1920, height: 1080 })).toEqual({ frameWidth: 1920, frameHeight: 1080, x: 0, y: 0, width: 1920, height: 1080 });
    expect(snapshotFrame(2560, 1600, { width: 1280 })).toMatchObject({ width: 1280, height: 800 });
    expect(snapshotFrame(2560, 1600)).toMatchObject({ width: 2560, height: 1600 });
  });

  it('draws the whole frame larger and reads back the region', () => {
    // A phone-shaped slice of a 16:10 view: the full height, 0.289 of the width, at the right edge.
    const share = (1600 * 1170 / 2532) / 2560;
    const f = snapshotFrame(2560, 1600, { width: 1170, height: 2532, region: { x: 1 - share, y: 0, width: share, height: 1 } });
    expect(f.width).toBe(1170);
    expect(f.height).toBe(2532);
    expect(f.frameHeight).toBe(2532);
    expect(Math.abs(f.frameWidth / f.frameHeight - 1.6)).toBeLessThan(0.002);
    expect(f.x).toBe(f.frameWidth - 1170);
    expect(f.y).toBe(0);
  });

  it('keeps the region shape when one side is given', () => {
    const f = snapshotFrame(1000, 500, { width: 300, region: { x: 0.25, y: 0, width: 0.5, height: 1 } });
    expect(f).toMatchObject({ width: 300, height: 300, frameWidth: 600, frameHeight: 300, x: 150, y: 0 });
  });

  it('rejects a region outside the frame', () => {
    expect(() => snapshotFrame(100, 100, { region: { x: 0.6, y: 0, width: 0.5, height: 1 } })).toThrow(/region/);
    expect(() => snapshotFrame(100, 100, { region: { x: 0, y: 0, width: 0, height: 1 } })).toThrow(/region/);
  });
});
