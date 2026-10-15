import { GROUPS, PARAMS, clampParam, paramsIn, type GroupName, type GroupValues, type ParamDef } from './params.js';
import { DEFAULT_STYLE, findStyle, type DeepPartialSettings, type StyleId } from './styles.js';

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

export const CAMERA_MOTIONS: readonly CameraMotion[] = ['still', 'orbit', 'push', 'flyover', 'drone'];
export const DEFAULT_ELEVATION = 0.62;
export const DEFAULT_DETAIL = 0.5;
export const DEFAULT_CAMERA: CameraSettings = { azimuth: 42, elevation: 34, radius: 2.45, motion: 'still', panX: 0, panZ: 0 };

export interface Settings {
  style: StyleId;
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
  camera: CameraSettings;
}

export type SettingsInput = Omit<DeepPartialSettings, 'style'> & { style?: string };

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

/** A real place uses a finer mesh than the procedural default so the coast stays smooth. */
export function terrainSegments(detail: number, hasField: boolean): number {
  const base = meshResolution(detail);
  return hasField ? Math.max(base, 192) : base;
}

function clampCamera(input: Partial<CameraSettings> | undefined, base: CameraSettings): CameraSettings {
  const src = input ?? {};
  const motion = src.motion === undefined ? base.motion
    : CAMERA_MOTIONS.includes(src.motion) ? src.motion
      : (warnOnce(`unknown camera motion "${String(src.motion)}", using "${base.motion}"`), base.motion);
  return {
    azimuth: src.azimuth === undefined ? base.azimuth : finiteStep(src.azimuth, base.azimuth, 0.1),
    elevation: src.elevation === undefined ? base.elevation : stepped(src.elevation, 2, 80, base.elevation, 0.1),
    radius: src.radius === undefined ? base.radius : stepped(src.radius, 1.15, 6.5, base.radius, 0.01),
    motion,
    panX: src.panX === undefined ? base.panX : stepped(src.panX, -PAN_LIMIT, PAN_LIMIT, base.panX, 0.001),
    panZ: src.panZ === undefined ? base.panZ : stepped(src.panZ, -PAN_LIMIT, PAN_LIMIT, base.panZ, 0.001),
  };
}

/** The widest pan any view could need; the renderer clamps it to the terrain it draws. */
const PAN_LIMIT = 6;

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
  if (input.camera) into.camera = clampCamera(input.camera, into.camera);
}

export function defaultSettings(): Settings {
  return {
    style: DEFAULT_STYLE, seed: 0,
    lines: groupDefaults('lines'), terrain: groupDefaults('terrain'),
    motion: groupDefaults('motion'), layout: groupDefaults('layout'),
    theme: { mode: 'auto' },
    mode: '2d', elevation: DEFAULT_ELEVATION, extent: 'block', detail: DEFAULT_DETAIL,
    camera: { ...DEFAULT_CAMERA },
  };
}

function resolveStyle(style: string | undefined): StyleId {
  if (style === undefined) return DEFAULT_STYLE;
  if (findStyle(style)) return style as StyleId;
  warnOnce(`unknown style "${style}", using "${DEFAULT_STYLE}"`);
  return DEFAULT_STYLE;
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

/** Defaults, then the style's own defaults, then the input. Every number is clamped. */
export function resolveSettings(input: SettingsInput = {}): Settings {
  const out = defaultSettings();
  out.style = resolveStyle(input.style);
  applyGroups(out, findStyle(out.style)?.defaults as SettingsInput | undefined);
  applyGroups(out, input);
  applyView(out, input);
  return out;
}

/** Merges a partial update into resolved settings. Changing style does not reset other values. */
export function mergeSettings(current: Settings, patch: SettingsInput): Settings {
  const out: Settings = structuredClone(current);
  if (patch.style !== undefined) out.style = resolveStyle(patch.style);
  applyGroups(out, patch);
  applyView(out, patch);
  return out;
}

export type ParamUniforms = { uParams: Float32Array; uCenter: number; uFade: number; uStyle: number; uSeed: number };

/** Settings -> shader uniform values (colours are handled by the theme). */
export function toUniforms(s: Settings): ParamUniforms {
  const out: ParamUniforms = { uParams: new Float32Array(16), uCenter: 0, uFade: 0, uStyle: findStyle(s.style)!.index, uSeed: s.seed };
  for (const def of PARAMS as readonly ParamDef[]) {
    const raw = (s[def.group] as Record<string, number>)[def.key];
    const v = def.toUniform ? def.toUniform(raw) : raw;
    if (typeof def.slot === 'number') out.uParams[def.slot] = v;
    else out[def.slot] = v;
  }
  return out;
}

/** Reads settings from string attributes (as on <topographic-bg>). Unknown attributes are ignored. */
export function fromAttributes(get: (name: string) => string | null): SettingsInput {
  const input: Record<string, unknown> = {};
  const style = get('style-name'); if (style) input.style = style;
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
  return input as SettingsInput;
}

/** Attributes that differ from the defaults, for embed snippets. */
export function toAttributes(s: Settings): Record<string, string> {
  const d = resolveSettings({ style: s.style });
  const out: Record<string, string> = { 'style-name': s.style };
  if (s.seed) out.seed = String(s.seed);
  for (const def of PARAMS as readonly ParamDef[]) {
    const v = (s[def.group] as Record<string, number>)[def.key];
    if (v !== (d[def.group] as Record<string, number>)[def.key]) out[def.attr] = String(v);
  }
  if (s.theme.mode !== 'auto') out.theme = s.theme.mode;
  if (s.theme.ink) out.ink = s.theme.ink;
  if (s.theme.paper) out.paper = s.theme.paper;
  if (s.mode !== '2d') out.mode = s.mode;
  if (s.extent !== 'block') out.extent = s.extent;
  if (s.elevation !== d.elevation) out.elevation = String(s.elevation);
  if (s.detail !== d.detail) out.detail = String(s.detail);
  if (s.camera.azimuth !== d.camera.azimuth) out.azimuth = String(s.camera.azimuth);
  if (s.camera.elevation !== d.camera.elevation) out['camera-elevation'] = String(s.camera.elevation);
  if (s.camera.radius !== d.camera.radius) out.radius = String(s.camera.radius);
  if (s.camera.motion !== d.camera.motion) out['camera-motion'] = s.camera.motion;
  if (s.camera.panX !== d.camera.panX) out['pan-x'] = String(s.camera.panX);
  if (s.camera.panZ !== d.camera.panZ) out['pan-z'] = String(s.camera.panZ);
  return out;
}

/** Compact query string with only non-default values. */
export function toQuery(s: Settings): string {
  const d = resolveSettings({ style: s.style });
  const q = new URLSearchParams({ s: s.style });
  if (s.seed) q.set('seed', String(s.seed));
  for (const def of PARAMS as readonly ParamDef[]) {
    const v = (s[def.group] as Record<string, number>)[def.key];
    if (v !== (d[def.group] as Record<string, number>)[def.key]) q.set(def.short, String(v));
  }
  if (s.theme.mode !== 'auto') q.set('m', s.theme.mode);
  if (s.theme.ink) q.set('ink', s.theme.ink);
  if (s.theme.paper) q.set('paper', s.theme.paper);
  if (s.mode !== '2d') q.set('mode', s.mode);
  if (s.extent !== 'block') q.set('ex', s.extent);
  if (s.elevation !== d.elevation) q.set('ev', String(s.elevation));
  if (s.detail !== d.detail) q.set('dl', String(s.detail));
  if (s.camera.azimuth !== d.camera.azimuth) q.set('az', String(s.camera.azimuth));
  if (s.camera.elevation !== d.camera.elevation) q.set('ce', String(s.camera.elevation));
  if (s.camera.radius !== d.camera.radius) q.set('rd', String(s.camera.radius));
  if (s.camera.motion !== d.camera.motion) q.set('cm', s.camera.motion);
  if (s.camera.panX !== d.camera.panX) q.set('px', String(s.camera.panX));
  if (s.camera.panZ !== d.camera.panZ) q.set('pz', String(s.camera.panZ));
  return q.toString();
}

export function fromQuery(query: string): SettingsInput {
  const q = new URLSearchParams(query);
  const byShort = new Map((PARAMS as readonly ParamDef[]).map((p) => [p.short, p.attr]));
  const viewShort: Record<string, string> = {
    elevation: 'ev', extent: 'ex', detail: 'dl', azimuth: 'az', 'camera-elevation': 'ce', radius: 'rd', 'camera-motion': 'cm', 'pan-x': 'px', 'pan-z': 'pz',
  };
  return fromAttributes((name) => {
    if (name === 'style-name') return q.get('s');
    if (name === 'theme') return q.get('m');
    if (name === 'mode') return q.get('mode');
    if (name === 'seed' || name === 'ink' || name === 'paper') return q.get(name);
    if (name in viewShort) return q.get(viewShort[name]);
    for (const [short, attr] of byShort) if (attr === name) return q.get(short);
    return null;
  });
}
