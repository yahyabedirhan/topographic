import { describe, expect, it } from 'vitest';
import { PLACES } from './places';
import { regionQuery, regionUpdate, type RegionToolState } from './tools';

const empty: RegionToolState = { bbox: null, placeId: null, relief: 'dramatic', smooth: 'medium' };

describe('region tool input', () => {
  it('accepts a named place', () => {
    const next = regionUpdate({ place: 'istanbul' }, empty);
    expect(next).toMatchObject({ placeId: 'istanbul', bbox: PLACES[1].bbox, relief: 'dramatic' });
  });

  it('accepts edges, a bbox array and a region string', () => {
    const edges = regionUpdate({ west: 7.64, south: 45.95, east: 7.78, north: 46.04 }, empty);
    const array = regionUpdate({ bbox: [7.64, 45.95, 7.78, 46.04] }, empty);
    const text = regionUpdate({ region: '7.64,45.95,7.78,46.04', relief: 'measured', smooth: 'light' }, empty);
    expect(edges).toMatchObject({ placeId: null, bbox: { west: 7.64, north: 46.04 } });
    expect(array).toEqual(edges);
    expect(text).toMatchObject({ relief: 'measured', smooth: 'light', placeId: null });
  });

  it('keeps the current place when only the relief changes', () => {
    const current: RegionToolState = { bbox: PLACES[2].bbox, placeId: 'chicago', relief: 'dramatic', smooth: 'medium' };
    expect(regionUpdate({ relief: 'measured' }, current)).toMatchObject({ placeId: 'chicago', relief: 'measured', bbox: PLACES[2].bbox });
  });

  it('lets an explicit bbox replace a named place', () => {
    const next = regionUpdate({ place: 'istanbul', west: 7.64, south: 45.95, east: 7.78, north: 46.04 }, empty);
    expect(next).toMatchObject({ placeId: null, bbox: { west: 7.64 } });
  });

  it('rejects an unknown place, a sliver and a bad relief', () => {
    expect(regionUpdate({ place: 'paris' }, empty)).toMatch(/Unknown place/);
    expect(regionUpdate({ west: 29, south: 41, east: 29.004, north: 41.004 }, empty)).toMatch(/Too small/);
    expect(regionUpdate({ relief: 'huge' }, empty)).toMatch(/relief must be/);
    expect(regionUpdate({}, empty)).toMatch(/Give a place/);
  });

  it('omits the default relief and smoothing from the query', () => {
    expect(regionQuery({ bbox: PLACES[0].bbox, placeId: 'zermatt', relief: 'dramatic', smooth: 'medium' }))
      .toBe('region=7.64%2C45.95%2C7.78%2C46.04&place=zermatt');
    expect(regionQuery({ bbox: PLACES[2].bbox, placeId: 'chicago', relief: 'measured', smooth: 'strong' }))
      .toContain('relief=measured');
  });
});
