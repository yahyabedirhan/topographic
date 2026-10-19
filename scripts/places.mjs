// Generates the playground's place catalog grids in apps/playground/public/places/<id>.png.
// It reads apps/playground/src/region/catalog.json, runs the library's own pipeline on each place
// that is not built into the library, with fetchLocation()'s settings (dramatic relief, medium
// smoothing, 256 × 256), and writes each place's lowest and highest point and zoom back into the
// catalog. Run it when a place is added or its box changes:
//   node scripts/places.mjs [id ...]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { encodeGrid16 } from './png16.mjs';
import { checkRoundTrip, loadPipeline, tileReader } from './terrarium.mjs';

const catalogFile = new URL('../apps/playground/src/region/catalog.json', import.meta.url);
const out = new URL('../apps/playground/public/places/', import.meta.url);
const lib = await loadPipeline();
const readTile = tileReader(lib);
const rows = JSON.parse(readFileSync(catalogFile, 'utf8'));

const only = process.argv.slice(2);
mkdirSync(out, { recursive: true });
let total = 0;
for (const row of rows) {
  if (row.builtIn || (only.length && !only.includes(row.id))) continue;
  const problem = lib.limitProblem(row.bbox);
  if (problem) throw new Error(`${row.id}: ${JSON.stringify(problem)}`);
  const field = await lib.buildLocation(row.bbox, readTile);
  const png = encodeGrid16(field.samples, field.size);
  await checkRoundTrip(lib, row.id, field, png);
  writeFileSync(new URL(`${row.id}.png`, out), png);
  row.minMeters = Math.round(field.minMeters * 10) / 10;
  row.maxMeters = Math.round(field.maxMeters * 10) / 10;
  row.zoom = field.zoom;
  total += png.length;
  console.log(`${row.id}: zoom ${field.zoom}, ${field.tiles} tiles, ${Math.round(field.minMeters)}–${Math.round(field.maxMeters)} m, ${(png.length / 1024).toFixed(1)} KB PNG`);
}
// One place a line keeps the file small and its diffs readable.
writeFileSync(catalogFile, `[\n${rows.map((row) => `  ${JSON.stringify(row)}`).join(',\n')}\n]\n`);
console.log(`${(total / 1024 / 1024).toFixed(2)} MB of grids`);
