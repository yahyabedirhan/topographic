<p align="center"><img src="https://topographic.yahyapak.dev/readme/hero-grand-canyon.webp" width="100%" alt="The Grand Canyon in 3D, drawn as pale contour lines from real elevation data, the camera swinging slowly around it"></p>

# topographic

Topographic terrain rendered with WebGL. Generate a land or turn a real place into a topographic terrain.

<a href="https://topographic.yahyapak.dev/"><b>Open the playground</b></a> · <a href="https://topographic.yahyapak.dev/docs">Docs</a> · <a href="https://github.com/yahyabedirhan/topographic">GitHub</a>

```sh
npm install topographic
```

```js
import { createTopography } from 'topographic';

createTopography(document.querySelector('#terrain'), { location: 'grand-canyon' });
```

topographic draws terrain as contour lines, from real elevation data or from a shape and a seed.
The same settings draw the same land on every screen.

Each example below shows its code beside the terrain it draws.

## Real places, one setting at a time

<table>
<tr>
<td width="46%"><b>1.</b> Start with a real place, as a flat map.<pre lang="js">createTopography(el, {
  location: 'grand-canyon',
  mode: '2d',
  lines: { count: 24 },
});</pre></td>
<td><img src="https://topographic.yahyapak.dev/readme/canyon-1.webp" width="100%" alt="The Grand Canyon from above as a flat contour map, pale lines on dark paper"></td>
</tr>
<tr>
<td width="46%"><b>2.</b> Raise it into 3D.<pre lang="js">createTopography(el, {
  location: 'grand-canyon',
  mode: '3d',
  lines: { count: 24 },
});</pre></td>
<td><img src="https://topographic.yahyapak.dev/readme/canyon-2.webp" width="100%" alt="The same canyon raised in 3D on a block"></td>
</tr>
<tr>
<td width="46%"><b>3.</b> Give it a new look.<pre lang="js">createTopography(el, {
  location: 'grand-canyon',
  mode: '3d',
  lines: { count: 24 },
  theme: { paper: '#efe6d2', ink: '#1f2a44' },
});</pre></td>
<td><img src="https://topographic.yahyapak.dev/readme/canyon-3.webp" width="100%" alt="The canyon in 3D with dark navy lines on beige paper"></td>
</tr>
<tr>
<td width="46%"><b>4.</b> Draw more lines.<pre lang="js">createTopography(el, {
  location: 'grand-canyon',
  mode: '3d',
  lines: { count: 60, indexEvery: 5 },
  theme: { paper: '#efe6d2', ink: '#1f2a44' },
});</pre></td>
<td><img src="https://topographic.yahyapak.dev/readme/canyon-4.webp" width="100%" alt="The same view with many more lines, the canyon walls dense with navy contours"></td>
</tr>
</table>

Every picture here also sets dark paper and a light ink, `theme: { paper: '#0b0b0d', ink: '#cfd8ea' }`, and brighter lines, unless a step sets its own.

Ten places are built in, such as these:

<table>
<tr>
<td align="center"><img src="https://topographic.yahyapak.dev/readme/place-istanbul.webp" width="100%" alt="istanbul in 3D"><br><code>istanbul</code></td>
<td align="center"><img src="https://topographic.yahyapak.dev/readme/place-matterhorn.webp" width="100%" alt="matterhorn in 3D"><br><code>matterhorn</code></td>
<td align="center"><img src="https://topographic.yahyapak.dev/readme/place-yosemite.webp" width="100%" alt="yosemite in 3D"><br><code>yosemite</code></td>
<td align="center"><img src="https://topographic.yahyapak.dev/readme/place-fuji.webp" width="100%" alt="fuji in 3D"><br><code>fuji</code></td>
<td align="center"><img src="https://topographic.yahyapak.dev/readme/place-everest.webp" width="100%" alt="everest in 3D"><br><code>everest</code></td>
</tr>
</table>

The others are `cyprus`, `geirangerfjord`, `grand-canyon`, `torres-del-paine` and `kilimanjaro`.

## Generated shapes, one setting at a time

Without a place, topographic generates the land.
Every seed is a new land of its shape.

<table>
<tr>
<td width="46%"><b>1.</b> Pick a shape.<pre lang="js">createTopography(el, {
  shape: 'drifting-lobes',
  layout: { anchor: 1 },
});</pre></td>
<td><img src="https://topographic.yahyapak.dev/readme/shape-1.webp" width="100%" alt="Soft contour rings around one summit in the centre, pale lines on dark paper"></td>
</tr>
<tr>
<td width="46%"><b>2.</b> Change the shape and the seed.<pre lang="js">createTopography(el, {
  shape: 'granite',
  seed: 21,
  layout: { anchor: 1 },
});</pre></td>
<td><img src="https://topographic.yahyapak.dev/readme/shape-2.webp" width="100%" alt="Rougher rings of the granite shape around a summit lower in the frame"></td>
</tr>
<tr>
<td width="46%"><b>3.</b> Add peaks and terraces.<pre lang="js">createTopography(el, {
  shape: 'granite',
  seed: 21,
  layout: { anchor: 1 },
  terrain: { peaks: 3, terracing: 0.85 },
});</pre></td>
<td><img src="https://topographic.yahyapak.dev/readme/shape-3.webp" width="100%" alt="The same land with two summits, the rings grouped into stepped bands"></td>
</tr>
<tr>
<td width="46%"><b>4.</b> Raise it into 3D, in amber.<pre lang="js">createTopography(el, {
  shape: 'granite',
  seed: 21,
  layout: { anchor: 1 },
  terrain: { peaks: 3, terracing: 0.85 },
  mode: '3d',
  elevation: 0.45,
  camera: { elevation: 42, radius: 2.6 },
  theme: { paper: '#120d07', ink: '#e0a24a' },
});</pre></td>
<td><img src="https://topographic.yahyapak.dev/readme/shape-4.webp" width="100%" alt="The two summits raised in 3D, amber lines on dark brown paper"></td>
</tr>
</table>

## In HTML

```html
<script type="module">import 'topographic/element';</script>

<topographic-view location="fuji" mode="3d"></topographic-view>
```

The terrain fills its element, so give the element a size.

## Images and video

```js
const topography = createTopography(el, { location: 'everest' });

const png = await topography.snapshot({ width: 1920, height: 1080 });
const clip = await topography.record({ seconds: 6, motion: 'orbit', format: 'mp4' });
```

`update()` changes any setting live, and `destroy()` frees the WebGL context.

## AI agents

```sh
npx skills add yahyabedirhan/topographic
```

The topographic skill teaches your coding agent the settings, the places and the code.

## Links

- [Playground](https://topographic.yahyapak.dev/)
- [Docs](https://topographic.yahyapak.dev/docs)
- [Guide](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md): every setting with its range and default
- [Project README](https://github.com/yahyabedirhan/topographic#readme)
- [`topographic-react`](https://www.npmjs.com/package/topographic-react) for React

## License

Licensed under the Apache License 2.0. See LICENSE and NOTICE. If you use or adapt this code, please credit Yahya Bedirhan Pak with a link to [yahyapak.dev](https://yahyapak.dev).
