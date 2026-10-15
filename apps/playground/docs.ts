import type { Plugin } from 'vite';
import { PARAMS, PRESETS, STYLES, defaultSettings } from 'topographic';
import { INSTALL, TAGLINE } from './src/content';
import { TOOL_DEFS } from './src/agent-tools';
import { REGION_TOOL_DEFS } from './src/region/tools';

export const SITE_URL = 'https://yahyabedirhan.github.io/topographic/';
export const WEBMCP_SPEC = 'https://github.com/webmachinelearning/webmcp/blob/d0e4e0e0f039358cc9d93f90074116622bfebd53/index.bs';

function toolsList(): string {
  return TOOL_DEFS.map((t) => `- \`${t.name}\`${t.readOnly ? ' (read-only)' : ''}: ${t.description}`).join('\n');
}

function webmcpMd(): string {
  return `# WebMCP tools

In browsers that support [WebMCP](https://github.com/webmachinelearning/webmcp), the playground page registers these tools with \`document.modelContext.registerTool()\`. Older builds that expose \`navigator.modelContext\` are used as a fallback. Without either, nothing is registered and the page works as normal.

Written against the spec at webmachinelearning/webmcp commit \`d0e4e0e0f039358cc9d93f90074116622bfebd53\` (${WEBMCP_SPEC}). Tools are removed by aborting their registration \`AbortSignal\`, and read-only tools set \`annotations.readOnlyHint\`.

${toolsList()}

## Input schemas

${TOOL_DEFS.map((t) => `### ${t.name}\n\n\`\`\`json\n${JSON.stringify(t.inputSchema, null, 2)}\n\`\`\``).join('\n\n')}

## Place tools

A region is \`?region=west,south,east,north\` in degrees, or JSON such as \`{"bbox":[28.45,40.78,29.65,41.36]}\`. Named examples: \`place=istanbul\`, \`place=san-francisco\`, \`place=london\`, \`place=new-york\` (each a whole metro area 80 to 100 km wide) and \`place=cyprus\` (the whole island, about 261 × 166 km). A region draws its real heights; the seed, the terrain params and \`motion.warp\` have no effect on it. In the page, the **Map** button picks a region, and its Apply also switches to 3D with \`lc=36&lw=0&lo=0.9&ix=4&ex=block&ev=0.12&az=341.8&ce=39.3&rd=1.32\`. \`set_region\` sets the same view. A minimap above the dock shows the applied area; in 3D it turns with the camera, and its compass turns the camera back to north up, which is azimuth 0.

${REGION_TOOL_DEFS.map((t) => `- \`${t.name}\`${t.readOnly ? ' (read-only)' : ''}: ${t.description}`).join('\n')}

${REGION_TOOL_DEFS.map((t) => `### ${t.name}\n\n\`\`\`json\n${JSON.stringify(t.inputSchema, null, 2)}\n\`\`\``).join('\n\n')}
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
- \`theme.ink\` / \`theme.paper\` (attributes \`ink\`, \`paper\`): any CSS colour; paper may be \`transparent\`. Without them, the CSS variables \`--topographic-ink\` and \`--topographic-paper\` are used, then the mode defaults.
- \`mode\` (attribute \`mode\`): \`2d\` (default) or \`3d\`. 3D draws the same contour field as a terrain. The same seed gives the same map in both.
- \`elevation\` (attribute \`elevation\`): 0 to 1, default 0.62. 3D height. 0 is flat like the 2D map; higher values make the terrain taller, with a rounded crest.
- \`extent\` (attribute \`extent\`): \`endless\` (default) continues the terrain past the view. \`block\` is a finite tabletop whose cut sides carry thin ink layer lines.
- \`detail\` (attribute \`detail\`): 0 to 1, default 0.5. Mesh resolution, from 32² to 160². Use a low value on a slow device.
- \`camera.azimuth\` (attribute \`azimuth\`): degrees around the terrain. Any finite number. Default 349.7.
- \`camera.elevation\` (attribute \`camera-elevation\`): degrees above the horizon, 2 to 80. The camera never goes below the terrain. Default 33.6.
- \`camera.radius\` (attribute \`radius\`): distance from the terrain centre, 1.15 to 6.5. Default 1.92.
- \`camera.motion\` (attribute \`camera-motion\`): \`still\` (default), \`orbit\`, \`push\`, \`flyover\` or \`drone\`. The terrain's own \`motion.speed\` still morphs the field, so the two motions are independent.
- \`camera.panX\` / \`camera.panZ\` (attributes \`pan-x\`, \`pan-z\`): where the camera looks, moved from the terrain centre across the ground (east and south), -6 to 6, default 0. The camera and every motion path turn around that point. The renderer keeps it over the terrain.

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

## createTopographicBackground(element, settings?, options?)

Mounts a canvas inside \`element\` (it fills the element) and returns an instance.

- \`settings\`: partial settings, see [params.md](params.md). Shape: \`{ style, seed, lines, terrain, motion, layout, theme, mode, elevation, extent, detail, camera }\`. \`mode\` is \`'2d' | '3d'\` and defaults to \`'2d'\`.
- \`options\`: \`{ maxPixelRatio = 2, maxPixels = 4147200, forceWebGL1 = false, benchmark = false }\`. \`benchmark\` keeps a 3D view drawing while it is visible so \`stats\` can be read.

Instance:

- \`update(partialSettings)\`: merges, clamps and applies live. Only changed uniforms reach the GPU.
- \`snapshot({ frame?, width?, height?, region?, motion? }) => Promise<Blob>\`: renders one PNG off-screen. \`frame\` is the animation time in ms. Give one side to keep the aspect ratio. \`region\` (\`{ x, y, width, height }\`, fractions from the top-left) keeps only that slice of the view, drawn at full detail. \`motion\` draws the 3D view along that camera path at its pose for \`frame\`, like that moment of \`record\`. The live canvas is not resized. Rejects without WebGL. In 3D it includes the current camera.
- \`record({ seconds?, fps?, width?, height?, frame?, format?, motion? }) => Promise<Blob>\`: renders a 3D clip with a moving camera. \`format\` is \`'mp4'\` (default) or \`'webm'\`. \`motion\` is \`orbit\`, \`push\`, \`flyover\`, \`drone\` or \`still\`. The live canvas is not resized. Rejects without WebGL or when the browser cannot encode that format.
- \`setInsets({ top, right, bottom, left } | null)\`: the space page UI covers on each side of the view, in CSS px. The 3D picture slides (a lens shift, not a camera move) so the terrain centres in the part left free. 2D, \`snapshot\` and \`record\` ignore it and centre in their own frame. \`insets\` reads it back.
- \`clampPan(panX, panZ) => [x, z]\`: the pan kept over the terrain as it is drawn now.
- \`pose\`: \`{ azimuth, elevation, radius, panX, panZ }\`, where the 3D camera is now along its path.
- \`stats\`: \`{ fps, frameMs, mesh }\` while a 3D view is drawing. \`frameMs\` is the time spent drawing one frame. \`mesh\` is the segments along one side, or 0 in 2D.
- \`destroy()\`: stops the loop, removes observers and the canvas, and releases the WebGL context.
- \`settings\`: the current resolved settings.
- \`status\`: \`'webgl2' | 'webgl1' | 'fallback' | 'lost' | 'destroyed'\`.
- \`canvas\`: the canvas element.

Behaviour:

- Uses WebGL2, then WebGL1. Without either, or while the context is lost, the element shows the paper colour. A restored context resumes.
- \`prefers-reduced-motion: reduce\` renders a single still frame.
- Animation pauses when the element is off-screen or the tab is hidden.
- Pixel budget: the device pixel ratio is capped at \`maxPixelRatio\`, and the canvas scales down past \`maxPixels\`.

## <topographic-bg>

\`import 'topographic/element'\` registers the element. Attributes: \`style-name\`, \`seed\`, \`theme\`, \`ink\`, \`paper\`, \`mode\`, \`elevation\`, \`extent\`, \`detail\`, \`azimuth\`, \`camera-elevation\`, \`radius\`, \`camera-motion\`, \`pan-x\`, \`pan-z\`, plus one per numeric setting (see [params.md](params.md)). Attribute changes apply live, and a removed attribute returns to its default. \`element.topographic\` is the instance, and \`element.snapshot(opts)\` is a shortcut.

## React: <TopographicBackground> and useTopographicBackground

\`<TopographicBackground styleName lines terrain motion layout theme seed mode elevation extent detail camera options onReady {...divProps}>\` renders a div with the background, and children on top. It is SSR-safe: the server renders an empty div.

\`useTopographicBackground(settings, options)\` returns a ref to put on any element. \`ref.topographic\` is the instance while mounted.

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
  return `# topographic

> ${TAGLINE}

Live playground: ${SITE_URL}

The playground page holds its state in short query params. Only values that differ from a base are written. The base is the style's defaults, or a named look from the dock (\`look=night-lobes\`). Keys: \`s\` style, \`seed\`, one short key per parameter (${PARAMS.map((p) => `\`${p.short}\` ${p.label.toLowerCase()}`).join(', ')}), \`m\` theme (light, dark or auto), \`ink\` and \`paper\` colours (hex without \`#\`), \`mode=3d\`, \`ex\` extent (endless is the default, so only \`ex=block\` is written), \`ev\` elevation, \`dl\` detail, \`az\` azimuth, \`ce\` camera elevation, \`rd\` radius, \`cm\` camera motion, \`px\` and \`pz\` the pan (only when off centre). The library's default camera (azimuth 349.7, camera elevation 33.6, radius 1.92) is not written. Examples: \`?s=dunes&lc=24\`, \`?look=night-lobes&mode=3d&cm=orbit\`, \`?s=gentle-summit&seed=4&m=dark&ink=9fb0cc&paper=0b0b0d\`.

A real place is \`?region=west,south,east,north\` (or JSON \`{"bbox":[west,south,east,north]}\`). Examples: \`place=istanbul\`, \`place=san-francisco\`, \`place=london\`, \`place=new-york\`, \`place=cyprus\`. Place params combine with the settings params, for example \`?look=night-lobes&lc=40&place=istanbul\`.

## Packages

- [topographic](https://www.npmjs.com/package/topographic): core and the \`<topographic-bg>\` web component
- [topographic-react](https://www.npmjs.com/package/topographic-react): React component and hook

## Docs

${PAGES().map((p) => `- [${p.title}](${p.path})`).join('\n')}
- [Everything in one file](llms-full.txt)

## WebMCP tools on the playground page

${toolsList()}

Place tools:

${REGION_TOOL_DEFS.map((t) => `- \`${t.name}\`${t.readOnly ? ' (read-only)' : ''}: ${t.description}`).join('\n')}

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
    name: 'topographic-docs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const base = server.config.base.startsWith('/') ? server.config.base : '/';
        const url = (req.url ?? '').split('?')[0];
        const path = (url.startsWith(base) ? url.slice(base.length) : url).replace(/^\//, '');
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
