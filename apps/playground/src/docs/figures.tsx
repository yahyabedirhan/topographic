// The docs page's figures. Real places and every tuned figure are live; pictures that never change are stills.
// Inputs are the playground's own Tune rows (parts.tsx) and icon buttons (ui.tsx), and each input rewrites the code
// under its figure, so the code always draws what the figure shows.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Box, Dices, Map as MapIcon } from 'lucide-react';
import { PARAMS, RADIUS_MAX, RADIUS_MIN, resolveSettings, type CameraMotion, type GroupName, type Settings, type SettingsInput, type TerrainExtent } from 'topographic';
import { ParamRow, Section, SegRow, SliderRow, Glyph } from '../parts';
import { IconButton } from '../ui';
import { CodeBlock, CopyButton, LiveCode } from './CodeBlocks';
import { asProps, codeFor, highlight } from './code';
import { CODE, DARK, INSTALL_WAYS, LIGHT, LLMS_HEAD, LOOK_GALLERY, NPM, PLAYGROUND, SHAPE_IDS, byId } from './content';
import { fullSettings, lazyLive, merge, stills, vivid, volcano, type LiveView, type StillItem } from './live';
import { PLACE_ORDER, loadPlace, placeOf } from './places';

/** Asks the page to place its margin notes again, after a figure changed its height. */
export const relayout = () => window.dispatchEvent(new Event('docs-relayout'));

const SHOTS = import.meta.glob('../../../../assets/screenshots/{place,look}-*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const shot = (name: string) => SHOTS[`../../../../assets/screenshots/${name}.webp`];

/** Real places on this page: the playground's fine lines in a brighter ink, at full strength, with an orbit. */
const PLACE_LOOK: SettingsInput = { theme: { mode: 'dark', ink: '#c9d6ea' }, lines: { width: 0, opacity: 1 }, motion: { sparkle: 0.25 }, camera: { motion: 'orbit' } };

/* ---------------------------------------------------------------- small parts */

/** Icon buttons over a figure's top-right corner, in the playground's glass. A lone button carries its own small glass. */
function Tools({ lone = false, className = '', children }: { lone?: boolean; className?: string; children: ReactNode }) {
  return <div className={`${lone ? 'stage-tools lone' : 'pt-cluster pt-glass stage-tools'} ${className}`}>{children}</div>;
}

/** The playground's 2D/3D button, icon only: a box for 3D, a folded map for 2D. */
function ModeButton({ three, onChange }: { three: boolean; onChange: (three: boolean) => void }) {
  return (
    <IconButton className="pt-ibtn pt-mode" label={three ? 'Switch to 2D' : 'Switch to 3D'} pressed={three} onClick={() => onChange(!three)}>
      {three ? <Box size={18} strokeWidth={1.75} /> : <MapIcon size={18} strokeWidth={1.75} />}
    </IconButton>
  );
}

function Caption({ children }: { children: ReactNode }) {
  return <figcaption className="cap">{children}</figcaption>;
}

type Load = 'loading' | 'ready' | 'failed';
const loadClass = (s: Load) => (s === 'loading' ? ' loading' : s === 'failed' ? ' failed' : '');

/** A live view of a real place in `stage`, with the place's own settings under `look`. */
function usePlace(stage: RefObject<HTMLDivElement | null>, id: string, look: SettingsInput, defaultsOf = id): { view: RefObject<LiveView | null>; state: Load } {
  const view = useRef<LiveView | null>(null);
  const [state, setState] = useState<Load>('loading');
  useEffect(() => {
    let off = false;
    Promise.all([loadPlace(id), loadPlace(defaultsOf)]).then(([{ field }, { defaults }]) => {
      if (off || !stage.current) return;
      view.current = lazyLive(stage.current, merge(defaults, look), { field });
      setState('ready');
    }).catch(() => { if (!off) setState('failed'); });
    return () => { off = true; view.current?.destroy(); view.current = null; };
  }, [stage, id, look, defaultsOf]);
  return { view, state };
}

/** Stills drawn once the element comes near the viewport. */
function useStills(ref: RefObject<HTMLElement | null>, items: () => StillItem[], size: { width: number; height: number; frame?: number }): (string | null)[] {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const make = useRef(items);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let off = false;
    let made: string[] = [];
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      void stills(make.current(), size).then((list) => {
        made = list.filter((u): u is string => Boolean(u));
        if (off) { made.forEach((u) => URL.revokeObjectURL(u)); return; }
        setUrls(list);
        relayout();
      });
    }, { rootMargin: '1200px 0px' });
    io.observe(el);
    return () => { off = true; io.disconnect(); made.forEach((u) => URL.revokeObjectURL(u)); };
    // The size is fixed per figure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
  return urls;
}

const bg = (url: string | null | undefined) => (url ? { backgroundImage: `url(${url})` } : undefined);

/* ---------------------------------------------------------------- the opening */

/** Everest from real heights, with the React that draws it beside it. The camera's angles tick as it orbits. */
export function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  const { view, state } = usePlace(stage, 'everest', PLACE_LOOK);
  const [three, setThree] = useState(true);
  const code = useRef<HTMLElement>(null);
  const text = useRef('');
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 90) return;
      last = now;
      const p = view.current?.pose;
      const az = p ? (((p.azimuth % 360) + 360) % 360).toFixed(1) : '341.8';
      const el = p ? p.elevation.toFixed(1) : '40.0';
      const next = three
        ? `<Topography\n  location="everest"\n  mode="3d"\n  camera={{\n    azimuth: ${az},\n    elevation: ${el},\n  }}\n/>`
        : '<Topography\n  location="everest"\n  mode="2d"\n/>';
      if (next === text.current || !code.current) return;
      text.current = next;
      code.current.innerHTML = highlight(next, 'js');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [view, three]);
  return (
    <figure className="fig" id="fig-hero">
      <div className={`stage tall${loadClass(state)}`} ref={stage} />
      <Tools lone><ModeButton three={three} onChange={(on) => { setThree(on); view.current?.update({ mode: on ? '3d' : '2d' }); }} /></Tools>
      <div className="ctl">
        <figure className="code mini">
          <pre><code ref={code} /></pre>
          <CopyButton text={() => text.current} />
        </figure>
      </div>
      <Caption>Everest and the Khumbu, <code>location="everest"</code></Caption>
    </figure>
  );
}

/* ---------------------------------------------------------------- install and first terrain */

const SPARK = <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.94 14.06 4 20M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" /></svg>;
const HAND = <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>;

/** Istanbul, live, as the one-line install example draws it, beside the two ways to install. */
export function InstallFigure() {
  const stage = useRef<HTMLDivElement>(null);
  // The same settings as the Everest hero (camera, relief, look); only the heights are Istanbul's, so the two match.
  const { view, state } = usePlace(stage, 'istanbul', PLACE_LOOK, 'everest');
  const [three, setThree] = useState(true);
  return (
    <>
      <figure className="fig" id="fig-install">
        <div className={`stage tall${loadClass(state)}`} ref={stage} />
        <Tools lone><ModeButton three={three} onChange={(on) => { setThree(on); view.current?.update({ mode: on ? '3d' : '2d' }); }} /></Tools>
        <Caption>After install, <code>{'<Topography location="istanbul" />'}</code> draws Istanbul.</Caption>
      </figure>
      <div className="inst">
        <div>
          <div className="inst-t">{SPARK}{INSTALL_WAYS.agent.label}</div>
          <CodeBlock code={INSTALL_WAYS.agent.cmd} lang="sh" one />
        </div>
        <div>
          <div className="inst-t">{HAND}<a href={NPM} target="_blank" rel="noreferrer">{INSTALL_WAYS.npm.label}</a></div>
          <CodeBlock code={INSTALL_WAYS.npm.cmd} lang="sh" one />
          <CodeBlock code={INSTALL_WAYS.npm.react} lang="sh" one />
        </div>
      </div>
    </>
  );
}

/** A live view that never changes, such as the first terrain's long ridge. */
function Plain({ settings, className = '' }: { settings: SettingsInput; className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const v = lazyLive(stage.current!, vivid(settings));
    return () => v.destroy();
  }, [settings]);
  return <div className={`stage ${className}`} ref={stage} />;
}

export function FirstFigure() {
  return (
    <figure className="fig">
      <Plain settings={byId.first.live!} className="short" />
      <Caption>All three snippets draw this long ridge in 3D.</Caption>
    </figure>
  );
}

/* ---------------------------------------------------------------- real places */

const TOUR = ['grand-canyon', 'yosemite', 'everest'];

/** The place gallery picks the live place, and the code names it. Until someone picks, three places take turns. */
export function PlacesFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const view = useRef<LiveView | null>(null);
  const [id, setId] = useState(TOUR[0]);
  const [touring, setTouring] = useState(true);
  const [state, setState] = useState<Load>('loading');
  useEffect(() => {
    let off = false;
    setState((s) => (s === 'ready' ? s : 'loading'));
    loadPlace(id).then(({ field, defaults }) => {
      if (off || !stage.current) return;
      const s = merge(defaults, PLACE_LOOK);
      if (!view.current) view.current = lazyLive(stage.current, s, { field });
      else { view.current.update(fullSettings(s)); view.current.setHeightfield(field); }
      setState('ready');
    }).catch(() => { if (!off) setState('failed'); });
    return () => { off = true; };
  }, [id]);
  useEffect(() => () => { view.current?.destroy(); view.current = null; }, []);
  useEffect(() => {
    // Warm the cache for the tour, so each turn draws at once.
    TOUR.forEach((p) => { void loadPlace(p).catch(() => {}); });
    if (!touring) return;
    const timer = window.setInterval(() => {
      const r = stage.current?.getBoundingClientRect();
      if (document.hidden || !r || r.bottom < 0 || r.top > innerHeight) return;
      setId((cur) => TOUR[(TOUR.indexOf(cur) + 1) % TOUR.length]);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [touring]);
  const place = placeOf(id);
  return (
    <>
      <figure className="fig">
        <div className={`stage tall${loadClass(state)}`} ref={stage} />
        <Caption>{place.name}, <code>location="{id}"</code></Caption>
      </figure>
      <LiveCode code={codeFor({ location: id })} />
      <div className="plist">
        {PLACE_ORDER.map((p) => (
          <button key={p} type="button" data-place={p} aria-pressed={p === id} onClick={() => { setTouring(false); setId(p); }}>
            <img src={shot(`place-${p}`)} alt="" loading="lazy" width={160} height={100} />
            <b>{placeOf(p).name}</b>
            <code>{p}</code>
          </button>
        ))}
        <div className="any">
          <div className="box"><Glyph name="place" size={22} stroke={1.5} /></div>
          <b>Any area</b>
          <code>fetchLocation()</code>
        </div>
      </div>
      <CodeBlock code={CODE.locations.js!} />
    </>
  );
}

/* ---------------------------------------------------------------- tuned figures */

type Set = (patch: SettingsInput) => void;

interface TunedProps {
  initial: SettingsInput;
  /** The settings the code names, in order. */
  keys: string[];
  className?: string;
  cap: (s: Settings) => ReactNode;
  panel: (s: Settings, set: Set, init: Settings) => ReactNode;
  tools?: (s: Settings, set: Set) => ReactNode;
  ctl?: (view: LiveView | null) => ReactNode;
  onView?: (view: LiveView | null) => void;
}

/** A live figure with the playground's Tune rows under it, and the code that draws exactly what it shows. */
function Tuned({ initial, keys, className = 'short', cap, panel, tools, ctl, onView }: TunedProps) {
  const stage = useRef<HTMLDivElement>(null);
  const view = useRef<LiveView | null>(null);
  const [settings, setSettings] = useState<SettingsInput>(() => vivid(initial));
  const [mounted, setMounted] = useState<LiveView | null>(null);
  const init = useMemo(() => resolveSettings(vivid(initial)), [initial]);
  useEffect(() => {
    const v = lazyLive(stage.current!, vivid(initial));
    view.current = v;
    setMounted(v);
    onView?.(v);
    return () => { onView?.(null); v.destroy(); view.current = null; };
    // A figure mounts once; its inputs change it through `set`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = useCallback<Set>((patch) => {
    setSettings((s) => merge(s, patch));
    view.current?.update(patch);
  }, []);
  const s = useMemo(() => resolveSettings(settings), [settings]);
  return (
    <>
      <figure className="fig">
        <div className={`stage ${className}`} ref={stage} />
        {tools?.(s, set)}
        {ctl ? <div className="ctl">{ctl(mounted)}</div> : null}
        <Caption>{cap(s)}</Caption>
      </figure>
      <div className="tune">{panel(s, set, init)}</div>
      <LiveCode code={codeFor(asProps(settings, keys))} />
    </>
  );
}

const param = (group: GroupName, key: string) => PARAMS.find((p) => p.group === group && p.key === key)!;
const groupOf = (s: Settings, group: GroupName) => s[group] as unknown as Record<string, number>;

/** A Tune section of the library's parameters, with the playground's reset when any of them moved. */
function ParamSection({ title, group, keys, s, set, init }: { title: string; group: GroupName; keys: string[]; s: Settings; set: Set; init: Settings }) {
  const now = groupOf(s, group);
  const was = groupOf(init, group);
  return (
    <Section title={title} resetIf={keys.some((k) => now[k] !== was[k])} onReset={() => set({ [group]: Object.fromEntries(keys.map((k) => [k, was[k]])) })}>
      {keys.map((k) => <ParamRow key={k} param={param(group, k)} value={now[k]} onChange={(n) => set({ [group]: { [k]: n } })} />)}
    </Section>
  );
}

const roll = (a: number, b: number, step = 0.01) => +(a + Math.round((Math.random() * (b - a)) / step) * step).toFixed(2);
const TERRAIN_KEYS = ['peaks', 'spread', 'roughness', 'sharpness'];

/** Generated shapes: a base shape, a seed and the terrain settings. New land rolls all of them. */
export function ShapeFigure() {
  return (
    <Tuned
      initial={byId.landforms.live!}
      keys={['shape', 'seed', 'terrain', 'lines', 'mode', 'camera']}
      className=""
      cap={(s) => <><code>shape: '{s.shape}'</code> at seed {s.seed}, one variation in a million.</>}
      tools={(_s, set) => (
        <Tools lone>
          <IconButton className="pt-ibtn newland" label="New land" onClick={() => set({
            shape: SHAPE_IDS[Math.floor(Math.random() * SHAPE_IDS.length)],
            seed: Math.floor(Math.random() * 10000),
            terrain: { peaks: roll(1, 5, 1), spread: roll(0.2, 0.9), roughness: roll(0, 0.6), sharpness: roll(0.25, 0.8) },
          })}
          >
            <Dices size={18} strokeWidth={1.75} />
          </IconButton>
        </Tools>
      )}
      panel={(s, set, init) => {
        const changed = s.shape !== init.shape || s.seed !== init.seed || TERRAIN_KEYS.some((k) => groupOf(s, 'terrain')[k] !== groupOf(init, 'terrain')[k]);
        return (
          <Section title="Land" resetIf={changed} onReset={() => set({ shape: init.shape, seed: init.seed, terrain: Object.fromEntries(TERRAIN_KEYS.map((k) => [k, groupOf(init, 'terrain')[k]])) })}>
            <div className="pt-row wide">
              <span className="pt-row-icon"><Glyph name="style" size={15} /></span>
              <span className="pt-row-label">Shape</span>
              <div className="shapes" role="group" aria-label="Shape">
                {SHAPE_IDS.map((id) => <button key={id} type="button" aria-pressed={id === s.shape} onClick={() => set({ shape: id })}>{id}</button>)}
              </div>
            </div>
            <SliderRow label="Seed" icon="seed" art="variant" hint="One variation of the shape. The library takes 0 to 999999." value={s.seed} min={0} max={9999} step={1} shown={String(s.seed)} onChange={(n) => set({ seed: n })} />
            {TERRAIN_KEYS.map((k) => <ParamRow key={k} param={param('terrain', k)} value={groupOf(s, 'terrain')[k]} onChange={(n) => set({ terrain: { [k]: n } })} />)}
          </Section>
        );
      }}
    />
  );
}

export function LinesFigure() {
  return (
    <Tuned
      initial={byId.lines.live!}
      keys={['shape', 'seed', 'lines', 'theme']}
      cap={() => 'A long ridge in 2D.'}
      panel={(s, set, init) => <ParamSection title="Lines" group="lines" keys={['count', 'width', 'opacity', 'indexEvery']} s={s} set={set} init={init} />}
    />
  );
}

export function TerrainFigure() {
  return (
    <Tuned
      initial={byId.terrain.live!}
      keys={['shape', 'terrain', 'layout', 'theme']}
      cap={(s) => `A gentle summit with ${s.terrain.peaks} ${s.terrain.peaks === 1 ? 'peak' : 'peaks'}.`}
      panel={(s, set, init) => (
        <>
          <ParamSection title="Form" group="terrain" keys={['peaks', 'spread', 'sharpness', 'variant']} s={s} set={set} init={init} />
          <ParamSection title="Surface" group="terrain" keys={['roughness', 'terracing']} s={s} set={set} init={init} />
        </>
      )}
    />
  );
}

export function MotionFigure() {
  return (
    <Tuned
      initial={byId.motion.live!}
      keys={['shape', 'seed', 'motion', 'lines', 'theme']}
      cap={(s) => (s.motion.speed === 0 ? 'A seed pod, held still.' : `A seed pod at ${s.motion.speed.toFixed(2)}× speed.`)}
      panel={(s, set, init) => <ParamSection title="Motion" group="motion" keys={['speed', 'warp', 'sparkle']} s={s} set={set} init={init} />}
    />
  );
}

const MODES = [{ id: '2d', label: '2D', glyph: 'wide' }, { id: '3d', label: '3D', glyph: 'block' }] as const;
const EXTENTS = [{ id: 'block', label: 'Block', glyph: 'block' }, { id: 'endless', label: 'Endless', glyph: 'endless' }] as const;
const PATHS = (['still', 'orbit', 'push', 'flyover', 'drone'] as const).map((m) => ({ id: m, label: m[0].toUpperCase() + m.slice(1), glyph: m }));

export function ModesFigure() {
  return (
    <Tuned
      initial={byId.modes.live!}
      keys={['shape', 'seed', 'mode', 'extent', 'elevation', 'detail', 'camera']}
      className=""
      cap={(s) => (s.mode === '2d' ? 'Granite as the flat map.' : s.extent === 'block' ? 'Granite as a solid block.' : 'Granite as an endless plane.')}
      panel={(s, set) => (
        <Section title="View">
          <SegRow label="Mode" icon="mode" options={MODES} value={s.mode} onChange={(v) => set({ mode: v })} />
          <SegRow label="Extent" icon="extent" options={EXTENTS} value={s.extent} onChange={(v: TerrainExtent) => set({ extent: v })} />
          <SliderRow label="Elevation" icon="elevation" art="elevation" value={s.elevation} min={0} max={1} step={0.01} shown={s.elevation.toFixed(2)} onChange={(n) => set({ elevation: n })} />
          <SliderRow label="Detail" icon="detail" art="count" value={s.detail} min={0} max={1} step={0.01} shown={`${Math.round(32 + s.detail * 128)}²`} onChange={(n) => set({ detail: n })} />
        </Section>
      )}
    />
  );
}

/** The camera's pose a few times a second, beside the camera figure. */
function PoseReadout({ view }: { view: LiveView | null }) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!view) return;
    const id = window.setInterval(() => { const p = view.pose; if (p) setText(`pose ${((((p.azimuth % 360) + 360) % 360)).toFixed(0)}° ${p.elevation.toFixed(0)}° r ${p.radius.toFixed(2)}`); }, 200);
    return () => window.clearInterval(id);
  }, [view]);
  return <span className="read">{text}</span>;
}

export function CameraFigure({ onView }: { onView: (view: LiveView | null) => void }) {
  return (
    <Tuned
      initial={byId.camera.live!}
      keys={['shape', 'seed', 'mode', 'terrain', 'camera']}
      className=""
      onView={onView}
      ctl={(view) => <PoseReadout view={view} />}
      cap={(s) => (s.camera.motion === 'still' ? 'A rough ridge under a still camera.' : `A rough ridge on the ${s.camera.motion} path.`)}
      panel={(s, set) => {
        const az = Math.round((((s.camera.azimuth % 360) + 360) % 360));
        return (
          <Section title="Camera">
            <div className="wide">
              <SegRow label="Path" icon="camMotion" options={PATHS} value={s.camera.motion} onChange={(v: CameraMotion) => set({ camera: { motion: v } })} />
            </div>
            <SliderRow label="Azimuth" icon="azimuth" art="azimuth" value={az} min={0} max={360} step={1} shown={`${az}°`} onChange={(n) => set({ camera: { azimuth: n } })} />
            <SliderRow label="Angle" icon="angle" art="angle" value={Math.round(s.camera.elevation)} min={2} max={80} step={1} shown={`${Math.round(s.camera.elevation)}°`} onChange={(n) => set({ camera: { elevation: n } })} />
            <SliderRow label="Distance" icon="distance" art="distance" value={s.camera.radius} min={RADIUS_MIN} max={RADIUS_MAX} step={0.01} shown={s.camera.radius.toFixed(2)} onChange={(n) => set({ camera: { radius: n } })} />
          </Section>
        );
      }}
    />
  );
}

/* ---------------------------------------------------------------- theme */

const THEMES: [string, { mode: 'dark' | 'light'; ink?: string; paper?: string }][] = [
  ['Night', { mode: 'dark', ink: '#a9c7e4', paper: '#10151c' }],
  ['Dark', { mode: 'dark' }],
  ['Light', { mode: 'light' }],
  ['Amber', { mode: 'dark', ink: '#e0b089', paper: '#16130f' }],
  ['Plum on rose', { mode: 'light', ink: '#6b3050', paper: '#f6eef2' }],
  ['Transparent', { mode: 'dark', ink: '#c9c2b4', paper: 'transparent' }],
];

const swatch = ({ mode, ink, paper }: (typeof THEMES)[number][1]) => {
  const i = ink ?? (mode === 'light' ? LIGHT.ink : DARK.ink);
  const p = paper ?? (mode === 'light' ? LIGHT.paper : DARK.paper);
  return p === 'transparent'
    ? `radial-gradient(circle,${i} 0 34%,transparent 38%),repeating-conic-gradient(#888 0 25%,#ddd 0 50%) 0 0/8px 8px`
    : `radial-gradient(circle,${i} 0 34%,${p} 38%)`;
};

/** One live figure with the playground's colour swatches; the code under it follows the swatch. */
export function ThemeFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const view = useRef<LiveView | null>(null);
  const [pick, setPick] = useState(0);
  useEffect(() => {
    const v = lazyLive(stage.current!, vivid(byId.theme.live!));
    view.current = v;
    return () => { v.destroy(); view.current = null; };
  }, []);
  const [name, th] = THEMES[pick];
  return (
    <>
      <figure className="fig">
        <div className={`stage short${th.paper === 'transparent' ? ' checker' : ''}`} ref={stage} />
        <Tools className="swatch-tools">
          <div className="pt-swatches" role="group" aria-label="Theme">
            {THEMES.map(([n, t], i) => (
              <button
                key={n} type="button" className={`pt-swatch${i === pick ? ' is-on' : ''}`} title={n} aria-label={n} aria-pressed={i === pick}
                style={{ background: swatch(t) }}
                onClick={() => { setPick(i); view.current?.update({ theme: { ink: undefined, paper: undefined, ...t } }); }}
              />
            ))}
          </div>
        </Tools>
        <Caption>{th.paper === 'transparent' ? 'With transparent paper the page shows through.' : `The ${name.toLowerCase()} theme.`}</Caption>
      </figure>
      <LiveCode code={codeFor({ theme: th })} />
      <p className="defaults">Without colours, dark mode draws <code>{DARK.ink}</code> on <code>{DARK.paper}</code>; light mode draws <code>{LIGHT.ink}</code> on <code>{LIGHT.paper}</code></p>
    </>
  );
}

/* ---------------------------------------------------------------- stills */

const INK = '#9fb0cc';

/** A result under a code block: the still it draws, with an optional line of text on top. */
function Result({ items, size, over, cap, short = false }: { items: () => StillItem[]; size: { width: number; height: number }; over?: string; cap: ReactNode; short?: boolean }) {
  const box = useRef<HTMLElement>(null);
  const [url] = useStills(box, items, size);
  return (
    <figure className="res" ref={box}>
      <div className={`ph${short ? ' short' : ''}`} style={bg(url)}>{over ? <div className="over">{over}</div> : null}</div>
      <figcaption>{cap}</figcaption>
    </figure>
  );
}

export const ReactResult = () => (
  <Result items={() => [{ shape: 'granite', terrain: { roughness: 0.3 }, lines: { opacity: 0.6 }, theme: { mode: 'dark', ink: INK } }]} size={{ width: 1120, height: 560 }} over="Your content on top" cap="The Hero component draws granite with your content on top." />
);
export const ElementResult = () => (
  <Result items={() => [{ shape: 'long-ridge', lines: { count: 36, opacity: 0.72 }, terrain: { peaks: 2 }, theme: { mode: 'dark', ink: INK } }]} size={{ width: 1120, height: 560 }} cap="The element above draws a long ridge with two peaks." />
);
export const PageResult = () => (
  <Result items={() => [{ shape: 'dunes', seed: 5, lines: { count: 16, width: 0.4 }, theme: { mode: 'dark', ink: '#9fb3c8', paper: '#0d1418' } }]} size={{ width: 1120, height: 560 }} over="Your page" cap="Dunes behind a section, with the content on top." />
);
export const PerformanceResult = () => (
  <Result items={() => [{ ...byId.performance.live!, lines: { opacity: 0.72 }, theme: { mode: 'dark', ink: INK } }]} size={{ width: 1120, height: 420 }} short cap="Granite in 3D at the low tier, with lines that stay sharp." />
);

const EXPORT_LOOK: SettingsInput = { shape: 'granite', seed: 67, mode: '3d', lines: { count: 36, indexEvery: 4, opacity: 0.8 }, camera: { motion: 'orbit' }, theme: { mode: 'dark', ink: INK } };

/** Two snapshots of one orbit, as the export code takes them. */
export function ExportResult() {
  const box = useRef<HTMLElement>(null);
  const [a] = useStills(box, () => [EXPORT_LOOK], { width: 640, height: 400, frame: 0 });
  const [b] = useStills(box, () => [EXPORT_LOOK], { width: 640, height: 400, frame: 4000 });
  return (
    <figure className="res" ref={box}>
      <div className="two"><div className="ph" style={bg(a)} /><div className="ph" style={bg(b)} /></div>
      <figcaption>Two snapshots of one orbit, at frame 0 and frame 4000.</figcaption>
    </figure>
  );
}

/** A working snapshot of the camera figure, in the export section's margin. */
export function SnapshotBox({ camera }: { camera: () => LiveView | null }) {
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  return (
    <div className="ctl static">
      <span className="hint">Take two PNGs of the camera figure above, at frame 0 and 4000 of its flyover path.</span>
      <button
        type="button" className="btn" disabled={busy}
        onClick={async () => {
          const view = camera();
          if (!view) return;
          setBusy(true);
          const out: string[] = [];
          for (const frame of [0, 4000]) {
            const blob = await view.snapshot({ width: 400, height: 250, frame, motion: 'flyover' }).catch(() => null);
            if (blob) out.push(URL.createObjectURL(blob));
          }
          setUrls(out);
          setBusy(false);
          relayout();
        }}
      >
        Take two snapshots
      </button>
      {urls.length ? <div className="shot-out">{urls.map((u, i) => <img key={u} src={u} alt={`Frame ${i ? 4000 : 0}`} />)}</div> : null}
    </div>
  );
}

const LAYOUT_BASE: SettingsInput = { shape: 'drifting-lobes', seed: 223, lines: { count: 34, opacity: 0.7, width: 0.22 }, theme: { mode: 'dark' } };

/** Two stills of one shape, with the lines crossing a heading or making room for it. */
export function LayoutFigure() {
  const box = useRef<HTMLDivElement>(null);
  const [a, b] = useStills(box, () => [{ ...LAYOUT_BASE, layout: { anchor: 1, fade: 0 } }, { ...LAYOUT_BASE, layout: { anchor: 0, fade: 0.9 } }], { width: 560, height: 350 });
  const mock = <div className="mock"><b>Your heading</b><i /></div>;
  return (
    <div className="pair" ref={box}>
      <figure><div className="ph" style={bg(a)}>{mock}</div><figcaption>With <code>anchor: 1, fade: 0</code> the lines cross the text.</figcaption></figure>
      <figure><div className="ph" style={bg(b)}>{mock}</div><figcaption>With <code>anchor: 0, fade: 0.9</code> the text stays clear.</figcaption></figure>
    </div>
  );
}

let made: ReturnType<typeof volcano> | null = null;

export function HeightfieldFigure() {
  const box = useRef<HTMLElement>(null);
  const [url] = useStills(box, () => [{ ...byId.heightfields.live!, field: (made ??= volcano(128)) }], { width: 1120, height: 600 });
  return (
    <figure className="fig" ref={box}>
      <div className="stage short" style={{ ...bg(url), backgroundPosition: 'center', backgroundSize: 'cover' }} />
      <Caption>A made-up volcano, drawn with <code>setHeightfield()</code></Caption>
    </figure>
  );
}

/** The Matterhorn as contours, beside its heights as a greyscale heightmap. */
export function HeightmapFigure() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const look = useMemo(() => merge(PLACE_LOOK, { theme: { ink: '#d6cfc0' } }), []);
  const { state } = usePlace(stage, 'matterhorn', look);
  useEffect(() => {
    let off = false;
    loadPlace('matterhorn').then(({ field }) => {
      const c = canvas.current;
      if (off || !c || !field) return;
      const { size, samples } = field;
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const img = ctx.createImageData(size, size);
      let lo = Infinity;
      let hi = -Infinity;
      for (const v of samples) { if (v < lo) lo = v; if (v > hi) hi = v; }
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          // Row 0 is the south edge, so the rows flip to draw north up.
          const v = Math.round(((samples[(size - 1 - y) * size + x] - lo) / (hi - lo || 1)) * 255);
          const i = (y * size + x) * 4;
          img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }).catch(() => {});
    return () => { off = true; };
  }, []);
  return (
    <div className="pair">
      <figure><div className={`ph${loadClass(state)}`} ref={stage} /><figcaption>The Matterhorn as contours.</figcaption></figure>
      <figure><div className="ph"><canvas className="dx-hm" ref={canvas} width={256} height={256} /></div><figcaption>The same land as a 16-bit heightmap.</figcaption></figure>
    </div>
  );
}

/* ---------------------------------------------------------------- the rest */

export function LooksFigure() {
  return (
    <div className="grid3">
      {LOOK_GALLERY.map((l) => <figure key={l.shot}><img src={shot(l.shot)} alt="" loading="lazy" width={320} height={200} /><figcaption>{l.name}</figcaption></figure>)}
    </div>
  );
}

export function AgentsResult() {
  return (
    <figure className="res">
      <pre className="out">{LLMS_HEAD}</pre>
      <figcaption>The first lines of <a href={`${PLAYGROUND}/llms.txt`} target="_blank" rel="noreferrer"><code>llms.txt</code></a></figcaption>
    </figure>
  );
}

