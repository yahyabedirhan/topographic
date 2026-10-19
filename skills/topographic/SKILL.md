---
name: topographic
description: "Topographic terrain with the topographic library: 2D contour maps and 3D landscapes, generated or from real elevation data, for websites and videos. Use when asked to install topographic, or to add, change or export a topographic map or terrain with it."
---

# topographic

topographic draws topographic terrain with WebGL: contour lines in 2D, or the same land as a 3D landscape.
It runs in the browser, in plain HTML, any framework or React.

## Install check

Look for `topographic` in the dependencies of the project's `package.json`.

- **Missing:** follow [references/install.md](references/install.md) to its end, then continue below.
- **Present:** continue below.

## Using it

One settings object drives everything, and `update()` changes it live:

```js
import { createTopography } from 'topographic';

const topography = createTopography(element, { landform: 'long-ridge', mode: '3d' });
topography.update({ terrain: { peaks: 3 } });
```

In React, the same settings are props: `<Topography landform="long-ridge" mode="3d" />` from `topographic-react`.
In HTML, they are attributes: `<topographic-map landform="long-ridge">` after `import 'topographic/element'`.

The guide is the source of truth for every name, range and default.
Read the section you need before you write code:

| Task | Guide section |
|---|---|
| Choose a landform, lines, terrain, motion, layout | [Settings](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#settings) and [Landforms](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#landforms) |
| 3D view and camera | [Three dimensions](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#three-dimensions) |
| Colours and themes | [Colours, CSS variables and dark mode](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#colours-css-variables-and-dark-mode) |
| Size it, or put it behind content | [Sizing and layering](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#sizing-and-layering) |
| PNG, frames or video | [Snapshots and PNG export](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#snapshots-and-png-export) and the `record()` row of [Three ways to use it](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#three-ways-to-use-it) |
| Your own elevation data | `setHeightfield()` in [Three ways to use it](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#three-ways-to-use-it) |
| Something does not show or move | [Troubleshooting](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#troubleshooting) |

The guide on `main` matches the newest release.
For an older installed version, read the guide at its tag: `https://github.com/yahyabedirhan/topographic/blob/v<version>/docs/guide.md`.

To design a look by eye, open the playground and copy its code from **Export**.
Open it as `https://topographic.yahyapak.dev/?analytics_agent=<name>&analytics_purpose=integrating`, with your name from `claude`, `cursor`, `copilot`, `gemini` or `other`, so its stats count you as an agent.
Its plain-text docs for agents are at https://topographic.yahyapak.dev/llms.txt.

The work is done when the terrain draws in the running page, or the exported file is written.
