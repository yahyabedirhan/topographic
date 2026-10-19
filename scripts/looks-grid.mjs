// Draws every built-in look (LOOKS in packages/core/src/looks.ts) in its own colours, with its
// name and id, for docs/guide.md > 'Looks'. Each tile is the 2D frame at 4 seconds.
//
//   npm run build:packages
//   CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/looks-grid.mjs [out.webp]
//
// It needs cwebp (from libwebp) on the PATH.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

const out = process.argv[2] ?? 'assets/screenshots/looks.webp';
const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0]);
  try { const body = await readFile(join(root, path)); res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args });
const work = await mkdtemp(join(tmpdir(), 'topographic-looks-'));
try {
  // The page is dark, so the two looks without colours draw in dark mode.
  const page = await browser.newPage({ viewport: { width: 1920, height: 1300 }, deviceScaleFactor: 1, colorScheme: 'dark' });
  await page.goto(`http://127.0.0.1:${server.address().port}/scripts/styles-grid.html`);
  await page.waitForFunction(() => window.ready);
  await page.evaluate(async () => {
    const tiles = window.lib.LOOKS.map((l) => ({ name: l.name, note: l.id, settings: { look: l.id } }));
    await window.renderGrid(tiles, { w: 930, h: 600 });
  });
  const png = join(work, 'looks.png');
  await page.locator('#grid').screenshot({ path: png });
  execFileSync('cwebp', ['-quiet', '-q', '86', '-resize', '1400', '0', png, '-o', out]);
  console.log(`wrote ${out}`);
} finally { await browser.close(); server.close(); await rm(work, { recursive: true, force: true }); }
