import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:5199/';
const out = process.argv[3] ?? 'docs/prototypes';
await mkdir(out, { recursive: true });

const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args });
const config = encodeURIComponent(JSON.stringify({ style: 'gentle-summit', lines: { count: 26 }, theme: { mode: 'dark' } }));
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`${base}?variant=P2&config=${config}`);
await page.waitForSelector('canvas');
await page.waitForSelector('.pt-thumb img');
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/idle.png` });
await page.click('[aria-label="Tune"]');
await page.waitForSelector('.pt-strip');
await page.waitForTimeout(350);
await page.screenshot({ path: `${out}/tune.png` });
await page.click('[aria-label="Export"]');
await page.waitForSelector('.pt-linkrow');
await page.waitForTimeout(350);
await page.screenshot({ path: `${out}/export.png` });
await browser.close();
console.log('shot');
