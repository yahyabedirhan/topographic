// PROTOTYPE (throwaway, see README.md in this folder). Shared state and small widgets for the five playground variants.
import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import {
  createTopography, mergeSettings, paramsIn, PRESETS, resolveMode, resolveSettings, rgbaToCss, THEME_DEFAULTS,
  type GroupName, type Settings, type SettingsInput, type Topography as Instance,
} from 'topography.js';
import { Topography } from 'topography-react';
import { embedCode } from '../embed';
import { downloadPng, PNG_SIZES } from '../png';
import { configOf, readUrl, shareUrl } from '../url';
import { registerTools } from '../webmcp';

export interface Playground {
  settings: Settings;
  mode: 'light' | 'dark';
  change(patch: SettingsInput): void;
  applyPreset(i: number): void;
  presetIndex: number;
  shuffle(): void;
  instance: MutableRefObject<Instance | null>;
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

  const presetIndex = useMemo(() => {
    const key = JSON.stringify(configOf({ ...settings, seed: 0, theme: { mode: 'auto' } }));
    return PRESETS.findIndex((p) => JSON.stringify(configOf(resolveSettings(p.settings))) === key);
  }, [settings]);

  return {
    settings, mode, instance, presetIndex,
    change: (patch) => setSettings((s) => mergeSettings(s, patch)),
    applyPreset: (i) => setSettings((s) => ({ ...resolveSettings(PRESETS[i].settings), seed: s.seed, theme: s.theme })),
    shuffle: () => setSettings((s) => mergeSettings(s, { seed: Math.floor(Math.random() * 100000) + 1 })),
  };
}

export function Backdrop({ pg, className = 'pt-stage' }: { pg: Playground; className?: string }) {
  const s = pg.settings;
  return (
    <Topography className={className} aria-hidden="true" styleName={s.style} seed={s.seed} lines={s.lines} terrain={s.terrain}
      motion={s.motion} layout={s.layout} theme={s.theme} onReady={(t) => { pg.instance.current = t; }} />
  );
}

/** Renders every preset once, centred, with fewer and stronger lines so it reads small, into a PNG with a single off-screen renderer, in the current colours. */
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

export const PRESET_KIND = (i: number) => (i < 7 ? 'Style' : 'Preset');

export const GROUP_LABELS: Record<GroupName, string> = { lines: 'Lines', terrain: 'Terrain', motion: 'Motion', layout: 'Layout' };

export function ParamRows({ pg, group }: { pg: Playground; group: GroupName }) {
  return (
    <div className="pt-params">
      {paramsIn(group).map((p) => {
        const v = (pg.settings[group] as Record<string, number>)[p.key];
        const pct = ((v - p.min) / (p.max - p.min)) * 100;
        return (
          <label className="pt-param" key={p.key} title={p.description}>
            <span>{p.label}</span>
            <input type="range" min={p.min} max={p.max} step={p.step} value={v} style={{ ['--pct' as string]: `${pct}%` }}
              onChange={(e) => pg.change({ [group]: { [p.key]: Number(e.target.value) } })} />
            <output>{p.integer ? v : v.toFixed(2)}</output>
          </label>
        );
      })}
    </div>
  );
}

// ---------- colour ----------

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
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

/** HSV picker: a saturation/brightness field, a hue strip, swatches and a hex field. No dependencies. */
export function ColorPicker({ value, onChange, swatches }: { value: string; onChange: (hex: string) => void; swatches: string[] }) {
  const isHex = /^#[0-9a-f]{3,8}$/i.test(value);
  const [hsv, setHsv] = useState(() => (isHex ? hexToHsv(value) : [220, 0.2, 0.8] as [number, number, number]));
  const [text, setText] = useState(value);
  useEffect(() => { if (isHex && value.toLowerCase() !== hsvToHex(...hsv)) setHsv(hexToHsv(value)); setText(value); }, [value]);
  const set = (next: [number, number, number]) => { setHsv(next); onChange(hsvToHex(...next)); };
  const drag = (el: HTMLElement, e: React.PointerEvent, fn: (x: number, y: number) => void) => {
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent | React.PointerEvent) => {
      const r = el.getBoundingClientRect();
      fn(clamp((ev.clientX - r.left) / r.width), clamp((ev.clientY - r.top) / r.height));
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
          <button key={c} aria-label={c} className={`pt-swatch ${c === value ? 'on' : ''} ${c === 'transparent' ? 'clear' : ''}`}
            style={{ background: c === 'transparent' ? undefined : c }} onClick={() => onChange(c)} />
        ))}
      </div>
      <input className="pt-hex" value={text} spellCheck={false} aria-label="Hex colour"
        onChange={(e) => { setText(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value); }} />
    </div>
  );
}

/** A round swatch that opens the picker in a popover. */
export function ColorField({ pg, which, align = 'up' }: { pg: Playground; which: 'ink' | 'paper'; align?: 'up' | 'down' | 'right' | 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    addEventListener('pointerdown', off);
    return () => removeEventListener('pointerdown', off);
  }, [open]);
  const value = currentColour(pg, which);
  return (
    <div className="pt-colorfield" ref={ref}>
      <button className={`pt-dot ${value === 'transparent' ? 'clear' : ''}`} style={{ background: value === 'transparent' ? undefined : value }}
        aria-label={`${which} colour`} aria-expanded={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className={`pt-pop pt-pop-${align}`}>
          <div className="pt-pop-title">{which === 'ink' ? 'Ink' : 'Paper'}</div>
          <ColorPicker value={value} swatches={which === 'ink' ? INK_SWATCHES : PAPER_SWATCHES}
            onChange={(c) => pg.change({ theme: { [which]: c } })} />
        </div>
      )}
    </div>
  );
}

export function ModeToggle({ pg }: { pg: Playground }) {
  return (
    <button className="pt-icon" aria-label="Toggle light and dark" title="Light / dark"
      onClick={() => pg.change({ theme: { mode: pg.mode === 'dark' ? 'light' : 'dark', ink: undefined, paper: undefined } })}>
      {pg.mode === 'dark' ? '☾' : '☀'}
    </button>
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

export function ExportActions({ pg, compact }: { pg: Playground; compact?: boolean }) {
  const [copied, copy] = useCopy();
  const items: [string, string, () => string][] = [
    ['html', 'HTML', () => embedCode(pg.settings, 'html')],
    ['jsx', 'React', () => embedCode(pg.settings, 'react')],
    ['json', 'JSON', () => embedCode(pg.settings, 'json')],
    ['link', 'Link', () => shareUrl(pg.settings)],
  ];
  return (
    <div className={`pt-export ${compact ? 'compact' : ''}`}>
      {items.map(([id, label, text]) => (
        <button key={id} onClick={() => copy(id, text())}>{copied === id ? 'Copied' : `Copy ${label}`}</button>
      ))}
      <button onClick={() => pg.instance.current && downloadPng(pg.instance.current, PNG_SIZES[1])}>PNG 1080p</button>
    </div>
  );
}

export function Wordmark({ children }: { children?: ReactNode }) {
  return <div className="pt-wordmark">topography.js{children}</div>;
}
