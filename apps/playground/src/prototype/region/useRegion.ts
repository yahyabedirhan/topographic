import { useEffect, useRef, useState } from 'react';
import type { Heightfield } from 'topographic';
import type { Playground } from '../shared';
import { limitMessage, limitProblem, spanOf, type BBox, type ReliefMode, type SmoothLevel, type Span } from './pipeline';
import { findPlace } from './places';
import { readRegion, writeRegion, type RegionQuery } from './url';
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
  relief: ReliefMode;
  smooth: SmoothLevel;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  info: RegionInfo | null;
  setPlace(bbox: BBox, placeId: string | null): void;
  setRelief(relief: ReliefMode): void;
  setSmooth(smooth: SmoothLevel): void;
  clear(): void;
}

function queryOf(bbox: BBox | null, relief: ReliefMode, smooth: SmoothLevel, placeId: string | null): RegionQuery {
  return { bbox, relief, smooth, place: placeId };
}

export function useRegion(pg: Playground): RegionController {
  const initial = readRegion(location.search);
  const initialProblem = initial.bbox ? limitProblem(initial.bbox) : null;
  const [bbox, setBbox] = useState<BBox | null>(initialProblem ? null : initial.bbox);
  const [placeId, setPlaceId] = useState<string | null>(initial.place);
  const [relief, setRelief] = useState<ReliefMode>(initial.relief);
  const [smooth, setSmooth] = useState<SmoothLevel>(initial.smooth);
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

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    writeRegion(q, queryOf(bbox, relief, smooth, placeId));
    const next = `${location.pathname}?${q}`;
    if (next !== `${location.pathname}${location.search}`) history.replaceState(null, '', next);
  }, [bbox, relief, smooth, placeId]);

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
    const body = { id, bbox, relief, smooth };
    worker.postMessage(body);
    return () => worker.removeEventListener('message', onMessage);
  }, [bbox, relief, smooth, workerReady]);

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

  return {
    bbox, placeId, name, relief, smooth, status, error, info,
    setPlace(next, id) {
      const problem = limitProblem(next);
      if (problem) {
        setError(limitMessage(problem));
        setStatus('error');
        return;
      }
      setPlaceId(id);
      setBbox(next);
    },
    setRelief,
    setSmooth,
    clear() {
      fieldRef.current = null;
      setBbox(null);
      setPlaceId(null);
      setInfo(null);
      setError(null);
      setStatus('idle');
      setGeneration((n) => n + 1);
    },
  };
}
