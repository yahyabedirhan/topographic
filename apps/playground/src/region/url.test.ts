import { describe, expect, it } from 'vitest';
import { formatBBox, parseBBox, readRegion, writeRegion } from './url';

describe('region url', () => {
  it('reads a comma bbox and a json bbox', () => {
    expect(parseBBox('7.64,45.95,7.78,46.04')).toEqual({ west: 7.64, south: 45.95, east: 7.78, north: 46.04 });
    expect(parseBBox('{"bbox":[1,2,3,4]}')).toEqual({ west: 1, south: 2, east: 3, north: 4 });
    expect(parseBBox('{"west":1,"south":2,"east":3,"north":4}')).toEqual({ west: 1, south: 2, east: 3, north: 4 });
    expect(parseBBox('nope')).toBeNull();
    expect(parseBBox('{')).toBeNull();
  });

  it('formats a box and drops the old relief and smooth keys', () => {
    expect(formatBBox({ west: 7.6, south: 45.9, east: 7.8, north: 46 })).toBe('7.6,45.9,7.8,46');
    const q = new URLSearchParams('region=28.45,40.78,29.65,41.36&relief=measured&smooth=strong&place=istanbul');
    expect(readRegion(`?${q}`)).toEqual({ bbox: { west: 28.45, south: 40.78, east: 29.65, north: 41.36 }, place: 'istanbul' });
    writeRegion(q, readRegion(`?${q}`));
    expect(q.toString()).toBe('place=istanbul');
  });

  it('reads a named place without a box and writes only its name', () => {
    const istanbul = { west: 28.45, south: 40.78, east: 29.65, north: 41.36 };
    expect(readRegion('?place=istanbul').bbox).toEqual(istanbul);
    const q = new URLSearchParams('lc=40');
    writeRegion(q, { bbox: istanbul, place: 'istanbul' });
    expect(q.toString()).toBe('lc=40&place=istanbul');
    writeRegion(q, { bbox: { ...istanbul, west: 28.5 }, place: 'istanbul' });
    expect(q.get('region')).toBe('28.5,40.78,29.65,41.36');
  });

  it('opens a bare URL on Istanbul, and a URL with settings and no region on the generated terrain', () => {
    const istanbul = { bbox: { west: 28.45, south: 40.78, east: 29.65, north: 41.36 }, place: 'istanbul' };
    expect(readRegion('')).toEqual(istanbul);
    expect(readRegion('?analytics_agent=claude&analytics_purpose=testing')).toEqual(istanbul);
    expect(readRegion('?s=dunes')).toEqual({ bbox: null, place: null });
  });
});
