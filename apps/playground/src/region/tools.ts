import type { ToolDef } from '../agent-tools';
import { limitMessage, limitProblem, type BBox } from './pipeline';
import { PLACES, findPlace } from './places';
import { queryText } from '../share-url';
import { parseBBox, writeRegion } from './url';

export interface RegionToolState {
  bbox: BBox | null;
  placeId: string | null;
}

export interface RegionUpdate {
  bbox: BBox;
  placeId: string | null;
}

/** The query string an agent can append to the playground URL. */
export function regionQuery(region: RegionToolState): string {
  const q = new URLSearchParams();
  writeRegion(q, { bbox: region.bbox, place: region.placeId });
  return queryText(q);
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
 * An explicit bbox wins over `place`.
 */
export function regionUpdate(input: Record<string, unknown>): RegionUpdate | string {
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

  if (!bbox) return 'Give a place or a bbox.';

  const problem = limitProblem(bbox);
  if (problem) return limitMessage(problem);
  return { bbox, placeId };
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
  },
} as const;

/** The place tools. The region hook registers them next to TOOL_DEFS. */
export const REGION_TOOL_DEFS: ToolDef[] = [
  {
    name: 'set_region',
    title: 'Set region',
    readOnly: false,
    description: 'Sets the map region that becomes the terrain. Give place (istanbul, san-francisco, london or new-york) or a bbox in degrees. The same values are written to the page URL as ?place= for a named place, or ?region= for a box.',
    inputSchema: SET_SCHEMA,
  },
  {
    name: 'get_region',
    title: 'Get region',
    readOnly: true,
    description: 'Returns the current region, its height range, load status and the URL query.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'clear_region',
    title: 'Clear region',
    readOnly: false,
    description: 'Removes the region and returns to the procedural terrain.',
    inputSchema: { type: 'object', properties: {} },
  },
];
