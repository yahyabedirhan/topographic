import { decodeGrid16, fetchLocation, findLocation, loadLocation, areaSpan as spanOf, type BBox, type LocationField, type ReliefMode, type SmoothLevel } from 'topographic/locations';
import { sameBox } from './box';

/** A catalog place's pre-rendered grid: where it is served and the heights it was made from. */
export interface StaticGrid {
  url: string;
  minMeters: number;
  maxMeters: number;
  zoom: number;
}

export interface BuildRequest {
  id: number;
  bbox: BBox;
  /** A named place. When the box is still that place's own, its built-in grid loads instead of the tiles. */
  placeId: string | null;
  relief: ReliefMode;
  smooth: SmoothLevel;
  /** A catalog place's grid file, for its own box. When the file fails, the tiles are used instead. */
  grid?: StaticGrid;
}

export interface BuildOk {
  id: number;
  ok: true;
  samples: Float32Array;
  size: number;
  aspect: number;
  minM: number;
  maxM: number;
  reliefM: number;
  zoom: number;
  /** Elevation tiles downloaded: 0 for a built-in or catalog grid. */
  tiles: number;
  /** Whether the grid came ready-made, from the library or the playground's catalog, rather than from the tiles. */
  builtIn: boolean;
  loadMs: number;
}

export interface BuildErr {
  id: number;
  ok: false;
  error: string;
}

/** What build() reads from; the tests replace it. */
export interface BuildSources {
  loadLocation: (id: string) => Promise<LocationField>;
  fetchLocation: (bbox: BBox, options: { relief: ReliefMode; smooth: SmoothLevel }) => Promise<LocationField & { tiles: number }>;
  fetch: (url: string) => Promise<Response>;
}

const LIVE: BuildSources = { loadLocation, fetchLocation, fetch: (url) => fetch(url) };

/** Ready-made grids use dramatic relief and medium smoothing, like every place here. */
function standard(req: BuildRequest): boolean {
  return req.relief === 'dramatic' && req.smooth === 'medium';
}

async function readStatic(bbox: BBox, grid: StaticGrid, sources: BuildSources): Promise<LocationField> {
  const res = await sources.fetch(grid.url);
  if (!res.ok) throw new Error(`${grid.url} returned ${res.status}`);
  const decoded = await decodeGrid16(new Uint8Array(await res.arrayBuffer()));
  return { ...decoded, aspect: spanOf(bbox).aspect, minMeters: grid.minMeters, maxMeters: grid.maxMeters, zoom: grid.zoom };
}

/**
 * Makes a place's height grid: a built-in place from the library, a catalog place from its static
 * file, and any other box, or a catalog place whose file fails, from the elevation tiles.
 */
export async function build(req: BuildRequest, sources: BuildSources = LIVE): Promise<BuildOk> {
  const t0 = performance.now();
  const location = req.placeId ? findLocation(req.placeId) : undefined;
  let field: LocationField & { tiles?: number } | null = null;
  let builtIn = false;
  if (location && sameBox(location.bbox, req.bbox) && standard(req)) {
    field = await sources.loadLocation(location.id);
    builtIn = true;
  } else if (req.grid && standard(req)) {
    try {
      field = await readStatic(req.bbox, req.grid, sources);
      builtIn = true;
    } catch (error) {
      console.warn(`[topographic] ${req.placeId} grid file failed, reading the elevation tiles instead:`, error);
    }
  }
  field ??= await sources.fetchLocation(req.bbox, { relief: req.relief, smooth: req.smooth });
  return {
    id: req.id,
    ok: true,
    samples: field.samples,
    size: field.size,
    aspect: field.aspect,
    minM: field.minMeters,
    maxM: field.maxMeters,
    reliefM: field.maxMeters - field.minMeters,
    zoom: field.zoom,
    tiles: field.tiles ?? 0,
    builtIn,
    loadMs: performance.now() - t0,
  };
}
