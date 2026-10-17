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

export default defineConfig({ plugins: [react(), docsPlugin(), debugEndpoint()], base: process.env.BASE_PATH || '/', define: { __APP_VERSION__: JSON.stringify(version) } });
