// PROTOTYPE parts for docs-page/A, round 2: the playground's own Tune inputs (glyph, label, a track that
// draws the setting's effect, value), code that is rewritten from what a figure shows, and live views that
// mount near the viewport and free their WebGL context when far away.
import { GLYPHS, trackArt } from '/apps/playground/src/track-art.ts';
import { PARAMS, createTopographicBackground, resolveSettings } from '/packages/core/dist/index.js';
import { live as liveSet } from '../live.js';
import { SHAPE_KEY, ELEMENT_TAG } from '../names.js';
import { codeTabs, vivid, stills, LITE } from './docs-content.js';

export { GLYPHS };
export const P = (g, k) => PARAMS.find((p) => p.group === g && p.key === k);

/** A glyph from the playground's track-art, as an SVG string. */
export const glyph = (name, size = 15, stroke = 1.75) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[name]}</svg>`;

/** The playground's lucide icons (lucide-react 0.545.0, ISC), as the cluster draws them at 18 px. */
export const LUCIDE = {
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  dices: '<rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/>',
};
export const lucide = (name, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LUCIDE[name]}</svg>`;

/** A glass cluster over a figure's top-right corner, as in the playground (ui.tsx Cluster). */
export function cluster(stage, ...buttons) {
  const box = document.createElement('div');
  // A lone button drops the big glass ring and carries a compact glass fill of its own.
  const lone = buttons.length === 1 && buttons[0].tagName === 'BUTTON';
  box.className = lone ? 'stage-tools lone' : 'pt-cluster pt-glass stage-tools';
  box.append(...buttons);
  stage.closest('.fig, .ph, figure')?.append(box);
  return box;
}

/** The playground's 2D/3D toggle (ui.tsx ModeToggle), without its badge: a map or a box. */
export function modeToggle(on, onChange) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pt-ibtn pt-mode';
  const draw = () => {
    // Icon only on the docs page: a cube for 3D, a folded map for 2D. The label names the mode.
    b.innerHTML = lucide(on ? 'box' : 'map');
    b.setAttribute('aria-label', on ? 'Switch to 2D' : 'Switch to 3D');
    b.title = on ? 'Switch to 2D' : 'Switch to 3D';
    b.setAttribute('aria-pressed', String(on));
  };
  b.onclick = () => { on = !on; draw(); onChange(on ? '3d' : '2d'); };
  draw();
  return b;
}

/** A round tool button with a glyph, like the playground's Shuffle (button.pt-tool). */
export function toolButton(icon, label, onClick, cls = 'pt-ibtn') {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.innerHTML = lucide(icon);
  b.title = label;
  b.setAttribute('aria-label', label);
  b.onclick = onClick;
  return b;
}

/* ---------------------------------------------------------------- inputs, as in the playground's Tune popover */

const trackSvg = (art, w) => `<svg width="${w}" height="24" viewBox="0 0 ${w} 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${trackArt(art, w)}</svg>`;

/** The playground's value text (ui.tsx readParam, linePx, boldEvery). */
export function shown(group, key, v) {
  if (group === 'lines' && key === 'width') return `${Number((0.5 + v * 3.5).toFixed(1))} px`;
  if (key === 'indexEvery') return Math.round(v) < 1 ? 'Off' : `1 in ${Math.round(v)}`;
  const p = P(group, key);
  return p?.integer ? String(v) : v.toFixed(2);
}

/**
 * One slider row: glyph | label | telling track | value. A transparent native range input sits on the track,
 * so dragging, clicking and the keyboard work as usual; the track art is redrawn when the row resizes.
 */
export function sliderRow({ label, name = label, hint = '', icon, art, min, max, step, value, fmt }, onInput) {
  const row = document.createElement('div');
  row.className = 'pt-row';
  row.innerHTML = `<span class="pt-row-icon">${glyph(icon)}</span><span class="pt-row-label" title="${hint.replace(/"/g, '&quot;')}">${label}</span>
    <div class="pt-slider"><div class="pt-slider-track"><span class="pt-track-base"></span><span class="pt-slider-ind"></span><span class="pt-slider-thumb"></span>
    <input type="range" aria-label="${name}" min="${min}" max="${max}" step="${step}" value="${value}"></div></div><output></output>`;
  const track = row.querySelector('.pt-slider-track');
  const input = row.querySelector('input');
  const ind = row.querySelector('.pt-slider-ind');
  const thumb = row.querySelector('.pt-slider-thumb');
  const out = row.querySelector('output');
  let width = 0;
  const draw = () => {
    const w = Math.round(track.clientWidth);
    if (!w || w === width) return;
    width = w;
    row.querySelector('.pt-track-base').innerHTML = trackSvg(art, w);
    ind.innerHTML = trackSvg(art, w);
  };
  const place = () => {
    const v = +input.value;
    const f = (v - min) / (max - min);
    ind.style.width = `${f * 100}%`;
    thumb.style.left = `calc(${f * 100}% + ${(0.5 - f) * 4}px)`;
    out.textContent = fmt(v);
  };
  input.addEventListener('input', () => { place(); onInput(+input.value); });
  new ResizeObserver(draw).observe(track);
  requestAnimationFrame(draw);
  place();
  row.set = (v) => { input.value = v; place(); };
  row.input = input;
  return row;
}

/** A slider row for one of the library's parameters, with the playground's glyph, track and value text. */
export function paramRow(group, key, value, onInput) {
  const p = P(group, key);
  return sliderRow({
    label: key === 'indexEvery' ? 'Bold lines' : p.label, name: p.label, hint: p.description, icon: key, art: key,
    min: p.min, max: p.max, step: p.step, value, fmt: (v) => shown(group, key, v),
  }, onInput);
}

/** A choice row: glyph | label | glyph chips; the chosen chip names itself (parts.tsx SegRow). */
export function segRow({ label, icon, options, value, wide = false }, onChange) {
  const row = document.createElement('div');
  row.className = `pt-row${wide ? ' wide' : ''}`;
  const two = options.length === 2;
  row.innerHTML = `<span class="pt-row-icon">${glyph(icon)}</span><span class="pt-row-label">${label}</span>
    <div class="pt-chips${two ? ' is-two' : ''}" role="group" aria-label="${label}">${options.map((o) => `<button type="button" data-v="${o.id}" aria-pressed="${o.id === value}" aria-label="${o.label}" title="${o.label}">${o.glyph ? glyph(o.glyph) : ''}<span>${o.label}</span></button>`).join('')}</div>`;
  const chips = row.querySelector('.pt-chips');
  row.set = (v) => { for (const b of chips.children) b.setAttribute('aria-pressed', String(b.dataset.v === v)); };
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    row.set(b.dataset.v);
    onChange(b.dataset.v);
  });
  return row;
}

/** A Tune panel: titled sections of rows, like the playground's popover. */
export function tunePanel(sections) {
  const box = document.createElement('div');
  box.className = 'tune';
  for (const [title, rows] of sections) {
    const sec = document.createElement('div');
    sec.className = 'pt-sec';
    sec.innerHTML = title ? `<div class="pt-sec-head"><span class="pt-sec-title">${title}</span></div>` : '';
    const grid = document.createElement('div');
    grid.className = 'tune-rows';
    grid.append(...rows);
    sec.append(grid);
    box.append(sec);
  }
  return box;
}

/* ---------------------------------------------------------------- code from what a figure shows */

const num = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(2)));
const jsVal = (v) => (typeof v === 'string' ? `'${v}'` : typeof v === 'number' ? num(v) : `{ ${Object.entries(v).map(([k, x]) => `${k}: ${jsVal(x)}`).join(', ')} }`);
const ATTR = {
  top: { [SHAPE_KEY]: SHAPE_KEY, seed: 'seed', location: 'location', look: 'look', mode: 'mode', elevation: 'elevation', extent: 'extent', detail: 'detail' },
  camera: { azimuth: 'azimuth', elevation: 'camera-elevation', radius: 'radius', motion: 'camera-motion' },
  theme: { mode: 'theme', ink: 'ink', paper: 'paper' },
};
const attrOf = (group, key) => (group ? ATTR[group]?.[key] ?? P(group, key)?.attr ?? key : ATTR.top[key] ?? key);

/**
 * JavaScript, React and HTML for one set of 0.6.0 settings, in the order given. Nested groups stay objects
 * in JavaScript and React, and become one attribute per value on the element.
 */
export function codeFor(props) {
  const entries = Object.entries(props).filter(([, v]) => v !== undefined);
  // A group too long for one line puts each value on its own line.
  const block = (v) => { const one = jsVal(v); return typeof v === 'object' && one.length > 58 ? `{\n${Object.entries(v).map(([k, x]) => `    ${k}: ${jsVal(x)},`).join('\n')}\n  }` : one; };
  const jsBody = entries.map(([k, v]) => `  ${k}: ${block(v)},`).join('\n');
  const one = entries.map(([k, v]) => `${k}: ${jsVal(v)}`).join(', ');
  const js = one.length < 44 ? `createTopography(el, { ${one} });` : `createTopography(el, {\n${jsBody}\n});`;
  const rv = (v) => (typeof v === 'string' ? `"${v}"` : typeof v === 'number' ? `{${num(v)}}` : `{${jsVal(v)}}`);
  const reactProps = entries.map(([k, v]) => `${k}=${rv(v)}`);
  const react = reactProps.join(' ').length < 52 ? `<Topography ${reactProps.join(' ')} />` : `<Topography\n${reactProps.map((x) => `  ${x}`).join('\n')}\n/>`;
  const attrs = [];
  for (const [k, v] of entries) {
    if (v && typeof v === 'object') for (const [kk, vv] of Object.entries(v)) attrs.push(`${attrOf(k, kk)}="${typeof vv === 'number' ? num(vv) : vv}"`);
    else attrs.push(`${attrOf(null, k)}="${typeof v === 'number' ? num(v) : v}"`);
  }
  const html = attrs.join(' ').length < 48 ? `<${ELEMENT_TAG} ${attrs.join(' ')}></${ELEMENT_TAG}>` : `<${ELEMENT_TAG}\n${attrs.map((a) => `  ${a}`).join('\n')}\n></${ELEMENT_TAG}>`;
  return { js, react, html };
}

/** 0.5.0 settings as the 0.6.0 props a reader would write: style becomes the shape key. */
export function asProps(s, keys) {
  const out = {};
  for (const k of keys) {
    const v = k === SHAPE_KEY ? s.style : s[k];
    if (v === undefined) continue;
    out[k] = isObj(v) ? ordered(k, v) : v;
  }
  return out;
}
const ORDER = {
  camera: ['azimuth', 'elevation', 'radius', 'motion', 'panX', 'panZ'],
  theme: ['mode', 'ink', 'paper'],
};
/** A group's values in the order the library lists them, whatever order they were set in. */
function ordered(group, v) {
  const keys = ORDER[group] ?? PARAMS.filter((p) => p.group === group).map((p) => p.key);
  const out = {};
  for (const k of keys) if (v[k] !== undefined) out[k] = v[k];
  for (const k of Object.keys(v)) if (!(k in out) && v[k] !== undefined) out[k] = v[k];
  return out;
}

/** Renders code into host and keeps the language the reader picked across rewrites. */
export function liveCode(host, id) {
  let last = '';
  return (code) => {
    const sel = host.querySelector('.code-tab[aria-selected=true]')?.dataset.lang;
    let pref = sel;
    if (!pref) { try { pref = localStorage.getItem('topographic-docs-lang'); } catch { /* blocked */ } }
    const html = codeTabs(code, { id });
    if (html === last) return;
    last = html;
    host.innerHTML = html;
    const fig = host.firstElementChild;
    const lang = fig.querySelector(`pre[data-lang="${pref}"]`) ? pref : 'js';
    for (const t of fig.querySelectorAll('.code-tab')) t.setAttribute('aria-selected', String(t.dataset.lang === lang));
    for (const p of fig.querySelectorAll('pre')) p.hidden = p.dataset.lang !== lang;
    host.classList.remove('flash'); void host.offsetWidth; host.classList.add('flash');
  };
}

/* ---------------------------------------------------------------- live views that come and go with the viewport */

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
export const merge = (a, b) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) out[k] = isObj(v) && isObj(a?.[k]) ? merge(a[k], v) : v;
  return out;
};

const views = new Set();
let firstLite = true;
const io = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((entries) => {
  for (const e of entries) {
    const v = [...views].find((x) => x.el === e.target);
    if (!v) continue;
    v.near = e.isIntersecting;
    if (v.near) v.mount();
    else v.unmount();
  }
}, { rootMargin: '700px 0px' });

/** How many views hold a WebGL context right now. */
export const liveCount = () => [...views].filter((v) => v.t).length;

/**
 * A live view that mounts when its element comes within 700 px of the viewport and is destroyed when it
 * leaves, so a long page holds only the few contexts near the reader. Settings and the heightfield are kept,
 * so a view comes back as it was. In ?lite mode only the first view is live; the rest are stills.
 */
export function lazyLive(el, settings, { field = null } = {}) {
  const v = {
    el, settings, field, t: null, near: false, lite: LITE && !firstLite,
    mount() {
      if (v.t || v.lite) return;
      v.t = createTopographicBackground(el, vivid(v.settings), { maxPixelRatio: 2 });
      liveSet.add(v.t);
      if (v.field) v.t.setHeightfield(v.field);
    },
    unmount() {
      if (!v.t) return;
      liveSet.delete(v.t);
      v.t.destroy();
      v.t = null;
    },
    update(patch) {
      v.settings = merge(v.settings, patch);
      if (v.t) v.t.update(patch);
      else if (v.lite) v.still();
    },
    setHeightfield(f) {
      v.field = f;
      if (v.t) v.t.setHeightfield(f);
      else if (v.lite) v.still();
    },
    async still() {
      const { field: _, ...s } = v.settings;
      const [url] = await stills([{ ...vivid(s), ...(v.field ? { field: v.field } : {}) }], { width: el.clientWidth || 640, height: el.clientHeight || 400 });
      if (url) el.style.background = `center/cover url(${url})`;
    },
    get pose() { return v.t?.pose; },
    get resolved() { return resolveSettings(v.settings); },
    async snapshot(opts) {
      if (!v.t) v.mount();
      return v.t ? v.t.snapshot(opts) : null;
    },
  };
  if (LITE) firstLite = false;
  views.add(v);
  if (v.lite) v.still();
  else if (io) io.observe(el);
  else v.mount();
  return v;
}
