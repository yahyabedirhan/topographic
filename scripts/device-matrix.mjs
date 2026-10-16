// Emulated low-end device matrix for the playground.
// CPU throttle, slow networks, a capped WebGL texture size, and forced context loss.
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const outDir = join(root, 'docs/mobile-testing');
const base = process.env.PLAYGROUND || 'http://127.0.0.1:5173/';
const STRESS_MS = Number(process.env.STRESS_MS || 60000);

const devices = [
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, dpr: 2 },
  { id: 'iphone-14-pro', label: 'iPhone 14 Pro', width: 393, height: 852, dpr: 3 },
  { id: 'moto-g4', label: 'Moto G4', width: 360, height: 640, dpr: 3 },
];

const nets = {
  slow4g: { offline: false, latency: 150, downloadThroughput: 180000, uploadThroughput: 84375 },
  slow3g: { offline: false, latency: 400, downloadThroughput: 50000, uploadThroughput: 50000 },
};

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  args: [
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist', '--enable-precise-memory-info',
  ],
});

function percentile(values, p) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1));
  return Math.round(s[i] * 10) / 10;
}

async function applyNet(page, name) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', nets[name]);
  return client;
}

async function applyCpu(page, rate) {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate });
  return client;
}

const initScript = () => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    const gl = orig.call(this, type, attrs);
    if (!gl || !String(type).startsWith('webgl')) return gl;
    if (!this.dataset.watched) {
      this.dataset.watched = '1';
      this.addEventListener('webglcontextlost', () => { window.__lost = (window.__lost || 0) + 1; });
      this.addEventListener('webglcontextrestored', () => { window.__restored = (window.__restored || 0) + 1; });
    }
    const param = gl.getParameter.bind(gl);
    gl.getParameter = (p) => {
      if (p === gl.MAX_TEXTURE_SIZE || p === gl.MAX_RENDERBUFFER_SIZE) return Math.min(2048, param(p));
      if (p === gl.MAX_VIEWPORT_DIMS) return new Int32Array([2048, 2048]);
      return param(p);
    };
    return gl;
  };
  window.__frames = [];
  window.__long = [];
  let last = 0;
  const loop = (t) => {
    if (last) window.__frames.push(t - last);
    last = t;
    if (window.__frames.length > 4000) window.__frames.splice(0, window.__frames.length - 2000);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__long.push(e.duration);
    }).observe({ type: 'longtask', buffered: true });
  } catch { /* longtask not supported */ }
};

async function newPage(device, { cpu = 1, net = null } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.dpr,
    hasTouch: true,
    acceptDownloads: true,
  });
  await ctx.addInitScript(initScript);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 240)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 240)); });
  if (cpu > 1) await applyCpu(page, cpu);
  if (net) await applyNet(page, net);
  page.__errors = errors;
  page.__ctx = ctx;
  return page;
}

async function goto(page, path) {
  await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('.pt-dock', { timeout: 20000 });
}

async function shot(page, name) {
  await page.screenshot({ path: join(outDir, name) });
  console.log('shot', name);
}

async function boxOf(page) {
  const box = await page.locator('.pt-stage').boundingBox();
  return box;
}

async function drag(page, dx, dy) {
  const box = await boxOf(page);
  if (!box) return;
  const x = box.x + box.width * 0.55;
  const y = box.y + Math.max(80, box.height * 0.38);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

async function clickNamed(page, name) {
  const btn = page.getByRole('button', { name, exact: true });
  if (await btn.count()) await btn.first().click({ timeout: 4000 });
}

function sampleScript() {
  const c = document.querySelector('.pt-stage canvas');
  const canvases = [...document.querySelectorAll('canvas')];
  const pixels = canvases.reduce((n, el) => n + el.width * el.height, 0);
  return {
    tier: document.documentElement.dataset.tier || '',
    fpsText: document.querySelector('.pt-fps')?.textContent || '',
    gl: c?.dataset.gl || '',
    w: c?.width || 0,
    h: c?.height || 0,
    css: c ? [c.clientWidth, c.clientHeight] : [0, 0],
    heap: performance.memory?.usedJSHeapSize || 0,
    canvasBytes: pixels * 4 + (c ? c.width * c.height * 2 : 0),
    recover: Boolean(document.querySelector('.pt-recover')),
    region: document.documentElement.dataset.region || '',
    mode: document.querySelector('.pt-stage')?.className || '',
    lost: window.__lost || 0,
    restored: window.__restored || 0,
  };
}

async function stress(device, cpu) {
  const page = await newPage(device);
  const started = Date.now();
  let crashed = false;
  let notes = [];
  try {
    await goto(page, '?mode=3d');
    await applyCpu(page, cpu);
    await applyNet(page, 'slow4g');
    await page.waitForTimeout(400);
    const end = started + STRESS_MS;
    let phase = 0;
    let lostOnce = false;
    while (Date.now() < end) {
      const left = end - Date.now();
      if (page.isClosed()) { crashed = true; notes.push('page closed'); break; }
      phase = Math.floor((STRESS_MS - left) / (STRESS_MS / 6));
      try {
        if (phase === 0) {
          await drag(page, 70, 24);
          await clickNamed(page, 'Shuffle');
          const thumb = page.locator('.pt-thumb').nth(3);
          if (await thumb.count()) await thumb.click({ timeout: 3000 });
        } else if (phase === 1) {
          await clickNamed(page, 'Switch to 2D');
          await page.waitForTimeout(200);
          await drag(page, -120, 0);
          await clickNamed(page, 'Switch to 3D');
        } else if (phase === 2) {
          await clickNamed(page, 'Map');
          await page.waitForTimeout(1200);
          await page.keyboard.press('Escape');
        } else if (phase === 3) {
          await clickNamed(page, 'Export');
          await page.getByRole('tab', { name: 'PNG' }).click({ timeout: 3000 }).catch(() => page.getByRole('button', { name: 'PNG' }).click());
          const dl = page.getByRole('button', { name: /Download/ });
          if (await dl.count()) {
            const download = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);
            await dl.first().click();
            const got = await download;
            notes.push(got ? 'png downloaded' : 'png timed out');
          }
          await page.keyboard.press('Escape');
        } else if (phase === 4 && !lostOnce) {
          lostOnce = true;
          await page.evaluate(() => {
            const c = document.querySelector('.pt-stage canvas');
            const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
            gl?.getExtension('WEBGL_lose_context')?.loseContext();
          });
          await page.waitForTimeout(1500);
          await page.setViewportSize({ width: device.height, height: device.width });
          await drag(page, 40, 16);
          await page.setViewportSize({ width: device.width, height: device.height });
        } else {
          await clickNamed(page, 'Export');
          await page.getByRole('button', { name: 'Video' }).click({ timeout: 3000 }).catch(() => {});
          const dl = page.getByRole('button', { name: /MP4|Download/ });
          if (await dl.count()) {
            const done = page.waitForFunction(() => !document.body.innerText.includes('Rendering'), { timeout: 18000 }).catch(() => null);
            await dl.first().click().catch(() => {});
            await done;
            notes.push('video attempted');
          }
          await page.keyboard.press('Escape').catch(() => {});
          await drag(page, -50, 20);
        }
      } catch (err) {
        notes.push(String(err.message || err).slice(0, 180));
        if (page.isClosed()) { crashed = true; break; }
      }
    }
    const snap = page.isClosed() ? null : await page.evaluate(sampleScript).catch(() => null);
    const frames = page.isClosed() ? [] : await page.evaluate(() => window.__frames || []).catch(() => []);
    const longs = page.isClosed() ? [] : await page.evaluate(() => window.__long || []).catch(() => []);
    const frameMs = frames.filter((n) => n > 0 && n < 5000);
    return {
      device: device.id, cpu, seconds: Math.round((Date.now() - started) / 100) / 10,
      crashed, notes: [...new Set(notes)].slice(0, 12),
      errors: [...new Set(page.__errors)].slice(0, 8),
      end: snap,
      frameP50: percentile(frameMs, 0.5),
      frameP95: percentile(frameMs, 0.95),
      frames: frameMs.length,
      longCount: longs.length,
      longP50: percentile(longs, 0.5),
      longP95: percentile(longs, 0.95),
      heap: snap?.heap || 0,
      canvasBytes: snap?.canvasBytes || 0,
      tier: snap?.tier || '',
      gl: snap?.gl || '',
      lost: snap?.lost || 0,
      restored: snap?.restored || 0,
      recoverVisible: Boolean(snap?.recover),
    };
  } finally {
    await page.__ctx.close().catch(() => {});
  }
}

await mkdir(outDir, { recursive: true });
const shots = [];

async function captureShots() {
  for (const device of devices) {
    const page = await newPage(device);
    await goto(page, '');
    await page.waitForTimeout(700);
    await shot(page, `default-${device.id}.png`);
    shots.push(`default-${device.id}.png`);
    await page.__ctx.close();
  }

  for (const id of ['a', 'b']) {
    const device = devices[1];
    const page = await newPage(device);
    await goto(page, `?dock=${id}`);
    await page.waitForTimeout(500);
    await shot(page, `dock-${id}-${device.id}.png`);
    shots.push(`dock-${id}-${device.id}.png`);
    const se = devices[0];
    await page.setViewportSize({ width: se.width, height: se.height });
    await page.waitForTimeout(300);
    await shot(page, `dock-${id}-iphone-se.png`);
    shots.push(`dock-${id}-iphone-se.png`);
    await page.__ctx.close();
  }

  for (const id of ['a', 'b']) {
    const page = await newPage(devices[1]);
    await goto(page, `?link=${id}`);
    await page.getByRole('button', { name: 'Export' }).click();
    const preview = id === 'a' ? '.pt-link-shot img' : '.pt-link-card img';
    await page.waitForSelector(preview, { timeout: 12000 }).catch(() => {});
    await shot(page, `link-${id}-iphone-14-pro.png`);
    shots.push(`link-${id}-iphone-14-pro.png`);
    await page.__ctx.close();
  }

  for (const id of ['a', 'b']) {
    const page = await newPage(devices[1]);
    await page.route('**://s3.amazonaws.com/**', async (route) => {
      await new Promise((r) => setTimeout(r, 4000));
      await route.continue();
    });
    await goto(page, `?place=istanbul&loading=${id}`);
    await applyNet(page, 'slow3g');
    await page.waitForSelector('.pt-loading', { timeout: 15000 });
    await page.waitForTimeout(500);
    await shot(page, `loading-${id}-slow3g-iphone-14-pro.png`);
    shots.push(`loading-${id}-slow3g-iphone-14-pro.png`);
    await page.__ctx.close();
  }

  for (const device of devices) {
    const page = await newPage(device);
    await goto(page, '?mode=3d');
    await applyCpu(page, 4);
    await page.waitForTimeout(2500);
    await shot(page, `tier-${device.id}.png`);
    shots.push(`tier-${device.id}.png`);
    const tier = await page.evaluate(() => document.documentElement.dataset.tier || '');
    console.log('settled', device.id, tier, await page.locator('.pt-fps').textContent().catch(() => ''));
    await page.__ctx.close();
  }

  {
    const page = await newPage(devices[1]);
    await goto(page, '?mode=2d');
    await page.waitForSelector('.pt-stage.is-2d');
    await drag(page, -140, 0);
    await page.waitForTimeout(400);
    await shot(page, 'anchor-2d-iphone-14-pro.png');
    shots.push('anchor-2d-iphone-14-pro.png');
    console.log('2d url', page.url());
    await page.__ctx.close();
  }

  {
    const page = await newPage(devices[1]);
    await goto(page, '');
    await applyNet(page, 'slow4g');
    await page.getByRole('button', { name: 'Map' }).click();
    await page.waitForSelector('.pt-pop-map', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await shot(page, 'map-iphone-14-pro.png');
    shots.push('map-iphone-14-pro.png');
    await page.__ctx.close();
  }

  {
    const page = await newPage(devices[1]);
    await goto(page, '?mode=3d');
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const c = document.querySelector('.pt-stage canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      gl.getExtension('WEBGL_lose_context').loseContext();
    });
    await page.waitForSelector('.pt-recover', { timeout: 2000 }).catch(() => {});
    await shot(page, 'recovery-iphone-14-pro.png');
    shots.push('recovery-iphone-14-pro.png');
    await page.waitForFunction(() => document.querySelector('.pt-stage canvas')?.dataset.gl?.startsWith('webgl'), { timeout: 4000 }).catch(() => {});
    console.log('after recovery', await page.evaluate(() => document.querySelector('.pt-stage canvas')?.dataset.gl));
    await page.__ctx.close();
  }

  for (const device of [devices[0], devices[1]]) {
    const page = await newPage(device);
    await goto(page, '?mode=3d');
    await page.setViewportSize({ width: device.height, height: device.width });
    await page.waitForTimeout(500);
    await shot(page, `landscape-${device.id}.png`);
    shots.push(`landscape-${device.id}.png`);
    await page.__ctx.close();
  }
}

const results = [];
try {
  try { await captureShots(); } catch (err) { console.error('shots failed', err); }
  for (const device of devices) {
    for (const cpu of [4, 6]) {
      console.log('stress', device.id, cpu);
      const row = await stress(device, cpu);
      results.push(row);
      console.log(JSON.stringify(row));
      await writeFile(join(outDir, 'results.json'), JSON.stringify({ shots, results }, null, 2));
    }
  }
} finally {
  await writeFile(join(outDir, 'results.json'), JSON.stringify({ shots, results, stressMs: STRESS_MS }, null, 2));
  await browser.close();
}
console.log('done', results.length, 'runs');
