import { describe, expect, it } from 'vitest';
// @ts-expect-error The script is plain JavaScript without declarations.
import { encodeGrid16 } from '../../../../scripts/png16.mjs';
import { decodeGrid16, fromBase64, unfilter } from './png.js';

const encode = encodeGrid16 as (samples: Float32Array, size: number) => Uint8Array;

describe('16-bit location grids', () => {
  it('round-trips heights to 1/65535, with row 0 at the south edge', async () => {
    const size = 64;
    const samples = new Float32Array(size * size);
    // Smooth slopes, a noisy band and flat ground, so the encoder uses several row filters.
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      samples[y * size + x] = y < 20 ? y / size : y < 40 ? ((x * 7919 + y * 104729) % 1000) / 1000 : 0.25;
    }
    const grid = await decodeGrid16(encode(samples, size));
    expect(grid.size).toBe(size);
    let worst = 0;
    for (let i = 0; i < samples.length; i++) worst = Math.max(worst, Math.abs(grid.samples[i] - samples[i]));
    expect(worst).toBeLessThanOrEqual(0.5 / 65535 + 1e-9);
    expect(grid.samples[0]).toBe(0);
    expect(grid.samples[size * 50]).toBeCloseTo(0.25, 4);
  });

  it('keeps 16 bits, which a canvas would round to 8', async () => {
    const samples = Float32Array.from([0, 1 / 65535, 2 / 65535, 1]);
    const grid = await decodeGrid16(encode(samples, 2));
    expect(Array.from(grid.samples, (v) => Math.round(v * 65535))).toEqual([0, 1, 2, 65535]);
  });

  it('undoes every PNG row filter', () => {
    // One pixel of one byte per row; filters 0 to 4 on rows 0 to 4.
    const raw = Uint8Array.from([0, 10, 1, 5, 2, 5, 3, 5, 4, 5]);
    expect(Array.from(unfilter(raw, 1, 5, 1))).toEqual([10, 5, 10, 10, 15]);
  });

  it('rejects files that are not 16-bit greyscale PNGs', async () => {
    await expect(decodeGrid16(Uint8Array.from([1, 2, 3]))).rejects.toThrow(/not a PNG/);
    const png = encode(new Float32Array(4), 2);
    png[24] = 8; // IHDR bit depth
    await expect(decodeGrid16(png)).rejects.toThrow(/16-bit/);
  });

  it('decodes base64', () => {
    expect(Array.from(fromBase64('AAEC/w=='))).toEqual([0, 1, 2, 255]);
  });
});
