# topographic

[![npm](https://img.shields.io/npm/v/topographic)](https://www.npmjs.com/package/topographic)

Try it live in the [playground](https://yahyabedirhan.github.io/topographic/).

A JavaScript package for creating animated topographic backgrounds. One small WebGL shader, seven terrain styles and readable settings, with no dependencies.

```sh
npm install topographic
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
topographic.update({ mode: '3d', elevation: 0.7, camera: { motion: 'orbit' } });
const clip = await topographic.record({ seconds: 4, format: 'mp4' });
```

For React, use [`topographic-react`](https://www.npmjs.com/package/topographic-react).

- [Project README](https://github.com/yahyabedirhan/topographic#readme)
- [Guide](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md): every API, every setting, theming, export, fallbacks, server rendering

MIT licence.
