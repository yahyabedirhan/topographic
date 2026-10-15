import { describe, expect, it } from 'vitest';
import { clampTowards, containRect, fitRect, MIN_FRAME_PX, resizeRect, screenAspect } from './frame';
import { PLACES } from './places';

const bounds = { left: 8, top: 8, right: 552, bottom: 324 };

describe('map frame', () => {
  it('draws a city box at about 1.5:1 on the Mercator map', () => {
    for (const place of PLACES) expect(screenAspect(place.bbox)).toBeCloseTo(1.55, 1);
  });

  it('fits a shape into an area, centred', () => {
    const r = fitRect({ left: 0, top: 0, right: 300, bottom: 100 }, 2);
    expect(r).toEqual({ left: 50, right: 250, top: 0, bottom: 100 });
  });

  it('moves only the edges a handle holds, inside the bounds and above the minimum', () => {
    const start = { left: 100, top: 100, right: 300, bottom: 200 };
    expect(resizeRect(start, 'se', 20, 10, bounds)).toEqual({ left: 100, top: 100, right: 320, bottom: 210 });
    expect(resizeRect(start, 'w', -500, 0, bounds).left).toBe(8);
    expect(resizeRect(start, 'n', 0, 500, bounds).top).toBe(200 - MIN_FRAME_PX);
  });

  it('keeps a rectangle inside the bounds', () => {
    expect(containRect({ left: 500, top: 0, right: 600, bottom: 50 }, bounds)).toEqual({ left: 452, top: 8, right: 552, bottom: 58 });
  });

  it('stops at the last rectangle that passes the limit', () => {
    const valid = { left: 0, top: 0, right: 100, bottom: 100 };
    const next = { left: 0, top: 0, right: 500, bottom: 100 };
    const out = clampTowards(valid, next, (r) => (r.right - r.left) / (r.bottom - r.top) <= 3);
    expect(out.right).toBeGreaterThan(299);
    expect(out.right).toBeLessThanOrEqual(300);
  });
});
