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
    const q = new URLSearchParams('region=28.94,40.99,29.07,41.08&relief=measured&smooth=strong&place=istanbul');
    expect(readRegion(`?${q}`)).toEqual({ bbox: { west: 28.94, south: 40.99, east: 29.07, north: 41.08 }, place: 'istanbul' });
    writeRegion(q, readRegion(`?${q}`));
    expect(q.toString()).toBe('place=istanbul');
  });

  it('reads a named place without a box and writes only its name', () => {
    const istanbul = { west: 28.94, south: 40.99, east: 29.07, north: 41.08 };
    expect(readRegion('?place=istanbul').bbox).toEqual(istanbul);
    const q = new URLSearchParams('lc=40');
    writeRegion(q, { bbox: istanbul, place: 'istanbul' });
    expect(q.toString()).toBe('lc=40&place=istanbul');
    writeRegion(q, { bbox: { ...istanbul, west: 28.9 }, place: 'istanbul' });
    expect(q.get('region')).toBe('28.9,40.99,29.07,41.08');
  });
});
