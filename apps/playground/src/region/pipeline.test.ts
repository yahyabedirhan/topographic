import { describe, expect, it } from 'vitest';
import {
  LIMITS, MEASURED_RELIEF_M, benchPipeline, latToY, limitMessage, limitProblem, lonToX, resample, rollOff, shapeField,
  spanOf, stitch, terrariumMeters, tileRange, type BBox, type Mosaic,
} from './pipeline';

describe('terrarium', () => {
  it('decodes the documented sample', () => {
    expect(terrariumMeters(137, 219, 68)).toBeCloseTo(2523.265625, 4);
  });
  it('puts sea level at zero', () => {
    expect(terrariumMeters(128, 0, 0)).toBe(0);
  });
});

describe('tiles', () => {
  it('matches the slippy-map y of the equator', () => {
    expect(lonToX(0, 2)).toBeCloseTo(2, 6);
    expect(latToY(0, 2)).toBeCloseTo(2, 6);
  });

  it('uses zoom 15 for a neighbourhood', () => {
    const bbox: BBox = { west: 29.0, south: 41.01, east: 29.02, north: 41.025 };
    const range = tileRange(bbox);
    expect(range.z).toBe(15);
    expect(range.count).toBeLessThanOrEqual(LIMITS.maxTiles);
  });

  it('drops zoom so a wide area stays inside the tile budget', () => {
    const bbox: BBox = { west: 28.2, south: 40.6, east: 30.6, north: 41.6 };
    const range = tileRange(bbox);
    expect(range.count).toBeLessThanOrEqual(LIMITS.maxTiles);
    expect(range.z).toBeLessThan(12);
  });
});

describe('limits', () => {
  it('accepts a city and a mountain range, and rejects a block, a country and a sliver', () => {
    expect(limitProblem({ west: 28.95, south: 41.0, east: 29.05, north: 41.08 })).toBeNull();
    // About 200 km × 130 km around Mont Blanc and Zermatt.
    expect(limitProblem({ west: 6.3, south: 45.4, east: 8.9, north: 46.6 })).toBeNull();
    expect(LIMITS.maxSideM).toBe(300000);
    expect(limitMessage('large')).toBe('Too large. The long side needs to stay under 300 km.');
    expect(limitProblem({ west: 29, south: 41, east: 29.004, north: 41.004 })).toBe('small');
    expect(limitProblem({ west: 26, south: 40, east: 30, north: 42.5 })).toBe('large');
    expect(limitProblem({ west: 29, south: 41, east: 29.5, north: 41.02 })).toBe('aspect');
    expect(limitProblem({ west: 29, south: 41, east: 28, north: 42 })).toBe('order');
  });

  it('reports kilometres from the latitude', () => {
    const span = spanOf({ west: 29, south: 41, east: 29.1, north: 41.1 });
    expect(span.heightM).toBeGreaterThan(10_000);
    expect(span.heightM).toBeLessThan(12_000);
    expect(span.widthM).toBeLessThan(span.heightM);
  });
});

describe('resample and shape', () => {
  it('keeps a west-east ramp in order', () => {
    const z = 8;
    const bbox: BBox = { west: 10, south: 44, east: 10.4, north: 44.3 };
    const x0 = Math.floor(Math.min(lonToX(bbox.west, z), lonToX(bbox.east, z)) * 256) - 1;
    const y0 = Math.floor(Math.min(latToY(bbox.north, z), latToY(bbox.south, z)) * 256) - 1;
    const x1 = Math.ceil(Math.max(lonToX(bbox.west, z), lonToX(bbox.east, z)) * 256) + 1;
    const y1 = Math.ceil(Math.max(latToY(bbox.north, z), latToY(bbox.south, z)) * 256) + 1;
    const width = x1 - x0;
    const height = y1 - y0;
    const meters = new Float32Array(width * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) meters[y * width + x] = x0 + x;
    const mosaic: Mosaic = { meters, width, height, originX: x0, originY: y0, z };
    const grid = resample(mosaic, bbox, 8);
    expect(grid[0]).toBeLessThan(grid[7]);
  });

  it('stitches tiles into mosaic order', () => {
    const a = new Float32Array(4);
    a.fill(1);
    const b = new Float32Array(4);
    b.fill(2);
    const mosaic = stitch({ z: 1, x0: 0, x1: 1, y0: 0, y1: 0, count: 2 }, (x) => (x === 0 ? a : b), 2);
    expect(mosaic.width).toBe(4);
    expect(mosaic.meters[0]).toBe(1);
    expect(mosaic.meters[2]).toBe(2);
  });

  it('stretches a flat city in dramatic mode and keeps it low when measured', () => {
    const bbox: BBox = { west: 29, south: 41, east: 29.1, north: 41.08 };
    const meters = new Float32Array(16);
    for (let i = 0; i < meters.length; i++) meters[i] = 20 + (i % 4) * 4;
    const dramatic = shapeField(meters, 4, bbox, 'dramatic', 'light');
    const measured = shapeField(meters, 4, bbox, 'measured', 'light');
    expect(Math.max(...dramatic.samples)).toBeGreaterThan(0.7);
    expect(Math.max(...measured.samples)).toBeLessThan(40 / MEASURED_RELIEF_M);
    expect(dramatic.reliefM).toBeCloseTo(12, 0);
  });

  it('rounds a single spike', () => {
    const bbox: BBox = { west: 7.6, south: 45.9, east: 7.8, north: 46.05 };
    const meters = new Float32Array(32 * 32);
    meters.fill(100);
    meters[16 * 32 + 16] = 900;
    const shaped = shapeField(meters, 32, bbox, 'dramatic', 'medium');
    const peak = shaped.samples[16 * 32 + 16];
    const neighbour = shaped.samples[16 * 32 + 17];
    expect(peak).toBeLessThan(0.55);
    expect(neighbour).toBeGreaterThan(peak * 0.4);
  });

  it('clamps bathymetry so the sea is a floor', () => {
    const bbox: BBox = { west: 29, south: 41, east: 29.08, north: 41.06 };
    const meters = new Float32Array([
      -40, -20, 10, 80,
      -30, 0, 20, 60,
      -10, 5, 30, 40,
      0, 8, 12, 16,
    ]);
    const shaped = shapeField(meters, 4, bbox, 'dramatic', 'light');
    expect(shaped.minM).toBe(0);
    expect(shaped.maxM).toBe(80);
    expect(shaped.samples[0]).toBe(0);
    expect(shaped.samples[4]).toBe(0);
  });
});

describe('bench', () => {
  it('finishes the numeric pipeline well under a frame budget', () => {
    const rows = benchPipeline();
    for (const row of rows) {
      console.log(`region bench: ${row.label} ${row.ms.toFixed(1)} ms`);
      expect(row.ms).toBeLessThan(250);
    }
  });
});

describe('dramatic relief', () => {
  it('rolls summits off instead of clipping them flat', () => {
    const size = 64;
    const meters = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - 32, y - 32);
      meters[y * size + x] = 100 + 50 * (x / size) + 3000 * Math.exp(-(d * d) / 18);
    }
    const bbox = { west: 7, south: 45, east: 8, north: 45.6 };
    const { samples } = shapeField(meters, size, bbox, 'dramatic', 'light');
    const flat = samples.filter((v) => v >= 0.999).length;
    expect(flat).toBeLessThanOrEqual(1);
    const ring = (r: number) => samples[32 * size + 32 + r];
    expect(ring(0)).toBeGreaterThan(ring(1));
    expect(ring(1)).toBeGreaterThan(ring(2));
    expect(ring(2)).toBeGreaterThan(ring(3));
  });
  it('maps the 2nd to 98th percentile linearly and eases the tails', () => {
    expect(rollOff(0, -1, 3)).toBeCloseTo(0.04);
    expect(rollOff(1, -1, 3)).toBeCloseTo(0.92);
    expect(rollOff(3, -1, 3)).toBeGreaterThan(0.99);
    expect(rollOff(2, -1, 3)).toBeLessThan(rollOff(3, -1, 3));
    expect(rollOff(-1, -1, 3)).toBeLessThan(0.001);
  });
});
