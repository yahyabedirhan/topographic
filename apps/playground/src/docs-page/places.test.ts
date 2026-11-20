import { describe, expect, it, vi } from 'vitest';
import { terrainDefaults } from '../region/places';
import { loadPlace } from './places';

vi.mock('topographic/locations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('topographic/locations')>();
  return {
    ...actual,
    loadLocation: async () => ({
      samples: new Float32Array([0, 0.25, 0.5, 1]),
      size: 2,
      aspect: 1.5,
      minMeters: 0,
      maxMeters: 100,
      zoom: 12,
    }),
  };
});

describe('loadPlace', () => {
  it('copies defaults when structuredClone is missing', async () => {
    const real = globalThis.structuredClone;
    vi.stubGlobal('structuredClone', undefined);
    try {
      expect(globalThis.structuredClone).toBeUndefined();
      const loaded = await loadPlace('istanbul');
      const defaults = terrainDefaults('istanbul');
      expect(loaded.defaults).toEqual(defaults);
      expect(loaded.defaults).not.toBe(defaults);
      expect(loaded.defaults.lines).not.toBe(defaults.lines);
      expect(loaded.defaults.camera).not.toBe(defaults.camera);
      expect(defaults.lines?.count).toBe(36);
    } finally {
      vi.stubGlobal('structuredClone', real);
    }
  });
});