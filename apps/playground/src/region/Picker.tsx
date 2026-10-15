import { useEffect, useRef, useState } from 'react';
import { AttributionControl, Map as MapLibre, setWorkerUrl, type Map as MapMap, type LngLat } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { limitMessage, limitProblem, spanOf, type BBox, type ReliefMode, type SmoothLevel } from './pipeline';
import { mapStyle, type MapAppearance } from './basemap';
import { findPlace, FRAME, PLACES } from './places';
import type { RegionController } from './useRegion';
import { km, PlaceNow } from './controls';
import { PopHead, Section, SegRow } from '../parts';

setWorkerUrl(maplibreWorkerUrl);

type PickMode = 'frame' | 'draw';

const PICKS: { id: PickMode; label: string }[] = [
  { id: 'frame', label: 'Frame' },
  { id: 'draw', label: 'Rectangle' },
];

const RELIEFS: { id: ReliefMode; label: string }[] = [
  { id: 'dramatic', label: 'Exaggerate' },
  { id: 'measured', label: 'Real heights' },
];

const SMOOTHS: { id: SmoothLevel; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'strong', label: 'Strong' },
];

const CITIES = PLACES.map((place) => ({ id: place.id, label: place.name }));

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

/**
 * The Place popover's content. It mounts when the popover opens. The map area has a fixed
 * 16:10 ratio, so the frame inside it stays near 1.5:1, well within the 3:1 limit.
 */
export function PlacePanel({ region, appearance }: { region: RegionController; appearance: MapAppearance }) {
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapMap | null>(null);
  const pickRef = useRef<PickMode>('frame');
  const [pick, setPick] = useState<PickMode>('frame');
  const [draft, setDraft] = useState<BBox | null>(region.bbox);
  // The applied place stays "In use" until the person moves the frame or draws.
  const [touched, setTouched] = useState(false);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  pickRef.current = pick;
  const bboxRef = useRef(region.bbox);
  bboxRef.current = region.bbox;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let map: MapMap | null = null;
    // Start the map only once the popover has its size, so the first fit uses the real frame.
    const start = () => {
      const target = bboxRef.current ?? findPlace('istanbul')?.bbox ?? PLACES[0].bbox;
      const m = new MapLibre({
        container: el,
        style: mapStyle(location.search, appearance),
        center: [(target.west + target.east) / 2, (target.south + target.north) / 2],
        zoom: 11,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        maxPitch: 0,
      });
      m.addControl(new AttributionControl({ compact: true }), 'top-right');
      map = m;
      mapRef.current = m;
      let begin: { lngLat: LngLat; x: number; y: number } | null = null;
      const refresh = () => {
        if (pickRef.current !== 'frame' || !frame.current || !host.current) return;
        setDraft(readFrame(m, frame.current, host.current));
      };
      const down = (lngLat: LngLat, x: number, y: number) => {
        if (pickRef.current !== 'draw') return;
        begin = { lngLat, x, y };
        setBox({ x, y, w: 0, h: 0 });
        setTouched(true);
      };
      const move = (lngLat: LngLat, x: number, y: number) => {
        if (!begin) return;
        setDraft(ordered(begin.lngLat, lngLat));
        setBox({ x: Math.min(begin.x, x), y: Math.min(begin.y, y), w: Math.abs(x - begin.x), h: Math.abs(y - begin.y) });
      };
      m.on('load', () => {
        // The compact credit starts open; keep it folded to its (i) button so it does not cover the map.
        el.querySelector('.maplibregl-compact-show')?.classList.remove('maplibregl-compact-show');
        m.resize();
        m.fitBounds([[target.west, target.south], [target.east, target.north]], { padding: framePadding(m), duration: 0 });
        refresh();
      });
      m.on('move', refresh);
      // Only a person's pan or zoom carries an original event; fitBounds does not.
      m.on('movestart', (event) => { if ((event as { originalEvent?: Event }).originalEvent) setTouched(true); });
      m.on('mousedown', (event) => down(event.lngLat, event.point.x, event.point.y));
      m.on('mousemove', (event) => move(event.lngLat, event.point.x, event.point.y));
      m.on('mouseup', () => { begin = null; });
      m.on('touchstart', (event) => down(event.lngLat, event.point.x, event.point.y));
      m.on('touchmove', (event) => move(event.lngLat, event.point.x, event.point.y));
      m.on('touchend', () => { begin = null; });
    };
    const observer = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return;
      if (map) map.resize();
      else start();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, [appearance]);

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

  const problem = draft ? limitProblem(draft) : 'order';
  const span = draft && !problem ? spanOf(draft) : null;
  const inUse = Boolean(region.bbox) && !touched;
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
  const pickCity = (id: string) => {
    const place = findPlace(id);
    if (!place) return;
    fly(place.bbox);
    region.setPlace(place.bbox, place.id);
    setTouched(false);
  };

  return (
    <>
      <PopHead title="Place" />
      <PlaceNow region={region} />
      <Section title="Region">
        <SegRow label="City" options={CITIES} value={region.bbox ? region.placeId : null} onChange={pickCity} />
        <SegRow label="Choose by" options={PICKS} value={pick} onChange={setPick} />
        <div className={`pt-mapbox pt-map${pick === 'draw' ? ' is-draw' : ''}`}>
          <div ref={host} className="pt-map-host" />
          {pick === 'frame' && <div ref={frame} className="pt-map-frame" />}
          {pick === 'draw' && box && box.w > 0 && <div className="pt-map-box" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />}
          <span className="pt-map-cap">{pick === 'frame' ? 'Pan and zoom. The frame is the place.' : 'Drag a rectangle. Scroll to zoom.'}</span>
          <span className="pt-map-span" hidden={!draft && pick === 'frame'}>
            {problem ? (draft ? limitMessage(problem) : pick === 'draw' ? 'Draw a rectangle.' : '') : span ? `${km(span.widthM)} × ${km(span.heightM)}` : ''}
          </span>
        </div>
      </Section>
      <Section title="Heights">
        <SegRow
          label="Relief"
          hint="Exaggerate fills this place. Real heights keeps a low city low."
          options={RELIEFS}
          value={region.relief}
          onChange={region.setRelief}
        />
        <SegRow label="Smoothing" hint="How much to soften the hills." options={SMOOTHS} value={region.smooth} onChange={region.setSmooth} />
      </Section>
      <div className="pt-pop-foot">
        <span className="pt-attrib">Elevation: Mapzen Terrain Tiles, AWS Open Data.</span>
        <button
          type="button"
          className="pt-use"
          disabled={inUse || !draft || !!problem}
          onClick={() => { if (draft && !problem) { region.setPlace(draft, null); setTouched(false); } }}
        >
          {inUse ? 'In use' : 'Use this place'}
        </button>
      </div>
    </>
  );
}
