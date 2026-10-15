/** Turn a map rectangle into a normalised heightfield. Fun, not a survey. */

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type ReliefMode = 'dramatic' | 'measured';
export type SmoothLevel = 'light' | 'medium' | 'strong';

/** Shortest side, longest side, and how square the rectangle must stay. */
export const LIMITS = {
  minSideM: 1500,
  maxSideM: 64000,
  maxAspect: 3,
  maxTiles: 36,
  grid: 256,
  zoomMax: 15,
} as const;

/** In measured mode, this many metres of relief fills the block. Less stays flatter. */
export const MEASURED_RELIEF_M = 400;

export const SMOOTH_SIGMA: Record<SmoothLevel, number> = {
  light: 0.65,
  medium: 1.45,
  strong: 2.8,
};

export const TERRARIUM =
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

/** Terrarium PNG channels to metres. `(R * 256 + G + B / 256) - 32768`. */
export function terrariumMeters(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

export function terrariumUrl(z: number, x: number, y: number): string {
  return TERRARIUM.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}

/** Web-mercator tile X, fractional. */
export function lonToX(lon: number, z: number): number {
  return ((lon + 180) / 360) * 2 ** z;
}

/** Web-mercator tile Y, fractional. 0 is the north edge. */
export function latToY(lat: number, z: number): number {
  const s = Math.sin((lat * Math.PI) / 180);
  const clamped = Math.min(0.9999, Math.max(-0.9999, s));
  return (0.5 - Math.log((1 + clamped) / (1 - clamped)) / (4 * Math.PI)) * 2 ** z;
}

export interface Span {
  widthM: number;
  heightM: number;
  shorterM: number;
  longerM: number;
  /** Width / height in web mercator, so the block matches the map. */
  aspect: number;
}

export function spanOf(bbox: BBox): Span {
  const mid = ((bbox.south + bbox.north) / 2) * Math.PI / 180;
  const widthM = Math.abs(bbox.east - bbox.west) * 111_320 * Math.cos(mid);
  const heightM = Math.abs(bbox.north - bbox.south) * 110_540;
  const mx = Math.abs(lonToX(bbox.east, 0) - lonToX(bbox.west, 0));
  const my = Math.abs(latToY(bbox.north, 0) - latToY(bbox.south, 0)) || 1e-9;
  return {
    widthM, heightM,
    shorterM: Math.min(widthM, heightM),
    longerM: Math.max(widthM, heightM),
    aspect: mx / my,
  };
}

export type LimitProblem = 'order' | 'small' | 'large' | 'aspect';

/** Why a rectangle cannot become a terrain, or null when it can. */
export function limitProblem(bbox: BBox): LimitProblem | null {
  if (!(bbox.west < bbox.east) || !(bbox.south < bbox.north)) return 'order';
  if (bbox.west < -180 || bbox.east > 180 || bbox.south < -85 || bbox.north > 85) return 'order';
  const span = spanOf(bbox);
  if (span.shorterM < LIMITS.minSideM) return 'small';
  if (span.longerM > LIMITS.maxSideM) return 'large';
  const aspect = span.widthM / Math.max(span.heightM, 1);
  if (aspect > LIMITS.maxAspect || aspect < 1 / LIMITS.maxAspect) return 'aspect';
  return null;
}

export function limitMessage(problem: LimitProblem): string {
  if (problem === 'small') return `Too small. The short side needs to be at least ${(LIMITS.minSideM / 1000).toFixed(1)} km.`;
  if (problem === 'large') return `Too large. The long side needs to stay under ${Math.round(LIMITS.maxSideM / 1000)} km.`;
  if (problem === 'aspect') return `Too thin. Keep the rectangle within ${LIMITS.maxAspect}:1.`;
  return 'The rectangle does not cover a place.';
}

export interface TileRange {
  z: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  count: number;
}

function covering(bbox: BBox, z: number): TileRange {
  const n = 2 ** z;
  const x0 = clampTile(Math.floor(lonToX(bbox.west, z)), n);
  const x1 = clampTile(Math.floor(lonToX(bbox.east - 1e-12, z)), n);
  const y0 = clampTile(Math.floor(latToY(bbox.north, z)), n);
  const y1 = clampTile(Math.floor(latToY(bbox.south - 1e-12, z)), n);
  const count = (Math.abs(x1 - x0) + 1) * (Math.abs(y1 - y0) + 1);
  return { z, x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1), count };
}

function clampTile(v: number, n: number): number {
  return Math.min(n - 1, Math.max(0, v));
}

/** Finest zoom whose tiles still fit the budget. Zoom 15 is the last terrarium level with new detail. */
export function tileRange(bbox: BBox, maxTiles = LIMITS.maxTiles): TileRange {
  let best = covering(bbox, 0);
  for (let z = LIMITS.zoomMax; z >= 0; z--) {
    const next = covering(bbox, z);
    if (next.count <= maxTiles) return next;
    best = next;
  }
  return best;
}

export interface Mosaic {
  meters: Float32Array;
  width: number;
  height: number;
  /** Global pixel of the mosaic origin at this zoom (tileX * 256). */
  originX: number;
  originY: number;
  z: number;
}

/** Copy decoded tiles (256², row 0 at the north of that tile) into one mosaic. */
export function stitch(
  range: TileRange,
  tile: (x: number, y: number) => Float32Array,
  tileSize = 256,
): Mosaic {
  const tw = range.x1 - range.x0 + 1;
  const th = range.y1 - range.y0 + 1;
  const width = tw * tileSize;
  const height = th * tileSize;
  const meters = new Float32Array(width * height);
  for (let ty = range.y0; ty <= range.y1; ty++) {
    for (let tx = range.x0; tx <= range.x1; tx++) {
      const src = tile(tx, ty);
      const ox = (tx - range.x0) * tileSize;
      const oy = (ty - range.y0) * tileSize;
      const side = Math.round(Math.sqrt(src.length));
      for (let row = 0; row < side; row++) {
        meters.set(src.subarray(row * side, row * side + side), (oy + row) * width + ox);
      }
    }
  }
  return { meters, width, height, originX: range.x0 * tileSize, originY: range.y0 * tileSize, z: range.z };
}

function bilinear(mosaic: Mosaic, gx: number, gy: number): number {
  const x = gx - mosaic.originX;
  const y = gy - mosaic.originY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const at = (px: number, py: number) => {
    const cx = Math.min(mosaic.width - 1, Math.max(0, px));
    const cy = Math.min(mosaic.height - 1, Math.max(0, py));
    return mosaic.meters[cy * mosaic.width + cx];
  };
  const a = at(x0, y0);
  const b = at(x0 + 1, y0);
  const c = at(x0, y0 + 1);
  const d = at(x0 + 1, y0 + 1);
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

/** Sample the bbox onto a square grid. Row 0 is south, column 0 is west. */
export function resample(mosaic: Mosaic, bbox: BBox, grid: number): Float32Array {
  const out = new Float32Array(grid * grid);
  const xWest = lonToX(bbox.west, mosaic.z) * 256;
  const xEast = lonToX(bbox.east, mosaic.z) * 256;
  const yNorth = latToY(bbox.north, mosaic.z) * 256;
  const ySouth = latToY(bbox.south, mosaic.z) * 256;
  for (let j = 0; j < grid; j++) {
    const v = (j + 0.5) / grid;
    const gy = ySouth + (yNorth - ySouth) * v;
    for (let i = 0; i < grid; i++) {
      const u = (i + 0.5) / grid;
      const gx = xWest + (xEast - xWest) * u;
      out[j * grid + i] = bilinear(mosaic, gx, gy);
    }
  }
  return out;
}

function percentile(values: Float32Array, p: number): number {
  const copy = Float32Array.from(values);
  copy.sort();
  const i = Math.min(copy.length - 1, Math.max(0, Math.round(p * (copy.length - 1))));
  return copy[i];
}

function kernel(sigma: number): Float32Array {
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const w = Math.exp(-0.5 * (i * i) / (sigma * sigma));
    k[i + radius] = w;
    sum += w;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  return k;
}

/** Separable gaussian. Sigma is in grid pixels, so peaks stay round instead of needle-sharp. */
export function smooth(src: Float32Array, size: number, sigma: number): Float32Array {
  const k = kernel(sigma);
  const radius = (k.length - 1) >> 1;
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let acc = 0;
      for (let i = -radius; i <= radius; i++) {
        const xx = Math.min(size - 1, Math.max(0, x + i));
        acc += src[y * size + xx] * k[i + radius];
      }
      tmp[y * size + x] = acc;
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let acc = 0;
      for (let i = -radius; i <= radius; i++) {
        const yy = Math.min(size - 1, Math.max(0, y + i));
        acc += tmp[yy * size + x] * k[i + radius];
      }
      out[y * size + x] = acc;
    }
  }
  return out;
}

export interface FieldStats {
  samples: Float32Array;
  size: number;
  aspect: number;
  minM: number;
  maxM: number;
  reliefM: number;
}

/**
 * Sea water is clamped to 0 so a strait stays a flat floor.
 * Dramatic stretches the local range to fill the block, which is what makes a flat city readable.
 * Measured keeps 400 m as a full-height span, so a flat city stays flat and a mountain range still fills the block.
 */
export function shapeField(
  meters: Float32Array,
  size: number,
  bbox: BBox,
  relief: ReliefMode,
  level: SmoothLevel,
): FieldStats {
  const clamped = new Float32Array(meters.length);
  let minM = Infinity;
  let maxM = -Infinity;
  for (let i = 0; i < meters.length; i++) {
    const m = Math.max(0, meters[i]);
    clamped[i] = m;
    if (m < minM) minM = m;
    if (m > maxM) maxM = m;
  }
  if (!Number.isFinite(minM)) { minM = 0; maxM = 0; }
  const reliefM = maxM - minM;
  let lo = minM;
  let span = Math.max(reliefM, 0.5);
  if (relief === 'dramatic') {
    lo = percentile(clamped, 0.02);
    const hi = Math.max(lo + 0.5, percentile(clamped, 0.98));
    span = hi - lo;
  } else {
    span = Math.max(reliefM, MEASURED_RELIEF_M);
  }
  const unit = new Float32Array(clamped.length);
  const sea = new Uint8Array(meters.length);
  for (let i = 0; i < clamped.length; i++) {
    sea[i] = meters[i] <= 0 ? 1 : 0;
    unit[i] = Math.min(1, Math.max(0, (clamped[i] - lo) / span));
  }
  const extra = reliefM < 12 ? 1.8 : reliefM < 30 ? 1.25 : 1;
  const samples = smooth(unit, size, SMOOTH_SIGMA[level] * extra);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = sea[i] ? 0 : Math.min(1, Math.max(0, samples[i]));
  }
  return { samples, size, aspect: spanOf(bbox).aspect, minM, maxM, reliefM };
}

export interface BenchRow {
  label: string;
  ms: number;
}

/** Time the numeric work a worker does after the tiles are decoded. Network is not included. */
export function benchPipeline(): BenchRow[] {
  const rows: BenchRow[] = [];
  const run = (label: string, source: number, grid: number) => {
    const meters = new Float32Array(source * source);
    for (let y = 0; y < source; y++) {
      for (let x = 0; x < source; x++) {
        const nx = x / source;
        const ny = y / source;
        meters[y * source + x] = 120 + 800 * Math.exp(-((nx - 0.62) ** 2 + (ny - 0.4) ** 2) / 0.01) + 40 * nx;
      }
    }
    const bbox: BBox = { west: 7.6, south: 45.95, east: 7.85, north: 46.08 };
    const mosaic: Mosaic = { meters, width: source, height: source, originX: 0, originY: 0, z: 12 };
    const once = () => shapeField(resample(mosaic, bbox, grid), grid, bbox, 'dramatic', 'medium');
    once();
    const t0 = performance.now();
    const shaped = once();
    rows.push({ label, ms: performance.now() - t0 });
    if (shaped.samples.length !== grid * grid) throw new Error('bench size');
  };
  run('9 tiles, 768² source, 256 grid', 768, 256);
  run('36 tiles, 1536² source, 256 grid', 1536, 256);
  run('heavy, 2048² source, 512 grid', 2048, 512);
  return rows;
}
