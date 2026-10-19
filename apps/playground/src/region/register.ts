import { getModelContext, runTracked } from '../webmcp';
import type { BBox } from 'topographic/locations';
import { REGION_TOOL_DEFS, regionQuery, regionUpdate, type RegionToolState } from './tools';

export interface RegionAgent extends RegionToolState {
  name: string;
  status: string;
  error: string | null;
  info: {
    minM: number;
    maxM: number;
    reliefM: number;
    zoom: number;
    tiles: number;
    builtIn: boolean;
    loadMs: number;
  } | null;
  setPlace(bbox: BBox, placeId: string | null): void;
  clear(): void;
}

function snapshot(agent: RegionAgent) {
  return {
    name: agent.name,
    bbox: agent.bbox,
    place: agent.placeId,
    status: agent.status,
    loading: agent.status === 'loading',
    message: agent.status === 'loading' ? 'Loading terrain' : null,
    error: agent.error,
    reliefM: agent.info?.reliefM ?? null,
    minM: agent.info?.minM ?? null,
    maxM: agent.info?.maxM ?? null,
    zoom: agent.info?.zoom ?? null,
    tiles: agent.info?.tiles ?? null,
    builtIn: agent.info?.builtIn ?? null,
    loadMs: agent.info ? Math.round(agent.info.loadMs) : null,
    query: regionQuery(agent),
  };
}

/** Registers set_region, get_region and clear_region. */
export function registerRegionTools(get: () => RegionAgent): () => void {
  const mc = getModelContext();
  if (!mc) return () => {};
  const controller = new AbortController();
  const run: Record<string, (input: Record<string, unknown>) => unknown> = {
    get_region: () => snapshot(get()),
    clear_region: () => {
      get().clear();
      return { cleared: true };
    },
    set_region: (input) => {
      const agent = get();
      const next = regionUpdate(input ?? {});
      if (typeof next === 'string') throw new Error(next);
      const same = agent.bbox
        && next.placeId === agent.placeId
        && next.bbox.west === agent.bbox.west
        && next.bbox.south === agent.bbox.south
        && next.bbox.east === agent.bbox.east
        && next.bbox.north === agent.bbox.north;
      if (!same) agent.setPlace(next.bbox, next.placeId);
      return {
        accepted: true,
        bbox: next.bbox,
        place: next.placeId,
        query: regionQuery(next),
      };
    },
  };
  for (const def of REGION_TOOL_DEFS) {
    const tool = {
      name: def.name,
      title: def.title,
      description: def.description,
      inputSchema: def.inputSchema,
      annotations: { readOnlyHint: def.readOnly },
      execute: async (input: Record<string, unknown> = {}) => runTracked(def.name, () => run[def.name](input)),
    };
    Promise.resolve(mc.registerTool(tool, { signal: controller.signal }))
      .catch((error) => console.warn(`[topographic] WebMCP could not register ${def.name}:`, error));
  }
  return () => controller.abort();
}
