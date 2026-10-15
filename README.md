<p align="center"><img src="assets/images/logo/topographic.png" width="96" alt="The topographic logo: three contour rings on paper folded along one diagonal crease, on a graphite tile"></p>

<h1 align="center">topographic</h1>

<p align="center">Animated contour-line backgrounds for the web, in 2D and 3D.<br>From generated terrain, or from any real place on Earth.</p>

<p align="center"><a href="https://yahyabedirhan.github.io/topographic/"><b>Open the playground</b></a> · <a href="#install">Install</a> · <a href="docs/guide.md">Guide</a></p>

![The camera swings around the Matterhorn and Zermatt in 3D: real elevation drawn as pale contour lines on a dark block](assets/screenshots/hero-3d.webp)

topographic draws the lines of a topographic map behind your page. They drift slowly, follow light and dark mode, and lift into a 3D terrain when you want depth. It is a small npm library with no dependencies, plus a playground where you find a look and copy the code.

![The playground in dark mode: Istanbul in 3D behind the page, the dock of looks along the bottom, the controls at the top right and a minimap of the place in the corner](assets/screenshots/playground-dark.webp)

## Examples

**Looks.** Seven terrain styles, with lines, colours and motion you set. The same seed always gives the same map.

| | | |
|---|---|---|
| ![Survey ridge: pale lines around a long ridge on dark paper](assets/screenshots/look-survey-ridge-2d.webp) | ![Sea dunes: blue-green dune lines on deep teal](assets/screenshots/look-sea-dunes-2d.webp) | ![Rose pod: faint rose lines on near-black](assets/screenshots/look-rose-pod-2d.webp) |
| ![Stepped petals: plum lines on pale pink paper](assets/screenshots/look-stepped-petals-2d.webp) | ![Stone grain: graphite lines on warm stone paper](assets/screenshots/look-stone-grain-2d.webp) | ![Centred lobes: navy rings on pale blue paper](assets/screenshots/look-centred-lobes-2d.webp) |

**3D.** The same map, lifted into a terrain with a camera.

| | | |
|---|---|---|
| ![Night flower in 3D: blue rings rising to a soft dome](assets/screenshots/look-night-flower-3d.webp) | ![Terraces in 3D: amber lines stepping up a hill](assets/screenshots/look-terraces-3d.webp) | ![Rocky spine in 3D: brown lines over a rough ridge on light paper](assets/screenshots/look-rocky-spine-3d.webp) |

**Real places.** Ten places are one click away in the playground, and the Map lets you frame any other.

| | | | | |
|---|---|---|---|---|
| ![Istanbul, with the Bosphorus between the two shores](assets/screenshots/place-istanbul.webp)<br>Istanbul | ![Cyprus, the whole island from above](assets/screenshots/place-cyprus.webp)<br>Cyprus | ![The Matterhorn above Zermatt](assets/screenshots/place-matterhorn.webp)<br>Matterhorn | ![Geirangerfjord between steep walls](assets/screenshots/place-geirangerfjord.webp)<br>Geirangerfjord | ![The Grand Canyon from rim to rim](assets/screenshots/place-grand-canyon.webp)<br>Grand Canyon |
| ![Yosemite Valley, Half Dome and El Capitan](assets/screenshots/place-yosemite.webp)<br>Yosemite | ![Torres del Paine, granite towers over lakes](assets/screenshots/place-torres-del-paine.webp)<br>Torres del Paine | ![Mount Fuji, the cone and its lakes](assets/screenshots/place-fuji.webp)<br>Mount Fuji | ![Everest above the Khumbu valley](assets/screenshots/place-everest.webp)<br>Everest | ![Kilimanjaro over the plains](assets/screenshots/place-kilimanjaro.webp)<br>Kilimanjaro |

## Install

```sh
npm install topographic@0.3.0
```

**HTML.** A web component:

```html
<script type="module">import 'topographic/element';</script>

<topographic-bg style-name="long-ridge" style="position:fixed;inset:0;z-index:-1"></topographic-bg>
```

**JavaScript:**

```js
import { createTopographicBackground } from 'topographic';

const topographic = createTopographicBackground(document.querySelector('#hero'), { style: 'long-ridge' });
```

**React** (`npm install topographic@0.3.0 topographic-react@0.3.0`):

```tsx
import { TopographicBackground } from 'topographic-react';

<TopographicBackground styleName="long-ridge" style={{ height: '100vh' }} />
```

The fastest way to settings you like: tune them in the [playground](https://yahyabedirhan.github.io/topographic/) and copy the code from **Export**.

## 2D and 3D

**Settings.** Every look comes from one set of readable settings: a `style` and `seed`, then `lines`, `terrain`, `motion`, `layout` and `theme`. Change them live with `topographic.update({ terrain: { peaks: 3 } })`. The background pauses when nobody can see it, holds still for people who prefer less motion, and shows a plain colour where WebGL isn't available.

**3D.** Add `mode: '3d'`. 2D stays the default, and the same seed gives the same map in both.

```js
topographic.update({ mode: '3d', elevation: 0.7, extent: 'block', camera: { motion: 'orbit' } });
```

- `elevation` sets how tall the terrain is, from flat (0) to tall (1).
- `extent` is `endless` (the default), terrain that runs past the view, or `block`, a tabletop with layer lines on its sides.
- `camera` places the view (`azimuth` 349.7, `elevation` 33.6, `radius` 1.92 by default), and `motion` moves it: `still`, `orbit`, `push`, `flyover` or `drone`.
- In the playground, drag to orbit, scroll with two fingers to pan, ⌘/Ctrl + scroll or pinch to zoom, and double-click to recentre.

**Real places.** In the playground, open **Map**, frame an area up to 300 km on a side, and click **Apply**. A worker turns elevation tiles into a grid, and the view switches to 3D. The library takes any such grid through `setHeightfield({ samples, size, aspect })`, with values from 0 to 1.

![The Map popover over Istanbul: a dark map with a white frame around the city, the place menu above, and Clear and Applied below](assets/screenshots/map-popover-dark.webp)

**Export.** `snapshot()` renders a PNG at any size, or only a slice of the view, such as a phone-shaped crop. `record()` renders a 3D clip as MP4 or WebM. Both draw off-screen, so the live background keeps its size.

```js
const png = await topographic.snapshot({ width: 1920, height: 1080 });
const clip = await topographic.record({ seconds: 6, motion: 'orbit', format: 'mp4' });
```

**AI agents.** The playground serves plain-text docs at [`llms.txt`](https://yahyabedirhan.github.io/topographic/llms.txt). In browsers with [WebMCP](https://github.com/webmachinelearning/webmcp), an agent can change the settings, pick a place, take a screenshot, record a clip and get the embed code.

The [guide](docs/guide.md) has the full reference: every setting with its range and default, [3D](docs/guide.md#three-dimensions), [PNG export](docs/guide.md#snapshots-and-png-export), theming, server rendering and the [WebMCP tools](docs/guide.md#webmcp-tools).

## How it works

![How topographic fits together: the web component, the React component and the playground call one public API, which also takes an optional heightfield. Settings resolve from the params table, styles and presets, and one WebGL renderer draws them as a 2D contour shader or a 3D terrain pass, whose frames record() encodes as video.](assets/images/diagrams/library-architecture.png)

Every wrapper calls one API, and one renderer draws 2D or 3D from the same resolved settings.

![One terrain, two views: settings, or an optional heightfield, feed one shared contour field. In 2D a fragment shader paints its lines on every pixel. In 3D a mesh is lifted by the same field, painted with the same lines and seen through a moving camera.](assets/images/diagrams/terrain-two-views.png)

The 2D map and the 3D terrain run the same contour field and line painter.

![How a real place becomes a terrain in the playground: the Map popover gives a bounding box, a worker fetches Terrarium elevation tiles, stitches and resamples them to a 256 by 256 grid, scales the relief and smooths it, and the region hook hands the heightfield to the renderer with setHeightfield().](assets/images/diagrams/real-place-pipeline.png)

A worker turns the framed area into a smoothed 0..1 grid, and `setHeightfield()` draws it. The [low-level design](docs/low-level-design.md) explains the pieces and why.

## Contributing

Issues and pull requests are welcome. You need Node.js 20 or later.

```sh
npm install
npm run dev        # the playground, live
npm test           # unit tests
npm run build      # packages and the playground
npm run smoke      # headless Chrome checks (set CHROME=/path/to/chrome)
```

`scripts/readme-shots.mjs` retakes the images in this README.

## Credits

The shader is ported from the maintainer's personal website prototype. The architecture was inspired by [Paper Shaders](https://github.com/paper-design/shaders). Elevation comes from Mapzen Terrain Tiles on AWS Open Data, and the map from OpenFreeMap, OpenMapTiles and OpenStreetMap.

- [Playground](https://yahyabedirhan.github.io/topographic/)
- [`topographic`](https://www.npmjs.com/package/topographic) and [`topographic-react`](https://www.npmjs.com/package/topographic-react) on npm
- [Guide](docs/guide.md)

MIT licence. See [LICENSE](LICENSE).
