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

Design: [docs/low-level-design.md](docs/low-level-design.md). License: MIT.

## Develop

```sh
npm install
npm test               # unit tests (vitest)
npm run build          # packages (esbuild + tsc) and the generator (vite)
npm run smoke          # headless Chrome: every style renders, fallbacks, element, generator
npm run dev            # generator dev server
```

`npm run smoke` needs a Chrome or Chromium binary (`CHROME=/path/to/chrome`, default `/usr/bin/google-chrome`). Set `SHOTS=dir` to save a PNG of each style.

The shader is ported from the author's personal website prototype. With the same settings, every style renders pixel-identical to the original.
