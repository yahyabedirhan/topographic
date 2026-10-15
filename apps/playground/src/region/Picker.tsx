import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AttributionControl, Map as MapLibre, setWorkerUrl, type Map as MapMap } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { limitMessage, limitProblem, spanOf, type BBox } from './pipeline';
import { mapStyle, ELEVATION_CREDIT, type MapAppearance } from './basemap';
import { findPlace, FRAME, PLACES, sameBox } from './places';
import type { RegionController } from './useRegion';
import { km } from './controls';
import { SegRow } from '../parts';

setWorkerUrl(maplibreWorkerUrl);

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
  return {
    west: Math.min(nw.lng, se.lng),
    east: Math.max(nw.lng, se.lng),
    south: Math.min(nw.lat, se.lat),
    north: Math.max(nw.lat, se.lat),
  };
}

/** A box chosen by name, or the applied one: it stands for the frame until the person pans or zooms. */
interface Held {
  bbox: BBox;
  placeId: string | null;
}

const CITIES = PLACES.map((place) => ({ id: place.id, label: place.name }));

/**
 * The Map popover's content: a map with a frame, a City choice, then Clear and Apply. Moving the map
 * or picking a city only moves the frame; Apply makes the framed area the terrain (and a saved dock
 * item). Clear returns to the generated terrain. The map keeps a 16:10 ratio, so the frame stays near 1.5:1.
 */
export function PlacePanel({ region, onApply, appearance }: {
  region: RegionController;
  onApply: (bbox: BBox, placeId: string | null) => void;
  appearance: MapAppearance;
}) {
  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapMap | null>(null);
  const [draft, setDraft] = useState<BBox | null>(null);
  const [held, setHeld] = useState<Held | null>(region.bbox ? { bbox: region.bbox, placeId: region.placeId } : null);
  const [scrolls, setScrolls] = useState(false);
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
      m.addControl(new AttributionControl({ compact: true, customAttribution: ELEVATION_CREDIT }), 'top-left');
      map = m;
      mapRef.current = m;
      const refresh = () => {
        if (!frame.current || !host.current) return;
        setDraft(readFrame(m, frame.current, host.current));
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
      m.on('movestart', (event) => { if ((event as { originalEvent?: Event }).originalEvent) setHeld(null); });
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

  // Clear and Apply sit under the City row while the popover fits, and move above the map when it scrolls.
  useLayoutEffect(() => {
    const pop = root.current?.closest('.pt-pop');
    const body = root.current;
    if (!pop || !body) return;
    const measure = () => setScrolls(pop.scrollHeight > pop.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(pop);
    observer.observe(body);
    measure();
    return () => observer.disconnect();
  }, []);

  const candidate: Held | null = held ?? (draft ? { bbox: draft, placeId: null } : null);
  const problem = candidate ? limitProblem(candidate.bbox) : null;
  const span = candidate && !problem ? spanOf(candidate.bbox) : null;
  const applied = Boolean(region.bbox && candidate && sameBox(candidate.bbox, region.bbox));
  const flyTo = (id: string) => {
    const place = findPlace(id);
    const map = mapRef.current;
    if (!place) return;
    setHeld({ bbox: place.bbox, placeId: place.id });
    map?.fitBounds([[place.bbox.west, place.bbox.south], [place.bbox.east, place.bbox.north]], { padding: framePadding(map), duration: 500 });
  };
  const apply = () => {
    if (!candidate || problem) return;
    onApply(candidate.bbox, candidate.placeId);
    setHeld(candidate);
  };
  const actions = (
    <div className="pt-place-actions">
      {region.bbox ? <button type="button" className="pt-action pt-action-quiet pt-clear" onClick={region.clear}>Clear</button> : null}
      <button type="button" className="pt-action pt-apply" disabled={applied || !candidate || !!problem} onClick={apply}>
        {applied ? (region.status === 'loading' ? 'Applying…' : 'Applied') : 'Apply'}
      </button>
    </div>
  );

  return (
    <div ref={root} className="pt-place">
      {scrolls && actions}
      <div className="pt-mapbox pt-map">
        <div ref={host} className="pt-map-host" />
        <div ref={frame} className="pt-map-frame" />
        <span className="pt-map-span" hidden={!candidate}>
          {problem ? limitMessage(problem) : applied && region.status === 'error' ? region.error : span ? `${km(span.widthM)} × ${km(span.heightM)}` : ''}
        </span>
      </div>
      <div className="pt-place-cities">
        <SegRow label="City" options={CITIES} value={held?.placeId ?? null} onChange={flyTo} />
      </div>
      {!scrolls && actions}
    </div>
  );
}
