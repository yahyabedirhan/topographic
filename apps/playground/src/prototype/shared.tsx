import { useEffect, useMemo, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  GROUPS, PRESETS, STYLES, THEME_DEFAULTS, clampParam, createTopography, mergeSettings, paramsIn, resolveMode, resolveSettings, rgbaToCss,
  type GroupName, type ParamDef, type Settings, type SettingsInput, type Topography as Instance,
} from 'topography.js';
import { Topography } from 'topography-react';
import { registerTools } from '../webmcp';
import { configOf, readUrl } from '../url';

export interface Playground {
  settings: Settings;
  mode: 'light' | 'dark';
  change(patch: SettingsInput): void;
  applyPreset(i: number): void;
  presetIndex: number;
  shuffle(): void;
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
    const q = new URLSearchParams(location.search);
    q.set('config', JSON.stringify(configOf(settings)));
    history.replaceState(null, '', `${location.pathname}?${q}`);
  }, [settings]);
  const latest = useRef(settings);
  latest.current = settings;
  useEffect(() => registerTools({ getSettings: () => latest.current, setSettings, instance: () => instance.current }), []);
  const frame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const presetIndex = useMemo(() => {
    const key = JSON.stringify(configOf({ ...settings, seed: 0, theme: { mode: 'auto' } }));
    return PRESETS.findIndex((p) => JSON.stringify(configOf(resolveSettings(p.settings))) === key);
  }, [settings]);

  const shuffle = () => {
    cancelAnimationFrame(frame.current);
    const from = latest.current;
    const goal = rollSettings();
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
    settings, mode, instance, presetIndex, shuffle,
    change: (patch) => setSettings((s) => mergeSettings(s, patch)),
    applyPreset: (i) => setSettings((s) => ({ ...resolveSettings(PRESETS[i].settings), seed: s.seed, theme: s.theme })),
  };
}

export function Backdrop({ pg, className = 'pt-stage' }: { pg: Playground; className?: string }) {
  const s = pg.settings;
  return (
    <Topography className={className} aria-hidden="true" styleName={s.style} seed={s.seed} lines={s.lines} terrain={s.terrain}
      motion={s.motion} layout={s.layout} theme={s.theme} onReady={(t) => { pg.instance.current = t; }} />
  );
}

export function usePresetThumbs(pg: Playground, width = 360, height = 240): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  const theme = { ...pg.settings.theme, mode: pg.mode };
  const sig = JSON.stringify(theme);
  useEffect(() => {
    let dead = false;
    const host = document.createElement('div');
    Object.assign(host.style, { position: 'fixed', left: '-9999px', top: '0', width: `${width / 2}px`, height: `${height / 2}px` });
    document.body.append(host);
    const t = createTopography(host, { theme });
    (async () => {
      const out: string[] = [];
      for (const p of PRESETS) {
        const r = resolveSettings({ ...p.settings, theme });
        t.update({ ...r, layout: { ...r.layout, anchor: 1, fade: 0 }, lines: { ...r.lines, count: Math.max(8, Math.round(r.lines.count * 0.45)), width: Math.min(1, r.lines.width + 0.2), opacity: Math.min(1, r.lines.opacity * 2.2) } });
        try { out.push(URL.createObjectURL(await t.snapshot({ frame: 4000, width, height }))); } catch { out.push(''); }
        if (dead) return;
        setUrls([...out]);
      }
    })().finally(() => { t.destroy(); host.remove(); });
    return () => { dead = true; };
  }, [sig, width, height]);
  return urls;
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

export function useCopy(): [string, (label: string, text: string) => void] {
  const [copied, setCopied] = useState('');
  return [copied, (label, text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(''), 1400);
  }];
}

export function Wordmark({ children }: { children?: ReactNode }) {
  return <div className="pt-wordmark">topography.js{children}</div>;
}
