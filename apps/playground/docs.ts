import type { Plugin } from 'vite';
import { LOOKS, PARAMS, RADIUS_MAX, RADIUS_MIN, SHAPES, defaultSettings } from 'topographic';
import { AREA_LIMITS, LOCATIONS } from 'topographic/locations';
import { INSTALL, TAGLINE } from './src/content';
import { TOOL_DEFS } from './src/agent-tools';
import { AGENT_NAMES, PURPOSES } from './src/actor';
import { PLACES, catalogPlaces, type CatalogRow } from './src/region/places';
import CATALOG_ROWS from './src/region/catalog.json';
import { REGION_TOOL_DEFS } from './src/region/tools';
import { DOCS_META } from './src/docs-page/copy';
import { HOME_QUERY, REGION_ONLY_QUERY } from './src/share-url';

/** The Map menu's place catalog: the ten built-in places and the playground's own. */
const CATALOG = catalogPlaces(CATALOG_ROWS as unknown as CatalogRow[]);

export const SITE_URL = 'https://topographic.yahyapak.dev/';
export const WEBMCP_SPEC = 'https://github.com/webmachinelearning/webmcp/blob/d0e4e0e0f039358cc9d93f90074116622bfebd53/index.bs';

const NAME_LIST = () => AGENT_NAMES.map((n) => `\`${n}\``).join(', ');
const PURPOSE_LIST = () => PURPOSES.map((p) => `\`${p}\``).join(', ');

/** How an agent without native WebMCP reaches the tools: a stub that keeps each registration. */
const STUB = `await page.addInitScript(() => {
  window.__tools = {};
  document.modelContext = { registerTool: (tool) => { window.__tools[tool.name] = tool; } };
});
await page.goto('${SITE_URL}?analytics_agent=claude&analytics_purpose=exploring');
await page.waitForFunction(() => window.__tools?.get_settings);
const out = await page.evaluate(() => window.__tools.set_settings.execute({ shape: 'dunes', mode: '3d' }));`;

/** The guidance for agents, at the top of llms.txt and in docs/webmcp.md. */
function agentsMd(level: string): string {
  return `${level} For AI agents

Pick the way that fits your tools:

1. **Over HTTP only:** read these docs and build playground links from the URL keys below. Plain HTTP cannot run the tools.
2. **In a browser without native WebMCP**, which is most headless and agent browsers: open a link with URL keys, or capture the tools with a stub before the page loads, then call each tool's \`execute(input)\`. With Playwright:

\`\`\`js
${STUB}
\`\`\`

   \`execute\` returns a promise of the tool's result. Puppeteer works the same with \`page.evaluateOnNewDocument\`.
3. **In a browser with native WebMCP:** call the tools listed below.

**A small request.** If you are happy to, add \`?analytics_agent=<name>&analytics_purpose=<purpose>\` to the first playground URL you open, or call \`identify_agent\` once. It tells the maintainer that an agent visited and why, so agent visits are counted apart from people. It is optional, and the playground works the same either way. Only these two values are recorded, from fixed lists, and nothing about the person you work for. Use \`testing\` while you develop or check this site, and \`demo\` for a demo or video. To send nothing at all, add \`?analytics_optout=all\` instead. The About page, ${SITE_URL}about, says what is collected.

- Names: ${NAME_LIST()}. \`chatgpt\` covers ChatGPT and Codex. Use \`other\` when yours is not listed.
- Purposes: ${PURPOSE_LIST()}.`;
}

function toolsList(): string {
  return TOOL_DEFS.map((t) => `- \`${t.name}\`${t.readOnly ? ' (read-only)' : ''}: ${t.description}`).join('\n');
}

function webmcpMd(): string {
  return `# WebMCP tools

In browsers that support [WebMCP](https://github.com/webmachinelearning/webmcp), the playground page registers these tools with \`document.modelContext.registerTool()\`. Older builds that expose \`navigator.modelContext\` are used as a fallback. Without either, nothing is registered and the page works as normal.

${agentsMd('##')}

Written against the spec at webmachinelearning/webmcp commit \`d0e4e0e0f039358cc9d93f90074116622bfebd53\` (${WEBMCP_SPEC}). Tools are removed by aborting their registration \`AbortSignal\`, and read-only tools set \`annotations.readOnlyHint\`.

${toolsList()}

## Input schemas

${TOOL_DEFS.map((t) => `### ${t.name}\n\n\`\`\`json\n${JSON.stringify(t.inputSchema, null, 2)}\n\`\`\``).join('\n\n')}

## Place tools

A region is \`?region=west,south,east,north\` in degrees, or JSON such as \`{"bbox":[28.45,40.78,29.65,41.36]}\`. Named examples: ${PLACES.map((p) => `\`place=${p.id}\` (${p.name})`).join(', ')}. Istanbul is the whole metro area, about 101 × 64 km, Cyprus the whole island, about 261 × 166 km, and each landscape a box of 30 to 80 km around its main feature. A region draws its real heights; the seed, the terrain params and \`motion.warp\` have no effect on it. In the page, the **Map** button picks a region, and its Apply also switches to 3D with \`lc=36&lw=0&lo=0.9&ix=4&ex=block&ev=0.12&az=341.8&ce=39.3&rd=1.32\`; Cyprus and each landscape set their own \`ev\`, \`az\` and \`ce\`. \`set_region\` sets the same view. A minimap above the dock shows the applied area; in 3D it turns with the camera, and its compass turns the camera back to north up, which is azimuth 0.

${REGION_TOOL_DEFS.map((t) => `- \`${t.name}\`${t.readOnly ? ' (read-only)' : ''}: ${t.description}`).join('\n')}

${REGION_TOOL_DEFS.map((t) => `### ${t.name}\n\n\`\`\`json\n${JSON.stringify(t.inputSchema, null, 2)}\n\`\`\``).join('\n\n')}
`;
}

const DOC_EXTRAS = [{ title: 'WebMCP tools', path: 'docs/webmcp.md', body: webmcpMd }];

function paramsMd(): string {
  const rows = PARAMS.map((p) =>
    `| \`${p.group}.${p.key}\` | \`${p.attr}\` | ${p.min} to ${p.max}${'integer' in p ? ' (integer)' : ''} | ${p.default} | ${p.description} |`);
  const shapes = SHAPES.map((s) => `| \`${s.id}\` | ${s.name} | ${s.description} |`);
  const looks = LOOKS.map((l) => `- \`${l.id}\` (${l.name}): \`${JSON.stringify(l.settings)}\``);
  return `# Parameters

Every setting, generated from \`packages/core/src/params.ts\`. Out-of-range values are clamped; integers are rounded.

| Setting | Element attribute | Range | Default | What it does |
|---|---|---|---|---|
${rows.join('\n')}

Other settings:

- \`look\` (attribute \`look\`, React prop \`look\`): one of the looks below, by id. It sets the shape, seed, groups, colours and camera pose. The other settings next to it override its values. An unknown look is ignored with one console warning. In \`update()\`, a look replaces the design and keeps the view: \`mode\`, \`elevation\`, \`extent\`, \`detail\`, \`quality\`, \`view2d\`, and the camera motion and pan. It also keeps \`column\`, \`scenes\` and \`scene\`.
- \`shape\` (attribute \`shape\`, React prop \`shape\`): one of the shapes below. Unknown shapes fall back to \`${defaultSettings().shape}\` with one console warning.
- \`location\` (attribute \`location\`, React prop \`location\`): a real place instead of the generated terrain. A built-in id (${LOCATIONS.map((l) => `\`${l.id}\``).join(', ')}), or a height grid \`{ samples, size, aspect }\` such as one from \`fetchLocation()\`. A built-in id also sets \`camera.azimuth\`, \`camera.elevation\`, \`camera.radius\`, \`elevation\`, \`extent: 'block'\`, \`lines\` (\`{ count: 36, width: 0, opacity: 0.9, indexEvery: 4 }\`) and \`layout.fade: 0.15\`, under the values you set. It does not set \`mode\`. Default \`null\`, the generated terrain. Unknown ids fall back to \`null\` with one console warning. See [api.md](api.md).
- \`seed\` (attribute \`seed\`): integer 0 to 999999. The same seed gives the same terrain; 0 is the original look.
- \`theme.mode\` (attribute \`theme\`): \`auto\` (follows the OS), \`light\` or \`dark\`.
- \`theme.ink\` / \`theme.paper\` (attributes \`ink\`, \`paper\`): any CSS colour; paper may be \`transparent\`. Without them, the CSS variables \`--topographic-ink\` and \`--topographic-paper\` are used, then the mode defaults.
- \`mode\` (attribute \`mode\`): \`2d\` (the library default) or \`3d\`. The playground opens a bare URL on Istanbul in 3D; see llms.txt. 3D draws the same contour field as a terrain. The same seed gives the same map in both.
- \`elevation\` (attribute \`elevation\`): 0 to 1, default 0.62. 3D height. 0 is flat like the 2D map; higher values make the terrain taller, with a rounded crest.
- \`extent\` (attribute \`extent\`): \`endless\` (default) continues the terrain past the view. \`block\` is a finite tabletop whose cut sides carry thin ink layer lines.
- \`detail\` (attribute \`detail\`): 0 to 1, default 0.5. Mesh resolution, from 32² to 160². Use a low value on a slow device.
- \`quality\` (attribute \`quality\`): \`auto\` (default), \`low\`, \`medium\` or \`high\`. \`auto\` starts a phone at low and a desktop at high, then steps down if frames miss 60 Hz, or 120 Hz once that refresh has been seen. It does not step back up. The other values stay put. The tier caps the pixel ratio, the pixel count and the mesh size.
- \`camera.azimuth\` (attribute \`azimuth\`): degrees around the terrain. Any finite number. Default 349.7.
- \`camera.elevation\` (attribute \`camera-elevation\`): degrees above the horizon, 2 to 80. The camera never goes below the terrain. Default 33.6.
- \`camera.radius\` (attribute \`radius\`): distance from the terrain centre, ${RADIUS_MIN} to ${RADIUS_MAX}. Default ${defaultSettings().camera.radius}.
- \`camera.motion\` (attribute \`camera-motion\`): \`still\` (default), \`orbit\`, \`push\`, \`flyover\` or \`drone\`. The terrain's own \`motion.speed\` still morphs the field, so the two motions are independent.
- \`camera.speed\` (attribute \`camera-speed\`): 0 to 3, default 1. How fast the camera moves along its path. 1 is the path's own pace, such as an orbit in about 26 seconds; 0 holds the camera.
- \`camera.panX\` / \`camera.panZ\` (attributes \`pan-x\`, \`pan-z\`): where the camera looks, moved from the terrain centre across the ground (east and south), -6 to 6, default 0. The camera and every motion path turn around that point. The renderer keeps it over the terrain.

## Shapes

| Id | Name | Description |
|---|---|---|
${shapes.join('\n')}

## Looks

A look is a named, finished design. The order is the order of the playground's dock. \`survey-map\` and \`rocky\` set no colours, so they follow the page's theme.

${looks.join('\n')}
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

- \`settings\`: partial settings, see [params.md](params.md). Fields: \`{ look, shape, location, seed, lines, terrain, motion, layout, theme, mode, elevation, extent, detail, quality, camera, column, scenes, scene }\`. \`mode\` is \`'2d' | '3d'\` and defaults to \`'2d'\`. \`quality\` is \`'auto' | 'low' | 'medium' | 'high' | 'full'\` and defaults to \`'auto'\`. \`full\` is high without its pixel caps. \`auto\` starts a phone at low and a desktop at high, then steps down if presented frames miss 60 Hz, or 120 Hz once a frame under 12 ms has been seen. It does not step back up.
- \`column\`: half the width of the faded centre column in CSS px, default 300.
- \`scenes\`: up to 8 \`{ shape, ink? }\` scenes that blend in 2D, each with its own line colour. \`scene\` is the target's index. A new target fades in by \`1 - exp(-dt * 4.5)\` a frame (dt at most 0.05 s). With scenes set, a theme mode change fades the dark amount by \`1 - exp(-dt * 6)\`.
- \`options\`: \`{ maxPixelRatio = 2, maxPixels = 4147200, maxFps = 0, powerPreference, forceWebGL1 = false, benchmark = false }\`. \`powerPreference\` is passed to the WebGL context; without it a phone asks for \`low-power\` and other devices for \`default\`. \`maxFps\` caps the frame rate; 0 draws every display frame. \`benchmark\` keeps a 3D view drawing while it is visible so \`stats\` can be read.

Instance:

- \`update(partialSettings, { instant? })\`: merges, clamps and applies live. Only changed uniforms reach the GPU. \`instant: true\` jumps to the target scene and dark amount instead of fading.
- \`setOptions({ maxPixelRatio?, maxPixels?, maxFps? })\`: changes those options live.
- \`blend\`: \`{ weights, dark }\`, the scene weights and the dark amount drawn now.
- \`snapshot({ frame?, width?, height?, region?, motion?, patch?, field? }) => Promise<Blob>\`: renders one PNG off-screen. \`frame\` is the animation time in ms. Give one side to keep the aspect ratio. \`region\` (\`{ x, y, width, height }\`, fractions from the top-left) keeps only that slice of the view, drawn at full detail. \`motion\` draws the 3D view along that camera path at its pose for \`frame\`, like that moment of \`record\`. \`patch\` and \`field\` draw this image from temporary settings and a temporary height grid, then put the live view back, so the page does not flash and a second WebGL context is not required. The live canvas is not resized. Rejects without WebGL. In 3D it includes the current camera.
- \`record({ seconds?, fps?, width?, height?, frame?, format?, motion? }) => Promise<Blob>\`: renders a 3D clip with a moving camera. \`format\` is \`'mp4'\` (default) or \`'webm'\`. \`motion\` is \`orbit\`, \`push\`, \`flyover\`, \`drone\` or \`still\`. The live canvas is not resized. Rejects without WebGL or when the browser cannot encode that format.
- \`setHeightfield({ samples, size, aspect } | null)\`: draws your own height grid until the \`location\` setting changes. \`null\` brings back the generated terrain.
- \`setInsets({ top, right, bottom, left } | null)\`: the space page UI covers on each side of the view, in CSS px. The 3D picture slides (a lens shift, not a camera move) so the terrain centres in the part left free. 2D, \`snapshot\` and \`record\` ignore it and centre in their own frame. \`insets\` reads it back.
- \`clampPan(panX, panZ) => [x, z]\`: the pan kept over the terrain as it is drawn now.
- \`pose\`: \`{ azimuth, elevation, radius, panX, panZ }\`, where the 3D camera is now along its path.
- \`stats\`: \`{ fps, frameMs, mesh, quality }\` while a 3D view is drawing. \`frameMs\` is the time spent drawing one frame. \`mesh\` is the segments along one side, or 0 in 2D. \`quality\` is the tier actually drawing: \`low\`, \`medium\` or \`high\`.
- \`destroy()\`: stops the loop, removes observers and the canvas, and releases the WebGL context.
- \`settings\`: the current resolved settings.
- \`status\`: \`'webgl2' | 'webgl1' | 'fallback' | 'lost' | 'destroyed'\`.
- \`canvas\`: the canvas element.

Behaviour:

- Uses WebGL2, then WebGL1. Without either, or while the context is lost, the element shows the paper colour. A restored context resumes. If the browser never restores it, the canvas is replaced and the view comes back on its own. Drawing does not call \`gl.finish\`, and the backing store is left alone when a resize reports the same size.
- \`prefers-reduced-motion: reduce\` renders a single still frame. A scene or dark fade still runs to its end first.
- Animation pauses when the element is off-screen or the tab is hidden.
- Pixel budget: \`quality\` caps the device pixel ratio, the pixel count and the mesh. \`maxPixelRatio\` and \`maxPixels\` are the ceiling above that.

## <topographic-view>

\`import 'topographic/element'\` registers the element. Attributes: \`look\`, \`shape\`, \`location\`, \`seed\`, \`theme\`, \`ink\`, \`paper\`, \`mode\`, \`elevation\`, \`extent\`, \`detail\`, \`quality\`, \`azimuth\`, \`camera-elevation\`, \`radius\`, \`camera-motion\`, \`camera-speed\`, \`pan-x\`, \`pan-z\`, \`column\`, \`scenes\` (JSON), \`scene\`, plus one per numeric setting (see [params.md](params.md)). Attribute changes apply live, and a removed attribute returns to its default. \`element.topographic\` is the instance, and \`element.snapshot(opts)\` is a shortcut.

## React: <Topography> and useTopography

\`<Topography look shape location lines terrain motion layout theme seed mode elevation extent detail quality camera options onReady {...divProps}>\` renders a div with the background, and children on top. It is SSR-safe: the server renders an empty div.

\`useTopography(settings, options)\` returns a ref to put on any element. \`ref.topographic\` is the instance while mounted.

## topographic/locations

\`import { LOCATIONS, loadLocation, fetchLocation } from 'topographic/locations'\`.

- \`LOCATIONS\`: the built-in places, each \`{ id, name, bbox, aspect, defaults }\`. \`defaults\` is \`{ camera: { azimuth, elevation, radius }, elevation, extent, lines, layout }\`.
${LOCATIONS.map((l) => `  - \`${l.id}\`: ${l.name}, west ${l.bbox.west}, south ${l.bbox.south}, east ${l.bbox.east}, north ${l.bbox.north}`).join('\n')}
- \`loadLocation(id) => Promise<{ samples, size, aspect, minMeters, maxMeters, zoom }>\`: a built-in place's 256 × 256 grid. Each place is its own dynamic import of 35 to 150 KB (25 to 115 KB compressed), so a page downloads only the places it uses. The \`location\` setting calls it for you.
- \`fetchLocation({ west, south, east, north }, { relief?, smooth?, tiles?, signal? }) => Promise<{ samples, size, aspect, minMeters, maxMeters, zoom, tiles }>\`: downloads Terrarium elevation tiles (AWS Open Data) for any area and makes the same 256 × 256 grid as the playground. The shorter side must be at least ${AREA_LIMITS.minSideM / 1000} km, the longer side at most ${AREA_LIMITS.maxSideM / 1000} km, and the sides within ${AREA_LIMITS.maxAspect}:1. \`relief\` is \`dramatic\` (default) or \`measured\`; \`smooth\` is \`light\`, \`medium\` (default) or \`strong\`; \`tiles\` is a Terrarium URL template with \`{z}\`, \`{x}\` and \`{y}\`. Pass the result as \`location\`.
- \`decodeGrid16(bytes) => Promise<{ samples, size }>\`: reads a grid saved as a square 16-bit greyscale PNG, north at the top, the format of the built-in places.
- \`areaProblem(bbox)\` returns \`'order' | 'small' | 'large' | 'aspect' | null\`, and \`areaSpan(bbox)\` the size in metres.

## Helpers

\`resolveSettings\`, \`mergeSettings\`, \`toUniforms\`, \`fromAttributes\`, \`toAttributes\`, \`toQuery\`, \`fromQuery\`, \`parseColor\`, \`resolveTheme\`, plus the data exports \`PARAMS\`, \`SHAPES\` and \`LOOKS\`, and \`findLook(id)\`.
`;
}

const PAGES = () => [
  { title: 'Install', path: 'docs/install.md', body: installMd },
  { title: 'API', path: 'docs/api.md', body: apiMd },
  { title: 'Parameters, shapes and looks', path: 'docs/params.md', body: paramsMd },
  ...DOC_EXTRAS,
];

function llmsTxt(): string {
  return `# topographic

> ${TAGLINE}

Live playground: ${SITE_URL}

${agentsMd('##')}

## First view and default mode

- The library (\`topographic\`, \`<topographic-view>\`, \`topographic-react\`) draws in 2D unless you set \`mode: '3d'\`.
- The playground opens a bare URL, with no settings or region keys, on the built-in Istanbul map terrain in 3D, with the camera pushing in and back at speed 0.2 (\`?${HOME_QUERY}\`).
- A URL with \`place\` or \`region\` and no settings keys opens that place with \`?${REGION_ONLY_QUERY}\`.
- A playground URL with any settings key, such as \`?s=dunes\` or \`?look=night-lobes\`, is 2D unless it has \`mode=3d\`.
- The page rewrites the address bar to the shortest query for the same view. It drops keys that have the default value, so \`?s=dunes&mode=2d\` becomes \`?s=dunes\`, and the view stays 2D.

## URL state

The playground keeps its state in short query params. It writes only the values that differ from a base: the shape's defaults, or a library look by id such as \`look=night-lobes\` (the ids in [params.md](docs/params.md) > Looks). Other params override the look's values.

Examples:

- \`?s=dunes&lc=24\`
- \`?look=night-lobes&mode=3d&cm=orbit\`
- \`?s=gentle-summit&seed=4&m=dark&ink=9fb0cc&paper=0b0b0d\`

### Keys

- \`look\`: a look id. Links made before 0.6.0 use the same ids.
- \`s\`: shape.
- \`seed\`: seed
${PARAMS.map((p) => `- \`${p.short}\`: ${p.label.toLowerCase()}`).join('\n')}
- \`m\`: theme, light, dark or auto
- \`ink\`, \`paper\`: colours, as hex without \`#\`
- \`mode\`: \`3d\` or \`2d\`; only \`3d\` is written, because 2D is the default once any settings key is set
- \`ex\`: extent; only \`block\` is written, endless is the default
- \`ev\`: elevation
- \`dl\`: detail
- \`ql\`: quality; only \`low\`, \`medium\` or \`high\` is written, auto is the default
- \`az\`, \`ce\`, \`rd\`: camera azimuth, elevation and radius
- \`cm\`: camera motion
- \`px\`, \`pz\`: pan, written only when off centre

The library's default camera is not written: azimuth 349.7, elevation 33.6, radius 1.92. The page updates the URL a few times a second at most, and again when a drag or pinch ends.

## Real places

- **A box:** \`?region=west,south,east,north\`, or JSON \`{"bbox":[west,south,east,north]}\`.
- **A named place:** ${PLACES.map((p) => `\`place=${p.id}\``).join(', ')}, or one of the Map menu's other places: ${CATALOG.filter((p) => p.grid).map((p) => `\`${p.id}\` (${p.name})`).join(', ')}.
- **With settings:** place params combine with the others, such as \`?look=night-lobes&lc=40&place=istanbul\`.

While the heights load, the page sets \`data-loading=terrain\` and hides the default terrain, and \`get_region\` returns \`loading: true\` with the message \`Loading terrain\`.

## Controls

- **3D:** drag to pan; right drag, or Shift, ⌘ or Ctrl with a drag, to turn; scroll to zoom; double-click to recentre.
- **2D:** a horizontal drag changes \`layout.anchor\`. 0 keeps the summit to the side, and 1 centres it.

## Page

- **Dock:** terrain previews, with a chevron that scrolls to the next one.
- **Theme and colours:** theme, shuffle and the two colours sit in a 2×2 grid.
- **Link tab:** shows a labelled still of the terrain the link opens.
- **Share image:** \`og.png\`, Everest in 3D beside the headline and the code that draws it, with \`twitter:card\` set to \`summary_large_image\`. The docs page uses \`og-docs.png\`.

## Packages

- [topographic](https://www.npmjs.com/package/topographic): core and the \`<topographic-view>\` web component
- [topographic-react](https://www.npmjs.com/package/topographic-react): React component and hook

## Docs

${PAGES().map((p) => `- [${p.title}](${p.path})`).join('\n')}
- [Everything in one file](llms-full.txt)

## WebMCP tools on the playground page

${toolsList()}

Place tools:

${REGION_TOOL_DEFS.map((t) => `- \`${t.name}\`${t.readOnly ? ' (read-only)' : ''}: ${t.description}`).join('\n')}

Details and input schemas: [docs/webmcp.md](docs/webmcp.md).

## Analytics

The playground counts visits and tool use without cookies, and counts AI agents apart from people. Browsers run by automation, such as Playwright, count as agents by themselves. Identifying is optional; see "For AI agents" at the top of this file.

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

const attr = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * The playground's index.html with the head of /docs: its title, description, canonical address and share image,
 * and the font weights the docs page uses. The host serves /docs from the docs.html this makes.
 */
export function docsHead(html: string): string {
  const m = DOCS_META;
  const meta = (key: 'name' | 'property', name: string, content: string) => (h: string) =>
    h.replace(new RegExp(`(<meta ${key}="${name}" content=")[^"]*(")`), `$1${attr(content)}$2`);
  const steps = [
    (h: string) => h.replace(/<title>[^<]*<\/title>/, `<title>${attr(m.title)}</title>`),
    meta('name', 'description', m.description),
    meta('property', 'og:title', m.title),
    meta('property', 'og:description', m.description),
    meta('property', 'og:url', m.url),
    meta('property', 'og:image', m.image),
    meta('property', 'og:image:alt', m.imageAlt),
    meta('name', 'twitter:title', m.title),
    meta('name', 'twitter:description', m.description),
    meta('name', 'twitter:image', m.image),
    meta('name', 'twitter:image:alt', m.imageAlt),
    (h: string) => h.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${m.url}$2`),
    (h: string) => h.replace('family=Inter:wght@400;500&', 'family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&'),
  ];
  return steps.reduce((h, step) => step(h), html);
}

export function docsPlugin(): Plugin {
  return {
    name: 'topographic-docs',
    enforce: 'post',
    // In development every page is served from index.html, so /docs gets its head here.
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const path = (ctx.originalUrl ?? ctx.path).split('?')[0];
        return /\/docs\/?$/.test(path) ? docsHead(html) : html;
      },
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const base = server.config.base.startsWith('/') ? server.config.base : '/';
        const url = (req.url ?? '').split('?')[0];
        const path = (url.startsWith(base) ? url.slice(base.length) : url).replace(/^\//, '');
        // The docs page. Without this, Vite would answer /docs with this plugin's own docs.ts.
        if (path === 'docs' || path === 'docs/') { req.url = `${base}index.html`; return next(); }
        const body = buildDocs()[path];
        if (body === undefined) return next();
        res.setHeader('content-type', `${path.endsWith('.md') ? 'text/markdown' : 'text/plain'}; charset=utf-8`);
        res.end(body);
      });
    },
    generateBundle(_options, bundle) {
      for (const [fileName, source] of Object.entries(buildDocs())) this.emitFile({ type: 'asset', fileName, source });
      const index = bundle['index.html'];
      if (index?.type !== 'asset') throw new Error('topographic-docs: no index.html in the bundle to make docs.html from');
      this.emitFile({ type: 'asset', fileName: 'docs.html', source: docsHead(String(index.source)) });
    },
  };
}
