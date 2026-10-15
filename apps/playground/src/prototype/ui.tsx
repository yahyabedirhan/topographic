import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Slider } from '@base-ui-components/react/slider';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Dices, Frame, Moon, Mountain, RotateCcw, Share, SlidersHorizontal, Spline, Sun, Wind } from 'lucide-react';
import { GROUPS, PRESETS, clampParam, paramsIn, type GroupName, type ParamDef } from 'topography.js';
import {
  Backdrop, ColorPicker, GROUP_LABELS, INK_SWATCHES, PAPER_SWATCHES, Wordmark, currentColour, usePresetThumbs,
  type Playground,
} from './shared';

const THUMB = 78;
const GAP = 6;

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
      <Tooltip.Trigger delay={180} className="pt-ibtn" aria-label={label} aria-pressed={pressed} onClick={onClick}>
        {children}
      </Tooltip.Trigger>
      <Tip side={side}>{label}</Tip>
    </Tooltip.Root>
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

export function Cluster({ pg, tune, exporting, clusterRef }: {
  pg: Playground;
  tune: ReactNode;
  exporting: ReactNode;
  clusterRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div className="pt-cluster pt-glass" ref={clusterRef}>
      <IconButton label="Shuffle" onClick={pg.shuffle}><Dices size={18} strokeWidth={1.75} /></IconButton>
      {exporting}
      <ThemeToggle pg={pg} />
      {tune}
    </div>
  );
}

export function ColorField({ pg, which }: { pg: Playground; which: 'ink' | 'paper' }) {
  const value = currentColour(pg, which);
  const name = which === 'ink' ? 'Ink' : 'Paper';
  return (
    <Popover.Root>
      <div className="pt-color">
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
      </div>
      <Popover.Portal>
        <Popover.Positioner side="top" sideOffset={12} collisionPadding={12} positionMethod="fixed" className="pt-layer">
          <Popover.Popup className="pt-pop pt-glass">
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
  const thumbs = usePresetThumbs(pg, 156, 92);
  const wrap = useRef<HTMLDivElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => Math.min(PRESETS.length, Math.max(1, Math.floor((Math.min(1100, innerWidth) - 140) / (THUMB + GAP)))));
  useEffect(() => {
    const el = wrap.current;
    const tool = tools.current;
    if (!el || !tool) return;
    const measure = () => {
      const avail = el.clientWidth - tool.offsetWidth - 28;
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

function Knob({ param, value, onChange, size = 26 }: { param: ParamDef; value: number; onChange: (n: number) => void; size?: number }) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const span = param.max - param.min || 1;
  const t = Math.min(1, Math.max(0, (value - param.min) / span));
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const angle = -135 + t * 270;
  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, v: value };
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    onChange(clampParam(param, drag.current.v + (drag.current.y - e.clientY) * (span / (e.shiftKey ? 420 : 150))));
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
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" strokeDasharray={`${c * 0.75} ${c}`} strokeLinecap="round" />
          {t > 0 && <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${Math.max(0.6, c * 0.75 * t)} ${c}`} strokeLinecap="round" />}
        </g>
        <line x1={cx} y1={cx} x2={cx} y2={4} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform={`rotate(${angle} ${cx} ${cx})`} />
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

function useTune(pg: Playground) {
  const [group, setGroup] = useState<GroupName>('lines');
  const [open, setOpen] = useState('count');
  const params = paramsIn(group);
  const active = params.find((p) => p.key === open) ?? params[0];
  const valueOf = (p: ParamDef) => (pg.settings[p.group] as Record<string, number>)[p.key];
  const change = (p: ParamDef, n: number) => pg.change({ [p.group]: { [p.key]: n } });
  const pickGroup = (next: GroupName) => {
    setGroup(next);
    setOpen(paramsIn(next)[0]?.key ?? 'count');
  };
  return { pg, group, pickGroup, params, active, open, setOpen, valueOf, change };
}

function TuneHead({ pg, group, onGroup }: { pg: Playground; group: GroupName; onGroup: (g: GroupName) => void }) {
  return (
    <div className="pt-tune-head">
      <ToggleGroup
        className="pt-groups"
        value={[group]}
        onValueChange={(v) => { if (v[0]) onGroup(v[0] as GroupName); }}
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
      <div className="pt-colours">
        <ColorField pg={pg} which="paper" />
        <ColorField pg={pg} which="ink" />
      </div>
    </div>
  );
}

function NameTip({ param }: { param: ParamDef }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger delay={360} render={<span className="pt-pname" />}>{param.label}</Tooltip.Trigger>
      <Tip>{param.description}</Tip>
    </Tooltip.Root>
  );
}

function Reset({ param, value, onChange }: { param: ParamDef; value: number; onChange: (n: number) => void }) {
  if (value === param.default) return null;
  return <IconButton label="Reset" onClick={() => onChange(param.default)}><RotateCcw size={13} strokeWidth={1.75} /></IconButton>;
}

export function TuneLine({ pg }: { pg: Playground }) {
  const tune = useTune(pg);
  return (
    <div className="pt-tune">
      <TuneHead pg={pg} group={tune.group} onGroup={tune.pickGroup} />
      <div className="pt-klist">
        {tune.params.map((p) => {
          const value = tune.valueOf(p);
          const shown = tune.open === p.key;
          return (
            <div key={p.key} className={`pt-krow ${shown ? 'is-open' : ''}`}>
              <div className="pt-krow-main">
                <Knob param={p} value={value} onChange={(n) => tune.change(p, n)} />
                <button type="button" className="pt-krow-open" aria-expanded={shown} onClick={() => tune.setOpen(shown ? '' : p.key)}>
                  <NameTip param={p} />
                  <span className="pt-krow-read">{readParam(p, value)}</span>
                </button>
                <Reset param={p} value={value} onChange={(n) => tune.change(p, n)} />
              </div>
              {shown && (
                <div className="pt-kedit">
                  <ParamSlider param={p} value={value} onChange={(n) => tune.change(p, n)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TuneStrip({ pg }: { pg: Playground }) {
  const tune = useTune(pg);
  return (
    <div className="pt-tune">
      <TuneHead pg={pg} group={tune.group} onGroup={tune.pickGroup} />
      <div className="pt-klist">
        {tune.params.map((p) => {
          const value = tune.valueOf(p);
          return (
            <div key={p.key} className="pt-strip">
              <NameTip param={p} />
              <ParamSlider param={p} value={value} onChange={(n) => tune.change(p, n)} />
              <output>{readParam(p, value)}</output>
              <Reset param={p} value={value} onChange={(n) => tune.change(p, n)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TuneDial({ pg }: { pg: Playground }) {
  const tune = useTune(pg);
  const active = tune.active;
  const value = tune.valueOf(active);
  return (
    <div className="pt-tune">
      <TuneHead pg={pg} group={tune.group} onGroup={tune.pickGroup} />
      <div className="pt-chips" role="group" aria-label={`${GROUP_LABELS[tune.group]} settings`}>
        {tune.params.map((p) => (
          <button key={p.key} type="button" className={`pt-chip ${p.key === active.key ? 'is-on' : ''}`} aria-pressed={p.key === active.key} onClick={() => tune.setOpen(p.key)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="pt-dialrow">
        <Knob param={active} value={value} onChange={(n) => tune.change(active, n)} size={40} />
        <div className="pt-dialmain">
          <div className="pt-focus-top">
            <NameTip param={active} />
            <span className="pt-krow-side">
              <output>{readParam(active, value)}</output>
              <Reset param={active} value={value} onChange={(n) => tune.change(active, n)} />
            </span>
          </div>
          <ParamSlider param={active} value={value} onChange={(n) => tune.change(active, n)} />
        </div>
      </div>
    </div>
  );
}

export function TuneGrid({ pg }: { pg: Playground }) {
  const tune = useTune(pg);
  return (
    <div className="pt-tune">
      <TuneHead pg={pg} group={tune.group} onGroup={tune.pickGroup} />
      <div className="pt-grid">
        {tune.params.map((p) => {
          const value = tune.valueOf(p);
          return (
            <div key={p.key} className="pt-cell">
              <div className="pt-focus-top">
                <NameTip param={p} />
                <output>{readParam(p, value)}</output>
              </div>
              <ParamSlider param={p} value={value} onChange={(n) => tune.change(p, n)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TuneFocus({ pg }: { pg: Playground }) {
  const tune = useTune(pg);
  const active = tune.active;
  const value = tune.valueOf(active);
  return (
    <div className="pt-tune">
      <TuneHead pg={pg} group={tune.group} onGroup={tune.pickGroup} />
      <div className="pt-chips" role="group" aria-label={`${GROUP_LABELS[tune.group]} settings`}>
        {tune.params.map((p) => (
          <button key={p.key} type="button" className={`pt-chip ${p.key === active.key ? 'is-on' : ''}`} aria-pressed={p.key === active.key} onClick={() => tune.setOpen(p.key)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="pt-oneline">
        <ParamSlider param={active} value={value} onChange={(n) => tune.change(active, n)} />
        <output>{readParam(active, value)}</output>
        <Reset param={active} value={value} onChange={(n) => tune.change(active, n)} />
      </div>
    </div>
  );
}

export function Shell({ pg, tune, exporting, clusterRef, children }: {
  pg: Playground;
  tune: ReactNode;
  exporting: ReactNode;
  clusterRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}) {
  return (
    <>
      <Backdrop pg={pg} />
      <Wordmark />
      <Cluster pg={pg} tune={tune} exporting={exporting} clusterRef={clusterRef} />
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

export function GlassFrame({ pg, tune, wide, dialog }: {
  pg: Playground;
  tune: ReactNode;
  wide?: boolean;
  dialog: (open: boolean, onOpenChange: (open: boolean) => void) => ReactNode;
}) {
  const clusterRef = useRef<HTMLDivElement>(null);
  const [tuneOpen, setTuneOpen] = useState(false);
  const [exp, setExp] = useState(false);
  const close = useCallback(() => { setTuneOpen(false); setExp(false); }, []);
  useDismiss(close);
  return (
    <Popover.Root open={tuneOpen} onOpenChange={(open) => { setTuneOpen(open); if (open) setExp(false); }}>
      <Shell
        pg={pg}
        clusterRef={clusterRef}
        tune={(
          <Tooltip.Root>
            <Tooltip.Trigger delay={180} render={<Popover.Trigger className="pt-ibtn" aria-label="Tune" />}>
              <SlidersHorizontal size={18} strokeWidth={1.75} />
            </Tooltip.Trigger>
            <Tip>Tune</Tip>
          </Tooltip.Root>
        )}
        exporting={<ExportButton pressed={exp} onClick={() => { setExp((v) => !v); setTuneOpen(false); }} />}
      >
        <Popover.Portal>
          <Popover.Positioner anchor={clusterRef} side="bottom" align="end" sideOffset={10} collisionPadding={{ top: 12, right: 8, bottom: 16, left: 8 }} positionMethod="fixed" className="pt-layer">
            <Popover.Popup className={`pt-pop pt-glass pt-panel ${wide ? 'pt-pop-wide' : ''}`}>
              {tune}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
        {dialog(exp, setExp)}
      </Shell>
    </Popover.Root>
  );
}
