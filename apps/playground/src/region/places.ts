import type { Settings, SettingsInput } from 'topographic';
import { LOCATIONS, type BBox, type LocationId, type LocationInfo } from 'topographic/locations';

export interface Place {
  id: LocationId;
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

/** What the place menu adds to each library location: its group and a short note. */
const MENU: Record<LocationId, { group: PlaceGroup; note: string }> = {
  istanbul: { group: 'Europe & Middle East', note: 'The Bosphorus and the Princes\' Islands' },
  cyprus: { group: 'Europe & Middle East', note: 'The whole island, Troodos to the Karpas' },
  matterhorn: { group: 'Europe & Middle East', note: 'The pyramid above Zermatt and its glaciers' },
  geirangerfjord: { group: 'Europe & Middle East', note: 'A deep fjord between sheer Norwegian walls' },
  'grand-canyon': { group: 'Americas', note: 'From the South Rim across to the North Rim' },
  yosemite: { group: 'Americas', note: 'Half Dome, El Capitan and the valley floor' },
  'torres-del-paine': { group: 'Americas', note: 'Granite towers over Patagonian lakes' },
  fuji: { group: 'Asia', note: 'The cone and the Fuji Five Lakes' },
  everest: { group: 'Asia', note: 'The roof of the world above the Khumbu valley' },
  kilimanjaro: { group: 'Africa', note: 'Africa\'s highest peak over the plains' },
};

/**
 * A landscape's own camera angle and elevation, from the library location, on top of
 * MAP_TERRAIN_DEFAULTS. A location with the map terrain view's own angle and elevation has no defaults.
 */
function landscape(location: LocationInfo): SettingsInput | undefined {
  const { camera, elevation } = location.defaults;
  const base = MAP_TERRAIN_DEFAULTS.camera;
  if (camera.azimuth === base.azimuth && camera.elevation === base.elevation && camera.radius === base.radius && elevation === MAP_TERRAIN_DEFAULTS.elevation) return undefined;
  return { ...MAP_TERRAIN_DEFAULTS, elevation, camera: { ...base, azimuth: camera.azimuth, elevation: camera.elevation } };
}

/**
 * The library's built-in locations as one-tap examples, grouped by region. Istanbul's box holds the
 * whole metro area, about 101 × 64 km. Cyprus is the whole island with some sea around it, about
 * 261 × 166 km. Each landscape box is about 1.5:1 around its main feature. Cyprus and each landscape bring their own
 * camera angle and elevation.
 */
export const PLACES: readonly Place[] = LOCATIONS.map((location) => ({
  id: location.id,
  name: location.name,
  bbox: location.bbox,
  ...MENU[location.id],
  defaults: landscape(location),
}));

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
