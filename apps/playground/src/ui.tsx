import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Toggle } from '@base-ui-components/react/toggle';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Box, ChevronLeft, ChevronRight, Dices, Earth, Frame, Map, Moon, Mountain, SlidersHorizontal, Spline, Sun, TriangleAlert, Wind, X } from 'lucide-react';
import { MapButton } from './region/controls';
import { MAP_LOOKS } from './region/map-looks';
import { Minimap } from './region/Minimap';
import type { RegionController } from './region/useRegion';
import type { SavedTerrain } from './saved';
import { ignoredWithPlace } from './shape';
import type { Terrains } from './terrains';
import { InstallMenu } from './install';
import {
  DEFAULT_CAMERA, DEFAULT_DETAIL, LOOKS, DEFAULT_ELEVATION, DEFAULT_EXTENT, GROUPS, RADIUS_MAX, RADIUS_MIN, paramsIn, resolveMode,
  type QualityName,
  type CameraMotion, type GroupName, type ParamDef, type TerrainExtent,
} from 'topographic';
import { PLAYGROUND_QUALITY } from './share-url';
import { OffNote, ParamRow, Preview, Section, SegRow, SliderRow, Tabs, Tip, linePx, ordinal, type TabItem } from './parts';
import { contourArt, flowArt, layoutArt, rigArt, terrainArt, type GlyphName } from './track-art';
import {
  Backdrop, ColorPicker, GROUP_LABELS, INK_SWATCHES, PAPER_SWATCHES, Wordmark, currentColour, rollColour, useLookThumbs,
  type Playground,
} from './shared';
import { TerrainLoading } from './loading';
import { track, trackDebounced, type PanelName } from './analytics';
import { createLowFpsWatch, noteFps } from './perf';

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
            onPressedChange={() => { track('theme_toggled', { to: dark ? 'light' : 'dark' }); pg.change({ theme: { mode: dark ? 'light' : 'dark', ink: undefined, paper: undefined } }); }}
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
            onPressedChange={(pressed) => { track('view_mode_changed', { from: on ? '3d' : '2d', to: pressed ? '3d' : '2d' }); pg.change({ mode: pressed ? '3d' : '2d' }); }}
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
  const [stats, setStats] = useState({ fps: 0, frameMs: 0, mesh: 0, quality: '' });
  useEffect(() => {
    if (pg.settings.mode !== '3d') return;
    let alive = true;
    let id = 0;
    const tick = () => {
      const next = pg.instance.current?.stats;
      if (alive && next) {
        setStats(next);
        noteFps(next.fps);
        document.documentElement.dataset.tier = next.quality;
      }
      id = window.setTimeout(tick, 400);
    };
    tick();
    return () => { alive = false; window.clearTimeout(id); };
  }, [pg, pg.settings.mode, pg.instance]);
  return stats;
}

/** The 3D frame-rate readout: a quiet status line just above the dock's left edge. */
export function Readout({ pg }: { pg: Playground }) {
  const stats = useStats(pg);
  if (pg.settings.mode !== '3d') return null;
  return <div className="pt-fps" data-tier={stats.quality} aria-live="polite">{`${stats.fps} fps · ${stats.frameMs.toFixed(1)} ms · ${stats.mesh}² · ${stats.quality}`}</div>;
}

export function Cluster({ pg, place, tune, share, clusterRef }: {
  pg: Playground;
  place?: ReactNode;
  tune: ReactNode;
  /** Export and Install, after a thin separator. */
  share?: ReactNode;
  clusterRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div className="pt-cluster pt-glass" ref={clusterRef}>
      {place}
      <ModeToggle pg={pg} />
      {tune}
      {share ? <><span className="pt-cluster-sep" aria-hidden="true" />{share}</> : null}
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
              <button type="button" className="pt-dice" aria-label={`Random ${name.toLowerCase()} colour`} onClick={() => { track('shuffle_clicked', { target: which }); pg.change({ theme: { [which]: rollColour(which) } }); }}>
                <Dices size={15} strokeWidth={1.75} />
              </button>
            </div>
            <ColorPicker
              value={value}
              swatches={which === 'ink' ? INK_SWATCHES : PAPER_SWATCHES}
              onChange={(c, source) => { trackDebounced(`colour:${which}`, 'colour_changed', { slot: which, source }); pg.change({ theme: { [which]: c } }); }}
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
  item: Pick<SavedTerrain, 'name' | 'thumb'>;
  current: boolean;
  onOpen: () => void;
  /** Built-in map terrains have no delete. */
  onDelete?: () => void;
}) {
  const label = `${item.name} map`;
  return (
    <div className="pt-saved" data-builtin={onDelete ? undefined : 'true'}>
      <Tooltip.Root>
        <Tooltip.Trigger
          delay={280}
          render={<button type="button" className="pt-thumb" aria-current={current ? 'true' : undefined} aria-label={label} onClick={onOpen} />}
        >
          <span className="pt-thumb-media">
            {item.thumb ? <img src={item.thumb} alt="" /> : <span className="pt-thumb-blank" />}
            <Earth className="pt-thumb-mark" size={10} strokeWidth={2} aria-hidden="true" />
            <span className="pt-thumb-name" aria-hidden="true">{item.name}</span>
          </span>
        </Tooltip.Trigger>
        <Tip side="top">{label}</Tip>
      </Tooltip.Root>
      {onDelete ? (
        <button type="button" className="pt-thumb-del" aria-label={`Delete ${item.name}`} onClick={onDelete}>
          <X size={11} strokeWidth={2.25} />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Every dock item is a whole terrain. The built-in map terrains come first, then the saved map
 * terrains, newest first, then a divider, then the built-in looks. A click switches both the shape
 * and the colours.
 */
export function Dock({ pg, terrains, onOpenMap }: { pg: Playground; terrains: Terrains; onOpenMap?: () => void }) {
  const thumbs = useLookThumbs(168, 96);
  const { saved, activeSaved, activeMapLook, lookIndex } = terrains;
  // A phone spends the saved width on one more preview, so the tile shrinks slightly.
  const thumb = innerWidth <= 720 ? 66 : THUMB;
  const wrap = useRef<HTMLDivElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // The map items before the divider: the built-in ones, then the saved ones.
  const maps = MAP_LOOKS.length + saved.items.length;
  const items = maps + LOOKS.length;
  const divider = maps ? DIVIDER : 0;
  const [visible, setVisible] = useState(() => Math.min(LOOKS.length, Math.max(1, Math.floor((Math.min(1100, innerWidth) - 80) / (thumb + GAP)))));
  const [scroll, setScroll] = useState({ left: 0, max: 0, overflow: false });
  // Measured before the first paint, so the dock opens at its final width.
  useLayoutEffect(() => {
    const el = wrap.current;
    const tool = tools.current;
    if (!el || !tool) return;
    const measure = () => {
      const avail = el.clientWidth - tool.offsetWidth - 8 - divider;
      const n = Math.max(1, Math.min(items, Math.floor((avail + GAP) / (thumb + GAP))));
      setVisible(n);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [items, divider, thumb]);
  const mapLookIndex = activeMapLook ? MAP_LOOKS.indexOf(activeMapLook) : -1;
  const savedIndex = activeSaved ? saved.items.indexOf(activeSaved) : -1;
  const selected = mapLookIndex >= 0 ? mapLookIndex
    : savedIndex >= 0 ? MAP_LOOKS.length + savedIndex
      : lookIndex >= 0 ? maps + lookIndex : -1;
  useEffect(() => {
    const sc = scroller.current;
    if (!sc || selected < 0) return;
    const maxStart = Math.max(0, items - visible);
    const start = Math.min(maxStart, Math.max(0, selected - Math.floor((visible - 1) / 2)));
    sc.scrollTo({ left: start * (thumb + GAP) + (start >= maps && start > 0 ? divider : 0), behavior: 'smooth' });
  }, [selected, visible, items, divider, maps, thumb]);
  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const read = () => {
      const max = Math.max(0, sc.scrollWidth - sc.clientWidth);
      setScroll({ left: sc.scrollLeft, max, overflow: max > 4 });
    };
    read();
    sc.addEventListener('scroll', read, { passive: true });
    const ro = new ResizeObserver(read);
    ro.observe(sc);
    return () => { sc.removeEventListener('scroll', read); ro.disconnect(); };
  }, [visible, items]);
  const ready = thumbs.reduce((count, url) => count + (url ? 1 : 0), 0);
  // Every look has a slot from the first frame; a look's picture fades in when it is drawn.
  const shown = Math.min(visible, items);
  const width = shown > 0 ? shown * thumb + Math.max(0, shown - 1) * GAP + (shown > maps ? divider : 0) : 0;
  return (
    <div className="pt-dock-wrap" ref={wrap}>
      <div className="pt-dock-col">
      <Readout pg={pg} />
      <Minimap pg={pg} terrains={terrains} onOpenMap={onOpenMap} />
      <nav className="pt-dock pt-glass" aria-label="Examples" data-looks={LOOKS.length} data-ready={ready} data-saved={saved.items.length} style={{ ['--thumb' as string]: `${thumb}px` }}>
        <div className="pt-thumb-row">
        <div className={`pt-thumbs${scroll.overflow && scroll.left < scroll.max - 4 ? ' is-more' : ''}${scroll.left > 4 ? ' is-back' : ''}`} ref={scroller} style={{ width }}>
          {MAP_LOOKS.map((look, li) => (
            <SavedThumb key={look.id} item={look} current={look === activeMapLook} onOpen={() => { track('dock_item_clicked', { kind: 'map_look', preset: look.id, index: li }); terrains.openMapLook(look); }} />
          ))}
          {saved.items.map((item, si) => (
            <SavedThumb
              key={item.id}
              item={item}
              current={item === activeSaved}
              onOpen={() => { track('dock_item_clicked', { kind: 'saved', preset: 'saved', index: si }); terrains.openSaved(item); }}
              onDelete={() => { track('saved_terrain_deleted', { index: si }); saved.remove(item.id); }}
            />
          ))}
          {maps ? <span className="pt-dock-divider" aria-hidden="true" /> : null}
          {LOOKS.map((p, i) => (
            <button
              key={p.name}
              type="button"
              className="pt-thumb"
              aria-current={i === lookIndex ? 'true' : undefined}
              aria-label={p.name}
              onClick={() => { track('dock_item_clicked', { kind: 'look', preset: p.name, index: i }); terrains.openLook(i); }}
            >
              <span className={`pt-thumb-media${thumbs[i] ? '' : ' is-loading'}`}>
                {thumbs[i] ? <img src={thumbs[i]} alt="" /> : null}
                <span className="pt-thumb-name" aria-hidden="true">{p.name}</span>
              </span>
            </button>
          ))}
        </div>
          {scroll.overflow && scroll.left > 4 ? (
            <button type="button" className="pt-scroll-more is-back" aria-label="Earlier terrains" onClick={() => scroller.current?.scrollBy({ left: -(thumb + GAP), behavior: 'smooth' })}>
              <ChevronLeft size={16} strokeWidth={1.75} />
            </button>
          ) : null}
          {scroll.overflow && scroll.left < scroll.max - 4 ? (
            <button type="button" className="pt-scroll-more" aria-label="More terrains" onClick={() => scroller.current?.scrollBy({ left: thumb + GAP, behavior: 'smooth' })}>
              <ChevronRight size={16} strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
        {/* Theme, shuffle, then the two colours, in a 2×2 grid. */}
        <div className="pt-dock-tools" ref={tools}>
          <ThemeToggle pg={pg} />
          <IconButton label="Shuffle" side="top" className="pt-tool" onClick={() => { track('shuffle_clicked', { target: 'all' }); terrains.shuffle(); }}><Dices size={16} strokeWidth={1.75} /></IconButton>
          <span className="pt-tool-slot"><ColorField pg={pg} which="paper" /></span>
          <span className="pt-tool-slot"><ColorField pg={pg} which="ink" /></span>
        </div>
      </nav>
      </div>
    </div>
  );
}

const GROUP_ICON: Record<GroupName, typeof Spline> = { lines: Spline, terrain: Mountain, motion: Wind, layout: Frame };

type TuneTab = GroupName | 'view';

const TUNE_TABS: TabItem<TuneTab>[] = [
  ...GROUPS.map((g) => ({ id: g as TuneTab, label: GROUP_LABELS[g], icon: GROUP_ICON[g] })),
  { id: 'view', label: '3D', icon: Box },
];

/** Groups with more than four rows split into sections; the rest keep one, named after the group. */
const SECTIONS: Partial<Record<GroupName, { title: string; keys: string[] }[]>> = {
  terrain: [
    { title: 'Form', keys: ['peaks', 'spread', 'sharpness', 'variant'] },
    { title: 'Surface', keys: ['roughness', 'terracing'] },
  ],
};

const PATHS: { id: CameraMotion; label: string; glyph: GlyphName }[] = [
  { id: 'still', label: 'Still', glyph: 'still' },
  { id: 'orbit', label: 'Orbit', glyph: 'orbit' },
  { id: 'push', label: 'Push', glyph: 'push' },
  { id: 'flyover', label: 'Flyover', glyph: 'flyover' },
  { id: 'drone', label: 'Drone', glyph: 'drone' },
];

const EXTENTS: { id: TerrainExtent; label: string; glyph: GlyphName }[] = [
  { id: 'block', label: 'Block', glyph: 'block' },
  { id: 'endless', label: 'Endless', glyph: 'endless' },
];

type DetailLevel = 'low' | 'medium' | 'high';
const DETAILS: { id: DetailLevel; label: string; glyph: GlyphName; value: number }[] = [
  { id: 'low', label: 'Low', glyph: 'low', value: 0.12 },
  { id: 'medium', label: 'Medium', glyph: 'medium', value: DEFAULT_DETAIL },
  { id: 'high', label: 'High', glyph: 'high', value: 1 },
];

const BUDGETS: { id: QualityName; label: string; glyph: GlyphName }[] = [
  { id: 'auto', label: 'Auto', glyph: 'medium' },
  { id: 'low', label: 'Low', glyph: 'low' },
  { id: 'medium', label: 'Med', glyph: 'medium' },
  { id: 'high', label: 'High', glyph: 'high' },
];

function detailLevel(detail: number): DetailLevel {
  return detail <= 0.2 ? 'low' : detail >= 0.8 ? 'high' : 'medium';
}

/**
 * The camera's pose along its motion path, read from the renderer a few times a second while `moving`.
 * The preview follows the camera without redrawing on every frame. Null while the camera stands still.
 */
function useLivePose(pg: Playground, moving: boolean) {
  const [pose, setPose] = useState<{ azimuth: number; elevation: number; radius: number } | null>(null);
  useEffect(() => {
    if (!moving || matchMedia('(prefers-reduced-motion: reduce)').matches) { setPose(null); return; }
    const read = () => { const p = pg.instance.current?.pose; if (p) setPose({ ...p }); };
    read();
    const id = window.setInterval(read, 160);
    return () => window.clearInterval(id);
  }, [pg.instance, moving]);
  return moving ? pose : null;
}

/** The live picture at the top of a settings tab, drawn from that tab's values. */
function GroupPreview({ pg, group, dim }: { pg: Playground; group: GroupName; dim: boolean }) {
  const s = pg.settings;
  if (group === 'lines') {
    const L = s.lines;
    const ie = Math.round(L.indexEvery);
    const caption = `${L.count} lines · ${linePx(L.width)} · ${ie === 0 ? 'no bold lines' : ie === 1 ? 'every line bold' : `every ${ordinal(ie)} bold`}`;
    return <Preview height={92} caption={caption} label={caption} art={(w) => contourArt(L, w, 92, w * 0.7, 54, 230)} />;
  }
  if (group === 'terrain') {
    const caption = dim ? 'Terrain from the map' : `${s.terrain.peaks} ${s.terrain.peaks === 1 ? 'peak' : 'peaks'}`;
    return <Preview height={92} dim={dim} caption={caption} label={`Terrain profile: ${caption}`} art={(w) => terrainArt(s.terrain, w, 82, 16)} />;
  }
  if (group === 'motion') {
    const m = s.motion;
    const caption = m.speed === 0 ? 'Still' : `${m.speed.toFixed(2)}× speed`;
    return (
      <Preview
        height={92}
        className={m.speed > 0 ? 'pt-flow' : ''}
        caption={caption}
        label={`Flow: ${caption}`}
        art={(w) => flowArt(m, w, 92)}
      />
    );
  }
  const a = s.layout.anchor;
  const caption = a < 0.05 ? 'Summit to the side' : a > 0.95 ? 'Summit centred' : `Summit ${Math.round(a * 100)}% to centre`;
  return <Preview height={104} caption={caption} label={`Page layout: ${caption}`} art={(w) => layoutArt(s.layout, w, 104)} />;
}

/** One `setting_changed` per control once it has been still for a moment, never one per drag step. */
function tuned(group: string, key: string): void {
  trackDebounced(`setting:${group}.${key}`, 'setting_changed', { group, key });
}

function ViewTune({ pg }: { pg: Playground }) {
  const s = pg.settings;
  const azimuth = ((s.camera.azimuth % 360) + 360) % 360;
  const cam = (patch: Partial<typeof s.camera>) => pg.change({ camera: patch });
  const sceneChanged = s.extent !== DEFAULT_EXTENT || s.elevation !== DEFAULT_ELEVATION;
  // Scene, camera and quality only show in 3D.
  const off = s.mode !== '3d';
  // The camera's default is the active look's camera, or the library's default camera without a look.
  const home = (pg.lookIndex >= 0 && LOOKS[pg.lookIndex].settings.camera) || DEFAULT_CAMERA;
  const cameraChanged = (Object.keys(home) as (keyof typeof home)[]).some((k) => s.camera[k] !== home[k])
    || s.camera.motion !== DEFAULT_CAMERA.motion || s.camera.panX !== 0 || s.camera.panZ !== 0;
  const pose = useLivePose(pg, !off && s.camera.motion !== 'still');
  const rig = { azimuth: pose?.azimuth ?? azimuth, angle: pose?.elevation ?? s.camera.elevation, distance: pose?.radius ?? s.camera.radius, elevation: s.elevation, motion: s.camera.motion };
  return (
    <>
      {off && <OffNote text="These apply in 3D." action="Switch to 3D" onAction={() => pg.change({ mode: '3d' })} />}
      <Preview
        height={100}
        dim={off}
        className="pt-rig"
        label={`Camera at azimuth ${Math.round(((rig.azimuth % 360) + 360) % 360)}°, ${Math.round(rig.angle)}° above the horizon, distance ${rig.distance.toFixed(2)}`}
        art={(w) => rigArt(rig, w, 100)}
      >
        <span className="pt-preview-label" style={{ left: 10 }}>Top</span>
        <span className="pt-preview-label" style={{ left: 124 }}>Side</span>
      </Preview>
      <Section title="Scene" resetIf={!off && sceneChanged} onReset={() => pg.change({ extent: DEFAULT_EXTENT, elevation: DEFAULT_ELEVATION })}>
        <SegRow label="Extent" icon="extent" options={EXTENTS} value={s.extent} disabled={off} onChange={(id) => { tuned('view', 'extent'); pg.change({ extent: id }); }} />
        <SliderRow
          label="Elevation" icon="elevation" art="elevation"
          hint="0 is flat like the map. Higher values make the terrain taller, with a rounded crest."
          value={s.elevation} min={0} max={1} step={0.01} shown={s.elevation.toFixed(2)} disabled={off}
          onChange={(n) => { tuned('view', 'elevation'); pg.change({ elevation: n }); }}
        />
      </Section>
      <Section title="Camera" resetIf={!off && cameraChanged} onReset={() => cam({ ...DEFAULT_CAMERA, ...home })}>
        <SegRow label="Motion" icon="camMotion" options={PATHS} value={s.camera.motion} disabled={off} onChange={(id) => { tuned('camera', 'motion'); cam({ motion: id }); }} />
        <SliderRow
          label="Azimuth" icon="azimuth" art="azimuth"
          hint="Orbit around the terrain. ⌘ + drag the view to move this too, or twist two fingers. A drag moves the terrain; a double-click recentres."
          value={azimuth} min={0} max={360} step={1} shown={`${azimuth.toFixed(0)}°`} disabled={off}
          onChange={(n) => { tuned('camera', 'azimuth'); cam({ azimuth: n }); }}
        />
        <SliderRow
          label="Angle" icon="angle" art="angle"
          hint="Degrees above the horizon. The camera never goes below the terrain."
          value={s.camera.elevation} min={2} max={80} step={1} shown={`${s.camera.elevation.toFixed(0)}°`} disabled={off}
          onChange={(n) => { tuned('camera', 'elevation'); cam({ elevation: n }); }}
        />
        <SliderRow
          label="Distance" icon="distance" art="distance"
          hint="How far the camera sits. Scroll or pinch the view to zoom."
          value={s.camera.radius} min={RADIUS_MIN} max={RADIUS_MAX} step={0.01} shown={s.camera.radius.toFixed(2)} disabled={off}
          onChange={(n) => { tuned('camera', 'radius'); cam({ radius: n }); }}
        />
      </Section>
      <Section title="Quality" resetIf={!off && (s.detail !== PLAYGROUND_QUALITY.detail || s.quality !== PLAYGROUND_QUALITY.quality)} onReset={() => pg.change(PLAYGROUND_QUALITY)}>
        <SegRow
          label="Detail"
          icon="detail"
          hint="Mesh resolution. Low is the setting to try on a slow device."
          options={DETAILS}
          value={detailLevel(s.detail)}
          disabled={off}
          onChange={(id) => { track('quality_changed', { setting: 'detail', value: String(id) }); pg.change({ detail: DETAILS.find((d) => d.id === id)!.value }); }}
        />
        <SegRow
          label="Budget"
          icon="detail"
          hint="auto follows this device and steps down if frames miss 60 Hz, or 120 Hz when that refresh is seen."
          options={BUDGETS}
          value={s.quality}
          disabled={off}
          onChange={(id) => { track('quality_changed', { setting: 'budget', value: String(id) }); pg.change({ quality: id }); }}
        />
      </Section>
    </>
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
      {params.some(off) && <OffNote text={`Terrain comes from the map: ${region.name}.`} action="Clear map" onAction={region.clear} />}
      <GroupPreview pg={pg} group={group} dim={params.every(off)} />
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
                <ParamRow
                  key={p.key}
                  param={p}
                  value={value}
                  hint={off(p) ? 'The map place sets the terrain, so this has no effect until you clear it.' : undefined}
                  disabled={off(p)}
                  onChange={(n) => { tuned(p.group, p.key); pg.change({ [p.group]: { [p.key]: n } }); }}
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

/** Shown only while the GPU context is gone. The renderer replaces it on its own. */
function GlRecovery({ pg }: { pg: Playground }) {
  const [lost, setLost] = useState(false);
  useEffect(() => {
    let alive = true;
    let id = 0;
    const tick = () => {
      if (!alive) return;
      const next = pg.instance.current?.status === 'lost';
      setLost((cur) => (cur === next ? cur : next));
      id = window.setTimeout(tick, 200);
    };
    tick();
    return () => { alive = false; window.clearTimeout(id); };
  }, [pg]);
  if (!lost) return null;
  return <div className="pt-recover" role="status">Bringing the terrain back</div>;
}

const PROMPT_KEY = 'topographic-low-performance-prompt';

/** True once the prompt has shown in this browser session. */
function promptSeen(): boolean {
  try { return sessionStorage.getItem(PROMPT_KEY) === 'seen'; } catch { return false; }
}

function notePromptSeen(): void {
  try { sessionStorage.setItem(PROMPT_KEY, 'seen'); } catch { /* the prompt then shows again after a reload */ }
}

/**
 * Shows under the cluster when the frame rate stays below 30 fps at a quality above medium. A click
 * sets Detail and Budget to medium. It shows at most once per browser session.
 */
function LowPerformancePrompt({ pg, loading }: { pg: Playground; loading: boolean }) {
  const [state, setState] = useState<'watch' | 'shown' | 'done'>(() => (promptSeen() ? 'done' : 'watch'));
  const { detail, quality, mode, motion } = pg.settings;
  const heavy = detail > DEFAULT_DETAIL || quality === 'high';
  const live = useRef(pg);
  live.current = pg;
  const still = mode === '2d' && motion.speed === 0;
  useEffect(() => {
    if (state !== 'watch' || !heavy) return;
    // Starts again on a change of quality or view, so the new setting gets its own warmup.
    const watch = createLowFpsWatch();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const id = window.setInterval(() => {
      const t = live.current.instance.current;
      const drawing = t?.status === 'webgl2' || t?.status === 'webgl1';
      const paused = loading || still || !drawing || document.visibilityState === 'hidden' || reduced.matches;
      const fps = t?.stats.fps ?? 0;
      if (!watch.sample(performance.now(), fps, paused)) return;
      const s = live.current.settings;
      notePromptSeen();
      setState('shown');
      track('low_performance_prompt_shown', { fps, view_mode: s.mode, detail: detailLevel(s.detail), budget: s.quality });
    }, 500);
    return () => window.clearInterval(id);
  }, [state, heavy, loading, still, detail, quality, mode]);
  // Lowered by hand from Tune: the prompt has nothing left to do.
  useEffect(() => { if (state === 'shown' && !heavy) setState('done'); }, [state, heavy]);
  if (state !== 'shown') return null;
  return (
    <div className="pt-lowperf pt-cluster pt-glass">
      <button
        type="button"
        className="pt-ibtn pt-lowperf-btn"
        onClick={() => {
          track('low_performance_prompt_clicked');
          pg.change({ detail: DEFAULT_DETAIL, quality: 'medium' });
          setState('done');
        }}
      >
        <TriangleAlert size={16} strokeWidth={1.75} aria-hidden="true" />
        <span>Low performance: reduce quality</span>
      </button>
    </div>
  );
}

export function Shell({ pg, terrains, place, tune, install, clusterRef, onOpenMap, children }: {
  pg: Playground;
  terrains: Terrains;
  onOpenMap?: () => void;
  place?: ReactNode;
  tune: ReactNode;
  /** Export and Install, the cluster's second group. */
  install?: ReactNode;
  clusterRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}) {
  return (
    <>
      <Backdrop pg={pg} hold={terrains.region.status === 'loading'} />
      {terrains.region.status === 'loading' ? <TerrainLoading /> : null}
      <GlRecovery pg={pg} />
      <Wordmark />
      <div className="pt-top">
        <Cluster pg={pg} place={place} tune={tune} share={install} clusterRef={clusterRef} />
      </div>
      <LowPerformancePrompt pg={pg} loading={terrains.region.status === 'loading'} />
      {children}
      <Dock pg={pg} terrains={terrains} onOpenMap={onOpenMap} />
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

type PopName = 'place' | 'tune' | 'export' | 'install';

const PANEL: Record<PopName, PanelName> = { place: 'map', tune: 'tune', export: 'export', install: 'install' };

/** Sends `panel_opened` when a cluster popover opens and `panel_closed` with how long it stayed open. */
function usePanelTiming(open: PopName | null) {
  const since = useRef(0);
  useEffect(() => {
    if (!open) return;
    since.current = performance.now();
    track('panel_opened', { panel: PANEL[open] });
    const closed = () => track('panel_closed', { panel: PANEL[open], open_ms: Math.round(performance.now() - since.current) });
    return closed;
  }, [open]);
}

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
  usePanelTiming(open);
  const appearance = resolveMode(pg.settings.theme.mode, document.documentElement.dataset.theme !== 'light');
  return (
    <Shell
      pg={pg}
      terrains={terrains}
      clusterRef={clusterRef}
      onOpenMap={() => setOpen('place')}
      place={(
        <Popover.Root open={open === 'place'} onOpenChange={openChange('place')}>
          <MapButton hasPlace={Boolean(region.bbox)} />
          <ClusterPositioner clusterRef={clusterRef}>
            <Popover.Popup className="pt-pop pt-pop-wide pt-pop-map pt-glass" aria-label="Map" initialFocus={false}>
              <Suspense fallback={<div className="pt-mapbox" />}>
                <PlacePanel region={region} onApply={terrains.apply} appliedName={terrains.activeMapLook?.name ?? terrains.activeSaved?.name} appearance={appearance} />
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
      install={(
        <InstallMenu
          pg={pg} region={region} open={open === 'install'} onOpenChange={openChange('install')} onOpenExport={() => setOpen('export')}
          anchor={clusterRef} exporting={exporting(open === 'export', openChange('export'), clusterRef)}
        />
      )}
    />
  );
}
