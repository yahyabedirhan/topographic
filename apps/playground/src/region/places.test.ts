import { describe, expect, it } from 'vitest';
import { limitProblem } from './pipeline';
import { PLACES } from './places';

describe('example cities', () => {
  it('offers Istanbul, San Francisco, London and New York', () => {
    expect(PLACES.map((place) => place.id)).toEqual(['istanbul', 'san-francisco', 'london', 'new-york']);
    for (const place of PLACES) expect(limitProblem(place.bbox)).toBeNull();
  });
});
