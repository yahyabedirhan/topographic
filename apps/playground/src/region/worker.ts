import { fetchLocation, findLocation, loadLocation, type BBox, type LocationField, type ReliefMode, type SmoothLevel } from 'topographic/locations';
import { sameBox } from './places';

export interface BuildRequest {
  id: number;
  bbox: BBox;
  /** A named place. When the box is still that place's own, its built-in grid loads instead of the tiles. */
  placeId: string | null;
  relief: ReliefMode;
  smooth: SmoothLevel;
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
  /** Elevation tiles downloaded: 0 for a built-in grid. */
  tiles: number;
  /** Whether the grid came with the library rather than from the tiles. */
  builtIn: boolean;
  loadMs: number;
}

export interface BuildErr {
  id: number;
  ok: false;
  error: string;
}

/** The library's built-in grids use dramatic relief and medium smoothing, like every place here. */
function builtIn(req: BuildRequest): boolean {
  const location = req.placeId ? findLocation(req.placeId) : undefined;
  return Boolean(location && sameBox(location.bbox, req.bbox) && req.relief === 'dramatic' && req.smooth === 'medium');
}

async function build(req: BuildRequest): Promise<BuildOk> {
  const t0 = performance.now();
  const local = builtIn(req);
  const field: LocationField & { tiles?: number } = local
    ? await loadLocation(req.placeId!)
    : await fetchLocation(req.bbox, { relief: req.relief, smooth: req.smooth });
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
    builtIn: local,
    loadMs: performance.now() - t0,
  };
}

interface WorkerScope {
  onmessage: ((event: MessageEvent<BuildRequest>) => void) | null;
  postMessage(message: BuildOk | BuildErr, transfer?: Transferable[]): void;
}
const scope = self as unknown as WorkerScope;
scope.onmessage = (event: MessageEvent<BuildRequest>) => {
  const req = event.data;
  build(req).then(
    (result) => scope.postMessage(result, [result.samples.buffer]),
    (error: unknown) => {
      // The library prefixes its errors for the console; the page shows the sentence alone.
      const message = error instanceof Error ? error.message.replace(/^\[topographic\] /, '') : 'The elevation could not be read.';
      const body: BuildErr = { id: req.id, ok: false, error: message };
      scope.postMessage(body);
    },
  );
};
