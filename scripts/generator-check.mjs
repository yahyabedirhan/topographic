// Headless check of the built generator (apps/generator/dist): loads it, moves a slider, applies a
// preset, randomizes the seed, checks URL sync and PNG export. SHOTS=dir saves screenshots.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const dist = new URL('../apps/generator/dist/', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const path = req.url.split('?')[0].replace(/\/$/, '/index.html');
  try { const body = await readFile(join(dist, path)); res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed++; };
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, colorScheme: 'light' });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(base + '?s=granite&lc=40');
  await p.waitForSelector('.stage canvas');
  check((await p.locator('.chips button.on').textContent()) === 'Granite', 'URL state loads (granite)');
  check((await p.locator('#line-count').inputValue()) === '40', 'URL line count applied to slider');

  await p.locator('#roughness').fill('0.4');
  await p.waitForTimeout(100);
  check(p.url().includes('rg=0.4'), `slider syncs to URL: ${new URL(p.url()).search}`);

  await p.getByRole('button', { name: 'Survey map' }).click();
  await p.waitForTimeout(100);
  check(p.url().includes('s=gentle-summit') && p.url().includes('lc=44'), 'preset applies and syncs');

  await p.getByRole('button', { name: 'Randomize' }).click();
  await p.waitForTimeout(100);
  check(/seed=\d+/.test(p.url()), 'randomize sets a seed');
  if (process.env.SHOTS) await p.screenshot({ path: join(process.env.SHOTS, 'generator-light.png') });

  const [download] = await Promise.all([p.waitForEvent('download'), (async () => {
    await p.locator('select[aria-label="PNG size"]').selectOption({ label: '1920 × 1080' });
    await p.getByRole('button', { name: 'Download PNG' }).click();
  })()]);
  const file = await download.path();
  const png = await readFile(file);
  check(png.readUInt32BE(16) === 1920 && png.readUInt32BE(20) === 1080, `PNG export ${png.readUInt32BE(16)}x${png.readUInt32BE(20)} (${download.suggestedFilename()})`);

  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.getByRole('button', { name: 'Copy HTML' }).click();
  const html = await p.evaluate(() => navigator.clipboard.readText());
  check(html.includes('<topography-bg style-name="gentle-summit"'), 'HTML embed copied');
  await p.getByRole('button', { name: 'Copy JSX' }).click();
  const jsx = await p.evaluate(() => navigator.clipboard.readText());
  check(jsx.includes('<Topography') && jsx.includes('styleName="gentle-summit"'), 'JSX embed copied');

  await p.getByRole('button', { name: 'dark', exact: true }).click();
  await p.waitForTimeout(200);
  check(p.url().includes('m=dark') && (await p.locator('.app').getAttribute('class')).includes('dark'), 'dark toggle');
  if (process.env.SHOTS) await p.screenshot({ path: join(process.env.SHOTS, 'generator-dark.png') });
  check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
} finally { await browser.close(); server.close(); }
if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
console.log('generator checks passed');
