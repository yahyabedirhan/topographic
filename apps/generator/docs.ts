// Builds the agent-facing docs from the source of truth: params table, styles, presets and the
// shared install text. Served in dev and emitted into the build as /llms.txt, /llms-full.txt and /docs/*.md.
import type { Plugin } from 'vite';
import { PARAMS, PRESETS, STYLES, defaultSettings } from '@yahyapak/topography';
import { INSTALL, TAGLINE } from './src/content';
import { TOOL_DEFS } from './src/agent-tools';

export const WEBMCP_SPEC = 'https://github.com/webmachinelearning/webmcp/blob/d0e4e0e0f039358cc9d93f90074116622bfebd53/index.bs';

function toolsList(): string {
  return TOOL_DEFS.map((t) => `- \`${t.name}\`${t.readOnly ? ' (read-only)' : ''}: ${t.description}`).join('\n');
}

function webmcpMd(): string {
  return `# WebMCP tools

In browsers that support [WebMCP](https://github.com/webmachinelearning/webmcp), the generator page registers these tools with \`document.modelContext.registerTool()\`. Older builds that expose \`navigator.modelContext\` are used as a fallback. Without either, nothing is registered and the page works as normal.

Written against the spec at webmachinelearning/webmcp commit \`d0e4e0e0f039358cc9d93f90074116622bfebd53\` (${WEBMCP_SPEC}). Tools are removed by aborting their registration \`AbortSignal\`, and read-only tools set \`annotations.readOnlyHint\`.

${toolsList()}

## Input schemas

${TOOL_DEFS.map((t) => `### ${t.name}\n\n\`\`\`json\n${JSON.stringify(t.inputSchema, null, 2)}\n\`\`\``).join('\n\n')}
`;
}

const DOC_EXTRAS = [{ title: 'WebMCP tools', path: 'docs/webmcp.md', body: webmcpMd }];

function paramsMd(): string {
  const rows = PARAMS.map((p) =>
    `| \`${p.group}.${p.key}\` | \`${p.attr}\` | ${p.min} to ${p.max}${'integer' in p ? ' (integer)' : ''} | ${p.default} | ${p.description} |`);
  const styles = STYLES.map((s) => `| \`${s.id}\` | ${s.name} | ${s.description} |`);
  const presets = PRESETS.map((p) => `- **${p.name}**: \`${JSON.stringify(p.settings)}\``);
  return `# Parameters

Every setting, generated from \`packages/core/src/params.ts\`. Out-of-range values are clamped; integers are rounded.

| Setting | Element attribute | Range | Default | What it does |
|---|---|---|---|---|
${rows.join('\n')}

Other settings:

- \`style\` (attribute \`style-name\`, React prop \`styleName\`): one of the styles below. Unknown styles fall back to \`${defaultSettings().style}\` with one console warning.
- \`seed\` (attribute \`seed\`): integer 0 to 999999. The same seed gives the same terrain; 0 is the original look.
- \`theme.mode\` (attribute \`theme\`): \`auto\` (follows the OS), \`light\` or \`dark\`.
- \`theme.ink\` / \`theme.paper\` (attributes \`ink\`, \`paper\`): any CSS colour; paper may be \`transparent\`. Without them, the CSS variables \`--topography-ink\` and \`--topography-paper\` are used, then the mode defaults.

## Styles

| Id | Name | Description |
|---|---|---|
${styles.join('\n')}

## Presets

${presets.join('\n')}
`;
}

function installMd(): string {
  return `# Install

${TAGLINE}

\`\`\`sh
${INSTALL.npm}
\`\`\`

## Web component

\`\`\`html
${INSTALL.webComponent}
\`\`\`

## React

\`\`\`sh
${INSTALL.react}
\`\`\`

\`\`\`tsx
${INSTALL.reactUsage}
\`\`\`

## Vanilla JS

\`\`\`js
${INSTALL.vanilla}
\`\`\`

## Colours

\`\`\`css
${INSTALL.css}
\`\`\`
`;
}

function apiMd(): string {
  return `# API

## createTopography(element, settings?, options?)

Mounts a canvas inside \`element\` (it fills the element) and returns an instance.

- \`settings\`: partial settings, see [params.md](params.md). Shape: \`{ style, seed, lines: {...}, terrain: {...}, motion: {...}, layout: {...}, theme: { mode, ink, paper } }\`.
- \`options\`: \`{ maxPixelRatio = 2, maxPixels = 4147200, forceWebGL1 = false }\`.

Instance:

- \`update(partialSettings)\`: merges, clamps and applies live. Only changed uniforms reach the GPU.
- \`snapshot({ frame?, width?, height? }) => Promise<Blob>\`: renders one PNG off-screen. \`frame\` is the animation time in ms. Give one side to keep the aspect ratio. The live canvas is not resized. Rejects without WebGL.
- \`destroy()\`: stops the loop, removes observers and the canvas, and releases the WebGL context.
- \`settings\`: the current resolved settings.
- \`status\`: \`'webgl2' | 'webgl1' | 'fallback' | 'lost' | 'destroyed'\`.
- \`canvas\`: the canvas element.

Behaviour:

- Uses WebGL2, then WebGL1. Without either, or while the context is lost, the element shows the paper colour. A restored context resumes.
- \`prefers-reduced-motion: reduce\` renders a single still frame.
- Animation pauses when the element is off-screen or the tab is hidden.
- Pixel budget: the device pixel ratio is capped at \`maxPixelRatio\`, and the canvas scales down past \`maxPixels\`.

## <topography-bg>

\`import '@yahyapak/topography/element'\` registers the element. Attributes: \`style-name\`, \`seed\`, \`theme\`, \`ink\`, \`paper\`, plus one per setting (see [params.md](params.md)). Attribute changes apply live, and a removed attribute returns to its default. \`element.topography\` is the instance, and \`element.snapshot(opts)\` is a shortcut.

## React: <Topography> and useTopography

\`<Topography styleName lines terrain motion layout theme seed options onReady {...divProps}>\` renders a div with the background, and children on top. It is SSR-safe: the server renders an empty div.

\`useTopography(settings, options)\` returns a ref to put on any element. \`ref.topography\` is the instance while mounted.

## Helpers

\`resolveSettings\`, \`mergeSettings\`, \`toUniforms\`, \`fromAttributes\`, \`toAttributes\`, \`toQuery\`, \`fromQuery\`, \`parseColor\`, \`resolveTheme\`, plus the data exports \`PARAMS\`, \`STYLES\` and \`PRESETS\`.
`;
}

const PAGES = () => [
  { title: 'Install', path: 'docs/install.md', body: installMd },
  { title: 'API', path: 'docs/api.md', body: apiMd },
  { title: 'Parameters, styles and presets', path: 'docs/params.md', body: paramsMd },
  ...DOC_EXTRAS,
];

function llmsTxt(): string {
  return `# topography

> ${TAGLINE}

The generator page holds its state in the URL as \`?config=<url-encoded JSON settings>\`, for example \`?config=${encodeURIComponent('{"style":"dunes","lines":{"count":24}}')}\`. The JSON shape is the \`settings\` object from the API docs.

## Docs

${PAGES().map((p) => `- [${p.title}](${p.path})`).join('\n')}
- [Everything in one file](llms-full.txt)

## WebMCP tools on the generator page

${toolsList()}

Details and input schemas: [docs/webmcp.md](docs/webmcp.md).

## Quick start

\`\`\`html
${INSTALL.webComponent}
\`\`\`
`;
}

export function buildDocs(): Record<string, string> {
  const files: Record<string, string> = { 'llms.txt': llmsTxt() };
  for (const p of PAGES()) files[p.path] = p.body();
  files['llms-full.txt'] = [llmsTxt(), ...PAGES().map((p) => p.body())].join('\n\n---\n\n');
  return files;
}

export function docsPlugin(): Plugin {
  return {
    name: 'topography-docs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0].replace(/^\//, '');
        const body = buildDocs()[path];
        if (body === undefined) return next();
        res.setHeader('content-type', `${path.endsWith('.md') ? 'text/markdown' : 'text/plain'}; charset=utf-8`);
        res.end(body);
      });
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(buildDocs())) this.emitFile({ type: 'asset', fileName, source });
    },
  };
}
