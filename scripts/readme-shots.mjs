// Takes the README screenshots and the 3D preview into assets/screenshots/.
//
//   npm run build:packages
//   CHROME="/path/to/chrome" node scripts/readme-shots.mjs [out-dir]
//
// The script starts its own Vite dev server on a free port, because the 3D dock and the
// place picker live in the dev-only prototype (?variant=P2). It stops the server at the end.
// Real places load elevation tiles and the picker loads its map from the internet, so the run
// needs network access. The animated preview needs ffmpeg and img2webp (from libwebp) on the
// PATH; without them, the script skips that file. Set ONLY=<name>,<name> to take only some of the files.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = resolve(process.argv[2] ?? join(root, 'assets/screenshots'));
const only = process.env.ONLY?.split(',');
const want = (name) => !only || only.includes(name);
await mkdir(out, { recursive: true });

const ISTANBUL = 'place=istanbul&region=28.94,40.99,29.07,41.08';
const q = (config) => `config=${encodeURIComponent(JSON.stringify(config))}`;
// The same seed and style for the 2D and 3D pair, so the two can be compared. The lines use
// the bright, centred look of scripts/styles-grid.mjs, so they read at README size.
const PAIR = {
  style: 'long-ridge', seed: 0,
  lines: { opacity: 0.85, width: 0.4 }, layout: { anchor: 1, fade: 0 }, theme: { mode: 'dark', ink: '#9fb0cc' },
};

const vite = await createServer({ root: join(root, 'apps/playground'), logLevel: 'warn', server: { port: 5287, host: '127.0.0.1' } });
await vite.listen();
const base = vite.resolvedUrls.local[0];
const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args });
const sizes = [];

async function page(scheme, init) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  if (init) await p.addInitScript(init);
  return p;
}
async function save(p, name) {
  await p.screenshot({ path: join(out, name) });
  sizes.push([name, (await stat(join(out, name))).size]);
}
// The prototype shows a live frame-time readout in 3D. A software-rendered headless browser
// makes it read a few fps, which says nothing about a real GPU, so the shots hide it.
const hideBench = (p) => p.addStyleTag({ content: '.pt-bench { display: none !important; }' });
async function waitForDock(p) {
  await p.waitForFunction(() => {
    const nav = document.querySelector('nav[data-looks]');
    return nav && nav.dataset.ready === nav.dataset.looks && Number(nav.dataset.looks) > 0;
  }, { timeout: 120000 });
}
async function waitForRegion(p) {
  await p.waitForFunction(() => ['ready', 'error'].includes(document.documentElement.dataset.region), { timeout: 60000 });
  const status = await p.evaluate(() => document.documentElement.dataset.region);
  if (status !== 'ready') throw new Error(`region ${status}: ${await p.locator('.pt-region').innerText()}`);
}

try {
  if (want('playground-dark.png')) {
    // The README hero: the public playground, dark mode, panel open. The settings are the ones
    // the earlier hero showed in its panel: drifting lobes, seed 0, the Survey map lines and terrain.
    const p = await page('dark');
    const hero = {
      style: 'drifting-lobes', lines: { count: 44, indexEvery: 5, opacity: 0.55 },
      terrain: { peaks: 3, spread: 0.6, roughness: 0.2 }, motion: { speed: 0.4, sparkle: 0 }, theme: { mode: 'dark' },
    };
    await p.goto(`${base}?${q(hero)}`);
    await p.waitForSelector('.stage canvas');
    await p.waitForTimeout(600);
    await save(p, 'playground-dark.png');
    await p.close();
  }

  for (const mode of ['2d', '3d']) {
    const name = `long-ridge-${mode}-dark.png`;
    if (!want(name)) continue;
    const p = await page('dark');
    await p.goto(`${base}?variant=P2&${q({ ...PAIR, mode })}`);
    await p.waitForSelector('canvas');
    await waitForDock(p);
    await hideBench(p);
    await p.waitForTimeout(600);
    await save(p, name);
    await p.close();
  }

  for (const scheme of ['dark', 'light']) {
    const name = `istanbul-3d-${scheme}.png`;
    if (!want(name)) continue;
    const p = await page(scheme);
    await p.goto(`${base}?variant=P2&${q({ style: 'gentle-summit', lines: { count: 28 }, theme: { mode: scheme } })}&${ISTANBUL}&mode=3d`, { waitUntil: 'domcontentloaded' });
    await waitForRegion(p);
    await waitForDock(p);
    await hideBench(p);
    await p.waitForTimeout(600);
    await save(p, name);
    await p.close();
  }

  if (want('place-picker-dark.png')) {
    const p = await page('dark');
    await p.goto(`${base}?variant=P2&${q({ style: 'gentle-summit', lines: { count: 28 }, theme: { mode: 'dark' } })}&${ISTANBUL}`, { waitUntil: 'domcontentloaded' });
    await waitForRegion(p);
    await p.click('[aria-label="Place"]');
    await p.waitForSelector('.maplibregl-canvas', { timeout: 20000 });
    await p.waitForTimeout(3200);
    const credit = await p.locator('.maplibregl-ctrl-attrib').innerText();
    if (!/openstreetmap/i.test(credit)) throw new Error(`the map did not load: ${credit}`);
    await save(p, 'place-picker-dark.png');
    await p.close();
  }

  if (want('long-ridge-3d-orbit.webp')) {
    const missing = ['ffmpeg', 'img2webp'].filter((tool) => {
      try { execFileSync(tool, ['-version'], { stdio: 'ignore' }); return false; } catch { return true; }
    });
    if (missing.length) console.log(`skip long-ridge-3d-orbit.webp: ${missing.join(' and ')} not on the PATH`);
    else {
      // record() renders each frame offline, so the clip is smooth even without a GPU.
      // The public playground exposes it through its record_video WebMCP tool.
      const p = await page('dark', () => {
        window.__tools = {};
        document.modelContext = { registerTool: async (tool) => { window.__tools[tool.name] = tool; } };
      });
      await p.goto(`${base}?${q({ ...PAIR, mode: '3d' })}`);
      await p.waitForSelector('.stage canvas');
      await p.waitForFunction(() => 'record_video' in window.__tools);
      const clip = await p.evaluate(() => window.__tools.record_video.execute({ format: 'mp4', motion: 'orbit', seconds: 6, width: 960, height: 540 }));
      await p.close();
      const dir = await mkdtemp(join(tmpdir(), 'topographic-shots-'));
      const mp4 = join(dir, 'orbit.mp4');
      await writeFile(mp4, Buffer.from(clip.dataUrl.split(',')[1], 'base64'));
      execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp4, '-vf', 'fps=15,scale=720:-2:flags=lanczos', join(dir, '%03d.png')]);
      const frames = (await readdir(dir)).filter((f) => f.endsWith('.png')).sort().map((f) => join(dir, f));
      // 15 fps is a 67 ms delay per frame.
      execFileSync('img2webp', ['-loop', '0', '-lossy', '-q', '65', '-d', '67', ...frames, '-o', join(out, 'long-ridge-3d-orbit.webp')], { stdio: 'ignore' });
      await rm(dir, { recursive: true });
      sizes.push(['long-ridge-3d-orbit.webp', (await stat(join(out, 'long-ridge-3d-orbit.webp'))).size]);
    }
  }
} finally {
  await browser.close();
  await vite.close();
}
for (const [name, size] of sizes) console.log(`${name} ${(size / 1024).toFixed(0)} KB`);
const big = sizes.filter(([name, size]) => name.endsWith('.webp') && size > 2 * 1024 * 1024);
if (big.length) { console.log(`over 2 MB: ${big.map(([n]) => n).join(', ')}`); process.exit(1); }
