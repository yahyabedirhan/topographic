// Takes the README images into assets/screenshots/: the 3D hero still, the playground and its
// Map popover, and the gallery tiles of looks, 3D looks and the ten real places.
//
//   npm run build:packages
//   CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/readme-shots.mjs [out-dir]
//
// The script starts its own Vite dev server for the playground, or uses a running one when BASE
// is set (BASE=http://localhost:5199/). Chrome draws on the GPU; set SOFTWARE_GL=1 on a machine
// without one. Real places load elevation tiles and the Map popover loads its map from the
// internet, so the run needs network access. It needs cwebp (from libwebp)
// on the PATH. Set ONLY=<name>,<name> to take only some of the files, and HERO=<query> to try
// the hero on another view.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = resolve(process.argv[2] ?? join(root, 'assets/screenshots'));
const only = process.env.ONLY?.split(',');
const want = (name) => !only || only.includes(name);
await mkdir(out, { recursive: true });

const missing = ['cwebp'].filter((tool) => {
  try { execFileSync(tool, ['-version'], { stdio: 'ignore' }); return false; } catch { return true; }
});
if (missing.length) throw new Error(`${missing.join(', ')} not on the PATH`);

// The built-in Istanbul map terrain, first in the dock (ISTANBUL_SETTINGS in region/map-looks.ts).
const ISTANBUL = 's=gentle-summit&seed=67&lc=36&lw=0&lo=0.9&ix=4&fd=0.15&m=dark&mode=3d&ex=block&ev=0.12&az=341.6&ce=45.3&rd=1.15&px=-0.005&pz=-0.013&place=istanbul';
// The Istanbul look without its place and camera: set_region gives each place its own view.
const PLACE_BASE = 's=gentle-summit&seed=67&lc=36&lw=0&lo=0.9&ix=4&fd=0.15&m=dark';
const PLACES = ['istanbul', 'cyprus', 'matterhorn', 'geirangerfjord', 'grand-canyon', 'yosemite', 'torres-del-paine', 'fuji', 'everest', 'kilimanjaro'];
// Looks from the dock (LOOKS in looks.ts), by slug. The 3D tiles show looks in 3D.
const LOOKS_2D = ['survey-ridge', 'rose-pod', 'sea-dunes', 'stepped-petals', 'stone-grain', 'centred-lobes'];
const LOOKS_3D = ['night-flower', 'terraces', 'rocky-spine'];
// The hero is one large still of a look in 3D, drawn without the playground's controls.
const HERO = process.env.HERO ?? 'look=fine-granite&mode=3d';

let vite;
let base = process.env.BASE;
if (!base) {
  vite = await createServer({ root: join(root, 'apps/playground'), logLevel: 'warn', server: { port: 5287, host: '127.0.0.1' } });
  await vite.listen();
  base = vite.resolvedUrls.local[0];
}
const args = process.env.SOFTWARE_GL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args })
  .catch(async (e) => { await vite?.close(); throw e; });
const work = await mkdtemp(join(tmpdir(), 'topographic-shots-'));
const sizes = [];

// Each page catches the playground's WebMCP tools in window.__tools, the way an agent sees them.
async function page() {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  await p.addInitScript(() => {
    window.__tools = {};
    document.modelContext = { registerTool: async (tool) => { window.__tools[tool.name] = tool; } };
  });
  return p;
}
const tool = (p, name, input = {}) => p.evaluate(([n, i]) => window.__tools[n].execute(i), [name, input]);
async function open(p, query) {
  await p.goto(`${base}?${query}`, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => {
    const nav = document.querySelector('nav[data-looks]');
    return nav && nav.dataset.ready === nav.dataset.looks && 'take_screenshot' in window.__tools && 'set_region' in window.__tools;
  }, null, { timeout: 120000 });
  // The live frame-time readout says nothing about the picture, so the shots hide it.
  await p.addStyleTag({ content: '.pt-fps { display: none !important; }' });
}
async function waitForPlace(p, place) {
  await p.waitForFunction(async (id) => {
    const r = await window.__tools.get_region.execute({});
    if (r.status === 'error') throw new Error(r.error);
    return r.place === id && r.status === 'ready';
  }, place, { timeout: 90000, polling: 500 });
  await p.waitForTimeout(4000);
}
async function setPlace(p, place) {
  await tool(p, 'set_region', { place });
  await waitForPlace(p, place);
}
// PNG in, WebP out at `width` pixels wide.
async function webp(png, name, width, quality = 82) {
  const file = join(out, name);
  execFileSync('cwebp', ['-quiet', '-q', String(quality), '-resize', String(width), '0', png, '-o', file]);
  sizes.push([name, (await stat(file)).size]);
}
async function screenshot(p, name) {
  const png = join(work, `${name}.png`);
  await p.screenshot({ path: png });
  await webp(png, name, 1440);
}
// A gallery tile: the background alone, drawn off-screen by take_screenshot at twice the tile size.
async function tile(p, name) {
  const shot = await tool(p, 'take_screenshot', { width: 1280, height: 800 });
  const png = join(work, `${name}.png`);
  await writeFile(png, Buffer.from(shot.dataUrl.split(',')[1], 'base64'));
  await webp(png, name, 640, 80);
}

try {
  if (want('hero.webp')) {
    const p = await page();
    await open(p, HERO);
    const shot = await tool(p, 'take_screenshot', { width: 2400 });
    await p.close();
    const png = join(work, 'hero.png');
    await writeFile(png, Buffer.from(shot.dataUrl.split(',')[1], 'base64'));
    await webp(png, 'hero.webp', 2400, 92);
  }

  if (want('playground-dark.webp') || want('map-popover-dark.webp')) {
    const p = await page();
    await open(p, ISTANBUL);
    await waitForPlace(p, 'istanbul');
    if (want('playground-dark.webp')) await screenshot(p, 'playground-dark.webp');
    if (want('map-popover-dark.webp')) {
      await p.click('[aria-label="Map"]');
      await p.waitForSelector('.maplibregl-canvas', { timeout: 20000 });
      // The basemap tiles stream in after the canvas appears.
      await p.waitForTimeout(4000);
      await screenshot(p, 'map-popover-dark.webp');
    }
    await p.close();
  }

  for (const [slugs, mode] of [[LOOKS_2D, '2d'], [LOOKS_3D, '3d']]) {
    for (const slug of slugs) {
      const name = `look-${slug}-${mode}.webp`;
      if (!want(name)) continue;
      const p = await page();
      await open(p, `look=${slug}${mode === '3d' ? '&mode=3d' : ''}`);
      await p.waitForTimeout(600);
      await tile(p, name);
      await p.close();
    }
  }

  for (const place of PLACES) {
    const name = `place-${place}.webp`;
    if (!want(name)) continue;
    const p = await page();
    await open(p, PLACE_BASE);
    await setPlace(p, place);
    await tile(p, name);
    await p.close();
  }
} finally {
  await browser.close();
  await vite?.close();
  await rm(work, { recursive: true });
}
for (const [name, size] of sizes) console.log(`${name} ${(size / 1024).toFixed(0)} KB`);
const big = sizes.filter(([, size]) => size > 3 * 1024 * 1024);
if (big.length) { console.log(`over 3 MB: ${big.map(([n]) => n).join(', ')}`); process.exit(1); }
