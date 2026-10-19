// Real places for the docs page's live figures. This is the only module of the page that knows where heights come from.
//
// They are the library's built-in grids from `topographic/locations`, the same ones the playground's places load,
// so a figure draws what the playground draws.
import type { Heightfield, SettingsInput } from 'topographic';
import { PLACES, terrainDefaults, type Place } from '../region/places';
import { loadLocation } from 'topographic/locations';

export interface LoadedPlace {
  place: Place;
  /** The place's heights, for `setHeightfield`. Null once the library loads the place itself from `location`. */
  field: Heightfield | null;
  /** The settings the playground applies with the place: 3D, its camera, elevation and extent. */
  defaults: SettingsInput;
}

/** The order of the place gallery: Istanbul first, then the landscapes. */
export const PLACE_ORDER = ['istanbul', 'everest', 'grand-canyon', 'yosemite', 'matterhorn', 'fuji', 'torres-del-paine', 'geirangerfjord', 'kilimanjaro', 'cyprus'] as const;
export type PlaceId = (typeof PLACE_ORDER)[number];

export const placeOf = (id: string): Place => {
  const place = PLACES.find((p) => p.id === id);
  if (!place) throw new Error(`Unknown place "${id}"`);
  return place;
};

const cache = new Map<string, Promise<LoadedPlace>>();

/** Loads a place's heights once per page; later calls share the first. */
export function loadPlace(id: string): Promise<LoadedPlace> {
  const hit = cache.get(id);
  if (hit) return hit;
  const place = placeOf(id);
  const promise = loadLocation(id).then((ok): LoadedPlace => ({
    place,
    field: { samples: ok.samples, size: ok.size, aspect: ok.aspect },
    // Every place uses the shared place camera, Cyprus too (the maintainer's call, also in pull request #84).
    defaults: structuredClone(terrainDefaults(id === 'cyprus' ? null : id)),
  }));
  promise.catch(() => cache.delete(id));
  cache.set(id, promise);
  return promise;
}
