// PROTOTYPE board: the full npmjs.com pages of topographic and topographic-react, whose READMEs are the
// package READMEs. Variants differ in how many visuals the READMEs carry and in the description strategy.
// One live instance per variant draws the hero; every other tile is a snapshot() of it with a settings
// patch, so the board stays at one WebGL context per variant.
import { terrain, h, shot, LOOKS } from '../live.js';
import { COPY, SNIP, hl, ICON, wireCopy } from '../kit.js';

const HOST = 'https://topographic.yahyapak.dev/readme/';
const LANDFORMS = ['drifting-lobes', 'granite', 'five-petals', 'seed-pod', 'gentle-summit', 'long-ridge', 'dunes'];
const PLACES = ['istanbul', 'fuji', 'matterhorn', 'grand-canyon', 'everest'];

const css = `
.np{position:absolute;inset:0;background:#fff;color:#111;font:16px/1.6 "Source Sans 3","Source Sans Pro",-apple-system,system-ui,sans-serif;overflow:hidden}
.np a{color:#0b6fbf;text-decoration:none}
.np .stripe{height:6px;background:linear-gradient(90deg,#fb8817,#ff4b01,#c12127,#e02aff)}
.np .nav{display:flex;align-items:center;gap:22px;padding:10px 32px;font-size:14px;color:#555;border-bottom:1px solid #eee}
.np .nav .r{margin-left:auto}
.np .bar{display:flex;align-items:center;gap:22px;padding:14px 32px;border-bottom:1px solid #eee}
.np .logo{font:800 30px/1 system-ui;color:#cb3837;letter-spacing:-.04em}
.np .sbox{flex:1;display:flex;height:40px;background:#f2f2f2;border-radius:2px;align-items:center;padding:0 14px;color:#777;font-size:15px}
.np .sbtn{height:40px;padding:0 22px;background:#1b1b1b;color:#fff;display:grid;place-items:center;font-weight:600;font-size:14px}
.np .search{background:#f7f7f7;padding:20px 32px;border-bottom:1px solid #e6e6e6}
.np .search .q{font-size:13px;color:#757575;margin-bottom:10px}
.np .result{background:#fff;padding:16px 20px;box-shadow:0 1px 0 #e3e3e3;max-width:1000px}
.np .result h3{font-size:20px;font-weight:600;color:#111;margin:0 0 2px}
.np .result p{margin:0 0 8px;color:#333}
.np .kw{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.np .kw span{font-size:13px;background:#f2f2f2;color:#555;padding:1px 8px;border-radius:2px}
.np .result small{font-size:13px;color:#757575}
.np .pkg{padding:24px 32px 0}
.np .pkg h1{font-size:32px;font-weight:600;margin:0}
.np .pkg .sub{font-size:14px;color:#757575;margin:2px 0 18px}
.np .ptabs{display:flex;border-bottom:1px solid #e6e6e6}
.np .ptabs span{flex:1;text-align:center;padding:10px 0;font-size:15px;color:#555;border-bottom:3px solid transparent}
.np .ptabs span.on{border-color:#fdba28;color:#111;font-weight:600;background:#fff9e6}
.np .ptabs span:nth-child(2){border-color:#c836c3}.np .ptabs span:nth-child(3){border-color:#8956ff}.np .ptabs span:nth-child(4){border-color:#29abe2}.np .ptabs span:nth-child(5){border-color:#cb3837}
.np .ptabs span.on{border-color:#fdba28}
.np .cols{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:40px;padding:24px 0 48px}
.np .md h1{font-size:30px;font-weight:600;margin:0 0 14px;padding-bottom:6px;border-bottom:1px solid #eee}
.np .md h2{font-size:23px;font-weight:600;margin:30px 0 12px;padding-bottom:4px;border-bottom:1px solid #eee}
.np .md h3{font-size:18px;font-weight:600;margin:22px 0 8px}
.np .md p{margin:0 0 14px}
.np .md ul{margin:0 0 14px;padding-left:22px}
.np .md code{font:13.5px ui-monospace,SFMono-Regular,Menlo,monospace;background:#f2f2f2;padding:.15em .35em;border-radius:3px}
.np .md pre{margin:0 0 14px;padding:14px 16px;background:#f7f7f7;border-radius:3px;font:13.5px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre;overflow:hidden}
.np .md pre code{background:none;padding:0}
.np .md pre .k{color:#a626a4}.np .md pre .s{color:#50a14f}.np .md pre .t{color:#e45649}.np .md pre .c{color:#a0a1a7}
.np .md table{border-collapse:collapse;width:100%;margin:0 0 16px;table-layout:fixed}
.np .md td,.np .md th{border:1px solid #e3e3e3;padding:8px 10px;vertical-align:top;font-size:14px;text-align:left}
.np .md td pre{margin:0;font-size:12.5px;padding:10px}
.np .md details{border:1px solid #e3e3e3;border-radius:3px;margin:0 0 10px;padding:6px 12px}
.np .md summary{font-weight:600;cursor:pointer}
.np .art{position:relative;display:block;width:100%;border-radius:4px;overflow:hidden;background:#0b0b0d}
.np .art img{display:block;width:100%;height:100%;object-fit:cover}
.np .art .live{position:absolute;inset:0}
.np .art i{position:absolute;left:6px;bottom:6px;font:600 10px/1 ui-monospace,Menlo,monospace;font-style:normal;color:#fff;background:rgba(203,56,55,.92);padding:3px 5px;border-radius:3px;z-index:2;white-space:nowrap}
.np .art i.still{background:rgba(40,40,40,.85)}
.np .grid7{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 6px}
.np .grid5{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:0 0 6px}
.np .cap{font-size:13px;color:#555;margin:2px 0 0}
.np .side h3{font-size:15px;color:#757575;font-weight:600;margin:0 0 6px}
.np .side .inst{display:flex;align-items:center;gap:8px;border:1px solid #ccc;border-radius:4px;padding:10px 12px;font:15px ui-monospace,Menlo,monospace;margin-bottom:22px}
.np .side .inst button{margin-left:auto;border:0;background:none;color:#777;cursor:pointer}
.np .side .row{border-bottom:1px solid #eee;padding:0 0 12px;margin-bottom:14px;font-size:16px}
.np .side .two{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}
.np .side b{font-weight:600}
.np .kwfoot{margin-top:28px}.np .kwfoot h3{font-size:15px;color:#757575;margin:0 0 8px}
.np .assets{margin:0 32px 40px;padding:20px 24px;border-radius:8px;background:#141418;color:#ecebe8;font:13px/1.55 Inter,sans-serif}
.np .assets h2{font:600 18px/1.3 Literata,Georgia,serif;margin:0 0 4px}
.np .assets p{color:#b9b8b3;margin:0 0 12px}
.np .assets table{width:100%;border-collapse:collapse}
.np .assets td,.np .assets th{padding:4px 10px 4px 0;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;font-weight:400;vertical-align:top}
.np .assets th{color:#8b8a86;font-weight:500}
.np .assets code{font:12px 'JetBrains Mono',monospace;color:#cfcdc7}
.np .sep{height:28px;background:repeating-linear-gradient(135deg,#f2f2f2 0 10px,#fff 10px 20px);border-top:1px solid #e6e6e6;border-bottom:1px solid #e6e6e6;display:grid;place-items:center;font:600 12px Inter;color:#757575;letter-spacing:.06em;text-transform:uppercase}
`;

const pre = (code) => `<pre><code>${hl(code)}</code></pre>`;
const spark = '<svg width="150" height="30" viewBox="0 0 150 30"><polyline fill="none" stroke="#cb3837" stroke-width="2" points="0,26 15,24 30,25 45,20 60,22 75,16 90,18 105,12 120,14 135,8 150,6"/></svg>';

/**
 * A picture slot in a README. kind: 'live' mounts the variant's one live instance here; 'snap' is a
 * snapshot of it with `patch`; 'shot' is an existing screenshot. Every slot shows its future file name.
 */
const art = ({ file, w, h: ht, kind = 'snap', patch = {}, src = '', anim = true, ratio }) =>
  `<span class="art" style="aspect-ratio:${ratio ?? `${w}/${ht}`}" data-kind="${kind}" data-w="${w}" data-h="${ht}" data-patch='${JSON.stringify(patch)}'>
    ${kind === 'shot' ? `<img src="${src}" alt="">` : kind === 'live' ? '<span class="live"></span>' : kind === 'strip' ? `<span style="display:grid;grid-template-columns:repeat(${LANDFORMS.length},1fr);height:100%">${LANDFORMS.map((l) => `<img alt="" data-strip='${JSON.stringify(lfc(l))}'>`).join('')}</span>` : '<img alt="">'}
    <i class="${anim ? '' : 'still'}">${file} · ${w}×${ht} · ${anim ? 'animated' : 'still'}</i></span>`;

/** One npm package page: the search result that shows the description, then the page with its README. */
function page({ name, desc, keywords, install, readme, deps }) {
  return `
    <div class="search"><div class="q">npm search · “terrain heightmap”</div>
      <div class="result"><h3>${name}</h3><p>${desc.replace(/</g, '&lt;')}</p>
        <div class="kw">${keywords.slice(0, 14).map((k) => `<span>${k}</span>`).join('')}</div>
        <small><b>yahyabedirhan</b> published 0.6.0 • 3 days ago</small></div></div>
    <div class="pkg">
      <h1>${name}</h1><div class="sub">0.6.0 • Public • Published 3 days ago</div>
      <div class="ptabs"><span class="on">Readme</span><span>Code</span><span>${deps} Dependencies</span><span>${name === 'topographic' ? 1 : 0} Dependents</span><span>7 Versions</span></div>
      <div class="cols">
        <div class="md">${readme}
          <div class="kwfoot"><h3>Keywords</h3><div class="kw">${keywords.map((k) => `<span>${k}</span>`).join('')}</div></div></div>
        <aside class="side">
          <h3>Install</h3><div class="inst"><span style="color:#999">›</span>${install}<button data-copy="${install}">${ICON.copy}</button></div>
          <div class="row"><h3>Repository</h3><a>github.com/yahyabedirhan/topographic</a></div>
          <div class="row"><h3>Homepage</h3><a>topographic.yahyapak.dev</a></div>
          <div class="row"><h3>Weekly Downloads</h3><div style="display:flex;justify-content:space-between;align-items:end"><b>1,204</b>${spark}</div></div>
          <div class="row two"><div><h3>Version</h3><b>0.6.0</b></div><div><h3>License</h3><b>Apache-2.0</b></div></div>
          <div class="row two"><div><h3>Unpacked Size</h3><b>${name === 'topographic' ? '318 kB' : '24 kB'}</b></div><div><h3>Total Files</h3><b>${name === 'topographic' ? 42 : 9}</b></div></div>
          <div class="row two"><div><h3>Issues</h3><b>3</b></div><div><h3>Pull Requests</h3><b>1</b></div></div>
          <div class="row"><h3>Last publish</h3><b>3 days ago</b></div>
        </aside>
      </div></div>`;
}

/** The render list a script would produce for this variant, shown under the two pages. */
const manifest = (rows, extra) => `<section class="assets"><h2>Assets this variant needs</h2>
  <p>Hosted at <code>${HOST}</code> (absolute URLs: npm breaks relative paths). Animated files are WebP loops, each kept under 2–3 MB. ${extra}</p>
  <table><tr><th>File</th><th>Size</th><th>Kind</th><th>What it shows</th></tr>
  ${rows.map(([f, s, k, w]) => `<tr><td><code>${f}</code></td><td>${s}</td><td>${k}</td><td>${w}</td></tr>`).join('')}</table></section>`;

/** Mounts the page, the one live instance, then fills every snapshot slot from it in turn. */
function mount(stage, html, live) {
  stage.append(h`<style>${css}</style><div class="np">
    <div class="stripe"></div>
    <div class="nav"><span>❤ Nifty Package Manager</span><span>Pro</span><span>Teams</span><span>Pricing</span><span>Documentation</span><span class="r">Sign Up · Sign In</span></div>
    <div class="bar"><span class="logo">npm</span><span class="sbox">Search packages</span><span class="sbtn">Search</span></div>
    ${html}</div>`);
  wireCopy(stage);
  const host = stage.querySelector('[data-kind=live] .live');
  const t = terrain(host, live);
  setTimeout(async () => {
    for (const slot of stage.querySelectorAll('[data-kind=snap]')) {
      try {
        const blob = await t.snapshot({ width: +slot.dataset.w, height: +slot.dataset.h, patch: JSON.parse(slot.dataset.patch) });
        slot.querySelector('img').src = URL.createObjectURL(blob);
      } catch { return; /* the variant was switched away */ }
    }
    // the strip: one still per landform, side by side, as the single strip-looks.webp would be
    for (const img of stage.querySelectorAll('[data-strip]')) {
      try { img.src = URL.createObjectURL(await t.snapshot({ width: 230, height: 200, patch: JSON.parse(img.dataset.strip) })); } catch { return; }
    }
  }, 1200);
}

const dark = { theme: { mode: 'dark' } };
const lf = (style, extra = {}) => ({ style, mode: '2d', ...dark, lines: { count: 24, indexEvery: 4, opacity: 0.95 }, ...extra });
const INKS = { 'drifting-lobes': ['#a9c7e4', '#10151c'], granite: ['#d8d2c0', '#1d1f1b'], 'five-petals': ['#6b2e5f', '#f6e4ea'], 'seed-pod': ['#e6a3b4', '#140b10'],
  'gentle-summit': ['#e0a24a', '#120d07'], 'long-ridge': ['#ecebe8', '#0b0b0d'], dunes: ['#8fd6c8', '#06201f'] };
const lfc = (s) => lf(s, { theme: { ink: INKS[s][0], paper: INKS[s][1] } });

export default {
  id: 'npm-page',
  title: 'npm pages',
  question: 'How visual should the two package READMEs be on npmjs.com, and which description strategy finds and convinces a developer fastest?',
  surface: 'npmjs.com/package/topographic and npmjs.com/package/topographic-react (packages/*/README.md, package.json description and keywords)',
  size: [1440, 5900],
  variants: [
    {
      key: 'A',
      name: 'Gallery README, category description',
      note: 'The most visual. topographic: animated hero (dark/light &lt;picture&gt;), a grid of the 7 landforms as animated tiles, a strip of 5 real places, a 2D↔3D pair, then install and code. topographic-react: hero, then code beside its animated result. Description is category-first. npm renders markdown only: &lt;picture&gt;, &lt;img&gt;, &lt;p align&gt;, tables and &lt;details&gt; work; no video, no JS, no styling, so motion comes from animated WebP. The "games" line needs D7.',
      render(stage) {
        const core = `
          <p align="center">${art({ file: 'hero-dark.webp', w: 1600, h: 800, kind: 'shot', src: shot('hero') })}</p>
          <h1>topographic</h1>
          <p><b>${COPY.tagline}</b> Generate land or load a real place, change the lines, colours and motion, and export PNG frames or video. No dependencies. <a>Open the playground</a> · <a>Docs</a></p>
          ${pre('npm install topographic')}
          ${pre(SNIP.js)}
          <h2>Seven landforms</h2>
          <div class="grid7">${LANDFORMS.map((s) => art({ file: `landform-${s}.webp`, w: 480, h: 300, patch: lfc(s) })).join('')}
            <span style="display:grid;place-items:center;font-size:14px;color:#555;border:1px dashed #ccc;border-radius:4px">+ seed, peaks, terracing…</span></div>
          <p class="cap">Each tile is one <code>landform</code> value: ${LANDFORMS.map((s) => `<code>${s}</code>`).join(' ')}</p>
          <h2>Real places</h2>
          <div class="grid5">${PLACES.map((p) => art({ file: `place-${p}.webp`, w: 480, h: 300, kind: 'shot', src: shot(`place-${p}`), anim: false })).join('')}</div>
          ${pre(`createTopography(el, { location: 'fuji', mode: '3d' });`)}
          <h2>2D and 3D</h2>
          <table><tr><th>mode: '2d'</th><th>mode: '3d'</th></tr><tr>
            <td>${art({ file: 'pair-2d.webp', w: 800, h: 500, patch: lf('gentle-summit', { terrain: { terracing: 0.8, peaks: 2 }, theme: { ink: '#e0a24a', paper: '#120d07' } }) })}</td>
            <td>${art({ file: 'pair-3d.webp', w: 800, h: 500, kind: 'live' })}</td></tr></table>
          <h2>Video and frames</h2>
          ${pre(`const clip = await topography.record({ seconds: 12, format: 'mp4' }); // 3D, up to 12 s\nconst png = await topography.snapshot({ frame: 2400, width: 1920, height: 1080 });`)}
          <p>Also as a web component: <code>&lt;topographic-map landform="dunes"&gt;</code> from <code>topographic/element</code>. React: <a>topographic-react</a>.</p>`;
        const react = `
          <p align="center">${art({ file: 'react-hero.webp', w: 1600, h: 640, patch: { ...LOOKS.ridge2d, mode: '2d', lines: { count: 40, indexEvery: 5, opacity: 0.9 } } })}</p>
          <h1>topographic-react</h1>
          <p><b>The <code>&lt;Topography /&gt;</code> component</b> for <a>topographic</a>: 2D contour maps and 3D terrain as props. React 18 and 19, safe for server rendering.</p>
          ${pre('npm install topographic topographic-react')}
          <table><tr><th>Code</th><th>Result</th></tr>
            <tr><td>${pre(SNIP.react)}</td><td>${art({ file: 'react-long-ridge.webp', w: 640, h: 360, patch: lfc('long-ridge') })}</td></tr>
            <tr><td>${pre(SNIP.place)}</td><td>${art({ file: 'react-fuji-3d.webp', w: 640, h: 360, kind: 'shot', src: shot('place-fuji') })}</td></tr>
            <tr><td>${pre(SNIP.look)}</td><td>${art({ file: 'react-survey-map.webp', w: 640, h: 360, patch: { style: 'long-ridge', mode: '2d', theme: { ink: '#d8d2c0', paper: '#1d1f1b' }, lines: { count: 44, indexEvery: 4, opacity: 0.85 } } })}</td></tr></table>
          <p><code>onReady</code> gives you the instance for <code>snapshot()</code> and <code>record()</code>. Every prop: <a>Docs</a>.</p>`;
        mount(stage, page({ name: 'topographic', desc: COPY.npm.A.core, keywords: COPY.keywords.core, install: 'npm i topographic', readme: core, deps: 0 })
          + '<div class="sep">topographic-react</div>'
          + page({ name: 'topographic-react', desc: COPY.npm.A.react, keywords: [...COPY.keywords.react, ...COPY.keywords.core.slice(0, 12)], install: 'npm i topographic-react', readme: react, deps: 1 })
          + manifest([
            ['hero-dark.webp, hero-light.webp', '1600×800', 'animated, 6 s loop', '3D granite orbit (today\'s hero.webp, animated); &lt;picture&gt; picks one by prefers-color-scheme'],
            [`landform-{${LANDFORMS.join(',')}}.webp`, '480×300 ×7', 'animated, 4 s loop', 'one tile per landform, same lines and colours'],
            [`place-{${PLACES.join(',')}}.webp`, '480×300 ×5', 'still', 'resized from assets/screenshots/place-*.webp'],
            ['pair-2d.webp, pair-3d.webp', '800×500 ×2', 'animated, 4 s loop', 'the same terraces in 2D and 3D'],
            ['react-hero.webp', '1600×640', 'animated, 6 s loop', 'long ridge, 2D drift'],
            ['react-long-ridge.webp, react-fuji-3d.webp, react-survey-map.webp', '640×360 ×3', 'animated, 4 s loop', 'the result of each React snippet'],
          ], 'About 19 files, about 20 MB in all; the heaviest README of the three.'), LOOKS.terraces3d);
      },
    },
    {
      key: 'B',
      name: 'Code beside its result, feature description',
      note: 'Every code block sits next to the picture it makes, in a two-column table, so the README teaches and shows at once. A settings table shows before/after pairs (lines, terracing, mode) as stills. The React page repeats the pattern with props. Description is a feature list. No hero: the first visual is the result of the first snippet.',
      render(stage) {
        const pair = (code, file, patch, kind = 'snap', src = '') => `<tr><td>${pre(code)}</td><td>${art({ file, w: 560, h: 315, patch, kind, src })}</td></tr>`;
        const ba = (label, a, b, fa, fb) => `<tr><td><code>${label}</code></td><td>${art({ file: fa, w: 400, h: 250, patch: a, anim: false })}</td><td>${art({ file: fb, w: 400, h: 250, patch: b, anim: false })}</td></tr>`;
        const base = lf('gentle-summit', { terrain: { peaks: 2 }, theme: { ink: '#e0a24a', paper: '#120d07' } });
        const t3 = { ...LOOKS.terraces3d, terrain: { peaks: 2, terracing: 0 } };
        const core = `
          <h1>topographic</h1>
          <p>${COPY.tagline} <a>Playground</a> · <a>Docs</a></p>
          ${pre('npm install topographic')}
          <table style="table-layout:auto"><tr><th style="width:52%">Code</th><th>Result</th></tr>
            <tr><td>${pre(SNIP.js)}</td><td>${art({ file: 'result-long-ridge.webp', w: 560, h: 315, kind: 'live' })}</td></tr>
            ${pair(SNIP.html, 'result-dunes.webp', { ...LOOKS.dunes2d, mode: '2d', lines: { count: 30, indexEvery: 5, opacity: 0.9 } })}
            ${pair(`createTopography(el, {\n  location: 'fuji',\n  mode: '3d',\n});`, 'result-fuji-3d.webp', {}, 'shot', shot('place-fuji'))}
            ${pair(`createTopography(el, {\n  landform: 'gentle-summit',\n  mode: '3d',\n  camera: { motion: 'orbit' },\n});`, 'result-summit-3d.webp', { ...LOOKS.terraces3d, terrain: { terracing: 0, peaks: 2 } })}
          </table>
          <h2>Settings, before and after</h2>
          <table><tr><th style="width:24%">Setting</th><th>Before</th><th>After</th></tr>
            ${ba('lines.count 12 → 48', { ...base, lines: { count: 12, indexEvery: 4, opacity: 0.8 } }, { ...base, lines: { count: 48, indexEvery: 4, opacity: 0.8 } }, 'lines-12.webp', 'lines-48.webp')}
            ${ba("terrain.terracing 0 → 0.8, in 3D", t3, { ...t3, terrain: { peaks: 2, terracing: 0.8 } }, 'terracing-0.webp', 'terracing-08.webp')}
            ${ba("theme.ink, theme.paper", base, { ...base, theme: { ink: '#6b2e5f', paper: '#f6e4ea' } }, 'theme-dark.webp', 'theme-rose.webp')}
          </table>
          <h2>Video and frames</h2>
          ${pre(`await topography.record({ seconds: 12 });          // 3D video, up to 12 s\nawait topography.snapshot({ frame: 2400 });        // the exact frame at 2.4 s, as PNG`)}`;
        const react = `
          <h1>topographic-react</h1>
          <p>React component for <a>topographic</a>. React 18 and 19, safe for server rendering.</p>
          ${pre('npm install topographic topographic-react')}
          <table style="table-layout:auto"><tr><th style="width:52%">Props</th><th>Result</th></tr>
            ${pair(SNIP.react, 'react-long-ridge.webp', lfc('long-ridge'))}
            ${pair(`<Topography\n  landform="granite"\n  mode="3d"\n  camera={{ motion: 'orbit' }}\n/>`, 'react-granite-3d.webp', { ...LOOKS.granite3d })}
            ${pair(SNIP.look, 'react-survey-map.webp', { style: 'long-ridge', mode: '2d', theme: { ink: '#d8d2c0', paper: '#1d1f1b' }, lines: { count: 44, indexEvery: 4, opacity: 0.85 } })}
          </table>`;
        mount(stage, page({ name: 'topographic', desc: COPY.npm.B.core, keywords: COPY.keywords.core, install: 'npm i topographic', readme: core, deps: 0 })
          + '<div class="sep">topographic-react</div>'
          + page({ name: 'topographic-react', desc: COPY.npm.B.react, keywords: [...COPY.keywords.react, ...COPY.keywords.core.slice(0, 12)], install: 'npm i topographic-react', readme: react, deps: 1 })
          + manifest([
            ['result-long-ridge.webp, result-dunes.webp, result-fuji-3d.webp, result-summit-3d.webp', '560×315 ×4', 'animated, 4 s loop', 'the result of each core snippet'],
            ['lines-12.webp, lines-48.webp, terracing-0.webp, terracing-08.webp, theme-dark.webp, theme-rose.webp', '400×250 ×6', 'still', 'before/after pairs, same seed and frame'],
            ['react-long-ridge.webp, react-granite-3d.webp, react-survey-map.webp', '560×315 ×3', 'animated, 4 s loop', 'the result of each React snippet'],
          ], '13 files, about 12 MB; the pictures prove each snippet works.'), { ...LOOKS.ridge2d, lines: { count: 40, indexEvery: 5, opacity: 0.9 } });
      },
    },
    {
      key: 'C',
      name: 'Lean README, task description',
      note: 'One animated hero per package and one still strip of looks, then text: install, three snippets in &lt;details&gt;, a short API list and links. Lightest to load and to keep current. Description is task-led ("Draw…, then put them on a page, record them to video"). The full gallery lives in the docs and the playground.',
      render(stage) {
        const core = `
          <p align="center">${art({ file: 'hero-dark.webp', w: 1600, h: 600, kind: 'live' })}</p>
          <h1>topographic</h1>
          <p>${COPY.tagline}</p>
          ${pre('npm install topographic')}
          <details open><summary>JavaScript</summary>${pre(SNIP.js)}</details>
          <details><summary>HTML</summary>${pre(SNIP.html)}</details>
          <details><summary>React</summary>${pre(SNIP.react)}</details>
          <p align="center">${art({ file: 'strip-looks.webp', w: 1600, h: 200, anim: false, kind: 'strip' })}</p>
          <p class="cap" style="text-align:center">Seven landforms, any colours. <a>See every look in the playground →</a></p>
          <h2>API</h2>
          <ul><li><code>createTopography(el, settings)</code> returns a <code>topography</code></li>
            <li><code>topography.update(settings)</code>: change anything, live</li>
            <li><code>landform</code>, <code>location</code>, <code>look</code>, <code>mode: '3d'</code></li>
            <li><code>snapshot({ frame })</code> for exact PNG frames; <code>record()</code> for 3D video up to 12 s</li></ul>
          <p><a>Docs</a> · <a>Playground</a> · <a>GitHub</a></p>`;
        const react = `
          <p align="center">${art({ file: 'react-hero.webp', w: 1600, h: 600, patch: { ...LOOKS.dunes2d, mode: '2d' } })}</p>
          <h1>topographic-react</h1>
          <p>The <code>&lt;Topography /&gt;</code> component for <a>topographic</a>.</p>
          ${pre('npm install topographic topographic-react')}
          ${pre(SNIP.react)}
          ${pre(SNIP.place)}
          <p>Every prop matches a <code>topographic</code> setting. <a>Docs</a> · <a>Playground</a></p>`;
        mount(stage, page({ name: 'topographic', desc: COPY.npm.C.core, keywords: COPY.keywords.core, install: 'npm i topographic', readme: core, deps: 0 })
          + '<div class="sep">topographic-react</div>'
          + page({ name: 'topographic-react', desc: COPY.npm.C.react, keywords: [...COPY.keywords.react, ...COPY.keywords.core.slice(0, 12)], install: 'npm i topographic-react', readme: react, deps: 1 })
          + manifest([
            ['hero-dark.webp, hero-light.webp', '1600×600', 'animated, 6 s loop, ≤ 2 MB', 'one 3D terraces orbit; &lt;picture&gt; by colour scheme'],
            ['strip-looks.webp', '1600×200', 'still', 'the seven landforms side by side in one image'],
            ['react-hero.webp', '1600×600', 'animated, 6 s loop', '2D sea dunes drift'],
          ], '4 files, about 5 MB; the README text carries the rest.'), LOOKS.terraces3d);
      },
    },
  ],
};
