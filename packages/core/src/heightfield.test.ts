import { describe, expect, it } from 'vitest';
import { sampleGrid, type Heightfield } from './heightfield.js';

describe('sampleGrid', () => {
  it('reads corners and blends the middle', () => {
    const field: Heightfield = {
      size: 2,
      aspect: 1,
      samples: new Float32Array([0, 1, 0.4, 0.8]),
    };
    expect(sampleGrid(field, 0, 0)).toBeCloseTo(0, 5);
    expect(sampleGrid(field, 1, 0)).toBeCloseTo(1, 5);
    expect(sampleGrid(field, 1, 1)).toBeCloseTo(0.8, 5);
    expect(sampleGrid(field, 0.5, 0.5)).toBeCloseTo((0 + 1 + 0.4 + 0.8) / 4, 5);
  });
});