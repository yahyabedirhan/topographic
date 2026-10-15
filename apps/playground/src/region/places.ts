import type { Settings, SettingsInput } from 'topographic';
import type { BBox } from './pipeline';

export interface Place {
  id: string;
  name: string;
  note: string;
  bbox: BBox;
  /** What Apply sets for this place instead of MAP_TERRAIN_DEFAULTS. */
  defaults?: SettingsInput;
}

/**
 * Cyprus's own look, decoded with readSettings from the owner's link
 * `?look=stone-grain&lc=37&lw=0&lo=0.92&ix=6&sd=1.3&sk=0.35&an=0.43&fd=0.22&m=dark&ink=a9c7e4&paper=10151c&mode=3d&ex=block&ev=0.06&az=3&ce=80&rd=1.18`.
 * The camera motion and the detail are left out: they belong to the viewer, not the place.
 */
export const CYPRUS_DEFAULTS = {
  style: 'granite',
  seed: 127,
  lines: { count: 37, width: 0, opacity: 0.92, indexEvery: 6 },
  terrain: { peaks: 1, spread: 0.5, roughness: 0.5, sharpness: 0.5, terracing: 0, variant: 0.5 },
  motion: { speed: 1.3, warp: 0.47, sparkle: 0.35 },
  layout: { anchor: 0.43, fade: 0.22 },
  theme: { mode: 'dark', paper: '#10151c', ink: '#a9c7e4' },
  mode: '3d',
  elevation: 0.06,
  extent: 'block',
  camera: { azimuth: 3, elevation: 80, radius: 1.18 },
} as const satisfies SettingsInput;

/**
 * Places offered as one-tap examples. Each city box holds the whole metro area and some of its
 * surroundings, 70 to 100 km wide, with the 1.5:1 shape of the Map popover's frame. Cyprus is the
 * whole island with some sea around it, about 261 × 166 km.
 */
export const PLACES: readonly Place[] = [
  { id: 'istanbul', name: 'Istanbul', note: 'The Bosphorus and the Princes\' Islands', bbox: { west: 28.45, south: 40.78, east: 29.65, north: 41.36 } },
  { id: 'san-francisco', name: 'San Francisco', note: 'The Bay, Mount Tamalpais and Mount Diablo', bbox: { west: -122.75, south: 37.53, east: -121.85, north: 37.99 } },
  { id: 'london', name: 'London', note: 'Greater London, the Thames and the Downs', bbox: { west: -0.7, south: 51.27, east: 0.45, north: 51.73 } },
  { id: 'new-york', name: 'New York', note: 'The five boroughs and the harbour', bbox: { west: -74.45, south: 40.46, east: -73.45, north: 40.95 } },
  {
    id: 'cyprus', name: 'Cyprus', note: 'The whole island, Troodos to the Karpas',
    bbox: { west: 32.07126, south: 34.41845, east: 34.93823, north: 35.92088 },
    defaults: CYPRUS_DEFAULTS,
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
  // A theme without its own ink or paper must clear the place's colours, so name them as undefined.
  if (out.theme) out.theme = { ink: undefined, paper: undefined, ...(out.theme as object) };
  return out as BeforePlace;
}
