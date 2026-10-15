import type { ToolDef } from '../../agent-tools';
import { limitMessage, limitProblem, type BBox, type ReliefMode, type SmoothLevel } from './pipeline';
import { PLACES, findPlace } from './places';
import { parseBBox, writeRegion } from './url';

const RELIEF: readonly ReliefMode[] = ['dramatic', 'measured'];
const SMOOTH: readonly SmoothLevel[] = ['light', 'medium', 'strong'];

export interface RegionToolState {
  bbox: BBox | null;
  placeId: string | null;
  relief: ReliefMode;
  smooth: SmoothLevel;
}

export interface RegionUpdate {
  bbox: BBox;
  placeId: string | null;
  relief: ReliefMode;
  smooth: SmoothLevel;
}

/** The query string an agent can append to `/?variant=P2`. */
export function regionQuery(region: RegionToolState): string {
  const q = new URLSearchParams();
  writeRegion(q, { bbox: region.bbox, relief: region.relief, smooth: region.smooth, place: region.placeId });
  return q.toString();
}

function choice<T extends string>(value: unknown, allowed: readonly T[]): T | null | 'bad' {
  if (value === undefined) return null;
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : 'bad';
}

function explicitBBox(input: Record<string, unknown>): BBox | null | 'bad' {
  const edges = ['west', 'south', 'east', 'north'] as const;
  const present = edges.filter((key) => input[key] !== undefined);
  if (present.length) {
    if (present.length !== 4) return 'bad';
    const nums = edges.map((key) => Number(input[key]));
    if (!nums.every((n) => Number.isFinite(n))) return 'bad';
    const [west, south, east, north] = nums;
    return { west, south, east, north };
  }
  if (input.bbox !== undefined) {
    return parseBBox(JSON.stringify({ bbox: input.bbox })) ?? 'bad';
  }
  if (typeof input.region === 'string') return parseBBox(input.region) ?? 'bad';
  return null;
}

/**
 * Turns a tool input into the next region.
 * A string return is the error an agent should see.
 * An explicit bbox wins over `place`. Relief or smoothing alone keeps the current bbox.
 */
export function regionUpdate(input: Record<string, unknown>, current: RegionToolState): RegionUpdate | string {
  const relief = choice(input.relief, RELIEF);
  if (relief === 'bad') return 'relief must be dramatic or measured.';
  const smooth = choice(input.smooth, SMOOTH);
  if (smooth === 'bad') return 'smooth must be light, medium or strong.';

  const drawn = explicitBBox(input);
  if (drawn === 'bad') return 'Give west, south, east and north, a bbox array, or region as west,south,east,north.';

  let bbox = drawn;
  let placeId: string | null = null;
  if (typeof input.place === 'string' && input.place) {
    const place = findPlace(input.place);
    if (!place) return `Unknown place "${input.place}". Known places: ${PLACES.map((p) => p.id).join(', ')}.`;
    if (!bbox) {
      bbox = place.bbox;
      placeId = place.id;
    }
  }

  if (!bbox) {
    if ((relief || smooth) && current.bbox) {
      bbox = current.bbox;
      placeId = current.placeId;
    } else return 'Give a place or a bbox.';
  }

  const problem = limitProblem(bbox);
  if (problem) return limitMessage(problem);
  return {
    bbox,
    placeId,
    relief: relief ?? current.relief,
    smooth: smooth ?? current.smooth,
  };
}

const SET_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    place: { type: 'string', enum: PLACES.map((p) => p.id), description: 'Named example. Ignored when a bbox is also given.' },
    west: { type: 'number', description: 'West edge, degrees.' },
    south: { type: 'number', description: 'South edge, degrees.' },
    east: { type: 'number', description: 'East edge, degrees.' },
    north: { type: 'number', description: 'North edge, degrees.' },
    bbox: { type: 'array', items: { type: 'number' }, minItems: 4, maxItems: 4, description: '[west, south, east, north] in degrees.' },
    region: { type: 'string', description: 'west,south,east,north or JSON with a bbox array.' },
    relief: { type: 'string', enum: [...RELIEF], description: 'dramatic stretches the local range. measured keeps 400 m as full height.' },
    smooth: { type: 'string', enum: [...SMOOTH], description: 'How round the peaks stay. medium is the default.' },
  },
} as const;

/** Dev playground only. Not part of TOOL_DEFS, so the published page never registers them. */
export const REGION_TOOL_DEFS: ToolDef[] = [
  {
    name: 'set_region',
    title: 'Set region',
    readOnly: false,
    description: 'Dev playground only (?variant=P2). Sets the map region that becomes the terrain. Give place (zermatt, istanbul or chicago) or a bbox in degrees. Optional relief is dramatic or measured, and smooth is light, medium or strong. The same values are written to the page URL as ?region=.',
    inputSchema: SET_SCHEMA,
  },
  {
    name: 'get_region',
    title: 'Get region',
    readOnly: true,
    description: 'Dev playground only (?variant=P2). Returns the current region, relief, smoothing, load status and the URL query.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'clear_region',
    title: 'Clear region',
    readOnly: false,
    description: 'Dev playground only (?variant=P2). Removes the region and returns to the procedural terrain.',
    inputSchema: { type: 'object', properties: {} },
  },
];
