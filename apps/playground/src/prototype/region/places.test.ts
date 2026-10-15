import { describe, expect, it } from 'vitest';
import { DEFAULT_ELEVATION } from 'topographic';
import { limitProblem } from './pipeline';
import { PLACES, REGION_ELEVATION, configSetsElevation, nextRegionElevation } from './places';

describe('example cities', () => {
  it('offers Istanbul, San Francisco, London and New York', () => {
    expect(PLACES.map((place) => place.id)).toEqual(['istanbul', 'san-francisco', 'london', 'new-york']);
    for (const place of PLACES) expect(limitProblem(place.bbox)).toBeNull();
  });
});

describe('region elevation', () => {
  it('drops the procedural default when a place opens', () => {
    expect(nextRegionElevation(true, false, DEFAULT_ELEVATION, false)).toBe(REGION_ELEVATION);
    expect(REGION_ELEVATION).toBe(0.1);
  });

  it('keeps an elevation the page or the slider already chose', () => {
    expect(nextRegionElevation(true, false, DEFAULT_ELEVATION, true)).toBeNull();
    expect(nextRegionElevation(true, false, 0.2, false)).toBeNull();
    expect(nextRegionElevation(false, false, REGION_ELEVATION, false)).toBeNull();
  });

  it('restores the procedural default when the place is cleared from the city height', () => {
    expect(nextRegionElevation(false, true, REGION_ELEVATION, false)).toBe(DEFAULT_ELEVATION);
    expect(nextRegionElevation(false, true, 0.2, false)).toBeNull();
  });

  it('reads an explicit elevation from the config query', () => {
    expect(configSetsElevation('?config=%7B%22elevation%22%3A0.62%7D')).toBe(true);
    expect(configSetsElevation('?config=%7B%22style%22%3A%22dunes%22%7D')).toBe(false);
    expect(configSetsElevation('')).toBe(false);
  });
});
