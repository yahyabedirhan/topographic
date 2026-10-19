import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLocation, fetchLocation } from './fetch.js';
import { terrariumMeters, tileRange, type BBox } from './pipeline.js';

afterEach(() => { vi.unstubAllGlobals(); });

const EVEREST: BBox = { west: 86.515, south: 27.725, east: 87.125, north: 28.075 };
const ISTANBUL: BBox = { west: 28.45, south: 40.78, east: 29.65, north: 41.36 };

/** Synthetic metres for a tile: ridges, valleys and sea below 0. */
function metres(z: number, x: number, y: number): Float32Array {
  const out = new Float32Array(256 * 256);
  for (let py = 0; py < 256; py++) for (let px = 0; px < 256; px++) {
    const gx = (x * 256 + px) / 2 ** z / 256;
    const gy = (y * 256 + py) / 2 ** z / 256;
    out[py * 256 + px] = 3000 * Math.sin(gx * 9000) * Math.cos(gy * 7000) + 800 * Math.sin(gx * 31000 + gy * 17000) + 200;
  }
  return out;
}

/** The tile as Terrarium RGBA bytes: metres + 32768 = R * 256 + G + B / 256. */
function terrarium(z: number, x: number, y: number): Uint8ClampedArray {
  const m = metres(z, x, y);
  const data = new Uint8ClampedArray(m.length * 4);
  for (let i = 0; i < m.length; i++) {
    const v = m[i] + 32768;
    data[i * 4] = Math.floor(v / 256);
    data[i * 4 + 1] = Math.floor(v) % 256;
    data[i * 4 + 2] = Math.floor((v - Math.floor(v)) * 256);
    data[i * 4 + 3] = 255;
  }
  return data;
}

function hash(a: Float32Array): string {
  const u = new Uint32Array(a.buffer, a.byteOffset, a.length);
  let h = 2166136261;
  for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(16);
}

describe('fetchLocation pipeline', () => {
  // The hashes, sums and heights come from the playground's own pipeline (apps/playground/src/region/
  // pipeline.ts and worker.ts before the move) on the same synthetic tiles and boxes.
  it('gives the same grid as the playground for the same area', async () => {
    const everest = await buildLocation(EVEREST, async (z, x, y) => metres(z, x, y));
    expect(everest.size).toBe(256);
    expect([everest.zoom, everest.tiles]).toEqual([11, 12]);
    expect(hash(everest.samples)).toBe('b1f83819');
    expect(everest.aspect).toBe(1.5402735034016999);
    expect([everest.minMeters, everest.maxMeters]).toEqual([0, 3907.943359375]);

    const istanbul = await buildLocation(ISTANBUL, async (z, x, y) => metres(z, x, y));
    expect([istanbul.zoom, istanbul.tiles]).toEqual([10, 15]);
    expect(hash(istanbul.samples)).toBe('c0177fcc');
  });

  it('rejects an area outside the limits', async () => {
    const read = vi.fn();
    await expect(buildLocation({ west: 0, south: 0, east: 5, north: 3 }, read)).rejects.toThrow(/Too large/);
    await expect(buildLocation({ west: 1, south: 0, east: 0, north: 1 }, read)).rejects.toThrow(/does not cover/);
    expect(read).not.toHaveBeenCalled();
  });

  it('downloads each Terrarium tile once and decodes it with the browser', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(url);
      return new Response(new Blob([url]));
    }));
    vi.stubGlobal('createImageBitmap', vi.fn(async (blob: Blob) => ({ width: 256, height: 256, close() {}, url: await blob.text() })));
    vi.stubGlobal('OffscreenCanvas', class {
      getContext() {
        let drawn = '';
        return {
          drawImage(bmp: { url: string }) { drawn = bmp.url; },
          getImageData() {
            const [z, x, y] = drawn.match(/(\d+)\/(\d+)\/(\d+)\.png$/)!.slice(1).map(Number);
            const data = terrarium(z, x, y);
            return { data };
          },
        };
      }
    });
    const field = await fetchLocation(EVEREST, { tiles: 'https://tiles.example/{z}/{x}/{y}.png' });
    const range = tileRange(EVEREST);
    expect(urls.length).toBe(range.count);
    expect(new Set(urls).size).toBe(range.count);
    expect(urls).toContain(`https://tiles.example/11/${range.x0}/${range.y0}.png`);
    expect(field.tiles).toBe(range.count);
    // The same bytes read as metres in the pipeline give the same grid.
    const exact = await buildLocation(EVEREST, async (z, x, y) => {
      const d = terrarium(z, x, y);
      return Float32Array.from({ length: 256 * 256 }, (_, i) => terrariumMeters(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]));
    });
    expect(hash(field.samples)).toBe(hash(exact.samples));
  });

  it('reports a tile that does not download', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    await expect(fetchLocation(EVEREST)).rejects.toThrow(/returned 503/);
  });
});
