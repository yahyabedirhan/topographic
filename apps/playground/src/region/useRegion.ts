import { useCallback, useEffect, useRef, useState } from 'react';
import type { Heightfield } from 'topographic';
import type { Playground } from '../shared';
import { limitMessage, limitProblem, spanOf, type BBox, type ReliefMode, type SmoothLevel, type Span } from './pipeline';
import { findPlace } from './places';
import { registerRegionTools } from './register';
import { readRegion, writeRegion, type RegionQuery } from './url';
import { withQuery, writeSettings } from '../share-url';
import type { BuildErr, BuildOk } from './worker';

export interface RegionInfo {
  minM: number;
  maxM: number;
  reliefM: number;
  zoom: number;
  tiles: number;
  fetchMs: number;
  shapeMs: number;
  span: Span;
}

export interface RegionController {
  bbox: BBox | null;
  placeId: string | null;
  name: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  info: RegionInfo | null;
  setPlace(bbox: BBox, placeId: string | null): void;
  clear(): void;
}

/** Every place uses the same height treatment; the 3D Elevation slider is the only height control. */
const RELIEF: ReliefMode = 'dramatic';
const SMOOTH: SmoothLevel = 'medium';

function queryOf(bbox: BBox | null, placeId: string | null): RegionQuery {
  return { bbox, place: placeId };
}

export function useRegion(pg: Playground): RegionController {
  const initial = readRegion(location.search);
  const initialProblem = initial.bbox ? limitProblem(initial.bbox) : null;
  const [bbox, setBbox] = useState<BBox | null>(initialProblem ? null : initial.bbox);
  const [placeId, setPlaceId] = useState<string | null>(initial.place);
  const [status, setStatus] = useState<RegionController['status']>(initialProblem ? 'error' : initial.bbox ? 'loading' : 'idle');
  const [error, setError] = useState<string | null>(initialProblem ? limitMessage(initialProblem) : null);
  const [info, setInfo] = useState<RegionInfo | null>(null);
  const [generation, setGeneration] = useState(0);
  const fieldRef = useRef<Heightfield | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [workerReady, setWorkerReady] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    setWorkerReady(true);
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const settingsRef = useRef(pg.settings);
  settingsRef.current = pg.settings;
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    writeRegion(q, queryOf(bbox, placeId));
    const next = withQuery(location.pathname, writeSettings(q.toString(), settingsRef.current), location.hash);
    if (next !== location.pathname + location.search + location.hash) history.replaceState(null, '', next);
  }, [bbox, placeId]);

  useEffect(() => {
    document.documentElement.dataset.region = status;
    return () => { delete document.documentElement.dataset.region; };
  }, [status]);

  useEffect(() => {
    const worker = workerRef.current;
    if (!workerReady || !worker || !bbox) return;
    const id = ++request.current;
    setStatus('loading');
    setError(null);
    const onMessage = (event: MessageEvent<BuildOk | BuildErr>) => {
      if (event.data.id !== id) return;
      if (!event.data.ok) {
        fieldRef.current = null;
        setInfo(null);
        setStatus('error');
        setError(event.data.error);
        setGeneration((n) => n + 1);
        return;
      }
      fieldRef.current = { samples: event.data.samples, size: event.data.size, aspect: event.data.aspect };
      setInfo({
        minM: event.data.minM,
        maxM: event.data.maxM,
        reliefM: event.data.reliefM,
        zoom: event.data.zoom,
        tiles: event.data.tiles,
        fetchMs: event.data.fetchMs,
        shapeMs: event.data.shapeMs,
        span: spanOf(bbox),
      });
      setStatus('ready');
      setGeneration((n) => n + 1);
    };
    worker.addEventListener('message', onMessage);
    const body = { id, bbox, relief: RELIEF, smooth: SMOOTH };
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

  const name = findPlace(placeId)?.name ?? (bbox ? 'Custom' : '');
  const setPlace = useCallback((next: BBox, id: string | null) => {
    const problem = limitProblem(next);
    if (problem) {
      setError(limitMessage(problem));
      setStatus('error');
      return;
    }
    setPlaceId(id);
    setBbox(next);
  }, []);
  const clear = useCallback(() => {
    fieldRef.current = null;
    setBbox(null);
    setPlaceId(null);
    setInfo(null);
    setError(null);
    setStatus('idle');
    setGeneration((n) => n + 1);
  }, []);
  const agent: RegionController = {
    bbox, placeId, name, status, error, info, setPlace, clear,
  };
  const liveRef = useRef(agent);
  liveRef.current = agent;
  useEffect(() => registerRegionTools(() => liveRef.current), []);

  return agent;
}
