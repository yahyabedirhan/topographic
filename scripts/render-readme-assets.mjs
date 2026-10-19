// Renders every image of the READMEs, the npm pages and the social cards with the library itself,
// into apps/playground/public/readme/ (served at https://topographic.yahyapak.dev/readme/), plus the
// playground's og.png and og-docs.png and the GitHub social preview in assets/social/.
//
//   npm run build:packages
//   CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/render-readme-assets.mjs
//
// Real places load through the playground's own region worker, the same pipeline as Apply in the Map
// popover, so the run needs network access for the elevation tiles and the card fonts. Primary images
// are animated WebP loops (the camera swings to each side and back at a fixed terrain time, so they loop without a jump), each
// kept under 3 MB; secondary images are stills. It needs img2webp and cwebp (from libwebp) on the PATH.
// Set ONLY=<name>,<name> to render only some files. Chrome draws on the GPU; set SOFTWARE_GL=1 on a
// machine without one.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const readme = join(root, 'apps/playground/public/readme');
const pub = join(root, 'apps/playground/public');
const social = join(root, 'assets/social');
const only = process.env.ONLY?.split(',');
const want = (name) => !only || only.includes(name);
await mkdir(readme, { recursive: true });
await mkdir(social, { recursive: true });

for (const tool of ['img2webp', 'cwebp']) {
  try { execFileSync(tool, ['-version'], { stdio: 'ignore' }); } catch { throw new Error(`${tool} not on the PATH`); }
}

// ---------------------------------------------------------------- what to draw

/** Dark paper and a bright, cool ink: the look of every README picture unless a step changes it. */
const DARK = { theme: { mode: 'dark', paper: '#0b0b0d', ink: '#cfd8ea' }, lines: { opacity: 1, width: 0.15 }, layout: { fade: 0 }, motion: { sparkle: 0.25 } };
/** The "completely different look" step: beige paper and dark navy lines. */
const PAPER = { theme: { mode: 'light', paper: '#efe6d2', ink: '#1f2a44' } };
const deep = (...objs) => objs.reduce((a, b) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] ? deep(a[k], v) : v;
  return out;
}, {});

/** Animated loops: [file, place, settings, width, height, frames]. */
const LOOPS = [
  ['hero-everest.webp', 'everest', deep(DARK, { lines: { count: 44, indexEvery: 4 } }), 960, 480, 64],
  ['hero-grand-canyon.webp', 'grand-canyon', deep(DARK, { lines: { count: 28, indexEvery: 4 } }), 960, 480, 64],
];

/**
 * Stills: [file, place or null, settings, width, height]. The step files follow the build-ups in the
 * package READMEs: each adds one setting to the one before.
 */
const STEP = 800;
const STEP_H = 500;
const canyon = [
  { mode: '2d', lines: { count: 24, indexEvery: 4 } },
  { mode: '3d' },
  PAPER,
  { lines: { count: 60, indexEvery: 5 } },
];
const shapes = [
  { shape: 'drifting-lobes', mode: '2d', lines: { count: 36, indexEvery: 4 }, layout: { anchor: 1 } },
  { shape: 'granite', seed: 21 },
  { terrain: { peaks: 3, terracing: 0.85 } },
  { mode: '3d', elevation: 0.45, camera: { elevation: 42, radius: 2.6 }, theme: { mode: 'dark', paper: '#120d07', ink: '#e0a24a' } },
];
const cumulative = (steps, base) => steps.map((_, i) => deep(base, ...steps.slice(0, i + 1)));
const STILLS = [
  ...cumulative(canyon, DARK).map((s, i) => [`canyon-${i + 1}.webp`, 'grand-canyon', s, STEP, STEP_H]),
  ...cumulative(shapes, DARK).map((s, i) => [`shape-${i + 1}.webp`, null, s, STEP, STEP_H]),
  ...['istanbul', 'cyprus', 'matterhorn', 'geirangerfjord', 'grand-canyon', 'yosemite', 'torres-del-paine', 'fuji', 'everest', 'kilimanjaro']
    .map((id) => [`place-${id}.webp`, id, deep(DARK, { lines: { count: 36, indexEvery: 4 } }), 480, 300]),
];

// ---------------------------------------------------------------- social cards

const HEAD = 'Topographic terrain, rendered live with WebGL.';
const SUB = 'Generate a land. Or turn a real place into one.';
const LOGO = '/assets/images/logo/topographic.png';
const FADE = 'linear-gradient(90deg,rgba(11,11,13,.95) 30%,rgba(11,11,13,.55) 52%,rgba(11,11,13,0) 74%)';
/**
 * The card text: the mark, the headline, the sub line, then the install line and the code that draws the
 * terrain behind it, as two steps in one block. No URL and no button.
 */
const cardHtml = ({ x, w, code, install = 'npm install topographic', extra = '' }) => `<div class="col" style="left:${x}px;width:${w}px">
  <div class="mark"><img src="${LOGO}" alt="">topographic${extra}</div>
  <div class="words"><h1>${HEAD}</h1><p class="sub">${SUB}</p></div>
  <pre><span class="step"><b>$</b> ${install}</span>${code}</pre></div>`;
const CARDS = [
  ['og.png', pub, 'everest', 1200, 630, cardHtml({ x: 72, w: 600, code: `<b>createTopography</b>(el, {\n  location: <i>'everest'</i>,\n  lines: { count: <u>44</u> },\n});` })],
  ['og-docs.png', pub, 'grand-canyon', 1200, 630, cardHtml({ x: 72, w: 600, extra: '<small>docs</small>', install: 'npm install topographic topographic-react', code: `&lt;<b>Topography</b>\n  location=<i>"grand-canyon"</i>\n  mode=<i>"3d"</i>\n/&gt;` })],
  ['github-preview.png', social, 'yosemite', 1280, 640, cardHtml({ x: 72, w: 640, code: `<b>createTopography</b>(el, {\n  location: <i>'yosemite'</i>,\n  lines: { count: <u>44</u> },\n});` })],
];
/** The card terrains: the README look, moved right of the type by a pan. */
const CARD_SETTINGS = deep(DARK, { lines: { count: 44, indexEvery: 4 } });

// ---------------------------------------------------------------- run

const vite = await createServer({ root, logLevel: 'warn', server: { port: 5288, host: '127.0.0.1' }, optimizeDeps: { noDiscovery: true, include: [] } });
await vite.listen();
const base = vite.resolvedUrls.local[0];
const args = process.env.SOFTWARE_GL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args })
  .catch(async (e) => { await vite.close(); throw e; });
const work = await mkdtemp(join(tmpdir(), 'topographic-readme-'));
const sizes = [];
const note = async (file) => sizes.push([file.replace(root, ''), (await stat(file)).size]);

try {
  const p = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  p.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
  await p.goto(`${base}scripts/readme-render.html`);
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  p.setDefaultTimeout(180000);

  for (const [file, place, settings, width, height, count] of LOOPS) {
    if (!want(file)) continue;
    const frames = await p.evaluate((job) => window.orbit(job), { place, settings, width, height, count });
    const dir = join(work, file);
    await mkdir(dir);
    const list = [];
    for (const [i, b64] of frames.entries()) {
      const f = join(dir, `${String(i).padStart(3, '0')}.png`);
      await writeFile(f, Buffer.from(b64, 'base64'));
      list.push(f);
    }
    const out = join(readme, file);
    // 10 frames a second: one swing there and back in 6.4 seconds.
    execFileSync('img2webp', ['-loop', '0', '-d', '100', '-lossy', '-q', process.env.LOOP_Q ?? '44', '-m', '6', ...list, '-o', out], { stdio: 'ignore' });
    await note(out);
  }

  for (const [file, place, settings, width, height] of STILLS) {
    if (!want(file)) continue;
    // Stills are kept at twice their shown size, for sharp lines on high-density screens.
    const b64 = await p.evaluate((job) => window.still(job), { place, settings, width: width * 2, height: height * 2 });
    const png = join(work, file.replace('.webp', '.png'));
    await writeFile(png, Buffer.from(b64, 'base64'));
    const out = join(readme, file);
    execFileSync('cwebp', ['-quiet', '-q', '80', png, '-o', out]);
    await note(out);
  }

  for (const [file, dir, place, width, height, html] of CARDS) {
    if (!want(file)) continue;
    // The terrain fills the card and its centre sits in the right half, beside the type.
    const settings = deep(CARD_SETTINGS, { camera: { panX: -0.32 } });
    await p.setViewportSize({ width, height });
    await p.evaluate((job) => window.card(job), { place, settings, width, height, html, fade: FADE });
    const out = join(dir, file);
    await p.locator('#card').screenshot({ path: out });
    await p.evaluate(() => { document.getElementById('card').hidden = true; });
    await note(out);
  }
  await p.close();
} finally {
  await browser.close();
  await vite.close();
  await rm(work, { recursive: true });
}
for (const [name, size] of sizes) console.log(`${name} ${(size / 1024).toFixed(0)} KB`);
const big = sizes.filter(([name, size]) => size > (name.endsWith('github-preview.png') ? 1 : 3) * 1024 * 1024);
if (big.length) { console.log(`too large: ${big.map(([n]) => n).join(', ')}`); process.exit(1); }
