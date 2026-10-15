import { useEffect, useRef, useState } from 'react';
import { Map as MapLibre, setWorkerUrl, type Map as MapMap, type LngLat } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { MapPin, X } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(maplibreWorkerUrl);
import { limitMessage, limitProblem, spanOf, type BBox } from './pipeline';
import { mapStyle, type MapAppearance } from './basemap';
import { findPlace, FRAME, PLACES } from './places';
import type { RegionController } from './useRegion';

type PickMode = 'frame' | 'draw';

function km(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const n = meters / 1000;
  return `${n < 10 ? n.toFixed(1) : Math.round(n)} km`;
}

function ordered(a: LngLat, b: LngLat): BBox {
  return {
    west: Math.min(a.lng, b.lng),
    east: Math.max(a.lng, b.lng),
    south: Math.min(a.lat, b.lat),
    north: Math.max(a.lat, b.lat),
  };
}

function framePadding(map: MapMap) {
  const canvas = map.getCanvas();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  return {
    left: w * FRAME.left,
    right: w * FRAME.right,
    top: h * FRAME.top,
    bottom: h * FRAME.bottom,
  };
}

function readFrame(map: MapMap, frame: HTMLElement, host: HTMLElement): BBox {
  const mapRect = host.getBoundingClientRect();
  const box = frame.getBoundingClientRect();
  const nw = map.unproject([box.left - mapRect.left, box.top - mapRect.top]);
  const se = map.unproject([box.right - mapRect.left, box.bottom - mapRect.top]);
  return ordered(nw, se);
}

export function PlaceButton({ pressed, onClick }: { pressed: boolean; onClick: () => void }) {
  return (
    <button type="button" className="pt-ibtn" aria-label="Place" aria-pressed={pressed} onClick={onClick}>
      <MapPin size={18} strokeWidth={1.75} />
    </button>
  );
}

export function RegionPill({ region, onOpen }: { region: RegionController; onOpen: () => void }) {
  if (region.status === 'idle' && !region.error) return null;
  const span = region.info?.span;
  const detail = region.status === 'loading'
    ? 'Reading the land…'
    : region.status === 'error'
      ? region.error
      : span
        ? `${km(span.widthM)} × ${km(span.heightM)} · ${Math.round(region.info?.reliefM ?? 0)} m of relief`
        : '';
  return (
    <div className="pt-region pt-glass" data-region-status={region.status}>
      <button type="button" className="pt-region-name" onClick={onOpen}>{region.name || 'Place'}</button>
      <span>{detail}</span>
      {region.bbox && (
        <button type="button" className="pt-region-clear" onClick={region.clear}>Clear</button>
      )}
    </div>
  );
}

export function PlaceSheet({ open, onClose, region, appearance }: {
  open: boolean;
  onClose: () => void;
  region: RegionController;
  appearance: MapAppearance;
}) {
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapMap | null>(null);
  const pickRef = useRef<PickMode>('frame');
  const [pick, setPick] = useState<PickMode>('frame');
  const [draft, setDraft] = useState<BBox | null>(region.bbox);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  pickRef.current = pick;

  useEffect(() => {
    if (!open || !host.current) return;
    const map = new MapLibre({
      container: host.current,
      style: mapStyle(location.search, appearance),
      center: [region.bbox ? (region.bbox.west + region.bbox.east) / 2 : 29, region.bbox ? (region.bbox.south + region.bbox.north) / 2 : 41.03],
      zoom: 11,
      attributionControl: { compact: false },
      dragRotate: false,
      pitchWithRotate: false,
      maxPitch: 0,
    });
    mapRef.current = map;
    let start: { lngLat: LngLat; x: number; y: number } | null = null;
    const refresh = () => {
      if (pickRef.current !== 'frame' || !frame.current || !host.current) return;
      setDraft(readFrame(map, frame.current, host.current));
    };
    const down = (lngLat: LngLat, x: number, y: number) => {
      if (pickRef.current !== 'draw') return;
      start = { lngLat, x, y };
      setBox({ x, y, w: 0, h: 0 });
    };
    const move = (lngLat: LngLat, x: number, y: number) => {
      if (!start) return;
      setDraft(ordered(start.lngLat, lngLat));
      setBox({ x: Math.min(start.x, x), y: Math.min(start.y, y), w: Math.abs(x - start.x), h: Math.abs(y - start.y) });
    };
    map.on('load', () => {
      map.resize();
      const target = region.bbox ?? findPlace('istanbul')?.bbox ?? PLACES[0].bbox;
      map.fitBounds([[target.west, target.south], [target.east, target.north]], { padding: framePadding(map), duration: 0 });
      refresh();
    });
    map.on('move', refresh);
    map.on('mousedown', (event) => down(event.lngLat, event.point.x, event.point.y));
    map.on('mousemove', (event) => move(event.lngLat, event.point.x, event.point.y));
    map.on('mouseup', () => { start = null; });
    map.on('touchstart', (event) => down(event.lngLat, event.point.x, event.point.y));
    map.on('touchmove', (event) => move(event.lngLat, event.point.x, event.point.y));
    map.on('touchend', () => { start = null; });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [open, appearance]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pick === 'draw') map.dragPan.disable();
    else {
      map.dragPan.enable();
      setBox(null);
      if (frame.current && host.current) setDraft(readFrame(map, frame.current, host.current));
    }
  }, [pick]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const problem = draft ? limitProblem(draft) : 'order';
  const span = draft && !problem ? spanOf(draft) : null;
  const fly = (bbox: BBox) => {
    const map = mapRef.current;
    if (!map) return;
    if (pick === 'frame') {
      map.fitBounds([[bbox.west, bbox.south], [bbox.east, bbox.north]], { padding: framePadding(map), duration: 500 });
    } else {
      map.fitBounds([[bbox.west, bbox.south], [bbox.east, bbox.north]], { padding: 48, duration: 500 });
      setDraft(bbox);
    }
  };

  return (
    <>
      <button type="button" className="pt-backdrop" aria-label="Close place" onClick={onClose} />
      <div className="pt-dialog pt-glass pt-place" role="dialog" aria-label="Choose a place">
        <div className="pt-dialog-head">
          <div>
            <div className="pt-kicker">Place</div>
            <h2 className="pt-dtitle">Choose a region</h2>
          </div>
          <button type="button" className="pt-ibtn" aria-label="Close" onClick={onClose}><X size={18} strokeWidth={1.75} /></button>
        </div>
        <div className="pt-dialog-body pt-place-body">
          <div className="pt-place-bar">
            <div className="pt-field">
              <span className="pt-field-name" id="pick-label">Choose by</span>
              <div className="pt-chips" role="group" aria-labelledby="pick-label">
                <button type="button" className={`pt-chip${pick === 'frame' ? ' is-on' : ''}`} onClick={() => setPick('frame')}>Frame</button>
                <button type="button" className={`pt-chip${pick === 'draw' ? ' is-on' : ''}`} onClick={() => setPick('draw')}>Rectangle</button>
              </div>
            </div>
            <div className="pt-field">
              <span className="pt-field-name" id="city-label">Cities</span>
              <div className="pt-chips" role="group" aria-labelledby="city-label">
                {PLACES.map((place) => (
                  <button key={place.id} type="button" className="pt-chip" onClick={() => { fly(place.bbox); region.setPlace(place.bbox, place.id); }}>
                    {place.name}
                  </button>
                ))}
              </div>
            </div>
            <p className="pt-hint">{pick === 'frame' ? 'Pan and zoom. The frame is the place.' : 'Drag a rectangle. Scroll to zoom.'}</p>
          </div>
          <div className={`pt-frame pt-map${pick === 'draw' ? ' is-draw' : ''}`}>
            <div ref={host} className="pt-map-host" />
            {pick === 'frame' && <div ref={frame} className="pt-map-frame" />}
            {pick === 'draw' && box && box.w > 0 && <div className="pt-map-box" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />}
          </div>
        </div>
        <footer className="pt-place-foot">
          <div className="pt-place-groups">
            <div className="pt-field">
              <span className="pt-field-name" id="relief-label">Relief</span>
              <div className="pt-chips" role="group" aria-labelledby="relief-label">
                <button type="button" className={`pt-chip${region.relief === 'dramatic' ? ' is-on' : ''}`} onClick={() => region.setRelief('dramatic')}>Exaggerate for drama</button>
                <button type="button" className={`pt-chip${region.relief === 'measured' ? ' is-on' : ''}`} onClick={() => region.setRelief('measured')}>Match the real heights</button>
              </div>
              <p className="pt-hint">Exaggerate fills this place. Match the real heights keeps a low city low.</p>
            </div>
            <div className="pt-field">
              <span className="pt-field-name" id="smooth-label">Smoothing</span>
              <div className="pt-chips" role="group" aria-labelledby="smooth-label">
                <button type="button" className={`pt-chip${region.smooth === 'light' ? ' is-on' : ''}`} onClick={() => region.setSmooth('light')}>Light</button>
                <button type="button" className={`pt-chip${region.smooth === 'medium' ? ' is-on' : ''}`} onClick={() => region.setSmooth('medium')}>Medium</button>
                <button type="button" className={`pt-chip${region.smooth === 'strong' ? ' is-on' : ''}`} onClick={() => region.setSmooth('strong')}>Strong</button>
              </div>
              <p className="pt-hint">How much to soften the hills.</p>
            </div>
          </div>
          <p className="pt-hint pt-place-meta">
            <span>
              {problem ? limitMessage(problem) : span ? `${km(span.widthM)} × ${km(span.heightM)}` : 'Draw a rectangle.'}
              {region.info && region.status === 'ready' ? ` · ${region.info.tiles} tiles · zoom ${region.info.zoom} · ${Math.round(region.info.shapeMs)} ms` : ''}
              {region.status === 'loading' ? ' · Reading the land…' : ''}
              {region.status === 'error' && region.error ? ` · ${region.error}` : ''}
            </span>
            <span className="pt-attrib">Elevation: Mapzen Terrain Tiles, AWS Open Data.</span>
          </p>
          <button
            type="button"
            className="pt-use"
            disabled={!draft || !!problem}
            onClick={() => { if (draft && !problem) { region.setPlace(draft, null); onClose(); } }}
          >
            Use this place
          </button>
        </footer>
      </div>
    </>
  );
}
