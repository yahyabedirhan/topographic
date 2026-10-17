import { describe, expect, it } from 'vitest';
import { pan2d, twoFingerKind, wheelZoom, zoom2d } from './gestures';

describe('2D gestures', () => {
  it('moves the ground with the pointer, less at a closer zoom', () => {
    expect(pan2d({ panX: 0, panZ: 0, zoom: 1 }, 100, 50, 900)).toEqual({ panX: -0.1, panZ: -0.05 });
    expect(pan2d({ panX: 0, panZ: 0, zoom: 2 }, 100, 50, 900)).toEqual({ panX: -0.05, panZ: -0.025 });
  });

  it('keeps the ground under the pointer while zooming', () => {
    const from = { panX: 0.1, panZ: -0.2, zoom: 1 };
    const next = zoom2d(from, 2, 300, -150, 900);
    // The field point under (300, -150) px, before and after.
    const under = (v: typeof from) => [v.panX / 0.9 + 300 / (900 * v.zoom), -v.panZ / 0.9 - -150 / (900 * v.zoom)];
    expect(under(next)[0]).toBeCloseTo(under(from)[0], 2);
    expect(under(next)[1]).toBeCloseTo(under(from)[1], 2);
  });

  it('clamps the zoom between the whole view and eight times closer', () => {
    expect(zoom2d({ panX: 0, panZ: 0, zoom: 1 }, 0.5).zoom).toBe(1);
    expect(zoom2d({ panX: 0, panZ: 0, zoom: 6 }, 20).zoom).toBe(8);
  });

  it('tells a two finger tilt from a pinch', () => {
    expect(twoFingerKind(2, 3, 1.01)).toBeNull();
    expect(twoFingerKind(3, -40, 1.02)).toBe('tilt');
    expect(twoFingerKind(30, -40, 1.02)).toBe('pinch');
    expect(twoFingerKind(0, -40, 1.4)).toBe('pinch');
  });

  it('zooms in on a scroll up and harder on a pinch', () => {
    expect(wheelZoom(-10, 0, false)).toBeGreaterThan(1);
    expect(wheelZoom(10, 0, false)).toBeLessThan(1);
    expect(wheelZoom(-10, 0, true)).toBeGreaterThan(wheelZoom(-10, 0, false));
  });
});
