import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  GROUPS, LOOKS, RADIUS_MAX, RADIUS_MIN, SHAPES, THEME_DEFAULTS, clampParam, mergeSettings, panBy, paramsIn, resolveMode, resolveSettings, rgbaToCss,
  type GroupName, type Heightfield, type ParamDef, type Settings, type SettingsInput, type Topography as Instance,
} from 'topographic';
import { Topography } from 'topographic-react';
import { isWheelNotch, notchZoom, pan2d, twoFingerKind, wheelZoom, zoom2d } from './gestures';
import { bindPageUrlFlush, flushPageUrl, schedulePageUrl } from './page-history';
import { pageBridge, registerTools } from './webmcp';
import { configOf, readUrl } from './url';
import { withQuery, writeSettings } from './share-url';
import { keepShape } from './shape';
import { smoothGrid } from 'topographic/locations';
import { track } from './analytics';

export interface Playground {
  settings: Settings;
  mode: 'light' | 'dark';
  change(patch: SettingsInput): void;
  applyLook(i: number): void;
  lookIndex: number;
  /** Rolls new settings. With keepShape, the generated shape stays (a map place is applied). */
  shuffle(keepShape?: boolean): void;
  /** Replaces every setting, for a saved terrain. */
  replace(next: Settings): void;
  instance: MutableRefObject<Instance | null>;
}

const PAIRS: { paper: string; ink: string; mode: 'light' | 'dark' }[] = [
  { paper: '#0b0b0d', ink: '#9fb0cc', mode: 'dark' },
  { paper: '#12141a', ink: '#c9c2b4', mode: 'dark' },
  { paper: '#16130f', ink: '#e0b089', mode: 'dark' },
  { paper: '#101614', ink: '#9dcec0', mode: 'dark' },
  { paper: '#16131a', ink: '#cbb6ea', mode: 'dark' },
  { paper: '#1a1214', ink: '#f0b2a8', mode: 'dark' },
  { paper: '#10151c', ink: '#a9c7e4', mode: 'dark' },
  { paper: '#141414', ink: '#e8e6e1', mode: 'dark' },
  { paper: '#f7f4ee', ink: '#3d4c63', mode: 'light' },
  { paper: '#efe6d6', ink: '#6b4630', mode: 'light' },
  { paper: '#e5eef0', ink: '#1e4650', mode: 'light' },
  { paper: '#f3efe6', ink: '#3c4a36', mode: 'light' },
  { paper: '#f6eef2', ink: '#5c3348', mode: 'light' },
  { paper: '#f4f1ea', ink: '#2c2c2a', mode: 'light' },
  { paper: '#e7e2d8', ink: '#3a342c', mode: 'light' },
];

function band(p: ParamDef): [number, number] {
  switch (p.key) {
    case 'opacity': return [0.32, 0.85];
    case 'count': return [16, 48];
    case 'width': return [0.12, 0.7];
    case 'speed': return [0.25, 1.6];
    case 'fade': return [0.15, 0.8];
    case 'sparkle': return [0, 0.7];
    case 'warp': return [0.15, 0.8];
    default: return [p.min, p.max];
  }
}

function rollSettings(): Settings {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)].id;
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const input: SettingsInput = {
    shape,
    seed: 1 + Math.floor(Math.random() * 99999),
    theme: { mode: pair.mode, ink: pair.ink, paper: pair.paper },
  };
  for (const g of GROUPS) {
    const values: Record<string, number> = {};
    for (const p of paramsIn(g)) {
      const [lo, hi] = band(p);
      const steps = Math.max(1, Math.round((hi - lo) / p.step));
      const raw = lo + Math.floor(Math.random() * (steps + 1)) * p.step;
      const snapped = p.integer ? Math.round(raw) : Number((Math.round(raw / p.step) * p.step).toFixed(4));
      values[p.key] = clampParam(p, snapped);
    }
    (input as Record<string, unknown>)[g] = values;
  }
  return resolveSettings(input);
}

function glide(from: Settings, goal: Settings, t: number): Settings {
  const e = t * t * (3 - 2 * t);
  const next = structuredClone(goal);
  for (const g of GROUPS) {
    for (const p of paramsIn(g)) {
      const a = (from[g] as Record<string, number>)[p.key];
      const b = (goal[g] as Record<string, number>)[p.key];
      const n = a + (b - a) * e;
      (next[g] as Record<string, number>)[p.key] = p.integer ? Math.round(n) : Number(n.toFixed(3));
    }
  }
  return next;
}

export function usePlayground(): Playground {
  const [settings, setSettings] = useState<Settings>(readUrl);
  const instance = useRef<Instance | null>(null);
  const [prefersDark, setPrefersDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setPrefersDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const mode = resolveMode(settings.theme.mode, prefersDark);
  useEffect(() => { document.documentElement.dataset.theme = mode; }, [mode]);
  useLayoutEffect(() => {
    schedulePageUrl(withQuery(location.pathname, writeSettings(location.search, settings), location.hash));
    // A drag keeps the pointer down, so those writes stay on the trail. A click or a tool call flushes.
    if (!stagePointerBusy()) flushPageUrl();
  }, [settings]);
  useEffect(() => bindPageUrlFlush(), []);
  const latest = useRef(settings);
  latest.current = settings;
  useEffect(() => registerTools(pageBridge(latest, setSettings, () => instance.current)), []);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const lookIndex = useMemo(() => {
    const key = terrainKey(settings);
    return LOOKS.findIndex((look) => terrainKey(resolveSettings(look.settings)) === key);
  }, [settings]);

  const shuffle = (keep = false) => {
    cancelAnimationFrame(frame.current);
    const from = latest.current;
    const rolled = mergeSettings(rollSettings(), {
      mode: from.mode, elevation: from.elevation, extent: from.extent, detail: from.detail, quality: from.quality, camera: from.camera, view2d: from.view2d,
    });
    const goal = keep ? keepShape(rolled, from) : rolled;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSettings(goal);
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 520);
      setSettings(t >= 1 ? goal : glide(from, goal, t));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  return {
    settings, mode, instance, lookIndex, shuffle,
    change: (patch) => setSettings((s) => mergeSettings(s, patch)),
    replace: (next) => { cancelAnimationFrame(frame.current); setSettings(next); },
    // A look keeps the 3D view settings but always starts from its default camera pose; the motion stays.
    applyLook: (i) => setSettings((s) => mergeSettings(resolveSettings({ look: LOOKS[i].id }), {
      mode: s.mode, elevation: s.elevation, extent: s.extent, detail: s.detail, quality: s.quality, camera: { motion: s.camera.motion },
    })),
  };
}

function terrainKey(s: Settings): string {
  const config = { ...configOf(s) } as Record<string, unknown>;
  delete config.mode;
  delete config.elevation;
  delete config.extent;
  delete config.detail;
  delete config.quality;
  delete config.camera;
  delete config.view2d;
  return JSON.stringify(config);
}

const BENCHMARK = { benchmark: true as const };

const wrapDegrees = (n: number) => Number((((n % 360) + 360) % 360).toFixed(1));
const round3 = (n: number) => Number(n.toFixed(3));
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Two fingers on the view: where they started and the view then. */
interface TwoFingers {
  dist: number;
  angle: number;
  x: number;
  y: number;
  at: number;
  kind: 'tilt' | 'pinch' | null;
  camera: Settings['camera'];
  view2d: Settings['view2d'];
}

/**
 * The view's pointer controls, in the convention of Google Maps and Google Earth. A drag, or one
 * finger, moves the terrain. A scroll, a pinch or ⌘/Ctrl + scroll zooms. In 3D, ⌘, Ctrl or Shift +
 * drag and a right drag rotate and tilt; on touch, two fingers twist to rotate and move up or down
 * together to tilt. A double tap zooms in and a two finger tap zooms out. A double click glides
 * the pan back to the centre. 2D pans and zooms the flat map the same way.
 */
function useOrbit(pg: Playground) {
  const live = useRef(pg);
  live.current = pg;
  const node = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ id: number; x: number; y: number; azimuth: number; elevation: number } | null>(null);
  const pan = useRef<{ id: number; x: number; y: number; panX: number; panZ: number; view2d: Settings['view2d']; at: number; touch: boolean; moved: boolean } | null>(null);
  const two = useRef<TwoFingers | null>(null);
  const lastTap = useRef<{ at: number; x: number; y: number } | null>(null);
  const lastPointer = useRef('mouse');
  const glide = useRef(0);
  const queued = useRef<Settings | null>(null);
  const flushId = useRef(0);

  // A flushed change waits here until React renders it, so a gesture's next frame builds on it.
  const flushed = useRef<Settings | null>(null);
  const seen = useRef(pg.settings);
  if (pg.settings !== seen.current) { seen.current = pg.settings; flushed.current = null; }

  const height = () => node.current?.clientHeight || innerHeight;
  /** The settings with any change React has not rendered yet. */
  const now = () => queued.current ?? flushed.current ?? live.current.settings;
  // The canvas updates on this event. React, the URL and the sliders catch up once per frame.
  const push = (patch: SettingsInput) => {
    const current = live.current;
    queued.current = mergeSettings(now(), patch);
    current.instance.current?.update(patch);
    if (!flushId.current) flushId.current = requestAnimationFrame(() => {
      flushId.current = 0;
      const next = queued.current;
      queued.current = null;
      if (next) { flushed.current = next; current.replace(next); }
    });
  };

  /** How far the 2D view centre may go: half the view, so some of the terrain stays on screen. */
  const half2d = (): [number, number] => {
    const el = node.current;
    return [(el?.clientWidth || innerWidth) / height() / 2, 0.5];
  };
  /** The 3D pan after dragging (dx, dy) pixels from `from`, kept over the terrain. */
  const panned = (from: { panX: number; panZ: number }, dx: number, dy: number) => {
    const t = live.current.instance.current;
    const pose = t?.pose ?? now().camera;
    const [x, z] = panBy({ ...pose, ...from }, dx, dy, height());
    const [panX, panZ] = t ? t.clampPan(x, z) : [x, z];
    return { panX: round3(panX), panZ: round3(panZ) };
  };

  /** Zooms by `factor` (above 1 is closer): 2D around the screen point (x, y), 3D toward the centre. */
  const zoomBy = (factor: number, x?: number, y?: number) => {
    const s = now();
    if (s.mode === '2d') {
      const r = node.current?.getBoundingClientRect();
      const ox = r && x !== undefined ? x - r.left - r.width / 2 : 0;
      const oy = r && y !== undefined ? y - r.top - r.height / 2 : 0;
      push({ view2d: zoom2d(s.view2d, s.view2d.zoom * factor, ox, oy, height(), half2d()) });
      return;
    }
    const radius = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, s.camera.radius / factor));
    push({ camera: { radius: Number(radius.toFixed(2)), motion: 'still' } });
  };

  const stopGlide = () => { cancelAnimationFrame(glide.current); glide.current = 0; };
  const wheelGoal = useRef<{ log: number; x: number; y: number } | null>(null);
  const wheelFrame = useRef(0);
  const stopWheel = () => { cancelAnimationFrame(wheelFrame.current); wheelFrame.current = 0; wheelGoal.current = null; };
  /** Eases toward the zoom a mouse wheel's notches asked for. Quick notches add up. */
  const easeWheel = (factor: number, x: number, y: number) => {
    if (reducedMotion()) { zoomBy(factor, x, y); return; }
    wheelGoal.current = { log: (wheelGoal.current?.log ?? 0) + Math.log(factor), x, y };
    if (wheelFrame.current) return;
    const step = () => {
      const goal = wheelGoal.current;
      if (!goal || Math.abs(goal.log) < 1e-4) { stopWheel(); return; }
      const part = Math.abs(goal.log) < 0.01 ? goal.log : goal.log * 0.3;
      zoomBy(Math.exp(part), goal.x, goal.y);
      goal.log -= part;
      wheelFrame.current = requestAnimationFrame(step);
    };
    wheelFrame.current = requestAnimationFrame(step);
  };
  /** A short eased zoom, for taps. */
  const glideZoom = (factor: number, x?: number, y?: number) => {
    stopGlide();
    if (reducedMotion()) { zoomBy(factor, x, y); return; }
    const t0 = performance.now();
    let done = 0;
    const step = (at: number) => {
      const t = Math.min(1, (at - t0) / 240);
      const e = 1 - (1 - t) ** 3;
      zoomBy(factor ** (e - done), x, y);
      done = e;
      glide.current = t < 1 ? requestAnimationFrame(step) : 0;
    };
    glide.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const el = node.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const mode = live.current.settings.mode;
      if (mode !== '2d' && mode !== '3d') return;
      e.preventDefault();
      stopGlide();
      // A mouse notch is one big step, eased; a trackpad's scroll and pinch follow the fingers.
      if (isWheelNotch(e as WheelEvent & { wheelDeltaY?: number })) { easeWheel(notchZoom(e), e.clientX, e.clientY); return; }
      stopWheel();
      // macOS turns a vertical scroll with Shift held into deltaX.
      const delta = e.deltaY || e.deltaX;
      zoomBy(wheelZoom(delta, e.deltaMode, e.ctrlKey), e.clientX, e.clientY);
    };
    // A right drag rotates, so the context menu stays shut over the 3D view.
    const onMenu = (e: MouseEvent) => { if (live.current.settings.mode === '3d') e.preventDefault(); };
    // A double tap zooms in instead; touch browsers can send a double click after it.
    const onDouble = () => {
      if (lastPointer.current === 'touch') return;
      const s = now();
      const flat = s.mode === '2d';
      const [a, b] = flat ? [s.view2d.x, s.view2d.y] : [s.camera.panX, s.camera.panZ];
      if (!a && !b) return;
      const at = (k: number): SettingsInput => (flat
        ? { view2d: { x: round3(a * k), y: round3(b * k) } }
        : { camera: { panX: round3(a * k), panZ: round3(b * k) } });
      stopGlide();
      if (reducedMotion()) { push(at(0)); return; }
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / 420);
        const k = (1 - t) ** 3;
        push(at(k));
        glide.current = t < 1 ? requestAnimationFrame(step) : 0;
      };
      glide.current = requestAnimationFrame(step);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', onMenu);
    el.addEventListener('dblclick', onDouble);
    return () => {
      stopGlide();
      stopWheel();
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onMenu);
      el.removeEventListener('dblclick', onDouble);
    };
  }, []);

  const startTwo = () => {
    const [a, b] = [...pointers.current.values()];
    two.current = {
      dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), angle: Math.atan2(b.y - a.y, b.x - a.x),
      x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, at: performance.now(), kind: null, camera: now().camera, view2d: now().view2d,
    };
    drag.current = null;
    pan.current = null;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const mode = live.current.settings.mode;
    if (mode !== '2d' && mode !== '3d') return;
    lastPointer.current = e.pointerType;
    stopGlide();
    stopWheel();
    e.currentTarget.setPointerCapture(e.pointerId);
    noteStagePointer(true);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2) { startTwo(); return; }
    const { camera: cam, view2d } = now();
    if (mode === '3d' && (e.button === 2 || e.button === 1 || e.metaKey || e.ctrlKey || e.shiftKey)) {
      drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, azimuth: cam.azimuth, elevation: cam.elevation };
      e.currentTarget.style.cursor = 'move';
      return;
    }
    if (e.button !== 0) return;
    pan.current = {
      id: e.pointerId, x: e.clientX, y: e.clientY, panX: cam.panX, panZ: cam.panZ, view2d,
      at: performance.now(), touch: e.pointerType === 'touch', moved: false,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const fingers = two.current;
    if (pointers.current.size >= 2 && fingers) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const midDx = (a.x + b.x) / 2 - fingers.x;
      const midDy = (a.y + b.y) / 2 - fingers.y;
      const is3d = now().mode === '3d';
      fingers.kind ??= is3d ? twoFingerKind(midDx, midDy, dist / fingers.dist) : twoFingerKind(midDx, 0, dist / fingers.dist) && 'pinch';
      const cam = fingers.camera;
      if (fingers.kind === 'tilt') {
        // Fingers up lay the view down toward the horizon, as in Google Maps.
        const elevation = Math.min(80, Math.max(2, cam.elevation + midDy * 0.25));
        push({ camera: { elevation: Number(elevation.toFixed(1)), motion: 'still' } });
      } else if (fingers.kind === 'pinch') {
        const spread = dist / fingers.dist;
        if (is3d) {
          const turn = (Math.atan2(b.y - a.y, b.x - a.x) - fingers.angle) * 180 / Math.PI;
          const radius = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, cam.radius / spread));
          push({ camera: { radius: Number(radius.toFixed(2)), azimuth: wrapDegrees(cam.azimuth + turn), motion: 'still', ...panned(cam, midDx, midDy) } });
        } else {
          const r = node.current?.getBoundingClientRect();
          const v = fingers.view2d;
          const zoomed = zoom2d(v, v.zoom * spread, fingers.x - (r?.left ?? 0) - (r?.width ?? 0) / 2, fingers.y - (r?.top ?? 0) - (r?.height ?? 0) / 2, height(), half2d());
          push({ view2d: pan2d(zoomed, midDx, midDy, height(), half2d()) });
        }
      }
      return;
    }
    const held = pan.current;
    if (held && held.id === e.pointerId) {
      if (Math.hypot(e.clientX - held.x, e.clientY - held.y) > 6) held.moved = true;
      const dx = e.clientX - held.x, dy = e.clientY - held.y;
      push(now().mode === '2d' ? { view2d: pan2d(held.view2d, dx, dy, height(), half2d()) } : { camera: panned(held, dx, dy) });
      return;
    }
    const orbit = drag.current;
    if (!orbit || orbit.id !== e.pointerId) return;
    const azimuth = wrapDegrees(orbit.azimuth - (e.clientX - orbit.x) * 0.32);
    const elevation = Math.min(80, Math.max(2, orbit.elevation - (e.clientY - orbit.y) * 0.2));
    push({ camera: { azimuth, elevation: Number(elevation.toFixed(1)), motion: 'still' } });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (flushId.current) { cancelAnimationFrame(flushId.current); flushId.current = 0; }
    const pendingSettings = queued.current;
    queued.current = null;
    if (pointers.current.has(e.pointerId)) noteStagePointer(false);
    if (pendingSettings) live.current.replace(pendingSettings);
    const fingers = two.current;
    // Two fingers that tap and lift without moving zoom out.
    if (fingers && !fingers.kind && performance.now() - fingers.at < 300) glideZoom(1 / 1.6);
    const held = pan.current;
    if (held?.id === e.pointerId && held.touch && !held.moved && performance.now() - held.at < 300) {
      const tap = lastTap.current;
      if (tap && performance.now() - tap.at < 320 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 30) {
        lastTap.current = null;
        glideZoom(1.6, e.clientX, e.clientY);
      } else lastTap.current = { at: performance.now(), x: e.clientX, y: e.clientY };
    }
    pointers.current.delete(e.pointerId);
    if (drag.current?.id === e.pointerId) { drag.current = null; e.currentTarget.style.cursor = ''; }
    if (held?.id === e.pointerId) pan.current = null;
    if (pointers.current.size < 2) two.current = null;
  };
  return { node, onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
}

/** Bands of page UI over the stage: the wordmark and cluster at the top, the dock at the bottom. */
const TOP_BANDS = ['.pt-top', '.pt-wordmark'];
const BOTTOM_BANDS = ['.pt-dock-wrap'];

/**
 * Keeps the 3D view centred in the part of the window the UI leaves free. The minimap and readout
 * are small corners, so they don't count.
 */
function useStageInsets(pg: Playground) {
  const apply = useRef(() => {});
  useEffect(() => {
    const measure = () => {
      const t = pg.instance.current;
      if (!t) return;
      const height = innerHeight;
      let top = 0, bottom = 0;
      for (const sel of TOP_BANDS) for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.top < height / 2) top = Math.max(top, r.bottom);
      }
      for (const sel of BOTTOM_BANDS) for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.bottom > height / 2) bottom = Math.max(bottom, height - r.top);
      }
      t.setInsets({ top, bottom });
    };
    apply.current = measure;
    const observer = new ResizeObserver(measure);
    for (const sel of [...TOP_BANDS, ...BOTTOM_BANDS]) for (const el of document.querySelectorAll(sel)) observer.observe(el);
    addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); removeEventListener('resize', measure); };
  }, [pg.instance]);
  return apply;
}

export function Backdrop({ pg, hold = false, className = 'pt-stage' }: { pg: Playground; hold?: boolean; className?: string }) {
  const s = pg.settings;
  const orbit = useOrbit(pg);
  const insets = useStageInsets(pg);
  useEffect(() => { pg.instance.current?.hold(hold); }, [hold, pg.instance]);
  return (
    <Topography
      ref={orbit.node}
      className={`${className}${s.mode === '3d' ? ' is-3d' : ' is-2d'}`}
      aria-hidden="true"
      shape={s.shape}
      seed={s.seed}
      lines={s.lines}
      terrain={s.terrain}
      motion={s.motion}
      layout={s.layout}
      theme={s.theme}
      mode={s.mode}
      elevation={s.elevation}
      extent={s.extent}
      detail={s.detail}
      quality={s.quality}
      camera={s.camera}
      options={BENCHMARK}
      onPointerDown={orbit.onPointerDown}
      onPointerMove={orbit.onPointerMove}
      onPointerUp={orbit.onPointerUp}
      onPointerCancel={orbit.onPointerCancel}
      onReady={(t) => { pg.instance.current = t; attachLiveRenderer(t); if (t) { t.hold(hold); insets.current(); } }}
    />
  );
}

/** Dock thumbnails draw the 2D map a little bolder and centred, so the lines read at 84 × 48. */
function thumbSettings(r: Settings): SettingsInput {
  return {
    ...r,
    mode: '2d',
    layout: { ...r.layout, anchor: 1, fade: 0 },
    lines: {
      ...r.lines,
      count: Math.max(12, Math.round(r.lines.count * 0.8)),
      width: Math.max(0.06, r.lines.width * 0.62),
      opacity: Math.min(1, r.lines.opacity * 1.25),
    },
  };
}

/** The page's one WebGL context. Dock pictures borrow it instead of opening a second one. */
let liveRenderer: Instance | null = null;
export function attachLiveRenderer(t: Instance | null): void {
  liveRenderer = t;
}

let thumbQueue: Promise<unknown> = Promise.resolve();
function enqueueThumb<T>(job: () => Promise<T>): Promise<T> {
  const run = thumbQueue.then(job, job);
  thumbQueue = run.then(() => undefined, () => undefined);
  return run;
}

/** True while a finger or button is down on the stage, so thumbnail readbacks wait. */
let stagePointers = 0;
export function noteStagePointer(down: boolean): void {
  stagePointers = Math.max(0, stagePointers + (down ? 1 : -1));
}
export const stagePointerBusy = () => stagePointers > 0;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useLookThumbs(width = 168, height = 96): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    let dead = false;
    const made: string[] = [];
    // The live view is the only WebGL context. A second one, even a tiny one, is what gets iOS to
    // kill the tab a few seconds after load. Pictures are borrowed one at a time, after first paint.
    const run = async () => {
      const opened = performance.now();
      while (!dead && !liveRenderer) {
        if (performance.now() - opened > 8000) return;
        await wait(40);
      }
      await wait(1200);
      for (const look of LOOKS) {
        while (!dead && stagePointerBusy()) await wait(80);
        const t = liveRenderer;
        if (dead || !t) return;
        try {
          const blob = await enqueueThumb(() => t.snapshot({
            frame: 4000, width, height, patch: thumbSettings(resolveSettings(look.settings)),
          }));
          const url = URL.createObjectURL(blob);
          made.push(url);
          if (!dead) setUrls([...made]);
        } catch { /* the view was lost; leave the empty slot */ }
        await wait(80);
      }
    };
    void run();
    return () => {
      dead = true;
      for (const url of made) URL.revokeObjectURL(url);
    };
  }, [width, height]);
  return urls;
}

/**
 * A place drawn at 84 × 48 needs fewer, bolder lines than a look: the full count turns into a solid
 * hatch at that size. The sparkle beads are off, since they read as diagonal stripes on a heightfield.
 */
function placeThumbSettings(r: Settings): SettingsInput {
  const base = thumbSettings(r);
  return {
    ...base,
    lines: { ...r.lines, count: Math.min(14, Math.max(9, Math.round(r.lines.count * 0.35))), width: Math.max(0.3, r.lines.width), opacity: 1 },
    motion: { ...r.motion, sparkle: 0 },
  };
}

/**
 * A saved map terrain's dock picture: the place's heights in its own settings, cropped to fill the
 * thumbnail like a look's picture does, with no paper margin around the place. Returns a small WebP
 * (or JPEG) data URL that fits in localStorage, or null.
 */
export async function placeThumb(settings: Settings, field: Heightfield, width = 168, height = 96): Promise<string | null> {
  const t = liveRenderer;
  if (!t) return null;
  // Draw the place at its own aspect and twice the size, large enough to cover the thumbnail, then
  // crop the middle and scale it down, which smooths the thin lines like a look's picture.
  const aspect = Math.max(field.aspect || 1, 0.05);
  const SS = 2;
  const drawW = Math.round((aspect > width / height ? height * aspect : width) * SS);
  const drawH = Math.round((aspect > width / height ? height : width / aspect) * SS);
  try {
    const blob = await enqueueThumb(() => t.snapshot({
      frame: 4000, width: drawW, height: drawH,
      patch: placeThumbSettings(settings),
      field: { ...field, samples: smoothGrid(field.samples, field.size, 2.5) },
    }));
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, (drawW - width * SS) / 2, (drawH - height * SS) / 2, width * SS, height * SS, 0, 0, width, height);
    bitmap.close();
    const webp = canvas.toDataURL('image/webp', 0.86);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.86);
  } catch {
    return null;
  }
}

export const GROUP_LABELS: Record<GroupName, string> = { lines: 'Lines', terrain: 'Terrain', motion: 'Motion', layout: 'Layout' };

const clamp01 = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export function hexToHsv(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  const f = n.length === 3 ? n.split('').map((c) => c + c).join('') : n.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, max === 0 ? 0 : d / max, max];
}
export function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

export function rollColour(which: 'ink' | 'paper'): string {
  const h = Math.random() * 360;
  if (which === 'ink') return hsvToHex(h, 0.18 + Math.random() * 0.5, 0.42 + Math.random() * 0.5);
  const light = Math.random() < 0.5;
  return hsvToHex(h, Math.random() * 0.2, light ? 0.88 + Math.random() * 0.1 : 0.04 + Math.random() * 0.08);
}
const cssToHex = (css: string) => '#' + css.match(/[\d.]+/g)!.slice(0, 3).map((v) => Number(v).toString(16).padStart(2, '0')).join('');

export const INK_SWATCHES = ['#9fb0cc', '#c9c2b4', '#7fa89a', '#d39a7a', '#b3a1d6', '#e8e6e1', '#5d6b82', '#2b2b2b'];
export const PAPER_SWATCHES = ['#0b0b0d', '#14161b', '#1d1a17', '#f9f8f6', '#efe9df', '#e6ecef', 'transparent'];

export function currentColour(pg: Playground, which: 'ink' | 'paper'): string {
  const v = pg.settings.theme[which];
  return v ?? cssToHex(rgbaToCss(THEME_DEFAULTS[pg.mode][which]));
}

export type ColourSource = 'picker' | 'swatch' | 'hex';

export function ColorPicker({ value, onChange, swatches }: { value: string; onChange: (hex: string, source: ColourSource) => void; swatches: string[] }) {
  const isHex = /^#[0-9a-f]{3,8}$/i.test(value);
  const [hsv, setHsv] = useState<[number, number, number]>(() => (isHex ? hexToHsv(value) : [220, 0.2, 0.8]));
  const [text, setText] = useState(value);
  useEffect(() => {
    setText(value);
    if (isHex && value.toLowerCase() !== hsvToHex(...hsv)) setHsv(hexToHsv(value));
  }, [value]);
  const set = (next: [number, number, number]) => { setHsv(next); onChange(hsvToHex(...next), 'picker'); };
  const drag = (el: HTMLElement, e: ReactPointerEvent, fn: (x: number, y: number) => void) => {
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent | ReactPointerEvent) => {
      const r = el.getBoundingClientRect();
      fn(clamp01((ev.clientX - r.left) / r.width), clamp01((ev.clientY - r.top) / r.height));
    };
    move(e);
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
  };
  const [h, s, v] = hsv;
  return (
    <div className="pt-picker">
      <div className="pt-sv" style={{ background: `hsl(${h} 100% 50%)` }}
        onPointerDown={(e) => drag(e.currentTarget, e, (x, y) => set([h, x, 1 - y]))}>
        <i style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, background: hsvToHex(h, s, v) }} />
      </div>
      <div className="pt-hue" onPointerDown={(e) => drag(e.currentTarget, e, (x) => set([x * 360, s, v]))}>
        <i style={{ left: `${(h / 360) * 100}%`, background: `hsl(${h} 100% 50%)` }} />
      </div>
      <div className="pt-swatches">
        {swatches.map((c) => (
          <button key={c} type="button" aria-label={c} className={`pt-swatch ${c === value ? 'is-on' : ''} ${c === 'transparent' ? 'clear' : ''}`}
            style={{ background: c === 'transparent' ? undefined : c }} onClick={() => onChange(c, 'swatch')} />
        ))}
      </div>
      <input className="pt-hex" value={text} spellCheck={false} aria-label="Hex colour"
        onChange={(e) => { setText(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value, 'hex'); }} />
    </div>
  );
}

const GITHUB = 'https://github.com/yahyabedirhan/topographic';
const SITE = 'https://yahyapak.dev/projects/topographic';

export function Wordmark({ children }: { children?: ReactNode }) {
  return (
    <div className="pt-wordmark">
      <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="topographic on GitHub" onClick={() => track('ui_click', { section: 'header', target: 'github', href: GITHUB, outbound: true })}>topographic</a>
      <a href={SITE} target="_blank" rel="noreferrer" className="pt-wordmark-site" onClick={() => track('ui_click', { section: 'header', target: 'site', href: SITE, outbound: true })}>yahyapak.dev</a>
      <span className="pt-wordmark-pages">
        <a href={`${import.meta.env.BASE_URL}about`} className="pt-wordmark-site pt-wordmark-privacy">About</a>
        <a href={`${import.meta.env.BASE_URL}docs`} className="pt-wordmark-site pt-wordmark-privacy">Docs</a>
      </span>
      {children}
    </div>
  );
}
