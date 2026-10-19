export type GroupName = 'lines' | 'terrain' | 'motion' | 'layout';

export interface ParamDef {
  group: GroupName;
  key: string;
  /** Human label for UIs. */
  label: string;
  /** One-line description for docs and tooltips. */
  description: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Whole numbers only. */
  integer?: boolean;
  /** HTML attribute on <topographic-map>. */
  attr: string;
  /** Short key used in shareable URLs. */
  short: string;
  /** Shader slot: an index into uParams[16], or a named uniform. */
  slot: number | 'uCenter' | 'uFade';
  /** Public value -> shader value. Identity when omitted. */
  toUniform?: (v: number) => number;
}

export const PARAMS = [
  { group: 'lines', key: 'count', label: 'Line count', description: 'How many contour lines cross the field.',
    min: 6, max: 60, step: 1, default: 30, integer: true, attr: 'line-count', short: 'lc', slot: 0 },
  { group: 'lines', key: 'width', label: 'Line width', description: 'Stroke width of each contour line.',
    min: 0, max: 1, step: 0.01, default: 0.26, attr: 'line-width', short: 'lw', slot: 1, toUniform: (v: number) => 0.5 + v * 3.5 },
  { group: 'lines', key: 'opacity', label: 'Line opacity', description: 'How strongly lines show against the paper.',
    min: 0, max: 1, step: 0.01, default: 0.4, attr: 'line-opacity', short: 'lo', slot: 2 },
  { group: 'lines', key: 'indexEvery', label: 'Bold line every', description: 'Every Nth line is drawn bolder, like the index contours on a map. 0 turns it off.',
    min: 0, max: 10, step: 1, default: 5, integer: true, attr: 'index-every', short: 'ix', slot: 11 },
  { group: 'terrain', key: 'peaks', label: 'Peaks', description: 'Number of summits merged into the terrain.',
    min: 1, max: 6, step: 1, default: 1, integer: true, attr: 'peaks', short: 'pk', slot: 7 },
  { group: 'terrain', key: 'spread', label: 'Spread', description: 'How far extra peaks sit from the main summit.',
    min: 0, max: 1, step: 0.01, default: 0.5, attr: 'spread', short: 'sp', slot: 8 },
  { group: 'terrain', key: 'roughness', label: 'Roughness', description: 'Noise added to the slopes, from smooth hills to rocky ground.',
    min: 0, max: 1, step: 0.01, default: 0, attr: 'roughness', short: 'rg', slot: 9 },
  { group: 'terrain', key: 'sharpness', label: 'Sharpness', description: 'Below 0.5 summits flatten; above 0.5 they sharpen into peaks.',
    min: 0, max: 1, step: 0.01, default: 0.5, attr: 'sharpness', short: 'sh', slot: 10,
    // The shader raises the distance from the summit to this power: above 1 widens the top, below 1 pinches it into a peak.
    toUniform: (v: number) => (v < 0.5 ? 1 + (0.5 - v) * 3 : 1 - (v - 0.5) * 1.2) },
  { group: 'terrain', key: 'terracing', label: 'Terracing', description: 'Groups lines into stepped bands.',
    min: 0, max: 1, step: 0.01, default: 0, attr: 'terracing', short: 'tr', slot: 12 },
  { group: 'terrain', key: 'variant', label: 'Variant', description: 'A knob that depends on the shape (for drifting lobes: three lobes to four).',
    min: 0, max: 1, step: 0.01, default: 0.5, attr: 'variant', short: 'va', slot: 6 },
  { group: 'motion', key: 'speed', label: 'Speed', description: 'Animation speed. 0 holds a still frame.',
    min: 0, max: 3, step: 0.05, default: 1, attr: 'speed', short: 'sd', slot: 3 },
  { group: 'motion', key: 'warp', label: 'Warp', description: 'How much the lines wobble with the flow.',
    min: 0, max: 1, step: 0.01, default: 0.47, attr: 'warp', short: 'wp', slot: 5, toUniform: (v: number) => v * 1.5 },
  { group: 'motion', key: 'sparkle', label: 'Sparkle', description: 'Small bright dots travelling along the lines.',
    min: 0, max: 1, step: 0.01, default: 0.6, attr: 'sparkle', short: 'sk', slot: 4 },
  { group: 'layout', key: 'anchor', label: 'Anchor', description: '0 keeps the summit to the side, 1 centres it.',
    min: 0, max: 1, step: 0.01, default: 0, attr: 'anchor', short: 'an', slot: 'uCenter' },
  { group: 'layout', key: 'fade', label: 'Centre fade', description: 'Fades lines behind a central text column.',
    min: 0, max: 1, step: 0.01, default: 0.7, attr: 'fade', short: 'fd', slot: 'uFade' },
] as const satisfies readonly ParamDef[];

export type Param = (typeof PARAMS)[number];
type KeysOf<G extends GroupName> = Extract<Param, { group: G }>['key'];
export type GroupValues<G extends GroupName> = { [K in KeysOf<G>]: number };

export const GROUPS: readonly GroupName[] = ['lines', 'terrain', 'motion', 'layout'];

export function paramsIn(group: GroupName): readonly ParamDef[] {
  return (PARAMS as readonly ParamDef[]).filter((p) => p.group === group);
}

export function clampParam(def: ParamDef, value: unknown): number {
  let v = typeof value === 'string' ? Number(value) : (value as number);
  if (typeof v !== 'number' || !Number.isFinite(v)) return def.default;
  if (def.integer) v = Math.round(v);
  return Math.min(def.max, Math.max(def.min, v));
}
