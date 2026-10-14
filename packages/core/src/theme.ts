import type { Settings, ThemeMode } from './settings.js';

/** RGBA, each 0..1. */
export type RGBA = [number, number, number, number];

export interface ResolvedTheme {
  ink: RGBA;
  paper: RGBA;
  /** 1 when lines should glow on dark paper (additive), 0 for ink on light paper. */
  dark: 0 | 1;
}

export const THEME_DEFAULTS = {
  light: { ink: [0.62, 0.7, 0.8, 1] as RGBA, paper: [0.975, 0.972, 0.965, 1] as RGBA },
  dark: { ink: [0.4, 0.46, 0.58, 1] as RGBA, paper: [0.045, 0.045, 0.05, 1] as RGBA },
};

/** Parses hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb()/rgba() and 'transparent'. Returns null otherwise. */
export function parseColor(input: string): RGBA | null {
  const s = input.trim().toLowerCase();
  if (s === 'transparent') return [0, 0, 0, 0];
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255;
    return [n(0), n(2), n(4), h.length === 8 ? n(6) : 1];
  }
  const fn = /^rgba?\(([^)]+)\)$/.exec(s);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const ch = (p: string) => (p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p) / 255);
    const a = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    const out = [ch(parts[0]), ch(parts[1]), ch(parts[2]), a].map((v) => Math.min(1, Math.max(0, v)));
    return out.some(Number.isNaN) ? null : (out as RGBA);
  }
  return null;
}

export interface ThemeEnv {
  /** Reads a CSS custom property on the host element ('' when unset). */
  cssVar?: (name: string) => string;
  /** Resolves any CSS colour the parser does not know (named colours, oklch...) through the browser. */
  computeColor?: (css: string) => string | null;
  prefersDark?: boolean;
}

function toRGBA(css: string | undefined, env: ThemeEnv): RGBA | null {
  if (!css) return null;
  const direct = parseColor(css);
  if (direct) return direct;
  const computed = env.computeColor?.(css);
  return computed ? parseColor(computed) : null;
}

export function resolveMode(mode: ThemeMode, prefersDark = false): 'light' | 'dark' {
  return mode === 'auto' ? (prefersDark ? 'dark' : 'light') : mode;
}

/** Settings, then CSS variables, then the light/dark defaults. */
export function resolveTheme(theme: Settings['theme'], env: ThemeEnv = {}): ResolvedTheme {
  const mode = resolveMode(theme.mode, env.prefersDark);
  const d = THEME_DEFAULTS[mode];
  const pick = (own: string | undefined, varName: string, fallback: RGBA) =>
    toRGBA(own, env) ?? toRGBA(env.cssVar?.(varName).trim() || undefined, env) ?? fallback;
  return { ink: pick(theme.ink, '--topography-ink', d.ink), paper: pick(theme.paper, '--topography-paper', d.paper), dark: mode === 'dark' ? 1 : 0 };
}

export function rgbaToCss([r, g, b, a]: RGBA): string {
  const c = (v: number) => Math.round(v * 255);
  return `rgba(${c(r)}, ${c(g)}, ${c(b)}, ${+a.toFixed(3)})`;
}
