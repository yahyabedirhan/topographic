# topographic: design

topographic draws topographic backgrounds (animated contour lines, like a topographic map) with one WebGL shader. You pick a **shape** (the basic form of the terrain) and tune readable **settings**. The same core powers a vanilla JS API, a `<topographic-view>` web component, a React `<Topography>` component, and a playground site that exports what you build.

```js
import { createTopography } from 'topographic';
const topography = createTopography(el, { shape: 'dunes', lines: { count: 30 } });
```

## Requirements
1. Render an animated contour field with WebGL, full-bleed behind content.
2. Choose a shape and tune readable settings, grouped as `lines`, `terrain`, `motion` and `layout`.
3. A `seed` varies a shape reproducibly.
4. Colours: `ink` and `paper`, taken from CSS variables, with automatic dark mode. Paper can be transparent.
5. Settings update live, without remounting.
6. The playground has sliders, looks, randomize, state in the URL, and exports an embed snippet and a PNG.
7. Out-of-range values are clamped. An unknown shape falls back to the default shape and logs one warning.
8. Reduced motion shows one still frame. Animation pauses when off-screen or when the tab is hidden. A pixel budget caps GPU cost.
9. If WebGL is missing or the context is lost, the element shows the paper colour. A restored context resumes rendering.
10. In scope:
    - core, web component, React wrapper
    - 7 shapes: dunes, granite, drifting lobes, five petals, seed pod, gentle summit, long ridge
    - the playground, built in React
11. Out of scope for now: SVG and video export, multi-colour palettes, Vue/Svelte wrappers, the 6 other prototype shapes (spiral, twin peaks, caldera, archipelago, terraced plateau, river valley).

## Entities and relationships
- **Renderer**: owns the canvas, the WebGL program, the frame loop, observers and the pixel budget. It is created by `createTopography` and is the only thing that touches WebGL.
- **Settings**: the full, validated value object (`shape`, `seed`, `lines`, `terrain`, `motion`, `layout`, `theme`, the view settings, `location`, `column`, `scenes` and `scene`). The `params` table defines each field's name, range, default and uniform slot.
- **Shape**: data, not code. `{ id, name, index, notes }`. `index` selects a branch in the one combined shader.
- **Scene**: data. `{ shape, ink? }`, one part of a blended background. `scenes` lists them and `scene` names the target. The Renderer keeps a weight per scene and a dark amount, and fades them toward their targets each frame.
- **Look**: data. `{ id, name, settings: Partial<Settings> }`, a named, finished design. Looks live in core, so every wrapper and the playground's dock share them. The `look` setting names one by id.
- **Theme**: resolves `ink` and `paper` from settings, then CSS variables (`--topographic-ink`, `--topographic-paper`), then light/dark defaults.
- **`<topographic-view>`**: a custom element. Attributes become Settings, and it holds one Renderer.
- **React `<Topography>`** and **`useTopography`**: props become Settings, and they hold one Renderer.
- **Playground**: a React app, the client-only island of an Astro site that also renders /about and /docs as HTML. Its state is Settings, mirrored in the URL. Export uses `snapshot`, `record` and the embed serializer. The place picker turns a map region into a heightfield and hands it to `setHeightfield`. A built-in place's grid comes from the library. A catalog place's grid is a static 16-bit PNG in `public/places/`, made by `scripts/places.mjs` with the library's pipeline and decoded with `decodeGrid16`; if the file fails, the worker reads the elevation tiles with `fetchLocation`. Any other region always reads the tiles.

Flow: wrapper → Settings (via the params table) → Renderer → uniforms → shader.

## Modules and files
```
packages/core/src/
  index.ts               public exports
  renderer.ts            Renderer: GL, loop, observers, budget, context loss, scene fades
  params.ts              the single table: name, group, range, default, uniform slot
  settings.ts            resolve, clamp, merge, serialize to attributes and URL
  shapes.ts           Shape records (7)
  looks.ts               Look records
  theme.ts               ink/paper resolution, dark mode, CSS variables
  shader/common.glsl.ts  noise, smooth-min, line drawing
  shader/topographic.glsl.ts  combined height field, branch per shape
  element.ts             <topographic-view> custom element
packages/react/src/Topography.tsx   <Topography>, useTopography
apps/playground/
  astro.config.ts        the Astro site: static output, React islands, the client router
  llms.ts                llms.txt, llms-full.txt and docs/*.md, written by the build
apps/playground/src/
  pages/                 index.astro (the playground island), about.astro, docs.astro
  layouts/Base.astro     every page's head, the client router and the start-up script
  meta.ts                each page's title, description and share image
  boot.ts                error reporting, analytics and the pageview of each page change
  Playground.tsx         the playground island: App inside its error boundary
  App.tsx                the page: the glass frame, the tune strip and the export menu
  ui.tsx                 the dock, the top-right buttons, the tune sliders and the 3D view settings
  shared.tsx             usePlayground: Settings state, the live instance, colours
  exporting.tsx          the export menu: link, PNG, video, React, HTML, JSON
  looks.ts               the looks in the dock
  url.ts  embed.ts  png.ts  content.ts   URL state, embed code, PNG download, package names
  agent-tools.ts  webmcp.ts   WebMCP tools
  region/                the place picker: map (MapLibre, lazy), tile worker, pipeline, region tools,
                         and the place catalog (catalog.json, loaded when the Map opens) with its search
```
`params.ts` is the single source of truth. Types, element attributes, React props, playground sliders and docs are all derived from it.

## Copied modules
The privacy, analytics and error modules in `apps/playground/src` are copied on purpose in two other sites.
They are `consent.ts`, `actor.ts`, `visitor.ts`, `analytics.ts`, `posthog.ts`, `sentry.ts` and `errors.ts`.
`yahyabedirhan/shipyard` keeps them in `site/src`, with the same file names.
`yahyabedirhan/personal-website` keeps an equivalent in `src/privacy.js`, `src/analytics.js` and `src/errors.js`, with the levels full, pageviews and off and keys without a prefix.
A change to one of them is made in all three.

## Public API
```ts
const topography = createTopography(el: HTMLElement, settings?: Partial<Settings>);
topography.update(partial: Partial<Settings>, opts?: { instant?: boolean }): void;   // live, merges and clamps
topography.setOptions(opts: { maxPixelRatio?: number; maxPixels?: number; maxFps?: number }): void;   // pixel budget and frame cap, live
topography.blend: { weights: number[]; dark: number };   // scene weights and dark amount drawn now
topography.snapshot(opts?: { frame?: number; width?: number; height?: number; region?: SnapshotRegion; motion?: CameraMotion }): Promise<Blob>;
// renders off-screen at the given size and frame; the live canvas is not resized
topography.destroy(): void;
```
```html
<topographic-view shape="dunes" line-count="30" seed="7"></topographic-view>
```
```tsx
<Topography shape="granite" terrain={{ roughness: 0.4 }} />
const ref = useTopography({ shape: 'seed-pod' });
```
Settings groups:
- `lines`: count, width, opacity, indexEvery
- `terrain`: peaks, spread, roughness, sharpness, terracing, variant
- `motion`: speed, warp, sparkle
- `layout`: anchor, fade

Top-level settings beside the groups:
- `column`: the faded centre column's half-width in CSS pixels, default 300.
- `scenes`: up to 8 `{ shape, ink? }` scenes to blend in 2D; empty draws `shape` alone.
- `scene`: the target scene's index. A change fades: each weight moves by `1 - exp(-dt × 4.5)`, `dt` at most 0.05 s. With scenes set, a theme mode change fades the dark amount by `1 - exp(-dt × 6)`; `update(patch, { instant: true })` jumps both.
- Renderer options `maxFps` (a frame rate cap) and `powerPreference` (passed to the WebGL context).
- `quality: 'full'`: the high tier without its pixel caps, so only `maxPixelRatio` and `maxPixels` apply.

Ranges are 0–1 except counts. The land shape is `shape` everywhere: in settings, as the element attribute and as the React prop. `style` stays the HTML and React CSS attribute.

## Traced flow
**Happy path.** `createTopography(el, { shape: 'dunes' })` runs these steps:
1. Settings are resolved: defaults, then the shape's defaults, then the look, then the input; values are clamped.
2. Theme reads the CSS variables.
3. The Renderer compiles the shader and maps Settings to uniforms.
4. Observers start, and the frame loop draws.
5. Each `update` clamps, merges and sends only the uniforms that changed.

**Scenes path.** `createTopography(el, { scenes, scene })` starts with the target scene's weight at 1 and the dark amount on the theme. On each frame the Renderer moves the weights and the dark amount toward their targets (`stepBlend`), mixes the light and dark theme colours by the dark amount, and sends one weight, shape index and ink per scene. The 2D shader draws each scene with a weight above 0.002 through the same contour paint and divides the colour sum by the weight sum. The `maxFps` option skips display frames, and the next drawn frame takes the whole time step.

**Rejection paths.**
- `shape: 'volcano'` → one warning, and the default shape is used.
- `lines.count: 500` → clamped to the maximum.
- No WebGL → no canvas is drawn; the element shows the paper colour and `snapshot` rejects.
- Context lost → paper colour is shown and the loop stops. When the context is restored, the program is recompiled and rendering resumes.
- Reduced motion → one still frame, and `motion.speed` is ignored. A scene or dark fade still runs to its end on a still terrain, then drawing stops.

## Extensibility
| To add | Touch |
|---|---|
| A setting | `params.ts` row, plus its use in `topographic.glsl.ts` |
| A shape | `shapes.ts` record, plus a branch in `topographic.glsl.ts` |
| A look | `looks.ts` record and its `LookId` |
| A wrapper (Vue, Svelte) | a new package calling `createTopography` |
| An export format | `apps/playground/src/exporting.tsx` (SVG later needs a CPU port of the height field) |

## Decisions
- **One combined shader; the shape is data.** It's simpler to ship and to switch shapes live. The cost is that one shader carries every branch.
- **Grouped, readable setting names, normalised to 0–1.** This is the public contract and is costly to change later.
- **Looks in core**, shared by all wrappers and the playground.
- **Colours through CSS variables**, with dark mode and transparent paper. Palettes come later.
- **Pixel budget** (minimum pixel ratio plus maximum pixel count) instead of a simple DPR cap.
- **Fallback, not exceptions,** when WebGL is missing or lost.
- **`snapshot` renders off-screen**, so exports never disturb the live view.
- **Scenes blend in one pass of the 2D shader.** Each scene runs the shared contour paint with its own ink, so a scene draws the same pixels as that shape alone. The blend reproduces the yahyapak.dev background, which was generated from this library; `scripts/blend-check.mjs` compares the two pixel by pixel.
- **Fades only with scenes.** A plain renderer still switches its theme at once, as before 0.7.0.
- **Always spell out "topographic"** in names (element, files, API).
- **License: Apache 2.0,** with a NOTICE file asking for credit.

Architecture inspired by Paper Shaders (github.com/paper-design/shaders at 43cd68db79fa0b1759f72ffc941b3238e2a3954c, Apache-2.0): a vanilla mount class with thin wrappers, presets typed against params, and definitions that drive the controls. No code has been copied. If any is, include their NOTICE and attribution.
