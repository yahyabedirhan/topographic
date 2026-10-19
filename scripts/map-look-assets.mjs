// Draws the dock picture and the minimap image of every built-in map terrain (MAP_LOOKS in
// apps/playground/src/region/map-looks.ts) into apps/playground/src/assets/map-looks/.
// It makes each one the way a visitor makes a saved terrain: open the look's settings, frame its
// place in the Map popover and Apply. The page draws the dock picture and captures the minimap,
// and the script copies both out of localStorage.
//
//   npm run build:packages
//   CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/map-look-assets.mjs [id ...]
//
// The elevation and map tiles come from the network.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../apps/playground/', import.meta.url));
const out = new URL('../apps/playground/src/assets/map-looks/', import.meta.url);
const server = await createServer({ root, configFile: `${root}vite.config.ts`, server: { port: 0, strictPort: false }, logLevel: 'warn' });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/google-chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const bytes = (url) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');

try {
  // The list and each look's query, read from the playground's own modules.
  const { MAP_LOOKS } = await server.ssrLoadModule('/src/region/map-looks.ts');
  const { writeSettings } = await server.ssrLoadModule('/src/share-url.ts');
  const { resolveSettings } = await server.ssrLoadModule('topographic');
  const looks = MAP_LOOKS.map((l) => ({ id: l.id, name: l.name, query: writeSettings('', resolveSettings(l.settings)) }));

  // Ids on the command line draw only those looks.
  const only = process.argv.slice(2);
  for (const look of looks.filter((l) => !only.length || only.includes(l.id))) {
    // A fresh profile, so the saved list starts empty.
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(`${base}?${look.query}`);
    await p.waitForSelector('.pt-stage canvas');
    await p.getByRole('button', { name: 'Map', exact: true }).click();
    const place = p.locator('.pt-pop-wide');
    await place.locator('.pt-map-host canvas').waitFor({ timeout: 30000 });
    await place.locator('.pt-map-badge').click();
    // A click while the menu is still opening is lost, and the map stays on Istanbul.
    const item = p.getByRole('option', { name: new RegExp(`^${look.name}`) });
    await item.waitFor();
    await p.waitForTimeout(800);
    await item.click();
    await place.locator('.pt-map-badge', { hasText: look.name }).waitFor({ timeout: 10000 });
    // Let the map settle on the place and its tiles load before Apply copies it.
    await p.waitForTimeout(4000);
    await place.locator('button.pt-apply').click();
    const saved = await p.waitForFunction(() => {
      const it = JSON.parse(localStorage.getItem('topographic.saved.v1') ?? '[]')[0];
      return it?.thumb && it?.minimap ? it : null;
    }, null, { timeout: 120000 }).then((h) => h.jsonValue());
    for (const [kind, url] of [['thumb', saved.thumb], ['minimap', saved.minimap]]) {
      if (!url.startsWith('data:image/webp')) throw new Error(`${look.id} ${kind} is not WebP`);
      const file = new URL(`${look.id}-${kind}.webp`, out);
      await writeFile(file, bytes(url));
      console.log(`${fileURLToPath(file)} ${bytes(url).length} bytes`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.close();
}
