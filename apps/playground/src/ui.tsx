import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Toggle } from '@base-ui-components/react/toggle';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Box, Dices, Frame, Map, Moon, Mountain, SlidersHorizontal, Spline, Sun, Wind } from 'lucide-react';
import { MapButton } from './region/controls';
import { useRegion } from './region/useRegion';
import {
  DEFAULT_CAMERA, DEFAULT_DETAIL, DEFAULT_ELEVATION, GROUPS, paramsIn, resolveMode,
  type CameraMotion, type GroupName, type ParamDef, type TerrainExtent,
} from 'topographic';
import { LOOKS } from './looks';
import { Section, SegRow, SliderRow, Tabs, Tip, type TabItem } from './parts';
import {
  Backdrop, ColorPicker, GROUP_LABELS, INK_SWATCHES, PAPER_SWATCHES, Wordmark, currentColour, rollColour, useLookThumbs,
  type Playground,
} from './shared';

// MapLibre is large, so the place panel loads the first time Map opens.
const PlacePanel = lazy(() => import('./region/Picker').then((m) => ({ default: m.PlacePanel })));

export { Tip };

const THUMB = 84;
const GAP = 4;

export function IconButton({ label, pressed, onClick, side = 'bottom', className = 'pt-ibtn', children }: {
  label: string;
  pressed?: boolean;
  onClick?: () => void;
  side?: 'top' | 'bottom';
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger delay={180} className={className} aria-label={label} aria-pressed={pressed} onClick={onClick}>
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
            className="pt-tool pt-theme"
            aria-label={label}
            pressed={dark}
            onPressedChange={() => pg.change({ theme: { mode: dark ? 'light' : 'dark', ink: undefined, paper: undefined } })}
          />
        )}
      >
        {dark ? <Moon size={16} strokeWidth={1.75} /> : <Sun size={16} strokeWidth={1.75} />}
      </Tooltip.Trigger>
      <Tip side="top">{label}</Tip>
    </Tooltip.Root>
  );
}

/** Shows its state by its icon (map or box) and a 2D or 3D caption, never by a fill: a fill in the cluster means an open popover. */
function ModeToggle({ pg }: { pg: Playground }) {
  const on = pg.settings.mode === '3d';
  const label = on ? 'Switch to 2D' : 'Switch to 3D';
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={180}
        render={(
          <Toggle
            className="pt-ibtn pt-mode"
            aria-label={label}
            pressed={on}
            onPressedChange={(pressed) => pg.change({ mode: pressed ? '3d' : '2d' })}
          />
        )}
      >
        {on ? <Box size={15} strokeWidth={1.75} /> : <Map size={15} strokeWidth={1.75} />}
        <span className="pt-mode-tag" aria-hidden="true">{on ? '3D' : '2D'}</span>
      </Tooltip.Trigger>
      <Tip>{label}</Tip>
    </Tooltip.Root>
  );
}

export function useStats(pg: Playground) {
  const [stats, setStats] = useState({ fps: 0, frameMs: 0, mesh: 0 });
  useEffect(() => {
    if (pg.settings.mode !== '3d') return;
    let alive = true;
    let id = 0;
    const tick = () => {
      const next = pg.instance.current?.stats;
      if (alive && next) setStats(next);
      id = window.setTimeout(tick, 400);
    };
    tick();
    return () => { alive = false; window.clearTimeout(id); };
  }, [pg, pg.settings.mode, pg.instance]);
  return stats;
}

/** The 3D frame-rate readout: plain text under the wordmark. */
export function Readout({ pg }: { pg: Playground }) {
  const stats = useStats(pg);
  if (pg.settings.mode !== '3d') return null;
  return <div className="pt-fps" aria-live="polite">{`${stats.fps} fps · ${stats.frameMs.toFixed(1)} ms · ${stats.mesh}²`}</div>;
}

export function Cluster({ pg, place, tune, exporting, clusterRef }: {
  pg: Playground;
  place?: ReactNode;
  tune: ReactNode;
  exporting: ReactNode;
  clusterRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div className="pt-cluster pt-glass" ref={clusterRef}>
      {place}
      <ModeToggle pg={pg} />
      {tune}
      {exporting}
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
          <Tip side="top">{name}</Tip>
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
  const [visible, setVisible] = useState(() => Math.min(LOOKS.length, Math.max(1, Math.floor((Math.min(1100, innerWidth) - 180) / (THUMB + GAP)))));
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
  const ready = thumbs.reduce((count, url) => count + (url ? 1 : 0), 0);
  const shown = Math.min(visible, ready);
  const width = shown > 0 ? shown * THUMB + Math.max(0, shown - 1) * GAP : 0;
  return (
    <div className="pt-dock-wrap" ref={wrap}>
      <nav className="pt-dock pt-glass" aria-label="Examples" data-looks={LOOKS.length} data-ready={ready}>
        <div className="pt-thumbs" ref={scroller} style={{ width }}>
          {LOOKS.map((p, i) => thumbs[i] ? (
            <button
              key={p.name}
              type="button"
              className="pt-thumb"
              aria-current={i === pg.lookIndex ? 'true' : undefined}
              aria-label={p.name}
              onClick={() => pg.applyLook(i)}
            >
              <span className="pt-thumb-media">
                <img src={thumbs[i]} alt="" />
                <span className="pt-thumb-name" aria-hidden="true">{p.name}</span>
              </span>
            </button>
          ) : null)}
        </div>
        {/* Theme, shuffle, then the two colours. */}
        <div className="pt-dock-tools" ref={tools}>
          <ThemeToggle pg={pg} />
          <IconButton label="Shuffle" side="top" className="pt-tool" onClick={pg.shuffle}><Dices size={16} strokeWidth={1.75} /></IconButton>
          <span className="pt-tool-slot"><ColorField pg={pg} which="paper" /></span>
          <span className="pt-tool-slot"><ColorField pg={pg} which="ink" /></span>
        </div>
      </nav>
    </div>
  );
}

const GROUP_ICON: Record<GroupName, typeof Spline> = { lines: Spline, terrain: Mountain, motion: Wind, layout: Frame };

type TuneTab = GroupName | 'view';

const TUNE_TABS: TabItem<TuneTab>[] = [
  ...GROUPS.map((g) => ({ id: g as TuneTab, label: GROUP_LABELS[g], icon: GROUP_ICON[g] })),
  { id: 'view', label: '3D', icon: Box },
];

/** Labels that need to fit the 80px label column. The slider keeps the full name. */
const SHORT_LABEL: Partial<Record<string, string>> = { indexEvery: 'Index every' };

/** Groups with more than four rows split into sections; the rest keep one, named after the group. */
const SECTIONS: Partial<Record<GroupName, { title: string; keys: string[] }[]>> = {
  terrain: [
    { title: 'Shape', keys: ['peaks', 'spread', 'sharpness', 'variant'] },
    { title: 'Surface', keys: ['roughness', 'terracing'] },
  ],
};

function readParam(param: ParamDef, value: number) {
  return param.integer ? String(value) : value.toFixed(2);
}

const PATHS: { id: CameraMotion; label: string }[] = [
  { id: 'still', label: 'Still' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'push', label: 'Push' },
  { id: 'flyover', label: 'Flyover' },
  { id: 'drone', label: 'Drone' },
];

const EXTENTS: { id: TerrainExtent; label: string }[] = [
  { id: 'block', label: 'Block' },
  { id: 'endless', label: 'Endless' },
];

type DetailLevel = 'low' | 'medium' | 'high';
const DETAILS: { id: DetailLevel; label: string; value: number }[] = [
  { id: 'low', label: 'Low', value: 0.12 },
  { id: 'medium', label: 'Medium', value: DEFAULT_DETAIL },
  { id: 'high', label: 'High', value: 1 },
];

function detailLevel(detail: number): DetailLevel {
  return detail <= 0.2 ? 'low' : detail >= 0.8 ? 'high' : 'medium';
}

/** The playground's 3D extent default: endless. */
const DEFAULT_EXTENT: TerrainExtent = 'endless';

function ViewTune({ pg }: { pg: Playground }) {
  const s = pg.settings;
  const azimuth = ((s.camera.azimuth % 360) + 360) % 360;
  const cam = (patch: Partial<typeof s.camera>) => pg.change({ camera: patch });
  const sceneChanged = s.extent !== DEFAULT_EXTENT || s.elevation !== DEFAULT_ELEVATION;
  const cameraChanged = (Object.keys(DEFAULT_CAMERA) as (keyof typeof DEFAULT_CAMERA)[]).some((k) => s.camera[k] !== DEFAULT_CAMERA[k]);
  return (
    <>
      <Section title="Scene" resetIf={sceneChanged} onReset={() => pg.change({ extent: DEFAULT_EXTENT, elevation: DEFAULT_ELEVATION })}>
        <SegRow label="Extent" options={EXTENTS} value={s.extent} onChange={(id) => pg.change({ extent: id })} />
        <SliderRow
          label="Elevation"
          hint="0 is flat like the map. Higher values make the terrain taller, with a rounded crest."
          value={s.elevation} min={0} max={1} step={0.01} shown={s.elevation.toFixed(2)}
          onChange={(n) => pg.change({ elevation: n })}
        />
      </Section>
      <Section title="Camera" resetIf={cameraChanged} onReset={() => cam({ ...DEFAULT_CAMERA })}>
        <SegRow label="Motion" options={PATHS} value={s.camera.motion} onChange={(id) => cam({ motion: id })} />
        <SliderRow
          label="Azimuth"
          hint="Orbit around the terrain. Drag the view to move this too."
          value={azimuth} min={0} max={360} step={1} shown={`${azimuth.toFixed(0)}°`}
          onChange={(n) => cam({ azimuth: n })}
        />
        <SliderRow
          label="Angle"
          hint="Degrees above the horizon. The camera never goes below the terrain."
          value={s.camera.elevation} min={2} max={80} step={1} shown={`${s.camera.elevation.toFixed(0)}°`}
          onChange={(n) => cam({ elevation: n })}
        />
        <SliderRow
          label="Distance"
          hint="How far the camera sits. Scroll or pinch the view to zoom."
          value={s.camera.radius} min={1.15} max={6.5} step={0.01} shown={s.camera.radius.toFixed(2)}
          onChange={(n) => cam({ radius: n })}
        />
      </Section>
      <Section title="Quality" resetIf={s.detail !== DEFAULT_DETAIL} onReset={() => pg.change({ detail: DEFAULT_DETAIL })}>
        <SegRow
          label="Detail"
          hint="Mesh resolution. Low is the setting to try on a slow device."
          options={DETAILS}
          value={detailLevel(s.detail)}
          onChange={(id) => pg.change({ detail: DETAILS.find((d) => d.id === id)!.value })}
        />
      </Section>
    </>
  );
}

function ParamTune({ pg, group }: { pg: Playground; group: GroupName }) {
  const params = paramsIn(group);
  const valueOf = (p: ParamDef) => (pg.settings[p.group] as Record<string, number>)[p.key];
  const sections = SECTIONS[group] ?? [{ title: GROUP_LABELS[group], keys: params.map((p) => p.key) }];
  return (
    <>
      {sections.map((sec) => {
        const own = sec.keys.map((k) => params.find((p) => p.key === k)).filter((p): p is ParamDef => Boolean(p));
        const changed = own.some((p) => valueOf(p) !== p.default);
        return (
          <Section
            key={sec.title}
            title={sec.title}
            resetIf={changed}
            onReset={() => pg.change({ [group]: Object.fromEntries(own.map((p) => [p.key, p.default])) })}
          >
            {own.map((p) => {
              const value = valueOf(p);
              return (
                <SliderRow
                  key={p.key}
                  label={SHORT_LABEL[p.key] ?? p.label}
                  name={p.label}
                  hint={p.description}
                  value={value} min={p.min} max={p.max} step={p.step} shown={readParam(p, value)}
                  onChange={(n) => pg.change({ [p.group]: { [p.key]: n } })}
                />
              );
            })}
          </Section>
        );
      })}
    </>
  );
}

export function TuneStrip({ pg }: { pg: Playground }) {
  const [group, setGroup] = useState<TuneTab>(pg.settings.mode === '3d' ? 'view' : 'lines');
  useEffect(() => { if (pg.settings.mode === '3d') setGroup('view'); }, [pg.settings.mode]);
  return (
    <>
      <Tabs items={TUNE_TABS} value={group} onChange={setGroup} label="Setting group" />
      {group === 'view' ? <ViewTune pg={pg} /> : <ParamTune pg={pg} group={group} />}
    </>
  );
}

export function Shell({ pg, place, tune, exporting, clusterRef, children }: {
  pg: Playground;
  place?: ReactNode;
  tune: ReactNode;
  exporting: ReactNode;
  clusterRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}) {
  return (
    <>
      <Backdrop pg={pg} />
      <Wordmark><Readout pg={pg} /></Wordmark>
      <div className="pt-top">
        <Cluster pg={pg} place={place} tune={tune} exporting={exporting} clusterRef={clusterRef} />
      </div>
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

type PopName = 'place' | 'tune' | 'export';

/** Every cluster popover opens here: under the cluster, right-aligned, 10px below. */
export function ClusterPositioner({ clusterRef, children }: { clusterRef: RefObject<HTMLDivElement | null>; children: ReactNode }) {
  return (
    <Popover.Portal>
      <Popover.Positioner anchor={clusterRef} side="bottom" align="end" sideOffset={10} collisionPadding={{ top: 12, right: 8, bottom: 16, left: 8 }} positionMethod="fixed" className="pt-layer">
        {children}
      </Popover.Positioner>
    </Popover.Portal>
  );
}

export function GlassFrame({ pg, tune, exporting }: {
  pg: Playground;
  tune: ReactNode;
  exporting: (open: boolean, onOpenChange: (open: boolean) => void, clusterRef: RefObject<HTMLDivElement | null>) => ReactNode;
}) {
  const clusterRef = useRef<HTMLDivElement>(null);
  // One popover at a time: opening one closes the others.
  const [open, setOpen] = useState<PopName | null>(null);
  const openChange = (which: PopName) => (next: boolean) => setOpen((cur) => (next ? which : cur === which ? null : cur));
  const region = useRegion(pg);
  const close = useCallback(() => setOpen(null), []);
  useDismiss(close);
  const appearance = resolveMode(pg.settings.theme.mode, document.documentElement.dataset.theme !== 'light');
  return (
    <Shell
      pg={pg}
      clusterRef={clusterRef}
      place={(
        <Popover.Root open={open === 'place'} onOpenChange={openChange('place')}>
          <MapButton hasPlace={Boolean(region.bbox)} />
          <ClusterPositioner clusterRef={clusterRef}>
            <Popover.Popup className="pt-pop pt-pop-wide pt-glass" aria-label="Map" initialFocus={false}>
              <Suspense fallback={<div className="pt-mapbox" />}>
                <PlacePanel region={region} appearance={appearance} />
              </Suspense>
            </Popover.Popup>
          </ClusterPositioner>
        </Popover.Root>
      )}
      tune={(
        <Popover.Root open={open === 'tune'} onOpenChange={openChange('tune')}>
          <Tooltip.Root>
            <Tooltip.Trigger delay={180} render={<Popover.Trigger className="pt-ibtn" aria-label="Tune" />}>
              <SlidersHorizontal size={18} strokeWidth={1.75} />
            </Tooltip.Trigger>
            <Tip>Tune</Tip>
          </Tooltip.Root>
          <ClusterPositioner clusterRef={clusterRef}>
            <Popover.Popup className="pt-pop pt-glass" aria-label="Tune">
              {tune}
            </Popover.Popup>
          </ClusterPositioner>
        </Popover.Root>
      )}
      exporting={exporting(open === 'export', openChange('export'), clusterRef)}
    />
  );
}
