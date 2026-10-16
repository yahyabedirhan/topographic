// A public playground build must not contain the debug heartbeat.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const dist = new URL('../apps/playground/dist/', import.meta.url).pathname;
const markers = ['pt-debug', '__debug', 'peakContexts', 'installDebug'];

async function files(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const path = join(dir, name);
    const info = await stat(path);
    if (info.isDirectory()) out.push(...await files(path));
    else out.push(path);
  }
  return out;
}

const found = [];
let main = null;
for (const path of await files(dist)) {
  if (path.endsWith('.map')) continue;
  const text = await readFile(path, 'utf8').catch(() => '');
  const hit = markers.filter((m) => text.includes(m));
  if (hit.length) found.push(`${path}: ${hit.join(', ')}`);
  const base = path.split('/').pop() ?? '';
  if (/^index-.*\.js$/.test(base)) main = { path: base, bytes: (await stat(path)).size };
}

if (!main) {
  console.error('no playground index bundle in dist');
  process.exit(1);
}
console.log(`public bundle ${main.path} ${main.bytes} bytes`);
if (found.length) {
  console.error('debug markers in the public build:');
  for (const line of found) console.error(line);
  process.exit(1);
}
console.log('public build has no debug heartbeat');
