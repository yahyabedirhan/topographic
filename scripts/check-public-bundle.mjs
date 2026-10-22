// Checks the public playground build, after `astro build`:
// - It must not contain the debug heartbeat.
// - The npm packages must never contain analytics or error reporting.
// - A build without VITE_POSTHOG_KEY or VITE_SENTRY_DSN must not contain those clients, and a build with them must
//   load each one lazily, in a chunk no page loads up front.
// - /about and /docs must be whole HTML, so they read with JavaScript off.
// It prints the JavaScript each page loads up front and in all.
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';

const dist = new URL('../apps/playground/dist/', import.meta.url).pathname;
const markers = ['pt-debug', '__debug', 'peakContexts', 'installDebug'];
// Each vendor's words must appear only in that vendor's own code.
// posthog-js has a Sentry integration with `captureException` and a `sentry.io` link,
// so the Sentry words are the SDK's package names and its global carrier object.
const vendors = { posthog: ['posthog', 'i.posthog.com'], sentry: ['@sentry/', '__SENTRY__'] };
const packageDists = ['packages/core/dist/', 'packages/react/dist/'].map((d) => new URL(`../${d}`, import.meta.url).pathname);
// Words each page's HTML must hold without running any script.
const pages = {
  // The inline script that sends an unknown path home is resolveRoute's own source, so it must survive the build as is.
  'index.html': ['<title>topographic: topographic terrain, rendered with WebGL</title>', 'client="only"', '(function resolveRoute(', "if(r.page==='redirect')history.replaceState(history.state,'',r.to)"],
  'about.html': ['<h1>About</h1>', 'What is collected', 'Latest updates', 'class="pt-optout"'],
  'docs.html': ['Topographic terrain, rendered live with WebGL.', 'id="h-install"', 'og-docs.png'],
};
const needed = ['index.html', 'about.html', 'docs.html', 'llms.txt', 'llms-full.txt', 'docs/install.md', 'docs/api.md', 'docs/params.md',
  'docs/webmcp.md', 'robots.txt', 'sitemap.xml', '_headers', 'og.png', 'og-docs.png'];

async function files(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const path = join(dir, name);
    if ((await stat(path)).isDirectory()) out.push(...await files(path));
    else out.push(path);
  }
  return out;
}

const problems = [];
const all = await files(dist);
for (const need of needed) if (!all.includes(join(dist, need))) problems.push(`dist has no ${need}`);

// The debug heartbeat, anywhere in the build.
for (const path of all) {
  if (path.endsWith('.map') || /\.(png|webp|jpg)$/.test(path)) continue;
  const body = await readFile(path, 'utf8').catch(() => '');
  const hit = markers.filter((m) => body.includes(m));
  if (hit.length) problems.push(`${relative(dist, path)}: debug markers ${hit.join(', ')}`);
}

const scripts = all.filter((p) => /\.m?js$/.test(p));
const text = Object.fromEntries(await Promise.all(scripts.map(async (p) => [p, await readFile(p, 'utf8')])));

/** Every script reachable from `entries` through the imports `pattern` finds. */
function reach(entries, pattern) {
  const seen = new Set();
  const visit = (p) => {
    if (seen.has(p) || !text[p]) return;
    seen.add(p);
    for (const m of text[p].matchAll(pattern)) visit(join(dirname(p), m[1]));
  };
  entries.forEach(visit);
  return seen;
}

// Static imports load up front; any quoted relative script, dynamic imports included, may load later.
const STATIC = /(?:\bfrom|\bimport)\s*["'`](\.{1,2}\/[^"'`]+\.m?js)["'`]/g;
const ANY = /["'`](\.{1,2}\/[^"'`]+\.m?js)["'`]/g;

/** The scripts a page runs on load (`<script>` tags and their inline imports), and the ones its islands hydrate with. */
function pageEntries(html) {
  const abs = (refs) => [...new Set(refs)].map((r) => join(dist, r));
  const islands = [...html.matchAll(/(?:component-url|renderer-url|before-hydration-url)="(\/[^"]+\.js)"/g)].map((m) => m[1]);
  const tags = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => [
    ...[...m[0].matchAll(/^<script\b[^>]*\bsrc="(\/[^"]+\.js)"/g)].map((x) => x[1]),
    ...[...m[1].matchAll(/["'`](\/_astro\/[^"'`]+\.js)["'`]/g)].map((x) => x[1]),
  ]);
  return { scripts: abs(tags), islands: abs(islands) };
}

const eager = new Set();
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const size = async (set) => (await Promise.all([...set].map(async (p) => (await stat(p)).size))).reduce((a, b) => a + b, 0);
for (const [page, words] of Object.entries(pages)) {
  const path = join(dist, page);
  if (!all.includes(path)) continue;
  const html = await readFile(path, 'utf8');
  for (const w of words) if (!html.includes(w)) problems.push(`${page} has no "${w}" in its HTML`);
  if (page === 'index.html' && /__name\(|__defProp/.test(html.match(/<script>\(function\(\)\{var r=[\s\S]*?<\/script>/)?.[0] ?? '')) problems.push('index.html: the home script calls a bundler helper');
  const { scripts: run, islands } = pageEntries(html);
  const onLoad = reach(run, STATIC);
  const hydrate = new Set([...reach(islands, STATIC)].filter((p) => !onLoad.has(p)));
  const later = new Set([...reach([...run, ...islands], ANY)].filter((p) => !onLoad.has(p) && !hydrate.has(p)));
  [...onLoad, ...hydrate].forEach((p) => eager.add(p));
  console.log(`${page}: JavaScript ${kb(await size(onLoad))} on load, ${kb(await size(hydrate))} more for its islands, ${kb(await size(later))} more on demand`);
}

// Packages: no analytics or error reporting, ever.
for (const dir of packageDists) {
  for (const path of await files(dir).catch(() => [])) {
    const body = await readFile(path, 'utf8').catch(() => '');
    for (const [name, words] of Object.entries(vendors)) if (words.some((w) => body.includes(w))) problems.push(`${path}: ${name}`);
  }
}

// Playground: a client is only allowed when its key was set at build time, and never in a chunk a page loads up front.
const allowed = { posthog: Boolean(process.env.VITE_POSTHOG_KEY), sentry: Boolean(process.env.VITE_SENTRY_DSN) };
for (const path of scripts) {
  for (const [name, words] of Object.entries(vendors)) {
    if (!words.some((w) => text[path].includes(w))) continue;
    if (!allowed[name]) problems.push(`${relative(dist, path)}: ${name} without its build key`);
    else if (eager.has(path) && text[path].includes(name === 'posthog' ? 'i.posthog.com/static' : 'sentry.io/api')) problems.push(`${relative(dist, path)}: ${name} client loaded up front`);
  }
}

if (problems.length) {
  console.error('the public build is not as it must be:');
  for (const line of problems) console.error(`  ${line}`);
  process.exit(1);
}
console.log('public build has no debug heartbeat');
console.log(`packages have no analytics; playground clients: posthog ${allowed.posthog ? 'lazy' : 'off'}, sentry ${allowed.sentry ? 'lazy' : 'off'}`);
if (process.env.BUNDLE_SIZES) for (const path of scripts.sort()) console.log(`${relative(dist, path)} ${kb(text[path].length)}`);
