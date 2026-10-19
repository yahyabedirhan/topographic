// PROTOTYPE prose for the docs page variants. Each section: id, title, a short nav name, a one-line lede,
// the body as HTML and its notes. A <sup class="fn"></sup> in the body marks where note n belongs;
// variant A puts the notes in the margin, B and C under the text.
// `live` is what a live view shows for the section, in 0.5.0 settings.
import { BADGE } from './docs-content.js';

const GRANITE = { style: 'granite', seed: 67, lines: { count: 36, indexEvery: 4, opacity: 0.6 }, theme: { mode: 'dark', ink: '#9fb0cc' } };

export const GROUPS = [
  { name: 'Start', ids: ['what', 'install', 'first'] },
  { name: 'Land', ids: ['landforms', 'looks', 'locations'] },
  { name: 'Settings', ids: ['lines', 'terrain', 'motion', 'layout', 'theme'] },
  { name: '3D', ids: ['modes', 'camera'] },
  { name: 'Output', ids: ['export', 'heightfields'] },
  { name: 'API', ids: ['instance', 'react', 'element', 'page'] },
  { name: 'Care', ids: ['performance', 'accessibility', 'agents'] },
  { name: 'Last', ids: ['limits', 'questions'] },
];

export const SECTIONS = [
  {
    id: 'what', title: 'What it is', nav: 'What it is',
    lede: 'Topographic terrain, the contour lines of a hiking map, drawn live in 2D and 3D.',
    body: `<p>You describe land in a few settings, or name a real place, and topographic draws it as contour lines that move: flat like a map, or lifted into a landscape under a camera. The same settings and seed draw the same land on every screen.<sup class="fn"></sup></p>
<p>It is one small library with three uses. <b>On a website</b> it is a live element: a hero, a map, a section, behind your content or on its own. <b>In a video</b> it renders frame-exact PNG frames, or records a clip with a moving camera. <b>In a game</b> it draws maps, menus and title screens, and it takes your own heights.<sup class="fn"></sup></p>`,
    notes: ['The whole core package, the element and the video encoder included, is about 25 kB gzipped. It has no dependencies.', 'There is no mesh or heightmap export for game engines yet. <a href="#limits">Limits</a> lists what is not there.'],
    live: { ...GRANITE, mode: '3d', camera: { motion: 'orbit' } },
  },
  {
    id: 'install', title: 'Install', nav: 'Install',
    lede: 'Two packages, both ESM only, with no dependencies.',
    body: `<p><a href="https://www.npmjs.com/package/topographic" target="_blank" rel="noreferrer"><code>topographic</code></a> holds the JavaScript API and the HTML element. <a href="https://www.npmjs.com/package/topographic-react" target="_blank" rel="noreferrer"><code>topographic-react</code></a> adds the React component and the hook, for React 18 or 19.<sup class="fn"></sup></p>`,
    notes: ['Both packages are marked side-effect free, except <code>topographic/element</code>: importing it registers the element.'],
    code: 'install',
    live: { style: 'gentle-summit', lines: { count: 26 }, theme: { mode: 'dark' } },
  },
  {
    id: 'first', title: 'First terrain', nav: 'First terrain',
    lede: 'An element and a few settings. Everything else is one more setting.',
    body: `<p>Give topographic an element and some settings. It adds a canvas that fills the element and starts drawing.<sup class="fn"></sup> Every setting on this page goes into this same call, onto the component as a prop, or onto the element as an attribute.<sup class="fn"></sup></p>`,
    notes: ['The canvas fills its element, so the element needs a height. <a href="#page">In your page</a> shows the CSS.', 'Code on this page uses the 0.6.0 names: <code>createTopography</code>, <code>&lt;Topography&gt;</code> and <code>&lt;topographic-map&gt;</code>. 0.5.0 has <code>createTopographicBackground</code>, <code>&lt;TopographicBackground&gt;</code> and <code>&lt;topographic-bg&gt;</code>.'],
    code: 'first',
    live: { style: 'long-ridge', mode: '3d', theme: { mode: 'dark' } },
  },
  {
    id: 'landforms', title: 'Landforms', nav: 'Landforms', badge: true,
    lede: 'Seven starting shapes for generated land.',
    body: `<p>A landform is the shape generated land starts from.<sup class="fn"></sup> There are seven. The <code>seed</code>, a whole number from 0 to 999999, picks one variation of it, and 0 is the original. The settings further down bend each landform so far that seven is only where you start.<sup class="fn"></sup></p>`,
    notes: [`<code>landform</code> is the 0.6.0 name.${BADGE} In 0.5.0 it is <code>style</code>, <code>styleName</code> in React and <code>style-name</code> on the element.`, 'An unknown landform draws <code>drifting-lobes</code> and prints one warning in the console.'],
    code: 'landforms',
    live: { style: 'dunes', seed: 12, theme: { mode: 'dark' } },
  },
  {
    id: 'looks', title: 'Looks', nav: 'Looks', badge: true,
    lede: 'A named design: landform, lines, terrain, motion and colours in one word.',
    body: `<p>A look is a finished design with a name. Pass it, and change any setting on top of it: what you pass wins over the look.</p>
<p>Today the same idea ships as <code>PRESETS</code>, ten named settings objects such as Survey map, Terraces and Rocky, and the playground's dock holds 24 looks more.<sup class="fn"></sup></p>`,
    notes: ['The final list of look names is still open. These names come from the presets and the playground dock.'],
    code: 'looks',
    live: { style: 'gentle-summit', lines: { count: 44, indexEvery: 5, opacity: 0.55 }, terrain: { peaks: 3, spread: 0.6, roughness: 0.2 }, motion: { speed: 0.4, sparkle: 0 }, theme: { mode: 'dark' } },
  },
  {
    id: 'locations', title: 'Real locations', nav: 'Locations', badge: true,
    lede: 'Real elevation data, by name or by bounding box.',
    body: `<p>The land can be a real place. Ten come ready by name.<sup class="fn"></sup> For any other area up to 300 km across, <code>fetchLocation</code> from <code>topographic/locations</code> downloads its heights and returns a heightfield for the instance.<sup class="fn"></sup></p>
<p>A location draws its real heights, so the seed, the terrain settings and <code>motion.warp</code> do nothing while it is on. Lines, colours, layout and the camera still apply.</p>`,
    notes: ['The playground does this today with its Map panel, and a link such as <code>?place=fuji</code> opens a place.', 'Heights come from Mapzen Terrain Tiles on AWS Open Data, resampled to a 256 × 256 grid. A location needs the network the first time it loads.'],
    code: 'locations',
    live: { style: 'gentle-summit', lines: { count: 36, width: 0, opacity: 0.9, indexEvery: 4 }, mode: '3d', extent: 'block', elevation: 0.24, camera: { azimuth: 341.8, elevation: 30, radius: 1.32 }, theme: { mode: 'dark' }, field: 'volcano' },
  },
  {
    id: 'lines', title: 'Lines', nav: 'Lines',
    lede: 'How many contours, how thick, how strong, and which are bold.',
    body: `<p>Lines are the contours themselves. <code>count</code> sets how many cross the land, <code>width</code> and <code>opacity</code> how they sit on the paper, and <code>indexEvery</code> draws every Nth line bolder, like the index lines on a survey map.<sup class="fn"></sup></p>`,
    notes: ['The playground calls <code>indexEvery</code> Bold lines, written “1 in 5”, and shows width as 0.5 to 4 px.'],
    code: 'lines', params: 'lines',
    live: { style: 'long-ridge', seed: 113, lines: { count: 46, indexEvery: 5, opacity: 0.55, width: 0.12 }, theme: { mode: 'dark', ink: '#e8e6e1', paper: '#141414' } },
  },
  {
    id: 'terrain', title: 'Terrain', nav: 'Terrain',
    lede: 'Summits, spread, roughness, sharpness and steps.',
    body: `<p>Terrain settings shape generated land: how many summits merge into it and how far apart, how rough the slopes are, how sharp the tops, and whether the lines group into terraces.<sup class="fn"></sup></p>`,
    notes: ['<code>variant</code> depends on the landform. Today it matters most for drifting-lobes, where three lobes become four.'],
    code: 'terrain', params: 'terrain',
    live: { style: 'gentle-summit', terrain: { peaks: 3, spread: 0.6, roughness: 0.2, terracing: 0.4 }, layout: { anchor: 1, fade: 0 }, theme: { mode: 'dark' } },
  },
  {
    id: 'motion', title: 'Motion', nav: 'Motion',
    lede: 'The land moves by itself: it drifts, wobbles and sparkles.',
    body: `<p>The field drifts and slowly morphs, the lines wobble with it, and small bright dots travel along them. <code>speed</code> 0 holds one frame and stops the animation loop; it draws again only when something changes.<sup class="fn"></sup></p>`,
    notes: ['This is the land\'s own motion. The camera moves on its own path, set in <a href="#camera">Camera</a>.'],
    code: 'motion', params: 'motion',
    live: { style: 'seed-pod', seed: 211, motion: { speed: 2, warp: 0.8, sparkle: 1 }, lines: { count: 30, width: 0.16 }, theme: { mode: 'dark', paper: '#16131a', ink: '#b9a4e0' } },
  },
  {
    id: 'layout', title: 'Layout', nav: 'Layout',
    lede: 'Where the summit sits, and how the lines make room for text.',
    body: `<p><code>anchor</code> moves the main summit from the side (0) to the centre (1). <code>fade</code> softens the lines behind a text column about 600 px wide in the middle, so a heading on top stays readable.<sup class="fn"></sup></p>`,
    notes: ['Dunes starts with a lighter fade, 0.5 instead of 0.7. Every landform can bring its own defaults.'],
    code: 'layout', params: 'layout',
    live: { style: 'drifting-lobes', seed: 223, layout: { anchor: 1, fade: 0.9 }, terrain: { variant: 0.55 }, lines: { count: 24, width: 0.16 }, theme: { mode: 'dark' } },
  },
  {
    id: 'theme', title: 'Theme and colours', nav: 'Theme',
    lede: 'Two colours, ink and paper, and a light or dark mode.',
    body: `<p>Two colours draw everything: <code>ink</code> for the lines and <code>paper</code> for the ground. Each comes from the first one set: the setting, then a CSS variable, then the light or dark default.<sup class="fn"></sup> <code>theme.mode</code> is <code>auto</code>, <code>light</code> or <code>dark</code>, and auto follows the system as it changes.</p>
<p>In light mode the ink is laid on the paper. In dark mode the lines glow softly on dark paper.</p>`,
    notes: ['Any CSS colour works, including names and <code>oklch()</code>. Paper can be <code>transparent</code>, so your page shows through.'],
    code: 'theme', rows: 'theme',
    live: { style: 'five-petals', seed: 179, lines: { count: 44, indexEvery: 4, width: 0.12, opacity: 0.75 }, layout: { anchor: 0.6, fade: 0 }, theme: { mode: 'dark', paper: '#10151c', ink: '#a9c7e4' } },
  },
  {
    id: 'modes', title: '2D and 3D', nav: '2D and 3D',
    lede: 'The same land as a flat map or as a landscape.',
    body: `<p>2D is the flat map and the default. 3D lifts the same contour field into a mesh painted with the same lines. With the same seed and settings you get the same land in both, and you can switch at any time.<sup class="fn"></sup></p>
<p><code>elevation</code> sets how tall the land stands, <code>extent</code> whether it is an endless plane that fades into the paper or a solid block, and <code>detail</code> how fine the mesh is.</p>`,
    notes: ['2D is one fragment shader over the screen. 3D adds a second WebGL program for the mesh, in the same context.'],
    code: 'modes', rows: 'view',
    live: { style: 'granite', seed: 67, lines: { count: 36, indexEvery: 4 }, mode: '3d', extent: 'block', elevation: 0.7, camera: { motion: 'still', azimuth: 42, elevation: 34, radius: 1.75 }, theme: { mode: 'dark' } },
  },
  {
    id: 'camera', title: 'Camera and motions', nav: 'Camera',
    lede: 'Where you look from, and the path the camera follows.',
    body: `<p>In 3D a camera looks at the terrain. <code>azimuth</code> turns it around, <code>elevation</code> tilts it, <code>radius</code> sets the distance and the pan moves the point it looks at. <code>motion</code> puts it on a path: orbit, push, flyover or drone.<sup class="fn"></sup></p>
<p>2D keeps its own view, <code>view2d</code>: a pan and a zoom up to eight times closer, apart from the 3D camera.</p>`,
    notes: ['At azimuth 0 the camera looks from the south, with north at the top. As the angle grows, north turns towards the right.'],
    code: 'camera', rows: 'camera',
    live: { style: 'long-ridge', seed: 181, mode: '3d', terrain: { roughness: 0.62, sharpness: 0.22 }, lines: { count: 34 }, camera: { motion: 'flyover' }, theme: { mode: 'dark' } },
  },
  {
    id: 'export', title: 'Export', nav: 'Export',
    lede: 'PNG at any size, frame-exact sequences and short clips.',
    body: `<p><code>snapshot</code> draws one PNG in the background, at any size, while the live view keeps its size and keeps moving. Give it a <code>frame</code> and the same settings always give the same picture, so a loop of snapshots is a frame-exact sequence for an editor or ffmpeg.<sup class="fn"></sup></p>
<p><code>record</code> encodes a 3D clip with a moving camera in the browser, as MP4 (H.264) or WebM (VP8), from half a second to 12 seconds.<sup class="fn"></sup></p>`,
    notes: ['The largest image is the GPU\'s renderbuffer limit, usually 8192 or 16384 px. Exports always centre the terrain and ignore <code>setInsets</code>.', 'Video uses the browser\'s WebCodecs encoder. WebM works where the browser can encode VP8.'],
    code: 'export',
    live: { style: 'gentle-summit', seed: 131, terrain: { terracing: 0.85, peaks: 2 }, lines: { count: 36, width: 0.14 }, mode: '3d', camera: { motion: 'orbit', azimuth: 294.7, elevation: 34, radius: 2.3 }, theme: { mode: 'dark', paper: '#16130f', ink: '#e0b089' } },
  },
  {
    id: 'heightfields', title: 'Heightfields', nav: 'Heightfields',
    lede: 'Any square grid of heights, drawn as contours.',
    body: `<p>Under every location is a heightfield: a square grid of heights from 0 (low) to 1 (high). Pass your own to draw any data as contours: a scan, a simulation, a game level or a function. <code>null</code> brings the landform back.<sup class="fn"></sup></p>`,
    notes: ['Row 0 is the south edge and column 0 the west. <code>aspect</code> is the area\'s width over its height, so the block matches the map.'],
    code: 'heightfields',
    live: { style: 'gentle-summit', mode: '3d', extent: 'endless', elevation: 0.5, lines: { count: 44, width: 0.22, opacity: 0.85, indexEvery: 5 }, camera: { azimuth: 20, elevation: 40, radius: 1.75 }, theme: { mode: 'dark', ink: '#c9c2b4', paper: '#0b0b0d' }, field: 'volcano' },
  },
  {
    id: 'instance', title: 'The instance', nav: 'Instance',
    lede: 'What createTopography returns.',
    body: `<p><code>createTopography</code> returns the instance. The component hands it to <code>onReady</code>, and the element keeps it as <code>element.topography</code>.<sup class="fn"></sup></p>`,
    notes: ['A third argument takes renderer options: <code>maxPixelRatio</code> (2), <code>maxPixels</code> (4,147,200) and <code>forceWebGL1</code> (false). You rarely need them.'],
    members: true,
    live: { style: 'drifting-lobes', seed: 11, terrain: { variant: 0.15 }, lines: { count: 22, width: 0.18 }, theme: { mode: 'dark', ink: '#9fb0cc' } },
  },
  {
    id: 'react', title: 'React', nav: 'React',
    lede: 'A component and a hook, safe for server rendering.',
    body: `<p><code>&lt;Topography&gt;</code> takes every setting as a prop: <code>landform</code>, <code>location</code>, <code>look</code>, <code>seed</code>, <code>lines</code>, <code>terrain</code>, <code>motion</code>, <code>layout</code>, <code>theme</code>, <code>mode</code>, <code>elevation</code>, <code>extent</code>, <code>detail</code>, <code>quality</code>, <code>camera</code> and <code>view2d</code>, plus <code>options</code> and <code>onReady</code>. Children are drawn on top.</p>
<p>Each group updates only when its values change, so a new object with the same values does nothing. A change to <code>options</code> makes a new renderer; every other change updates in place.<sup class="fn"></sup></p>`,
    notes: ['The package starts with <code>\'use client\'</code>. On the server it renders an empty <code>div</code>, and the canvas appears after hydration.'],
    code: 'react',
    live: { style: 'granite', seed: 191, lines: { count: 54, width: 0.1, opacity: 0.62 }, theme: { mode: 'dark', ink: '#d7d2c8' } },
  },
  {
    id: 'element', title: 'The element', nav: 'Element',
    lede: 'One tag for plain HTML, with every setting as an attribute.',
    body: `<p>Import <code>topographic/element</code> once and use <code>&lt;topographic-map&gt;</code> anywhere. Every setting has an attribute, a changed attribute applies right away, and a removed one goes back to its default. <code>element.snapshot()</code> is a shortcut to the instance.<sup class="fn"></sup></p>`,
    notes: ['Importing it on the server is safe: it registers the element only where <code>customElements</code> exists.'],
    code: 'element',
    live: { style: 'long-ridge', lines: { count: 36 }, terrain: { peaks: 2 }, theme: { mode: 'dark' } },
  },
  {
    id: 'page', title: 'In your page', nav: 'In your page',
    lede: 'Sizing, content on top, CSS variables and transparent paper.',
    body: `<p>The canvas fills its element and the element is <code>display: block</code>, so the element sets the size. To put the terrain behind content, position it under the content; with React, children are drawn on top for you.</p>
<p>Colours can come from CSS: <code>--topographic-ink</code> and <code>--topographic-paper</code> are read when no colour setting is passed. With transparent paper your own background shows through. If you change a variable later, call <code>update({ theme: {} })</code> to read it again.<sup class="fn"></sup></p>`,
    notes: ['The canvas is <code>aria-hidden</code>: put real content on top, and say in text what the terrain shows if it carries meaning.'],
    code: 'page',
    live: { style: 'dunes', seed: 5, lines: { count: 16, width: 0.4 }, theme: { mode: 'dark', ink: '#8fd6c8', paper: '#06201f' }, motion: { sparkle: 0.3 } },
  },
  {
    id: 'performance', title: 'Quality and performance', nav: 'Performance',
    lede: 'Three tiers, a frame-rate watch and no work when nothing shows.',
    body: `<p>Drawing stops when the element is off screen or the tab is hidden, and with <code>speed</code> 0 there is no loop at all. <code>quality</code> sets the graphics budget: the pixel ratio, the pixel count and the mesh size.<sup class="fn"></sup></p>
<p><code>auto</code> starts a phone at low and a desktop at high, then steps down a tier when frames miss 60 Hz, or 120 Hz once it has seen that refresh. It does not step back up. <code>low</code>, <code>medium</code> and <code>high</code> stay put.</p>`,
    notes: ['Lines are smoothed in the shader, so they stay sharp at a lower pixel ratio. <code>stats.quality</code> says which tier is drawing.'],
    code: 'performance', tiers: true,
    live: { style: 'granite', seed: 3, terrain: { roughness: 0.6 }, mode: '3d', quality: 'low', theme: { mode: 'dark' } },
  },
  {
    id: 'accessibility', title: 'Accessibility', nav: 'Accessibility',
    lede: 'Still for people who ask for less motion, quiet for screen readers.',
    body: `<p>When the system asks for reduced motion, topographic draws one still frame and ignores <code>speed</code>, and it follows the setting as it changes. The canvas is <code>aria-hidden</code>, because it is drawing, not content.</p>
<p>For text on top, <code>layout.fade</code> softens the lines behind a central column and <code>layout.anchor</code> moves the summit away from it. Check the contrast of your text against both ink and paper.</p>`,
    notes: [],
    live: { style: 'gentle-summit', seed: 197, layout: { fade: 0.9 }, lines: { count: 14, width: 0.14 }, motion: { speed: 0 }, theme: { mode: 'dark' } },
  },
  {
    id: 'agents', title: 'AI agents', nav: 'AI agents',
    lede: 'Plain-text docs and live tools for agents.',
    body: `<p>The playground serves <a href="https://topographic.yahyapak.dev/llms.txt" target="_blank" rel="noreferrer"><code>llms.txt</code></a>, <code>llms-full.txt</code> and Markdown pages under <code>/docs/</code>, made from the same settings table as the code.<sup class="fn"></sup></p>
<p>In browsers with <a href="https://github.com/webmachinelearning/webmcp" target="_blank" rel="noreferrer">WebMCP</a>, the playground gives an agent tools to change settings, pick a place, take a screenshot, record a video and get the code.</p>`,
    notes: ['WebMCP needs a secure page, HTTPS or localhost. Without it no tools are registered and the page works as normal.'],
    code: 'agents', tools: true,
    live: { style: 'five-petals', seed: 37, lines: { count: 26, width: 0.2 }, theme: { mode: 'dark', paper: '#16131a', ink: '#cbb6ea' } },
  },
  {
    id: 'limits', title: 'Limits', nav: 'Limits',
    lede: 'What topographic does not do yet.',
    body: '<p>These are true of 0.5.0 and of the proposed 0.6.0.</p>',
    notes: [],
    limits: true,
    live: { style: 'dunes', seed: 163, motion: { speed: 0 }, lines: { count: 26, width: 0.14 }, theme: { mode: 'dark' } },
  },
  {
    id: 'questions', title: 'Questions', nav: 'Questions',
    lede: 'Short answers.',
    body: '',
    notes: [],
    questions: true,
    live: { style: 'drifting-lobes', theme: { mode: 'dark' } },
  },
];

export const byId = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
