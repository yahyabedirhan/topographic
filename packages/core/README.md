# topography.js

[![npm](https://img.shields.io/npm/v/topography.js)](https://www.npmjs.com/package/topography.js)

Try it live in the [playground](https://yahyabedirhan.github.io/topography/).

A JavaScript package for creating animated topographic backgrounds. One small WebGL shader, seven terrain styles and readable settings, with no dependencies.

```sh
npm install topography.js
```

**Web component:**

```html
<script type="module">import 'topography.js/element';</script>

<topography-bg style-name="dunes" line-count="30" style="position:fixed;inset:0;z-index:-1"></topography-bg>
```

**JavaScript:**

```js
import { createTopography } from 'topography.js';

const topography = createTopography(document.querySelector('#hero'), { style: 'gentle-summit' });
topography.update({ terrain: { peaks: 3 } });
```

For React, use [`topography-react`](https://www.npmjs.com/package/topography-react).

- [Project README](https://github.com/yahyabedirhan/topography#readme)
- [Guide](https://github.com/yahyabedirhan/topography/blob/main/docs/guide.md): every API, every setting, theming, export, fallbacks, server rendering

MIT licence.
