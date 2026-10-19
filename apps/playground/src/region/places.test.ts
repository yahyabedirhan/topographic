import { describe, expect, it } from 'vitest';
import { limitProblem, spanOf } from './pipeline';
import { MAP_TERRAIN_DEFAULTS, PLACE_GROUPS, PLACES, restoredKeys, sameBox, terrainDefaults } from './places';

const LANDSCAPES = PLACES.filter((place) => place.id !== 'istanbul' && place.id !== 'cyprus');
/** Every place but Istanbul brings its own camera angle and elevation on the shared map terrain view. */
const OWN_VIEW = PLACES.filter((place) => place.id !== 'istanbul');

describe('example places', () => {
  it('offers Istanbul, Cyprus and eight landscapes, grouped by region in menu order', () => {
    expect(PLACES.map((place) => place.id)).toEqual([
      'istanbul', 'cyprus', 'matterhorn', 'geirangerfjord', 'grand-canyon', 'yosemite', 'torres-del-paine', 'fuji', 'everest', 'kilimanjaro',
    ]);
    const groups = PLACES.map((place) => place.group);
    expect(groups.filter((g, i) => g !== groups[i - 1])).toEqual([...PLACE_GROUPS]);
    for (const place of PLACES) expect(limitProblem(place.bbox)).toBeNull();
    expect(new Set(PLACES.map((place) => place.id)).size).toBe(PLACES.length);
  });

  it('frames Istanbul\'s whole metro area and each landscape at the frame\'s 1.55:1, 30 to 80 km wide', () => {
    expect(PLACES[0].bbox).toEqual({ west: 28.45, south: 40.78, east: 29.65, north: 41.36 });
    for (const place of LANDSCAPES) {
      const span = spanOf(place.bbox);
      expect(span.widthM).toBeGreaterThan(29_000);
      expect(span.widthM).toBeLessThan(81_000);
      expect(span.widthM / span.heightM).toBeCloseTo(1.55, 1);
    }
  });

  it('frames each landscape\'s main feature', () => {
    const FEATURES: Record<string, [number, number]> = {
      matterhorn: [7.6586, 45.9763], geirangerfjord: [7.2065, 62.1008], 'grand-canyon': [-112.1401, 36.0544],
      yosemite: [-119.5332, 37.7459], 'torres-del-paine': [-72.9692, -50.9423], fuji: [138.7274, 35.3606],
      everest: [86.925, 27.9881], kilimanjaro: [37.3556, -3.0674],
    };
    for (const place of LANDSCAPES) {
      const [lon, lat] = FEATURES[place.id];
      expect(lon > place.bbox.west && lon < place.bbox.east && lat > place.bbox.south && lat < place.bbox.north).toBe(true);
    }
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

  it('gives Istanbul the map terrain view, and Cyprus and each landscape the same view with their own camera angle and elevation', () => {
    expect(terrainDefaults('istanbul')).toBe(MAP_TERRAIN_DEFAULTS);
    expect(terrainDefaults(null)).toBe(MAP_TERRAIN_DEFAULTS);
    for (const place of OWN_VIEW) {
      const d = terrainDefaults(place.id);
      expect({ ...d, camera: undefined, elevation: undefined }).toEqual({ ...MAP_TERRAIN_DEFAULTS, camera: undefined, elevation: undefined });
      expect(d.camera?.radius).toBe(MAP_TERRAIN_DEFAULTS.camera.radius);
      expect(Object.keys(d).sort()).toEqual(Object.keys(MAP_TERRAIN_DEFAULTS).sort());
    }
    expect(terrainDefaults('cyprus')).toEqual({ ...MAP_TERRAIN_DEFAULTS, elevation: 0.1, camera: { azimuth: 341.8, elevation: 35, radius: 1.32 } });
  });

  it('lets Clear restore only the map view after any place', () => {
    expect(restoredKeys('istanbul').sort()).toEqual(['camera', 'elevation', 'extent', 'lines']);
    for (const place of OWN_VIEW) expect(restoredKeys(place.id).sort()).toEqual(['camera', 'elevation', 'extent', 'lines', 'mode']);
  });
});
