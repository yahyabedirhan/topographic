// Real places for the docs page's live figures. This is the only module of the page that knows where heights come from.
//
// Today they come from the playground's own region pipeline: its worker fetches the elevation tiles, stitches them
// and shapes them, as the Map panel's Apply does, so a figure draws what the playground draws.
// When the library ships `location` (issue #81), loadPlace returns `{ ...defaults, location: id }` as settings and a
// null field, and every figure keeps working unchanged. The heightmap figure then reads the heights back from the view.
import type { Heightfield, SettingsInput } from 'topographic';
import { PLACES, terrainDefaults, type Place } from '../region/places';
import { RELIEF, SMOOTH } from '../region/useRegion';
import type { BuildErr, BuildOk, BuildRequest } from '../region/worker';

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

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (ok: BuildOk) => void; reject: (err: Error) => void }>();
const cache = new Map<string, Promise<LoadedPlace>>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../region/worker.ts', import.meta.url), { type: 'module' });
  worker.addEventListener('message', (event: MessageEvent<BuildOk | BuildErr>) => {
    const job = pending.get(event.data.id);
    if (!job) return;
    pending.delete(event.data.id);
    if (event.data.ok) job.resolve(event.data);
    else job.reject(new Error(event.data.error));
  });
  return worker;
}

/** Loads a place's heights once per page; later calls share the first. */
export function loadPlace(id: string): Promise<LoadedPlace> {
  const hit = cache.get(id);
  if (hit) return hit;
  const place = placeOf(id);
  const promise = new Promise<BuildOk>((resolve, reject) => {
    const req: BuildRequest = { id: ++nextId, bbox: place.bbox, relief: RELIEF, smooth: SMOOTH };
    pending.set(req.id, { resolve, reject });
    getWorker().postMessage(req);
  }).then((ok): LoadedPlace => ({
    place,
    field: { samples: ok.samples, size: ok.size, aspect: ok.aspect },
    // Every place uses the shared place camera, Cyprus too (the maintainer's call, also in pull request #84).
    defaults: structuredClone(terrainDefaults(id === 'cyprus' ? null : id)),
  }));
  promise.catch(() => cache.delete(id));
  cache.set(id, promise);
  return promise;
}
