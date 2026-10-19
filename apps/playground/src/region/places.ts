import type { Settings, SettingsInput } from 'topographic';
import { useSyncExternalStore } from 'react';
import { LOCATIONS, type BBox, type LocationId, type LocationInfo } from 'topographic/locations';

/** The kinds of landscape the place catalog holds. */
export type PlaceKind =
  | 'mountain' | 'volcano' | 'island' | 'city' | 'glacier' | 'canyon' | 'desert'
  | 'fjord' | 'coast' | 'crater' | 'lake' | 'valley' | 'karst' | 'delta';

export interface Place {
  /** A library location id for the ten built-in places, or a catalog id. */
  id: string;
  name: string;
  note: string;
  /** The place menu's group: the continent. */
  group: PlaceGroup;
  bbox: BBox;
  /** Filled in once the catalog has loaded. */
  country?: string;
  kind?: PlaceKind;
  /** What Apply sets for this place instead of MAP_TERRAIN_DEFAULTS. */
  defaults?: SettingsInput;
  /** A catalog place's pre-rendered grid in public/places/; the ten built-in places load from the library instead. */
  grid?: { minMeters: number; maxMeters: number; zoom: number };
}

/**
 * What Apply sets on top of the current settings when it makes a terrain from the map. Colours,
 * theme, motion and the rest stay. Clear puts back the lines, camera, extent and elevation from
 * before the first place, camera motion included.
 */
export const MAP_TERRAIN_DEFAULTS = {
  mode: '3d',
  extent: 'block',
  elevation: 0.12,
  lines: { count: 36, width: 0, opacity: 0.9, indexEvery: 4 },
  camera: { azimuth: 341.8, elevation: 39.3, radius: 1.32, motion: 'push', speed: 0.2 },
} as const satisfies SettingsInput;

/** The place menu's groups, in menu order: the catalog's continents. */
export const PLACE_GROUPS = ['Europe', 'Middle East', 'Africa', 'Asia', 'Oceania', 'North America', 'South America', 'Antarctica', 'Arctic'] as const;
export type PlaceGroup = (typeof PLACE_GROUPS)[number];

/** What the place menu adds to each library location: its continent and a short note. */
const MENU: Record<LocationId, { group: PlaceGroup; note: string }> = {
  istanbul: { group: 'Europe', note: 'Turkey · The city on the Bosphorus' },
  cyprus: { group: 'Europe', note: 'The whole island, mountains to coast' },
  matterhorn: { group: 'Europe', note: 'Switzerland · The famous pyramid peak' },
  geirangerfjord: { group: 'Europe', note: 'Norway · A deep fjord with steep walls' },
  'grand-canyon': { group: 'North America', note: 'United States · A vast desert canyon' },
  yosemite: { group: 'North America', note: 'United States · A granite valley' },
  'torres-del-paine': { group: 'South America', note: 'Chile · Granite towers and glacial lakes' },
  fuji: { group: 'Asia', note: 'Japan · The famous volcano cone' },
  everest: { group: 'Asia', note: 'Nepal / China · The world\'s highest peak' },
  kilimanjaro: { group: 'Africa', note: 'Tanzania · Africa\'s highest peak' },
};

/** The map terrain view with a camera angle and an elevation of its own. */
function ownView(cameraElevation: number, elevation: number, azimuth: number = MAP_TERRAIN_DEFAULTS.camera.azimuth): SettingsInput {
  const base = MAP_TERRAIN_DEFAULTS.camera;
  return { ...MAP_TERRAIN_DEFAULTS, elevation, camera: { ...base, azimuth, elevation: cameraElevation } };
}

/**
 * A landscape's own camera angle and elevation, from the library location, on top of
 * MAP_TERRAIN_DEFAULTS. A location with the map terrain view's own angle and elevation has no defaults.
 */
function landscape(location: LocationInfo): SettingsInput | undefined {
  const { camera, elevation } = location.defaults;
  const base = MAP_TERRAIN_DEFAULTS.camera;
  if (camera.azimuth === base.azimuth && camera.elevation === base.elevation && camera.radius === base.radius && elevation === MAP_TERRAIN_DEFAULTS.elevation) return undefined;
  return ownView(camera.elevation, elevation, camera.azimuth);
}

/**
 * The library's built-in locations as one-tap examples, grouped by continent. Istanbul's box holds the
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

/**
 * A catalog place's view, by kind, from the built-in place that is most like it: a city has
 * Istanbul's map terrain view, a volcano Fuji's and Kilimanjaro's, an island Cyprus's, a canyon the
 * Grand Canyon's low block, and every other landscape the Matterhorn's.
 */
const KIND_VIEW: Record<PlaceKind, SettingsInput | undefined> = {
  city: undefined,
  volcano: ownView(30, 0.24),
  island: ownView(35, 0.1),
  canyon: ownView(40, 0.08),
  mountain: ownView(35, 0.16), glacier: ownView(35, 0.16), desert: ownView(35, 0.16), fjord: ownView(35, 0.16),
  coast: ownView(35, 0.16), crater: ownView(35, 0.16), lake: ownView(35, 0.16), valley: ownView(35, 0.16),
  karst: ownView(35, 0.16), delta: ownView(35, 0.16),
};

/** One row of catalog.json: a reference to a built-in place, or a catalog place with its grid's heights. */
export type CatalogRow =
  | { id: string; builtIn: true; country: string; continent: PlaceGroup; kind: PlaceKind }
  | {
    id: string; builtIn?: false; name: string; description: string; country: string; continent: PlaceGroup; kind: PlaceKind;
    bbox: BBox; minMeters: number; maxMeters: number; zoom: number;
  };

/** Joins the catalog's rows with the built-in places, in the catalog's order. */
export function catalogPlaces(rows: readonly CatalogRow[]): Place[] {
  return rows.map((row): Place => {
    if (row.builtIn) {
      const place = PLACES.find((p) => p.id === row.id);
      if (!place) throw new Error(`The catalog names "${row.id}", which is not a built-in place`);
      return { ...place, country: row.country, kind: row.kind };
    }
    return {
      id: row.id, name: row.name, note: row.description, group: row.continent, bbox: row.bbox,
      country: row.country, kind: row.kind, defaults: KIND_VIEW[row.kind],
      grid: { minMeters: row.minMeters, maxMeters: row.maxMeters, zoom: row.zoom },
    };
  });
}

// The catalog loads on its own, the first time the Map opens or a link names a catalog place, so
// the first page load stays the same size. Until then, the place list holds the ten built-in places.
let catalog: readonly Place[] | null = null;
let pending: Promise<readonly Place[]> | null = null;
const listeners = new Set<() => void>();

/** Loads the place catalog once per page. */
export function loadCatalog(): Promise<readonly Place[]> {
  if (catalog) return Promise.resolve(catalog);
  if (!pending) {
    pending = import('./catalog.json').then((mod) => {
      catalog = catalogPlaces(mod.default as unknown as CatalogRow[]);
      for (const listener of listeners) listener();
      return catalog;
    });
    pending.catch(() => { pending = null; });
  }
  return pending;
}

/** Every place known now: the whole catalog once it has loaded, else the ten built-in places. */
export function allPlaces(): readonly Place[] {
  return catalog ?? PLACES;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** allPlaces() for a component, which draws again when the catalog arrives. */
export function useAllPlaces(): readonly Place[] {
  return useSyncExternalStore(subscribe, allPlaces, allPlaces);
}

/** Whether an id is one of the ten places built into the library. */
export function isBuiltInPlace(id: string | null): boolean {
  return Boolean(id && PLACES.some((place) => place.id === id));
}

export function findPlace(id: string | null): Place | undefined {
  return allPlaces().find((place) => place.id === id);
}

export { sameBox } from './box';

/** Inset of the frame, as fractions of the map. */
export const FRAME = { left: 0.16, right: 0.16, top: 0.13, bottom: 0.16 };

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
