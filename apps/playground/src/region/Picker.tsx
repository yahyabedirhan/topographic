import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Map as MapLibre, setWorkerUrl, type Map as MapMap } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Menu } from '@base-ui-components/react/menu';
import { Check, ChevronDown, MapPin, Mountain, Move } from 'lucide-react';
import { limitMessage, limitProblem, spanOf, type BBox } from './pipeline';
import { ELEVATION_CREDIT, mapStyle, type MapAppearance } from './basemap';
import { findPlace, PLACE_GROUPS, PLACES, sameBox } from './places';
import { clampTowards, containRect, fitRect, HANDLES, resizeRect, screenAspect, type Handle, type Rect } from './frame';
import type { RegionController } from './useRegion';
import { km } from './controls';

setWorkerUrl(maplibreWorkerUrl);

/** The glass footer's height; the frame stays above it. */
const FOOT = 60;
/** The frame keeps this far from the map's edges and from the footer. */
const EDGE = 8;

/** Where the frame may go: the map minus a margin and the footer. */
function boundsOf(host: HTMLElement): Rect {
  return { left: EDGE, top: EDGE, right: host.clientWidth - EDGE, bottom: host.clientHeight - FOOT - EDGE };
}

/** Where a chosen box is drawn: clear of the badge, the credit and the footer. */
function areaOf(host: HTMLElement): Rect {
  const w = host.clientWidth;
  return { left: w * 0.1, top: 50, right: w * 0.9, bottom: host.clientHeight - FOOT - 18 };
}

function boxOf(map: MapMap, rect: Rect): BBox {
  const nw = map.unproject([rect.left, rect.top]);
  const se = map.unproject([rect.right, rect.bottom]);
  return {
    west: Math.min(nw.lng, se.lng),
    east: Math.max(nw.lng, se.lng),
    south: Math.min(nw.lat, se.lat),
    north: Math.max(nw.lat, se.lat),
  };
}

/** The minimap image's longest side in pixels: sharp at about 100 CSS px on a 2x screen, and a few kB as WebP. */
const MINIMAP_SIDE = 240;

/**
 * Copies the map under the frame into a small WebP data URL for the minimap. MapLibre clears its
 * drawing buffer after each frame, so the copy happens inside the next render event.
 */
export function captureFrame(map: MapMap, rect: Rect): Promise<string | null> {
  return new Promise((resolve) => {
    const done = window.setTimeout(() => resolve(null), 1500);
    map.once('render', () => {
      window.clearTimeout(done);
      try {
        const src = map.getCanvas();
        const ratio = src.width / Math.max(1, src.clientWidth);
        const w = rect.right - rect.left;
        const h = rect.bottom - rect.top;
        const scale = MINIMAP_SIDE / Math.max(w, h);
        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(w * scale));
        out.height = Math.max(1, Math.round(h * scale));
        out.getContext('2d')!.drawImage(src, rect.left * ratio, rect.top * ratio, w * ratio, h * ratio, 0, 0, out.width, out.height);
        const webp = out.toDataURL('image/webp', 0.72);
        resolve(webp.startsWith('data:image/webp') ? webp : out.toDataURL('image/jpeg', 0.72));
      } catch {
        resolve(null);
      }
    });
    map.triggerRepaint();
  });
}

function paddingOf(host: HTMLElement, rect: Rect) {
  return { left: rect.left, top: rect.top, right: host.clientWidth - rect.right, bottom: host.clientHeight - rect.bottom };
}

/** A city's name while the frame holds its preset box, otherwise "Area". */
export function areaName(bbox: BBox | null): string {
  return (bbox && PLACES.find((place) => sameBox(place.bbox, bbox))?.name) || 'Area';
}

const size = (bbox: BBox) => {
  const span = spanOf(bbox);
  return `${km(span.widthM).replace(' km', '')} × ${km(span.heightM)}`;
};

const CURSOR: Record<Handle, string> = { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' };

/** The map credit: a quiet © in the corner that opens into a small glass label. */
function Credit() {
  const [open, setOpen] = useState(false);
  return (
    <div className={`pt-credit${open ? ' is-open' : ''}`}>
      <button type="button" className="pt-credit-btn" aria-expanded={open} aria-label="Map credits" onClick={() => setOpen((v) => !v)}>©</button>
      <span className="pt-credit-text" hidden={!open}>
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>{' '}
        <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>{' · Data '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
        <br />
        {ELEVATION_CREDIT}
      </span>
    </div>
  );
}

/**
 * The Map popover's content. The map runs edge to edge; the frame on it can be resized by its corners
 * and edges, and panning or zooming moves the area under it. The badge at the top left names the
 * framed city (or "Area") and its size, and opens the city menu. The glass footer says what the
 * terrain is now and holds Clear and Apply. Apply makes the framed area the terrain and a saved dock item.
 */
export function PlacePanel({ region, onApply, appliedName, appearance }: {
  region: RegionController;
  /** `minimap` resolves to the framed map as a small image, for the minimap. */
  onApply: (bbox: BBox, placeId: string | null, minimap?: Promise<string | null>) => void;
  /** The applied terrain's name in the dock, if it has one. */
  appliedName?: string;
  appearance: MapAppearance;
}) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapMap | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const rectRef = useRef<Rect | null>(null);
  const [draft, setDraft] = useState<BBox | null>(null);
  const [resizing, setResizing] = useState(false);
  // A city's box while the map flies to it; it becomes the frame's box when the flight ends.
  const pendingBox = useRef<BBox | null>(null);
  const bboxRef = useRef(region.bbox);
  bboxRef.current = region.bbox;

  const place = (next: Rect) => {
    rectRef.current = next;
    setRect(next);
  };

  /** Frames a box: the frame takes the box's shape, then the map moves so the box fills it. */
  const frameBox = (bbox: BBox, duration: number) => {
    const map = mapRef.current;
    const el = host.current;
    if (!map || !el) return;
    const next = fitRect(areaOf(el), screenAspect(bbox));
    place(next);
    map.fitBounds([[bbox.west, bbox.south], [bbox.east, bbox.north]], { padding: paddingOf(el, next), duration });
    // fitBounds lands within a few metres; the box itself stands for the frame, so a city keeps its name.
    if (!duration) setDraft(bbox);
  };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let map: MapMap | null = null;
    // Start the map only once the popover has its size, so the first fit uses the real frame.
    const start = () => {
      const target = bboxRef.current ?? findPlace('istanbul')?.bbox ?? PLACES[0].bbox;
      const coarse = matchMedia('(pointer: coarse)').matches;
      const m = new MapLibre({
        container: el,
        style: mapStyle(location.search, appearance),
        center: [(target.west + target.east) / 2, (target.south + target.north) / 2],
        zoom: 9,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        maxPitch: 0,
        fadeDuration: 0,
        // The terrain already holds a full-screen context. A second one at device DPR is what
        // gets an iPhone tab killed, so the map stays under a fixed pixel budget.
        pixelRatio: Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2),
        maxCanvasSize: coarse ? [1024, 1024] : [2048, 2048],
        canvasContextAttributes: { antialias: false, powerPreference: coarse ? 'low-power' : 'default' },
      });
      m.touchZoomRotate.disableRotation();
      map = m;
      mapRef.current = m;
      m.on('load', () => {
        m.resize();
        frameBox(target, 0);
      });
      // Only a person's pan or zoom carries an original event; fitBounds does not.
      m.on('move', (event) => {
        if (!rectRef.current) return;
        if ((event as { originalEvent?: Event }).originalEvent) setDraft(boxOf(m, rectRef.current));
      });
      m.on('moveend', (event) => {
        // After a city's flight, the city's own box stands for the frame.
        if (!(event as { originalEvent?: Event }).originalEvent && pendingBox.current) {
          setDraft(pendingBox.current);
          pendingBox.current = null;
        }
      });
    };
    const observer = new ResizeObserver(() => {
      if (!el.clientWidth || !el.clientHeight) return;
      if (map) {
        map.resize();
        if (rectRef.current) {
          place(containRect(rectRef.current, boundsOf(el)));
          setDraft(boxOf(map, rectRef.current));
        }
      } else start();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appearance]);

  // Resizing: the edges the handle holds follow the pointer, inside the map, and stop at the place limits.
  const drag = useRef<{ id: number; handle: Handle; x: number; y: number; start: Rect; valid: Rect } | null>(null);
  const onHandleDown = (handle: Handle) => (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!rectRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, handle, x: e.clientX, y: e.clientY, start: rectRef.current, valid: rectRef.current };
    setResizing(true);
  };
  const onHandleMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    const d = drag.current;
    const map = mapRef.current;
    const el = host.current;
    if (!d || d.id !== e.pointerId || !map || !el) return;
    const want = resizeRect(d.start, d.handle, e.clientX - d.x, e.clientY - d.y, boundsOf(el));
    const next = clampTowards(d.valid, want, (r) => !limitProblem(boxOf(map, r)));
    if (!limitProblem(boxOf(map, next))) d.valid = next;
    place(next);
    setDraft(boxOf(map, next));
  };
  const onHandleUp = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setResizing(false);
  };

  const candidate = draft;
  const problem = candidate ? limitProblem(candidate) : null;
  const applied = Boolean(region.bbox && candidate && sameBox(candidate, region.bbox));
  const name = areaName(candidate);
  const placeId = PLACES.find((p) => candidate && sameBox(p.bbox, candidate))?.id ?? null;
  const flyTo = (id: string) => {
    const city = findPlace(id);
    if (!city) return;
    pendingBox.current = city.bbox;
    frameBox(city.bbox, 500);
  };
  const apply = () => {
    if (!candidate || problem) return;
    const map = mapRef.current;
    const frame = rectRef.current;
    onApply(candidate, placeId, map && frame ? captureFrame(map, frame) : undefined);
  };

  const appliedLabel = appliedName ?? areaName(region.bbox);
  const status = !region.bbox
    ? { icon: Mountain, title: 'Generated terrain', sub: 'Frame a place, then Apply' }
    : applied
      ? {
        icon: MapPin,
        title: appliedLabel,
        sub: region.status === 'loading' ? 'Applying…' : region.status === 'error' ? region.error ?? 'Could not load this place' : `Applied · ${size(region.bbox)}`,
      }
      : { icon: Move, title: name, sub: `${appliedLabel} applied now` };
  const StatusIcon = status.icon;

  return (
    <div className="pt-place">
      <div className="pt-mapbox pt-map">
        <div ref={host} className="pt-map-host" />
        {rect && (
          <div
            className={`pt-map-frame${resizing ? ' is-resizing' : ''}`}
            style={{ left: rect.left, top: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top }}
          >
            {HANDLES.map((h) => (
              <span
                key={h}
                className={`pt-frame-handle is-${h}`}
                data-handle={h}
                style={{ cursor: CURSOR[h] }}
                onPointerDown={onHandleDown(h)}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
              />
            ))}
          </div>
        )}
        <Menu.Root>
          <Menu.Trigger className="pt-map-badge" aria-label={`${candidate ? name : 'Go to a place'}${candidate && !problem ? `, ${size(candidate)}` : ''}. Choose a place`}>
            <MapPin size={13} strokeWidth={1.9} aria-hidden="true" />
            <b>{candidate ? name : 'Go to a place'}</b>
            {candidate && <span className={`pt-map-span${problem ? ' is-problem' : ''}`}>{problem ? limitMessage(problem) : size(candidate)}</span>}
            <ChevronDown size={13} strokeWidth={1.9} aria-hidden="true" className="pt-map-chev" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner side="bottom" align="start" sideOffset={6} className="pt-layer pt-layer-menu">
              <Menu.Popup className="pt-menu pt-glass">
                {PLACE_GROUPS.map((group) => (
                  <Menu.Group key={group} className="pt-menu-group">
                    <Menu.GroupLabel className="pt-menu-label">{group}</Menu.GroupLabel>
                    {PLACES.filter((city) => city.group === group).map((city) => (
                      <Menu.Item key={city.id} className="pt-menu-item" onClick={() => flyTo(city.id)}>
                        <b>{city.name}</b>
                        <small>{city.note}</small>
                      </Menu.Item>
                    ))}
                  </Menu.Group>
                ))}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
        <Credit />
        <div className="pt-place-foot">
          <div className="pt-status">
            <span className="pt-status-icon"><StatusIcon size={15} strokeWidth={1.75} /></span>
            <span className="pt-status-text">
              <b>{status.title}</b>
              <small>{status.sub}</small>
            </span>
          </div>
          <div className="pt-place-actions">
            {region.bbox ? <button type="button" className="pt-action pt-action-quiet pt-clear" onClick={region.clear}>Clear</button> : null}
            {applied ? (
              <button type="button" className="pt-action pt-apply is-done" disabled>
                <Check size={14} strokeWidth={2} aria-hidden="true" />
                {region.status === 'loading' ? 'Applying…' : 'Applied'}
              </button>
            ) : (
              <button type="button" className="pt-action pt-apply" disabled={!candidate || !!problem} onClick={apply}>Apply</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
