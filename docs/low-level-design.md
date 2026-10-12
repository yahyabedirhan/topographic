# Topography: design

Topography draws animated contour-line backgrounds (like a topographic map) with one WebGL shader. You pick a **style** (the terrain shape) and tune readable **settings**. The same core powers a vanilla JS API, a `<topography-bg>` web component, a React `<Topography>` component, and a playground site that exports what you build.

```js
import { createTopography } from '@yahyapak/topography';
const topography = createTopography(el, { style: 'dunes', lines: { count: 30 } });
```

## Requirements
1. Render an animated contour field with WebGL, full-bleed behind content.
2. Choose a style and tune readable settings, grouped as `lines`, `terrain`, `motion` and `layout`.
3. A `seed` varies a style reproducibly.
4. Colours: `ink` and `paper`, taken from CSS variables, with automatic dark mode. Paper can be transparent.
5. Settings update live, without remounting.
6. The playground has sliders, presets, randomize, state in the URL, and exports an embed snippet and a PNG.
7. Out-of-range values are clamped. An unknown style falls back to the default style and logs one warning.
8. Reduced motion shows one still frame. Animation pauses when off-screen or when the tab is hidden. A pixel budget caps GPU cost.
9. If WebGL is missing or the context is lost, the element shows the paper colour. A restored context resumes rendering.
10. In scope:
    - core, web component, React wrapper
    - 7 styles: dunes, granite, drifting lobes, five petals, seed pod, gentle summit, long ridge
    - the playground, built in React
11. Out of scope for now: SVG and video export, multi-colour palettes, Vue/Svelte wrappers, the 6 other prototype styles (spiral, twin peaks, caldera, archipelago, terraced plateau, river valley).

## Entities and relationships
- **Renderer**: owns the canvas, the WebGL program, the frame loop, observers and the pixel budget. It is created by `createTopography` and is the only thing that touches WebGL.
- **Settings**: the full, validated value object (`style`, `seed`, `lines`, `terrain`, `motion`, `layout`, `theme`). The `params` table defines each field's name, range, default and uniform slot.
- **Style**: data, not code. `{ id, name, index, notes }`. `index` selects a branch in the one combined shader.
- **Preset**: data. `{ name, settings: Partial<Settings> }`. Presets live in core, so every wrapper shares them.
- **Theme**: resolves `ink` and `paper` from settings, then CSS variables (`--topography-ink`, `--topography-paper`), then light/dark defaults.
- **`<topography-bg>`**: a custom element. Attributes become Settings, and it holds one Renderer.
- **React `<Topography>`** and **`useTopography`**: props become Settings, and they hold one Renderer.
- **Playground**: a React app. Panel state is Settings, mirrored in the URL. Export uses `snapshot` and the embed serializer.

Flow: wrapper → Settings (via the params table) → Renderer → uniforms → shader.

## Modules and files
```
packages/core/src/
  index.ts               public exports
  renderer.ts            Renderer: GL, loop, observers, budget, context loss
  params.ts              the single table: name, group, range, default, uniform slot
  settings.ts            resolve, clamp, merge, serialize to attributes and URL
  styles.ts              Style records (7)
  presets.ts             Preset records
  theme.ts               ink/paper resolution, dark mode, CSS variables
  shader/common.glsl.ts  noise, smooth-min, line drawing
  shader/topography.glsl.ts  combined height field, branch per style
  element.ts             <topography-bg> custom element
packages/react/src/Topography.tsx   <Topography>, useTopography
apps/playground/src/
  App.tsx  Panel.tsx  url.ts  export.ts
```
`params.ts` is the single source of truth. Types, element attributes, React props, playground sliders and docs are all derived from it.

## Public API
```ts
const topography = createTopography(el: HTMLElement, settings?: Partial<Settings>);
topography.update(partial: Partial<Settings>): void;   // live, merges and clamps
topography.snapshot(opts?: { frame?: number; width?: number; height?: number }): Promise<Blob>;
// renders off-screen at the given size and frame; the live canvas is not resized
topography.destroy(): void;
```
```html
<topography-bg style-name="dunes" line-count="30" seed="7"></topography-bg>
```
```tsx
<Topography styleName="granite" terrain={{ roughness: 0.4 }} />
const ref = useTopography({ styleName: 'seed-pod' });
```
Settings groups:
- `lines`: count, width, opacity, indexEvery
- `terrain`: peaks, spread, roughness, sharpness, terracing, variant
- `motion`: speed, warp, sparkle
- `layout`: anchor, fade

Ranges are 0–1 except counts. In the element and React the style is `style-name` / `styleName`, because `style` is already taken by HTML and React.

## Traced flow
**Happy path.** `createTopography(el, { style: 'dunes' })` runs these steps:
1. Settings are resolved: defaults, then the preset, then the input; values are clamped.
2. Theme reads the CSS variables.
3. The Renderer compiles the shader and maps Settings to uniforms.
4. Observers start, and the frame loop draws.
5. Each `update` clamps, merges and sends only the uniforms that changed.

**Rejection paths.**
- `style: 'volcano'` → one warning, and the default style is used.
- `lines.count: 500` → clamped to the maximum.
- No WebGL → no canvas is drawn; the element shows the paper colour and `snapshot` rejects.
- Context lost → paper colour is shown and the loop stops. When the context is restored, the program is recompiled and rendering resumes.
- Reduced motion → one still frame, and `motion.speed` is ignored.

## Extensibility
| To add | Touch |
|---|---|
| A setting | `params.ts` row, plus its use in `topography.glsl.ts` |
| A style | `styles.ts` record, plus a branch in `topography.glsl.ts` |
| A preset | `presets.ts` record only |
| A wrapper (Vue, Svelte) | a new package calling `createTopography` |
| An export format | `apps/playground/src/export.ts` (SVG later needs a CPU port of the height field) |

## Decisions
- **One combined shader; style is data.** It's simpler to ship and to switch styles live. The cost is that one shader carries every branch.
- **Grouped, readable setting names, normalised to 0–1.** This is the public contract and is costly to change later.
- **Presets in core**, shared by all wrappers.
- **Colours through CSS variables**, with dark mode and transparent paper. Palettes come later.
- **Pixel budget** (minimum pixel ratio plus maximum pixel count) instead of a simple DPR cap.
- **Fallback, not exceptions,** when WebGL is missing or lost.
- **`snapshot` renders off-screen**, so exports never disturb the live view.
- **Always spell out "@yahyapak/topography"** in names (element, files, API).
- **License: MIT.**

Architecture inspired by Paper Shaders (github.com/paper-design/shaders at 43cd68db79fa0b1759f72ffc941b3238e2a3954c, Apache-2.0): a vanilla mount class with thin wrappers, presets typed against params, and definitions that drive the controls. No code has been copied. If any is, include their NOTICE and attribution.
