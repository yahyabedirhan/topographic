# topography

Animated, parametric topographic (contour-line) backgrounds for the web. One WebGL shader, seven terrain styles, readable settings, and a generator to design and export your own.

> Status: early draft, not published yet.

```js
import { createTopography } from 'topography';
const topography = createTopography(document.querySelector('#hero'), { style: 'dunes' });
```

- `packages/core`: `createTopography` and the `<topography-bg>` element (`import 'topography/element'`)
- `packages/react`: `<Topography>` and `useTopography`
- `apps/generator`: the generator site (sliders, presets, export)

Design: [docs/design.md](docs/design.md). License: MIT.
