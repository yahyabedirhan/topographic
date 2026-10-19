import { GROUPS, PARAMS, clampParam, paramsIn, type GroupName, type GroupValues, type ParamDef } from './params.js';
import { QUALITIES, type QualityName } from './quality.js';
import { DEFAULT_SHAPE, findShape, type DeepPartialSettings, type ShapeId } from './shapes.js';
import type { Heightfield } from './heightfield.js';
import { findLocation, type LocationId } from './locations/builtin.js';

export type ThemeMode = 'auto' | 'light' | 'dark';
export interface ThemeSettings {
  mode: ThemeMode;
  /** Any CSS colour. Falls back to --topographic-ink, then the mode default. */
  ink?: string;
  /** Any CSS colour, or 'transparent'. Falls back to --topographic-paper, then the mode default. */
  paper?: string;
}

export type RenderMode = '2d' | '3d';
export type TerrainExtent = 'block' | 'endless';
export type CameraMotion = 'still' | 'orbit' | 'push' | 'flyover' | 'drone';

export interface CameraSettings {
  /** Degrees around the terrain. Any finite number; the view wraps. */
  azimuth: number;
  /** Degrees above the horizon. Never below the terrain. */
  elevation: number;
  /** Distance from the terrain centre. Smaller is closer. */
  radius: number;
  motion: CameraMotion;
  /**
   * Where the camera looks, moved from the terrain centre across the ground: east (x) and south (z),
   * in the terrain's units. 0, 0 is the centre. The renderer keeps the point over the terrain.
   */
  panX: number;
  panZ: number;
}

/**
 * The 2D map's own view, apart from the 3D camera: the field point at the centre of the view, x to
 * the right and y up, in the same units as the screen height at zoom 1, and the zoom. 3D ignores it.
 */
export interface View2dSettings {
  x: number;
  y: number;
  /** 1 shows the whole view; up to 8 is closer. */
  zoom: number;
}

export const CAMERA_MOTIONS: readonly CameraMotion[] = ['still', 'orbit', 'push', 'flyover', 'drone'];
export const DEFAULT_ELEVATION = 0.62;
export const DEFAULT_DETAIL = 0.5;
export const DEFAULT_CAMERA: CameraSettings = { azimuth: 349.7, elevation: 33.6, radius: 1.92, motion: 'still', panX: 0, panZ: 0 };
export const DEFAULT_VIEW2D: View2dSettings = { x: 0, y: 0, zoom: 1 };
export const DEFAULT_EXTENT: TerrainExtent = 'endless';

export interface Settings {
  shape: ShapeId;
  /** Integer seed; the same seed gives the same terrain. */
  seed: number;
  lines: GroupValues<'lines'>;
  terrain: GroupValues<'terrain'>;
  motion: GroupValues<'motion'>;
  layout: GroupValues<'layout'>;
  theme: ThemeSettings;
  /** 2D is the map. 3D is the same map as a terrain. */
  mode: RenderMode;
  /** 0 is flat like the 2D map. Higher values make the terrain taller, with a rounded crest. */
  elevation: number;
  extent: TerrainExtent;
  /** 0 is the coarsest mesh, 1 the finest. */
  detail: number;
  /**
   * Graphics budget. `auto` starts from the device and steps down if frames miss
   * 60 Hz, or 120 Hz once that refresh has been seen. The other values stay put.
   */
  quality: QualityName;
  camera: CameraSettings;
  view2d: View2dSettings;
  /**
   * A real place instead of the generated terrain: a built-in location id, or a height grid such as
   * one from fetchLocation(). A built-in location also brings its camera, elevation and extent,
   * under the values you set. null is the generated terrain.
   */
  location: LocationId | Heightfield | null;
}

export type SettingsInput = Omit<DeepPartialSettings, 'shape' | 'location'> & {
  shape?: string;
  location?: LocationId | (string & {}) | Heightfield | null;
};

const warned = new Set<string>();
export function resetWarnings(): void { warned.clear(); }
function warnOnce(msg: string): void {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[topographic] ${msg}`);
}

function groupDefaults<G extends GroupName>(g: G): GroupValues<G> {
  return Object.fromEntries(paramsIn(g).map((p) => [p.key, p.default])) as GroupValues<G>;
}

function stepped(value: unknown, min: number, max: number, fallback: number, step: number): number {
  let v = typeof value === 'string' ? Number(value) : (value as number);
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  v = Math.min(max, Math.max(min, Math.round(v / step) * step));
  return Number(v.toFixed(4));
}

function finiteStep(value: unknown, fallback: number, step: number): number {
  let v = typeof value === 'string' ? Number(value) : (value as number);
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Number((Math.round(v / step) * step).toFixed(4));
}

export function meshResolution(detail: number): number {
  const t = Math.min(1, Math.max(0, detail));
  return Math.round(32 + t * 128);
}

/**
 * A real place asks for a finer mesh than the procedural default so the coast stays smooth.
 * `cap` is the active quality tier. It wins over that floor so a phone never builds a 192² mesh.
 */
export function terrainSegments(detail: number, hasField: boolean, cap = 192): number {
  const limit = Math.min(255, Math.max(8, Math.round(cap)));
  const base = meshResolution(detail);
  const wanted = hasField ? Math.max(base, Math.min(192, limit)) : base;
  return Math.min(wanted, limit);
}

function clampCamera(input: Partial<CameraSettings> | undefined, base: CameraSettings): CameraSettings {
  const src = input ?? {};
  const motion = src.motion === undefined ? base.motion
    : CAMERA_MOTIONS.includes(src.motion) ? src.motion
      : (warnOnce(`unknown camera motion "${String(src.motion)}", using "${base.motion}"`), base.motion);
  return {
    azimuth: src.azimuth === undefined ? base.azimuth : finiteStep(src.azimuth, base.azimuth, 0.1),
    elevation: src.elevation === undefined ? base.elevation : stepped(src.elevation, 2, 80, base.elevation, 0.1),
    radius: src.radius === undefined ? base.radius : stepped(src.radius, RADIUS_MIN, RADIUS_MAX, base.radius, 0.01),
    motion,
    panX: src.panX === undefined ? base.panX : stepped(src.panX, -PAN_LIMIT, PAN_LIMIT, base.panX, 0.001),
    panZ: src.panZ === undefined ? base.panZ : stepped(src.panZ, -PAN_LIMIT, PAN_LIMIT, base.panZ, 0.001),
  };
}

/** The widest pan any view could need; the renderer clamps it to the terrain it draws. */
const PAN_LIMIT = 6;
/** The 3D camera's distance range, from close over the ground to far above it. */
export const RADIUS_MIN = 0.4;
export const RADIUS_MAX = 6.5;
/** The 2D zoom range: from the whole view to eight times closer. */
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 8;
/** How far the 2D view centre can move from the middle, in screen heights. */
const VIEW2D_LIMIT = 6;

function clampView2d(input: Partial<View2dSettings>, base: View2dSettings): View2dSettings {
  return {
    x: input.x === undefined ? base.x : stepped(input.x, -VIEW2D_LIMIT, VIEW2D_LIMIT, base.x, 0.001),
    y: input.y === undefined ? base.y : stepped(input.y, -VIEW2D_LIMIT, VIEW2D_LIMIT, base.y, 0.001),
    zoom: input.zoom === undefined ? base.zoom : stepped(input.zoom, ZOOM_MIN, ZOOM_MAX, base.zoom, 0.001),
  };
}

function applyView(into: Settings, input: SettingsInput | undefined): void {
  if (!input) return;
  if (input.mode !== undefined) {
    if (input.mode === '2d' || input.mode === '3d') into.mode = input.mode;
    else warnOnce(`unknown mode "${String(input.mode)}", using "${into.mode}"`);
  }
  if (input.elevation !== undefined) into.elevation = stepped(input.elevation, 0, 1, into.elevation, 0.01);
  if (input.extent !== undefined) {
    if (input.extent === 'block' || input.extent === 'endless') into.extent = input.extent;
    else warnOnce(`unknown extent "${String(input.extent)}", using "${into.extent}"`);
  }
  if (input.detail !== undefined) into.detail = stepped(input.detail, 0, 1, into.detail, 0.01);
  if (input.quality !== undefined) {
    if (QUALITIES.includes(input.quality)) into.quality = input.quality;
    else warnOnce(`unknown quality "${String(input.quality)}", using "${into.quality}"`);
  }
  if (input.camera) into.camera = clampCamera(input.camera, into.camera);
  if (input.view2d) into.view2d = clampView2d(input.view2d, into.view2d);
}

export function defaultSettings(): Settings {
  return {
    shape: DEFAULT_SHAPE, seed: 0,
    lines: groupDefaults('lines'), terrain: groupDefaults('terrain'),
    motion: groupDefaults('motion'), layout: groupDefaults('layout'),
    theme: { mode: 'auto' },
    mode: '2d', elevation: DEFAULT_ELEVATION, extent: DEFAULT_EXTENT, detail: DEFAULT_DETAIL,
    quality: 'auto',
    camera: { ...DEFAULT_CAMERA },
    view2d: { ...DEFAULT_VIEW2D },
    location: null,
  };
}

function isHeightfield(v: unknown): v is Heightfield {
  const f = v as Heightfield;
  return typeof v === 'object' && v !== null && f.samples instanceof Float32Array && Number.isInteger(f.size) && f.size > 0
    && f.samples.length === f.size * f.size;
}

function resolveLocation(location: SettingsInput['location']): Settings['location'] {
  if (location === null || location === undefined || location === '') return null;
  if (typeof location === 'string') {
    if (findLocation(location)) return location as LocationId;
    warnOnce(`unknown location "${location}", using the generated terrain`);
    return null;
  }
  if (isHeightfield(location)) return location;
  warnOnce('a location height grid needs samples, a Float32Array of size × size; using the generated terrain');
  return null;
}

/** Sets the location and, for a new built-in one, its view before the input's own view values. */
function applyLocation(into: Settings, input: SettingsInput): void {
  if (input.location === undefined) return;
  const next = resolveLocation(input.location);
  if (next === into.location) return;
  into.location = next;
  const builtin = typeof next === 'string' ? findLocation(next) : undefined;
  if (builtin) applyView(into, builtin.defaults);
}

function resolveShape(shape: string | undefined): ShapeId {
  if (shape === undefined) return DEFAULT_SHAPE;
  if (findShape(shape)) return shape as ShapeId;
  warnOnce(`unknown shape "${shape}", using "${DEFAULT_SHAPE}"`);
  return DEFAULT_SHAPE;
}

function applyGroups(into: Settings, input: SettingsInput | undefined): void {
  if (!input) return;
  for (const g of GROUPS) {
    const src = input[g] as Record<string, unknown> | undefined;
    if (!src) continue;
    for (const def of paramsIn(g)) {
      if (src[def.key] !== undefined) (into[g] as Record<string, number>)[def.key] = clampParam(def, src[def.key]);
    }
  }
  if (input.seed !== undefined) {
    const s = Math.round(Number(input.seed));
    into.seed = Number.isFinite(s) ? Math.max(0, s) % 1_000_000 : 0;
  }
  if (input.theme) into.theme = { ...into.theme, ...input.theme };
}

/** Defaults, then the shape's own defaults, then the input. Every number is clamped. */
export function resolveSettings(input: SettingsInput = {}): Settings {
  const out = defaultSettings();
  out.shape = resolveShape(input.shape);
  applyGroups(out, findShape(out.shape)?.defaults as SettingsInput | undefined);
  applyGroups(out, input);
  applyLocation(out, input);
  applyView(out, input);
  return out;
}

/** Merges a partial update into resolved settings. Changing the shape does not reset other values. */
export function mergeSettings(current: Settings, patch: SettingsInput): Settings {
  // A height grid is shared, not copied: it can be large, and the renderer only reads it.
  const out: Settings = { ...structuredClone({ ...current, location: null }), location: current.location };
  if (patch.shape !== undefined) out.shape = resolveShape(patch.shape);
  applyGroups(out, patch);
  applyLocation(out, patch);
  applyView(out, patch);
  return out;
}

export type ParamUniforms = { uParams: Float32Array; uCenter: number; uFade: number; uStyle: number; uSeed: number };

/** Settings -> shader uniform values (colours are handled by the theme). Pass `into` to reuse one buffer across frames. */
export function toUniforms(s: Settings, into?: Float32Array): ParamUniforms {
  const uParams = into ?? new Float32Array(16);
  if (into) into.fill(0);
  const out: ParamUniforms = { uParams, uCenter: 0, uFade: 0, uStyle: findShape(s.shape)!.index, uSeed: s.seed };
  for (const def of PARAMS as readonly ParamDef[]) {
    const raw = (s[def.group] as Record<string, number>)[def.key];
    const v = def.toUniform ? def.toUniform(raw) : raw;
    if (typeof def.slot === 'number') out.uParams[def.slot] = v;
    else out[def.slot] = v;
  }
  return out;
}

/** Reads settings from string attributes (as on <topographic-view>). Unknown attributes are ignored. */
export function fromAttributes(get: (name: string) => string | null): SettingsInput {
  const input: Record<string, unknown> = {};
  const shape = get('shape'); if (shape) input.shape = shape;
  const location = get('location'); if (location !== null) input.location = location || null;
  const seed = get('seed'); if (seed !== null) input.seed = Number(seed);
  for (const def of PARAMS as readonly ParamDef[]) {
    const v = get(def.attr);
    if (v !== null && v !== '') ((input[def.group] ??= {}) as Record<string, unknown>)[def.key] = Number(v);
  }
  const mode = get('theme'); const ink = get('ink'); const paper = get('paper');
  if (mode || ink || paper) input.theme = { ...(mode ? { mode } : {}), ...(ink ? { ink } : {}), ...(paper ? { paper } : {}) };
  const view = get('mode'); if (view) input.mode = view;
  const extent = get('extent'); if (extent) input.extent = extent;
  const elevation = get('elevation'); if (elevation !== null && elevation !== '') input.elevation = Number(elevation);
  const detail = get('detail'); if (detail !== null && detail !== '') input.detail = Number(detail);
  const quality = get('quality'); if (quality) input.quality = quality as QualityName;
  const azimuth = get('azimuth');
  const cameraElevation = get('camera-elevation');
  const radius = get('radius');
  const motion = get('camera-motion');
  const panX = get('pan-x');
  const panZ = get('pan-z');
  const has = (v: string | null) => v !== null && v !== '';
  if (has(azimuth) || has(cameraElevation) || has(radius) || motion || has(panX) || has(panZ)) {
    input.camera = {
      ...(has(panX) ? { panX: Number(panX) } : {}),
      ...(has(panZ) ? { panZ: Number(panZ) } : {}),
      ...(azimuth !== null && azimuth !== '' ? { azimuth: Number(azimuth) } : {}),
      ...(cameraElevation !== null && cameraElevation !== '' ? { elevation: Number(cameraElevation) } : {}),
      ...(radius !== null && radius !== '' ? { radius: Number(radius) } : {}),
      ...(motion ? { motion } : {}),
    };
  }
  const viewX = get('view-x');
  const viewY = get('view-y');
  const viewZoom = get('view-zoom');
  if (has(viewX) || has(viewY) || has(viewZoom)) {
    input.view2d = {
      ...(has(viewX) ? { x: Number(viewX) } : {}),
      ...(has(viewY) ? { y: Number(viewY) } : {}),
      ...(has(viewZoom) ? { zoom: Number(viewZoom) } : {}),
    };
  }
  return input as SettingsInput;
}

/** Attributes that differ from the defaults, for embed snippets. */
export function toAttributes(s: Settings): Record<string, string> {
  const d = resolveSettings({ shape: s.shape });
  const out: Record<string, string> = { shape: s.shape };
  if (typeof s.location === 'string') out.location = s.location;
  if (s.seed) out.seed = String(s.seed);
  for (const def of PARAMS as readonly ParamDef[]) {
    const v = (s[def.group] as Record<string, number>)[def.key];
    if (v !== (d[def.group] as Record<string, number>)[def.key]) out[def.attr] = String(v);
  }
  if (s.theme.mode !== 'auto') out.theme = s.theme.mode;
  if (s.theme.ink) out.ink = s.theme.ink;
  if (s.theme.paper) out.paper = s.theme.paper;
  if (s.mode !== '2d') out.mode = s.mode;
  if (s.extent !== d.extent) out.extent = s.extent;
  if (s.elevation !== d.elevation) out.elevation = String(s.elevation);
  if (s.detail !== d.detail) out.detail = String(s.detail);
  if (s.quality !== d.quality) out.quality = s.quality;
  if (s.camera.azimuth !== d.camera.azimuth) out.azimuth = String(s.camera.azimuth);
  if (s.camera.elevation !== d.camera.elevation) out['camera-elevation'] = String(s.camera.elevation);
  if (s.camera.radius !== d.camera.radius) out.radius = String(s.camera.radius);
  if (s.camera.motion !== d.camera.motion) out['camera-motion'] = s.camera.motion;
  if (s.camera.panX !== d.camera.panX) out['pan-x'] = String(s.camera.panX);
  if (s.camera.panZ !== d.camera.panZ) out['pan-z'] = String(s.camera.panZ);
  if (s.view2d.x !== d.view2d.x) out['view-x'] = String(s.view2d.x);
  if (s.view2d.y !== d.view2d.y) out['view-y'] = String(s.view2d.y);
  if (s.view2d.zoom !== d.view2d.zoom) out['view-zoom'] = String(s.view2d.zoom);
  return out;
}

/** Compact query string with only non-default values. */
export function toQuery(s: Settings): string {
  const d = resolveSettings({ shape: s.shape });
  const q = new URLSearchParams({ s: s.shape });
  if (s.seed) q.set('seed', String(s.seed));
  for (const def of PARAMS as readonly ParamDef[]) {
    const v = (s[def.group] as Record<string, number>)[def.key];
    if (v !== (d[def.group] as Record<string, number>)[def.key]) q.set(def.short, String(v));
  }
  if (s.theme.mode !== 'auto') q.set('m', s.theme.mode);
  if (s.theme.ink) q.set('ink', s.theme.ink);
  if (s.theme.paper) q.set('paper', s.theme.paper);
  if (s.mode !== '2d') q.set('mode', s.mode);
  if (s.extent !== d.extent) q.set('ex', s.extent);
  if (s.elevation !== d.elevation) q.set('ev', String(s.elevation));
  if (s.detail !== d.detail) q.set('dl', String(s.detail));
  if (s.quality !== d.quality) q.set('ql', s.quality);
  if (s.camera.azimuth !== d.camera.azimuth) q.set('az', String(s.camera.azimuth));
  if (s.camera.elevation !== d.camera.elevation) q.set('ce', String(s.camera.elevation));
  if (s.camera.radius !== d.camera.radius) q.set('rd', String(s.camera.radius));
  if (s.camera.motion !== d.camera.motion) q.set('cm', s.camera.motion);
  if (s.camera.panX !== d.camera.panX) q.set('px', String(s.camera.panX));
  if (s.camera.panZ !== d.camera.panZ) q.set('pz', String(s.camera.panZ));
  if (s.view2d.x !== d.view2d.x) q.set('vx', String(s.view2d.x));
  if (s.view2d.y !== d.view2d.y) q.set('vy', String(s.view2d.y));
  if (s.view2d.zoom !== d.view2d.zoom) q.set('vz', String(s.view2d.zoom));
  return q.toString();
}

export function fromQuery(query: string): SettingsInput {
  const q = new URLSearchParams(query);
  const byShort = new Map((PARAMS as readonly ParamDef[]).map((p) => [p.short, p.attr]));
  const viewShort: Record<string, string> = {
    elevation: 'ev', extent: 'ex', detail: 'dl', quality: 'ql', azimuth: 'az', 'camera-elevation': 'ce', radius: 'rd', 'camera-motion': 'cm', 'pan-x': 'px', 'pan-z': 'pz', 'view-x': 'vx', 'view-y': 'vy', 'view-zoom': 'vz',
  };
  return fromAttributes((name) => {
    if (name === 'shape') return q.get('s');
    if (name === 'theme') return q.get('m');
    if (name === 'mode') return q.get('mode');
    if (name === 'seed' || name === 'ink' || name === 'paper') return q.get(name);
    if (name in viewShort) return q.get(viewShort[name]);
    for (const [short, attr] of byShort) if (attr === name) return q.get(short);
    return null;
  });
}
