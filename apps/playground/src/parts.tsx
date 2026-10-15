import { useId, type ReactNode } from 'react';
import { Slider } from '@base-ui-components/react/slider';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { RotateCcw, type LucideIcon } from 'lucide-react';

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

/** A number: label, slider, value. */
export function SliderRow({ label, name, hint, value, min, max, step, shown, valueText, disabled, onChange }: {
  label: string;
  /** The slider's accessible name, when it says more than the short label. */
  name?: string;
  hint?: string;
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
  return (
    <div className={`pt-row${disabled ? ' is-off' : ''}`}>
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
          <Slider.Track className="pt-slider-track">
            <Slider.Indicator className="pt-slider-ind" />
            <Slider.Thumb className="pt-slider-thumb" aria-label={name ?? label} getAriaValueText={valueText ? () => valueText : undefined} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <output>{shown}</output>
    </div>
  );
}

/** A choice: label and a segmented control across the control and value columns. */
export function SegRow<T extends string>({ label, options, value, onChange, hint, disabled }: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T | null;
  onChange: (next: T) => void;
  hint?: string;
  /** Dimmed and not interactive, for a setting that has no effect right now. */
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={`pt-row${disabled ? ' is-off' : ''}`}>
      <span className="pt-row-label" id={id} title={hint}>{label}</span>
      <ToggleGroup
        className="pt-seg"
        value={value === null ? [] : [value]}
        onValueChange={(v) => { if (v[0]) onChange(v[0] as T); }}
        aria-labelledby={id}
        disabled={disabled}
      >
        {options.map((o) => (
          <Toggle key={o.id} value={o.id} onClick={() => { if (o.id === value) onChange(o.id); }}>{o.label}</Toggle>
        ))}
      </ToggleGroup>
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
