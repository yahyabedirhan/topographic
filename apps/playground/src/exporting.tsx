import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { Button } from '@base-ui-components/react/button';
import { Popover } from '@base-ui-components/react/popover';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Braces, Check, CodeXml, Component, Copy, Download, Image as ImageIcon, Link as LinkIcon, Share, Video } from 'lucide-react';
import { PARAMS, cameraPose, type CameraMotion, type ParamDef, type SnapshotRegion } from 'topographic';
import { INSTALL } from './content';
import { embedCode } from './embed';
import { PNG_SIZES, cropRegion, downloadPng, videoFileName, type PngSize } from './png';
import { shareUrl } from './url';
import { type Playground } from './shared';
import { Glyph, Tabs, Tip, useWidth } from './parts';
import { GLYPHS, pathArt, timelineArt, type GlyphName } from './track-art';
import { errorLabel, track } from './analytics';

type FormatId = 'link' | 'png' | 'video' | 'react' | 'html' | 'json';

const FORMATS: { id: FormatId; label: string; icon: typeof LinkIcon }[] = [
  { id: 'link', label: 'Link', icon: LinkIcon },
  { id: 'png', label: 'PNG', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'react', label: 'React', icon: Component },
  { id: 'html', label: 'HTML', icon: CodeXml },
  { id: 'json', label: 'JSON', icon: Braces },
];

const CLIP_PATHS: { id: CameraMotion; label: string; glyph: GlyphName }[] = [
  { id: 'orbit', label: 'Orbit', glyph: 'orbit' },
  { id: 'push', label: 'Push', glyph: 'push' },
  { id: 'flyover', label: 'Flyover', glyph: 'flyover' },
  { id: 'drone', label: 'Drone', glyph: 'drone' },
];

const CLIP = { seconds: 4, fps: 24, width: 960, height: 540 } as const;

/** Copies once, then shows a check and "Copied" for a moment. */
function useCopied(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [copied, (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1600);
  }];
}

/** A compact copy action: a copy glyph and its label, then a check and "Copied". */
function CopyAction({ text, label = 'Copy', quiet = false, onCopy }: { text: string; label?: string; quiet?: boolean; onCopy?: () => void }) {
  const [copied, copy] = useCopied();
  return (
    <Button className={`pt-action pt-copy${quiet ? ' pt-action-quiet' : ''}${copied ? ' is-done' : ''}`} onClick={() => { onCopy?.(); copy(text); }}>
      {copied
        ? <span className="pt-copy-ico pt-pop-in" key="done"><Check size={14} strokeWidth={2.25} /></span>
        : <span className="pt-copy-ico" key="idle"><Copy size={14} strokeWidth={1.75} /></span>}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </Button>
  );
}

/** An icon-only copy button, for a line that has its own copy next to a bigger one. */
function CopyIcon({ text, label, onCopy }: { text: string; label: string; onCopy?: () => void }) {
  const [copied, copy] = useCopied();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger delay={280} className={`pt-icocopy${copied ? ' is-done' : ''}`} aria-label={copied ? 'Copied' : label} onClick={() => { onCopy?.(); copy(text); }}>
        {copied ? <span className="pt-pop-in" key="done"><Check size={14} strokeWidth={2.25} /></span> : <Copy size={14} strokeWidth={1.75} />}
      </Tooltip.Trigger>
      <Tip side="top">{copied ? 'Copied' : label}</Tip>
    </Tooltip.Root>
  );
}

// ---------------------------------------------------------------- Link

const VIEW_NAMES: Record<string, [string, GlyphName]> = {
  look: ['Look', 'look'], s: ['Style', 'style'], seed: ['Seed', 'seed'], m: ['Theme', 'theme'], ink: ['Ink colour', 'ink'], paper: ['Paper colour', 'paper'],
  mode: ['2D or 3D', 'mode'], ex: ['Extent', 'extent'], ev: ['Elevation', 'elevation'], dl: ['Detail', 'detail'], az: ['Azimuth', 'azimuth'],
  ce: ['Camera angle', 'angle'], rd: ['Camera distance', 'distance'], cm: ['Camera motion', 'camMotion'], place: ['Map place', 'place'], region: ['Map area', 'place'],
};

/** What a short URL key means, and its glyph. */
function keyName(key: string): [string, GlyphName | null] {
  const view = VIEW_NAMES[key];
  if (view) return view;
  const p = (PARAMS as readonly ParamDef[]).find((d) => d.short === key);
  if (p) return [p.label, p.key in GLYPHS ? (p.key as GlyphName) : null];
  return [key, null];
}

function LinkBlock({ pg }: { pg: Playground }) {
  const url = shareUrl(pg.settings);
  const entries = [...new URL(url).searchParams.entries()];
  const src = useViewPicture(pg, 320, 180);
  return (
    <div className="pt-export-block">
      <figure className="pt-link-shot">
        {src ? <img src={src} alt="The terrain this link opens" /> : <div className="pt-link-wait" aria-hidden="true" />}
        <figcaption>Link preview</figcaption>
      </figure>
      <p className="pt-hint">{entries.length ? 'This link opens with these parameters:' : 'This link opens the playground as it starts: nothing is changed yet.'}</p>
      {entries.length ? (
        <ul className="pt-urlchips" aria-label="Link settings">
          {entries.map(([k, v]) => {
            const [name, glyph] = keyName(k);
            const colour = (k === 'ink' || k === 'paper') && /^[0-9a-f]{3,8}$/i.test(v) ? `#${v}` : null;
            return (
              <li key={k} className="pt-urlchip" title={`${name}: ${v}`}>
                {glyph ? <Glyph name={glyph} size={13} /> : null}
                <i>{k}</i>
                {colour ? <span className="pt-urlchip-dot" style={{ background: colour }} /> : null}
                <span>{v}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="pt-linkrow">
        <code title={url}>{url.replace(/^https?:\/\//, '')}</code>
        <CopyAction text={url} label="Copy link" onCopy={() => track('link_copied', { params_count: entries.length })} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- PNG

type CropId = 'screen' | 'phone' | '1080p';
const CROP_IDS: CropId[] = ['screen', 'phone', '1080p'];
const CROP_TEXT: Record<CropId, { name: string; short: string; glyph: GlyphName }> = {
  screen: { name: 'This screen', short: 'Screen', glyph: 'monitor' },
  phone: { name: 'Phone', short: 'Phone', glyph: 'smartphone' },
  '1080p': { name: '1920 × 1080', short: '1080p', glyph: 'wide' },
};
const sizeOf = (id: CropId) => PNG_SIZES.find((s) => s.id === id)!;

/** Where each crop sits along its free axis, 0 to 1. Kept by the menu while it is open. */
export type Crops = Record<CropId, number>;
const CENTRED: Crops = { screen: 0.5, phone: 0.5, '1080p': 0.5 };

/** A picture of the view as it is now, redrawn after the settings settle. */
function useViewPicture(pg: Playground, width: number, height: number, motion?: CameraMotion, time = 0) {
  const [src, setSrc] = useState('');
  const current = useRef('');
  const busy = useRef(false);
  const want = useRef<(() => Promise<void>) | null>(null);
  useEffect(() => {
    let alive = true;
    const t = pg.instance.current;
    if (!t || width < 2 || height < 2) return;
    const job = async () => {
      busy.current = true;
      try {
        const blob = await t.snapshot(motion ? { width: width * 2, height: height * 2, motion, frame: time * 1000 } : { width: width * 2, height: height * 2 });
        const url = URL.createObjectURL(blob);
        if (alive) { if (current.current) URL.revokeObjectURL(current.current); current.current = url; setSrc(url); } else URL.revokeObjectURL(url);
      } catch { /* no WebGL: no picture */ }
      busy.current = false;
      const next = want.current;
      want.current = null;
      if (next) await next();
    };
    // Scrubbing asks for many frames: draw one at a time and keep only the latest request.
    const id = window.setTimeout(() => { if (busy.current) want.current = job; else void job(); }, motion ? 0 : 160);
    return () => { alive = false; window.clearTimeout(id); };
  }, [pg.instance, pg.settings, width, height, motion, time]);
  useEffect(() => () => { if (current.current) URL.revokeObjectURL(current.current); current.current = ''; }, []);
  return src;
}

const n1 = (v: number) => Math.round(v * 10) / 10;

function PngBlock({ pg, place, size, setSize, crops, setCrops }: {
  pg: Playground;
  place: string | null;
  size: CropId;
  setSize: (id: CropId) => void;
  crops: Crops;
  setCrops: (next: Crops) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useWidth(box, 348);
  const canvas = pg.instance.current?.canvas;
  const viewW = canvas?.clientWidth || innerWidth;
  const viewH = canvas?.clientHeight || innerHeight;
  const aspect = viewW / viewH;
  const H = Math.round(Math.min(208, inner / aspect));
  const W = Math.round(Math.min(inner, H * aspect));
  const src = useViewPicture(pg, W, H);
  const [busy, setBusy] = useState(false);
  const regionOf = (id: CropId): SnapshotRegion => cropRegion(aspect, sizeOf(id).width, sizeOf(id).height, crops[id]) ?? { x: 0, y: 0, width: 1, height: 1 };
  const region = regionOf(size);
  const free = region.width < 0.999 ? 'x' : region.height < 0.999 ? 'y' : null;
  const drag = useRef<{ start: number; at: number; room: number } | null>(null);
  const pxText = (id: CropId) => id === 'screen' ? `${Math.round(viewW * 2)} × ${Math.round(viewH * 2)}` : `${sizeOf(id).width} × ${sizeOf(id).height}`;
  const setAt = (at: number) => setCrops({ ...crops, [size]: Math.min(1, Math.max(0, at)) });
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!free) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const span = free === 'x' ? rect.width : rect.height;
    const room = span * (1 - (free === 'x' ? region.width : region.height));
    const pos = free === 'x' ? e.clientX - rect.left : e.clientY - rect.top;
    const lo = (free === 'x' ? region.x : region.y) * span;
    const hi = lo + span - room;
    // A press outside the frame centres it there; a press inside drags it from where it is.
    let at = crops[size];
    if (pos < lo || pos > hi) { at = room > 0 ? (pos - (span - room) / 2) / room : 0.5; setAt(at); }
    drag.current = { start: free === 'x' ? e.clientX : e.clientY, at: Math.min(1, Math.max(0, at)), room };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !free || d.room <= 0) return;
    setAt(d.at + ((free === 'x' ? e.clientX : e.clientY) - d.start) / d.room);
  };
  const onUp = () => { drag.current = null; };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const back = free === 'x' ? 'ArrowLeft' : 'ArrowUp';
    const fwd = free === 'x' ? 'ArrowRight' : 'ArrowDown';
    if (e.key === back) setAt(crops[size] - step);
    else if (e.key === fwd) setAt(crops[size] + step);
    else if (e.key === 'Home') setAt(0);
    else if (e.key === 'End') setAt(1);
    else return;
    e.preventDefault();
  };
  const frames = CROP_IDS.map((id) => ({ id, r: regionOf(id) }));
  const fx = n1(region.x * W);
  const fy = n1(region.y * H);
  const fw = n1(region.width * W);
  const fh = n1(region.height * H);
  const save = async () => {
    const t = pg.instance.current;
    if (!t) return;
    setBusy(true);
    const t0 = performance.now();
    const width = size === 'screen' ? Math.round(viewW * 2) : sizeOf(size).width;
    const height = size === 'screen' ? Math.round(viewH * 2) : sizeOf(size).height;
    try {
      await downloadPng(t, sizeOf(size) as PngSize, size === 'screen' ? null : cropRegion(aspect, sizeOf(size).width, sizeOf(size).height, crops[size]), place);
      track('export_image_downloaded', {
        variant: size, format: 'png', width, height, style: String(pg.settings.style), theme: pg.mode, mode: pg.settings.mode,
        duration_ms: Math.round(performance.now() - t0),
      });
    } catch (error) {
      track('export_image_failed', { variant: size, error: errorLabel(error), duration_ms: Math.round(performance.now() - t0) });
    } finally { setBusy(false); }
  };
  const text = CROP_TEXT[size];
  return (
    <div className="pt-export-block" ref={box}>
      <div
        className={`pt-shot${free ? ' is-draggable' : ''}`}
        style={{ width: W, height: H }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={free ? onKey : undefined}
        tabIndex={free ? 0 : -1}
        role={free ? 'slider' : 'img'}
        aria-label={free ? `${text.name} crop position` : 'The view as it is now'}
        aria-orientation={free === 'y' ? 'vertical' : 'horizontal'}
        aria-valuemin={free ? 0 : undefined}
        aria-valuemax={free ? 100 : undefined}
        aria-valuenow={free ? Math.round(crops[size] * 100) : undefined}
        aria-valuetext={free ? (crops[size] < 0.02 ? (free === 'x' ? 'left edge' : 'top edge') : crops[size] > 0.98 ? (free === 'x' ? 'right edge' : 'bottom edge') : `${Math.round(crops[size] * 100)}% across`) : undefined}
        data-crop={free ? JSON.stringify(region) : undefined}
      >
        {src ? <img src={src} alt="" draggable={false} /> : null}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {frames.filter((f) => f.id !== size && f.id !== 'screen').map((f) => (
            <rect key={f.id} x={n1(f.r.x * W) + 0.5} y={n1(f.r.y * H) + 0.5} width={Math.max(0, n1(f.r.width * W) - 1)} height={Math.max(0, n1(f.r.height * H) - 1)} rx={4}
              fill="none" stroke="currentColor" strokeWidth={1} strokeDasharray="3 3" opacity={0.45} />
          ))}
          {size !== 'screen' ? (
            <path d={`M0 0H${W}V${H}H0Z M${fx} ${fy}V${fy + fh}H${fx + fw}V${fy}Z`} fill="var(--paper)" fillOpacity={0.6} fillRule="evenodd" />
          ) : null}
          <rect x={fx + 1} y={fy + 1} width={Math.max(0, fw - 2)} height={Math.max(0, fh - 2)} rx={size === 'screen' ? 10 : 4} fill="none" stroke="currentColor" strokeWidth={1.8} />
          {free === 'x' ? <path d={`M${fx + fw / 2 - 3} ${H / 2 - 7}V${H / 2 + 7}M${fx + fw / 2 + 3} ${H / 2 - 7}V${H / 2 + 7}`} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.85} /> : null}
          {free === 'y' ? <path d={`M${W / 2 - 7} ${fy + fh / 2 - 3}H${W / 2 + 7}M${W / 2 - 7} ${fy + fh / 2 + 3}H${W / 2 + 7}`} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.85} /> : null}
        </svg>
        <span className="pt-shot-bar"><Glyph name={text.glyph} size={12} /><b>{text.short}</b>{pxText(size)}</span>
      </div>
      <ToggleGroup className="pt-sizes" value={[size]} onValueChange={(v) => { if (v[0]) setSize(v[0] as CropId); }} aria-label="Image size">
        {CROP_IDS.map((id) => {
          const r = regionOf(id);
          const s = sizeOf(id);
          const shape = id === 'screen' ? aspect : s.width / s.height;
          const cardH = 62;
          const cw = Math.round(Math.min(84, cardH * shape));
          const ch = Math.round(cw / shape);
          return (
            <Toggle key={id} value={id} className="pt-sizecard" aria-label={`${CROP_TEXT[id].name}, ${pxText(id)}`}>
              <span className="pt-sizecard-art">
                <span
                  className="pt-sizecard-pic"
                  style={{
                    width: cw, height: ch,
                    backgroundImage: src ? `url(${src})` : undefined,
                    backgroundSize: `${n1(cw / r.width)}px ${n1(ch / r.height)}px`,
                    backgroundPosition: `${-n1(r.x * cw / r.width)}px ${-n1(r.y * ch / r.height)}px`,
                  }}
                />
              </span>
              <span className="pt-sizecard-meta">
                <b>{CROP_TEXT[id].name}</b>
                <small>{id === '1080p' ? '16:9' : pxText(id)}</small>
              </span>
            </Toggle>
          );
        })}
      </ToggleGroup>
      <Button className="pt-action pt-action-wide" disabled={busy} onClick={save}>
        <Download size={15} strokeWidth={1.75} />
        {busy ? 'Rendering…' : `Download ${pxText(size)} PNG`}
      </Button>
      <p className="pt-hint pt-hint-center">{free ? `Drag the frame to choose the ${size === 'phone' ? 'phone' : '16:9'} slice of this view.` : 'The whole window at twice its size.'}</p>
    </div>
  );
}

// ---------------------------------------------------------------- Video

function VideoBlock({ pg, place }: { pg: Playground; place: string | null }) {
  const [path, setPath] = useState<CameraMotion>('orbit');
  const [time, setTime] = useState(0.3);
  const [busy, setBusy] = useState<'mp4' | 'webm' | ''>('');
  const [note, setNote] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const W = useWidth(box, 348);
  const H = Math.round(W * 9 / 16);
  const shown = Math.round(time * CLIP.seconds * 10) / 10;
  const src = useViewPicture(pg, W, H, path, time * CLIP.seconds);
  const poses = useMemo(() => Array.from({ length: 49 }, (_, i) => cameraPose({ ...pg.settings.camera, motion: path }, i / 48 * CLIP.seconds)), [pg.settings.camera, path]);
  const scrub = useRef<{ left: number; width: number } | null>(null);
  const seek = (clientX: number) => {
    const r = scrub.current;
    if (!r) return;
    setTime(Math.min(1, Math.max(0, (clientX - r.left - 10) / (r.width - 20))));
  };
  const save = async (format: 'mp4' | 'webm') => {
    const live = pg.instance.current;
    if (!live) return;
    setBusy(format);
    setNote('');
    const props = { motion: path as 'orbit' | 'push' | 'flyover' | 'drone', container: format, duration_s: CLIP.seconds, fps: CLIP.fps, width: CLIP.width, height: CLIP.height };
    const t0 = performance.now();
    track('export_video_started', props);
    try {
      const blob = await live.record({ format, motion: path, seconds: CLIP.seconds, fps: CLIP.fps, width: CLIP.width, height: CLIP.height });
      track('export_video_completed', {
        ...props, container: blob.type.includes('webm') ? 'webm' : 'mp4', prepare_ms: Math.round(performance.now() - t0), size_bytes: blob.size,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = videoFileName(path, blob.type.includes('webm') ? 'webm' : 'mp4', place);
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      track('export_video_failed', { ...props, prepare_ms: Math.round(performance.now() - t0), error: errorLabel(error) });
      setNote(error instanceof Error ? error.message.replace('[topographic] ', '') : 'Export failed');
    } finally {
      setBusy('');
    }
  };
  const label = CLIP_PATHS.find((c) => c.id === path)!.label;
  return (
    <div className="pt-export-block" ref={box}>
      <div className="pt-shot" style={{ height: H }} role="img" aria-label={`${label} clip at ${shown.toFixed(1)} seconds`}>
        {src ? <img src={src} alt="" draggable={false} /> : null}
        <span className="pt-shot-bar"><Glyph name="play" size={11} /><b>{label}</b>{`${shown.toFixed(1)} s / ${CLIP.seconds} s`}</span>
        <span className="pt-shot-path" aria-hidden="true">
          <svg width={92} height={64} viewBox="0 0 92 64" dangerouslySetInnerHTML={{ __html: pathArt(poses, 92, 64, time) }} />
        </span>
      </div>
      <div
        className="pt-timeline"
        role="slider"
        tabIndex={0}
        aria-label="Clip time"
        aria-valuemin={0}
        aria-valuemax={CLIP.seconds}
        aria-valuenow={shown}
        aria-valuetext={`${shown.toFixed(1)} s`}
        onPointerDown={(e) => { const r = e.currentTarget.getBoundingClientRect(); scrub.current = { left: r.left, width: r.width }; e.currentTarget.setPointerCapture(e.pointerId); seek(e.clientX); }}
        onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) seek(e.clientX); }}
        onPointerUp={() => { scrub.current = null; }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.25 : 1 / (CLIP.seconds * CLIP.fps) * 2;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setTime((t) => Math.max(0, t - step));
          else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setTime((t) => Math.min(1, t + step));
          else if (e.key === 'Home') setTime(0);
          else if (e.key === 'End') setTime(1);
          else return;
          e.preventDefault();
        }}
      >
        <svg width={W} height={44} viewBox={`0 0 ${W} 44`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: timelineArt(W, 44, time, CLIP.seconds, CLIP.fps) }} />
      </div>
      <ToggleGroup className="pt-cards" value={[path]} onValueChange={(v) => { if (v[0]) setPath(v[0] as CameraMotion); }} aria-label="Camera path">
        {CLIP_PATHS.map((c) => (
          <Toggle key={c.id} value={c.id} className="pt-card">
            <Glyph name={c.glyph} size={20} />
            <span>{c.label}</span>
          </Toggle>
        ))}
      </ToggleGroup>
      <div className="pt-pair">
        {(['mp4', 'webm'] as const).map((format) => (
          <Button key={format} className={`pt-action pt-action-wide${format === 'webm' ? ' pt-action-quiet' : ''}`} disabled={busy !== ''} onClick={() => save(format)}>
            <Download size={15} strokeWidth={1.75} />
            {busy === format ? 'Rendering…' : format === 'mp4' ? 'MP4' : 'WebM'}
          </Button>
        ))}
      </div>
      <p className="pt-hint pt-hint-center">{note || `${CLIP.width} × ${CLIP.height} · ${CLIP.fps} fps · MP4 plays everywhere, WebM is open`}</p>
    </div>
  );
}

// ---------------------------------------------------------------- Code

const KEYS = /^(import|from|const|let|return|export|function|type|interface)$/;
const TOKEN = /<\/?[A-Za-z][\w:-]*|\/?>|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:import|from|const|let|return|export|function|type|interface)\b|-?\b\d+(?:\.\d+)?\b|[{}()[\]:,.]/g;
/** Lines that are the same for every background: their values are not settings. */
const BOILERPLATE = /position|^\s*import\b|<script/;

/** One line of code, coloured, with the setting values tinted as pills. Returns the nodes and whether it tinted any. */
function highlightLine(line: string, key: number): [ReactNode[], boolean] {
  const parts: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let tinted = false;
  const plain = BOILERPLATE.test(line);
  for (const m of line.matchAll(TOKEN)) {
    const index = m.index ?? 0;
    if (index > last) parts.push(line.slice(last, index));
    const v = m[0];
    const str = v[0] === '"' || v[0] === "'" || v[0] === '`';
    const num = /^-?\d/.test(v);
    const cls = str ? 'pt-syn-str' : num ? 'pt-syn-num' : KEYS.test(v) ? 'pt-syn-key' : v.startsWith('<') || v === '/>' || v === '>' ? 'pt-syn-tag' : 'pt-syn-pun';
    // A JSON key is a string followed by a colon; every other string or number on a settings line is a value.
    const isKey = str && /^\s*:/.test(line.slice(index + v.length));
    const pill = !plain && (str || num) && !isKey;
    if (pill) tinted = true;
    parts.push(<span key={`${key}-${i++}`} className={pill ? `${cls} pt-vpill${num ? ' is-num' : ''}` : cls}>{v}</span>);
    last = index + v.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return [parts, tinted];
}

function CodeView({ code }: { code: string }) {
  const lines = code.split('\n');
  let tinted = false;
  const rows = lines.map((line, n) => {
    const [nodes, t] = highlightLine(line, n);
    tinted ||= t;
    return [<span key={`n${n}`} className="pt-ln" aria-hidden="true">{n + 1}</span>, <span key={`l${n}`} className="pt-lc">{nodes.length ? nodes : ' '}</span>];
  });
  return (
    <>
      <pre className="pt-code" tabIndex={0}><code>{rows}</code></pre>
      {tinted ? <p className="pt-hint pt-hint-small">Tinted values come from Tune. Change them there and this updates.</p> : null}
    </>
  );
}

function CodeBlock({ pg, format }: { pg: Playground; format: 'react' | 'html' | 'json' }) {
  const usage = format === 'json' ? embedCode(pg.settings, 'json') : embedCode(pg.settings, format);
  const install = format === 'react' ? INSTALL.react : '';
  const text = install ? `${install}\n\n${usage}` : usage;
  const hint = format === 'react'
    ? 'Install the packages, then place this component on the page.'
    : format === 'html'
      ? 'Add the element script, then place this background on the page.'
      : 'The settings as data.';
  return (
    <div className="pt-export-block">
      <div className="pt-export-head">
        <p className="pt-hint">{hint}</p>
        <CopyAction text={text} onCopy={() => track('code_copied', { lang: format })} />
      </div>
      {install && (
        <div className="pt-install">
          <span className="pt-install-mark" aria-hidden="true">$</span>
          <code>{install}</code>
          <CopyIcon text={install} label="Copy install command" onCopy={() => track('code_copied', { lang: 'install' })} />
        </div>
      )}
      <CodeView code={usage} />
    </div>
  );
}

export function ExportMenu({ pg, place, open, onOpenChange, clusterRef }: {
  pg: Playground;
  /** The name of the named place drawn now, for file names, or null. */
  place: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusterRef: RefObject<HTMLDivElement | null>;
}) {
  const [format, setFormat] = useState<FormatId>('link');
  const [size, setSize] = useState<CropId>('screen');
  const [crops, setCrops] = useState<Crops>(CENTRED);
  const tabSince = useRef(0);
  useEffect(() => { if (open) tabSince.current = performance.now(); }, [open]);
  // The crop belongs to this look at the view: it starts centred each time the menu opens.
  const change = useCallback((next: boolean) => {
    if (!next) setCrops(CENTRED);
    onOpenChange(next);
  }, [onOpenChange]);
  return (
    <Popover.Root open={open} onOpenChange={change}>
      <Tooltip.Root>
        <Tooltip.Trigger delay={180} render={<Popover.Trigger className="pt-ibtn" aria-label="Export" />}>
          <Share size={18} strokeWidth={1.75} />
        </Tooltip.Trigger>
        <Tip>Export</Tip>
      </Tooltip.Root>
      <Popover.Portal>
        <Popover.Positioner anchor={clusterRef} side="bottom" align="end" sideOffset={10} collisionPadding={{ top: 12, right: 8, bottom: 16, left: 8 }} positionMethod="fixed" className="pt-layer">
          <Popover.Popup className="pt-pop pt-glass pt-export" aria-label="Export" initialFocus={false}>
            <Tabs items={FORMATS} value={format} onChange={(f) => { if (f !== format) track('export_tab_changed', { from: format, to: f, from_ms: Math.round(performance.now() - tabSince.current) }); tabSince.current = performance.now(); setFormat(f); }} label="Export format" />
            {format === 'link' && <LinkBlock pg={pg} />}
            {format === 'png' && <PngBlock pg={pg} place={place} size={size} setSize={setSize} crops={crops} setCrops={setCrops} />}
            {format === 'video' && <VideoBlock pg={pg} place={place} />}
            {format === 'react' && <CodeBlock pg={pg} format="react" />}
            {format === 'html' && <CodeBlock pg={pg} format="html" />}
            {format === 'json' && <CodeBlock pg={pg} format="json" />}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
