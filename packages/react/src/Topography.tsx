'use client';
import { forwardRef, useEffect, useRef, useState, type HTMLAttributes, type MutableRefObject } from 'react';
import { createTopography, type RendererOptions, type SettingsInput, type Topography as TopographyInstance } from 'topography.js';

export interface TopographySettingsProps {
  /** Style id, e.g. 'dunes'. Named styleName because `style` is React's inline style prop. */
  styleName?: string;
  seed?: number;
  lines?: SettingsInput['lines'];
  terrain?: SettingsInput['terrain'];
  motion?: SettingsInput['motion'];
  layout?: SettingsInput['layout'];
  theme?: SettingsInput['theme'];
}

export interface TopographyRef<T extends HTMLElement = HTMLDivElement> extends MutableRefObject<T | null> {
  /** The live instance while mounted (for snapshot, or imperative updates). */
  topography: TopographyInstance | null;
}

const key = (v: unknown) => (v === undefined ? '' : JSON.stringify(v));

function useByValue<T>(value: T): T {
  const [kept, setKept] = useState(value);
  if (key(kept) === key(value)) return kept;
  setKept(value);
  return value;
}

/** Attaches a topography to the element you put the returned ref on. */
export function useTopography<T extends HTMLElement = HTMLDivElement>(
  settings: TopographySettingsProps = {},
  options?: RendererOptions,
): TopographyRef<T> {
  const [ref] = useState<TopographyRef<T>>(() => ({ current: null, topography: null }));
  const latest = useRef(settings);
  latest.current = settings;
  const stableOptions = useByValue(options);

  useEffect(() => {
    if (!ref.current) return;
    const { styleName, ...rest } = latest.current;
    const t = createTopography(ref.current, { ...rest, style: styleName }, stableOptions);
    ref.topography = t;
    return () => { t.destroy(); ref.topography = null; };
  }, [ref, stableOptions]);

  const { styleName, seed } = settings;
  const lines = useByValue(settings.lines);
  const terrain = useByValue(settings.terrain);
  const motion = useByValue(settings.motion);
  const layout = useByValue(settings.layout);
  const theme = useByValue(settings.theme);
  useEffect(() => { if (styleName !== undefined) ref.topography?.update({ style: styleName }); }, [ref, styleName]);
  useEffect(() => { if (seed !== undefined) ref.topography?.update({ seed }); }, [ref, seed]);
  useEffect(() => { if (lines) ref.topography?.update({ lines }); }, [ref, lines]);
  useEffect(() => { if (terrain) ref.topography?.update({ terrain }); }, [ref, terrain]);
  useEffect(() => { if (motion) ref.topography?.update({ motion }); }, [ref, motion]);
  useEffect(() => { if (layout) ref.topography?.update({ layout }); }, [ref, layout]);
  useEffect(() => { if (theme) ref.topography?.update({ theme }); }, [ref, theme]);

  return ref;
}

export interface TopographyProps extends TopographySettingsProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Renderer options (pixel budget, WebGL1). Changing them recreates the renderer. */
  options?: RendererOptions;
  /** Called with the instance after mount, and with null on unmount. */
  onReady?: (topography: TopographyInstance | null) => void;
  children?: React.ReactNode;
}

/** A <div> with a topography background. Size it like any div; children render on top. */
export const Topography = forwardRef<HTMLDivElement, TopographyProps>(function Topography(
  { styleName, seed, lines, terrain, motion, layout, theme, options, onReady, style, children, ...div },
  forwarded,
) {
  const ref = useTopography<HTMLDivElement>({ styleName, seed, lines, terrain, motion, layout, theme }, options);
  const stableOptions = useByValue(options);
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => {
    ready.current?.(ref.topography);
    return () => ready.current?.(null);
  }, [ref, stableOptions]);

  return (
    <div
      {...div}
      style={{ position: 'relative', ...style }}
      ref={(node) => {
        ref.current = node;
        if (typeof forwarded === 'function') forwarded(node);
        else if (forwarded) forwarded.current = node;
      }}
    >
      {children !== undefined && <div style={{ position: 'absolute', inset: 0 }}>{children}</div>}
    </div>
  );
});
