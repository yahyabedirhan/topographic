// PROTOTYPE content for the docs page variants. Never ships.
// Ranges and defaults come from the built 0.5.0 library itself, so the tables cannot drift from the code.
// The code shown to readers uses the proposed 0.6.0 names; live figures use 0.5.0 through live.js.
import {
  PARAMS, STYLES, PRESETS, QUALITY_TIERS, CAMERA_MOTIONS, DEFAULT_CAMERA, DEFAULT_ELEVATION, DEFAULT_DETAIL,
  DEFAULT_EXTENT, RADIUS_MIN, RADIUS_MAX, ZOOM_MIN, ZOOM_MAX, THEME_DEFAULTS, resolveSettings, createTopographicBackground,
} from '/packages/core/dist/index.js';
import { SHAPE_KEY, ELEMENT_TAG, named } from '../names.js';
import { terrain as mountLive, shot, NPM, NPM_REACT, REPO, PLAYGROUND, LOGO } from '../live.js';

export { PARAMS, STYLES, PRESETS, QUALITY_TIERS, CAMERA_MOTIONS, shot, NPM, NPM_REACT, REPO, PLAYGROUND, LOGO, resolveSettings };

/** ?lite keeps a page to one live view, for the board's grid of iframes. */
export const LITE = new URLSearchParams(location.search).has('lite');
const hex = (rgba) => `#${rgba.slice(0, 3).map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`;
export const DARK = { ink: hex(THEME_DEFAULTS.dark.ink), paper: hex(THEME_DEFAULTS.dark.paper) };
export const LIGHT = { ink: hex(THEME_DEFAULTS.light.ink), paper: hex(THEME_DEFAULTS.light.paper) };

/** The two ways in, named once (decision D9 is open). */
export const INSTALL_WAYS = {
  agent: { label: 'Agent skill', cmd: 'npx skills add yahyabedirhan/topographic' },
  npm: { label: 'npm package', cmd: 'npm install topographic', react: 'npm install topographic topographic-react' },
};

/** Per-item version badges are gone (round 2): the page shows its version once, in the header. */
export const BADGE = '';
export const LINKS = [
  ['Playground', PLAYGROUND], ['GitHub', REPO], ['npm topographic', NPM], ['npm topographic-react', NPM_REACT],
];
export const linksHtml = () => LINKS.map(([t, u]) => `<a href="${u}" target="_blank" rel="noreferrer">${t}</a>`).join('');

/* ---------------------------------------------------------------- code */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const KW = /^(import|from|export|default|function|return|const|let|await|async|for|new|null|true|false|if|of|undefined)$/;

/** A small highlighter for the snippets on these pages: JS, JSX, HTML, CSS and shell. */
export function highlight(code, lang = 'js') {
  const re = lang === 'css'
    ? /(\/\*[\s\S]*?\*\/)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(--?[\w-]+|[a-z-]+)(?=\s*:)|(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|vh|%)?\b)|([\w-]+(?=\s*\{))/g
    : lang === 'sh'
      ? /(#[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\bnpm\b|\bnpx\b)|(\b\d+(?:\.\d+)*\b)|(\$)/g
      : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.-]*|\/?>)|(\b[a-zA-Z_][\w-]*(?==[{"']))|(\b[A-Za-z_]\w*\b)|(\b\d+(?:\.\d+)?\b)/g;
  let out = '';
  let last = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index));
    const [t] = m;
    let cls = '';
    if (lang === 'css') cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'a' : m[4] ? 'n' : m[5] ? 't' : '';
    else if (lang === 'sh') cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : m[5] ? 'p' : '';
    else if (m[1]) cls = 'c';
    else if (m[2]) cls = 's';
    else if (m[3]) cls = 't';
    else if (m[4]) cls = 'a';
    else if (m[5]) cls = KW.test(t) ? 'k' : '';
    else if (m[6]) cls = 'n';
    out += cls ? `<span class="tk-${cls}">${esc(t)}</span>` : esc(t);
    last = m.index + t.length;
  }
  return out + esc(code.slice(last));
}

const COPY_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="5.5" y="5.5" width="8" height="8" rx="1.6"/><path d="M10.5 3.5v-.4A1.6 1.6 0 0 0 8.9 1.5H3.1A1.6 1.6 0 0 0 1.5 3.1v5.8a1.6 1.6 0 0 0 1.6 1.6h.4"/></svg>';
const LANG = { js: 'js', react: 'js', html: 'js', css: 'css', sh: 'sh' };
export const TAB_NAMES = { js: 'JavaScript', react: 'React', html: 'HTML', css: 'CSS', sh: 'Shell' };

/** One code block with a filename and a copy button. `one` puts a single line on one row. */
export function codeBlock(code, { file = '', lang = 'js', one = false, bare = false } = {}) {
  return `<figure class="code${one ? ' one' : ''}${bare ? ' bare' : ''}">
    ${one ? '' : `<div class="code-head"><span class="code-file">${file}</span><button class="copy" aria-label="Copy code">${COPY_ICON}</button></div>`}
    <pre><code>${highlight(code.trim(), LANG[lang] ?? lang)}</code></pre>${one ? `<button class="copy" aria-label="Copy code">${COPY_ICON}</button>` : ''}
  </figure>`;
}

/** Tabbed code: JS, React, HTML (or any keys of `code`). The selected tab is shared across the page. */
export function codeTabs(code, { id = '', extra = '' } = {}) {
  const keys = Object.keys(code).filter((k) => FILES[k]);
  return `<figure class="code" data-tabs="${id}">
    <div class="code-head"><div class="code-tabs" role="tablist">${keys.map((k, i) => `<button class="code-tab" role="tab" data-lang="${k}" aria-selected="${i === 0}">${TAB_NAMES[k]}</button>`).join('')}</div>
      ${extra}<span class="code-file" data-file style="margin-right:6px">${FILES[keys[0]]}</span><button class="copy" aria-label="Copy code">${COPY_ICON}</button></div>
    ${keys.map((k, i) => `<pre data-lang="${k}"${i ? ' hidden' : ''}><code>${highlight(code[k].trim(), LANG[k])}</code></pre>`).join('')}
  </figure>`;
}
export const FILES = { js: 'main.js', react: 'Map.jsx', html: 'index.html', css: 'style.css', sh: 'terminal' };

let preferred = 'js';
try { preferred = localStorage.getItem('topographic-docs-lang') || 'js'; } catch { /* storage may be blocked */ }

/** Wires copy buttons and code tabs inside root. Tabs follow one page-wide choice. */
export function wireCode(root = document) {
  root.addEventListener('click', async (e) => {
    const copy = e.target.closest('.copy');
    if (copy) {
      const fig = copy.closest('.code');
      const pre = fig.querySelector('pre:not([hidden])');
      try { await navigator.clipboard.writeText(pre.textContent); } catch { /* clipboard may be blocked */ }
      copy.classList.add('done');
      setTimeout(() => copy.classList.remove('done'), 1200);
      return;
    }
    const tab = e.target.closest('.code-tab');
    if (tab) selectLang(tab.dataset.lang, root);
  });
  selectLang(preferred, root);
}
export function selectLang(lang, root = document) {
  preferred = lang;
  try { localStorage.setItem('topographic-docs-lang', lang); } catch { /* fine */ }
  for (const fig of root.querySelectorAll('[data-tabs]')) {
    const has = fig.querySelector(`pre[data-lang="${lang}"]`);
    if (!has) continue;
    for (const t of fig.querySelectorAll('.code-tab')) t.setAttribute('aria-selected', String(t.dataset.lang === lang));
    for (const p of fig.querySelectorAll('pre')) p.hidden = p.dataset.lang !== lang;
    const f = fig.querySelector('[data-file]');
    if (f) f.textContent = FILES[lang];
  }
  root.dispatchEvent?.(new CustomEvent('docs-lang', { detail: lang }));
}

/* ---------------------------------------------------------------- live views */

/**
 * The library's dark default ink at 0.4 opacity is made to sit quietly behind text. Figures on a docs page
 * are the subject, so they get a brighter ink and stronger lines unless the section sets its own.
 */
export function vivid(s) {
  const theme = s.theme ?? {};
  const dark = theme.mode !== 'light';
  return {
    ...s,
    lines: { opacity: dark ? 0.72 : 0.6, ...s.lines },
    theme: { ...theme, ...(dark && !theme.ink ? { ink: '#9fb0cc' } : {}) },
  };
}

let liveCount = 0;
/** Mounts a live 0.5.0 view. In lite mode only the first one is live; the rest get a still. */
export function live(el, raw, options) {
  const settings = vivid(raw);
  if (LITE && liveCount >= 1) {
    stills([settings], { width: el.clientWidth || 640, height: el.clientHeight || 400 }).then(([url]) => {
      el.style.background = `center/cover url(${url})`;
    });
    return { update() {}, setHeightfield() {}, snapshot: async () => null, settings: resolveSettings(settings), lite: true };
  }
  liveCount += 1;
  return mountLive(el, settings, options);
}

let stillQueue = Promise.resolve();
/**
 * Draws each settings object to a PNG with one temporary view, then frees its WebGL context.
 * Galleries use this so seven landforms cost one context for a moment instead of seven for good.
 */
export function stills(list, { width = 640, height = 400, frame = 4000 } = {}) {
  const job = stillQueue.then(async () => {
    const host = document.createElement('div');
    host.style.cssText = `position:fixed;left:-${width + 50}px;top:0;width:${width}px;height:${height}px;pointer-events:none`;
    document.body.append(host);
    const t = createTopographicBackground(host, { motion: { speed: 0 } }, { maxPixelRatio: 1 });
    const urls = [];
    try {
      for (const item of list) {
        const { field, ...patch } = item;
        const full = resolveSettings(patch);
        const blob = await t.snapshot({ width, height, frame, patch: { ...full, theme: { ink: undefined, paper: undefined, ...full.theme } }, ...(field !== undefined ? { field } : {}) });
        urls.push(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.warn('[docs] stills failed', err);
    } finally {
      t.destroy();
      host.remove();
    }
    return urls;
  });
  stillQueue = job.catch(() => {});
  return job;
}

/** Full settings for update(): a section's settings on top of the defaults, so nothing leaks from the last one. */
export function fullSettings(s) {
  const full = resolveSettings(s);
  return { ...full, theme: { ink: undefined, paper: undefined, ...full.theme } };
}

/** A made-up volcano as a heightfield, to show setHeightfield without a network call. */
export function volcano(size = 128) {
  const samples = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1) - 0.5;
      const v = y / (size - 1) - 0.5;
      const r = Math.hypot(u * 1.15, v);
      const cone = Math.max(0, 1 - r * 2.3) ** 1.6;
      const crater = Math.exp(-((r / 0.05) ** 2)) * 0.18;
      const ridges = 0.035 * Math.sin(Math.atan2(v, u) * 9 + r * 18) * Math.max(0, 1 - r * 2.2);
      const lake = Math.exp(-(((u - 0.28) / 0.07) ** 2 + ((v + 0.22) / 0.05) ** 2)) * 0.05;
      samples[y * size + x] = Math.min(1, Math.max(0, 0.04 + cone * 0.92 - crater + ridges - lake));
    }
  }
  return { samples, size, aspect: 1.25 };
}

/* ---------------------------------------------------------------- data */

export const LANDFORMS = STYLES.map((s) => ({
  ...s,
  more: {
    'drifting-lobes': 'The default shape. terrain.variant takes it from three lobes to four.',
    granite: 'The Granite preset adds 34 lines and roughness 0.15; the Fine granite look uses 54 thin ones.',
    'five-petals': 'Terracing turns the petals into stepped bands, as in the Stepped petals look.',
    'seed-pod': 'Slow by nature: the Seed pod preset runs it at speed 0.7.',
    'gentle-summit': 'The base of Survey map and Terraces. Add peaks and spread for a small range.',
    'long-ridge': 'The Rocky preset adds roughness 0.55 and sharpness 0.3 for a broken spine.',
    dunes: 'It has no summits, and starts with a lighter centre fade, 0.5.',
  }[s.id],
  looks: {
    'drifting-lobes': 'Three soft lobes that drift to the side and slowly change towards four.',
    granite: 'Many small, lumpy lobes with a stone-like texture.',
    'five-petals': 'A summit with five petals that slowly grows and shrinks.',
    'seed-pod': 'Two long lobes that turn slowly, like a seed pod.',
    'gentle-summit': 'One soft, slightly oval hill that leans as it moves.',
    'long-ridge': 'A long, winding ridge with rounded ends.',
    dunes: 'Long ripples, like sand shaped by wind. There are no summits.',
  }[s.id],
}));

/** The tile settings of the styles image in the guide: summit centred, no fade, brighter lines. */
export const TILE = { layout: { anchor: 1, fade: 0 }, lines: { opacity: 0.85, width: 0.4 }, theme: { mode: 'dark', ink: '#9fb0cc', paper: '#0b0b0d' } };

/** Playground looks that have a screenshot, with their real settings (apps/playground/src/looks.ts). */
export const LOOK_GALLERY = [
  { slug: 'survey-ridge', name: 'Survey ridge', shot: 'look-survey-ridge-2d', sub: 'long-ridge · seed 113', lede: 'Pale lines around a long ridge on dark paper.', desc: '46 lines, a bold one in five, roughness 0.12.' },
  { slug: 'sea-dunes', name: 'Sea dunes', shot: 'look-sea-dunes-2d', sub: 'dunes · seed 97', lede: 'Blue-green ripples on deep teal.', desc: '48 thin lines, ink #8ec4d4 on #0e1a22.' },
  { slug: 'rose-pod', name: 'Rose pod', shot: 'look-rose-pod-2d', sub: 'seed-pod · seed 71', lede: 'Faint rose lines on near-black.', desc: '24 lines at speed 0.55, ink #f0b2a8.' },
  { slug: 'stepped-petals', name: 'Stepped petals', shot: 'look-stepped-petals-2d', sub: 'five-petals · seed 233', lede: 'Plum lines on pale pink paper.', desc: 'Terracing 0.72 groups the lines into steps.' },
  { slug: 'stone-grain', name: 'Stone grain', shot: 'look-stone-grain-2d', sub: 'granite · seed 127', lede: 'Graphite lines on warm stone paper.', desc: 'Roughness 0.5, 32 lines, light mode.' },
  { slug: 'centred-lobes', name: 'Centred lobes', shot: 'look-centred-lobes-2d', sub: 'drifting-lobes · seed 223', lede: 'Navy rings on pale blue paper.', desc: 'Anchor 1 puts the summit in the centre.' },
  { slug: 'night-flower', name: 'Night flower', shot: 'look-night-flower-3d', sub: 'five-petals · 3D', lede: 'Blue rings rising to a soft dome.', desc: '44 lines, a bold one in four.' },
  { slug: 'terraces', name: 'Terraces', shot: 'look-terraces-3d', sub: 'gentle-summit · 3D', lede: 'Amber lines stepping up a hill.', desc: 'Terracing 0.85 with two peaks.' },
  { slug: 'rocky-spine', name: 'Rocky spine', shot: 'look-rocky-spine-3d', sub: 'long-ridge · 3D', lede: 'Brown lines over a rough ridge.', desc: 'Roughness 0.62, sharpness 0.22, light paper.' },
];

/** The same looks as 0.5.0 settings, for live views (from apps/playground/src/looks.ts). */
export const LOOK_SETTINGS = {
  'survey-ridge': { style: 'long-ridge', seed: 113, terrain: { roughness: 0.12 }, lines: { count: 46, indexEvery: 5, opacity: 0.55, width: 0.12 }, layout: { fade: 0.15 }, theme: { mode: 'dark', paper: '#141414', ink: '#e8e6e1' } },
  'sea-dunes': { style: 'dunes', seed: 97, lines: { count: 48, width: 0.12 }, layout: { fade: 0.15 }, theme: { mode: 'dark', paper: '#0e1a22', ink: '#8ec4d4' } },
  'rose-pod': { style: 'seed-pod', seed: 71, motion: { speed: 0.55 }, lines: { count: 24, width: 0.18 }, layout: { fade: 0.15 }, theme: { mode: 'dark', paper: '#1a1214', ink: '#f0b2a8' } },
  'night-flower': { style: 'five-petals', seed: 179, lines: { count: 44, indexEvery: 4, width: 0.12 }, layout: { fade: 0.15 }, theme: { mode: 'dark', paper: '#10151c', ink: '#a9c7e4' } },
  terraces: { style: 'gentle-summit', seed: 131, terrain: { terracing: 0.85, peaks: 2 }, lines: { count: 36, width: 0.14 }, layout: { fade: 0.15 }, theme: { mode: 'dark', paper: '#16130f', ink: '#e0b089' } },
  'stone-grain': { style: 'granite', seed: 127, terrain: { roughness: 0.5 }, lines: { count: 32, width: 0.16 }, layout: { fade: 0.15 }, theme: { mode: 'light', paper: '#e7e2d8', ink: '#3a342c' } },
};

/** The ten playground places (apps/playground/src/region/places.ts), with their screenshots. */
export const LOCATIONS = [
  { id: 'istanbul', name: 'Istanbul', region: 'Europe & Middle East', note: 'The Bosphorus and the Princes\' Islands', size: 'about 101 × 64 km' },
  { id: 'cyprus', name: 'Cyprus', region: 'Europe & Middle East', note: 'The whole island, Troodos to the Karpas', size: 'about 261 × 166 km' },
  { id: 'matterhorn', name: 'Matterhorn & Zermatt', region: 'Europe & Middle East', note: 'The pyramid above Zermatt and its glaciers' },
  { id: 'geirangerfjord', name: 'Geirangerfjord', region: 'Europe & Middle East', note: 'A deep fjord between sheer Norwegian walls' },
  { id: 'grand-canyon', name: 'Grand Canyon', region: 'Americas', note: 'From the South Rim across to the North Rim' },
  { id: 'yosemite', name: 'Yosemite Valley', region: 'Americas', note: 'Half Dome, El Capitan and the valley floor' },
  { id: 'torres-del-paine', name: 'Torres del Paine', region: 'Americas', note: 'Granite towers over Patagonian lakes' },
  { id: 'fuji', name: 'Mount Fuji', region: 'Asia', note: 'The cone and the Fuji Five Lakes' },
  { id: 'everest', name: 'Everest & the Khumbu', region: 'Asia', note: 'The roof of the world above the Khumbu valley' },
  { id: 'kilimanjaro', name: 'Kilimanjaro', region: 'Africa', note: 'Africa\'s highest peak over the plains' },
].map((p) => ({ ...p, shot: `place-${p.id}` }));

export const MOTIONS = [
  { id: 'still', name: 'Still', what: 'The camera stays where you put it.' },
  { id: 'orbit', name: 'Orbit', what: 'Turns around the terrain at 14° a second.' },
  { id: 'push', name: 'Push', what: 'Moves in by up to a quarter of the distance and back, tilting a few degrees.' },
  { id: 'flyover', name: 'Flyover', what: 'Sweeps up to 62° to each side, a little lower and closer.' },
  { id: 'drone', name: 'Drone', what: 'Turns at 11° a second while it rises, falls and drifts in and out.' },
];

const r = (min, max) => `${min}–${max}`;
const paramRow = (p) => ({
  key: `${p.group}.${p.key}`, prop: `${p.group}={{ ${p.key} }}`, attr: p.attr,
  range: `${r(p.min, p.max)}${p.integer ? ', whole' : ''}`, def: String(p.default), what: GUIDE_WHAT[`${p.group}.${p.key}`] ?? p.description,
});
/** The guide's wording, which is plainer than the one-liners in params.ts. */
const GUIDE_WHAT = {
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
export const paramRows = (group) => PARAMS.filter((p) => p.group === group).map(paramRow);

const C = DEFAULT_CAMERA;
export const VIEW_ROWS = [
  { key: 'mode', attr: 'mode', range: '2d, 3d', def: '2d', what: 'The flat map, or the same map as a landscape.' },
  { key: 'elevation', attr: 'elevation', range: '0–1', def: String(DEFAULT_ELEVATION), what: 'How tall the 3D terrain is. 0 is flat like the map.' },
  { key: 'extent', attr: 'extent', range: 'endless, block', def: DEFAULT_EXTENT, what: 'A plane that fades into the paper, or a solid slab whose sides fade softly.' },
  { key: 'detail', attr: 'detail', range: '0–1', def: String(DEFAULT_DETAIL), what: 'Points in the 3D surface, from a 32² grid to a 160² grid.' },
  { key: 'quality', attr: 'quality', range: 'auto, low, medium, high', def: 'auto', what: 'Graphics budget. See Performance.' },
];
export const CAMERA_ROWS = [
  { key: 'camera.azimuth', attr: 'azimuth', range: 'any number, degrees', def: String(C.azimuth), what: 'The angle around the terrain. 0 looks from the south, with north up.' },
  { key: 'camera.elevation', attr: 'camera-elevation', range: '2–80, degrees', def: String(C.elevation), what: 'The angle above the horizon. Never below the terrain.' },
  { key: 'camera.radius', attr: 'radius', range: r(RADIUS_MIN, RADIUS_MAX), def: String(C.radius), what: 'The distance from the centre of the terrain.' },
  { key: 'camera.motion', attr: 'camera-motion', range: CAMERA_MOTIONS.join(', '), def: C.motion, what: 'A path for the camera. The land keeps its own motion.' },
  { key: 'camera.panX, panZ', attr: 'pan-x, pan-z', range: '−6–6', def: '0', what: 'The point the camera looks at, east and south of the centre. It stays over the terrain.' },
  { key: 'view2d.x, y', attr: 'view-x, view-y', range: '−6–6', def: '0', what: 'The 2D map\'s own pan, in screen heights. 3D ignores it.' },
  { key: 'view2d.zoom', attr: 'view-zoom', range: r(ZOOM_MIN, ZOOM_MAX), def: '1', what: 'The 2D map\'s zoom, up to eight times closer.' },
];
export const TOP_ROWS = [
  { key: SHAPE_KEY, attr: SHAPE_KEY, range: `one of ${STYLES.length} base shapes`, def: 'drifting-lobes', what: 'The base shape generated land grows from.', badge: true },
  { key: 'seed', attr: 'seed', range: '0–999999, whole', def: '0', what: 'One variation of the shape. 0 is the original.' },
  { key: 'location', attr: 'location', range: 'a place id', def: 'none', what: 'A real place by name, instead of generated land.', badge: true },
  { key: 'look', attr: 'look', range: 'a look name', def: 'none', what: 'A named design. Settings you pass win over it.', badge: true },
];
export const THEME_ROWS = [
  { key: 'theme.mode', attr: 'theme', range: 'auto, light, dark', def: 'auto', what: 'auto follows the system and changes with it.' },
  { key: 'theme.ink', attr: 'ink', range: 'any CSS colour', def: `${DARK.ink} dark, ${LIGHT.ink} light`, what: 'The line colour.' },
  { key: 'theme.paper', attr: 'paper', range: 'any CSS colour, transparent', def: `${DARK.paper} dark, ${LIGHT.paper} light`, what: 'The ground colour.' },
];

export const TIERS = Object.values(QUALITY_TIERS).map((t) => ({
  id: t.id, dpr: t.maxPixelRatio, px: t.maxPixels.toLocaleString('en-US'), mesh: `${t.meshCap}²`,
}));

export const MEMBERS = [
  ['update(settings)', 'Changes some settings and applies them right away. Values are kept in range; only changed values reach the GPU.'],
  ['snapshot(options)', 'Draws one PNG in the background and returns it as a Blob.'],
  ['record(options)', 'Records a 3D clip with a moving camera and returns an MP4 or WebM Blob.'],
  ['setHeightfield(field | null)', 'Draws your own heights instead of generated land. null brings the generated land back.'],
  ['setInsets({ top, right, bottom, left } | null)', 'Tells the 3D view how much of it your UI covers, in CSS pixels, so the terrain centres in the free space.'],
  ['clampPan(panX, panZ)', 'Returns the pan as [x, z], limited so the view stays over the terrain.'],
  ['hold(paused)', 'Stops drawing while another WebGL view needs the GPU. The paper colour stays.'],
  ['destroy()', 'Stops drawing, removes the canvas and listeners, and frees the WebGL context.'],
  ['settings', 'The current settings, with every value filled in.'],
  ['stats', '{ fps, frameMs, mesh, quality }: mesh is 0 in 2D, quality is the tier drawing now.'],
  ['pose', '{ azimuth, elevation, radius, panX, panZ }: where the 3D camera is on its path now.'],
  ['insets', 'The insets in use, all 0 by default.'],
  ['status', "'webgl2', 'webgl1', 'fallback', 'lost' or 'destroyed'."],
  ['canvas', 'The canvas element.'],
];

export const SNAPSHOT_OPTIONS = [
  ['frame', 'Animation time in ms. The same settings and frame always give the same image.', 'current frame'],
  ['width, height', 'Output size. Give one to keep the view\'s shape.', 'drawing size'],
  ['region', '{ x, y, width, height } in fractions from the top left: only that part of the view.', 'whole view'],
  ['motion', 'Draws the 3D camera at its place on this path at frame: the same picture as that moment of record.', 'none'],
  ['patch', 'Settings used only for this image. The live view is put back before the call returns.', 'none'],
  ['field', 'A heightfield used only for this image.', 'the live one'],
];
export const RECORD_OPTIONS = [
  ['seconds', '0.5–12', '4'],
  ['fps', '1–60', '24'],
  ['width, height', 'up to the GPU limit, even numbers', '960 × 540'],
  ['frame', 'terrain time at the first frame, ms', '0'],
  ['format', "'mp4' (H.264) or 'webm' (VP8)", "'mp4'"],
  ['motion', 'any camera path', 'the current one, or orbit when still'],
];

export const WEBMCP_TOOLS = [
  ['identify_agent', 'The agent gives a name and a purpose from fixed lists, so analytics count it apart from people.'],
  ['list_styles', 'Lists the base shapes and presets, with ids and descriptions.'],
  ['get_settings', 'The current settings, the shortest config JSON and the tier drawing now.'],
  ['set_settings', 'Applies some settings and reports values moved into range.'],
  ['randomize', 'A new random seed, and with { style: true } a random shape.'],
  ['take_screenshot', 'A PNG of the view as a data URL, 1200 px wide by default, or a region of it.'],
  ['record_video', 'A short 3D clip as an MP4 or WebM data URL. 2 s orbit at 640 × 360 by default.'],
  ['get_embed_code', 'Code for html, react, vanilla or json.'],
  ['get_install_instructions', 'Setup steps for npm, web-component, react or vanilla.'],
  ['set_region', 'Draws a real place, by name or bounding box.'],
  ['get_region', 'The current region, its load status and URL query.'],
  ['clear_region', 'Goes back to generated land.'],
];

export const FALLBACKS = [
  ['WebGL2', 'Full rendering', "'webgl2'"],
  ['Only WebGL1', 'The same rendering through WebGL1', "'webgl1'"],
  ['No WebGL', 'The paper colour, and one console warning', "'fallback'"],
  ['GPU context lost', 'The paper colour until the browser restores it; if it never does, a new canvas starts again', "'lost'"],
];

export const LIMITS = [
  ['Real places', 'fetchLocation() takes areas up to 300 km across and needs the network the first time a place loads. Heights are resampled to a 256 × 256 grid, so small details smooth out.'],
  ['Video', 'record() draws the 3D view with a moving camera, for 0.5 to 12 seconds, through the browser\'s WebCodecs encoder. WebM works where the browser can encode VP8. For 2D or longer, join PNG frames from snapshot({ frame }).'],
  ['Image size', 'The largest snapshot is the GPU\'s renderbuffer limit, usually 8192 or 16384 px.'],
  ['A browser and WebGL', 'It draws on the GPU in a browser. There is no Node renderer; a server can drive headless Chrome. Without WebGL you get the paper colour.'],
  ['One WebGL context each', 'Every live view holds one context, and browsers allow about 16 per page. Reuse one view, or show stills from snapshot().'],
  ['2D zoom', 'view2d.zoom goes from 1 to 8.'],
  ['React', 'topographic-react needs React 18 or 19.'],
  ['WebMCP', 'The playground\'s agent tools need a secure page, HTTPS or localhost. Without one, no tools are registered and the page works as normal.'],
  ['No overlays', 'There is no API for markers, labels, routes or picking a point. Put your own elements on top.'],
  ['Screen readers', 'The canvas is aria-hidden. If the terrain carries meaning, describe it in your own text.'],
];

export const QUESTIONS = [
  ['Is it only for backgrounds?', 'No. It runs wherever JavaScript runs, and draws whatever land you give it. A background is one thing you can make with it.'],
  ['Does the same input give the same picture?', 'Yes. The same settings, seed and frame give the same image on every screen, in 2D and in 3D.'],
  ['Does it work with Next.js and server rendering?', 'Yes. On the server the component draws an empty box, and the terrain appears once the page runs in the browser. The element registers itself only in a browser.'],
  ['How big is it?', 'The whole core package, element and video encoder included, is about 25 kB gzipped. It has no dependencies.'],
  ['Can I use my own elevation data?', 'Yes. Any square grid of heights from 0 to 1 goes into setHeightfield(), with the area\'s width over height as aspect.'],
  ['Why is nothing showing?', 'The terrain fills its element, so the element needs a size. Give it a height, or position: fixed; inset: 0.'],
  ['Why does it not move?', 'Check motion.speed, the system\'s reduced motion setting, and whether the element is on screen.'],
  ['Does it collect data?', 'The npm packages collect nothing. The playground site sends cookieless analytics; PRIVACY.md lists every event and how to opt out.'],
  ['What is the licence?', 'Apache 2.0. The name, the logo and the screenshots are not covered and are all rights reserved.'],
];

/* ---------------------------------------------------------------- snippets (0.6.0 API) */

/** Every snippet through names.js, so a rename of the shape key or the element tag is one edit. */
const mapCode = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([l, c]) => [l, named(c)]))]));
export { SHAPE_KEY, ELEMENT_TAG, named };

export const CODE = mapCode({
  settings: {
    js: `createTopography(el, {
  shape: 'dunes',               // or location: 'fuji', or look: 'survey-map'
  seed: 0,
  lines:   { count, width, opacity, indexEvery },
  terrain: { peaks, spread, roughness, sharpness, terracing, variant },
  motion:  { speed, warp, sparkle },
  layout:  { anchor, fade },
  theme:   { mode, ink, paper },
  mode, elevation, extent, detail, quality,
  camera:  { azimuth, elevation, radius, motion, panX, panZ },
  view2d:  { x, y, zoom },
});`,
  },
  install: {
    sh: 'npm install topographic\nnpm install topographic topographic-react   # for React 18 or 19',
  },
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
  landforms: {
    js: `createTopography(el, { shape: 'dunes', seed: 12 });`,
    react: `<Topography shape="dunes" seed={12} />`,
    html: `<topographic-view shape="dunes" seed="12"></topographic-view>`,
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
const field = await fetchLocation({ west: 6.47, south: 61.93, east: 7.63, north: 62.28 });
topography.setHeightfield(field);`,
    react: `<Topography location="everest" />`,
    html: `<script type="module">import 'topographic/element';</script>

<topographic-view location="everest"></topographic-view>`,
  },
  lines: {
    js: `topography.update({
  lines: { count: 44, width: 0.12, opacity: 0.55, indexEvery: 5 },
});`,
    react: `<Topography lines={{ count: 44, width: 0.12, opacity: 0.55, indexEvery: 5 }} />`,
    html: `<topographic-view line-count="44" line-width="0.12" line-opacity="0.55" index-every="5"></topographic-view>`,
  },
  terrain: {
    js: `topography.update({
  terrain: { peaks: 3, spread: 0.6, roughness: 0.2, sharpness: 0.5, terracing: 0.4 },
});`,
    react: `<Topography terrain={{ peaks: 3, spread: 0.6, roughness: 0.2, terracing: 0.4 }} />`,
    html: `<topographic-view peaks="3" spread="0.6" roughness="0.2" terracing="0.4"></topographic-view>`,
  },
  motion: {
    js: `topography.update({ motion: { speed: 0.4, warp: 0.7, sparkle: 0 } });

topography.update({ motion: { speed: 0 } }); // one still frame, no animation loop`,
    react: `<Topography motion={{ speed: 0.4, warp: 0.7, sparkle: 0 }} />`,
    html: `<topographic-view speed="0.4" warp="0.7" sparkle="0"></topographic-view>`,
  },
  layout: {
    js: `topography.update({ layout: { anchor: 1, fade: 0 } });`,
    react: `<Topography layout={{ anchor: 1, fade: 0 }} />`,
    html: `<topographic-view anchor="1" fade="0"></topographic-view>`,
  },
  theme: {
    js: `topography.update({ theme: { mode: 'dark', ink: '#a9c7e4', paper: '#10151c' } });

topography.update({ theme: { paper: 'transparent' } }); // your page shows through`,
    react: `<Topography theme={{ mode: 'dark', ink: '#a9c7e4', paper: '#10151c' }} />`,
    html: `<topographic-view theme="dark" ink="#a9c7e4" paper="#10151c"></topographic-view>`,
  },
  modes: {
    js: `topography.update({ mode: '3d', elevation: 0.7, extent: 'block', detail: 0.6 });

topography.update({ mode: '2d' }); // the same land, flat`,
    react: `<Topography mode="3d" elevation={0.7} extent="block" detail={0.6} />`,
    html: `<topographic-view mode="3d" elevation="0.7" extent="block" detail="0.6"></topographic-view>`,
  },
  camera: {
    js: `topography.update({
  mode: '3d',
  camera: { azimuth: 42, elevation: 34, radius: 2.45, motion: 'orbit' },
});

topography.pose; // { azimuth, elevation, radius, panX, panZ } right now`,
    react: `<Topography mode="3d" camera={{ azimuth: 42, elevation: 34, radius: 2.45, motion: 'orbit' }} />`,
    html: `<topographic-view mode="3d" azimuth="42" camera-elevation="34" radius="2.45" camera-motion="orbit"></topographic-view>`,
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
  const clip = await map.topography.record({ seconds: 6, format: 'webm' });
</script>`,
  },
  heightmaps: {
    js: `const field = topography.heightfield(); // { samples, size, aspect }, 0 is low and 1 is high

const png = await topography.exportHeightmap({ size: 1024, format: 'png16' });
// a 16-bit greyscale PNG, ready for any terrain importer`,
    react: `<Topography
  location="matterhorn"
  onReady={async (t) => save(await t.exportHeightmap({ size: 1024, format: 'png16' }))}
/>`,
    html: `<topographic-view location="matterhorn"></topographic-view>

<script type="module">
  const { topography } = document.querySelector('topographic-view');
  const png = await topography.exportHeightmap({ size: 1024, format: 'png16' });
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
    react: `<Topography mode="3d" onReady={(t) => t?.setHeightfield({ samples, size: 256, aspect: 1.25 })} />`,
    html: `<script type="module">
  const map = document.querySelector('topographic-view');
  map.topography.setHeightfield({ samples, size: 256, aspect: 1.25 });
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
  map.topography;                              // the instance
</script>`,
  },
  page: {
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
    react: `<Topography quality="medium" options={{ maxPixelRatio: 1.5 }} />`,
    html: `<topographic-view quality="medium" detail="0.3"></topographic-view>`,
  },
  agents: {
    sh: `curl https://topographic.yahyapak.dev/llms.txt
curl https://topographic.yahyapak.dev/llms-full.txt
curl https://topographic.yahyapak.dev/docs/params.md`,
  },
});

/** What each use looks like, for the opening gallery. */
export const USES = [
  { id: 'web', title: 'Websites', sub: 'Element, React or JavaScript', lede: 'A live terrain in the page.', desc: 'A hero, a section, a map or a full-page scene, behind your content or on its own. It pauses off screen and respects reduced motion.', shot: 'hero' },
  { id: 'video', title: 'Videos', sub: 'snapshot() and record()', lede: 'The same land, frame for frame.', desc: 'Frame-exact PNG sequences at any size for an editor, or a 3D clip with a moving camera as MP4 or WebM, encoded in the browser.', shot: 'look-terraces-3d' },
  { id: 'game', title: 'Games', sub: 'heightfield() and exportHeightmap()', lede: 'Maps, menus and the world itself.', desc: 'Draw a level\'s heights as contours for the map screen, and take the same land into your engine as a 16-bit heightmap.', shot: 'place-matterhorn' },
];
