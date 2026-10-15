import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Toggle } from '@base-ui-components/react/toggle';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Box, Dices, Earth, Frame, Map, Moon, Mountain, SlidersHorizontal, Spline, Sun, Wind, X } from 'lucide-react';
import { MapButton } from './region/controls';
import type { RegionController } from './region/useRegion';
import type { SavedTerrain } from './saved';
import { ignoredWithPlace } from './shape';
import type { Terrains } from './terrains';
import {
  DEFAULT_CAMERA, DEFAULT_DETAIL, DEFAULT_ELEVATION, GROUPS, paramsIn, resolveMode,
  type CameraMotion, type GroupName, type ParamDef, type TerrainExtent,
} from 'topographic';
import { LOOKS } from './looks';
import { PLAYGROUND_CAMERA } from './share-url';
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

/** Shows its state by its icon (map or box) and a 2D or 3D badge, never by a fill: a fill in the cluster means an open popover. */
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
        {on ? <Box size={18} strokeWidth={1.75} /> : <Map size={18} strokeWidth={1.75} />}
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

/** The divider between saved map terrains and the built-in looks: 1px plus one more gap. */
const DIVIDER = 1 + GAP;

function SavedThumb({ item, current, onOpen, onDelete }: {
  item: SavedTerrain;
  current: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const label = `${item.name} map`;
  return (
    <div className="pt-saved">
      <Tooltip.Root>
        <Tooltip.Trigger
          delay={280}
          render={<button type="button" className="pt-thumb" aria-current={current ? 'true' : undefined} aria-label={label} onClick={onOpen} />}
        >
          <span className="pt-thumb-media">
            {item.thumb ? <img src={item.thumb} alt="" /> : <span className="pt-thumb-blank" />}
            <Earth className="pt-thumb-mark" size={11} strokeWidth={2} aria-hidden="true" />
            <span className="pt-thumb-name" aria-hidden="true">{item.name}</span>
          </span>
        </Tooltip.Trigger>
        <Tip side="top">{label}</Tip>
      </Tooltip.Root>
      <button type="button" className="pt-thumb-del" aria-label={`Delete ${item.name}`} onClick={onDelete}>
        <X size={11} strokeWidth={2.25} />
      </button>
    </div>
  );
}

/**
 * Every dock item is a whole terrain. Saved map terrains come first, newest first, then a divider,
 * then the built-in looks. A click switches both the shape and the colours.
 */
export function Dock({ pg, terrains }: { pg: Playground; terrains: Terrains }) {
  const thumbs = useLookThumbs(168, 96);
  const { saved, activeSaved, lookIndex } = terrains;
  const wrap = useRef<HTMLDivElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const items = saved.items.length + LOOKS.length;
  const divider = saved.items.length ? DIVIDER : 0;
  const [visible, setVisible] = useState(() => Math.min(LOOKS.length, Math.max(1, Math.floor((Math.min(1100, innerWidth) - 180) / (THUMB + GAP)))));
  useEffect(() => {
    const el = wrap.current;
    const tool = tools.current;
    if (!el || !tool) return;
    const measure = () => {
      const avail = el.clientWidth - tool.offsetWidth - 20 - divider;
      const n = Math.max(1, Math.min(items, Math.floor((avail + GAP) / (THUMB + GAP))));
      setVisible(n);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [items, divider]);
  const savedIndex = activeSaved ? saved.items.indexOf(activeSaved) : -1;
  const selected = savedIndex >= 0 ? savedIndex : lookIndex >= 0 ? saved.items.length + lookIndex : -1;
  useEffect(() => {
    const sc = scroller.current;
    if (!sc || selected < 0) return;
    const maxStart = Math.max(0, items - visible);
    const start = Math.min(maxStart, Math.max(0, selected - Math.floor((visible - 1) / 2)));
    sc.scrollTo({ left: start * (THUMB + GAP) + (start >= saved.items.length && start > 0 ? divider : 0), behavior: 'smooth' });
  }, [selected, visible, items, divider, saved.items.length]);
  const ready = thumbs.reduce((count, url) => count + (url ? 1 : 0), 0);
  const shown = Math.min(visible, saved.items.length + ready);
  const width = shown > 0 ? shown * THUMB + Math.max(0, shown - 1) * GAP + (shown > saved.items.length ? divider : 0) : 0;
  return (
    <div className="pt-dock-wrap" ref={wrap}>
      <nav className="pt-dock pt-glass" aria-label="Examples" data-looks={LOOKS.length} data-ready={ready} data-saved={saved.items.length}>
        <div className="pt-thumbs" ref={scroller} style={{ width }}>
          {saved.items.map((item) => (
            <SavedThumb
              key={item.id}
              item={item}
              current={item === activeSaved}
              onOpen={() => terrains.openSaved(item)}
              onDelete={() => saved.remove(item.id)}
            />
          ))}
          {saved.items.length ? <span className="pt-dock-divider" aria-hidden="true" /> : null}
          {LOOKS.map((p, i) => thumbs[i] ? (
            <button
              key={p.name}
              type="button"
              className="pt-thumb"
              aria-current={i === lookIndex ? 'true' : undefined}
              aria-label={p.name}
              onClick={() => terrains.openLook(i)}
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
          <IconButton label="Shuffle" side="top" className="pt-tool" onClick={terrains.shuffle}><Dices size={16} strokeWidth={1.75} /></IconButton>
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

/** Line width is stored 0–1 but drawn as a 0.5–4 px stroke (the core's toUniform), so it reads in pixels. */
export function linePx(value: number): string {
  return `${Number((0.5 + value * 3.5).toFixed(1))} px`;
}

function readParam(param: ParamDef, value: number) {
  if (param.group === 'lines' && param.key === 'width') return linePx(value);
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
  const cameraChanged = (Object.keys(PLAYGROUND_CAMERA) as (keyof typeof PLAYGROUND_CAMERA)[]).some((k) => s.camera[k] !== PLAYGROUND_CAMERA[k])
    || s.camera.motion !== DEFAULT_CAMERA.motion;
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
      <Section title="Camera" resetIf={cameraChanged} onReset={() => cam({ ...DEFAULT_CAMERA, ...PLAYGROUND_CAMERA })}>
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

/** One muted line at the top of a tab whose controls a map place overrides, with a way out. */
function PlaceNote({ region }: { region: RegionController }) {
  return (
    <p className="pt-place-note">
      <span>Shape comes from the map: {region.name}.</span>
      <button type="button" className="pt-text-btn" onClick={region.clear}>Clear map</button>
    </p>
  );
}

function ParamTune({ pg, group, region }: { pg: Playground; group: GroupName; region: RegionController }) {
  const params = paramsIn(group);
  const valueOf = (p: ParamDef) => (pg.settings[p.group] as Record<string, number>)[p.key];
  const sections = SECTIONS[group] ?? [{ title: GROUP_LABELS[group], keys: params.map((p) => p.key) }];
  // With a map place applied, the heightfield replaces the generated shape, so these rows do nothing.
  const off = (p: ParamDef) => Boolean(region.bbox) && ignoredWithPlace(p);
  return (
    <>
      {params.some(off) && <PlaceNote region={region} />}
      {sections.map((sec) => {
        const own = sec.keys.map((k) => params.find((p) => p.key === k)).filter((p): p is ParamDef => Boolean(p));
        const live = own.filter((p) => !off(p));
        const changed = live.some((p) => valueOf(p) !== p.default);
        return (
          <Section
            key={sec.title}
            title={sec.title}
            resetIf={changed}
            onReset={() => pg.change({ [group]: Object.fromEntries(live.map((p) => [p.key, p.default])) })}
          >
            {own.map((p) => {
              const value = valueOf(p);
              return (
                <SliderRow
                  key={p.key}
                  label={SHORT_LABEL[p.key] ?? p.label}
                  name={p.label}
                  hint={off(p) ? 'The map place sets the shape, so this has no effect until you clear it.' : p.description}
                  value={value} min={p.min} max={p.max} step={p.step} shown={readParam(p, value)}
                  valueText={p.group === 'lines' && p.key === 'width' ? linePx(value) : undefined}
                  disabled={off(p)}
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

export function TuneStrip({ pg, region }: { pg: Playground; region: RegionController }) {
  const [group, setGroup] = useState<TuneTab>(pg.settings.mode === '3d' ? 'view' : 'lines');
  useEffect(() => { if (pg.settings.mode === '3d') setGroup('view'); }, [pg.settings.mode]);
  return (
    <>
      <Tabs items={TUNE_TABS} value={group} onChange={setGroup} label="Setting group" />
      {group === 'view' ? <ViewTune pg={pg} /> : <ParamTune pg={pg} group={group} region={region} />}
    </>
  );
}

export function Shell({ pg, terrains, place, tune, exporting, clusterRef, children }: {
  pg: Playground;
  terrains: Terrains;
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
      <Dock pg={pg} terrains={terrains} />
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

export function GlassFrame({ pg, terrains, tune, exporting }: {
  pg: Playground;
  terrains: Terrains;
  tune: ReactNode;
  exporting: (open: boolean, onOpenChange: (open: boolean) => void, clusterRef: RefObject<HTMLDivElement | null>) => ReactNode;
}) {
  const clusterRef = useRef<HTMLDivElement>(null);
  // One popover at a time: opening one closes the others.
  const [open, setOpen] = useState<PopName | null>(null);
  const openChange = (which: PopName) => (next: boolean) => setOpen((cur) => (next ? which : cur === which ? null : cur));
  const { region } = terrains;
  const close = useCallback(() => setOpen(null), []);
  useDismiss(close);
  const appearance = resolveMode(pg.settings.theme.mode, document.documentElement.dataset.theme !== 'light');
  return (
    <Shell
      pg={pg}
      terrains={terrains}
      clusterRef={clusterRef}
      place={(
        <Popover.Root open={open === 'place'} onOpenChange={openChange('place')}>
          <MapButton hasPlace={Boolean(region.bbox)} />
          <ClusterPositioner clusterRef={clusterRef}>
            <Popover.Popup className="pt-pop pt-pop-wide pt-glass" aria-label="Map" initialFocus={false}>
              <Suspense fallback={<div className="pt-mapbox" />}>
                <PlacePanel region={region} onApply={terrains.apply} appearance={appearance} />
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
