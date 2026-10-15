import { describe, expect, it } from 'vitest';
import { PLACES } from './places';
import { regionQuery, regionUpdate } from './tools';

describe('region tool input', () => {
  it('accepts a named place', () => {
    expect(regionUpdate({ place: 'istanbul' })).toEqual({ placeId: 'istanbul', bbox: PLACES[0].bbox });
  });

  it('accepts edges, a bbox array and a region string', () => {
    const edges = regionUpdate({ west: 28.94, south: 40.99, east: 29.07, north: 41.08 });
    const array = regionUpdate({ bbox: [28.94, 40.99, 29.07, 41.08] });
    const text = regionUpdate({ region: '28.94,40.99,29.07,41.08' });
    expect(edges).toMatchObject({ placeId: null, bbox: { west: 28.94, north: 41.08 } });
    expect(array).toEqual(edges);
    expect(text).toEqual(edges);
  });

  it('lets an explicit bbox replace a named place', () => {
    const next = regionUpdate({ place: 'istanbul', west: -0.22, south: 51.48, east: -0.06, north: 51.57 });
    expect(next).toMatchObject({ placeId: null, bbox: { west: -0.22 } });
  });

  it('rejects an unknown place, a sliver and an empty input', () => {
    expect(regionUpdate({ place: 'paris' })).toMatch(/Unknown place/);
    expect(regionUpdate({ west: 29, south: 41, east: 29.004, north: 41.004 })).toMatch(/Too small/);
    expect(regionUpdate({})).toMatch(/Give a place/);
  });

  it('writes a named place by name and a box by its edges', () => {
    expect(regionQuery({ bbox: PLACES[0].bbox, placeId: 'istanbul' })).toBe('place=istanbul');
    expect(regionQuery({ bbox: PLACES[0].bbox, placeId: null })).toBe('region=28.45,40.78,29.65,41.36');
  });
});
