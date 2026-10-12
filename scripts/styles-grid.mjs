// Renders the README "Styles and presets" image: a 4x4 grid in dark mode, one frame at t = 4 s.
// Line opacity is raised to 0.9 on every tile so the lines read at README size (the default is 0.4).
// Every tile is a style, a preset or a style plus seed, so each one can be reproduced in the generator.
// Usage: npm run build:packages && node scripts/styles-grid.mjs [out.png]
// Needs a Chrome/Chromium binary (CHROME=/path, default /usr/bin/google-chrome).
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

// Presets are looked up by name in the page; extra tiles list their settings in full.
export const TILES = [
  { preset: 'Drifting lobes' }, { preset: 'Granite' }, { preset: 'Five petals' }, { preset: 'Seed pod' },
  { preset: 'Gentle summit' }, { preset: 'Long ridge' }, { preset: 'Dunes' }, { preset: 'Survey map' },
  { preset: 'Terraces' }, { preset: 'Rocky' },
  { name: 'Twin peaks', settings: { style: 'gentle-summit', seed: 7, terrain: { peaks: 2, spread: 0.7 } } },
  { name: 'Fine lines', settings: { style: 'drifting-lobes', seed: 21, lines: { count: 56, opacity: 0.5 } } },
  { name: 'Scree', settings: { style: 'granite', seed: 3, terrain: { roughness: 0.6 } } },
  { name: 'Bloom', settings: { style: 'five-petals', seed: 12, lines: { count: 42 }, terrain: { variant: 0.9 } } },
  { name: 'Wide dunes', settings: { style: 'dunes', seed: 5, lines: { count: 16, width: 0.4 } } },
  { name: 'Plateau', settings: { style: 'seed-pod', seed: 9, terrain: { terracing: 0.6 } } },
];

const out = process.argv[2] ?? 'assets/screenshots/styles.png';
const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  try { const body = await readFile(join(root, path)); res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1300 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/scripts/styles-grid.html`);
  await page.waitForFunction(() => window.ready);
  await page.evaluate(async (tiles) => {
    const resolved = tiles.map((t) => {
      if (!t.preset) return { ...t, note: `${t.settings.style} · seed ${t.settings.seed}` };
      const p = window.lib.PRESETS.find((x) => x.name === t.preset);
      if (!p) throw new Error(`unknown preset ${t.preset}`);
      return { name: p.name, settings: p.settings };
    }).map((t) => ({ ...t, settings: { ...t.settings, lines: { ...t.settings.lines, opacity: 0.9 } } }));
    await window.renderGrid(resolved, { w: 930, h: 600 });
  }, TILES);
  await page.locator('#grid').screenshot({ path: out });
  console.log(`wrote ${out}`);
} finally { await browser.close(); server.close(); }
