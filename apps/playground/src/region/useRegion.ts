import { track } from '../analytics';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DEFAULT_ELEVATION, resolveSettings, type Heightfield, type Settings } from 'topographic';
import { flushPageUrl, schedulePageUrl } from '../page-history';
import { withQuery, writeSettings } from '../share-url';
import { stagePointerBusy, type Playground } from '../shared';
import { areaProblem as limitProblem, areaProblemMessage as limitMessage, areaSpan as spanOf, type AreaSpan as Span, type BBox, type ReliefMode, type SmoothLevel } from 'topographic/locations';
import { beforePlace, findPlace, restoredKeys, terrainDefaults, type BeforePlace } from './places';
import { registerRegionTools } from './register';
import { readRegion, writeRegion, type RegionQuery } from './url';
import type { BuildErr, BuildOk } from './worker';

export interface RegionInfo {
  minM: number;
  maxM: number;
  reliefM: number;
  zoom: number;
  tiles: number;
  /** Whether the grid came with the library rather than from the elevation tiles. */
  builtIn: boolean;
  loadMs: number;
  span: Span;
}

export interface RegionController {
  bbox: BBox | null;
  placeId: string | null;
  name: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  info: RegionInfo | null;
  /** The loaded heightfield of the applied place, or null. */
  field: Heightfield | null;
  /** Applies a place with its defaults (MAP_TERRAIN_DEFAULTS unless the place has its own) on top of the settings. */
  setPlace(bbox: BBox, placeId: string | null): void;
  /** Applies a place and leaves the settings alone, for a saved terrain that brings its own. */
  showPlace(bbox: BBox, placeId: string | null): void;
  /** Returns to the generated terrain and to the lines, camera, extent and elevation from before the first place. */
  clear(): void;
}

/** Every place uses the same height treatment; the 3D Elevation slider is the only height control. */
export const RELIEF: ReliefMode = 'dramatic';
export const SMOOTH: SmoothLevel = 'medium';

function queryOf(bbox: BBox | null, placeId: string | null): RegionQuery {
  return { bbox, place: placeId };
}

/** Without a remembered state (a place opened from a link), Clear returns to the library defaults for the shape. */
function generatedView(shape: string): BeforePlace {
  const d = resolveSettings({ shape });
  return { lines: d.lines, camera: d.camera, extent: d.extent, elevation: d.elevation ?? DEFAULT_ELEVATION };
}

export function useRegion(pg: Playground): RegionController {
  const initial = readRegion(location.search);
  const initialProblem = initial.bbox ? limitProblem(initial.bbox) : null;
  const [bbox, setBbox] = useState<BBox | null>(initialProblem ? null : initial.bbox);
  const [placeId, setPlaceId] = useState<string | null>(initial.place);
  const [status, setStatus] = useState<RegionController['status']>(() => {
    const next = initialProblem ? 'error' : initial.bbox ? 'loading' : 'idle';
    if (typeof document !== 'undefined') document.documentElement.dataset.region = next;
    return next;
  });
  const [error, setError] = useState<string | null>(initialProblem ? limitMessage(initialProblem) : null);
  const [info, setInfo] = useState<RegionInfo | null>(null);
  const [generation, setGeneration] = useState(0);
  const fieldRef = useRef<Heightfield | null>(null);
  const [field, setField] = useState<Heightfield | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [workerReady, setWorkerReady] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    if (!bbox || workerRef.current) return;
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    setWorkerReady(true);
  }, [bbox]);
  useEffect(() => () => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const settingsRef = useRef(pg.settings);
  settingsRef.current = pg.settings;
  useLayoutEffect(() => {
    const q = new URLSearchParams(location.search);
    writeRegion(q, queryOf(bbox, placeId));
    schedulePageUrl(withQuery(location.pathname, writeSettings(q.toString(), settingsRef.current), location.hash));
    if (!stagePointerBusy()) flushPageUrl();
  }, [bbox, placeId]);

  useEffect(() => {
    document.documentElement.dataset.region = status;
    if (status === 'loading') document.documentElement.dataset.loading = 'terrain';
    else delete document.documentElement.dataset.loading;
    return () => { delete document.documentElement.dataset.region; delete document.documentElement.dataset.loading; };
  }, [status]);

  useEffect(() => {
    const worker = workerRef.current;
    if (!workerReady || !worker || !bbox) return;
    const id = ++request.current;
    setStatus('loading');
    setError(null);
    const t0 = performance.now();
    const place = placeId ?? 'custom';
    const onMessage = (event: MessageEvent<BuildOk | BuildErr>) => {
      if (event.data.id !== id) return;
      if (!event.data.ok) {
        fieldRef.current = null;
        setField(null);
        setInfo(null);
        setStatus('error');
        track('region_loaded', { ms: Math.round(performance.now() - t0), ok: false, place, tiles: null });
        setError(event.data.error);
        setGeneration((n) => n + 1);
        return;
      }
      fieldRef.current = { samples: event.data.samples, size: event.data.size, aspect: event.data.aspect };
      setField(fieldRef.current);
      setInfo({
        minM: event.data.minM,
        maxM: event.data.maxM,
        reliefM: event.data.reliefM,
        zoom: event.data.zoom,
        tiles: event.data.tiles,
        builtIn: event.data.builtIn,
        loadMs: event.data.loadMs,
        span: spanOf(bbox),
      });
      setStatus('ready');
      track('region_loaded', { ms: Math.round(performance.now() - t0), ok: true, place, tiles: event.data.tiles });
      setGeneration((n) => n + 1);
    };
    worker.addEventListener('message', onMessage);
    const body = { id, bbox, placeId, relief: RELIEF, smooth: SMOOTH };
    worker.postMessage(body);
    return () => worker.removeEventListener('message', onMessage);
  }, [bbox, workerReady]);

  useEffect(() => {
    let stop = false;
    const apply = () => {
      if (stop) return;
      const live = pg.instance.current;
      if (!live) {
        requestAnimationFrame(apply);
        return;
      }
      live.setHeightfield(fieldRef.current);
    };
    if (generation > 0) apply();
    return () => { stop = true; };
  }, [generation, pg]);

  const name = findPlace(placeId)?.name ?? (bbox ? 'Area' : '');
  const pgRef = useRef(pg);
  pgRef.current = pg;
  const bboxRef = useRef(bbox);
  bboxRef.current = bbox;
  // The settings from before the first place, and the keys clear() restores from them.
  const before = useRef<{ settings: Settings; keys: Set<keyof Settings> } | null>(null);
  const showPlace = useCallback((next: BBox, id: string | null) => {
    const problem = limitProblem(next);
    if (problem) {
      setError(limitMessage(problem));
      setStatus('error');
      return;
    }
    if (!bboxRef.current && before.current === null) before.current = { settings: settingsRef.current, keys: new Set() };
    // A place with its own defaults (Cyprus sets the colours too) adds those keys to what Clear restores.
    for (const key of restoredKeys(id)) before.current?.keys.add(key);
    bboxRef.current = next;
    setPlaceId(id);
    setBbox(next);
  }, []);
  const setPlace = useCallback((next: BBox, id: string | null) => {
    if (limitProblem(next)) return showPlace(next, id);
    showPlace(next, id);
    pgRef.current.change(terrainDefaults(id));
  }, [showPlace]);
  const clear = useCallback(() => {
    const had = Boolean(bboxRef.current);
    bboxRef.current = null;
    fieldRef.current = null;
    setField(null);
    setBbox(null);
    setPlaceId(null);
    setInfo(null);
    setError(null);
    setStatus('idle');
    setGeneration((n) => n + 1);
    const back = before.current;
    if (had) pgRef.current.change(back ? beforePlace(back.settings, [...back.keys]) : generatedView(settingsRef.current.shape));
    before.current = null;
  }, []);
  const agent: RegionController = {
    bbox, placeId, name, status, error, info, field, setPlace, showPlace, clear,
  };
  const liveRef = useRef(agent);
  liveRef.current = agent;
  useEffect(() => registerRegionTools(() => liveRef.current), []);

  return agent;
}
