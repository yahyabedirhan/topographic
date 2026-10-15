import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5173/';
const out = process.argv[3] ?? 'docs/prototypes/region';
await mkdir(out, { recursive: true });

const configFor = (mode) => encodeURIComponent(JSON.stringify({
  style: 'gentle-summit',
  lines: { count: 28 },
  theme: { mode },
}));
const config = configFor('dark');

const places = [
  ['istanbul-2d', 'place=istanbul&region=28.94,40.99,29.07,41.08'],
  ['istanbul-3d', 'place=istanbul&region=28.94,40.99,29.07,41.08&mode=3d'],
  ['san-francisco-2d', 'place=san-francisco&region=-122.51,37.71,-122.38,37.81'],
  ['san-francisco-3d', 'place=san-francisco&region=-122.51,37.71,-122.38,37.81&mode=3d'],
  ['london-2d', 'place=london&region=-0.22,51.48,-0.06,51.57'],
  ['london-3d', 'place=london&region=-0.22,51.48,-0.06,51.57&mode=3d'],
  ['new-york-2d', 'place=new-york&region=-74.06,40.68,-73.92,40.77'],
  ['new-york-3d', 'place=new-york&region=-74.06,40.68,-73.92,40.77&mode=3d'],
];

const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args });

for (const [name, query] of places) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const t0 = Date.now();
  page.on('pageerror', (e) => console.log(name, e.message));
  await page.goto(`${base}?variant=P2&config=${config}&${query}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const status = document.documentElement.dataset.region;
    return status === 'ready' || status === 'error';
  }, { timeout: 60000 });
  const status = await page.evaluate(() => document.documentElement.dataset.region);
  const pill = await page.locator('.pt-region').innerText();
  if (status !== 'ready') throw new Error(`${name} ${status} ${pill}`);
  await page.waitForFunction(() => {
    const nav = document.querySelector('nav[data-looks]');
    return nav && nav.dataset.ready === nav.dataset.looks && Number(nav.dataset.looks) > 0;
  }, { timeout: 120000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`${name} ${Date.now() - t0}ms ${pill.replace(/\n/g, ' | ')}`);
  await page.close();
}

const light = configFor('light');
for (const [name, query] of places) {
  if (!name.endsWith('-3d')) continue;
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  const t0 = Date.now();
  page.on('pageerror', (e) => console.log(name, e.message));
  await page.goto(`${base}?variant=P2&config=${light}&${query}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const status = document.documentElement.dataset.region;
    return status === 'ready' || status === 'error';
  }, { timeout: 60000 });
  const status = await page.evaluate(() => document.documentElement.dataset.region);
  if (status !== 'ready') throw new Error(`${name}-light ${status}`);
  await page.waitForFunction(() => {
    const nav = document.querySelector('nav[data-looks]');
    return nav && nav.dataset.ready === nav.dataset.looks && Number(nav.dataset.looks) > 0;
  }, { timeout: 120000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-light.png` });
  console.log(`${name}-light ${Date.now() - t0}ms`);
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
await page.goto(`${base}?variant=P2&config=${config}&place=istanbul&region=28.94,40.99,29.07,41.08`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.documentElement.dataset.region === 'ready', { timeout: 60000 });
await page.click('[aria-label="Place"]');
await page.waitForSelector('.maplibregl-canvas', { timeout: 20000 });
await page.waitForTimeout(2800);
await page.screenshot({ path: `${out}/picker-frame.png` });
await page.click('button.pt-chip:has-text("Rectangle")');
const host = page.locator('.pt-map-host');
const box = await host.boundingBox();
if (!box) throw new Error('map host has no box');
await page.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.32);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.7, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/picker-rectangle.png` });
await browser.close();
console.log('region shots');
