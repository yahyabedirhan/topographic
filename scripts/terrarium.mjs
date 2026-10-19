// What scripts/locations.mjs and scripts/places.mjs share: the library's own pipeline, bundled for
// Node, and a Terrarium tile reader that retries, so both make grids with fetchLocation()'s settings.
import { build } from 'esbuild';
import { decodePng } from './png16.mjs';

const root = new URL('../packages/core/src/locations/', import.meta.url);

/** The library modules are TypeScript, so bundle them for these scripts. */
export async function loadPipeline() {
  const bundled = await build({
    stdin: {
      contents: `export { LOCATIONS } from './builtin.ts'; export { buildLocation } from './fetch.ts'; export { TERRARIUM, terrariumMeters, limitProblem } from './pipeline.ts'; export { decodeGrid16 } from './png.ts';`,
      resolveDir: root.pathname, loader: 'ts',
    },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'warning',
    // builtin.ts imports the data files lazily; they may not exist yet and are not needed here.
    plugins: [{ name: 'skip-data', setup(b) { b.onResolve({ filter: /\/data\// }, (a) => ({ path: a.path, external: true })); } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
}

/** A tile reader for buildLocation(). `chunkTypes` collects the PNG chunk types the tiles hold. */
export function tileReader(lib, chunkTypes = new Set()) {
  return async function readTile(z, x, y) {
    const url = lib.TERRARIUM.replace('{z}', z).replace('{x}', x).replace('{y}', y);
    for (let attempt = 1; ; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url} returned ${res.status}`);
        const png = decodePng(new Uint8Array(await res.arrayBuffer()));
        for (const t of png.chunks) chunkTypes.add(t);
        const m = new Float32Array(png.width * png.height);
        for (let i = 0; i < m.length; i++) m[i] = lib.terrariumMeters(png.rgba[i * 4], png.rgba[i * 4 + 1], png.rgba[i * 4 + 2]);
        return m;
      } catch (error) {
        if (attempt >= 4) throw error;
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  };
}

/** Checks that a grid survives the 16-bit PNG round trip through the library's own decoder. */
export async function checkRoundTrip(lib, id, field, png) {
  const back = await lib.decodeGrid16(new Uint8Array(png));
  let worst = 0;
  for (let i = 0; i < field.samples.length; i++) worst = Math.max(worst, Math.abs(back.samples[i] - Math.min(1, Math.max(0, field.samples[i]))));
  if (back.size !== field.size || worst > 1 / 65535) throw new Error(`${id}: the grid does not round-trip (${worst})`);
}
