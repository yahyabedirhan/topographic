import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const dist = new URL('../apps/playground/dist/', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain', '.md': 'text/markdown', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const path = req.url.split('?')[0].replace(/\/$/, '/index.html');
  try { const body = await readFile(join(dist, path)); res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const shots = process.env.SHOTS;
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed++; };
const q = (p) => new URL(p.url()).searchParams;
const errors = [];
// Map and elevation tiles come from the network; a failed fetch there is not a page bug.
const watch = (p) => {
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error' && (m.location().url ?? '').startsWith(base)) errors.push(m.text()); });
};
const stub = () => {
  window.__tools = {};
  document.modelContext = { registerTool: async (tool, opts) => { window.__tools[tool.name] = tool; opts?.signal?.addEventListener('abort', () => delete window.__tools[tool.name]); } };
};
const settle = (p, ms = 250) => p.waitForTimeout(ms);
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, colorScheme: 'light' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base.slice(0, -1) });
  await ctx.addInitScript(stub);
  const clip = (p) => p.evaluate(() => navigator.clipboard.readText());
  // The page's own state, read through the get_settings tool.
  const cfg = async (p) => { await p.waitForFunction(() => window.__tools.get_settings); return (await p.evaluate(() => window.__tools.get_settings.execute({}))).config; };
  const open = async (p, query) => { await p.goto(base + query); await p.waitForSelector('.pt-stage canvas'); await settle(p); };
  const p = await ctx.newPage(); watch(p);

  // URL state: short params load, and the page writes its state back as short params.
  await open(p, '?s=granite&lc=40');
  let c = await cfg(p);
  check(c.style === 'granite' && c.lines?.count === 40 && q(p).get('s') === 'granite' && q(p).get('lc') === '40', `short query loads (?${q(p)})`);
  await p.getByRole('button', { name: 'Tune', exact: true }).click();
  const count = p.getByRole('slider', { name: 'Line count' });
  await count.waitFor();
  check(await count.getAttribute('aria-valuenow') === '40', 'Tune shows the URL line count');
  await count.focus(); await p.keyboard.press('ArrowRight'); await settle(p);
  check(q(p).get('lc') === '41' && (await cfg(p)).lines?.count === 41, `Tune slider updates the URL (?${q(p)})`);
  await p.keyboard.press('Escape'); await settle(p);
  check(!(await count.isVisible()), 'Tune closes on Escape');

  // Dock looks: thumbnails render offscreen first, which is slow on swiftshader.
  await p.waitForFunction(() => { const n = document.querySelector('nav[data-looks]'); return n && n.dataset.ready === n.dataset.looks; }, null, { timeout: 120000 });
  const dock = p.getByRole('navigation', { name: 'Examples' });
  const look = dock.getByRole('button', { name: 'Fine granite' });
  await look.click(); await settle(p);
  c = await cfg(p);
  check(q(p).get('look') === 'fine-granite' && c.style === 'granite' && c.seed === 191 && c.lines?.count === 54, `dock look applies and syncs (?${q(p)})`);
  check(await look.getAttribute('aria-current') === 'true', 'dock marks the applied look');
  check(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'dark look sets data-theme dark');
  await dock.getByRole('button', { name: 'Quiet hill' }).click(); await settle(p);
  c = await cfg(p);
  check(q(p).get('look') === 'quiet-hill' && c.style === 'gentle-summit' && c.seed === 197, `a second look switches style and seed (?${q(p)})`);
  check(await p.evaluate(() => document.documentElement.dataset.theme) === 'light', 'light look sets data-theme light');

  const search = q(p).toString();
  await p.getByRole('button', { name: 'Shuffle', exact: true }).click(); await settle(p, 900);
  c = await cfg(p);
  check(c.seed !== 197 && q(p).toString() !== search, `shuffle changes the seed (197 -> ${c.seed}, ?${q(p)})`);
  await dock.getByRole('button', { name: 'Quiet hill' }).click(); await settle(p, 400);
  await p.mouse.move(700, 400); await settle(p, 300);
  if (shots) await p.screenshot({ path: join(shots, 'playground-light.png') });
  const quiet = await cfg(p);

  // Export menu.
  await p.getByRole('button', { name: 'Export', exact: true }).click();
  const menu = p.locator('.pt-export');
  await menu.waitFor();
  await menu.getByRole('button', { name: 'Copy' }).click();
  const link = new URL(await clip(p));
  check(link.origin + '/' === base && link.search === new URL(p.url()).search, `Link copied (${link.search})`);
  await menu.getByRole('button', { name: 'PNG', exact: true }).click();
  const [download] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), menu.getByRole('button', { name: /^1920 × 1080/ }).click()]);
  const png = await readFile(await download.path());
  check(download.suggestedFilename() === 'topographic-gentle-summit-197.png' && png.readUInt32BE(16) === 1920 && png.readUInt32BE(20) === 1080,
    `PNG export ${png.readUInt32BE(16)}x${png.readUInt32BE(20)} ${png.length} bytes (${download.suggestedFilename()})`);
  await menu.getByRole('button', { name: 'React', exact: true }).click();
  check((await menu.locator('pre.pt-code').innerText()).includes('styleName="gentle-summit"'), 'React code shown');
  await menu.getByRole('button', { name: 'Copy' }).click();
  const jsx = await clip(p);
  check(jsx.includes('npm install') && jsx.includes('<TopographicBackground') && jsx.includes('styleName="gentle-summit"'), 'React code copied with install line');
  await menu.getByRole('button', { name: 'HTML', exact: true }).click();
  await menu.getByRole('button', { name: 'Copy' }).click();
  check((await clip(p)).includes('style-name="gentle-summit"'), 'HTML embed copied');
  await menu.getByRole('button', { name: 'JSON', exact: true }).click();
  await menu.getByRole('button', { name: 'Copy' }).click();
  const json = JSON.parse(await clip(p));
  check(JSON.stringify(json) === JSON.stringify(quiet), 'config JSON copied');
  await p.keyboard.press('Escape'); await settle(p);
  check(!(await menu.isVisible()), 'Export closes on Escape');

  // Theme toggle.
  await p.getByRole('button', { name: 'Switch to dark mode' }).click(); await settle(p, 400);
  check(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark' && q(p).get('m') === 'dark', `theme toggle switches to dark (?${q(p)})`);
  if (shots) await p.screenshot({ path: join(shots, 'playground-dark.png') });
  await p.getByRole('button', { name: 'Switch to light mode' }).click(); await settle(p);
  check(await p.evaluate(() => document.documentElement.dataset.theme) === 'light' && q(p).get('m') === 'light', 'theme toggle switches back to light');

  // 3D toggle.
  await p.getByRole('button', { name: 'Switch to 3D' }).click(); await settle(p, 600);
  check(q(p).get('mode') === '3d' && await p.locator('.pt-stage.is-3d').count() === 1, '3D toggle sets mode=3d and the 3D stage');
  check(await p.locator('.pt-bench').isVisible(), '3D shows the frame stats');
  if (shots) await p.screenshot({ path: join(shots, 'playground-3d.png') });
  await p.getByRole('button', { name: 'Switch to 2D' }).click(); await settle(p);
  check(q(p).get('mode') === null && await p.locator('.pt-stage.is-3d').count() === 0, 'toggling back returns to 2D');

  // Place sheet: MapLibre loads lazily and its tiles need the network, so only the sheet is checked.
  await p.getByRole('button', { name: 'Place', exact: true }).click();
  const sheet = p.getByRole('dialog', { name: 'Choose a place' });
  await sheet.waitFor({ timeout: 30000 });
  check(await sheet.isVisible(), 'Place opens the place sheet');
  await sheet.getByRole('button', { name: 'Close', exact: true }).click();
  await sheet.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  check(!(await sheet.isVisible()), 'place sheet closes');
  await p.close();

  // Links load: the copied link, a look slug and 3D mode.
  const back = await ctx.newPage(); watch(back);
  await open(back, link.search);
  check(JSON.stringify(await cfg(back)) === JSON.stringify(quiet), 'copied link restores the settings');
  await open(back, '?look=fine-granite');
  c = await cfg(back);
  check(c.style === 'granite' && c.seed === 191 && c.lines?.count === 54, '?look= loads a dock look');
  await open(back, '?s=dunes&mode=3d');
  check((await cfg(back)).mode === '3d' && await back.locator('.pt-stage.is-3d').count() === 1, '?mode=3d opens 3D');
  await back.close();

  if (shots) {
    const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await m.goto(base + '?s=dunes'); await m.waitForSelector('.pt-stage canvas'); await m.waitForTimeout(600);
    await m.screenshot({ path: join(shots, 'playground-phone.png') }); await m.close();
  }

  for (const doc of ['llms.txt', 'llms-full.txt', 'docs/install.md', 'docs/api.md', 'docs/params.md']) {
    const r = await fetch(base + doc); const t = await r.text();
    check(r.ok && t.length > 200 && !/\btopo\b/i.test(t), `${doc} served (${t.length} chars)`);
  }
  check((await (await fetch(base + 'docs/params.md')).text()).includes('`line-count`'), 'params.md generated from the params table');

  // WebMCP through a stub modelContext.
  const agent = await browser.newPage({ viewport: { width: 1280, height: 800 } }); watch(agent);
  await agent.addInitScript(stub);
  await agent.goto(base);
  await agent.waitForSelector('.pt-stage canvas');
  const want = 'clear_region,get_embed_code,get_install_instructions,get_region,get_settings,list_styles,randomize,record_video,set_region,set_settings,take_screenshot';
  await agent.waitForFunction((n) => Object.keys(window.__tools).length >= n, 11, { timeout: 10000 }).catch(() => {});
  const names = await agent.evaluate(() => Object.keys(window.__tools).sort().join());
  check(names === want, `WebMCP registers 11 tools${names === want ? '' : ': ' + names}`);
  const call = (n, a = {}) => agent.evaluate(([n, a]) => window.__tools[n].execute(a), [n, a]);
  check((await call('list_styles')).styles.length === 7, 'list_styles');
  const set = await call('set_settings', { style: 'dunes', lines: { count: 999 }, bogus: 1 });
  check(set.config.style === 'dunes' && set.config.lines.count === 60 && set.adjustments.length === 2, `set_settings validates: ${JSON.stringify(set.adjustments)}`);
  await settle(agent);
  check(q(agent).get('s') === 'dunes' && q(agent).get('lc') === '60', 'set_settings updates the page and URL');
  check((await call('get_settings')).config.lines.count === 60, 'get_settings');
  const before = (await call('get_settings')).config.seed;
  const rnd = await call('randomize', { style: true });
  check(rnd.config.seed > 0 && rnd.config.seed !== before, 'randomize');
  const shot = await call('take_screenshot', { width: 400 });
  check(shot.dataUrl.startsWith('data:image/png;base64,') && shot.width === 400, `take_screenshot ${shot.width}x${shot.height}`);
  const t0 = Date.now();
  agent.setDefaultTimeout(120000);
  const video = await call('record_video', { seconds: 0.5, width: 160, height: 160, motion: 'orbit' }).catch((e) => ({ error: String(e) }));
  check(/^data:video\/(mp4|webm)/.test(video.dataUrl ?? '') && video.byteLength > 0,
    `record_video ${video.mimeType ?? video.error} ${video.byteLength ?? 0} bytes in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  check((await call('get_embed_code', { format: 'react' })).code.includes('<TopographicBackground'), 'get_embed_code');
  check((await call('get_install_instructions', { target: 'react' })).instructions.includes('npm install'), 'get_install_instructions');
  const region = await call('set_region', { place: 'istanbul' });
  check(region.accepted === true && region.place === 'istanbul' && region.bbox.west === 28.94, `set_region accepts istanbul (${region.query})`);
  const got = await call('get_region');
  check(got.place === 'istanbul' && got.bbox?.north === 41.08, `get_region (${got.status})`);
  check((await call('clear_region')).cleared === true && (await call('get_region')).bbox === null, 'clear_region');
  await agent.close();

  const plain = await browser.newPage(); watch(plain);
  await plain.goto(base); await plain.waitForSelector('.pt-stage canvas'); await settle(plain);
  check(await plain.evaluate(() => !('modelContext' in document) && !('modelContext' in navigator)) && await plain.locator('.pt-cluster button').count() > 4, 'no WebMCP: page works, nothing registered');
  await plain.close();

  check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
} finally { await browser.close(); server.close(); }
if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
console.log('playground checks passed');
