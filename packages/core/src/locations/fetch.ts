import type { LocationField } from './builtin.js';
import {
  LIMITS, TERRARIUM, limitMessage, limitProblem, resample, shapeField, stitch, terrariumMeters, tileRange,
  type BBox, type ReliefMode, type SmoothLevel,
} from './pipeline.js';

export interface FetchLocationOptions {
  /**
   * `dramatic` (the default) stretches the area's own range of heights to fill the terrain, so a flat
   * city still reads. `measured` keeps 400 m as the full height, so flat ground stays flat.
   */
  relief?: ReliefMode;
  /** How much the heights are smoothed. Defaults to `medium`. */
  smooth?: SmoothLevel;
  /** A Terrarium tile URL with `{z}`, `{x}` and `{y}`. Defaults to the AWS Open Data tiles. */
  tiles?: string;
  signal?: AbortSignal;
}

/** A fetched area's height grid. */
export interface FetchedLocation extends LocationField {
  /** How many elevation tiles were downloaded. */
  tiles: number;
}

/** Reads one tile as metres, 256 × 256, north row first. */
export type TileReader = (z: number, x: number, y: number) => Promise<Float32Array>;

function tileUrl(template: string, z: number, x: number, y: number): string {
  return template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}

function pixelsOf(bmp: ImageBitmap): ImageData {
  const { width, height } = bmp;
  if (typeof OffscreenCanvas !== 'undefined') {
    const ctx = new OffscreenCanvas(width, height).getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('[topographic] this browser cannot read elevation tiles');
    ctx.drawImage(bmp, 0, 0);
    return ctx.getImageData(0, 0, width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('[topographic] this browser cannot read elevation tiles');
  ctx.drawImage(bmp, 0, 0);
  return ctx.getImageData(0, 0, width, height);
}

/** Fetches a Terrarium tile and decodes it with the browser's PNG decoder. */
export function terrariumReader(template = TERRARIUM, signal?: AbortSignal): TileReader {
  return async (z, x, y) => {
    const res = await fetch(tileUrl(template, z, x, y), { signal });
    if (!res.ok) throw new Error(`[topographic] elevation tile ${z}/${x}/${y} returned ${res.status}`);
    const bmp = await createImageBitmap(await res.blob());
    try {
      const data = pixelsOf(bmp).data;
      const out = new Float32Array(data.length / 4);
      for (let i = 0, p = 0; i < out.length; i++, p += 4) out[i] = terrariumMeters(data[p], data[p + 1], data[p + 2]);
      return out;
    } finally {
      bmp.close();
    }
  };
}

/** The pipeline after the tiles: stitch, resample to the grid, then shape and smooth the heights. */
export async function buildLocation(bbox: BBox, read: TileReader, options: FetchLocationOptions = {}): Promise<FetchedLocation> {
  const problem = limitProblem(bbox);
  if (problem) throw new Error(`[topographic] ${limitMessage(problem)}`);
  const range = tileRange(bbox);
  const decoded = new Map<string, Float32Array>();
  const jobs: Promise<void>[] = [];
  for (let y = range.y0; y <= range.y1; y++) {
    for (let x = range.x0; x <= range.x1; x++) {
      jobs.push(read(range.z, x, y).then((px) => { decoded.set(`${x}/${y}`, px); }));
    }
  }
  await Promise.all(jobs);
  const mosaic = stitch(range, (x, y) => decoded.get(`${x}/${y}`) ?? new Float32Array(256 * 256));
  const meters = resample(mosaic, bbox, LIMITS.grid);
  const field = shapeField(meters, LIMITS.grid, bbox, options.relief ?? 'dramatic', options.smooth ?? 'medium');
  return {
    samples: field.samples, size: field.size, aspect: field.aspect,
    minMeters: field.minM, maxMeters: field.maxM, zoom: range.z, tiles: range.count,
  };
}

/**
 * Downloads the elevation of any area up to 300 km wide and makes a 256 × 256 height grid from it,
 * the same way the playground does. Pass the result as the `location` setting.
 */
export function fetchLocation(bbox: BBox, options: FetchLocationOptions = {}): Promise<FetchedLocation> {
  return buildLocation(bbox, terrariumReader(options.tiles, options.signal), options);
}
