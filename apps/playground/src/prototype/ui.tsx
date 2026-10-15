import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Slider } from '@base-ui-components/react/slider';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Dices, Frame, GripHorizontal, Moon, Mountain, RotateCcw, Search, Share, SlidersHorizontal, Spline, Sun, Wind, X } from 'lucide-react';
import { GROUPS, PARAMS, PRESETS, clampParam, paramsIn, type GroupName, type ParamDef } from 'topography.js';
import {
  Backdrop, ColorPicker, GROUP_LABELS, INK_SWATCHES, PAPER_SWATCHES, Wordmark, currentColour, usePresetThumbs,
  type Playground,
} from './shared';

const THUMB = 104;
const GAP = 8;

export function Tip({ children, side = 'bottom' }: { children: ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <Tooltip.Portal>
      <Tooltip.Positioner side={side} sideOffset={8} className="pt-layer">
        <Tooltip.Popup className="pt-tip">{children}</Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  );
}

export function IconButton({ label, pressed, onClick, side = 'bottom', children }: {
  label: string;
  pressed?: boolean;
  onClick?: () => void;
  side?: 'top' | 'bottom';
  children: ReactNode;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={180}
        className="pt-ibtn"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
      >
        {children}
      </Tooltip.Trigger>
      <Tip side={side}>{label}</Tip>
    </Tooltip.Root>
  );
}

export function TuneButton({ pressed, onClick }: { pressed?: boolean; onClick?: () => void }) {
  return (
    <IconButton label="Tune" pressed={pressed} onClick={onClick}>
      <SlidersHorizontal size={18} strokeWidth={1.75} />
    </IconButton>
  );
}

export function ExportButton({ pressed, onClick }: { pressed?: boolean; onClick?: () => void }) {
  return (
    <IconButton label="Export" pressed={pressed} onClick={onClick}>
      <Share size={18} strokeWidth={1.75} />
    </IconButton>
  );
}

function ThemeToggle({ pg }: { pg: Playground }) {
  const dark = pg.mode === 'dark';
  const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={180}
        render={(
          <Toggle
            className="pt-ibtn pt-theme"
            aria-label={label}
            pressed={dark}
            onPressedChange={() => pg.change({ theme: { mode: dark ? 'light' : 'dark', ink: undefined, paper: undefined } })}
          />
        )}
      >
        {dark ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
      </Tooltip.Trigger>
      <Tip>{label}</Tip>
    </Tooltip.Root>
  );
}

export function Cluster({ pg, tune, exporting }: { pg: Playground; tune: ReactNode; exporting: ReactNode }) {
  return (
    <div className="pt-cluster pt-glass">
      {tune}
      <IconButton label="Shuffle" onClick={pg.shuffle}><Dices size={18} strokeWidth={1.75} /></IconButton>
      {exporting}
      <ThemeToggle pg={pg} />
    </div>
  );
}

export function ColorField({ pg, which, labelled = false }: { pg: Playground; which: 'ink' | 'paper'; labelled?: boolean }) {
  const value = currentColour(pg, which);
  const name = which === 'ink' ? 'Ink' : 'Paper';
  return (
    <Popover.Root>
      <div className={`pt-color ${labelled ? 'is-labelled' : ''}`}>
        <Tooltip.Root>
          <Tooltip.Trigger
            delay={280}
            render={(
              <Popover.Trigger
                className={`pt-dot ${value === 'transparent' ? 'clear' : ''}`}
                style={{ background: value === 'transparent' ? undefined : value }}
                aria-label={`${name} colour`}
              />
            )}
          />
          <Tip>{name}</Tip>
        </Tooltip.Root>
        {labelled && <span>{name}</span>}
      </div>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={12} collisionPadding={12} className="pt-layer">
          <Popover.Popup className="pt-pop pt-solid">
            <Popover.Title className="pt-pop-title">{name}</Popover.Title>
            <ColorPicker
              value={value}
              swatches={which === 'ink' ? INK_SWATCHES : PAPER_SWATCHES}
              onChange={(c) => pg.change({ theme: { [which]: c } })}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function Dock({ pg }: { pg: Playground }) {
  const thumbs = usePresetThumbs(pg, 208, 136);
  const wrap = useRef<HTMLDivElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => Math.min(PRESETS.length, Math.max(1, Math.floor((Math.min(1200, innerWidth) - 160) / (THUMB + GAP)))));
  useEffect(() => {
    const el = wrap.current;
    const tool = tools.current;
    if (!el || !tool) return;
    const measure = () => {
      const avail = el.clientWidth - tool.offsetWidth - 36;
      const n = Math.max(1, Math.min(PRESETS.length, Math.floor((avail + GAP) / (THUMB + GAP))));
      setVisible(n);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const sc = scroller.current;
    if (!sc || pg.presetIndex < 0) return;
    const maxStart = Math.max(0, PRESETS.length - visible);
    const start = Math.min(maxStart, Math.max(0, pg.presetIndex - Math.floor((visible - 1) / 2)));
    sc.scrollTo({ left: start * (THUMB + GAP), behavior: 'smooth' });
  }, [pg.presetIndex, visible]);
  const width = visible * THUMB + Math.max(0, visible - 1) * GAP + 8;
  return (
    <div className="pt-dock-wrap" ref={wrap}>
      <nav className="pt-dock pt-glass" aria-label="Examples">
        <div className="pt-thumbs" ref={scroller} style={{ width }}>
          {PRESETS.map((p, i) => (
            <button
              key={p.name}
              type="button"
              className="pt-thumb"
              aria-current={i === pg.presetIndex ? 'true' : undefined}
              aria-label={p.name}
              onClick={() => pg.applyPreset(i)}
            >
              <span className="pt-thumb-media">
                {thumbs[i] ? <img src={thumbs[i]} alt="" /> : <span className="pt-ph" />}
                <span className="pt-thumb-name" aria-hidden="true">{p.name}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="pt-dock-tools" ref={tools}>
          <ColorField pg={pg} which="paper" />
          <ColorField pg={pg} which="ink" />
        </div>
      </nav>
    </div>
  );
}

const GROUP_ICON: Record<GroupName, typeof Spline> = { lines: Spline, terrain: Mountain, motion: Wind, layout: Frame };

function readParam(param: ParamDef, value: number) {
  return param.integer ? String(value) : value.toFixed(2);
}

function Knob({ param, value, onChange, size = 32 }: { param: ParamDef; value: number; onChange: (n: number) => void; size?: number }) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const span = param.max - param.min || 1;
  const t = Math.min(1, Math.max(0, (value - param.min) / span));
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const angle = -135 + t * 270;
  const setFrom = (start: number, dy: number, fine: boolean) => onChange(clampParam(param, start + dy * (span / (fine ? 420 : 150))));
  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, v: value };
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setFrom(drag.current.v, drag.current.y - e.clientY, e.shiftKey);
  };
  const key = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = param.step * (e.shiftKey ? 10 : 1);
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); onChange(clampParam(param, value + step)); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); onChange(clampParam(param, value - step)); }
    if (e.key === 'Home') { e.preventDefault(); onChange(param.min); }
    if (e.key === 'End') { e.preventDefault(); onChange(param.max); }
  };
  return (
    <div
      className="pt-knob"
      style={{ width: size, height: size }}
      role="slider"
      tabIndex={0}
      aria-label={param.label}
      aria-valuemin={param.min}
      aria-valuemax={param.max}
      aria-valuenow={value}
      aria-valuetext={readParam(param, value)}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onKeyDown={key}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <g transform={`rotate(135 ${cx} ${cx})`}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2.25" strokeDasharray={`${c * 0.75} ${c}`} strokeLinecap="round" />
          {t > 0 && <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth="2.25" strokeDasharray={`${Math.max(0.8, c * 0.75 * t)} ${c}`} strokeLinecap="round" />}
        </g>
        <line x1={cx} y1={cx} x2={cx} y2={5} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" transform={`rotate(${angle} ${cx} ${cx})`} />
      </svg>
    </div>
  );
}

function ParamSlider({ param, value, onChange }: { param: ParamDef; value: number; onChange: (n: number) => void }) {
  return (
    <Slider.Root
      className="pt-slider"
      min={param.min}
      max={param.max}
      step={param.step}
      value={value}
      thumbAlignment="center"
      onValueChange={(next) => onChange(typeof next === 'number' ? next : next[0])}
    >
      <Slider.Control className="pt-slider-control">
        <Slider.Track className="pt-slider-track">
          <Slider.Indicator className="pt-slider-ind" />
          <Slider.Thumb className="pt-slider-thumb" aria-label={param.label} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

export function TuneBody({ pg, layout = 'stack' }: { pg: Playground; layout?: 'stack' | 'row' | 'rail' }) {
  const [group, setGroup] = useState<GroupName>('lines');
  const [open, setOpen] = useState<string | null>('count');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const pool = q
    ? (PARAMS as readonly ParamDef[]).filter((p) => `${p.label} ${p.description} ${GROUP_LABELS[p.group]}`.toLowerCase().includes(q))
    : paramsIn(group);
  const active = pool.find((p) => p.key === open) ?? null;
  const vertical = layout !== 'stack';
  const valueOf = (p: ParamDef) => (pg.settings[p.group] as Record<string, number>)[p.key];
  const change = (p: ParamDef, n: number) => pg.change({ [p.group]: { [p.key]: n } });
  return (
    <div className={`pt-tune pt-tune-${layout}`}>
      {layout === 'rail' ? null : (
        <div className="pt-colours">
          <ColorField pg={pg} which="paper" labelled />
          <ColorField pg={pg} which="ink" labelled />
        </div>
      )}
      <ToggleGroup
        className={`pt-groups ${vertical ? 'is-vertical' : ''}`}
        orientation={vertical ? 'vertical' : 'horizontal'}
        value={[group]}
        onValueChange={(v) => { if (v[0]) { setGroup(v[0] as GroupName); setQuery(''); setOpen(paramsIn(v[0] as GroupName)[0]?.key ?? null); } }}
        aria-label="Setting group"
      >
        {GROUPS.map((g) => {
          const Ico = GROUP_ICON[g];
          return (
            <Tooltip.Root key={g}>
              <Tooltip.Trigger delay={280} render={<Toggle className="pt-ibtn" value={g} aria-label={GROUP_LABELS[g]} />}>
                <Ico size={16} strokeWidth={1.75} />
              </Tooltip.Trigger>
              <Tip>{GROUP_LABELS[g]}</Tip>
            </Tooltip.Root>
          );
        })}
      </ToggleGroup>
      <div className="pt-focus">
        {layout === 'rail' && (
          <div className="pt-colours">
            <ColorField pg={pg} which="paper" labelled />
            <ColorField pg={pg} which="ink" labelled />
          </div>
        )}
        {layout !== 'row' && (
          <label className="pt-find">
            <Search size={14} strokeWidth={1.75} aria-hidden="true" />
            <input
              value={query}
              placeholder="Find a setting"
              aria-label="Find a setting"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && query) { e.stopPropagation(); e.preventDefault(); setQuery(''); }
              }}
            />
          </label>
        )}
        {layout === 'row' ? (
          <div className="pt-kbank" role="group" aria-label={`${GROUP_LABELS[group]} knobs`}>
            {pool.map((p) => (
              <div key={p.key} className={`pt-kbank-item ${active?.key === p.key ? 'is-on' : ''}`}>
                <Knob param={p} value={valueOf(p)} onChange={(n) => { setOpen(p.key); change(p, n); }} size={48} />
                <button type="button" className="pt-kbank-name" aria-pressed={active?.key === p.key} onClick={() => setOpen(p.key)}>{p.label}</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="pt-klist">
            {pool.map((p) => {
              const value = valueOf(p);
              const shown = open === p.key;
              return (
                <div key={p.key} className={`pt-krow ${shown ? 'is-open' : ''}`}>
                  <div className="pt-krow-main">
                    <Knob param={p} value={value} onChange={(n) => change(p, n)} />
                    <button type="button" className="pt-krow-open" aria-expanded={shown} onClick={() => setOpen(shown ? null : p.key)}>
                      <span className="pt-krow-name">{p.label}{q && <small>{GROUP_LABELS[p.group]}</small>}</span>
                      <span className="pt-krow-read">{readParam(p, value)}</span>
                    </button>
                    {value !== p.default && (
                      <IconButton label="Reset" onClick={() => change(p, p.default)}><RotateCcw size={14} strokeWidth={1.75} /></IconButton>
                    )}
                  </div>
                  {shown && (
                    <div className="pt-kedit">
                      <ParamSlider param={p} value={value} onChange={(n) => change(p, n)} />
                      <p className="pt-hint">{p.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {pool.length === 0 && <p className="pt-hint">Nothing matches.</p>}
          </div>
        )}
        {layout === 'row' && active && (
          <div className="pt-kedit">
            <div className="pt-focus-top">
              <span>{active.label}</span>
              <span className="pt-krow-side">
                <output>{readParam(active, valueOf(active))}</output>
                {valueOf(active) !== active.default && (
                  <IconButton label="Reset" onClick={() => change(active, active.default)}><RotateCcw size={14} strokeWidth={1.75} /></IconButton>
                )}
              </span>
            </div>
            <ParamSlider param={active} value={valueOf(active)} onChange={(n) => change(active, n)} />
            <p className="pt-hint">{active.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DragCard({ origin, wide, onClose, children }: {
  origin: 'corner' | 'dock';
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const posRef = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef({ on: false, dx: 0, dy: 0 });
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const place = (next: { x: number; y: number }) => { posRef.current = next; setPos(next); };

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    place(origin === 'corner'
      ? { x: 16, y: 76 }
      : { x: Math.max(12, (innerWidth - w) / 2), y: Math.max(76, innerHeight - h - 156) });
  }, [origin]);
  useEffect(() => { setReady(true); }, []);

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a, input, [role="slider"]')) return;
    if (!posRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { on: true, dx: e.clientX - posRef.current.x, dy: e.clientY - posRef.current.y };
    setDragging(true);
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current.on) return;
    const w = ref.current?.offsetWidth ?? 280;
    place({
      x: Math.min(Math.max(8, e.clientX - drag.current.dx), innerWidth - w - 8),
      y: Math.min(Math.max(8, e.clientY - drag.current.dy), innerHeight - 64),
    });
  };
  const up = () => {
    if (!drag.current.on) return;
    drag.current.on = false;
    setDragging(false);
    const node = ref.current;
    const p = posRef.current;
    if (!node || !p) return;
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    place({
      x: p.x + w / 2 < innerWidth / 2 ? 12 : Math.max(12, innerWidth - w - 12),
      y: Math.min(Math.max(76, p.y), Math.max(76, innerHeight - Math.min(h, 220) - 156)),
    });
  };

  return (
    <div
      ref={ref}
      className={`pt-drag pt-glass pt-solid pt-panel ${wide ? 'pt-drag-wide' : ''} ${ready ? 'is-ready' : ''} ${dragging ? 'is-dragging' : ''}`}
      style={pos ? { transform: `translate(${pos.x}px, ${pos.y}px)` } : { visibility: 'hidden' }}
    >
      <div className="pt-handle" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <GripHorizontal size={16} aria-hidden="true" />
        <span>Tune</span>
        <IconButton label="Close" onClick={onClose}><X size={16} strokeWidth={1.75} /></IconButton>
      </div>
      {children}
    </div>
  );
}

export function Sheet({ side, onClose, children }: { side: 'left' | 'right'; onClose: () => void; children: ReactNode }) {
  return (
    <aside className={`pt-sheet pt-sheet-${side} pt-glass pt-solid pt-panel`}>
      <div className="pt-sheet-bar">
        <IconButton label="Close" onClick={onClose}><X size={16} strokeWidth={1.75} /></IconButton>
      </div>
      {children}
    </aside>
  );
}

export function Shell({ pg, tune, exporting, children }: { pg: Playground; tune: ReactNode; exporting: ReactNode; children?: ReactNode }) {
  return (
    <>
      <Backdrop pg={pg} />
      <Wordmark />
      <Cluster pg={pg} tune={tune} exporting={exporting} />
      {children}
      <Dock pg={pg} />
    </>
  );
}

export function useDismiss(close: () => void) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [close]);
}
