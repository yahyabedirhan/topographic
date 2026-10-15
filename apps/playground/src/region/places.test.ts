import { describe, expect, it } from 'vitest';
import { limitProblem, spanOf } from './pipeline';
import { mergeSettings, resolveSettings } from 'topographic';
import { readSettings } from '../share-url';
import { CYPRUS_DEFAULTS, MAP_TERRAIN_DEFAULTS, PLACES, beforePlace, restoredKeys, sameBox, terrainDefaults } from './places';

const CITIES = PLACES.filter((place) => place.id !== 'cyprus');

describe('example places', () => {
  it('offers Istanbul, San Francisco, London, New York and Cyprus', () => {
    expect(PLACES.map((place) => place.id)).toEqual(['istanbul', 'san-francisco', 'london', 'new-york', 'cyprus']);
    for (const place of PLACES) expect(limitProblem(place.bbox)).toBeNull();
  });

  it('frames each whole metro area: 70 to 105 km wide, about 1.5:1', () => {
    for (const place of CITIES) {
      const span = spanOf(place.bbox);
      expect(span.widthM).toBeGreaterThan(70_000);
      expect(span.widthM).toBeLessThan(105_000);
      expect(span.widthM / span.heightM).toBeCloseTo(1.55, 1);
    }
    expect(PLACES[0].bbox).toEqual({ west: 28.45, south: 40.78, east: 29.65, north: 41.36 });
  });

  it('frames the whole of Cyprus with some sea, about 261 × 166 km', () => {
    const cyprus = PLACES.find((place) => place.id === 'cyprus')!;
    const span = spanOf(cyprus.bbox);
    expect(span.widthM / 1000).toBeCloseTo(261, -1);
    expect(span.heightM / 1000).toBeCloseTo(166, -1);
    // Cape Arnauti (west), Cape Gata (south), Cape Apostolos Andreas (Karpas tip) and Cape Kormakitis (north).
    const inside = ([lon, lat]: [number, number]) => lon > cyprus.bbox.west && lon < cyprus.bbox.east && lat > cyprus.bbox.south && lat < cyprus.bbox.north;
    for (const cape of [[32.27, 35.1], [33.05, 34.56], [34.59, 35.7], [32.92, 35.4]] as [number, number][]) expect(inside(cape)).toBe(true);
  });

  it('compares boxes to about ten metres', () => {
    const box = PLACES[0].bbox;
    expect(sameBox(box, { ...box, west: box.west + 0.00005 })).toBe(true);
    expect(sameBox(box, { ...box, west: box.west + 0.001 })).toBe(false);
  });

  it('gives map terrains their own 3D view and lines', () => {
    expect(MAP_TERRAIN_DEFAULTS).toEqual({
      mode: '3d',
      extent: 'block',
      elevation: 0.12,
      lines: { count: 36, width: 0, opacity: 0.9, indexEvery: 4 },
      camera: { azimuth: 341.8, elevation: 39.3, radius: 1.32 },
    });
  });

  it('gives Cyprus the settings of the owner\'s link, and every other place the map terrain view', () => {
    const link = readSettings('?look=stone-grain&lc=37&lw=0&lo=0.92&ix=6&sd=1.3&sk=0.35&an=0.43&fd=0.22&m=dark&ink=a9c7e4&paper=10151c&mode=3d&ex=block&ev=0.06&az=3&ce=80&rd=1.18');
    const { detail: _detail, ...rest } = link;
    expect(CYPRUS_DEFAULTS).toEqual({ ...rest, camera: { azimuth: 3, elevation: 80, radius: 1.18 } });
    expect(terrainDefaults('cyprus')).toBe(CYPRUS_DEFAULTS);
    expect(terrainDefaults('istanbul')).toBe(MAP_TERRAIN_DEFAULTS);
    expect(terrainDefaults(null)).toBe(MAP_TERRAIN_DEFAULTS);
  });

  it('lets Clear restore the colours after Cyprus, and only the map view after a city', () => {
    expect(restoredKeys('istanbul').sort()).toEqual(['camera', 'elevation', 'extent', 'lines']);
    expect(restoredKeys('cyprus')).toEqual(expect.arrayContaining(['theme', 'style', 'motion', 'layout', 'lines', 'camera']));
    const start = resolveSettings({ theme: { mode: 'light', ink: '#222222' } });
    const applied = mergeSettings(start, CYPRUS_DEFAULTS);
    expect(mergeSettings(applied, beforePlace(start, restoredKeys('cyprus')))).toEqual(start);
  });
});
