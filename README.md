<h1 align="center">topography</h1>

![The topography generator in dark mode: contour lines drift behind the page, and the settings panel sits on the right](assets/screenshots/generator-dark.png)

## What is topography

topography draws animated contour lines, like a topographic map, as a background for your website.

A plain background is quiet but flat, and a video or image is heavy and never quite fits. topography is one small WebGL shader that draws soft, slowly moving terrain behind your content. You pick a terrain style, tune it with a few readable settings, and it fits any size of screen.

> Status: early, not published to npm yet.

## How it works

1. **Pick a style**, the shape of the terrain: dunes, granite, a gentle summit, a long ridge and more.
2. **Tune it** with readable settings in four groups: lines, terrain, motion and layout. Out-of-range values are clamped.
3. **Give it colours.** Ink and paper come from your settings or from CSS variables, and follow light and dark mode.
4. **Drop it in** as a web component, a React component or one JavaScript call. The same `seed` gives you the same terrain every time.

It pauses when it's off-screen or the tab is hidden, shows a still frame for people who prefer reduced motion, and falls back to the paper colour where WebGL isn't available.

## Quick start

```sh
npm install @yahyabedirhan/topography
```

**Web component:**

```html
<script type="module">import '@yahyabedirhan/topography/element';</script>

<topography-bg style-name="dunes" line-count="30"></topography-bg>
```

**React** (`npm install @yahyabedirhan/topography-react`):

```tsx
import { Topography } from '@yahyabedirhan/topography-react';

<Topography styleName="granite" terrain={{ roughness: 0.3 }} style={{ height: '100vh' }} />
```

**Vanilla JavaScript:**

```js
import { createTopography } from '@yahyabedirhan/topography';

const topography = createTopography(document.querySelector('#hero'), { style: 'gentle-summit' });
topography.update({ terrain: { peaks: 3 } });
```

## Styles and presets

![The seven styles: drifting lobes, granite, five petals, seed pod, gentle summit, long ridge and dunes](assets/screenshots/styles.png)

There are seven styles: **drifting lobes, granite, five petals, seed pod, gentle summit, long ridge** and **dunes**. Presets are ready-made starting points on top of them, like **Survey map**, **Terraces** and **Rocky**.

## The generator

The generator is the project's own page. The page background is the live preview: pick a preset, move the sliders, and copy the result as HTML, React, vanilla JS or a config JSON, or download it as a PNG up to 4K. The settings live in the URL, so a link brings the same background back.

```sh
npm install
npm run dev
```

## Built for agents too

The generator serves plain-text docs at `/llms.txt` and `/llms-full.txt`, plus markdown pages for install, API and every parameter. These are generated from the same table the code uses, so they can't drift.

In browsers with [WebMCP](https://github.com/webmachinelearning/webmcp), the page also registers tools, so an agent can list styles, read and change the settings, randomize, take a screenshot and get embed code without clicking around.

## Learn more

The [guide](docs/guide.md) covers the rest: every API, every setting with its range, theming and CSS variables, the seed, PNG export, performance and accessibility, fallbacks, server rendering and Next.js, the WebMCP tools, and troubleshooting. The [design](docs/low-level-design.md) explains how the pieces fit and why.

## Build from source

You need Node.js 20 or later.

```sh
npm install
npm test          # unit tests
npm run build     # packages and the generator
npm run smoke     # headless Chrome checks (needs Chrome; set CHROME=/path/to/chrome)
```

The shader is ported from the author's personal website prototype, where every style renders the same as the original. The architecture was inspired by [Paper Shaders](https://github.com/paper-design/shaders).

## Licence

MIT. See [LICENSE](LICENSE).
