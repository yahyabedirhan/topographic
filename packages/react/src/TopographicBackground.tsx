'use client';
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
  /** '2d' is the map. '3d' is the same map as a terrain. */
  mode?: SettingsInput['mode'];
  elevation?: number;
  extent?: SettingsInput['extent'];
  detail?: number;
  /** auto follows the device. low, medium and high stay put. */
  quality?: SettingsInput['quality'];
  camera?: SettingsInput['camera'];
  /** The 2D map's own pan and zoom. 3D ignores it. */
  view2d?: SettingsInput['view2d'];
}

export interface TopographicBackgroundRef<T extends HTMLElement = HTMLDivElement> extends MutableRefObject<T | null> {
  /** The live instance while mounted (for snapshot, or imperative updates). */
  topographic: TopographicBackgroundInstance | null;
}

const key = (v: unknown) => (v === undefined ? '' : JSON.stringify(v));

function useByValue<T>(value: T): T {
  const [kept, setKept] = useState(value);
  if (key(kept) === key(value)) return kept;
  setKept(value);
  return value;
}

/** Attaches a topographic to the element you put the returned ref on. */
export function useTopographicBackground<T extends HTMLElement = HTMLDivElement>(
  settings: TopographicBackgroundSettingsProps = {},
  options?: RendererOptions,
): TopographicBackgroundRef<T> {
  const [ref] = useState<TopographicBackgroundRef<T>>(() => ({ current: null, topographic: null }));
  const latest = useRef(settings);
  latest.current = settings;
  const stableOptions = useByValue(options);

  useEffect(() => {
    if (!ref.current) return;
    const { styleName, ...rest } = latest.current;
    const t = createTopographicBackground(ref.current, { ...rest, style: styleName }, stableOptions);
    ref.topographic = t;
    return () => { t.destroy(); ref.topographic = null; };
  }, [ref, stableOptions]);

  const { styleName, seed, mode, elevation, extent, detail, quality } = settings;
  const lines = useByValue(settings.lines);
  const terrain = useByValue(settings.terrain);
  const motion = useByValue(settings.motion);
  const layout = useByValue(settings.layout);
  const theme = useByValue(settings.theme);
  const camera = useByValue(settings.camera);
  const view2d = useByValue(settings.view2d);
  useEffect(() => { if (styleName !== undefined) ref.topographic?.update({ style: styleName }); }, [ref, styleName]);
  useEffect(() => { if (seed !== undefined) ref.topographic?.update({ seed }); }, [ref, seed]);
  useEffect(() => { if (lines) ref.topographic?.update({ lines }); }, [ref, lines]);
  useEffect(() => { if (terrain) ref.topographic?.update({ terrain }); }, [ref, terrain]);
  useEffect(() => { if (motion) ref.topographic?.update({ motion }); }, [ref, motion]);
  useEffect(() => { if (layout) ref.topographic?.update({ layout }); }, [ref, layout]);
  useEffect(() => { if (theme) ref.topographic?.update({ theme }); }, [ref, theme]);
  useEffect(() => { if (mode !== undefined) ref.topographic?.update({ mode }); }, [ref, mode]);
  useEffect(() => { if (elevation !== undefined) ref.topographic?.update({ elevation }); }, [ref, elevation]);
  useEffect(() => { if (extent !== undefined) ref.topographic?.update({ extent }); }, [ref, extent]);
  useEffect(() => { if (detail !== undefined) ref.topographic?.update({ detail }); }, [ref, detail]);
  useEffect(() => { if (quality !== undefined) ref.topographic?.update({ quality }); }, [ref, quality]);
  useEffect(() => { if (camera) ref.topographic?.update({ camera }); }, [ref, camera]);
  useEffect(() => { if (view2d) ref.topographic?.update({ view2d }); }, [ref, view2d]);

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
  { styleName, seed, lines, terrain, motion, layout, theme, mode, elevation, extent, detail, quality, camera, view2d, options, onReady, style, children, ...div },
  forwarded,
) {
  const ref = useTopographicBackground<HTMLDivElement>({ styleName, seed, lines, terrain, motion, layout, theme, mode, elevation, extent, detail, quality, camera, view2d }, options);
  const stableOptions = useByValue(options);
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => {
    ready.current?.(ref.topographic);
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
