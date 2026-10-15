import { describe, expect, it } from 'vitest';
import { limitProblem, spanOf } from './pipeline';
import { MAP_TERRAIN_DEFAULTS, PLACES, sameBox } from './places';

describe('example cities', () => {
  it('offers Istanbul, San Francisco, London and New York', () => {
    expect(PLACES.map((place) => place.id)).toEqual(['istanbul', 'san-francisco', 'london', 'new-york']);
    for (const place of PLACES) expect(limitProblem(place.bbox)).toBeNull();
  });

  it('frames each whole metro area: 70 to 105 km wide, about 1.5:1', () => {
    for (const place of PLACES) {
      const span = spanOf(place.bbox);
      expect(span.widthM).toBeGreaterThan(70_000);
      expect(span.widthM).toBeLessThan(105_000);
      expect(span.widthM / span.heightM).toBeCloseTo(1.55, 1);
    }
    expect(PLACES[0].bbox).toEqual({ west: 28.45, south: 40.78, east: 29.65, north: 41.36 });
  });

  it('compares boxes to about ten metres', () => {
    const box = PLACES[0].bbox;
    expect(sameBox(box, { ...box, west: box.west + 0.00005 })).toBe(true);
    expect(sameBox(box, { ...box, west: box.west + 0.001 })).toBe(false);
  });

  it('gives map terrains their own 3D view and lines', () => {
    expect(MAP_TERRAIN_DEFAULTS).toEqual({
      mode: '3d',
      extent: 'block',
      elevation: 0.12,
      lines: { count: 36, width: 0, opacity: 0.9, indexEvery: 4 },
      camera: { azimuth: 341.8, elevation: 39.3, radius: 1.32 },
    });
  });
});
