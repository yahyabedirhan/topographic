import type { Heightfield } from '../heightfield.js';
import { spanOf, type BBox } from './pipeline.js';
import { decodeGrid16, fromBase64 } from './png.js';

export type LocationId =
  | 'istanbul' | 'cyprus' | 'matterhorn' | 'geirangerfjord' | 'grand-canyon'
  | 'yosemite' | 'torres-del-paine' | 'fuji' | 'everest' | 'kilimanjaro';

/** The look a location sets unless you set it yourself: the playground's place view. */
export interface LocationDefaults {
  camera: { azimuth: number; elevation: number; radius: number };
  /** How tall the 3D terrain is. */
  elevation: number;
  extent: 'block';
  /** Fine, strong lines with a bold line every 4, as the playground draws a place. */
  lines: { count: number; width: number; opacity: number; indexEvery: number };
  /** A light centre fade, so the middle of the place stays clear. */
  layout: { fade: number };
}

/** A built-in location. Its height grid loads with loadLocation() or the `location` setting. */
export interface LocationInfo {
  id: LocationId;
  name: string;
  bbox: BBox;
  /** Width / height of the area in web mercator. */
  aspect: number;
  defaults: LocationDefaults;
}

/** A location's height grid, with the real heights it was made from. */
export interface LocationField extends Heightfield {
  /** The lowest and highest point in metres, with the sea at 0. */
  minMeters: number;
  maxMeters: number;
  /** The Terrarium zoom level the grid was made from. */
  zoom: number;
}

/** What each generated file in ./data holds. */
interface LocationData {
  default: string;
  minMeters: number;
  maxMeters: number;
  zoom: number;
}

/** Each import is its own chunk, so a page downloads only the locations it uses. */
const LOADERS: Record<LocationId, () => Promise<LocationData>> = {
  istanbul: () => import('./data/istanbul.js'),
  cyprus: () => import('./data/cyprus.js'),
  matterhorn: () => import('./data/matterhorn.js'),
  geirangerfjord: () => import('./data/geirangerfjord.js'),
  'grand-canyon': () => import('./data/grand-canyon.js'),
  yosemite: () => import('./data/yosemite.js'),
  'torres-del-paine': () => import('./data/torres-del-paine.js'),
  fuji: () => import('./data/fuji.js'),
  everest: () => import('./data/everest.js'),
  kilimanjaro: () => import('./data/kilimanjaro.js'),
};

/**
 * Every place shares one camera distance, extent, lines and centre fade; the angle and the height
 * suit each landscape. The lines are the playground's map terrain lines, and the fade is its looks' base fade.
 */
const view = (azimuth: number, cameraElevation: number, elevation: number): LocationDefaults => ({
  camera: { azimuth, elevation: cameraElevation, radius: 1.32 },
  elevation,
  extent: 'block',
  lines: { count: 36, width: 0, opacity: 0.9, indexEvery: 4 },
  layout: { fade: 0.15 },
});

const place = (id: LocationId, name: string, bbox: BBox, defaults: LocationDefaults): LocationInfo => ({
  id, name, bbox, aspect: spanOf(bbox).aspect, defaults,
});

/**
 * The built-in locations, in the playground's menu order. Istanbul holds the whole metro area,
 * Cyprus the whole island with some sea, and each landscape a box of about 1.5:1 around its main feature.
 */
export const LOCATIONS: readonly LocationInfo[] = [
  place('istanbul', 'Istanbul', { west: 28.45, south: 40.78, east: 29.65, north: 41.36 }, view(341.8, 39.3, 0.12)),
  place('cyprus', 'Cyprus', { west: 32.07126, south: 34.41845, east: 34.93823, north: 35.92088 }, view(341.8, 35, 0.1)),
  place('matterhorn', 'Matterhorn & Zermatt', { west: 7.441, south: 45.883, east: 7.959, north: 46.117 }, view(341.8, 35, 0.16)),
  place('geirangerfjord', 'Geirangerfjord', { west: 6.474, south: 61.925, east: 7.626, north: 62.275 }, view(341.8, 35, 0.16)),
  place('grand-canyon', 'Grand Canyon', { west: -112.434, south: 35.945, east: -111.766, north: 36.295 }, view(10, 40, 0.08)),
  place('yosemite', 'Yosemite Valley', { west: -119.755, south: 37.647, east: -119.415, north: 37.823 }, view(341.8, 35, 0.16)),
  place('torres-del-paine', 'Torres del Paine', { west: -73.478, south: -51.175, east: -72.622, north: -50.825 }, view(341.8, 35, 0.16)),
  place('fuji', 'Mount Fuji', { west: 138.433, south: 35.278, east: 139.007, north: 35.582 }, view(341.8, 30, 0.24)),
  place('everest', 'Everest & the Khumbu', { west: 86.515, south: 27.725, east: 87.125, north: 28.075 }, view(341.8, 40, 0.1)),
  place('kilimanjaro', 'Kilimanjaro', { west: 37.0, south: -3.303, east: 37.72, north: -2.837 }, view(341.8, 30, 0.24)),
];

export const LOCATION_IDS: readonly LocationId[] = LOCATIONS.map((l) => l.id);

export function findLocation(id: string): LocationInfo | undefined {
  return LOCATIONS.find((l) => l.id === id);
}

const cache = new Map<LocationId, Promise<LocationField>>();

async function read(location: LocationInfo): Promise<LocationField> {
  const data = await LOADERS[location.id]();
  const grid = await decodeGrid16(fromBase64(data.default));
  return { ...grid, aspect: location.aspect, minMeters: data.minMeters, maxMeters: data.maxMeters, zoom: data.zoom };
}

/**
 * Loads a built-in location's height grid. Only that location's file is downloaded, once per page.
 * Each call returns its own copy of the samples.
 */
export async function loadLocation(id: LocationId | (string & {})): Promise<LocationField> {
  const location = findLocation(id);
  if (!location) throw new Error(`[topographic] unknown location "${id}"`);
  let pending = cache.get(location.id);
  if (!pending) {
    pending = read(location);
    cache.set(location.id, pending);
    pending.catch(() => cache.delete(location.id));
  }
  const field = await pending;
  return { ...field, samples: field.samples.slice() };
}
