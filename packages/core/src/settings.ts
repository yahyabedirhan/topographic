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

export interface Settings {
  style: StyleId;
  /** Integer seed; the same seed gives the same terrain. */
  seed: number;
  lines: GroupValues<'lines'>;
  terrain: GroupValues<'terrain'>;
  motion: GroupValues<'motion'>;
  layout: GroupValues<'layout'>;
  theme: ThemeSettings;
}

export type SettingsInput = Omit<DeepPartialSettings, 'style'> & { style?: string };

const warned = new Set<string>();
/** Test hook: forget which warnings were already printed. */
export function resetWarnings(): void { warned.clear(); }
function warnOnce(msg: string): void {
  if (warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[topographic] ${msg}`);
}

function groupDefaults<G extends GroupName>(g: G): GroupValues<G> {
  return Object.fromEntries(paramsIn(g).map((p) => [p.key, p.default])) as GroupValues<G>;
}

export function defaultSettings(): Settings {
  return {
    style: DEFAULT_STYLE, seed: 0,
    lines: groupDefaults('lines'), terrain: groupDefaults('terrain'),
    motion: groupDefaults('motion'), layout: groupDefaults('layout'),
    theme: { mode: 'auto' },
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
  return out;
}

/** Merges a partial update into resolved settings. Changing style does not reset other values. */
export function mergeSettings(current: Settings, patch: SettingsInput): Settings {
  const out: Settings = structuredClone(current);
  if (patch.style !== undefined) out.style = resolveStyle(patch.style);
  applyGroups(out, patch);
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

// ---- serialisation: element attributes and URL query ----

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
  return q.toString();
}

export function fromQuery(query: string): SettingsInput {
  const q = new URLSearchParams(query);
  const byShort = new Map((PARAMS as readonly ParamDef[]).map((p) => [p.short, p.attr]));
  return fromAttributes((name) => {
    if (name === 'style-name') return q.get('s');
    if (name === 'theme') return q.get('m');
    if (name === 'seed' || name === 'ink' || name === 'paper') return q.get(name);
    for (const [short, attr] of byShort) if (attr === name) return q.get(short);
    return null;
  });
}
