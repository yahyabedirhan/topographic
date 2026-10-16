import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { Toggle } from '@base-ui-components/react/toggle';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Box, Dices, Earth, Frame, Map, Moon, Mountain, SlidersHorizontal, Spline, Sun, Wind, X } from 'lucide-react';
import { MapButton } from './region/controls';
import { MAP_LOOKS } from './region/map-looks';
import { Minimap } from './region/Minimap';
import type { RegionController } from './region/useRegion';
import type { SavedTerrain } from './saved';
import { ignoredWithPlace } from './shape';
import type { Terrains } from './terrains';
import {
  DEFAULT_CAMERA, DEFAULT_DETAIL, DEFAULT_ELEVATION, DEFAULT_EXTENT, GROUPS, paramsIn, resolveMode,
  type QualityName,
  type CameraMotion, type GroupName, type ParamDef, type TerrainExtent,
} from 'topographic';
import { LOOK_CAMERAS, LOOKS } from './looks';
import { OffNote, Preview, Section, SegRow, SliderRow, Tabs, Tip, type TabItem } from './parts';
import { contourArt, flowArt, layoutArt, rigArt, terrainArt, type GlyphName, type TrackKind } from './track-art';
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

/** The 3D frame-rate readout: a quiet status line just above the dock's left edge. */
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
  const wrap = useRef<HTMLDivElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // The map items before the divider: the built-in ones, then the saved ones.
  const maps = MAP_LOOKS.length + saved.items.length;
  const items = maps + LOOKS.length;
  const divider = maps ? DIVIDER : 0;
  const [visible, setVisible] = useState(() => Math.min(LOOKS.length, Math.max(1, Math.floor((Math.min(1100, innerWidth) - 180) / (THUMB + GAP)))));
  // Measured before the first paint, so the dock opens at its final width.
  useLayoutEffect(() => {
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
    sc.scrollTo({ left: start * (THUMB + GAP) + (start >= maps && start > 0 ? divider : 0), behavior: 'smooth' });
  }, [selected, visible, items, divider, maps]);
  const ready = thumbs.reduce((count, url) => count + (url ? 1 : 0), 0);
  // Every look has a slot from the first frame; a look's picture fades in when it is drawn.
  const shown = Math.min(visible, items);
  const width = shown > 0 ? shown * THUMB + Math.max(0, shown - 1) * GAP + (shown > maps ? divider : 0) : 0;
  return (
    <div className="pt-dock-wrap" ref={wrap}>
      <div className="pt-dock-col">
      <Readout pg={pg} />
      <Minimap pg={pg} terrains={terrains} onOpenMap={onOpenMap} />
      <nav className="pt-dock pt-glass" aria-label="Examples" data-looks={LOOKS.length} data-ready={ready} data-saved={saved.items.length}>
        <div className="pt-thumbs" ref={scroller} style={{ width }}>
          {MAP_LOOKS.map((look) => (
            <SavedThumb key={look.id} item={look} current={look === activeMapLook} onOpen={() => terrains.openMapLook(look)} />
          ))}
          {saved.items.map((item) => (
            <SavedThumb
              key={item.id}
              item={item}
              current={item === activeSaved}
              onOpen={() => terrains.openSaved(item)}
              onDelete={() => saved.remove(item.id)}
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
              onClick={() => terrains.openLook(i)}
            >
              <span className={`pt-thumb-media${thumbs[i] ? '' : ' is-loading'}`}>
                {thumbs[i] ? <img src={thumbs[i]} alt="" /> : null}
                <span className="pt-thumb-name" aria-hidden="true">{p.name}</span>
              </span>
            </button>
          ))}
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
const SHORT_LABEL: Partial<Record<string, string>> = { indexEvery: 'Bold lines' };

/** Every Nth line drawn bolder, read as "1 in N". */
const boldEvery = (v: number) => (Math.round(v) < 1 ? 'Off' : `1 in ${Math.round(v)}`);

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
  if (param.key === 'indexEvery') return boldEvery(value);
  return param.integer ? String(value) : value.toFixed(2);
}

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

const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

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
    const caption = dim ? 'Shape from the map' : `${s.terrain.peaks} ${s.terrain.peaks === 1 ? 'peak' : 'peaks'}`;
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

function ViewTune({ pg }: { pg: Playground }) {
  const s = pg.settings;
  const azimuth = ((s.camera.azimuth % 360) + 360) % 360;
  const cam = (patch: Partial<typeof s.camera>) => pg.change({ camera: patch });
  const sceneChanged = s.extent !== DEFAULT_EXTENT || s.elevation !== DEFAULT_ELEVATION;
  // Scene, camera and quality only show in 3D.
  const off = s.mode !== '3d';
  // The camera's default is the active look's camera, or the library's default camera without a look.
  const home = (pg.lookIndex >= 0 && LOOK_CAMERAS[LOOKS[pg.lookIndex].name]) || DEFAULT_CAMERA;
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
        <SegRow label="Extent" icon="extent" options={EXTENTS} value={s.extent} disabled={off} onChange={(id) => pg.change({ extent: id })} />
        <SliderRow
          label="Elevation" icon="elevation" art="elevation"
          hint="0 is flat like the map. Higher values make the terrain taller, with a rounded crest."
          value={s.elevation} min={0} max={1} step={0.01} shown={s.elevation.toFixed(2)} disabled={off}
          onChange={(n) => pg.change({ elevation: n })}
        />
      </Section>
      <Section title="Camera" resetIf={!off && cameraChanged} onReset={() => cam({ ...DEFAULT_CAMERA, ...home })}>
        <SegRow label="Motion" icon="camMotion" options={PATHS} value={s.camera.motion} disabled={off} onChange={(id) => cam({ motion: id })} />
        <SliderRow
          label="Azimuth" icon="azimuth" art="azimuth"
          hint="Orbit around the terrain. Drag the view to move this too. A two-finger scroll pans; a double-click recentres."
          value={azimuth} min={0} max={360} step={1} shown={`${azimuth.toFixed(0)}°`} disabled={off}
          onChange={(n) => cam({ azimuth: n })}
        />
        <SliderRow
          label="Angle" icon="angle" art="angle"
          hint="Degrees above the horizon. The camera never goes below the terrain."
          value={s.camera.elevation} min={2} max={80} step={1} shown={`${s.camera.elevation.toFixed(0)}°`} disabled={off}
          onChange={(n) => cam({ elevation: n })}
        />
        <SliderRow
          label="Distance" icon="distance" art="distance"
          hint="How far the camera sits. ⌘/Ctrl + scroll or pinch the view to zoom (Shift + scroll also zooms)."
          value={s.camera.radius} min={1.15} max={6.5} step={0.01} shown={s.camera.radius.toFixed(2)} disabled={off}
          onChange={(n) => cam({ radius: n })}
        />
      </Section>
      <Section title="Quality" resetIf={!off && (s.detail !== DEFAULT_DETAIL || s.quality !== 'auto')} onReset={() => pg.change({ detail: DEFAULT_DETAIL, quality: 'auto' })}>
        <SegRow
          label="Detail"
          icon="detail"
          hint="Mesh resolution. Low is the setting to try on a slow device."
          options={DETAILS}
          value={detailLevel(s.detail)}
          disabled={off}
          onChange={(id) => pg.change({ detail: DETAILS.find((d) => d.id === id)!.value })}
        />
        <SegRow
          label="Budget"
          icon="detail"
          hint="auto follows this device and steps down if frames miss 60 Hz, or 120 Hz when that refresh is seen."
          options={BUDGETS}
          value={s.quality}
          disabled={off}
          onChange={(id) => pg.change({ quality: id })}
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
      {params.some(off) && <OffNote text={`Shape comes from the map: ${region.name}.`} action="Clear map" onAction={region.clear} />}
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
                <SliderRow
                  key={p.key}
                  label={SHORT_LABEL[p.key] ?? p.label}
                  name={p.label}
                  icon={p.key as GlyphName}
                  art={p.key as TrackKind}
                  hint={off(p) ? 'The map place sets the shape, so this has no effect until you clear it.' : p.description}
                  value={value} min={p.min} max={p.max} step={p.step} shown={readParam(p, value)}
                  valueText={p.group === 'lines' && p.key === 'width' ? linePx(value) : p.key === 'indexEvery' ? boldEvery(value) : undefined}
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

export function Shell({ pg, terrains, place, tune, exporting, clusterRef, onOpenMap, children }: {
  pg: Playground;
  terrains: Terrains;
  onOpenMap?: () => void;
  place?: ReactNode;
  tune: ReactNode;
  exporting: ReactNode;
  clusterRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}) {
  return (
    <>
      <Backdrop pg={pg} />
      <GlRecovery pg={pg} />
      <Wordmark />
      <div className="pt-top">
        <Cluster pg={pg} place={place} tune={tune} exporting={exporting} clusterRef={clusterRef} />
      </div>
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
      exporting={exporting(open === 'export', openChange('export'), clusterRef)}
    />
  );
}
