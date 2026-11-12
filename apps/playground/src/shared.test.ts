import { describe, expect, it, vi } from 'vitest';
import { resolveSettings, type Heightfield } from 'topographic';
import { glide } from './shared';

const grid: Heightfield = { samples: new Float32Array([0, 0.2, 0.4, 1]), size: 2, aspect: 1.2 };

describe('glide', () => {
  it('copies when structuredClone is missing and keeps the height grid', () => {
    const real = globalThis.structuredClone;
    vi.stubGlobal('structuredClone', undefined);
    try {
      expect(globalThis.structuredClone).toBeUndefined();
      const goal = resolveSettings({ location: grid, lines: { count: 18 }, seed: 2 });
      const next = glide(goal, goal, 0.35);
      expect(next).toEqual(goal);
      expect(next).not.toBe(goal);
      expect(next.lines).not.toBe(goal.lines);
      expect(next.terrain).not.toBe(goal.terrain);
      expect(next.motion).not.toBe(goal.motion);
      expect(next.layout).not.toBe(goal.layout);
      expect(next.camera).not.toBe(goal.camera);
      expect(next.theme).not.toBe(goal.theme);
      expect(next.view2d).not.toBe(goal.view2d);
      expect(next.scenes).not.toBe(goal.scenes);
      expect(next.location).toBe(grid);
      expect(goal.lines.count).toBe(18);
      expect(goal.seed).toBe(2);
    } finally {
      vi.stubGlobal('structuredClone', real);
    }
  });
});
