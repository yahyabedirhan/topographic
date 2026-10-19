# topographic

[![npm](https://img.shields.io/npm/v/topographic)](https://www.npmjs.com/package/topographic)

Try it live in the [playground](https://topographic.yahyapak.dev/).

Animated contour-line backgrounds for the web, in 2D and 3D. No dependencies.

- **2D or 3D:** flat contour lines by default, or the same map as a lit 3D terrain with an orbiting or still camera.
- **Real places:** ten built-in places such as `location: 'everest'`, any area through `fetchLocation()`, or your own elevation data.
- **Seven shapes:** `drifting-lobes`, `granite`, `five-petals`, `seed-pod`, `gentle-summit`, `long-ridge` and `dunes`, plus readable settings for lines, terrain, motion, layout and colours.
- **Quality tiers:** `quality: 'auto'` starts phones on the low tier and steps down when frames miss the screen's refresh rate. `low`, `medium` and `high` stay put.
- **Export:** `snapshot()` for PNG and `record()` for MP4 or WebM video.
- **Plain HTML or JavaScript:** a `<topographic-view>` web component and a JavaScript API.

```sh
npm install topographic
```

**Web component:**

```html
<script type="module">import 'topographic/element';</script>

<topographic-view shape="dunes" line-count="30"></topographic-view>
```

The background fills its element, so give the element a size.
The [guide](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#sizing-and-layering) shows how to size it and put it behind the page.

**JavaScript:**

```js
import { createTopography } from 'topographic';

const topography = createTopography(document.querySelector('#hero'), { shape: 'gentle-summit' });
topography.update({ terrain: { peaks: 3 } });
```

**3D:** the same map as a terrain. 2D stays the default.

```js
topography.update({ mode: '3d', elevation: 0.7, extent: 'block', camera: { motion: 'orbit' } });
const png = await topography.snapshot({ width: 1920, height: 1080 });
const clip = await topography.record({ seconds: 6, motion: 'orbit', format: 'mp4' });
```

**Real places:** the `location` setting takes one of ten built-in places, such as `everest`, `fuji` or `istanbul`, and sets its camera. A page downloads only the places it uses. `fetchLocation()` makes the same kind of grid for any area up to 300 km wide.

```js
import { fetchLocation } from 'topographic/locations';

createTopography(el, { location: 'everest', mode: '3d' });
topography.update({ location: await fetchLocation({ west: 28.45, south: 40.78, east: 29.65, north: 41.36 }) });
```

Your own elevation data also works: pass `{ samples, size, aspect }`, a square grid of heights from 0 (lowest) to 1 (highest), as `location` or to `setHeightfield()`. The [playground](https://topographic.yahyapak.dev/) has the same ten places and a map for any area. In browsers with WebMCP, it also gives AI agents tools to change settings, choose a place and export.

For React, use [`topographic-react`](https://www.npmjs.com/package/topographic-react).

- [Project README](https://github.com/yahyabedirhan/topographic#readme)
- [Guide](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md): every API, every setting, theming, export, fallbacks, server rendering

Licensed under the Apache License 2.0. See LICENSE and NOTICE. If you use or adapt this code, please credit Yahya Bedirhan Pak with a link to [yahyapak.dev](https://yahyapak.dev).
