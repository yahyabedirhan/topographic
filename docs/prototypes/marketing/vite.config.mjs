// PROTOTYPE dev server for the marketing board. Serves the repository root, so the board can import the
// built library and the screenshots, and lets the writing page save its drafts to copy-draft.json.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const draft = fileURLToPath(new URL('./copy-draft.json', import.meta.url));
const root = fileURLToPath(new URL('../../..', import.meta.url));

export default {
  root,
  server: { port: 5199, strictPort: true, watch: { ignored: [draft] } },
  plugins: [{
    name: 'copy-draft',
    configureServer(server) {
      server.middlewares.use('/__copy-draft', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          for await (const chunk of req) body += chunk;
          const data = JSON.parse(body);
          await writeFile(draft, `${JSON.stringify({ ...data, savedAt: new Date().toISOString() }, null, 2)}\n`);
          res.statusCode = 204;
          return res.end();
        }
        res.setHeader('content-type', 'application/json');
        res.end(await readFile(draft, 'utf8').catch(() => '{}'));
      });
    },
  }],
};
