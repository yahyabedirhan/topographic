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
  const tabs = await p.locator('.pt-tabs button.pt-tab').allInnerTexts();
  check(tabs.join() === 'Lines,Terrain,Motion,Layout,3D', `Tune tabs are labelled (${tabs.join()})`);
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
  check(await dock.getByRole('button', { name: 'Shuffle', exact: true }).count() === 1 && await dock.getByRole('button', { name: /^Switch to (dark|light) mode$/ }).count() === 1
    && await p.locator('.pt-cluster').getByRole('button', { name: /Shuffle|Switch to (dark|light) mode/ }).count() === 0, 'shuffle and theme live in the dock');
  await dock.getByRole('button', { name: 'Shuffle', exact: true }).click(); await settle(p, 900);
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
  c = await cfg(p);
  check(await p.locator('.pt-mode .pt-mode-tag').innerText() === '3D' && c.camera?.azimuth === 349.7 && c.camera?.elevation === 33.6 && c.camera?.radius === 1.92 && q(p).get('az') === null,
    `3D shows its badge and starts from the playground camera (${JSON.stringify(c.camera)})`);
  check(await p.locator('.pt-wordmark .pt-fps').isVisible() && /fps/.test(await p.locator('.pt-fps').innerText()) && await p.locator('.pt-bench').count() === 0, '3D shows the frame-rate readout under the wordmark');
  if (shots) await p.screenshot({ path: join(shots, 'playground-3d.png') });
  await p.getByRole('button', { name: 'Switch to 2D' }).click(); await settle(p);
  check(q(p).get('mode') === null && await p.locator('.pt-stage.is-3d').count() === 0 && await p.locator('.pt-fps').count() === 0, 'toggling back returns to 2D and hides the readout');
  check(await p.locator('.pt-mode .pt-mode-tag').innerText() === '2D', '2D shows its badge');

  // One popover at a time, and only an open popover fills its cluster button.
  await p.getByRole('button', { name: 'Tune', exact: true }).click(); await settle(p);
  await p.getByRole('button', { name: 'Export', exact: true }).click(); await settle(p);
  check(await p.locator('.pt-pop:not(.pt-pop-color)').count() === 1 && await p.locator('.pt-export').isVisible(), 'opening Export closes Tune');
  check(await p.locator('.pt-cluster [data-popup-open]').count() === 1 && await p.locator('.pt-mode').evaluate((el) => getComputedStyle(el).backgroundColor) === 'rgba(0, 0, 0, 0)', 'only the open popover fills its button; 2D/3D never fills');
  await p.keyboard.press('Escape'); await settle(p);

  // Map popover: MapLibre loads lazily and its tiles need the network.
  const dockNav = p.locator('nav[data-looks]');
  const savedCount = async (pg = p) => Number(await pg.locator('nav[data-looks]').getAttribute('data-saved'));
  const VIEW_KEYS = ['lc', 'lw', 'lo', 'ix', 'mode', 'ex', 'ev', 'az', 'ce', 'rd'];
  const viewOf = (pg) => Object.fromEntries(VIEW_KEYS.map((k) => [k, q(pg).get(k)]));
  const MAP_VIEW = { lc: '36', lw: '0', lo: '0.9', ix: '4', mode: '3d', ex: 'block', ev: '0.12', az: '341.8', ce: '39.3', rd: '1.32' };
  const sameView = (a, b) => VIEW_KEYS.every((k) => a[k] === b[k]);
  const viewBefore = viewOf(p);
  const settingsBefore = await cfg(p);
  await p.getByRole('button', { name: 'Map', exact: true }).click();
  const place = p.locator('.pt-pop-wide');
  await place.locator('.pt-map-host canvas').waitFor({ timeout: 30000 });
  check(await place.isVisible() && await p.locator('.pt-cluster [data-popup-open]').getAttribute('aria-label') === 'Map', 'Map opens its popover under the cluster');
  const apply = place.locator('button.pt-apply');
  const clearBtn = place.getByRole('button', { name: 'Clear', exact: true });
  const pinDot = () => p.locator('.pt-cluster .pt-ibtn.has-dot').count();
  await p.waitForFunction(() => /[\d.] × [\d.]+ km/.test(document.querySelector('.pt-map-span')?.textContent ?? ''), null, { timeout: 30000 });
  check(await apply.isEnabled() && await apply.innerText() === 'Apply' && await pinDot() === 0 && await clearBtn.count() === 0, 'with no place, a valid frame can be applied and Clear is hidden');
  const credit = await place.locator('.pt-credit-text').textContent();
  check(/Mapzen Terrain Tiles/.test(credit) && /OpenStreetMap/.test(credit) && !(await place.locator('.pt-credit-text').isVisible()), `the folded © credit carries the elevation credit (${credit})`);
  await place.getByRole('button', { name: 'Map credits' }).click();
  check(await place.locator('.pt-credit-text').isVisible(), 'the © opens the credit');
  await place.getByRole('button', { name: 'Map credits' }).click();
  const badge = place.locator('.pt-map-badge');
  const badgeText = () => badge.innerText().then((t) => t.replace(/\s+/g, ' ').trim());
  const status = () => place.locator('.pt-place-foot .pt-status').innerText().then((t) => t.replace(/\s+/g, ' ').trim());
  check(/^Istanbul [\d.]+ × [\d.]+ km$/.test(await badgeText()) && /^Generated terrain/.test(await status()), `the badge names the framed city and the footer the terrain (${await badgeText()} | ${await status()})`);
  await badge.click(); await p.getByRole('menuitem').first().waitFor();
  const items = (await p.getByRole('menuitem').allInnerTexts()).map((t) => t.split('\n')[0]);
  check(items.join() === 'Istanbul,San Francisco,London,New York', `the badge opens the city menu (${items.join()})`);
  await p.keyboard.press('Escape'); await settle(p);
  check(await place.isVisible(), 'closing the city menu keeps the Map popover open');
  check(await apply.evaluate((el) => el.classList.contains('pt-action')) && await place.getByRole('button', { name: 'Generated' }).count() === 0, 'Apply is an action button and Generated is gone');
  await apply.click(); await settle(p, 600);
  c = await cfg(p);
  check(sameView(viewOf(p), MAP_VIEW) && c.elevation === 0.12 && c.camera?.azimuth === 341.8 && c.camera?.elevation === 39.3 && c.camera?.radius === 1.32 && c.lines?.width === 0
    && await p.locator('.pt-stage.is-3d').count() === 1, `Apply sets the map terrain view and 3D (?${q(p)})`);
  await p.waitForFunction(() => document.documentElement.dataset.region === 'ready', null, { timeout: 60000 }).catch(() => {});
  check(!(await apply.isEnabled()) && /Applied/.test(await apply.innerText()) && await pinDot() === 1 && q(p).get('region') === null && q(p).get('place') === 'istanbul' && await clearBtn.isVisible()
    && /^Istanbul Applied · 101 × 64 km$/.test(await status()), `Apply shows Applied, Clear, the status and the Map dot (${await status()})`);
  check(await savedCount() === 1 && await dockNav.locator('.pt-thumb').first().getAttribute('aria-label') === 'Istanbul map', 'Apply saves the terrain first in the dock');
  // Resizing: a corner drag changes the readout and the name; Apply uses the new box.
  const handle = async (h) => { const bb = await place.locator(`.pt-frame-handle.is-${h}`).boundingBox(); return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }; };
  const sizeOf = async () => { const m = (await badgeText()).match(/([\d.]+) × ([\d.]+) km/); return m ? [Number(m[1]), Number(m[2])] : null; };
  let at = await handle('se');
  await p.mouse.move(at.x, at.y); await p.mouse.down(); await p.mouse.move(at.x - 120, at.y - 40, { steps: 8 }); await p.mouse.up(); await settle(p, 300);
  const resized = await sizeOf();
  check(resized && resized[0] < 101 && /^Area /.test(await badgeText()) && await apply.isEnabled() && /^Area Istanbul applied now$/.test(await status()), `a corner drag resizes the frame (${await badgeText()} | ${await status()})`);
  await apply.click(); await settle(p, 600);
  const applied2 = q(p).get('region')?.split(',').map(Number);
  check(applied2 && q(p).get('place') === null && await savedCount() === 2 && await dockNav.locator('.pt-thumb').first().getAttribute('aria-label') === 'Area map'
    && Math.abs((applied2[2] - applied2[0]) * 111.32 * Math.cos(((applied2[1] + applied2[3]) / 2) * Math.PI / 180) - resized[0]) < 1.5, `Apply uses the resized box and saves it as Area (?region=${applied2})`);
  // Clamp: pulling the right edge far out and the top edge down stops at 3:1.
  at = await handle('e'); await p.mouse.move(at.x, at.y); await p.mouse.down(); await p.mouse.move(at.x + 400, at.y, { steps: 6 }); await p.mouse.up();
  at = await handle('n'); await p.mouse.move(at.x, at.y); await p.mouse.down(); await p.mouse.move(at.x, at.y + 400, { steps: 10 }); await p.mouse.up(); await settle(p, 300);
  const thin = await sizeOf();
  check(thin && thin[0] / thin[1] <= 3.05 && thin[0] / thin[1] > 2.5 && await apply.isEnabled(), `resizing stops at 3:1 (${thin?.join(' × ')} km)`);
  // Panning the map moves the area under the frame.
  const box = await place.locator('.pt-map-host').boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + 30); await p.mouse.down(); await p.mouse.move(box.x + box.width / 2 + 60, box.y + 50, { steps: 8 }); await p.mouse.up(); await settle(p, 400);
  check(await apply.isEnabled() && /^Area /.test(await badgeText()), 'panning the map keeps Apply ready for the new area');
  await p.keyboard.press('Escape'); await settle(p);

  // Tune dims what the heightfield replaces: every Terrain row and Motion's warp.
  await p.getByRole('button', { name: 'Tune', exact: true }).click(); await settle(p);
  const tune = p.locator('.pt-pop:not(.pt-pop-wide):not(.pt-export)');
  await tune.getByRole('button', { name: 'Terrain', exact: true }).click(); await settle(p);
  const peaks = tune.getByRole('slider', { name: 'Peaks' });
  check(await peaks.isDisabled() && await tune.getByRole('slider', { name: 'Terracing' }).isDisabled() && /Shape comes from the map/.test(await tune.innerText())
    && await tune.locator('.pt-sec-reset').count() === 0, 'with a place, Terrain sliders are disabled under a note');
  await tune.getByRole('button', { name: 'Motion', exact: true }).click(); await settle(p);
  check(await tune.getByRole('slider', { name: 'Warp' }).isDisabled() && await tune.getByRole('slider', { name: 'Speed' }).isEnabled() && await tune.getByRole('slider', { name: 'Sparkle' }).isEnabled(),
    'with a place, Warp is disabled and Speed and Sparkle still work');
  await tune.getByRole('button', { name: 'Terrain', exact: true }).click(); await settle(p);
  await tune.getByRole('button', { name: 'Clear map' }).click(); await settle(p, 400);
  check(await peaks.isEnabled() && !/Shape comes from the map/.test(await tune.innerText()) && await pinDot() === 0 && q(p).get('region') === null, 'Clear map enables the Terrain sliders again');
  const restored = viewOf(p);
  check(VIEW_KEYS.filter((k) => k !== 'mode').every((k) => restored[k] === viewBefore[k]) && JSON.stringify({ ...(await cfg(p)), mode: undefined }) === JSON.stringify({ ...settingsBefore, mode: undefined }),
    `Clear restores the lines, camera, extent and elevation (?${q(p)})`);
  await tune.getByRole('button', { name: 'Lines', exact: true }).click(); await settle(p);
  const lw = tune.getByRole('slider', { name: 'Line width' });
  check(/^\d+(\.\d)? px$/.test(await tune.locator('.pt-row', { has: p.getByRole('slider', { name: 'Line width' }) }).locator('output').innerText()) && /px$/.test(await lw.getAttribute('aria-valuetext')), 'line width reads in pixels');
  check(await tune.evaluate((el) => el.firstElementChild?.classList.contains('pt-tabs')), 'Tune starts with its tab bar, no title');
  await p.keyboard.press('Escape'); await settle(p);

  // A city: the segment moves the frame only; Apply saves it under its name.
  await p.getByRole('button', { name: 'Map', exact: true }).click(); await settle(p, 600);
  const placeSearch = q(p).toString();
  await badge.click(); await p.getByRole('menuitem', { name: /^London/ }).click(); await settle(p, 1200);
  check(await apply.isEnabled() && q(p).toString() === placeSearch && /^London 80 × 51 km$/.test(await badgeText()), `a city from the menu moves the map only (${await badgeText()})`);
  await apply.click(); await settle(p, 600);
  await badge.click(); await p.getByRole('menuitem').first().waitFor();
  const checked = await p.getByRole('menuitem', { name: /^London/ }).locator('svg').count();
  await p.keyboard.press('Escape'); await settle(p);
  check(q(p).get('place') === 'london' && checked === 1 && await savedCount() === 3
    && await dockNav.locator('.pt-thumb').first().getAttribute('aria-label') === 'London map', `Apply on a city writes its name, checks it in the menu and saves it (?${q(p)})`);
  await clearBtn.click(); await settle(p, 400);
  check(q(p).get('place') === null && q(p).get('region') === null && await pinDot() === 0 && await clearBtn.count() === 0 && q(p).get('ev') === viewBefore.ev, 'Clear returns to the generated terrain and its elevation');
  check(!/Too thin|Exaggerate|Smoothing|Use this place/.test(await place.innerText()), 'Map holds only the map, the badge, the credit and the footer');
  await p.keyboard.press('Escape'); await settle(p);
  check(!(await place.isVisible()), 'Map closes on Escape');

  // Saved items: they stay after a reload, a click brings back place and colours, a look clears the place.
  await p.reload(); await p.waitForSelector('.pt-stage canvas'); await settle(p);
  check(await savedCount() === 3, 'saved map terrains stay after a reload');
  await dockNav.getByRole('button', { name: 'London map' }).click(); await settle(p, 600);
  const london = await cfg(p);
  check(q(p).get('place') === 'london' && sameView(viewOf(p), MAP_VIEW) && await pinDot() === 1, `a saved item brings back its place and view (?${q(p)})`);
  await p.waitForFunction(() => document.documentElement.dataset.region === 'ready', null, { timeout: 60000 }).catch(() => {});
  await dockNav.getByRole('button', { name: 'Fine granite' }).click(); await settle(p, 600);
  c = await cfg(p);
  check(q(p).get('place') === null && c.style === 'granite' && c.seed === 191 && await pinDot() === 0, 'a built-in look clears the place and brings its shape');
  await dockNav.getByRole('button', { name: 'London map' }).click(); await settle(p, 600);
  check(q(p).get('place') === 'london' && JSON.stringify(await cfg(p)) === JSON.stringify(london), 'the saved item returns with its own colours');
  // Edits to the active saved item are kept, except the camera.
  await p.getByRole('button', { name: 'Ink colour' }).click();
  await p.locator('.pt-pop-color .pt-swatch').nth(3).click(); await p.keyboard.press('Escape'); await settle(p, 900);
  const ink = (await cfg(p)).theme?.ink;
  const stage = await p.locator('.pt-stage').boundingBox();
  await p.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2); await p.mouse.down();
  await p.mouse.move(stage.x + stage.width / 2 + 160, stage.y + stage.height / 2 - 40, { steps: 6 }); await p.mouse.up(); await settle(p, 900);
  check(q(p).get('az') !== '341.8', `dragging moves the camera (az=${q(p).get('az')})`);
  await p.reload(); await p.waitForSelector('.pt-stage canvas'); await settle(p);
  await dockNav.getByRole('button', { name: 'London map' }).click(); await settle(p, 600);
  c = await cfg(p);
  check(c.theme?.ink === ink && ink !== london.theme?.ink && q(p).get('az') === '341.8', `the saved item kept the new ink (${ink}) and its own camera`);
  // Delete: hover shows the ×.
  await dockNav.locator('.pt-saved', { has: p.getByRole('button', { name: 'London map' }) }).hover();
  if (shots) await dockNav.screenshot({ path: join(shots, 'dock-saved-hover.png') });
  await dockNav.getByRole('button', { name: 'Delete London' }).click(); await settle(p);
  check(await savedCount() === 2 && q(p).get('place') === 'london', 'delete removes the item and keeps the view');
  await p.reload(); await p.waitForSelector('.pt-stage canvas'); await settle(p);
  check(await savedCount() === 2 && await dockNav.getByRole('button', { name: 'London map' }).count() === 0, 'a deleted item stays gone after a reload');
  await p.close();

  // Storage blocked: the page, Apply and the dock still work.
  const blocked = await browser.newPage({ viewport: { width: 1280, height: 800 } }); watch(blocked);
  await blocked.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }));
  await blocked.goto(base); await blocked.waitForSelector('.pt-stage canvas');
  await blocked.getByRole('button', { name: 'Map', exact: true }).click();
  await blocked.locator('.pt-pop-wide .pt-map-host canvas').waitFor({ timeout: 30000 });
  await blocked.waitForFunction(() => /[\d.] × [\d.]+ km/.test(document.querySelector('.pt-map-span')?.textContent ?? ''), null, { timeout: 30000 });
  await blocked.locator('.pt-pop-wide button.pt-apply').click(); await settle(blocked, 600);
  check(await savedCount(blocked) === 1 && q(blocked).get('place') === 'istanbul', 'with storage blocked, Apply still works and the dock keeps the item for the session');
  await blocked.close();

  // The Map frame never opens too thin, and the popover stays above the dock, at laptop and phone sizes.
  for (const [width, height] of [[1280, 800], [1440, 900], [390, 844]]) {
    const v = await browser.newPage({ viewport: { width, height } }); watch(v);
    await v.goto(base + '?mode=3d'); await v.waitForSelector('.pt-stage canvas');
    await v.getByRole('button', { name: 'Map', exact: true }).click();
    const pop = v.locator('.pt-pop-wide');
    await pop.locator('.pt-map-host canvas').waitFor({ timeout: 30000 });
    await v.waitForFunction(() => /× [\d.]+ km|Too|rectangle/.test(document.querySelector('.pt-map-span')?.textContent ?? ''), null, { timeout: 30000 }).catch(() => {});
    const text = await pop.innerText();
    check(!text.includes('Too thin') && /[\d.]+ × [\d.]+ km/.test(text), `Map at ${width}×${height} opens with a valid frame (${(text.match(/[\d.]+ × [\d.]+ km/) ?? ['none'])[0]})`);
    const fit = await v.evaluate(() => {
      const pop = document.querySelector('.pt-pop-wide').getBoundingClientRect();
      const dock = document.querySelector('.pt-dock').getBoundingClientRect();
      const el = document.querySelector('.pt-pop-wide');
      return { gap: Math.round(dock.top - pop.bottom), scrolls: el.scrollHeight > el.clientHeight + 1 };
    });
    check(fit.gap >= 10 && !fit.scrolls, `Map at ${width}×${height} stays above the dock without scrolling (gap ${fit.gap}px)`);
    await v.close();
  }

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
  check(region.accepted === true && region.place === 'istanbul' && region.bbox.west === 28.45, `set_region accepts istanbul (${region.query})`);
  const got = await call('get_region');
  check(got.place === 'istanbul' && got.bbox?.north === 41.36, `get_region (${got.status})`);
  check((await call('clear_region')).cleared === true && (await call('get_region')).bbox === null, 'clear_region');
  await agent.close();

  const plain = await browser.newPage(); watch(plain);
  await plain.goto(base); await plain.waitForSelector('.pt-stage canvas'); await settle(plain);
  check(await plain.evaluate(() => !('modelContext' in document) && !('modelContext' in navigator)) && await plain.locator('.pt-cluster button').count() === 4, 'no WebMCP: page works, nothing registered');
  await plain.close();

  check(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
} finally { await browser.close(); server.close(); }
if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
console.log('playground checks passed');
