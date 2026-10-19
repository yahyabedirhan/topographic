import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOCATIONS, LOCATION_IDS, findLocation, loadLocation } from './builtin.js';
import { limitProblem, spanOf } from './pipeline.js';

describe('built-in locations', () => {
  it('lists the ten playground places in menu order', () => {
    expect(LOCATION_IDS).toEqual([
      'istanbul', 'cyprus', 'matterhorn', 'geirangerfjord', 'grand-canyon', 'yosemite', 'torres-del-paine', 'fuji', 'everest', 'kilimanjaro',
    ]);
    for (const l of LOCATIONS) {
      expect(limitProblem(l.bbox)).toBeNull();
      expect(l.aspect).toBe(spanOf(l.bbox).aspect);
      expect(l.name.length).toBeGreaterThan(0);
    }
    expect(findLocation('everest')?.name).toBe('Everest & the Khumbu');
    expect(findLocation('atlantis')).toBeUndefined();
  });

  it('gives every place the shared camera distance and block extent, Cyprus included', () => {
    for (const l of LOCATIONS) {
      expect(l.defaults.camera.radius).toBe(1.32);
      expect(l.defaults.extent).toBe('block');
    }
    expect(findLocation('cyprus')!.defaults).toEqual({ camera: { azimuth: 341.8, elevation: 35, radius: 1.32 }, elevation: 0.1, extent: 'block' });
    expect(findLocation('istanbul')!.defaults.camera).toEqual({ azimuth: 341.8, elevation: 39.3, radius: 1.32 });
  });

  it('loads each place lazily: one dynamic import per place and no static import of the data', () => {
    const source = readFileSync(new URL('./builtin.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/^import[^(]*['"]\.\/data\//m);
    for (const id of LOCATION_IDS) expect(source).toContain(`import('./data/${id}.js')`);
  });

  it('decodes a 256 × 256 grid from 0 to 1 with the real heights', async () => {
    const everest = await loadLocation('everest');
    expect(everest.size).toBe(256);
    expect(everest.samples.length).toBe(256 * 256);
    expect(everest.aspect).toBe(findLocation('everest')!.aspect);
    let lo = Infinity, hi = -Infinity;
    for (const v of everest.samples) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(1);
    expect(hi).toBeGreaterThan(0.95);
    expect(everest.maxMeters).toBeGreaterThan(8600);
    expect(everest.maxMeters).toBeLessThan(8900);
  });

  it('puts the sea at 0 and the land above it', async () => {
    const cyprus = await loadLocation('cyprus');
    // The south-west corner is open sea; the middle of the grid is the Mesaoria plain or the hills.
    expect(cyprus.samples[0]).toBe(0);
    expect(cyprus.samples[128 * 256 + 100]).toBeGreaterThan(0);
  });

  it('returns a fresh copy each time and rejects an unknown id', async () => {
    const a = await loadLocation('fuji');
    a.samples[0] = 5;
    expect((await loadLocation('fuji')).samples[0]).not.toBe(5);
    await expect(loadLocation('atlantis')).rejects.toThrow(/unknown location "atlantis"/);
  });
});
