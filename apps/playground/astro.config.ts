// The playground site. Astro renders /about and /docs to HTML at build time; the playground at / is a React island
// that renders only in the browser. The client router in src/layouts/Base.astro moves between the three pages.
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { SITE_URL, docsIntegration } from './llms';

const version = JSON.parse(readFileSync(new URL('../../packages/core/package.json', import.meta.url), 'utf8')).version as string;

/** Prints `./__debug` batches during `astro dev`. `astro preview` and a static host have no such path. */
function debugEndpoint(): Plugin {
  const take = (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => {
    const path = req.url?.split('?')[0] ?? '';
    if (!path.endsWith('/__debug')) { next(); return; }
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8').trim();
      if (body) console.log(`[debug]\n${body}`);
      res.statusCode = 204;
      res.end();
    });
  };
  return {
    name: 'debug-endpoint',
    configureServer(server) { server.middlewares.use(take); },
  };
}

export default defineConfig({
  site: SITE_URL,
  base: process.env.BASE_PATH || '/',
  output: 'static',
  // about.html and docs.html beside index.html, as the Worker's assets serve them at /about and /docs.
  build: { format: 'file' },
  // The pages' links to each other carry data-astro-prefetch, so the next page loads on hover.
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [react(), docsIntegration()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [debugEndpoint()],
    // The build keys keep their names: VITE_POSTHOG_KEY, VITE_POSTHOG_HOST, VITE_SENTRY_DSN and VITE_TOPOGRAPHIC_DEBUG.
    envPrefix: ['VITE_', 'PUBLIC_'],
    define: { __APP_VERSION__: JSON.stringify(version) },
    // The region worker is a module worker. ES output lets it split each built-in location into its own chunk.
    worker: { format: 'es' },
    // About reads CHANGELOG.md and the docs figures read assets/screenshots, both at the repository root.
    server: { fs: { allow: ['../..'] } },
  },
});
