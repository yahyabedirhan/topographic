// Headless check of the built playground (apps/playground/dist): loads it, moves a slider, applies a
// preset, randomizes the seed, checks URL sync and PNG export. SHOTS=dir saves screenshots.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const dist = new URL('../apps/playground/dist/', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain', '.md': 'text/markdown' };
const server = createServer(async (req, res) => {
  const path = req.url.split('?')[0].replace(/\/$/, '/index.html');
  try { const body = await readFile(join(dist, path)); res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;
const config = (p) => JSON.parse(new URL(p.url()).searchParams.get('config') ?? '{}');
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
  check(config(p).terrain?.roughness === 0.4, `slider syncs to URL as JSON: ${JSON.stringify(config(p))}`);

  await p.locator('#preset-7').click();
  await p.waitForTimeout(100);
  check(config(p).style === 'gentle-summit' && config(p).lines?.count === 44, 'preset applies and syncs');

  await p.locator('#randomize').click();
  await p.waitForTimeout(100);
  check(config(p).seed > 0, 'randomize sets a seed');
  if (process.env.SHOTS) await p.screenshot({ path: join(process.env.SHOTS, 'playground-light.png') });
  if (process.env.SHOTS) await p.screenshot({ path: join(process.env.SHOTS, 'playground-light-full.png'), fullPage: true });

  const [download] = await Promise.all([p.waitForEvent('download'), (async () => {
    await p.locator('select[aria-label="PNG size"]').selectOption({ label: '1920 × 1080' });
    await p.locator('#download-png').click();
  })()]);
  const file = await download.path();
  const png = await readFile(file);
  check(png.readUInt32BE(16) === 1920 && png.readUInt32BE(20) === 1080, `PNG export ${png.readUInt32BE(16)}x${png.readUInt32BE(20)} (${download.suggestedFilename()})`);

  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await p.locator('#copy-html').click();
  const html = await p.evaluate(() => navigator.clipboard.readText());
  check(html.includes('style-name="gentle-summit"'), 'HTML embed copied');
  await p.locator('#copy-jsx').click();
  const jsx = await p.evaluate(() => navigator.clipboard.readText());
  check(jsx.includes('<TopographicBackground') && jsx.includes('styleName="gentle-summit"'), 'JSX embed copied');

  await p.locator('#copy-json').click();
  const json = JSON.parse(await p.evaluate(() => navigator.clipboard.readText()));
  check(json.style === 'gentle-summit' && json.lines.count === 44, 'config JSON copied');
  const reload = await browser.newPage(); await reload.goto(base + '?config=' + encodeURIComponent(JSON.stringify(json)));
  await reload.waitForSelector('.stage canvas');
  check((await reload.locator('#line-count').inputValue()) === '44', 'config JSON in the URL restores settings'); await reload.close();
  await p.locator('#mode-dark').click();
  await p.waitForTimeout(200);
  check(config(p).theme?.mode === 'dark' && (await p.evaluate(() => document.documentElement.dataset.theme)) === 'dark', 'dark toggle');
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
  if (process.env.SHOTS) await p.screenshot({ path: join(process.env.SHOTS, 'playground-dark.png') });
  if (process.env.SHOTS) { const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); await m.goto(base + '?s=dunes'); await m.waitForSelector('.stage canvas'); await m.waitForTimeout(300); await m.screenshot({ path: join(process.env.SHOTS, 'playground-phone.png') }); await m.close(); }
  for (const doc of ['llms.txt', 'llms-full.txt', 'docs/install.md', 'docs/api.md', 'docs/params.md']) {
    const r = await fetch(base + doc); const t = await r.text();
    check(r.ok && t.length > 200 && !/\btopo\b/i.test(t), `${doc} served (${t.length} chars)`);
  }
  check((await (await fetch(base + 'docs/params.md')).text()).includes('`line-count`'), 'params.md generated from the params table');
  // WebMCP: a stub document.modelContext records registrations; call each tool through it
  const agent = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await agent.addInitScript(() => {
    window.__tools = {};
    document.modelContext = { registerTool: async (tool, opts) => { window.__tools[tool.name] = tool; opts?.signal?.addEventListener('abort', () => delete window.__tools[tool.name]); } };
  });
  await agent.goto(base);
  await agent.waitForSelector('.stage canvas');
  await agent.waitForFunction(() => Object.keys(window.__tools).length === 7);
  const names = await agent.evaluate(() => Object.keys(window.__tools).sort().join());
  check(names === 'get_embed_code,get_install_instructions,get_settings,list_styles,randomize,set_settings,take_screenshot', `WebMCP registers 7 tools`);
  const call = (n, a = {}) => agent.evaluate(([n, a]) => window.__tools[n].execute(a), [n, a]);
  check((await call('list_styles')).styles.length === 7, 'list_styles');
  const set = await call('set_settings', { style: 'dunes', lines: { count: 999 }, bogus: 1 });
  check(set.config.style === 'dunes' && set.config.lines.count === 60 && set.adjustments.length === 2, `set_settings validates: ${JSON.stringify(set.adjustments)}`);
  await agent.waitForTimeout(100);
  check(JSON.parse(new URL(agent.url()).searchParams.get('config')).style === 'dunes', 'set_settings updates the page and URL');
  check((await call('get_settings')).config.lines.count === 60, 'get_settings');
  check((await call('randomize', { style: true })).config.seed > 0, 'randomize');
  const shot = await call('take_screenshot', { width: 400 });
  check(shot.dataUrl.startsWith('data:image/png;base64,') && shot.width === 400, `take_screenshot ${shot.width}x${shot.height}`);
  check((await call('get_embed_code', { format: 'react' })).code.includes('<TopographicBackground'), 'get_embed_code');
  check((await call('get_install_instructions', { target: 'react' })).instructions.includes('npm install'), 'get_install_instructions');
  await agent.close();
  const plain = await browser.newPage(); await plain.goto(base); await plain.waitForSelector('.stage canvas');
  check(await plain.evaluate(() => !('modelContext' in document)), 'no WebMCP: page works, nothing registered'); await plain.close();

  check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
} finally { await browser.close(); server.close(); }
if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
console.log('playground checks passed');
