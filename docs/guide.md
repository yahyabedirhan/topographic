# topographic guide

Everything you need to use topographic, one topic per section. To try settings live, open the [playground](https://yahyabedirhan.github.io/topographic/). For how the pieces fit together, see [design.md](low-level-design.md).

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
npm install topographic            # core and the web component
npm install topographic-react      # React bindings (needs React 18 or 19)
```

The packages are ESM only, have no dependencies, and are marked side-effect free except `topographic/element`, which registers the element when imported.

On npm: [`topographic`](https://www.npmjs.com/package/topographic) and [`topographic-react`](https://www.npmjs.com/package/topographic-react).

## Three ways to use it

### Vanilla JavaScript: `createTopographicBackground`

```js
import { createTopographicBackground } from 'topographic';

const topographic = createTopographicBackground(element, settings?, options?);
```

The call puts a canvas inside `element`, which fills it, so give the element a size. It returns an instance:

| Member | What it does |
|---|---|
| `update(partialSettings)` | Merges into the current settings, clamps, and applies live. Only changed values reach the GPU. |
| `snapshot({ frame?, width?, height? })` | Renders one PNG off-screen and resolves to a `Blob`. See [Snapshots](#snapshots-and-png-export). |
| `record({ seconds?, fps?, width?, height?, frame?, format?, motion? })` | Renders a 3D clip with a moving camera and resolves to an MP4 or WebM `Blob`. |
| `setHeightfield({ samples, size, aspect } \| null)` | Draws the contours from your own square elevation grid instead of the style's terrain: `samples` is a `Float32Array` of `size × size` values from 0 (low) to 1 (high), row 0 at the south, and `aspect` is the place's width over its height. `null` brings the procedural style back. |
| `stats` | `{ fps, frameMs, mesh }` for the 3D view. `mesh` is 0 in 2D. |
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

### Web component: `<topographic-bg>`

```html
<script type="module">import 'topographic/element';</script>

<topographic-bg style-name="long-ridge" line-count="36" peaks="2" theme="dark"></topographic-bg>
```

- Every setting has an attribute (listed in [Settings](#settings)), plus `style-name`, `seed`, `theme`, `ink` and `paper`.
- Changing an attribute applies live. Removing one returns it to the style's default.
- `element.topographic` is the instance, and `element.snapshot(opts)` is a shortcut for it.
- The element is `display: block`. Size and position it with CSS, for example `position: fixed; inset: 0; z-index: -1`.

### React: `<TopographicBackground>` and `useTopographicBackground`

```tsx
import { TopographicBackground, useTopographicBackground } from 'topographic-react';

<TopographicBackground
  styleName="dunes"
  lines={{ count: 24 }}
  theme={{ mode: 'dark' }}
  style={{ position: 'fixed', inset: 0, zIndex: -1 }}
/>
```

- Props: `styleName`, `seed`, `lines`, `terrain`, `motion`, `layout`, `theme`, `mode`, `elevation`, `extent`, `detail`, `camera`, `options`, `onReady`, plus any `div` props. Children render on top.
- It's `styleName`, not `style`, because `style` stays React's inline style.
- Each group updates on its own when its values change. Passing a new object with the same values does nothing.
- `onReady(instance)` gives you the instance after mount (for `snapshot`), and `null` on unmount.
- Changing `options` recreates the renderer. Everything else updates in place.

To put it on your own element, use the hook:

```tsx
const ref = useTopographicBackground({ styleName: 'seed-pod' });
return <section ref={ref} style={{ height: 400 }} />;
// ref.topographic is the instance while mounted
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

### Three dimensions

`mode` is `'2d'` or `'3d'`. 2D is the default. 3D draws the same contour field, so the same seed and the same settings are the same map. Switching is direct in both directions.

| Setting | Attribute | Range | Default | What it does |
|---|---|---|---|---|
| `mode` | `mode` | `2d`, `3d` | `2d` | The flat map, or that map as a terrain. |
| `elevation` | `elevation` | 0–1 | 0.62 | 3D height. 0 is flat like the map. Higher values make the terrain taller, with a rounded crest. |
| `extent` | `extent` | `block`, `endless` | `block` | A finite tabletop with ink layer lines on the cut sides, or terrain that continues past the view. |
| `detail` | `detail` | 0–1 | 0.5 | Mesh resolution, from 32² to 160². |
| `camera.azimuth` | `azimuth` | any finite number | 42 | Degrees around the terrain. |
| `camera.elevation` | `camera-elevation` | 2–80 | 34 | Degrees above the horizon. The camera never goes below the terrain. |
| `camera.radius` | `radius` | 1.15–6.5 | 2.45 | Distance from the terrain centre. |
| `camera.motion` | `camera-motion` | `still`, `orbit`, `push`, `flyover`, `drone` | `still` | A moving camera. `motion.speed` still morphs the terrain itself. |

```js
createTopographicBackground(el, {
  style: 'gentle-summit',
  seed: 4,
  mode: '3d',
  elevation: 0.7,
  extent: 'block',
  camera: { azimuth: 42, elevation: 34, radius: 2.45, motion: 'orbit' },
});
```

The default camera is a high diagonal, close to isometric. `record({ motion: 'flyover', format: 'mp4' })` renders a clip without resizing the live canvas. `format: 'webm'` is the other option, when the browser can encode it.

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

### The styles image

![Sixteen dark-mode tiles: the seven styles, the three presets Survey map, Terraces and Rocky, and six seed variants](../assets/screenshots/styles.png)

The image shows every style and preset in dark mode, frozen at 4 seconds. The first ten tiles are the styles and presets by name. The last six are a style with a different seed and a setting or two changed:

| Tile | Settings |
| --- | --- |
| Twin peaks | `drifting-lobes`, seed 7, peaks 2, spread 1 |
| Fine lines | `drifting-lobes`, seed 21, line count 48 |
| Scree | `granite`, seed 3, roughness 0.6 |
| Bloom | `five-petals`, seed 12, line count 42, variant 0.9 |
| Wide dunes | `dunes`, seed 5, line count 16, line width 0.4 |
| Plateau | `seed-pod`, seed 9, terracing 0.6 |

So the shapes read at this size, every tile also centres the summit (`layout.anchor` 1), turns off the centre fade (`layout.fade` 0) and uses brighter, slightly thicker lines: line opacity 0.85, line width 0.4 and ink `#9fb0cc`. `node scripts/styles-grid.mjs` renders the image again.

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
import { PRESETS, createTopographicBackground } from 'topographic';
createTopographicBackground(el, PRESETS.find((p) => p.name === 'Survey map').settings);
```

## Colours, CSS variables and dark mode

The colours resolve in this order: settings first, then CSS variables, then the light or dark defaults.

```css
topographic-bg, .my-hero {
  --topographic-ink: #9fb3c8;
  --topographic-paper: transparent;
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
const blob = await topographic.snapshot({ width: 1920, height: 1080, frame: 4000 });
```

- It draws off-screen. The live canvas isn't resized and keeps animating.
- Give just `width` or just `height` to keep the on-screen aspect ratio. With neither, you get the current drawing size.
- `frame` is the animation time in milliseconds, so the same settings and frame always give the same image.
- The size limit is the GPU's maximum renderbuffer size, usually 8192 or 16384 pixels.
- Without WebGL it rejects.

The playground's PNG export uses this, at 2× the window, a phone size or 1920 × 1080.

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

- **React:** `topographic-react` starts with `'use client'`. On the server, `<TopographicBackground>` renders an empty `div`; the canvas appears after hydration. In the Next.js App Router you can use it straight from a server component's tree.
- **Web component:** importing `topographic/element` on the server is harmless. It only registers the element when `customElements` exists.
- **Vanilla:** call `createTopographicBackground` in the browser, for example in an effect or after `DOMContentLoaded`.

## The playground

The playground (`apps/playground`) is the project's live page:

- The page background is the preview. The dock at the bottom holds your saved map terrains, then the built-in looks as thumbnails, then light/dark, **Shuffle**, and the paper and ink colours. Every dock item is a whole terrain: a click switches the shape and the colours together.
- The buttons at the top right are **Map**, 2D/3D, **Tune** and **Export**. Each opens its panel under them, one at a time. The 2D/3D button carries a small badge with the current mode.
- **Tune** opens the sliders, one tab at a time: Lines, Terrain, Motion, Layout and 3D. Line width reads in pixels (0.5 to 4 px). The 3D tab holds the scene (extent and elevation), the camera (motion, azimuth, angle and distance) and the detail level. In 3D, the frame rate shows just above the dock, on its left edge. While a map place is applied, the Terrain sliders and Motion's Warp are dimmed: the place sets the shape. A note with **Clear map** sits above them.
- **Export** gives you a link, a PNG (2× the window, a phone size or 1920 × 1080), a 4 second 3D clip as MP4 or WebM, and the code as React, HTML or JSON.
- **Map** opens a map with a frame. Pan and zoom, drag the frame's corners and edges, or pick Istanbul, San Francisco, London, New York or Cyprus from the badge, then press **Apply**: the real elevation inside the frame becomes the terrain. Apply switches to 3D and sets the map terrain view: 36 lines at 0.5 px and 0.9 opacity, every fourth an index line, a block at elevation 0.12, and a closer camera. Cyprus brings its own look instead: dark blue paper, light blue ink, 37 lines, elevation 0.06 and a camera from almost straight above. It also saves the terrain at the front of the dock, as the place's name or as Area. While a saved item is active, your edits to it are kept, except camera moves: a click on a dock item always brings back its own camera. Each built-in look has its own camera too, and a plain style uses the playground camera. **Clear** goes back to the generated terrain and to the lines, camera, extent and elevation you had before, and after Cyprus to your style and colours too. The map loads only when you open it. It needs a network connection.
- The URL holds the settings as short keys, so a link reproduces the background. It writes only what differs from the style's defaults or from a named look: `?s=dunes&lc=24`, `?look=night-lobes&mode=3d`. Colours go without `#` (`ink=9fb0cc`), and 3D is endless from the playground camera (azimuth 349.7, angle 33.6, distance 1.92) unless the URL says otherwise. `?place=istanbul` or `?region=west,south,east,north` opens a real place.
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
| `record_video` | A short 3D clip of the current terrain with a moving camera, as an MP4 or WebM data URL (a 2 second orbit at 640×360 by default). |
| `get_embed_code` | Code for `html`, `react`, `vanilla` or `json`. |
| `get_install_instructions` | Setup for `npm`, `web-component`, `react` or `vanilla`. |
| `set_region` | Draws a real place as the terrain: a named `place` or a bbox in degrees, with optional `relief` and `smooth`. |
| `get_region` | The current region, relief, smoothing, load status and URL query. |
| `clear_region` | Removes the region and brings the procedural terrain back. |

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
