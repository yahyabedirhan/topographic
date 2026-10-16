import { useEffect, useMemo, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  GROUPS, STYLES, THEME_DEFAULTS, clampParam, mergeSettings, panBy, paramsIn, resolveMode, resolveSettings, rgbaToCss,
  type GroupName, type Heightfield, type ParamDef, type Settings, type SettingsInput, type TopographicBackground as Instance,
} from 'topographic';
import { TopographicBackground } from 'topographic-react';
import { anchorFromDrag } from './anchor';
import { bindPageUrlFlush, flushPageUrl, schedulePageUrl } from './page-history';
import { registerTools } from './webmcp';
import { configOf, readUrl } from './url';
import { withQuery, writeSettings } from './share-url';
import { LOOKS } from './looks';
import { keepShape } from './shape';
import { smooth } from './region/pipeline';

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
  const style = STYLES[Math.floor(Math.random() * STYLES.length)].id;
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const input: SettingsInput = {
    style,
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
  useEffect(() => {
    schedulePageUrl(withQuery(location.pathname, writeSettings(location.search, settings), location.hash));
    // A drag keeps the pointer down, so those writes stay on the trail. A click or a tool call flushes.
    if (!stagePointerBusy()) flushPageUrl();
  }, [settings]);
  useEffect(() => bindPageUrlFlush(), []);
  const latest = useRef(settings);
  latest.current = settings;
  useEffect(() => registerTools({ getSettings: () => latest.current, setSettings, instance: () => instance.current }), []);
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
      mode: from.mode, elevation: from.elevation, extent: from.extent, detail: from.detail, camera: from.camera,
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
    applyLook: (i) => setSettings((s) => mergeSettings(resolveSettings(LOOKS[i].settings), {
      mode: s.mode, elevation: s.elevation, extent: s.extent, detail: s.detail, camera: { motion: s.camera.motion },
    })),
  };
}

function terrainKey(s: Settings): string {
  const config = { ...configOf(s) } as Record<string, unknown>;
  delete config.mode;
  delete config.elevation;
  delete config.extent;
  delete config.detail;
  delete config.camera;
  return JSON.stringify(config);
}

const BENCHMARK = { benchmark: true as const };

const wrapDegrees = (n: number) => Number((((n % 360) + 360) % 360).toFixed(1));
const round3 = (n: number) => Number(n.toFixed(3));
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A wheel event from a trackpad's two-finger scroll, not a mouse wheel. Chrome and Safari report a
 * trackpad's legacy wheelDelta as -3 × deltaY, while a mouse notch is a multiple of 120.
 */
function fromTrackpad(e: WheelEvent): boolean {
  if (e.deltaMode !== 0) return false;
  if (e.deltaX !== 0) return true;
  const legacy = (e as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY;
  return typeof legacy === 'number' && legacy !== 0 && legacy === -3 * e.deltaY && legacy % 120 !== 0;
}

/**
 * The 3D view's pointer controls. A drag orbits. A two-finger scroll pans across the ground, and so
 * do a right drag, a Shift+drag and a two-finger touch drag. ⌘/Ctrl + scroll or a pinch zooms (a
 * pinch is a wheel with ctrlKey); Shift or Alt + scroll and a plain mouse wheel zoom too. A
 * double-click glides the pan back to the centre.
 */
function useOrbit(pg: Playground) {
  const live = useRef(pg);
  live.current = pg;
  const node = useRef<HTMLDivElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ id: number; x: number; y: number; azimuth: number; elevation: number } | null>(null);
  const pan = useRef<{ id: number; x: number; y: number; panX: number; panZ: number } | null>(null);
  const pinch = useRef<{ dist: number; radius: number; x: number; y: number; panX: number; panZ: number } | null>(null);
  const glide = useRef(0);
  const wheelPan = useRef(0);
  const layoutDrag = useRef<{ id: number; x: number; anchor: number } | null>(null);

  /** The pan after dragging (dx, dy) pixels from `from`, kept over the terrain. */
  const panned = (from: { panX: number; panZ: number }, dx: number, dy: number) => {
    const current = live.current;
    const t = current.instance.current;
    const pose = t?.pose ?? current.settings.camera;
    const [x, z] = panBy({ ...pose, ...from }, dx, dy, node.current?.clientHeight ?? innerHeight);
    const [panX, panZ] = t ? t.clampPan(x, z) : [x, z];
    return { panX: round3(panX), panZ: round3(panZ) };
  };
  const stopGlide = () => { cancelAnimationFrame(glide.current); glide.current = 0; };

  useEffect(() => {
    const el = node.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const current = live.current;
      if (current.settings.mode !== '3d') return;
      e.preventDefault();
      // A pinch on a trackpad arrives as a wheel with ctrlKey, and Shift, Command or Alt turn any
      // scroll into a zoom. macOS turns a vertical scroll with Shift held into deltaX, so the larger
      // axis is the amount.
      const now = performance.now();
      const zoom = e.ctrlKey || e.shiftKey || e.metaKey || e.altKey;
      if (!zoom && (now - wheelPan.current < 180 || fromTrackpad(e))) {
        wheelPan.current = now;
        stopGlide();
        const cam = current.settings.camera;
        current.change({ camera: panned({ panX: cam.panX, panZ: cam.panZ }, -e.deltaX, -e.deltaY) });
        return;
      }
      wheelPan.current = 0;
      const amount = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const radius = Math.min(6.5, Math.max(1.15, current.settings.camera.radius * Math.exp(amount * (e.ctrlKey ? 0.01 : 0.0011))));
      current.change({ camera: { radius: Number(radius.toFixed(2)), motion: 'still' } });
    };
    // A right drag pans, so the context menu stays shut over the 3D view.
    const onMenu = (e: MouseEvent) => { if (live.current.settings.mode === '3d') e.preventDefault(); };
    const onDouble = () => {
      const current = live.current;
      if (current.settings.mode !== '3d') return;
      const { panX, panZ } = current.settings.camera;
      if (!panX && !panZ) return;
      stopGlide();
      if (reducedMotion()) { current.change({ camera: { panX: 0, panZ: 0 } }); return; }
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / 420);
        const k = (1 - t) ** 3;
        live.current.change({ camera: { panX: round3(panX * k), panZ: round3(panZ * k) } });
        glide.current = t < 1 ? requestAnimationFrame(step) : 0;
      };
      glide.current = requestAnimationFrame(step);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', onMenu);
    el.addEventListener('dblclick', onDouble);
    return () => {
      stopGlide();
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onMenu);
      el.removeEventListener('dblclick', onDouble);
    };
  }, []);
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const current = live.current;
    if (current.settings.mode === '2d') {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      noteStagePointer(true);
      layoutDrag.current = { id: e.pointerId, x: e.clientX, anchor: current.settings.layout.anchor };
      return;
    }
    if (current.settings.mode !== '3d') return;
    stopGlide();
    e.currentTarget.setPointerCapture(e.pointerId);
    noteStagePointer(true);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const cam = current.settings.camera;
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y), radius: cam.radius,
        x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, panX: cam.panX, panZ: cam.panZ,
      };
      drag.current = null;
      pan.current = null;
      return;
    }
    if (e.button === 2 || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      pan.current = { id: e.pointerId, x: e.clientX, y: e.clientY, panX: cam.panX, panZ: cam.panZ };
      e.currentTarget.style.cursor = 'move';
      return;
    }
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, azimuth: cam.azimuth, elevation: cam.elevation };
  };
  const queued = useRef<Settings | null>(null);
  const flushId = useRef(0);
  // The canvas updates on this event. React, the URL and the sliders catch up once per frame.
  const push = (patch: SettingsInput) => {
    const current = live.current;
    const base = queued.current ?? current.settings;
    queued.current = mergeSettings(base, patch);
    current.instance.current?.update(patch);
    if (!flushId.current) flushId.current = requestAnimationFrame(() => {
      flushId.current = 0;
      const next = queued.current;
      queued.current = null;
      if (next) current.replace(next);
    });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const current = live.current;
    const lay = layoutDrag.current;
    if (lay && lay.id === e.pointerId && current.settings.mode === '2d') {
      push({ layout: { anchor: anchorFromDrag(lay.anchor, e.clientX - lay.x, e.currentTarget.clientWidth || innerWidth) } });
      return;
    }
    if (current.settings.mode !== '3d' || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const two = pinch.current;
    if (pointers.current.size >= 2 && two) {
      // Two fingers zoom by their spread and pan by their midpoint, together.
      const [a, b] = [...pointers.current.values()];
      const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const radius = Math.min(6.5, Math.max(1.15, two.radius * (two.dist / dist)));
      const moved = panned(two, (a.x + b.x) / 2 - two.x, (a.y + b.y) / 2 - two.y);
      push({ camera: { radius: Number(radius.toFixed(2)), ...moved } });
      return;
    }
    const held = pan.current;
    if (held && held.id === e.pointerId) {
      push({ camera: panned(held, e.clientX - held.x, e.clientY - held.y) });
      return;
    }
    const orbit = drag.current;
    if (!orbit || orbit.id !== e.pointerId) return;
    const azimuth = wrapDegrees(orbit.azimuth - (e.clientX - orbit.x) * 0.32);
    const elevation = Math.min(80, Math.max(2, orbit.elevation - (e.clientY - orbit.y) * 0.2));
    push({ camera: { azimuth, elevation: Number(elevation.toFixed(1)), motion: 'still' } });
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointers.current.has(e.pointerId) || layoutDrag.current?.id === e.pointerId) noteStagePointer(false);
    if (layoutDrag.current?.id === e.pointerId) layoutDrag.current = null;
    pointers.current.delete(e.pointerId);
    if (drag.current?.id === e.pointerId) drag.current = null;
    if (pan.current?.id === e.pointerId) { pan.current = null; e.currentTarget.style.cursor = ''; }
    if (pointers.current.size < 2) pinch.current = null;
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
    <TopographicBackground
      ref={orbit.node}
      className={`${className}${s.mode === '3d' ? ' is-3d' : ' is-2d'}`}
      aria-hidden="true"
      styleName={s.style}
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
      field: { ...field, samples: smooth(field.samples, field.size, 2.5) },
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

export function ColorPicker({ value, onChange, swatches }: { value: string; onChange: (hex: string) => void; swatches: string[] }) {
  const isHex = /^#[0-9a-f]{3,8}$/i.test(value);
  const [hsv, setHsv] = useState<[number, number, number]>(() => (isHex ? hexToHsv(value) : [220, 0.2, 0.8]));
  const [text, setText] = useState(value);
  useEffect(() => {
    setText(value);
    if (isHex && value.toLowerCase() !== hsvToHex(...hsv)) setHsv(hexToHsv(value));
  }, [value]);
  const set = (next: [number, number, number]) => { setHsv(next); onChange(hsvToHex(...next)); };
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
            style={{ background: c === 'transparent' ? undefined : c }} onClick={() => onChange(c)} />
        ))}
      </div>
      <input className="pt-hex" value={text} spellCheck={false} aria-label="Hex colour"
        onChange={(e) => { setText(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value); }} />
    </div>
  );
}

export function Wordmark({ children }: { children?: ReactNode }) {
  return (
    <div className="pt-wordmark">
      <a href="https://github.com/yahyabedirhan/topographic" target="_blank" rel="noreferrer" aria-label="topographic on GitHub">topographic</a>
      <a href="https://yahyapak.dev/projects/topographic" target="_blank" rel="noreferrer" className="pt-wordmark-site">yahyapak.dev</a>
      {children}
    </div>
  );
}
