// Draws personal-website's background (scripts/blend-reference/, copied from that repo) beside the
// library's scenes blend, frame by frame on one shared clock, and compares the pixels.
// Run after `npm run build:packages`. Set SHOTS=<dir> to save each compared pair as PNGs.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const server = createServer(async (req, res) => {
  const path = req.url.split('?')[0];
  try {
    const body = await readFile(join(root, decodeURIComponent(path)));
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/scripts/blend-check.html`;
const shots = process.env.SHOTS;
if (shots) await mkdir(shots, { recursive: true });

// The machine's GPU, as a visitor's browser draws it; without one, Chrome falls back to software GL.
// SWIFTSHADER=1 forces the smoke test's software GL. It is exact too, but takes minutes for each size.
const args = process.env.SWIFTSHADER ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [];
const browser = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : { channel: 'chrome' }), args });
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed++; };

/** The most an 8-bit channel may differ: one step of rounding. */
const ROUNDING = 1;

const configs = [
  { name: 'desktop', context: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } },
  { name: 'desktop-2x', context: { viewport: { width: 1000, height: 700 }, deviceScaleFactor: 2 } },
  { name: 'phone', context: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, query: 'dark=1' },
  { name: 'webgl1', context: { viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 }, query: 'gl1=1' },
  { name: 'reduced-motion', context: { viewport: { width: 800, height: 600 }, deviceScaleFactor: 1, reducedMotion: 'reduce' } },
];

// Frame indices on a 60 Hz clock, from 1000 ms. Every compared frame is even, so the 30 fps cap draws on it too.
// Frame 150 comes 120 ms late, like a slow frame on a phone: both must cap that step at 50 ms.
const SLOW_FRAME = 150;
const SLOW_MS = 120;
const steps = [
  { frame: 90, label: 'at rest' },
  { frame: 91, act: 'setScene(2)' },
  { frame: 106, label: 'mid scene fade' },
  { frame: 200, label: 'scene 2 at rest' },
  { frame: 201, act: 'setDark(!dark, false)' },
  { frame: 210, label: 'mid dark fade' },
  { frame: 300, act: 'setScene(5); setDark(dark, false)' },
  { frame: 316, label: 'mid scene and dark fade' },
  { frame: 420, label: 'scene 5 at rest' },
];
const results = [];
try {
  for (const config of configs) {
    const ctx = await browser.newContext(config.context);
    const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') console.log('  console:', m.text()); });
    p.on('pageerror', (e) => console.log('  pageerror:', String(e)));
    await p.goto(`${url}?${config.query ?? ''}`);
    await p.waitForFunction(() => window.ready);
    // Let the observers settle before the clock starts.
    await p.waitForTimeout(200);
    const reduced = config.name === 'reduced-motion';
    const started = Date.now();
    let i = 0;
    for (const step of steps) {
      // Under reduced motion both stop drawing once at rest, so only frames that draw are compared.
      const compareHere = step.label && !(reduced && /rest/.test(step.label));
      const out = await p.evaluate(({ from, to, act, compareHere, images, slow }) => {
        for (let f = from; f <= to; f++) {
          if (f === to && act) new Function('dark', act)(new URLSearchParams(location.search).get('dark') === '1');
          window.frame(1000 + (f * 1000) / 60 + (f >= slow.frame ? slow.ms : 0));
        }
        return { result: compareHere ? window.compare(images) : null, pending: window.pending() };
      }, { from: i, to: step.frame, act: step.act, compareHere, images: Boolean(shots), slow: { frame: SLOW_FRAME, ms: SLOW_MS } });
      i = step.frame + 1;
      if (reduced && step.label === 'at rest') check(out.pending === 0, `${config.name}: both stop drawing at rest (${out.pending} frames queued)`);
      if (!compareHere) continue;
      const r = out.result;
      if (!r.max && r.max !== 0) { check(false, `${config.name} ${step.label}: sizes differ ${r.size}`); continue; }
      results.push({ config: config.name, step: step.label, ...r });
      check(r.max <= ROUNDING && r.range > 1,
        `${config.name} ${step.label}: ${r.size.join('x')} ${r.status}, max ${r.max}, mean ${r.mean.toFixed(5)}, ${r.over1} px over 1, contrast ${r.range}, weights ${r.blend.weights.map((w) => w.toFixed(3)).join(' ')} dark ${r.blend.dark.toFixed(3)}`);
      if (shots && r.images) {
        const base = `${config.name}-${step.label.replace(/\s+/g, '-')}`;
        await writeFile(join(shots, `${base}-reference.png`), Buffer.from(r.images[0].split(',')[1], 'base64'));
        await writeFile(join(shots, `${base}-library.png`), Buffer.from(r.images[1].split(',')[1], 'base64'));
      }
    }
    if (reduced) {
      const end = await p.evaluate(() => window.pending());
      check(end === 0, `${config.name}: both stop drawing after the last fade (${end} frames queued)`);
    }
    console.log(`     ${config.name} took ${((Date.now() - started) / 1000).toFixed(1)} s`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}
const max = Math.max(...results.map((r) => r.max));
const mean = results.reduce((a, r) => a + r.mean, 0) / Math.max(1, results.length);
console.log(`compared ${results.length} frames: max channel difference ${max}, mean ${mean.toFixed(5)}`);
if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
console.log('all blend checks passed');
