// Times one 3D frame at the pixel counts and mesh sizes the quality ladder uses.
// SwiftShader is not an iPhone, so the script records ratios. The frame budgets
// in packages/core/src/quality.ts are the 60 Hz and 120 Hz periods; the ladder
// steps are the cuts that moved a frame across those periods on this run.
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

const cases = [
  { name: 'phone-dpr-1', w: 393, h: 852, detail: 0.5 },
  { name: 'phone-dpr-1.25', w: 491, h: 1065, detail: 0.25 },
  { name: 'phone-dpr-1.25-mesh64', w: 491, h: 1065, detail: 0.25 },
  { name: 'phone-dpr-1.5-mesh96', w: 590, h: 1278, detail: 0.5 },
  { name: 'phone-dpr-1.75-mesh96', w: 688, h: 1491, detail: 0.5 },
  { name: 'phone-dpr-2-mesh96', w: 786, h: 1704, detail: 0.5 },
  { name: 'phone-dpr-2-mesh160', w: 786, h: 1704, detail: 1 },
  { name: 'phone-dpr-2-mesh64', w: 786, h: 1704, detail: 0.25 },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

try {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/scripts/smoke.html`);
  await page.waitForFunction(() => window.ready);
  const rows = await page.evaluate(async (cases) => {
    const host = document.getElementById('host');
    const out = [];
    for (const c of cases) {
      host.style.width = `${c.w}px`;
      host.style.height = `${c.h}px`;
      window.t?.destroy();
      const t = window.topographicLib.createTopographicBackground(host, {
        style: 'granite', mode: '3d', detail: c.detail, theme: { mode: 'dark' },
        lines: { count: 54 }, motion: { speed: 0 }, camera: { motion: 'still' },
      }, { benchmark: true, maxPixelRatio: 1, maxPixels: c.w * c.h });
      window.t = t;
      const samples = await new Promise((resolve) => {
        const gaps = [];
        let last = 0;
        const step = (now) => {
          if (last) gaps.push(now - last);
          last = now;
          if (gaps.length < 8) requestAnimationFrame(step);
          else resolve(gaps);
        };
        requestAnimationFrame(step);
      });
      samples.sort((a, b) => a - b);
      out.push({ name: c.name, mesh: t.stats.mesh, canvas: [t.canvas.width, t.canvas.height], ms: Number(samples[1].toFixed(1)) });
    }
    return out;
  }, cases);
  console.log('idle');
  console.log(rows.map((r) => `${r.name}\t${r.canvas.join('x')}\tmesh ${r.mesh}\t${r.ms} ms`).join('\n'));
  const hammer = await page.evaluate(async () => {
    const host = document.getElementById('host');
    host.style.width = '393px';
    host.style.height = '852px';
    const caps = [1, 1.25, 1.5, 2];
    const out = [];
    for (const cap of caps) {
      window.t?.destroy();
      const t = window.topographicLib.createTopographicBackground(host, {
        style: 'granite', mode: '3d', detail: cap >= 2 ? 1 : 0.5, theme: { mode: 'dark' }, lines: { count: 54 },
      }, { benchmark: true, maxPixelRatio: cap, maxPixels: 1920 * 1080 * 2 });
      window.t = t;
      const t0 = performance.now();
      let n = 0;
      while (performance.now() - t0 < 1500) {
        t.update({ camera: { azimuth: (n * 7) % 360, elevation: 24 } });
        n++;
        await new Promise((r) => requestAnimationFrame(r));
      }
      out.push({ cap, n, fps: t.stats.fps, frameMs: t.stats.frameMs, canvas: [t.canvas.width, t.canvas.height], mesh: t.stats.mesh });
    }
    return out;
  });
  console.log('drag');
  console.log(hammer.map((r) => `dpr ${r.cap}\t${r.canvas.join('x')}\tmesh ${r.mesh}\t${r.n} updates\t${r.fps} fps\t${r.frameMs} ms`).join('\n'));
} finally {
  await browser.close();
  server.close();
}
