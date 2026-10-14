// PROTOTYPE screenshot helper. Run the dev server first (npm run prototype), then:
// node apps/playground/src/prototype/shots.mjs [baseUrl] [outDir] [variants]
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://localhost:5199/';
const out = process.argv[3] ?? 'docs/prototypes';
const only = (process.argv[4] ?? 'ABCDE').split('');
await mkdir(out, { recursive: true });

const INTERACT = {
  A: async (p) => { await p.click('text=Tune'); await p.waitForTimeout(300); },
  B: async (p) => { await p.keyboard.press('Control+k'); await p.waitForTimeout(1500); await p.keyboard.press('ArrowDown'); },
  C: async (p) => { await p.click('.c-card.on .c-adjust'); await p.waitForTimeout(300); },
  D: async (p) => { await p.mouse.move(1300, 90); await p.mouse.down(); await p.mouse.move(700, 160, { steps: 8 }); await p.mouse.move(300, 140, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(700); await p.click('.d-ink .pt-dot'); await p.waitForTimeout(300); },
  E: async (p) => { await p.click('.e-tile >> nth=6'); await p.waitForTimeout(1200); await p.click('.e-rail >> text=Colour'); await p.mouse.move(700, 450); await p.waitForTimeout(900); },
};

const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args });
const config = encodeURIComponent(JSON.stringify({ style: 'gentle-summit', lines: { count: 26 }, theme: { mode: 'dark' } }));
for (const v of only) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  page.on('pageerror', (e) => console.log(v, 'pageerror', e.message));
  await page.goto(`${base}?variant=${v}&config=${config}`);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${out}/${v}-idle.png` });
  await INTERACT[v](page);
  await page.screenshot({ path: `${out}/${v}-open.png` });
  await page.close();
  console.log('shot', v);
}
await browser.close();
