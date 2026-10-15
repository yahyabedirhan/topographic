import { useCallback, useEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Slider } from '@base-ui-components/react/slider';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Dices, Frame, Moon, Mountain, RotateCcw, SlidersHorizontal, Spline, Sun, Wind } from 'lucide-react';
import { GROUPS, paramsIn, type GroupName, type ParamDef } from 'topography.js';
import { LOOKS } from './looks';
import {
  Backdrop, ColorPicker, GROUP_LABELS, INK_SWATCHES, PAPER_SWATCHES, Wordmark, currentColour, rollColour, useLookThumbs,
  type Playground,
} from './shared';

const THUMB = 84;
const GAP = 4;

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
          <Popover.Popup className="pt-pop pt-glass pt-pop-color">
            <div className="pt-color-head">
              <Popover.Title className="pt-pop-title">{name}</Popover.Title>
              <button type="button" className="pt-dice" aria-label={`Random ${name.toLowerCase()} colour`} onClick={() => pg.change({ theme: { [which]: rollColour(which) } })}>
                <Dices size={15} strokeWidth={1.75} />
              </button>
            </div>
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
  const thumbs = useLookThumbs(168, 96);
  const wrap = useRef<HTMLDivElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => Math.min(LOOKS.length, Math.max(1, Math.floor((Math.min(1100, innerWidth) - 140) / (THUMB + GAP)))));
  useEffect(() => {
    const el = wrap.current;
    const tool = tools.current;
    if (!el || !tool) return;
    const measure = () => {
      const avail = el.clientWidth - tool.offsetWidth - 20;
      const n = Math.max(1, Math.min(LOOKS.length, Math.floor((avail + GAP) / (THUMB + GAP))));
      setVisible(n);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const sc = scroller.current;
    if (!sc || pg.lookIndex < 0) return;
    const maxStart = Math.max(0, LOOKS.length - visible);
    const start = Math.min(maxStart, Math.max(0, pg.lookIndex - Math.floor((visible - 1) / 2)));
    sc.scrollTo({ left: start * (THUMB + GAP), behavior: 'smooth' });
  }, [pg.lookIndex, visible]);
  const width = visible * THUMB + Math.max(0, visible - 1) * GAP;
  return (
    <div className="pt-dock-wrap" ref={wrap}>
      <nav className="pt-dock pt-glass" aria-label="Examples">
        <div className="pt-thumbs" ref={scroller} style={{ width }}>
          {LOOKS.map((p, i) => (
            <button
              key={p.name}
              type="button"
              className="pt-thumb"
              aria-current={i === pg.lookIndex ? 'true' : undefined}
              aria-label={p.name}
              onClick={() => pg.applyLook(i)}
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

export function GlassFrame({ pg, tune, exporting }: {
  pg: Playground;
  tune: ReactNode;
  exporting: (open: boolean, onOpenChange: (open: boolean) => void, clusterRef: RefObject<HTMLDivElement | null>) => ReactNode;
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
        exporting={exporting(exp, (open) => { setExp(open); if (open) setTuneOpen(false); }, clusterRef)}
      >
        <Popover.Portal>
          <Popover.Positioner anchor={clusterRef} side="bottom" align="end" sideOffset={10} collisionPadding={{ top: 12, right: 8, bottom: 16, left: 8 }} positionMethod="fixed" className="pt-layer">
            <Popover.Popup className="pt-pop pt-glass pt-panel">
              {tune}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Shell>
    </Popover.Root>
  );
}
