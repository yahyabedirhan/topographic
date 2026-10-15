import { describe, expect, it } from 'vitest';
import { formatBBox, parseBBox, readRegion } from './url';

describe('region url', () => {
  it('reads a comma bbox and a json bbox', () => {
    expect(parseBBox('7.64,45.95,7.78,46.04')).toEqual({ west: 7.64, south: 45.95, east: 7.78, north: 46.04 });
    expect(parseBBox('{"bbox":[1,2,3,4]}')).toEqual({ west: 1, south: 2, east: 3, north: 4 });
    expect(parseBBox('{"west":1,"south":2,"east":3,"north":4}')).toEqual({ west: 1, south: 2, east: 3, north: 4 });
    expect(parseBBox('nope')).toBeNull();
    expect(parseBBox('{')).toBeNull();
  });

  it('keeps dramatic and medium out of the query', () => {
    const q = new URLSearchParams('region=7.6,45.9,7.8,46&relief=measured&smooth=strong&place=zermatt');
    expect(readRegion(`?${q}`)).toMatchObject({ relief: 'measured', smooth: 'strong', place: 'zermatt' });
    expect(formatBBox({ west: 7.6, south: 45.9, east: 7.8, north: 46 })).toBe('7.6,45.9,7.8,46');
  });
});