import { describe, expect, it, vi } from 'vitest';
import { areaSpan as spanOf, type BBox } from 'topographic/locations';
// @ts-expect-error The script is plain JavaScript without declarations.
import { encodeGrid16 } from '../../../../scripts/png16.mjs';
import { build, type BuildRequest, type BuildSources } from './build';

const BOX: BBox = { west: -73.326, south: -49.448, east: -72.874, north: -49.152 };
const GRID = { url: 'https://example.test/places/fitz-roy.png', minMeters: 300, maxMeters: 3400, zoom: 11 };
const request = (over: Partial<BuildRequest> = {}): BuildRequest => ({ id: 1, bbox: BOX, placeId: 'fitz-roy', relief: 'dramatic', smooth: 'medium', grid: GRID, ...over });

function sources(fetch: BuildSources['fetch']) {
  const tiles = { samples: new Float32Array(4), size: 2, aspect: 1.5, minMeters: 10, maxMeters: 20, zoom: 9, tiles: 6 };
  return {
    fetch: vi.fn(fetch),
    fetchLocation: vi.fn(async () => tiles),
    loadLocation: vi.fn(async () => { throw new Error('not a built-in place'); }),
  } satisfies BuildSources;
}

describe('catalog place grids', () => {
  it('reads a catalog place from its grid file, with the catalog\'s heights', async () => {
    const size = 8;
    const png = encodeGrid16(new Float32Array(size * size).fill(0.5), size) as Uint8Array;
    const s = sources(async () => new Response(png as BlobPart));
    const out = await build(request(), s);
    expect(s.fetch).toHaveBeenCalledWith(GRID.url);
    expect(s.fetchLocation).not.toHaveBeenCalled();
    expect(out).toMatchObject({ size, minM: 300, maxM: 3400, zoom: 11, tiles: 0, builtIn: true, aspect: spanOf(BOX).aspect });
  });

  it('falls back to the elevation tiles when the grid file fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const fail of [async () => new Response('Not found', { status: 404 }), async () => { throw new TypeError('offline'); }, async () => new Response('not a png')]) {
      const s = sources(fail);
      const out = await build(request(), s);
      expect(s.fetchLocation).toHaveBeenCalledWith(BOX, { relief: 'dramatic', smooth: 'medium' });
      expect(out).toMatchObject({ tiles: 6, builtIn: false, minM: 10 });
    }
  });

  it('reads the tiles for other relief or smoothing, where the file does not apply', async () => {
    const s = sources(async () => { throw new Error('unused'); });
    await build(request({ relief: 'measured' }), s);
    expect(s.fetch).not.toHaveBeenCalled();
    expect(s.fetchLocation).toHaveBeenCalledOnce();
  });
});
