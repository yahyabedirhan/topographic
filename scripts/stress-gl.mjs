// Mobile-sized stress pass for the topographic renderer.
// Emulates an iPhone 14 Pro viewport (393×852 at devicePixelRatio 3) and
// hammers camera updates the way a drag does, then drops the WebGL context.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const server = createServer(async (req, res) => {
  try {
    const body = await readFile(join(root, decodeURIComponent(req.url.split('?')[0])));
    res.writeHead(200, { 'content-type': types[extname(req.url.split('?')[0])] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0);

const url = `http://127.0.0.1:${server.address().port}/scripts/smoke.html`;
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info'],
});

try {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForFunction(() => window.ready);
  const report = await page.evaluate(async () => {
    const host = document.getElementById('host');
    const t = window.topographicLib.createTopographicBackground(host, {
      style: 'granite', mode: '3d', theme: { mode: 'dark' }, lines: { count: 54 },
    }, { benchmark: true, maxPixelRatio: 2, maxPixels: 1920 * 1080 * 2 });
    const heap = () => performance.memory?.usedJSHeapSize ?? 0;
    const before = heap();
    const t0 = performance.now();
    let updates = 0;
    while (performance.now() - t0 < 2500) {
      t.update({ camera: { azimuth: (updates * 3) % 360, elevation: 20 + (updates % 40), motion: 'still' } });
      updates++;
      await new Promise((r) => requestAnimationFrame(r));
    }
    const mid = { updates, fps: t.stats.fps, frameMs: t.stats.frameMs, mesh: t.stats.mesh, canvas: [t.canvas.width, t.canvas.height], heap: heap() - before, status: t.status };
    const gl = t.canvas.getContext('webgl2');
    gl.getExtension('WEBGL_lose_context').loseContext();
    await new Promise((r) => setTimeout(r, 80));
    const during = t.status;
    await new Promise((r) => setTimeout(r, 900));
    const after = { status: t.status, canvas: [t.canvas.width, t.canvas.height], dataset: t.canvas.dataset.gl };
    t.destroy();
    return { mid, during, after };
  });
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  server.close();
}
