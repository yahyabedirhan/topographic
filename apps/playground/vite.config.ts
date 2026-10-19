import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { docsPlugin } from './docs';

const version = JSON.parse(readFileSync(new URL('../../packages/core/package.json', import.meta.url), 'utf8')).version as string;

/** Prints `./__debug` batches during `vite` and `vite preview`. A static host has no such path. */
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
    configurePreviewServer(server) { server.middlewares.use(take); },
  };
}

/**
 * Writes the page again as about.html, so /about is a real file. A request that matches no file
 * and is not a browser navigation gets a 404 from worker/index.js, so curl and fetch need it there.
 */
function aboutPage(): Plugin {
  return {
    name: 'about-page',
    enforce: 'post',
    apply: 'build',
    generateBundle(_, bundle) {
      const page = bundle['index.html'];
      if (page?.type === 'asset') this.emitFile({ type: 'asset', fileName: 'about.html', source: page.source });
    },
  };
}

// The region worker is a module worker. ES output lets it split each built-in location into its own chunk.
export default defineConfig({
  plugins: [react(), docsPlugin(), debugEndpoint(), aboutPage()],
  base: process.env.BASE_PATH || '/',
  define: { __APP_VERSION__: JSON.stringify(version) },
  worker: { format: 'es' },
});
