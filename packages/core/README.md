# topographic

[![npm](https://img.shields.io/npm/v/topographic)](https://www.npmjs.com/package/topographic)

Try it live in the [playground](https://topographic.yahyapak.dev/).

Animated contour-line backgrounds for the web, in 2D and 3D. No dependencies.

- **2D or 3D:** flat contour lines by default, or the same map as a lit 3D terrain with an orbiting or still camera.
- **Real places:** draw the lines from real elevation data with `setHeightfield()`.
- **Seven styles:** `drifting-lobes`, `granite`, `five-petals`, `seed-pod`, `gentle-summit`, `long-ridge` and `dunes`, plus readable settings for lines, terrain, motion, layout and colours.
- **Quality tiers:** `quality: 'auto'` starts phones on the low tier and steps down when frames miss the screen's refresh rate. `low`, `medium` and `high` stay put.
- **Export:** `snapshot()` for PNG and `record()` for MP4 or WebM video.
- **Plain HTML or JavaScript:** a `<topographic-bg>` web component and a JavaScript API.

```sh
npm install topographic@0.4.0
```

**Web component:**

```html
<script type="module">import 'topographic/element';</script>

<topographic-bg style-name="dunes" line-count="30" style="position:fixed;inset:0;z-index:-1"></topographic-bg>
```

**JavaScript:**

```js
import { createTopographicBackground } from 'topographic';

const topographic = createTopographicBackground(document.querySelector('#hero'), { style: 'gentle-summit' });
topographic.update({ terrain: { peaks: 3 } });
```

**3D:** the same map as a terrain. 2D stays the default.

```js
topographic.update({ mode: '3d', elevation: 0.7, extent: 'block', camera: { motion: 'orbit' } });
const png = await topographic.snapshot({ width: 1920, height: 1080 });
const clip = await topographic.record({ seconds: 6, motion: 'orbit', format: 'mp4' });
```

**Real places:** pass a square grid of heights from 0 (lowest) to 1 (highest). Row 0 is the south edge, and `aspect` is the area's width divided by its height. Pass `null` to go back to the style's own shape.

```js
topographic.setHeightfield({ samples, size: 256, aspect: 1.2 }); // samples: Float32Array of size * size
topographic.update({ mode: '3d' });
```

The [playground](https://topographic.yahyapak.dev/) does this for ten ready places, such as Istanbul, the Matterhorn and Mount Fuji, or any area up to 300 km wide. It fetches elevation tiles, smooths them and hands the grid to `setHeightfield()`. In browsers with WebMCP, the playground also gives AI agents tools to change settings, choose a place and export.

For React, use [`topographic-react`](https://www.npmjs.com/package/topographic-react).

- [Project README](https://github.com/yahyabedirhan/topographic#readme)
- [Guide](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md): every API, every setting, theming, export, fallbacks, server rendering

Licensed under the Apache License 2.0. See LICENSE and NOTICE. If you use or adapt this code, please credit Yahya Bedirhan Pak with a link to [yahyapak.dev](https://yahyapak.dev).
