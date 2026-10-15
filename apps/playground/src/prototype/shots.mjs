import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5199/';
const out = process.argv[3] ?? 'docs/prototypes';
const only = (process.argv[4] ?? 'A1,A2,A3,A4,A5').split(',');
await mkdir(out, { recursive: true });

const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args });
const config = encodeURIComponent(JSON.stringify({ style: 'gentle-summit', lines: { count: 26 }, theme: { mode: 'dark' } }));
for (const v of only) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  page.on('pageerror', (e) => console.log(v, 'pageerror', e.message));
  await page.goto(`${base}?variant=${v}&config=${config}`);
  await page.waitForSelector('canvas');
  await page.waitForSelector('.pt-thumb img');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${v}-idle.png` });
  await page.click('[aria-label="Tune"]');
  await page.waitForSelector('.pt-knob');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${v}-tune.png` });
  await page.click('[aria-label="Export"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${v}-export.png` });
  await page.close();
  console.log('shot', v);
}
await browser.close();
