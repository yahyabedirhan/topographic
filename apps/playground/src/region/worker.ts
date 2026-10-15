import { LIMITS, limitMessage, limitProblem, resample, shapeField, stitch, terrariumMeters, terrariumUrl, tileRange, type BBox, type ReliefMode, type SmoothLevel } from './pipeline';

export interface BuildRequest {
  id: number;
  bbox: BBox;
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
  tiles: number;
  fetchMs: number;
  shapeMs: number;
}

export interface BuildErr {
  id: number;
  ok: false;
  error: string;
}

async function decodeTile(z: number, x: number, y: number): Promise<Float32Array> {
  const res = await fetch(terrariumUrl(z, x, y));
  if (!res.ok) throw new Error(`Elevation tile ${z}/${x}/${y} returned ${res.status}.`);
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);
  // close() zeroes width and height, so the size has to be copied first.
  const width = bmp.width;
  const height = bmp.height;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('This browser cannot read elevation tiles.');
  ctx.drawImage(bmp, 0, 0);
  const img = ctx.getImageData(0, 0, width, height);
  bmp.close();
  const out = new Float32Array(width * height);
  const data = img.data;
  for (let i = 0, p = 0; i < out.length; i++, p += 4) out[i] = terrariumMeters(data[p], data[p + 1], data[p + 2]);
  return out;
}

async function build(req: BuildRequest): Promise<BuildOk> {
  const problem = limitProblem(req.bbox);
  if (problem) throw new Error(limitMessage(problem));
  const range = tileRange(req.bbox);
  const t0 = performance.now();
  const decoded = new Map<string, Float32Array>();
  const jobs: Promise<void>[] = [];
  for (let y = range.y0; y <= range.y1; y++) {
    for (let x = range.x0; x <= range.x1; x++) {
      jobs.push(decodeTile(range.z, x, y).then((px) => { decoded.set(`${x}/${y}`, px); }));
    }
  }
  await Promise.all(jobs);
  const fetchMs = performance.now() - t0;
  const t1 = performance.now();
  const mosaic = stitch(range, (x, y) => decoded.get(`${x}/${y}`) ?? new Float32Array(256 * 256));
  const meters = resample(mosaic, req.bbox, LIMITS.grid);
  const field = shapeField(meters, LIMITS.grid, req.bbox, req.relief, req.smooth);
  return {
    id: req.id,
    ok: true,
    samples: field.samples,
    size: field.size,
    aspect: field.aspect,
    minM: field.minM,
    maxM: field.maxM,
    reliefM: field.reliefM,
    zoom: range.z,
    tiles: range.count,
    fetchMs,
    shapeMs: performance.now() - t1,
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
      const message = error instanceof Error ? error.message : 'The elevation could not be read.';
      const body: BuildErr = { id: req.id, ok: false, error: message };
      scope.postMessage(body);
    },
  );
};
