import type { BBox, ReliefMode, SmoothLevel } from './pipeline';
import { findPlace } from './places';

const RELIEF: readonly ReliefMode[] = ['dramatic', 'measured'];
const SMOOTH: readonly SmoothLevel[] = ['light', 'medium', 'strong'];

export interface RegionQuery {
  bbox: BBox | null;
  relief: ReliefMode;
  smooth: SmoothLevel;
  place: string | null;
}

function nums(values: unknown[]): BBox | null {
  if (values.length !== 4) return null;
  const [west, south, east, north] = values.map(Number);
  if (![west, south, east, north].every((n) => Number.isFinite(n))) return null;
  return { west, south, east, north };
}

/** `west,south,east,north` or a JSON object with `bbox` or the four edges. */
export function parseBBox(value: string | null): BBox | null {
  if (!value) return null;
  const text = value.trim();
  if (text.startsWith('{')) {
    try {
      const json = JSON.parse(text) as { bbox?: unknown; west?: unknown; south?: unknown; east?: unknown; north?: unknown };
      const raw = Array.isArray(json.bbox) ? json.bbox : [json.west, json.south, json.east, json.north];
      return nums(raw);
    } catch {
      return null;
    }
  }
  return nums(text.split(',').map((part) => Number(part.trim())));
}

export function formatBBox(bbox: BBox): string {
  return [bbox.west, bbox.south, bbox.east, bbox.north].map((n) => Number(n.toFixed(5))).join(',');
}

function choice<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}

export function readRegion(search: string): RegionQuery {
  const q = new URLSearchParams(search);
  return {
    bbox: parseBBox(q.get('region')) ?? findPlace(q.get('place'))?.bbox ?? null,
    relief: choice(q.get('relief'), RELIEF, 'dramatic'),
    smooth: choice(q.get('smooth'), SMOOTH, 'medium'),
    place: q.get('place'),
  };
}

/** A named place writes only `place`; its box comes back from the place list. */
export function writeRegion(q: URLSearchParams, region: RegionQuery): void {
  const named = findPlace(region.place)?.bbox;
  if (region.bbox && !(named && formatBBox(named) === formatBBox(region.bbox))) q.set('region', formatBBox(region.bbox));
  else q.delete('region');
  if (region.relief !== 'dramatic') q.set('relief', region.relief);
  else q.delete('relief');
  if (region.smooth !== 'medium') q.set('smooth', region.smooth);
  else q.delete('smooth');
  if (region.place) q.set('place', region.place);
  else q.delete('place');
}
