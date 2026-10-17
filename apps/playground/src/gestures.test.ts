import { describe, expect, it } from 'vitest';
import { pan2d, twoFingerKind, wheelZoom, zoom2d } from './gestures';

describe('2D gestures', () => {
  const half = [2, 2] as const;

  it('moves the ground with the pointer, less at a closer zoom', () => {
    expect(pan2d({ x: 0, y: 0, zoom: 1 }, 90, 45, 900, half)).toEqual({ x: -0.1, y: 0.05, zoom: 1 });
    expect(pan2d({ x: 0, y: 0, zoom: 2 }, 90, 45, 900, half)).toEqual({ x: -0.05, y: 0.025, zoom: 2 });
  });

  it('keeps the centre over the terrain', () => {
    expect(pan2d({ x: 0, y: 0, zoom: 1 }, -9000, 9000, 900, [0.8, 0.5])).toEqual({ x: 0.8, y: 0.5, zoom: 1 });
  });

  it('keeps the ground under the pointer while zooming', () => {
    const from = { x: 0.1, y: -0.2, zoom: 1 };
    const next = zoom2d(from, 2, 300, -150, 900, half);
    // The field point under (300, -150) px, y down on screen and up in the field.
    const under = (v: typeof from) => [v.x + 300 / (900 * v.zoom), v.y - -150 / (900 * v.zoom)];
    expect(under(next)[0]).toBeCloseTo(under(from)[0], 2);
    expect(under(next)[1]).toBeCloseTo(under(from)[1], 2);
  });

  it('clamps the zoom between the whole view and eight times closer', () => {
    expect(zoom2d({ x: 0, y: 0, zoom: 1 }, 0.5, 0, 0, 900, half).zoom).toBe(1);
    expect(zoom2d({ x: 0, y: 0, zoom: 6 }, 20, 0, 0, 900, half).zoom).toBe(8);
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
