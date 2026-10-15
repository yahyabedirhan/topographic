import type { BBox } from './pipeline';

export interface Place {
  id: string;
  name: string;
  note: string;
  bbox: BBox;
}

/** Cities offered as one-tap examples. Each box is about ten kilometres on a side. */
export const PLACES: readonly Place[] = [
  { id: 'istanbul', name: 'Istanbul', note: 'Historic peninsula', bbox: { west: 28.94, south: 40.99, east: 29.07, north: 41.08 } },
  { id: 'san-francisco', name: 'San Francisco', note: 'Peninsula hills', bbox: { west: -122.51, south: 37.71, east: -122.38, north: 37.81 } },
  { id: 'london', name: 'London', note: 'Thames and the northern hills', bbox: { west: -0.22, south: 51.48, east: -0.06, north: 51.57 } },
  { id: 'new-york', name: 'New York', note: 'Lower Manhattan and the rivers', bbox: { west: -74.06, south: 40.68, east: -73.92, north: 40.77 } },
];

export function findPlace(id: string | null): Place | undefined {
  return PLACES.find((place) => place.id === id);
}

/** Inset of the frame, as fractions of the map. */
export const FRAME = { left: 0.16, right: 0.16, top: 0.13, bottom: 0.16 };
