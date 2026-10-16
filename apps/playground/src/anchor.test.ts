import { describe, expect, it } from 'vitest';
import { anchorFromDrag } from './anchor';

describe('anchorFromDrag', () => {
  it('moves the summit with the pointer and stays inside 0..1', () => {
    expect(anchorFromDrag(0, 0, 400)).toBe(0);
    expect(anchorFromDrag(0, -210, 400)).toBe(1);
    expect(anchorFromDrag(1, 210, 400)).toBe(0);
    expect(anchorFromDrag(0.5, -40, 400)).toBeCloseTo(0.69);
    expect(anchorFromDrag(0.2, 500, 400)).toBe(0);
    expect(anchorFromDrag(0.8, -500, 400)).toBe(1);
  });
});
