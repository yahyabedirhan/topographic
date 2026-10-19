import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Slider } from '@base-ui-components/react/slider';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { RotateCcw, type LucideIcon } from 'lucide-react';
import type { ParamDef } from 'topographic';
import { GLYPHS, trackArt, type GlyphName, type TrackKind } from './track-art';

// The building blocks every popover shares: a tab bar, sections and one row grid.

export function Tip({ children, side = 'bottom' }: { children: ReactNode; side?: 'top' | 'bottom' }) {
  return (
    <Tooltip.Portal>
      <Tooltip.Positioner side={side} sideOffset={8} className="pt-layer">
        <Tooltip.Popup className="pt-tip">{children}</Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  );
}

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

/** A full-width tab bar, icon above label, so no tooltip has to name a tab. */
export function Tabs<T extends string>({ items, value, onChange, label }: {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <ToggleGroup
      className="pt-tabs"
      value={[value]}
      onValueChange={(v) => { if (v[0]) onChange(v[0] as T); }}
      aria-label={label}
    >
      {items.map((item) => {
        const Ico = item.icon;
        return (
          <Toggle key={item.id} className="pt-tab" value={item.id}>
            <Ico size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>{item.label}</span>
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}

/** A group of rows under a small uppercase header, with one reset shown only when something in it changed. */
export function Section({ title, resetIf, onReset, children }: {
  title: string;
  resetIf?: boolean;
  onReset?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="pt-sec">
      <div className="pt-sec-head">
        <span className="pt-sec-title">{title}</span>
        {resetIf && onReset ? (
          <Tooltip.Root>
            <Tooltip.Trigger delay={280} className="pt-sec-reset" aria-label={`Reset ${title.toLowerCase()}`} onClick={onReset}>
              <RotateCcw size={13} strokeWidth={1.75} />
            </Tooltip.Trigger>
            <Tip>Reset</Tip>
          </Tooltip.Root>
        ) : null}
      </div>
      <div className="pt-sec-body">{children}</div>
    </section>
  );
}

/** A glyph from track-art on lucide's grid. */
export function Glyph({ name, size = 16, stroke = 1.75 }: { name: GlyphName; size?: number; stroke?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: GLYPHS[name] }}
    />
  );
}

/** The element's width, kept current by a ResizeObserver; `fallback` until it is measured. */
export function useWidth(ref: RefObject<HTMLElement | null>, fallback: number): number {
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => { const w = Math.round(el.clientWidth); if (w > 0) setWidth(w); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

/** A track that draws the setting's effect twice: a muted base, and the value's part in full colour. */
function TrackArt({ art, width }: { art: TrackKind; width: number }) {
  const inner = useMemo(() => trackArt(art, width), [art, width]);
  const svg = (
    <svg
      width={width} height={24} viewBox={`0 0 ${width} 24`} fill="none" stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
  return svg;
}

/** A number: glyph, label, a track that pictures the setting, value. */
export function SliderRow({ label, name, hint, icon, art, value, min, max, step, shown, valueText, disabled, onChange }: {
  label: string;
  /** The slider's accessible name, when it says more than the short label. */
  name?: string;
  hint?: string;
  icon: GlyphName;
  art: TrackKind;
  value: number;
  min: number;
  max: number;
  step: number;
  shown: string;
  /** The value as a screen reader should say it, when it differs from the number, such as "1.4 px". */
  valueText?: string;
  /** Dimmed and not interactive, for a setting that has no effect right now. */
  disabled?: boolean;
  onChange: (n: number) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const width = useWidth(track, 190);
  return (
    <div className={`pt-row${disabled ? ' is-off' : ''}`}>
      <span className="pt-row-icon"><Glyph name={icon} size={15} /></span>
      <span className="pt-row-label" title={hint}>{label}</span>
      <Slider.Root
        className="pt-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        thumbAlignment="center"
        disabled={disabled}
        onValueChange={(next) => onChange(typeof next === 'number' ? next : next[0])}
      >
        <Slider.Control className="pt-slider-control">
          <Slider.Track className="pt-slider-track" ref={track}>
            <span className="pt-track-base"><TrackArt art={art} width={width} /></span>
            <Slider.Indicator className="pt-slider-ind"><TrackArt art={art} width={width} /></Slider.Indicator>
            <Slider.Thumb className="pt-slider-thumb" aria-label={name ?? label} getAriaValueText={valueText ? () => valueText : undefined} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <output>{shown}</output>
    </div>
  );
}

/** Labels that need to fit the 80px label column. The slider keeps the full name. */
const SHORT_LABEL: Partial<Record<string, string>> = { indexEvery: 'Bold lines' };

/** Every Nth line drawn bolder, read as "1 in N". */
export const boldEvery = (v: number) => (Math.round(v) < 1 ? 'Off' : `1 in ${Math.round(v)}`);

export const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`;

/** Line width is stored 0–1 but drawn as a 0.5–4 px stroke (the core's toUniform), so it reads in pixels. */
export function linePx(value: number): string {
  return `${Number((0.5 + value * 3.5).toFixed(1))} px`;
}

/** A parameter's value as the Tune rows show it. */
export function readParam(param: ParamDef, value: number): string {
  if (param.group === 'lines' && param.key === 'width') return linePx(value);
  if (param.key === 'indexEvery') return boldEvery(value);
  return param.integer ? String(value) : value.toFixed(2);
}

/** One of the library's numeric parameters as a Tune row: its glyph, short label, telling track and value text. */
export function ParamRow({ param: p, value, hint, disabled, onChange }: {
  param: ParamDef;
  value: number;
  /** Replaces the parameter's own description as the label's tooltip. */
  hint?: string;
  disabled?: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <SliderRow
      label={SHORT_LABEL[p.key] ?? p.label}
      name={p.label}
      icon={p.key as GlyphName}
      art={p.key as TrackKind}
      hint={hint ?? p.description}
      value={value} min={p.min} max={p.max} step={p.step} shown={readParam(p, value)}
      valueText={p.group === 'lines' && p.key === 'width' ? linePx(value) : p.key === 'indexEvery' ? boldEvery(value) : undefined}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

/**
 * A choice: glyph, label and a row of glyph chips across the control and value columns. The chosen chip
 * names itself; the others show their label as a tooltip. With two options both names show.
 */
export function SegRow<T extends string>({ label, icon, options, value, onChange, hint, disabled }: {
  label: string;
  icon: GlyphName;
  options: readonly { id: T; label: string; glyph: GlyphName }[];
  value: T | null;
  onChange: (next: T) => void;
  hint?: string;
  /** Dimmed and not interactive, for a setting that has no effect right now. */
  disabled?: boolean;
}) {
  const id = useId();
  const both = options.length === 2;
  return (
    <div className={`pt-row${disabled ? ' is-off' : ''}`}>
      <span className="pt-row-icon"><Glyph name={icon} size={15} /></span>
      <span className="pt-row-label" id={id} title={hint}>{label}</span>
      <ToggleGroup
        className={`pt-chips${both ? ' is-two' : ''}`}
        value={value === null ? [] : [value]}
        onValueChange={(v) => { if (v[0]) onChange(v[0] as T); }}
        aria-labelledby={id}
        disabled={disabled}
      >
        {options.map((o) => (
          <Tooltip.Root key={o.id} disabled={both || o.id === value}>
            <Tooltip.Trigger
              delay={280}
              render={<Toggle value={o.id} aria-label={o.label} onClick={() => { if (o.id === value) onChange(o.id); }} />}
            >
              <Glyph name={o.glyph} size={15} />
              <span>{o.label}</span>
            </Tooltip.Trigger>
            <Tip side="top">{o.label}</Tip>
          </Tooltip.Root>
        ))}
      </ToggleGroup>
    </div>
  );
}

/** A small live picture at the top of a tab, with a short caption chip. The markup is a drawing from track-art. */
export function Preview({ height, art, caption, className = '', dim, label, style, children }: {
  height: number;
  style?: CSSProperties;
  children?: ReactNode;
  art: (width: number) => string;
  caption?: string;
  className?: string;
  dim?: boolean;
  /** What the picture shows, for screen readers. */
  label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const width = useWidth(box, 348);
  const inner = art(width);
  return (
    <div className={`pt-preview${dim ? ' is-off' : ''} ${className}`} ref={box} style={{ ...style, height }} role="img" aria-label={label}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} dangerouslySetInnerHTML={{ __html: inner }} />
      {caption ? <span className="pt-preview-chip">{caption}</span> : null}
      {children}
    </div>
  );
}

/** One muted line at the top of a tab whose controls do nothing right now, with the way to make them work. */
export function OffNote({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  return (
    <p className="pt-place-note">
      <span>{text}</span>
      <button type="button" className="pt-text-btn" onClick={onAction}>{action}</button>
    </p>
  );
}
