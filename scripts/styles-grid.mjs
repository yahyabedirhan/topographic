import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

export const SHOWCASE = { lines: { opacity: 0.85, width: 0.4 }, layout: { anchor: 1, fade: 0 }, theme: { mode: 'dark', ink: '#9fb0cc' } };

export const TILES = [
  { preset: 'Drifting lobes' }, { preset: 'Granite' }, { preset: 'Five petals' }, { preset: 'Seed pod' },
  { preset: 'Gentle summit' }, { preset: 'Long ridge' }, { preset: 'Dunes' }, { preset: 'Survey map' },
  { preset: 'Terraces' }, { preset: 'Rocky' },
  { name: 'Twin peaks', settings: { landform: 'drifting-lobes', seed: 7, terrain: { peaks: 2, spread: 1 } } },
  { name: 'Fine lines', settings: { landform: 'drifting-lobes', seed: 21, lines: { count: 48 } } },
  { name: 'Scree', settings: { landform: 'granite', seed: 3, terrain: { roughness: 0.6 } } },
  { name: 'Bloom', settings: { landform: 'five-petals', seed: 12, lines: { count: 42 }, terrain: { variant: 0.9 } } },
  { name: 'Wide dunes', settings: { landform: 'dunes', seed: 5, lines: { count: 16, width: 0.4 } } },
  { name: 'Plateau', settings: { landform: 'seed-pod', seed: 9, terrain: { terracing: 0.6 } } },
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
  await page.evaluate(async ({ tiles, show }) => {
    const resolved = tiles.map((t) => {
      if (!t.preset) return { ...t, note: `${t.settings.landform} · seed ${t.settings.seed}` };
      const p = window.lib.PRESETS.find((x) => x.name === t.preset);
      if (!p) throw new Error(`unknown preset ${t.preset}`);
      return { name: p.name, settings: p.settings };
    }).map((t) => ({ ...t, settings: { ...t.settings, ...Object.fromEntries(Object.entries(show).map(([k, v]) => [k, { ...t.settings[k], ...v }])) } }));
    await window.renderGrid(resolved, { w: 930, h: 600 });
  }, { tiles: TILES, show: SHOWCASE });
  await page.locator('#grid').screenshot({ path: out });
  console.log(`wrote ${out}`);
} finally { await browser.close(); server.close(); }
