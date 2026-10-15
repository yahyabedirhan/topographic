# topographic

[![npm](https://img.shields.io/npm/v/topographic)](https://www.npmjs.com/package/topographic)

Try it live in the [playground](https://yahyabedirhan.github.io/topographic/).

Animated contour-line backgrounds for the web, in 2D and 3D. Seven terrain styles, readable settings, real elevation through `setHeightfield()`, and no dependencies.

```sh
npm install topographic@0.3.0
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

For React, use [`topographic-react`](https://www.npmjs.com/package/topographic-react).

- [Project README](https://github.com/yahyabedirhan/topographic#readme)
- [Guide](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md): every API, every setting, theming, export, fallbacks, server rendering

MIT licence.
