import { describe, expect, it } from 'vitest';
import { PLACES } from './places';
import { regionQuery, regionUpdate, type RegionToolState } from './tools';

const empty: RegionToolState = { bbox: null, placeId: null, relief: 'dramatic', smooth: 'medium' };

describe('region tool input', () => {
  it('accepts a named place', () => {
    const next = regionUpdate({ place: 'istanbul' }, empty);
    expect(next).toMatchObject({ placeId: 'istanbul', bbox: PLACES[0].bbox, relief: 'dramatic' });
  });

  it('accepts edges, a bbox array and a region string', () => {
    const edges = regionUpdate({ west: 28.94, south: 40.99, east: 29.07, north: 41.08 }, empty);
    const array = regionUpdate({ bbox: [28.94, 40.99, 29.07, 41.08] }, empty);
    const text = regionUpdate({ region: '28.94,40.99,29.07,41.08', relief: 'measured', smooth: 'light' }, empty);
    expect(edges).toMatchObject({ placeId: null, bbox: { west: 28.94, north: 41.08 } });
    expect(array).toEqual(edges);
    expect(text).toMatchObject({ relief: 'measured', smooth: 'light', placeId: null });
  });

  it('keeps the current place when only the relief changes', () => {
    const current: RegionToolState = { bbox: PLACES[2].bbox, placeId: 'london', relief: 'dramatic', smooth: 'medium' };
    expect(regionUpdate({ relief: 'measured' }, current)).toMatchObject({ placeId: 'london', relief: 'measured', bbox: PLACES[2].bbox });
  });

  it('lets an explicit bbox replace a named place', () => {
    const next = regionUpdate({ place: 'istanbul', west: -0.22, south: 51.48, east: -0.06, north: 51.57 }, empty);
    expect(next).toMatchObject({ placeId: null, bbox: { west: -0.22 } });
  });

  it('rejects an unknown place, a sliver and a bad relief', () => {
    expect(regionUpdate({ place: 'paris' }, empty)).toMatch(/Unknown place/);
    expect(regionUpdate({ west: 29, south: 41, east: 29.004, north: 41.004 }, empty)).toMatch(/Too small/);
    expect(regionUpdate({ relief: 'huge' }, empty)).toMatch(/relief must be/);
    expect(regionUpdate({}, empty)).toMatch(/Give a place/);
  });

  it('omits the default relief and smoothing from the query', () => {
    expect(regionQuery({ bbox: PLACES[0].bbox, placeId: 'istanbul', relief: 'dramatic', smooth: 'medium' }))
      .toBe('region=28.94%2C40.99%2C29.07%2C41.08&place=istanbul');
    expect(regionQuery({ bbox: PLACES[2].bbox, placeId: 'london', relief: 'measured', smooth: 'strong' }))
      .toContain('relief=measured');
  });
});
