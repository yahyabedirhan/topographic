import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const served = [];
const server = createServer(async (req, res) => {
  served.push(req.url.split('?')[0]);
  try {
    const body = await readFile(join(root, decodeURIComponent(req.url.split('?')[0])));
    res.writeHead(200, { 'content-type': types[extname(req.url.split('?')[0])] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/scripts/smoke.html`;
const shots = process.env.SHOTS;
if (shots) await mkdir(shots, { recursive: true });

const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args });
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed++; };

async function page(extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, ...extra });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') console.log('  console:', m.text()); });
  await p.goto(url);
  await p.waitForFunction(() => window.ready);
  return p;
}

const coverage = (p, shape, opts = {}) => p.evaluate(async ({ shape, opts }) => {
  const host = document.getElementById('host');
  window.t?.destroy();
  window.t = window.topographicLib.createTopography(host, { shape, theme: { mode: 'light' }, ...opts.settings }, opts.renderer);
  const blob = await window.t.snapshot({ frame: 4000 });
  const bmp = await createImageBitmap(blob);
  const c = new OffscreenCanvas(bmp.width, bmp.height); const g = c.getContext('2d'); g.drawImage(bmp, 0, 0);
  const d = g.getImageData(0, 0, bmp.width, bmp.height).data; const [r0, g0, b0] = [d[0], d[1], d[2]];
  let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 249) + Math.abs(d[i + 1] - 248) + Math.abs(d[i + 2] - 246) > 12) n++;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return { status: window.t.status, coverage: n / (d.length / 4), w: bmp.width, h: bmp.height, png: Array.from(bytes) };
}, { shape, opts });

try {
  const shapes = ['drifting-lobes', 'granite', 'five-petals', 'seed-pod', 'gentle-summit', 'long-ridge', 'dunes'];
  const p = await page();
  for (const s of shapes) {
    const r = await coverage(p, s);
    check(r.status === 'webgl2' && r.coverage > 0.02, `${s}: ${r.status}, ${(r.coverage * 100).toFixed(1)}% line pixels`);
    if (shots) await writeFile(join(shots, `${s}.png`), Buffer.from(r.png));
  }
  for (const [name, settings] of [['dark', { theme: { mode: 'dark' } }], ['survey', { shape: 'gentle-summit', lines: { count: 44, indexEvery: 5, opacity: .55 }, terrain: { peaks: 3, spread: .6, roughness: .2 } }], ['seed-7', { seed: 7, shape: 'dunes' }]]) {
    const r = await coverage(p, settings.shape ?? 'drifting-lobes', { settings });
    if (shots) await writeFile(join(shots, `extra-${name}.png`), Buffer.from(r.png));
  }

  const sizes = await p.evaluate(async () => {
    const before = [window.t.canvas.width, window.t.canvas.height];
    const b = await createImageBitmap(await window.t.snapshot({ width: 640 }));
    return { before, after: [window.t.canvas.width, window.t.canvas.height], snap: [b.width, b.height] };
  });
  check(sizes.before.join() === sizes.after.join() && sizes.snap.join() === '640,400', `snapshot 640 wide -> ${sizes.snap}, live canvas stays ${sizes.after}`);

  const upd = await p.evaluate(() => { window.t.update({ lines: { count: 999 }, shape: 'volcano' }); return [window.t.settings.lines.count, window.t.settings.shape]; });
  check(upd[0] === 60 && upd[1] === 'drifting-lobes', `update clamps and falls back: ${upd}`);

  const a = await coverage(p, 'dunes', { settings: { seed: 1 } }); const b = await coverage(p, 'dunes', { settings: { seed: 2 } });
  check(Buffer.compare(Buffer.from(a.png), Buffer.from(b.png)) !== 0, 'different seeds give different images');

  // Sparkle on a heightfield: the dots must not line up from one contour to the next into stripes.
  // A ramp draws parallel contours; the mean line brightness along each diagonal of the frame stays flat
  // unless the dots on neighbouring lines share a phase.
  const stripes = await p.evaluate(async () => {
    const n = 64; const samples = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) samples[y * n + x] = 0.02 + 0.96 * x / (n - 1);
    window.t?.destroy();
    window.t = window.topographicLib.createTopography(document.getElementById('host'), {
      mode: '2d', theme: { mode: 'dark' }, lines: { count: 60, width: 0, opacity: 1, indexEvery: 0 },
      motion: { sparkle: 1 }, layout: { fade: 0 },
    });
    window.t.setHeightfield({ samples, size: n, aspect: 1 });
    const bmp = await createImageBitmap(await window.t.snapshot({ frame: 2000 }));
    const W = bmp.width, H = bmp.height;
    const c = new OffscreenCanvas(W, H); const g = c.getContext('2d'); g.drawImage(bmp, 0, 0);
    const d = g.getImageData(0, 0, W, H).data; const paper = d[1];
    const score = (sign) => {
      const sum = new Float64Array(W + H), cnt = new Float64Array(W + H);
      for (let y = H >> 2; y < (3 * H) >> 2; y++) for (let x = W >> 2; x < (3 * W) >> 2; x++) {
        const v = d[(y * W + x) * 4 + 1] - paper; if (v < 12) continue;
        const k = sign > 0 ? x + y : x - y + H; sum[k] += v; cnt[k]++;
      }
      const prof = []; for (let k = 0; k < W + H; k++) if (cnt[k] > 20) prof.push(sum[k] / cnt[k]);
      const mean = prof.reduce((a, b) => a + b, 0) / prof.length;
      return Math.sqrt(prof.reduce((a, b) => a + (b - mean) ** 2, 0) / prof.length) / mean;
    };
    return Math.max(score(1), score(-1));
  });
  check(stripes < 0.08, `heightfield sparkle makes no diagonal stripes: ${(stripes * 100).toFixed(1)}% brightness swing along the diagonals`);

  const w1 = await coverage(p, 'granite', { renderer: { forceWebGL1: true } });
  check(w1.status === 'webgl1' && w1.coverage > 0.02, `webgl1 fallback renders: ${w1.status}`);

  const lost = await p.evaluate(async () => {
    const ext = window.t.canvas.getContext('webgl')?.getExtension('WEBGL_lose_context') ?? null;
    const t = window.t; const gl = t.canvas.getContext(t.status === 'webgl1' ? 'webgl' : 'webgl2');
    const e = gl.getExtension('WEBGL_lose_context'); e.loseContext();
    await new Promise((r) => setTimeout(r, 100)); const during = t.status; const bg = getComputedStyle(t.canvas).backgroundColor;
    e.restoreContext(); await new Promise((r) => setTimeout(r, 300));
    return { during, bg, after: t.status };
  });
  check(lost.during === 'lost' && lost.after.startsWith('webgl'), `context lost -> ${lost.during} (bg ${lost.bg}) -> ${lost.after}`);

  const rm = await page({ reducedMotion: 'reduce' });
  const still = await rm.evaluate(async () => {
    const t = window.topographicLib.createTopography(document.getElementById('host'), {});
    let frames = 0; const orig = window.requestAnimationFrame; window.requestAnimationFrame = (f) => { frames++; return orig(f); };
    await new Promise((r) => setTimeout(r, 300)); return { frames, status: t.status };
  });
  check(still.frames === 0 && still.status === 'webgl2', `reduced motion renders a still frame (${still.frames} rAF calls)`);

  const ep = await browser.newPage({ viewport: { width: 900, height: 560 } });
  await ep.goto(url.replace('smoke.html', 'element.html'));
  await ep.waitForFunction(() => window.ready);
  const el = await ep.evaluate(() => {
    const e = document.querySelector('topographic-view'); const t = e.topographic;
    const a = [t.status, t.settings.shape, t.settings.lines.count, t.settings.seed, t.settings.layout.fade].join();
    e.setAttribute('line-count', '12'); e.setAttribute('shape', 'granite');
    const b = [t.settings.shape, t.settings.lines.count, t.settings.layout.fade].join();
    e.removeAttribute('line-count'); const c = t.settings.lines.count;
    e.remove(); return { a, b, c, d: t.status };
  });
  check(el.a === 'webgl2,dunes,24,3,0.5' && el.b === 'granite,12,0.7' && el.c === 30 && el.d === 'destroyed',
    `<topographic-view> attributes: ${el.a} | ${el.b} | reset ${el.c} | removed ${el.d}`);

  // Real locations: `location: 'everest'` loads only Everest's grid and draws it in 2D and 3D.
  const loc = await page();
  served.length = 0;
  const everest2d = await coverage(loc, 'drifting-lobes', { settings: { location: 'everest' } });
  const everestView = await loc.evaluate(() => [window.t.settings.location, window.t.settings.camera.elevation, window.t.settings.elevation, window.t.settings.extent].join());
  const everest3d = await coverage(loc, 'drifting-lobes', { settings: { location: 'everest', mode: '3d' } });
  const generated3d = await coverage(loc, 'drifting-lobes', { settings: { mode: '3d', extent: 'block', elevation: 0.1, camera: { azimuth: 341.8, elevation: 40, radius: 1.32 } } });
  const grids = served.filter((u) => u.includes('/locations/data/'));
  check(everest2d.coverage > 0.02 && everest3d.coverage > 0.02 && everestView === 'everest,40,0.32,block',
    `location everest draws in 2D (${(everest2d.coverage * 100).toFixed(1)}%) and 3D (${(everest3d.coverage * 100).toFixed(1)}%) with its view (${everestView})`);
  check(Buffer.compare(Buffer.from(everest3d.png), Buffer.from(generated3d.png)) !== 0, 'the Everest grid differs from the generated terrain under the same camera');
  check(grids.length === 1 && grids[0].endsWith('/everest.js'), `only Everest's grid is downloaded (${grids.join(', ')})`);
  if (shots) {
    await writeFile(join(shots, 'location-everest-2d.png'), Buffer.from(everest2d.png));
    await writeFile(join(shots, 'location-everest-3d.png'), Buffer.from(everest3d.png));
  }
  const lp = await browser.newPage({ viewport: { width: 900, height: 560 } });
  await lp.goto(url.replace('smoke.html', 'element.html'));
  await lp.waitForFunction(() => window.ready);
  const elLoc = await lp.evaluate(async () => {
    const e = document.querySelector('topographic-view');
    e.setAttribute('location', 'fuji'); e.setAttribute('mode', '3d');
    const t = e.topographic;
    const b = await e.snapshot({ width: 300 });
    const a = [t.settings.location, t.settings.mode, t.settings.camera.elevation].join();
    e.removeAttribute('location');
    return { a, bytes: b.size, after: t.settings.location };
  });
  check(elLoc.a === 'fuji,3d,30' && elLoc.bytes > 1000 && elLoc.after === null, `<topographic-view location="fuji">: ${elLoc.a}, ${elLoc.bytes} bytes, removed -> ${elLoc.after}`);

  const nogl = await page();
  const fb = await nogl.evaluate(() => {
    HTMLCanvasElement.prototype.getContext = ((orig) => function (type, ...rest) { return type.startsWith('webgl') ? null : orig.call(this, type, ...rest); })(HTMLCanvasElement.prototype.getContext);
    const t = window.topographicLib.createTopography(document.getElementById('host'), { theme: { mode: 'dark' } });
    return { status: t.status, bg: getComputedStyle(t.canvas).backgroundColor };
  });
  check(fb.status === 'fallback' && fb.bg.includes('11, 11, 13'), `no webgl -> ${fb.status}, paper ${fb.bg}`);
} finally {
  await browser.close();
  server.close();
}
if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
console.log('all smoke checks passed');
