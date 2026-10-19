import type { Settings, SettingsInput } from 'topographic';
import type { BBox } from './pipeline';

export interface Place {
  id: string;
  name: string;
  note: string;
  /** The place menu's group. */
  group: PlaceGroup;
  bbox: BBox;
  /** What Apply sets for this place instead of MAP_TERRAIN_DEFAULTS. */
  defaults?: SettingsInput;
}

/**
 * What Apply sets on top of the current settings when it makes a terrain from the map. Colours,
 * theme, motion and the rest stay. Clear puts back the lines, camera, extent and elevation from
 * before the first place. Camera motion is left alone.
 */
export const MAP_TERRAIN_DEFAULTS = {
  mode: '3d',
  extent: 'block',
  elevation: 0.12,
  lines: { count: 36, width: 0, opacity: 0.9, indexEvery: 4 },
  camera: { azimuth: 341.8, elevation: 39.3, radius: 1.32 },
} as const satisfies SettingsInput;

/** The place menu's groups, in menu order. */
export const PLACE_GROUPS = ['Europe & Middle East', 'Americas', 'Asia', 'Africa'] as const;
export type PlaceGroup = (typeof PLACE_GROUPS)[number];

/**
 * A landscape's own camera angle and elevation on top of MAP_TERRAIN_DEFAULTS, each picked from a
 * small grid of renders: the main feature centred and the skyline in the upper part.
 */
const landscape = (azimuth: number, cameraElevation: number, elevation: number): SettingsInput => ({
  ...MAP_TERRAIN_DEFAULTS,
  elevation,
  camera: { ...MAP_TERRAIN_DEFAULTS.camera, azimuth, elevation: cameraElevation },
});

/**
 * Places offered as one-tap examples, grouped by region. Istanbul's box holds the whole metro area,
 * about 101 × 64 km. Cyprus is the whole island with some sea around it, about 261 × 166 km. Each
 * landscape box is about 1.5:1 around its main feature. Cyprus and each landscape bring their own
 * camera angle and elevation.
 */
export const PLACES: readonly Place[] = [
  { id: 'istanbul', name: 'Istanbul', group: 'Europe & Middle East', note: 'The Bosphorus and the Princes\' Islands', bbox: { west: 28.45, south: 40.78, east: 29.65, north: 41.36 } },
  {
    id: 'cyprus', name: 'Cyprus', group: 'Europe & Middle East', note: 'The whole island, Troodos to the Karpas',
    bbox: { west: 32.07126, south: 34.41845, east: 34.93823, north: 35.92088 },
    defaults: landscape(341.8, 35, 0.1),
  },
  {
    id: 'matterhorn', name: 'Matterhorn & Zermatt', group: 'Europe & Middle East', note: 'The pyramid above Zermatt and its glaciers',
    bbox: { west: 7.441, south: 45.883, east: 7.959, north: 46.117 }, defaults: landscape(341.8, 35, 0.16),
  },
  {
    id: 'geirangerfjord', name: 'Geirangerfjord', group: 'Europe & Middle East', note: 'A deep fjord between sheer Norwegian walls',
    bbox: { west: 6.474, south: 61.925, east: 7.626, north: 62.275 }, defaults: landscape(341.8, 35, 0.16),
  },
  {
    id: 'grand-canyon', name: 'Grand Canyon', group: 'Americas', note: 'From the South Rim across to the North Rim',
    bbox: { west: -112.434, south: 35.945, east: -111.766, north: 36.295 }, defaults: landscape(10, 40, 0.08),
  },
  {
    id: 'yosemite', name: 'Yosemite Valley', group: 'Americas', note: 'Half Dome, El Capitan and the valley floor',
    bbox: { west: -119.755, south: 37.647, east: -119.415, north: 37.823 }, defaults: landscape(341.8, 35, 0.16),
  },
  {
    id: 'torres-del-paine', name: 'Torres del Paine', group: 'Americas', note: 'Granite towers over Patagonian lakes',
    bbox: { west: -73.478, south: -51.175, east: -72.622, north: -50.825 }, defaults: landscape(341.8, 35, 0.16),
  },
  {
    id: 'fuji', name: 'Mount Fuji', group: 'Asia', note: 'The cone and the Fuji Five Lakes',
    bbox: { west: 138.433, south: 35.278, east: 139.007, north: 35.582 }, defaults: landscape(341.8, 30, 0.24),
  },
  {
    id: 'everest', name: 'Everest & the Khumbu', group: 'Asia', note: 'The roof of the world above the Khumbu valley',
    bbox: { west: 86.515, south: 27.725, east: 87.125, north: 28.075 }, defaults: landscape(341.8, 40, 0.1),
  },
  {
    id: 'kilimanjaro', name: 'Kilimanjaro', group: 'Africa', note: 'Africa\'s highest peak over the plains',
    bbox: { west: 37.000, south: -3.303, east: 37.720, north: -2.837 }, defaults: landscape(341.8, 30, 0.24),
  },
];

export function findPlace(id: string | null): Place | undefined {
  return PLACES.find((place) => place.id === id);
}

/** Inset of the frame, as fractions of the map. */
export const FRAME = { left: 0.16, right: 0.16, top: 0.13, bottom: 0.16 };

/** Two boxes count as the same place when every edge is within about ten metres. */
export function sameBox(a: BBox, b: BBox): boolean {
  const near = (x: number, y: number) => Math.abs(x - y) < 1e-4;
  return near(a.west, b.west) && near(a.south, b.south) && near(a.east, b.east) && near(a.north, b.north);
}

/** What Apply sets for a place: its own defaults, or MAP_TERRAIN_DEFAULTS. */
export function terrainDefaults(placeId: string | null): SettingsInput {
  return findPlace(placeId)?.defaults ?? MAP_TERRAIN_DEFAULTS;
}

/** The settings Clear puts back. Always the lines, camera, extent and elevation. */
export type BeforePlace = SettingsInput & Pick<Settings, 'lines' | 'camera' | 'extent' | 'elevation'>;

/** The settings keys Clear restores: the map terrain view's, plus every key a place's own defaults set. */
export function restoredKeys(placeId: string | null): (keyof Settings)[] {
  const keys = new Set<keyof Settings>(['lines', 'camera', 'extent', 'elevation']);
  for (const key of Object.keys(findPlace(placeId)?.defaults ?? {})) keys.add(key as keyof Settings);
  return [...keys];
}

/** Picks the given keys from the settings before the first place, for Clear. */
export function beforePlace(s: Settings, keys: (keyof Settings)[] = restoredKeys(null)): BeforePlace {
  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = structuredClone(s[key]);
  return out as BeforePlace;
}
