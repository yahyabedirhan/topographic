// A public playground build must not contain the debug heartbeat.
// The npm packages must never contain analytics or error reporting, and a playground build
// without VITE_POSTHOG_KEY or VITE_SENTRY_DSN must not contain those clients either.
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const dist = new URL('../apps/playground/dist/', import.meta.url).pathname;
const markers = ['pt-debug', '__debug', 'peakContexts', 'installDebug'];
const vendors = { posthog: ['posthog', 'i.posthog.com'], sentry: ['@sentry', 'sentry.io', 'captureException'] };
const packageDists = ['packages/core/dist/', 'packages/react/dist/'].map((d) => new URL(`../${d}`, import.meta.url).pathname);

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

// Packages: no analytics or error reporting, ever.
const leaks = [];
for (const dir of packageDists) {
  for (const path of await files(dir).catch(() => [])) {
    const text = await readFile(path, 'utf8').catch(() => '');
    for (const [name, words] of Object.entries(vendors)) if (words.some((w) => text.includes(w))) leaks.push(`${path}: ${name}`);
  }
}
// Playground: a client is only allowed when its key was set at build time.
const allowed = { posthog: Boolean(process.env.VITE_POSTHOG_KEY), sentry: Boolean(process.env.VITE_SENTRY_DSN) };
const sizes = [];
for (const path of await files(dist)) {
  if (!path.endsWith('.js')) continue;
  const text = await readFile(path, 'utf8');
  sizes.push(`${path.split('/').pop()} ${(text.length / 1024).toFixed(1)} kB`);
  for (const [name, words] of Object.entries(vendors)) {
    if (!words.some((w) => text.includes(w))) continue;
    if (!allowed[name]) leaks.push(`${path}: ${name} without its build key`);
    else if (/^index-.*\.js$/.test(path.split('/').pop() ?? '') && text.includes(name === 'posthog' ? 'i.posthog.com/static' : 'sentry.io/api')) leaks.push(`${path}: ${name} client in the main bundle`);
  }
}
if (leaks.length) {
  console.error('analytics or error reporting where it must not be:');
  for (const line of leaks) console.error(line);
  process.exit(1);
}
console.log(`packages have no analytics; playground clients: posthog ${allowed.posthog ? 'lazy' : 'off'}, sentry ${allowed.sentry ? 'lazy' : 'off'}`);
if (process.env.BUNDLE_SIZES) for (const line of sizes.sort()) console.log(line);
