import type { BBox } from './pipeline';

export interface Place {
  id: string;
  name: string;
  note: string;
  bbox: BBox;
}

/** Real places used to compare a mountain, a hilly city and a flat city. */
export const PLACES: readonly Place[] = [
  { id: 'zermatt', name: 'Zermatt', note: 'Mountain valley', bbox: { west: 7.64, south: 45.95, east: 7.78, north: 46.04 } },
  { id: 'istanbul', name: 'Istanbul', note: 'Hilly city', bbox: { west: 28.94, south: 40.99, east: 29.07, north: 41.08 } },
  { id: 'chicago', name: 'Chicago', note: 'Flat city', bbox: { west: -87.72, south: 41.84, east: -87.58, north: 41.93 } },
];

export function findPlace(id: string | null): Place | undefined {
  return PLACES.find((place) => place.id === id);
}

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/** Inset of the frame, as fractions of the map. */
export const FRAME = { left: 0.16, right: 0.16, top: 0.13, bottom: 0.16 };
