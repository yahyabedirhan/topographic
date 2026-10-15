'use client';
// React bindings for topographic. The canvas is created in an effect, so server rendering
// outputs a plain empty <div> and hydration never touches WebGL.
import { forwardRef, useEffect, useRef, useState, type HTMLAttributes, type MutableRefObject } from 'react';
import { createTopographicBackground, type RendererOptions, type SettingsInput, type TopographicBackground as TopographicBackgroundInstance } from 'topographic';

export interface TopographicBackgroundSettingsProps {
  /** Style id, e.g. 'dunes'. Named styleName because `style` is React's inline style prop. */
  styleName?: string;
  seed?: number;
  lines?: SettingsInput['lines'];
  terrain?: SettingsInput['terrain'];
  motion?: SettingsInput['motion'];
  layout?: SettingsInput['layout'];
  theme?: SettingsInput['theme'];
}

export interface TopographicBackgroundRef<T extends HTMLElement = HTMLDivElement> extends MutableRefObject<T | null> {
  /** The live instance while mounted (for snapshot, or imperative updates). */
  topographic: TopographicBackgroundInstance | null;
}

const key = (v: unknown) => (v === undefined ? '' : JSON.stringify(v));

/** Attaches a topographic to the element you put the returned ref on. */
export function useTopographicBackground<T extends HTMLElement = HTMLDivElement>(
  settings: TopographicBackgroundSettingsProps = {},
  options?: RendererOptions,
): TopographicBackgroundRef<T> {
  const [ref] = useState<TopographicBackgroundRef<T>>(() => ({ current: null, topographic: null }));
  const latest = useRef(settings);
  latest.current = settings;
  const optionsKey = key(options);

  useEffect(() => {
    if (!ref.current) return;
    const { styleName, ...rest } = latest.current;
    const t = createTopographicBackground(ref.current, { ...rest, style: styleName }, options);
    ref.topographic = t;
    return () => { t.destroy(); ref.topographic = null; };
    // Recreated only when renderer options change; settings flow through update() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, optionsKey]);

  // One effect per setter: each group only updates when its own values change.
  const { styleName, seed, lines, terrain, motion, layout, theme } = settings;
  useEffect(() => { if (styleName !== undefined) ref.topographic?.update({ style: styleName }); }, [ref, styleName]);
  useEffect(() => { if (seed !== undefined) ref.topographic?.update({ seed }); }, [ref, seed]);
  useEffect(() => { if (lines) ref.topographic?.update({ lines }); }, [ref, key(lines)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (terrain) ref.topographic?.update({ terrain }); }, [ref, key(terrain)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (motion) ref.topographic?.update({ motion }); }, [ref, key(motion)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (layout) ref.topographic?.update({ layout }); }, [ref, key(layout)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (theme) ref.topographic?.update({ theme }); }, [ref, key(theme)]); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

export interface TopographicBackgroundProps extends TopographicBackgroundSettingsProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Renderer options (pixel budget, WebGL1). Changing them recreates the renderer. */
  options?: RendererOptions;
  /** Called with the instance after mount, and with null on unmount. */
  onReady?: (topographic: TopographicBackgroundInstance | null) => void;
  children?: React.ReactNode;
}

/** A <div> with a topographic background. Size it like any div; children render on top. */
export const TopographicBackground = forwardRef<HTMLDivElement, TopographicBackgroundProps>(function TopographicBackground(
  { styleName, seed, lines, terrain, motion, layout, theme, options, onReady, style, children, ...div },
  forwarded,
) {
  const ref = useTopographicBackground<HTMLDivElement>({ styleName, seed, lines, terrain, motion, layout, theme }, options);
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => {
    ready.current?.(ref.topographic);
    return () => ready.current?.(null);
  }, [ref, key(options)]); // eslint-disable-line react-hooks/exhaustive-deps

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
