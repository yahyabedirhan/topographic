// Renders the two share-card stills. GitHub Pages cannot draw a card per link, so
// these are static 1200×630 images. og=a and og=b pick which file the tags use
// only after the owner chooses; both files stay in the site until then.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const server = createServer(async (req, res) => {
  try {
    const body = await readFile(join(root, decodeURIComponent(req.url.split('?')[0])));
    res.writeHead(200, { 'content-type': types[extname(req.url.split('?')[0])] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0);

const cards = {
  a: {
    style: 'granite', seed: 191, mode: '3d', elevation: 0.72, quality: 'high',
    theme: { mode: 'dark', paper: '#0b0b0d', ink: '#d7d2c8' },
    lines: { count: 54, width: 0.1, opacity: 0.7 },
    layout: { anchor: 1, fade: 0.05 },
    camera: { azimuth: 79.7, elevation: 30, radius: 1.92, motion: 'still' },
  },
  b: {
    style: 'dunes', seed: 23, mode: '3d', elevation: 0.55, quality: 'high',
    theme: { mode: 'light', paper: '#efe6d6', ink: '#6b4630' },
    lines: { count: 34, width: 0.16, opacity: 0.85 },
    layout: { anchor: 0.2, fade: 0.1 },
    camera: { azimuth: 14.7, elevation: 28, radius: 1.7, motion: 'still' },
  },
};

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/scripts/smoke.html`);
  await page.waitForFunction(() => window.ready);
  for (const [id, settings] of Object.entries(cards)) {
    const bytes = await page.evaluate(async (settings) => {
      const host = document.getElementById('host');
      window.t?.destroy();
      window.t = window.topographicLib.createTopographicBackground(host, settings, { maxPixelRatio: 1, maxPixels: 1200 * 630 });
      const blob = await window.t.snapshot({ width: 1200, height: 630, frame: 2400 });
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    }, settings);
    const path = join(root, `apps/playground/public/og-${id}.png`);
    await writeFile(path, Buffer.from(bytes));
    console.log(`wrote ${path} (${bytes.length} bytes)`);
  }
} finally {
  await browser.close();
  server.close();
}
