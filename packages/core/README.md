# @yahyapak/topography

[![npm](https://img.shields.io/npm/v/@yahyapak/topography)](https://www.npmjs.com/package/@yahyapak/topography)

Try it live in the [playground](https://yahyabedirhan.github.io/topography/).

Animated topographic contour-line backgrounds for the web: one small WebGL shader, seven terrain styles, readable settings. It has no dependencies.

```sh
npm install @yahyapak/topography
```

**Web component:**

```html
<script type="module">import '@yahyapak/topography/element';</script>

<topography-bg style-name="dunes" line-count="30" style="position:fixed;inset:0;z-index:-1"></topography-bg>
```

**JavaScript:**

```js
import { createTopography } from '@yahyapak/topography';

const topography = createTopography(document.querySelector('#hero'), { style: 'gentle-summit' });
topography.update({ terrain: { peaks: 3 } });
```

For React, use [`@yahyapak/topography-react`](https://www.npmjs.com/package/@yahyapak/topography-react).

- [Project README](https://github.com/yahyabedirhan/topography#readme)
- [Guide](https://github.com/yahyabedirhan/topography/blob/main/docs/guide.md): every API, every setting, theming, export, fallbacks, server rendering

MIT licence.
