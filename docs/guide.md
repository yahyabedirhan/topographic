# topography guide

Everything you need to use topography, one topic per section. To try settings live, open the [playground](https://yahyabedirhan.github.io/topography/). For how the pieces fit together, see [design.md](low-level-design.md).

- [Install](#install)
- [Three ways to use it](#three-ways-to-use-it)
- [Settings](#settings)
- [Styles](#styles)
- [Presets](#presets)
- [Colours, CSS variables and dark mode](#colours-css-variables-and-dark-mode)
- [Seed](#seed)
- [Snapshots and PNG export](#snapshots-and-png-export)
- [Performance and accessibility](#performance-and-accessibility)
- [Fallbacks](#fallbacks)
- [Server rendering and Next.js](#server-rendering-and-nextjs)
- [The playground](#the-playground)
- [WebMCP tools](#webmcp-tools)
- [Troubleshooting](#troubleshooting)

## Install

```sh
npm install topography.js            # core and the web component
npm install topography-react      # React bindings (needs React 18 or 19)
```

The packages are ESM only, have no dependencies, and are marked side-effect free except `topography.js/element`, which registers the element when imported.

On npm: [`topography.js`](https://www.npmjs.com/package/topography.js) and [`topography-react`](https://www.npmjs.com/package/topography-react).

## Three ways to use it

### Vanilla JavaScript: `createTopography`

```js
import { createTopography } from 'topography.js';

const topography = createTopography(element, settings?, options?);
```

The call puts a canvas inside `element`, which fills it, so give the element a size. It returns an instance:

| Member | What it does |
|---|---|
| `update(partialSettings)` | Merges into the current settings, clamps, and applies live. Only changed values reach the GPU. |
| `snapshot({ frame?, width?, height? })` | Renders one PNG off-screen and resolves to a `Blob`. See [Snapshots](#snapshots-and-png-export). |
| `destroy()` | Stops drawing, removes listeners and the canvas, and frees the WebGL context. |
| `settings` | The current, fully resolved settings. |
| `status` | `'webgl2'`, `'webgl1'`, `'fallback'`, `'lost'` or `'destroyed'`. |
| `canvas` | The canvas element. |

`options` (optional, rarely needed):

| Option | Default | What it does |
|---|---|---|
| `maxPixelRatio` | `2` | Highest device pixel ratio to draw at. |
| `maxPixels` | `4147200` (1920×1080×2) | Upper bound on drawn pixels; the canvas scales down past it. |
| `forceWebGL1` | `false` | Skip WebGL2. Useful for testing. |

### Web component: `<topography-bg>`

```html
<script type="module">import 'topography.js/element';</script>

<topography-bg style-name="long-ridge" line-count="36" peaks="2" theme="dark"></topography-bg>
```

- Every setting has an attribute (listed in [Settings](#settings)), plus `style-name`, `seed`, `theme`, `ink` and `paper`.
- Changing an attribute applies live. Removing one returns it to the style's default.
- `element.topography` is the instance, and `element.snapshot(opts)` is a shortcut for it.
- The element is `display: block`. Size and position it with CSS, for example `position: fixed; inset: 0; z-index: -1`.

### React: `<Topography>` and `useTopography`

```tsx
import { Topography, useTopography } from 'topography-react';

<Topography
  styleName="dunes"
  lines={{ count: 24 }}
  theme={{ mode: 'dark' }}
  style={{ position: 'fixed', inset: 0, zIndex: -1 }}
/>
```

- Props: `styleName`, `seed`, `lines`, `terrain`, `motion`, `layout`, `theme`, `options`, `onReady`, plus any `div` props. Children render on top.
- It's `styleName`, not `style`, because `style` stays React's inline style.
- Each group updates on its own when its values change. Passing a new object with the same values does nothing.
- `onReady(instance)` gives you the instance after mount (for `snapshot`), and `null` on unmount.
- Changing `options` recreates the renderer. Everything else updates in place.

To put it on your own element, use the hook:

```tsx
const ref = useTopography({ styleName: 'seed-pod' });
return <section ref={ref} style={{ height: 400 }} />;
// ref.topography is the instance while mounted
```

## Settings

Settings are grouped. Pass only what you want to change:

```js
{
  style: 'dunes',
  seed: 0,
  lines:   { count, width, opacity, indexEvery },
  terrain: { peaks, spread, roughness, sharpness, terracing, variant },
  motion:  { speed, warp, sparkle },
  layout:  { anchor, fade },
  theme:   { mode, ink, paper },
}
```

Values outside a range are clamped, whole-number settings are rounded, and anything that isn't a number falls back to the default. Some styles start from their own defaults; for example, dunes uses a lighter centre fade.

### Lines

| Setting | Attribute | Range | Default | What it does |
|---|---|---|---|---|
| `lines.count` | `line-count` | 6–60, whole | 30 | How many contour lines cross the field. |
| `lines.width` | `line-width` | 0–1 | 0.26 | Stroke width of each contour line. |
| `lines.opacity` | `line-opacity` | 0–1 | 0.4 | How strongly lines show against the paper. |
| `lines.indexEvery` | `index-every` | 0–10, whole | 5 | Every Nth line is slightly heavier, like a map index contour. 0 turns it off. |

### Terrain

| Setting | Attribute | Range | Default | What it does |
|---|---|---|---|---|
| `terrain.peaks` | `peaks` | 1–6, whole | 1 | Number of summits merged into the terrain. |
| `terrain.spread` | `spread` | 0–1 | 0.5 | How far extra peaks sit from the main summit. |
| `terrain.roughness` | `roughness` | 0–1 | 0 | Noise added to the slopes, from smooth hills to rocky ground. |
| `terrain.sharpness` | `sharpness` | 0–1 | 0.5 | Below 0.5 summits flatten; above 0.5 they steepen. |
| `terrain.terracing` | `terracing` | 0–1 | 0 | Groups lines into stepped bands. |
| `terrain.variant` | `variant` | 0–1 | 0.5 | A style-specific shape knob (for drifting lobes: three lobes to four). |

### Motion

| Setting | Attribute | Range | Default | What it does |
|---|---|---|---|---|
| `motion.speed` | `speed` | 0–3 | 1 | Animation speed. 0 holds a still frame. |
| `motion.warp` | `warp` | 0–1 | 0.47 | How much the lines wobble with the flow. |
| `motion.sparkle` | `sparkle` | 0–1 | 0.6 | Small bright dots travelling along the lines. |

### Layout

| Setting | Attribute | Range | Default | What it does |
|---|---|---|---|---|
| `layout.anchor` | `anchor` | 0–1 | 0 | 0 keeps the summit to the side, 1 centres it. |
| `layout.fade` | `fade` | 0–1 | 0.7 | Fades lines behind a central text column. |

## Styles

| Id | Name | Looks like |
|---|---|---|
| `drifting-lobes` | Drifting lobes | Three soft lobes drifting off to the side, morphing towards four. |
| `granite` | Granite | Many small lumpy lobes with a stone-grain tint. |
| `five-petals` | Five petals | A breathing five-petal summit. |
| `seed-pod` | Seed pod | Two long lobes slowly turning, like a seed pod. |
| `gentle-summit` | Gentle summit | One soft, slightly oval hill leaning with the flow. |
| `long-ridge` | Long ridge | A long winding ridge with rounded ends. |
| `dunes` | Dunes | Long wind ripples with no summits. |

An unknown style falls back to `drifting-lobes` and prints one console warning.

`terrain.variant` is a per-style shape knob. Today it does the most on drifting lobes, where it moves from three lobes to four.

## Presets

Presets are named starting points: a style plus a few settings. They're exported as `PRESETS`.

- **Drifting lobes**: `{"style":"drifting-lobes"}`
- **Granite**: `{"style":"granite","lines":{"count":34},"terrain":{"roughness":0.15}}`
- **Five petals**: `{"style":"five-petals"}`
- **Seed pod**: `{"style":"seed-pod","motion":{"speed":0.7}}`
- **Gentle summit**: `{"style":"gentle-summit","lines":{"count":26}}`
- **Long ridge**: `{"style":"long-ridge","terrain":{"sharpness":0.6}}`
- **Dunes**: `{"style":"dunes","motion":{"sparkle":0.3}}`
- **Survey map**: `{"style":"gentle-summit","lines":{"count":44,"indexEvery":5,"opacity":0.55},"terrain":{"peaks":3,"spread":0.6,"roughness":0.2},"motion":{"speed":0.4,"sparkle":0}}`
- **Terraces**: `{"style":"gentle-summit","terrain":{"terracing":0.8,"peaks":2},"motion":{"sparkle":0.2}}`
- **Rocky**: `{"style":"long-ridge","terrain":{"roughness":0.55,"sharpness":0.7},"lines":{"count":36}}`

```js
import { PRESETS, createTopography } from 'topography.js';
createTopography(el, PRESETS.find((p) => p.name === 'Survey map').settings);
```

## Colours, CSS variables and dark mode

The colours resolve in this order: settings first, then CSS variables, then the light or dark defaults.

```css
topography-bg, .my-hero {
  --topography-ink: #9fb3c8;
  --topography-paper: transparent;
}
```

- `theme.mode`: `auto` (default) follows the operating system and switches live; `light` or `dark` force it.
- `theme.ink` / `theme.paper`: any CSS colour, including named colours and `oklch()`.
- **Transparent paper:** `paper: 'transparent'` lets your page show through.
- **Light mode** draws ink lines on the paper. **Dark mode** makes the lines glow softly on dark paper.
- If you change a CSS variable later, call `update({ theme: {} })` to re-read it.

## Seed

`seed` is a whole number from 0 to 999999. The same seed gives the same terrain on every screen, and `0` is the original look. Change it to get a fresh variation of a style without touching the other settings.

## Snapshots and PNG export

```js
const blob = await topography.snapshot({ width: 1920, height: 1080, frame: 4000 });
```

- It draws off-screen. The live canvas isn't resized and keeps animating.
- Give just `width` or just `height` to keep the on-screen aspect ratio. With neither, you get the current drawing size.
- `frame` is the animation time in milliseconds, so the same settings and frame always give the same image.
- The size limit is the GPU's maximum renderbuffer size, usually 8192 or 16384 pixels.
- Without WebGL it rejects.

The playground's **Download PNG** uses this, with sizes up to 4K and a phone size.

## Performance and accessibility

- **Paused when hidden:** drawing stops when the element is off-screen or the tab is hidden, and resumes when it's back.
- **Still when nothing moves:** with `motion.speed` at 0 there's no animation loop at all; it only redraws on change.
- **Reduced motion:** when the system asks for reduced motion, it draws one still frame and ignores speed.
- **Pixel budget:** the pixel ratio is capped at 2, and very large canvases scale down past `maxPixels`. Lines are smoothed in the shader, so this stays sharp.
- **Screen readers:** the canvas is `aria-hidden`; it's decoration. Put real content on top.
- **Readability:** `layout.fade` softens lines behind a central text column, and `layout.anchor` moves the main summit from the side (0) to the centre (1).

## Fallbacks

| Situation | What you see |
|---|---|
| WebGL2 available | Full rendering (`status: 'webgl2'`) |
| Only WebGL1 | The same rendering through WebGL1 (`'webgl1'`) |
| No WebGL at all | The paper colour, and one console warning (`'fallback'`) |
| The GPU context is lost | The paper colour until the browser restores it, then drawing resumes (`'lost'`) |

## Server rendering and Next.js

Nothing touches the DOM or WebGL until the browser runs it.

- **React:** `topography-react` starts with `'use client'`. On the server, `<Topography>` renders an empty `div`; the canvas appears after hydration. In the Next.js App Router you can use it straight from a server component's tree.
- **Web component:** importing `topography.js/element` on the server is harmless. It only registers the element when `customElements` exists.
- **Vanilla:** call `createTopography` in the browser, for example in an effect or after `DOMContentLoaded`.

## The playground

The playground (`apps/playground`) is the project's live page:

- The page background is the preview. Presets sit on the page, and the full settings panel sits on the right (bottom on phones).
- **Copy HTML**, **Copy JSX**, **Copy config JSON** and **Copy link** give you the current background as code.
- **Download PNG** exports at screen ×2, 1080p, 1440p, 4K or phone size.
- The URL holds the settings as `?config=<JSON>`, so a link reproduces the background. Short keys like `?s=dunes&lc=24` work too.
- It serves `/llms.txt`, `/llms-full.txt` and `/docs/*.md`, generated from the code's own settings table.

Run it with `npm install && npm run dev`.

## WebMCP tools

In browsers that support [WebMCP](https://github.com/webmachinelearning/webmcp), the playground registers these tools through `document.modelContext.registerTool()`. Without WebMCP, nothing is registered.

| Tool | What it does |
|---|---|
| `list_styles` | Styles and presets, with ids and descriptions. |
| `get_settings` | The current settings and the minimal config JSON. |
| `set_settings` | Applies a partial settings object, and reports any clamped values or ignored keys. |
| `randomize` | A new random seed; with `{ "style": true }`, a random style too. |
| `take_screenshot` | A PNG of the background as a data URL (1200 px wide by default). |
| `get_embed_code` | Code for `html`, `react`, `vanilla` or `json`. |
| `get_install_instructions` | Setup for `npm`, `web-component`, `react` or `vanilla`. |

The input schemas are in `/docs/webmcp.md` on the playground. WebMCP needs a secure page (HTTPS or localhost).

## Troubleshooting

- **Nothing shows.** The element needs a size. Give it a height, or `position: fixed; inset: 0`.
- **I only see a flat colour.** WebGL isn't available or was lost. Check `status`, and look for the console warning.
- **It doesn't move.** Check `motion.speed`, whether reduced motion is on in your system, and whether the element is on screen.
- **The lines are too faint.** Raise `lines.opacity` or `lines.width`, or pick a stronger `ink`.
- **The lines vanish behind my text.** That's `layout.fade`. Lower it, or set it to 0.
- **My CSS variable change didn't apply.** Call `update({ theme: {} })` after changing it.
- **`snapshot` throws.** The size is beyond the GPU limit, or WebGL is unavailable.
- **There's a warning about an unknown style.** Check the id against [Styles](#styles); ids use dashes, like `seed-pod`.
