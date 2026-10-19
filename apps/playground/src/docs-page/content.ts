// The docs page's words and data. Prose is small pieces of HTML; a `<sup class="fn"></sup>` in a body marks where
// the section's next note belongs, and the notes sit in the margin. Ranges and defaults come from the library itself,
// so the tables cannot drift from the code.
import {
  CAMERA_MOTIONS, CAMERA_SPEED_MAX, DEFAULT_CAMERA, DEFAULT_DETAIL, DEFAULT_ELEVATION, DEFAULT_EXTENT, PARAMS, QUALITY_TIERS, RADIUS_MAX, RADIUS_MIN,
  LOOKS, SHAPES, THEME_DEFAULTS, ZOOM_MAX, ZOOM_MIN, findLook, type LookId, type SettingsInput,
} from 'topographic';
import { TAGLINE } from '../content';
import type { Snippet } from './code';

export const PLAYGROUND = 'https://topographic.yahyapak.dev';
export const REPO = 'https://github.com/yahyabedirhan/topographic';
export const NPM = 'https://www.npmjs.com/package/topographic';
export const NPM_REACT = 'https://www.npmjs.com/package/topographic-react';
export const SITE = 'https://yahyapak.dev/projects/topographic';
export const PRIVACY = `${REPO}/blob/main/PRIVACY.md`;
export const LICENSE = `${REPO}/blob/main/LICENSE`;
export const WEBMCP = 'https://github.com/webmachinelearning/webmcp';
export const TERRAIN_TILES = 'https://registry.opendata.aws/terrain-tiles/';
export const AWS_OPEN_DATA = 'https://registry.opendata.aws/';
const FFMPEG = 'https://ffmpeg.org/';
const WEBCODECS = 'https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API';
const NEXT = 'https://nextjs.org/';
const HEADLESS = 'https://developer.chrome.com/docs/chromium/headless';

/** A link that opens in a new tab. */
export const ext = (href: string, text: string) => `<a href="${href}" target="_blank" rel="noreferrer">${text}</a>`;

const hex = (rgba: readonly number[]) => `#${rgba.slice(0, 3).map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;
export const DARK = { ink: hex(THEME_DEFAULTS.dark.ink), paper: hex(THEME_DEFAULTS.dark.paper) };
export const LIGHT = { ink: hex(THEME_DEFAULTS.light.ink), paper: hex(THEME_DEFAULTS.light.paper) };

/** The two ways in. */
export const INSTALL_WAYS = {
  agent: { label: 'Agent skill', cmd: 'npx skills add yahyabedirhan/topographic' },
  npm: { label: 'npm package', cmd: 'npm install topographic', react: 'npm install topographic topographic-react' },
} as const;

export interface DocSection {
  id: string;
  title: string;
  /** The name in the nav. */
  nav: string;
  lede: string;
  body: string;
  notes: string[];
  /** The key of the section's code in CODE. */
  code?: string;
  /** A settings table from the library's parameters of this group. */
  params?: 'lines' | 'terrain' | 'motion' | 'layout';
  rows?: 'theme' | 'view' | 'camera';
  members?: boolean;
  tiers?: boolean;
  tools?: boolean;
  limits?: boolean;
  questions?: boolean;
  contact?: boolean;
  /** What the section's figure draws. */
  live?: SettingsInput;
}

/** The library's looks by name, in the order of the playground's dock. */
export const LOOK_NAMES = LOOKS.map((l) => l.name);

export const GROUPS: { name: string; ids: string[] }[] = [
  { name: 'Start', ids: ['what', 'install', 'first'] },
  { name: 'Land', ids: ['locations', 'landforms', 'looks'] },
  { name: 'Settings', ids: ['lines', 'terrain', 'motion', 'layout', 'theme'] },
  { name: '3D', ids: ['modes', 'camera'] },
  { name: 'Output', ids: ['export', 'heightfields'] },
  { name: 'API', ids: ['instance', 'react', 'element', 'page'] },
  { name: 'Care', ids: ['performance', 'accessibility', 'agents'] },
  { name: 'Last', ids: ['limits', 'questions'] },
];

export const SECTIONS: DocSection[] = [
  {
    id: 'what', title: 'What it is', nav: 'What it is',
    lede: 'Real places and generated land, drawn live in 2D and 3D.',
    body: '<p>You describe land in a few settings, or name a real place, and topographic draws it as contour lines that move, flat like a map or lifted into a landscape under a camera. The same settings and seed draw the same land on every screen.<sup class="fn"></sup></p>',
    notes: ['The whole core package, the element and the video encoder included, is about 25 kB gzipped.'],
  },
  {
    id: 'install', title: 'Install', nav: 'Install',
    lede: `One command for your agent, or one for ${ext(NPM, 'npm')}.`,
    body: `<p>${ext(NPM, '<code>topographic</code>')} holds the JavaScript API and the HTML element. ${ext(NPM_REACT, '<code>topographic-react</code>')} adds the React component.<sup class="fn"></sup></p>`,
    notes: ['Importing <code>topographic/element</code> registers the element. Nothing else runs on import.'],
  },
  {
    id: 'first', title: 'First terrain', nav: 'First terrain',
    lede: 'An element and a few settings. Everything else is one more setting.',
    body: '<p>Give topographic an element and some settings. It adds a canvas that fills the element and starts drawing.<sup class="fn"></sup> Every setting on this page goes into this same call, onto the React component, or onto the element as an attribute.</p>',
    notes: ['The canvas fills its element, so the element needs a height. <a href="#page">Sizing and layering</a> shows the CSS.'],
    code: 'first',
    live: { shape: 'long-ridge', mode: '3d', theme: { mode: 'dark' } },
  },
  {
    id: 'locations', title: 'Real places', nav: 'Real places',
    lede: 'Name a mountain. Get its contours.',
    body: '<p>Any place on Earth can be the land. Ten come built in by name, from Everest to Yosemite Valley.<sup class="fn"></sup> Any other area on Earth comes in by its corners, through <code>fetchLocation()</code><sup class="fn"></sup></p>\n<p>A place draws its real heights, so the seed, the terrain settings and <code>motion.warp</code> rest while it is on. Lines, colours, layout and the camera still apply.</p>',
    notes: [
      `The ${ext(PLAYGROUND, 'playground')} does this today in its Map panel, and a link such as ${ext(`${PLAYGROUND}/?place=everest`, '<code>?place=everest</code>')} opens a place. Its Map menu holds 108 places to search, ${ext(`${REPO}/blob/main/docs/places.md`, 'listed here')}. The figures here use the playground's own pipeline.`,
      `Heights come from ${ext(TERRAIN_TILES, 'Mapzen Terrain Tiles')} on ${ext(AWS_OPEN_DATA, 'AWS Open Data')}.`,
    ],
    code: 'locations',
  },
  {
    id: 'landforms', title: 'Generated shapes', nav: 'Generated shapes',
    lede: 'A shape, a seed and a few settings. Endless land.',
    body: '<p>Generated land grows from a base <code>shape</code>, a <code>seed</code> and the terrain settings.<sup class="fn"></sup> The seed, a whole number from 0 to 999999, gives every shape a million variations. Each terrain setting bends it further, so the seven base shapes are only where you start.<sup class="fn"></sup></p>',
    notes: [
      'There are seven base shapes, from <code>drifting-lobes</code> and <code>granite</code> to <code>dunes</code>, and the Shape row under the figure lists them all.',
      'An unknown shape draws <code>drifting-lobes</code> and prints one warning in the console.',
    ],
    live: { shape: 'granite', seed: 4127, terrain: { peaks: 3, spread: 0.55, roughness: 0.35, sharpness: 0.6, terracing: 0 }, lines: { count: 40, indexEvery: 5 }, mode: '3d', camera: { motion: 'orbit' }, theme: { mode: 'dark' } },
  },
  {
    id: 'looks', title: 'Looks', nav: 'Looks',
    lede: 'A look is a finished design with a name, such as survey-map or sea-dunes.',
    body: `<p>A look is a finished design with a name. Pass it, and change any setting on top of it. What you pass wins over the look.</p>\n<p>There are ${LOOK_NAMES.length} looks, the same ones as in the ${ext(PLAYGROUND, 'playground')}'s dock, in the same order.<sup class="fn"></sup></p>`,
    notes: [`The looks are ${LOOK_NAMES.slice(0, -1).join(', ')} and ${LOOK_NAMES[LOOK_NAMES.length - 1]}. A look's id is its name in lower case with dashes, such as <code>night-flower</code>`],
    code: 'looks',
  },
  {
    id: 'lines', title: 'Lines', nav: 'Lines',
    lede: 'How many contours, how thick, how strong, and which are bold.',
    body: '<p>Lines are the contours themselves. <code>count</code> sets how many cross the land, <code>width</code> and <code>opacity</code> how they sit on the paper, and <code>indexEvery</code> draws every Nth line bolder, like the index lines on a survey map.<sup class="fn"></sup></p>',
    notes: [`The ${ext(PLAYGROUND, 'playground')} calls <code>indexEvery</code> Bold lines, written “1 in 5”, and shows width as 0.5 to 4 px.`],
    params: 'lines',
    live: { shape: 'long-ridge', seed: 113, lines: { count: 46, indexEvery: 5, opacity: 0.55, width: 0.12 }, theme: { mode: 'dark', ink: '#e8e6e1', paper: '#141414' } },
  },
  {
    id: 'terrain', title: 'Terrain', nav: 'Terrain',
    lede: 'Summits, spread, roughness, sharpness and steps.',
    body: '<p>Terrain settings shape generated land. They set how many summits merge into it and how far apart, how rough the slopes are, how sharp the tops, and whether the lines group into terraces.<sup class="fn"></sup></p>',
    notes: ['<code>variant</code> depends on the shape. Today it matters most for drifting-lobes, where three lobes become four.'],
    params: 'terrain',
    live: { shape: 'gentle-summit', terrain: { peaks: 3, spread: 0.6, roughness: 0.2, terracing: 0.4 }, layout: { anchor: 1, fade: 0 }, theme: { mode: 'dark' } },
  },
  {
    id: 'motion', title: 'Motion', nav: 'Motion',
    lede: 'The land moves by itself. It drifts, wobbles and sparkles.',
    body: '<p>The field drifts and slowly morphs, the lines wobble with it, and small bright dots travel along them. <code>speed</code> 0 holds one frame and stops the animation loop; it draws again only when something changes.<sup class="fn"></sup></p>',
    notes: ['This is the land\'s own motion. The camera moves on its own path, set in <a href="#camera">Camera</a>.'],
    params: 'motion',
    live: { shape: 'seed-pod', seed: 211, motion: { speed: 2, warp: 0.8, sparkle: 1 }, lines: { count: 30, width: 0.16 }, theme: { mode: 'dark', paper: '#16131a', ink: '#b9a4e0' } },
  },
  {
    id: 'layout', title: 'Layout', nav: 'Layout',
    lede: 'Where the summit sits, and how the lines make room for text.',
    body: '<p><code>anchor</code> moves the main summit from the side (0) to the centre (1). <code>fade</code> softens the lines behind a text column about 600 px wide in the middle, so a heading on top stays readable.<sup class="fn"></sup></p>',
    notes: ['Dunes starts with a lighter fade, 0.5 instead of 0.7. Every base shape can bring its own defaults.'],
    code: 'layout', params: 'layout',
  },
  {
    id: 'theme', title: 'Theme and colours', nav: 'Theme',
    lede: 'Two colours, ink and paper, and a light or dark mode.',
    body: '<p>Two colours draw everything, <code>ink</code> for the lines and <code>paper</code> for the ground. Each comes from the setting, then from a CSS variable, then from the light or dark default.<sup class="fn"></sup> <code>theme.mode</code> is <code>auto</code>, <code>light</code> or <code>dark</code>, and auto follows the system as it changes.</p>\n<p>In light mode the ink is laid on the paper. In dark mode the lines glow softly on dark paper.</p>',
    notes: ['Any CSS colour works, including names and <code>oklch()</code>. Paper can be <code>transparent</code>, so your page shows through.'],
    rows: 'theme',
    live: { shape: 'five-petals', seed: 179, lines: { count: 44, indexEvery: 4, width: 0.12, opacity: 0.75 }, layout: { anchor: 0.6, fade: 0 }, theme: { mode: 'dark', paper: '#10151c', ink: '#a9c7e4' } },
  },
  {
    id: 'modes', title: '2D and 3D', nav: '2D and 3D',
    lede: 'The same land as a flat map or as a landscape.',
    body: '<p>2D is the flat map and the default. 3D lifts the same contour field into a mesh painted with the same lines. With the same seed and settings you get the same land in both, and you can switch at any time.<sup class="fn"></sup></p>\n<p><code>elevation</code> sets how tall the land stands, <code>extent</code> whether it is an endless plane that fades into the paper or a solid block, and <code>detail</code> how fine the mesh is.</p>',
    notes: ['2D is one fragment shader over the screen. 3D adds a second WebGL program for the mesh, in the same context.'],
    rows: 'view',
    live: { shape: 'granite', seed: 67, lines: { count: 36, indexEvery: 4 }, mode: '3d', extent: 'block', elevation: 0.7, camera: { motion: 'still', azimuth: 42, elevation: 34, radius: 1.75 }, theme: { mode: 'dark' } },
  },
  {
    id: 'camera', title: 'Camera and motions', nav: 'Camera',
    lede: 'Where you look from, and the path the camera follows.',
    body: '<p>In 3D a camera looks at the terrain. <code>azimuth</code> turns it around, <code>elevation</code> tilts it, <code>radius</code> sets the distance and the pan moves the point it looks at. <code>motion</code> puts it on a path, such as orbit or flyover.<sup class="fn"></sup></p>\n<p>2D keeps its own pan and zoom in <code>view2d</code>, apart from the 3D camera.</p>',
    notes: ['At azimuth 0 the camera looks from the south, with north at the top. As the angle grows, north turns towards the right.'],
    rows: 'camera',
    live: { shape: 'long-ridge', seed: 181, mode: '3d', terrain: { roughness: 0.62, sharpness: 0.22 }, lines: { count: 34 }, camera: { motion: 'flyover' }, theme: { mode: 'dark' } },
  },
  {
    id: 'export', title: 'Export', nav: 'Export',
    lede: 'PNG at any size, frame-exact sequences and clips.',
    body: `<p><code>snapshot</code> draws one PNG in the background, at any size, while the live view keeps its size and keeps moving. Give it a <code>frame</code> and the same settings always give the same picture, so a loop of snapshots is a frame-exact sequence for an editor or ${ext(FFMPEG, 'ffmpeg')}.<sup class="fn"></sup></p>\n<p><code>record</code> encodes a clip with a moving camera right in the browser, as MP4 or WebM.<sup class="fn"></sup></p>`,
    notes: ['Exports always centre the terrain and ignore <code>setInsets</code>', 'Pass <code>format: \'mp4\'</code> or <code>\'webm\'</code>, a length in seconds and a frame rate.'],
    code: 'export',
  },
  {
    id: 'heightfields', title: 'Heightfields', nav: 'Heightfields',
    lede: 'Any square grid of heights, drawn as contours.',
    body: '<p>Under every place is a heightfield, a square grid of heights from 0 (low) to 1 (high). Pass your own to draw any data as contours, from a scan to a function. <code>null</code> brings generated land back.<sup class="fn"></sup></p>',
    notes: ['Row 0 is the south edge and column 0 the west. <code>aspect</code> is the area\'s width over its height, so the block matches the map.'],
    code: 'heightfields',
    live: { shape: 'gentle-summit', mode: '3d', extent: 'endless', elevation: 0.5, lines: { count: 44, width: 0.22, opacity: 0.85, indexEvery: 5 }, camera: { azimuth: 20, elevation: 40, radius: 1.75 }, theme: { mode: 'dark', ink: '#c9c2b4', paper: '#0b0b0d' } },
  },
  {
    id: 'instance', title: 'The instance', nav: 'Instance',
    lede: 'What createTopography returns.',
    body: '<p><code>createTopography</code> returns the instance. The component hands it to <code>onReady</code>, and the element keeps it as <code>element.topographic</code><sup class="fn"></sup></p>',
    notes: ['A third argument takes renderer options, such as <code>maxPixelRatio</code>. You rarely need them.'],
    members: true,
  },
  {
    id: 'react', title: 'React', nav: 'React',
    lede: 'One component for React, safe to render on the server.',
    body: '<p><code>&lt;Topography&gt;</code> takes every setting on this page under the same name, plus <code>options</code> and <code>onReady</code>. Your content sits on top of the terrain.</p>\n<p>Each group updates only when its values change, so a new object with the same values does nothing. A change to <code>options</code> makes a new renderer; every other change updates in place.<sup class="fn"></sup></p>',
    notes: ['On the server the component draws an empty box. The terrain appears once the page runs in the browser.'],
    code: 'react',
  },
  {
    id: 'element', title: 'The element', nav: 'Element',
    lede: 'One tag for plain HTML, with every setting as an attribute.',
    body: '<p>Import <code>topographic/element</code> once and use <code>&lt;topographic-view&gt;</code> anywhere. Every setting has an attribute, a changed attribute applies right away, and a removed one goes back to its default. <code>element.snapshot()</code> is a shortcut to the instance.<sup class="fn"></sup></p>',
    notes: ['Importing it on the server is safe, because it registers the element only where <code>customElements</code> exists.'],
    code: 'element',
  },
  {
    id: 'page', title: 'Sizing and layering', nav: 'Sizing and layering',
    lede: 'Sizing, content on top, CSS variables and transparent paper.',
    body: '<p>The canvas fills its element and the element is <code>display: block</code>, so the element sets the size. To put the terrain behind content, position it under the content; with React, your content sits on top for you.</p>\n<p>Colours can come from CSS. <code>--topographic-ink</code> and <code>--topographic-paper</code> are read when no colour setting is passed. With transparent paper your own background shows through. If you change a variable later, call <code>update({ theme: {} })</code> to read it again.<sup class="fn"></sup></p>',
    notes: ['The canvas is <code>aria-hidden</code>. Put real content on top, and say in text what the terrain shows if it carries meaning.'],
    code: 'page',
  },
  {
    id: 'performance', title: 'Quality and performance', nav: 'Performance',
    lede: 'Three tiers, a frame-rate watch and no work when nothing shows.',
    body: '<p>Drawing stops when the element is off screen or the tab is hidden, and with <code>speed</code> 0 there is no loop at all. <code>quality</code> sets the graphics budget, which covers the pixel ratio, the pixel count and the mesh size.<sup class="fn"></sup></p>\n<p><code>auto</code> starts a phone at low and a desktop at high, then steps down a tier when frames miss 60 Hz, or 120 Hz once it has seen that refresh. It does not step back up. <code>low</code>, <code>medium</code> and <code>high</code> stay put.</p>',
    notes: ['Lines are smoothed in the shader, so they stay sharp at a lower pixel ratio. <code>stats.quality</code> says which tier is drawing.'],
    code: 'performance', tiers: true,
    live: { shape: 'granite', seed: 3, terrain: { roughness: 0.6 }, mode: '3d', quality: 'low', theme: { mode: 'dark' } },
  },
  {
    id: 'accessibility', title: 'Accessibility', nav: 'Accessibility',
    lede: 'Still for people who ask for less motion, quiet for screen readers.',
    body: '<p>When the system asks for reduced motion, topographic draws one still frame and ignores <code>speed</code>, and it follows the setting as it changes. The canvas is <code>aria-hidden</code>, because it is drawing, not content.</p>\n<p>For text on top, <code>layout.fade</code> softens the lines behind a central column and <code>layout.anchor</code> moves the summit away from it. Check the contrast of your text against both ink and paper.</p>',
    notes: [],
  },
  {
    id: 'agents', title: 'AI agents', nav: 'AI agents',
    lede: 'Plain-text docs and live tools for agents.',
    body: `<p>The ${ext(PLAYGROUND, 'playground')} serves ${ext(`${PLAYGROUND}/llms.txt`, '<code>llms.txt</code>')}, ${ext(`${PLAYGROUND}/llms-full.txt`, '<code>llms-full.txt</code>')} and Markdown pages such as ${ext(`${PLAYGROUND}/docs/params.md`, '<code>/docs/params.md</code>')}, made from the same settings table as the code.</p>\n<p>In browsers with ${ext(WEBMCP, 'WebMCP')}, the ${ext(PLAYGROUND, 'playground')} gives an agent tools to change settings, pick a place, take a screenshot, record a video and get the code.</p>`,
    notes: [],
    code: 'agents', tools: true,
  },
  {
    id: 'limits', title: 'Limits', nav: 'Limits',
    lede: 'What topographic does not do yet.',
    body: '',
    notes: [],
    limits: true,
  },
  {
    id: 'questions', title: 'Questions', nav: 'Questions',
    lede: 'Short answers.',
    body: '',
    notes: [],
    questions: true,
  },
  {
    id: 'feedback', title: 'Share feedback', nav: 'Share feedback',
    lede: 'Hi, I\'m <a href="https://yahyapak.dev" target="_blank" rel="noreferrer">Yahya</a>, the developer of <span class="wm-inline">topographic</span>.',
    body: '<p>I\'d love to hear what you make, and what doesn\'t work. If you have any comments, feedback or anything to report, you can contact me here:</p>',
    notes: [],
    contact: true,
  },
];

export const byId: Record<string, DocSection> = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

/** Playground looks that have a screenshot (apps/playground/src/looks.ts). */
/** Looks that have a screenshot, by id; the names come from the library. */
export const LOOK_GALLERY = ([
  ['survey-ridge', 'look-survey-ridge-2d'], ['sea-dunes', 'look-sea-dunes-2d'], ['rose-pod', 'look-rose-pod-2d'],
  ['stepped-petals', 'look-stepped-petals-2d'], ['stone-grain', 'look-stone-grain-2d'], ['centred-lobes', 'look-centred-lobes-2d'],
  ['night-flower', 'look-night-flower-3d'], ['terraces', 'look-terraces-3d'], ['rocky-spine', 'look-rocky-spine-3d'],
] as const satisfies readonly (readonly [LookId, string])[]).map(([id, shot]) => ({ name: findLook(id)!.name, shot }));

export const MOTIONS = [
  { id: 'still', what: 'The camera stays where you put it.' },
  { id: 'orbit', what: 'Turns around the terrain at 14° a second.' },
  { id: 'push', what: 'Moves in by up to a quarter of the distance and back, tilting a few degrees.' },
  { id: 'flyover', what: 'Sweeps up to 62° to each side, a little lower and closer.' },
  { id: 'drone', what: 'Turns at 11° a second while it rises, falls and drifts in and out.' },
];

export interface Row { key: string; attr: string; range: string; def: string; what: string }

const r = (min: number, max: number) => `${min}–${max}`;
/** The guide's wording, which is plainer than the one-liners in params.ts. */
const GUIDE_WHAT: Record<string, string> = {
  'lines.count': 'How many contour lines there are.',
  'lines.width': 'How thick each line is.',
  'lines.opacity': 'How strongly the lines show against the paper.',
  'lines.indexEvery': 'Draws every Nth line bolder, like the index lines on a map. 0 turns it off.',
  'terrain.peaks': 'How many summits the terrain has.',
  'terrain.spread': 'How far the extra peaks are from the main summit.',
  'terrain.roughness': 'Noise on the slopes. Low is smooth hills, high is rocky ground.',
  'terrain.sharpness': 'Below 0.5 summits get flatter. Above 0.5 they get sharper.',
  'terrain.terracing': 'Groups the lines into steps.',
  'terrain.variant': 'Changes the land in a way that depends on the base shape. For drifting-lobes, three lobes become four.',
  'motion.speed': 'Animation speed. 0 stops the animation.',
  'motion.warp': 'How much the lines wobble as they move.',
  'motion.sparkle': 'Small bright dots that travel along the lines.',
  'layout.anchor': '0 keeps the summit to the side. 1 puts it in the centre.',
  'layout.fade': 'Fades the lines behind a text column in the centre.',
};
export const paramRows = (group: string): Row[] => PARAMS.filter((p) => p.group === group).map((p) => ({
  key: `${p.group}.${p.key}`, attr: p.attr, range: `${r(p.min, p.max)}${'integer' in p && p.integer ? ', whole' : ''}`, def: String(p.default), what: GUIDE_WHAT[`${p.group}.${p.key}`] ?? p.description,
}));

const C = DEFAULT_CAMERA;
export const VIEW_ROWS: Row[] = [
  { key: 'mode', attr: 'mode', range: '2d, 3d', def: '2d', what: 'The flat map, or the same map as a landscape.' },
  { key: 'elevation', attr: 'elevation', range: '0–1', def: String(DEFAULT_ELEVATION), what: 'How tall the 3D terrain is. 0 is flat like the map.' },
  { key: 'extent', attr: 'extent', range: 'endless, block', def: DEFAULT_EXTENT, what: 'A plane that fades into the paper, or a solid slab whose sides fade softly.' },
  { key: 'detail', attr: 'detail', range: '0–1', def: String(DEFAULT_DETAIL), what: 'Points in the 3D surface, from a 32² grid to a 160² grid.' },
  { key: 'quality', attr: 'quality', range: 'auto, low, medium, high', def: 'auto', what: 'Graphics budget. See <a href="#performance">Quality and performance</a>.' },
];
export const CAMERA_ROWS: Row[] = [
  { key: 'camera.azimuth', attr: 'azimuth', range: 'any number, degrees', def: String(C.azimuth), what: 'The angle around the terrain. 0 looks from the south, with north up.' },
  { key: 'camera.elevation', attr: 'camera-elevation', range: '2–80, degrees', def: String(C.elevation), what: 'The angle above the horizon. Never below the terrain.' },
  { key: 'camera.radius', attr: 'radius', range: r(RADIUS_MIN, RADIUS_MAX), def: String(C.radius), what: 'The distance from the centre of the terrain.' },
  { key: 'camera.motion', attr: 'camera-motion', range: CAMERA_MOTIONS.join(', '), def: C.motion, what: 'A path for the camera. The land keeps its own motion.' },
  { key: 'camera.speed', attr: 'camera-speed', range: r(0, CAMERA_SPEED_MAX), def: String(C.speed), what: 'How fast the camera moves along its path. 1 is the path\'s own pace; 0 holds it.' },
  { key: 'camera.panX, panZ', attr: 'pan-x, pan-z', range: '−6–6', def: '0', what: 'The point the camera looks at, east and south of the centre. It stays over the terrain.' },
  { key: 'view2d.x, y', attr: 'view-x, view-y', range: '−6–6', def: '0', what: 'The 2D map\'s own pan, in screen heights. 3D ignores it.' },
  { key: 'view2d.zoom', attr: 'view-zoom', range: r(ZOOM_MIN, ZOOM_MAX), def: '1', what: 'The 2D map\'s zoom, up to eight times closer.' },
];
export const THEME_ROWS: Row[] = [
  { key: 'theme.mode', attr: 'theme', range: 'auto, light, dark', def: 'auto', what: 'auto follows the system and changes with it.' },
  { key: 'theme.ink', attr: 'ink', range: 'any CSS colour', def: `${DARK.ink} dark, ${LIGHT.ink} light`, what: 'The line colour.' },
  { key: 'theme.paper', attr: 'paper', range: 'any CSS colour, transparent', def: `${DARK.paper} dark, ${LIGHT.paper} light`, what: 'The ground colour.' },
];

export const TIERS = Object.values(QUALITY_TIERS).map((t) => ({
  id: t.id, dpr: t.maxPixelRatio, px: t.maxPixels.toLocaleString('en-US'), mesh: `${t.meshCap}²`,
}));

export const SHAPE_IDS = SHAPES.map((s) => s.id);

export const MEMBERS: [string, string][] = [
  ['update(settings)', 'Changes some settings and applies them right away. Values are kept in range; only changed values reach the GPU.'],
  ['snapshot(options)', 'Draws one PNG in the background and returns it as a Blob.'],
  ['record(options)', 'Records a 3D clip with a moving camera and returns an MP4 or WebM Blob.'],
  ['setHeightfield(field | null)', 'Draws your own heights instead of generated land. null brings the generated land back.'],
  ['setInsets({ top, right, bottom, left } | null)', 'Tells the 3D view how much of it your UI covers, in CSS pixels, so the terrain centres in the free space.'],
  ['clampPan(panX, panZ)', 'Returns the pan as [x, z], limited so the view stays over the terrain.'],
  ['hold(paused)', 'Stops drawing while another WebGL view needs the GPU. The paper colour stays.'],
  ['destroy()', 'Stops drawing, removes the canvas and listeners, and frees the WebGL context.'],
  ['settings', 'The current settings, with every value filled in.'],
  ['stats', 'The frame rate, the time to draw a frame, the mesh size and the tier drawing now, as <code>{ fps, frameMs, mesh, quality }</code>. The mesh is 0 in 2D.'],
  ['pose', 'Where the 3D camera is on its path now, as <code>{ azimuth, elevation, radius, panX, panZ }</code>'],
  ['insets', 'The insets in use, all 0 by default.'],
  ['status', "<code>'webgl2'</code>, <code>'webgl1'</code>, <code>'fallback'</code>, <code>'lost'</code> or <code>'destroyed'</code>"],
  ['canvas', 'The canvas element.'],
];

export const SNAPSHOT_OPTIONS: [string, string, string][] = [
  ['frame', 'Animation time in ms. The same settings and frame always give the same image.', 'current frame'],
  ['width, height', 'Output size. Give one to keep the view\'s shape.', 'drawing size'],
  ['region', 'Only that part of the view, as <code>{ x, y, width, height }</code> in fractions from the top left.', 'whole view'],
  ['motion', 'Draws the 3D camera at its place on this path at frame, the same picture as that moment of record.', 'none'],
  ['patch', 'Settings used only for this image. The live view is put back before the call returns.', 'none'],
  ['field', 'A heightfield used only for this image.', 'the live one'],
];
export const RECORD_OPTIONS: [string, string, string][] = [
  ['seconds', '0.5–12', '4'],
  ['fps', '1–60', '24'],
  ['width, height', 'up to the GPU limit, even numbers', '960 × 540'],
  ['frame', 'terrain time at the first frame, ms', '0'],
  ['format', "'mp4' (H.264) or 'webm' (VP8)", "'mp4'"],
  ['motion', 'any camera path', 'the current one, or orbit when still'],
];

export const WEBMCP_TOOLS: [string, string][] = [
  ['identify_agent', 'The agent gives a name and a purpose from fixed lists, so analytics count it apart from people.'],
  ['list_shapes', 'Lists the base shapes and the looks, with ids and descriptions.'],
  ['get_settings', 'The current settings, the shortest config JSON and the tier drawing now.'],
  ['set_settings', 'Applies some settings and reports values moved into range.'],
  ['randomize', 'A new random seed, and with <code>{ shape: true }</code> a random shape.'],
  ['take_screenshot', 'A PNG of the view as a data URL, 1200 px wide by default, or a region of it.'],
  ['record_video', 'A short 3D clip as an MP4 or WebM data URL. 2 s orbit at 640 × 360 by default.'],
  ['get_embed_code', 'Code for html, react, vanilla or json.'],
  ['get_install_instructions', 'Setup steps for <code>npm</code>, <code>web-component</code>, <code>react</code> or <code>vanilla</code>'],
  ['set_region', 'Draws a real place, by name or bounding box.'],
  ['get_region', 'The current region, its load status and URL query.'],
  ['clear_region', 'Goes back to generated land.'],
];

export const FALLBACKS: [string, string, string][] = [
  ['WebGL2', 'Full rendering', "'webgl2'"],
  ['Only WebGL1', 'The same rendering through WebGL1', "'webgl1'"],
  ['No WebGL', 'The paper colour, and one console warning', "'fallback'"],
  ['GPU context lost', 'The paper colour until the browser restores it; if it never does, a new canvas starts again', "'lost'"],
];

export const LIMITS: [string, string][] = [
  ['Real places', '<code>fetchLocation()</code> takes areas up to 300 km across and downloads elevation tiles, so it needs the network. Heights are resampled to a 256 × 256 grid, so small details smooth out.'],
  ['Video', `<code>record()</code> draws the 3D view with a moving camera, for 0.5 to 12 seconds, through the browser's ${ext(WEBCODECS, 'WebCodecs')} encoder. WebM works where the browser can encode VP8. For 2D or longer, join PNG frames from <code>snapshot({ frame })</code>.`],
  ['Image size', 'The largest snapshot is the GPU\'s renderbuffer limit, usually 8192 or 16384 px.'],
  ['A browser and WebGL', `It draws on the GPU in a browser. There is no Node renderer; a server can drive ${ext(HEADLESS, 'headless Chrome')}. Without WebGL you get the paper colour.`],
  ['One WebGL context each', 'Every live view holds one context, and browsers allow about 16 per page. Reuse one view, or show stills from <code>snapshot()</code>.'],
  ['2D zoom', '<code>view2d.zoom</code> goes from 1 to 8.'],
  ['React', `${ext(NPM_REACT, 'topographic-react')} needs React 18 or 19.`],
  [ext(WEBMCP, 'WebMCP'), `The ${ext(PLAYGROUND, 'playground')}'s agent tools need a secure page, HTTPS or localhost. Without one, no tools are registered and the page works as normal.`],
  ['No overlays', 'There is no API for markers, labels, routes or picking a point. Put your own elements on top.'],
  ['Screen readers', 'The canvas is aria-hidden. If the terrain carries meaning, describe it in your own text.'],
];

export const QUESTIONS: [string, string][] = [
  ['Is it only for backgrounds?', 'No. It runs wherever JavaScript runs, and draws whatever land you give it. A background is one thing you can make with it.'],
  ['Does the same input give the same picture?', 'Yes. The same settings, seed and frame give the same image on every screen, in 2D and in 3D.'],
  [`Does it work with ${ext(NEXT, 'Next.js')} and server rendering?`, 'Yes. On the server the component draws an empty box, and the terrain appears once the page runs in the browser. The element registers itself only in a browser.'],
  ['How big is it?', 'The whole core package, element and video encoder included, is about 25 kB gzipped. It has no dependencies.'],
  ['Can I use my own elevation data?', 'Yes. Any square grid of heights from 0 to 1 goes into <code>setHeightfield()</code>, with the area\'s width over height as <code>aspect</code>.'],
  ['Why is nothing showing?', 'The terrain fills its element, so the element needs a size. Give it a height, or <code>position: fixed; inset: 0</code>.'],
  ['Why does it not move?', 'Check <code>motion.speed</code>, the system\'s reduced motion setting, and whether the element is on screen.'],
  ['Does it collect data?', `The ${ext(NPM, 'npm packages')} collect nothing. The ${ext(PLAYGROUND, 'playground')} sends cookieless analytics, and ${ext(PRIVACY, 'PRIVACY.md')} lists every event and how to opt out.`],
  ['What is the licence?', `${ext(LICENSE, 'Apache 2.0')}. The name, the logo and the screenshots are not covered and are all rights reserved.`],
];

/** The first lines of the playground's llms.txt, as docs.ts writes them. */
export const LLMS_HEAD = `# topographic\n\n> ${TAGLINE}\n\nLive playground: ${PLAYGROUND}/`;

/** Every snippet on the page, in the 0.6.0 API. */
export const CODE: Record<string, Snippet> = {
  first: {
    js: `import { createTopography } from 'topographic';

const topography = createTopography(document.querySelector('#map'), {
  shape: 'long-ridge',
  mode: '3d',
});`,
    react: `import { Topography } from 'topographic-react';

export function Map() {
  return <Topography shape="long-ridge" mode="3d" />;
}`,
    html: `<script type="module">import 'topographic/element';</script>

<topographic-view shape="long-ridge" mode="3d"></topographic-view>`,
  },
  looks: {
    js: `createTopography(el, { look: 'survey-map' });

// any setting you pass wins over the look
createTopography(el, { look: 'survey-map', lines: { count: 30 } });`,
    react: `<Topography look="survey-map" />
<Topography look="sea-dunes" mode="3d" camera={{ motion: 'orbit' }} />`,
    html: `<topographic-view look="survey-map"></topographic-view>
<topographic-view look="sea-dunes" mode="3d" camera-motion="orbit"></topographic-view>`,
  },
  locations: {
    js: `import { createTopography } from 'topographic';
import { fetchLocation } from 'topographic/locations';

const topography = createTopography(el, { location: 'everest' });

// any area on Earth, by its corners in degrees
const grid = await fetchLocation({ west: 6.47, south: 61.93, east: 7.63, north: 62.28 });
topography.update({ location: grid });`,
  },
  layout: {
    js: 'topography.update({ layout: { anchor: 1, fade: 0 } });',
    react: '<Topography layout={{ anchor: 1, fade: 0 }} />',
    html: '<topographic-view anchor="1" fade="0"></topographic-view>',
  },
  export: {
    js: `// one PNG, in the background
const png = await topography.snapshot({ width: 1920, height: 1080, frame: 4000 });

// a phone-shaped strip of a wide view
const strip = await topography.snapshot({ width: 1170, region: { x: 0.35, y: 0, width: 0.3, height: 1 } });

// a frame-exact PNG sequence: 6 s of orbit at 30 fps
const frames = [];
for (let i = 0; i < 180; i++) {
  frames.push(await topography.snapshot({ frame: (i * 1000) / 30, motion: 'orbit', width: 1920, height: 1080 }));
}

// a clip, encoded in the browser
const clip = await topography.record({ seconds: 6, fps: 30, motion: 'orbit', format: 'mp4' });`,
    react: `export function Export() {
  const [topography, setTopography] = useState(null);
  return (
    <>
      <Topography shape="granite" mode="3d" onReady={setTopography} />
      <button onClick={() => topography.snapshot({ width: 1920 }).then(save)}>PNG</button>
      <button onClick={() => topography.record({ seconds: 6 }).then(save)}>Video</button>
    </>
  );
}`,
    html: `<topographic-view shape="granite" mode="3d"></topographic-view>
<script type="module">
  const map = document.querySelector('topographic-view');
  const png = await map.snapshot({ width: 1920 });
  const clip = await map.topographic.record({ seconds: 6, format: 'webm' });
</script>`,
  },
  heightfields: {
    js: `const size = 256;
const samples = new Float32Array(size * size); // 0 is low, 1 is high

for (let y = 0; y < size; y++) {       // row 0 is the south edge
  for (let x = 0; x < size; x++) {     // column 0 is the west edge
    samples[y * size + x] = myHeight(x / (size - 1), y / (size - 1));
  }
}

topography.setHeightfield({ samples, size, aspect: 1.25 }); // width ÷ height
topography.setHeightfield(null); // back to generated land`,
    react: '<Topography mode="3d" onReady={(t) => t?.setHeightfield({ samples, size: 256, aspect: 1.25 })} />',
    html: `<script type="module">
  const map = document.querySelector('topographic-view');
  map.topographic.setHeightfield({ samples, size: 256, aspect: 1.25 });
</script>`,
  },
  react: {
    react: `import { Topography, useTopography } from 'topographic-react';

export function Hero() {
  return (
    <Topography shape="granite" terrain={{ roughness: 0.3 }}>
      <h1>Your content on top</h1>
    </Topography>
  );
}

// your own element: the hook returns a ref
export function Panel() {
  const ref = useTopography({ shape: 'seed-pod' });
  return <section ref={ref} />;
}`,
  },
  element: {
    html: `<script type="module">import 'topographic/element';</script>

<topographic-view shape="long-ridge" line-count="36" peaks="2" theme="dark"></topographic-view>

<script type="module">
  const map = document.querySelector('topographic-view');
  map.setAttribute('camera-motion', 'orbit');  // applies right away
  map.removeAttribute('peaks');                // back to the default
  map.topographic;                             // the instance
</script>`,
  },
  pageCss: {
    css: `/* the terrain fills its element: give it a size */
topographic-view { height: 100vh; }

/* behind a section, with content on top */
.hero { position: relative; isolation: isolate; }
.hero topographic-view { position: absolute; inset: 0; z-index: -1; }

/* colours from CSS, read when no setting is passed */
topographic-view {
  --topographic-ink: #9fb3c8;
  --topographic-paper: transparent;
}`,
  },
  pageReact: {
    react: `<Topography shape="dunes" className="hero" style={{ height: '100vh' }}>
  <h1>Your page</h1>
</Topography>

// changed a CSS variable later? read it again:
topography.update({ theme: {} });`,
  },
  performance: {
    js: `createTopography(el, { quality: 'medium' });      // keep one tier

createTopography(el, settings, { maxPixelRatio: 1.5, maxPixels: 1920 * 1080 });

topography.stats; // { fps, frameMs, mesh, quality: 'high' }`,
    react: '<Topography quality="medium" options={{ maxPixelRatio: 1.5 }} />',
    html: '<topographic-view quality="medium" detail="0.3"></topographic-view>',
  },
  agents: {
    sh: `curl https://topographic.yahyapak.dev/llms.txt
curl https://topographic.yahyapak.dev/llms-full.txt
curl https://topographic.yahyapak.dev/docs/params.md`,
  },
};
