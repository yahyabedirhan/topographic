import type { Settings, SettingsInput } from 'topographic';
import type { BBox } from './pipeline';

export interface Place {
  id: string;
  name: string;
  note: string;
  bbox: BBox;
}

/**
 * Cities offered as one-tap examples. Each box holds the whole metro area and some of its
 * surroundings, 70 to 100 km wide, with the 1.5:1 shape of the Map popover's frame.
 */
export const PLACES: readonly Place[] = [
  { id: 'istanbul', name: 'Istanbul', note: 'Büyükçekmece to Tuzla and the Princes\' Islands', bbox: { west: 28.45, south: 40.78, east: 29.65, north: 41.36 } },
  { id: 'san-francisco', name: 'San Francisco', note: 'The Bay, Mount Tamalpais and Mount Diablo', bbox: { west: -122.75, south: 37.53, east: -121.85, north: 37.99 } },
  { id: 'london', name: 'London', note: 'Greater London, the Thames and the Downs', bbox: { west: -0.7, south: 51.27, east: 0.45, north: 51.73 } },
  { id: 'new-york', name: 'New York', note: 'The five boroughs and the harbour', bbox: { west: -74.45, south: 40.46, east: -73.45, north: 40.95 } },
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

/** The settings MAP_TERRAIN_DEFAULTS replaces, so Clear can put them back. */
export type BeforePlace = Pick<Settings, 'lines' | 'camera' | 'extent' | 'elevation'>;

export function beforePlace(s: Settings): BeforePlace {
  return { lines: { ...s.lines }, camera: { ...s.camera }, extent: s.extent, elevation: s.elevation };
}
