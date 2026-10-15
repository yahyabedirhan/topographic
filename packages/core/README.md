# topographic

[![npm](https://img.shields.io/npm/v/topographic)](https://www.npmjs.com/package/topographic)

Try it live in the [playground](https://yahyabedirhan.github.io/topography/).

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
import { createTopographic } from 'topographic';

const topographic = createTopographic(document.querySelector('#hero'), { style: 'gentle-summit' });
topographic.update({ terrain: { peaks: 3 } });
```

For React, use [`topographic-react`](https://www.npmjs.com/package/topographic-react).

- [Project README](https://github.com/yahyabedirhan/topography#readme)
- [Guide](https://github.com/yahyabedirhan/topography/blob/main/docs/guide.md): every API, every setting, theming, export, fallbacks, server rendering

MIT licence.
