// PROTOTYPE real places: loads the playground's ten built-in places as live heightfields, through the
// playground's own worker (elevation tiles -> stitched -> shaped), so a prototype shows what Apply shows.
// Vite serves the TypeScript sources directly.
import { PLACES, terrainDefaults } from '/apps/playground/src/region/places.ts';
import { terrain } from './live.js';

export { PLACES };
export const PLACE_IDS = PLACES.map((p) => p.id);

// The playground's own build settings (useRegion.ts).
const RELIEF = 'dramatic';
const SMOOTH = 'medium';

let worker = null;
let nextId = 0;
const pending = new Map();
const cache = new Map();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('/apps/playground/src/region/worker.ts', import.meta.url), { type: 'module' });
  worker.addEventListener('message', (event) => {
    const job = pending.get(event.data.id);
    if (!job) return;
    pending.delete(event.data.id);
    if (event.data.ok) job.resolve(event.data);
    else job.reject(new Error(event.data.error));
  });
  return worker;
}

/** Loads a place by id. Returns { field, defaults, place, info }; cached per id. */
export function loadPlace(id) {
  if (cache.has(id)) return cache.get(id);
  const place = PLACES.find((p) => p.id === id);
  if (!place) return Promise.reject(new Error(`Unknown place "${id}". Known: ${PLACE_IDS.join(', ')}`));
  const promise = new Promise((resolve, reject) => {
    const reqId = ++nextId;
    pending.set(reqId, { resolve, reject });
    getWorker().postMessage({ id: reqId, bbox: place.bbox, relief: RELIEF, smooth: SMOOTH });
  }).then((ok) => ({
    field: { samples: ok.samples, size: ok.size, aspect: ok.aspect },
    defaults: structuredClone(terrainDefaults(id)),
    place,
    info: { minM: ok.minM, maxM: ok.maxM, reliefM: ok.reliefM, tiles: ok.tiles },
  }));
  promise.catch(() => cache.delete(id));
  cache.set(id, promise);
  return promise;
}

const merge = (a, b) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && a?.[k] && typeof a[k] === 'object' ? merge(a[k], v) : v;
  }
  return out;
};

/**
 * Mounts a live terrain of a real place into el: the place's defaults (3D, camera, elevation, extent)
 * under extraSettings, then its heightfield. Returns the live instance (0.5.0 API).
 */
export async function placeTerrain(el, id, extraSettings = {}, options = {}) {
  const { field, defaults } = await loadPlace(id);
  const t = terrain(el, merge(defaults, extraSettings), options);
  // The heightfield's samples are shared between instances of the same place; the renderer only reads them.
  t.setHeightfield(field);
  return t;
}
