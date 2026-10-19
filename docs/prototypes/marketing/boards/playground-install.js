// PROTOTYPE board: where the playground offers install and a first snippet, drawn over a real screenshot.
// Styles copy the playground's tokens (apps/playground/src/style.css): glass, 22px popovers, 11px titles.
import { h, shot, NPM, REPO } from '../live.js';
import { hl, ICON, wireCopy, wireTabs, DOCS_URL, INSTALL_LABELS } from '../kit.js';
import { placeTerrain } from '../places.js';

const css = `
.pi{position:absolute;inset:0;--sans:-apple-system,BlinkMacSystemFont,Inter,system-ui,sans-serif;--fg:#ecebe8;--mut:#8b8a86;--line:rgba(255,255,255,.09);--paper:#0b0b0d;--seg-on:color-mix(in srgb,var(--fg) 15%,transparent);
  font:400 13px/1.4 var(--sans);color:var(--fg);background:#0b0b0d url(${shot('playground-dark')}) 0 0/1440px 900px no-repeat}
.pi [hidden]{display:none!important}
.pi .glass{background:color-mix(in srgb,var(--paper) 50%,transparent);box-shadow:inset 0 0 0 .5px var(--line),inset 0 1px 0 rgba(255,255,255,.08),0 18px 50px -24px rgba(0,0,0,.65);backdrop-filter:blur(22px) saturate(1.5);-webkit-backdrop-filter:blur(22px) saturate(1.5)}
.pi .pop{position:absolute;width:404px;padding:14px 16px 16px;border-radius:22px;display:grid;gap:12px}
.pi .pt{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut)}
.pi .seg{display:grid;grid-template-columns:repeat(3,1fr);padding:2px;border-radius:10px;background:color-mix(in srgb,var(--fg) 6%,transparent)}
.pi .seg button{font:500 12.5px var(--sans);color:var(--fg);border:0;background:none;border-radius:8px;padding:6px 0;cursor:pointer}
.pi .seg button.on{background:var(--seg-on);box-shadow:inset 0 0 0 .5px rgba(255,255,255,.06),0 1px 2px rgba(0,0,0,.25)}
.pi .cmd{white-space:nowrap;display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;border-radius:12px;background:color-mix(in srgb,var(--fg) 6%,transparent);font:500 12.5px 'JetBrains Mono',ui-monospace,monospace}
.pi .cmd b{color:var(--mut);font-weight:400}
.pi .cp{margin-left:auto;display:grid;place-items:center;min-width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--fg);cursor:pointer;font:500 11px var(--sans)}
.pi .cp:hover{background:color-mix(in srgb,var(--fg) 8%,transparent)}
.pi pre{margin:0;padding:12px;border-radius:12px;background:rgba(0,0,0,.35);box-shadow:inset 0 0 0 .5px var(--line);font:400 12px/1.6 'JetBrains Mono',ui-monospace,monospace;white-space:pre;overflow:hidden;color:#d8d7d3}
.pi pre .k{color:#d6a36a}.pi pre .s{color:#8fd6a5}.pi pre .t{color:#a9c7e4}.pi pre .c{color:var(--mut)}
.pi .wide{display:flex;justify-content:center;gap:8px;align-items:center;padding:10px;border:0;border-radius:12px;background:var(--fg);color:var(--paper);font:600 13px var(--sans);cursor:pointer}
.pi .links{display:flex;gap:6px}
.pi .links a{flex:1;display:flex;gap:6px;justify-content:center;align-items:center;padding:8px;border-radius:10px;color:var(--fg);text-decoration:none;box-shadow:inset 0 0 0 .5px var(--line);font-weight:500}
.pi .links a:hover{background:color-mix(in srgb,var(--fg) 6%,transparent)}
.pi .hint{color:var(--mut);font-size:12.5px;line-height:1.45}
.pi .pill{position:absolute;display:flex;align-items:center;gap:8px;height:48px;padding:0 18px 0 14px;border-radius:999px;font:500 13px var(--sans);color:var(--fg)}
.pi .pill.open{background:color-mix(in srgb,var(--fg) 14%,color-mix(in srgb,var(--paper) 50%,transparent))}
.pi .wm{position:absolute;top:18px;left:16px;padding:4px 8px 8px 6px;background:#0b0b0d;display:grid;gap:7px;justify-items:start;font:600 17px/1 Literata,Georgia,serif;letter-spacing:-.01em}
.pi .wm .site{font:400 12px/1 var(--sans);letter-spacing:0;color:var(--mut);display:flex;gap:10px}
.pi .wm .site a{color:inherit;text-decoration:none}.pi .wm .site a.new{color:var(--fg)}
.pi .chip{display:inline-flex;align-items:center;gap:8px;padding:6px 8px 6px 10px;border-radius:999px;font:500 11.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:0;cursor:pointer;border:0;color:var(--fg)}
.pi .tip{position:absolute;padding:5px 8px;border-radius:8px;background:var(--fg);color:var(--paper);font-size:12px;box-shadow:0 8px 24px rgba(0,0,0,.28)}
.pi .ring{position:absolute;border-radius:999px;box-shadow:0 0 0 2px #e0a24a,0 0 0 6px rgba(224,162,74,.25);pointer-events:none}
`;

/** The scene in the screenshot (Istanbul in 3D), as code, in the proposed 0.6.0 names. */
const SCENE = {
  js: `import { createTopography } from 'topographic';

createTopography(el, {
  location: 'istanbul',
  mode: '3d',
  lines: { count: 36, indexEvery: 4 },
  camera: { azimuth: 341.8, elevation: 39.3 },
});`,
  react: `import { Topography } from 'topographic-react';

<Topography
  location="istanbul"
  mode="3d"
  lines={{ count: 36, indexEvery: 4 }}
  camera={{ azimuth: 341.8, elevation: 39.3 }}
/>`,
  html: `<script type="module">import 'topographic/element';</script>

<topographic-view location="istanbul" mode="3d"
  line-count="36"></topographic-view>`,
};
const INST = { js: 'npm install topographic', react: 'npm install topographic topographic-react', html: 'npm install topographic' };

/** The install popover body, shared by A and C: tabs, install line, scene code, copy, links. */
function body(title, { first = 'js', links = true } = {}) {
  const tabs = [['js', 'JavaScript'], ['react', 'React'], ['html', 'HTML']];
  return `<div class="pt">${title}</div>
    <div class="seg">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === first ? 'on' : ''}">${n}</button>`).join('')}</div>
    ${tabs.map(([k]) => `<div data-pane="${k}" ${k === first ? '' : 'hidden'} style="display:grid;gap:10px">
      <div class="cmd"><b>$</b>${INST[k]}<button class="cp" data-copy="${INST[k]}" title="Copy">${ICON.copy}</button></div>
      <pre>${hl(SCENE[k])}</pre>
      <button class="wide" data-copy="${SCENE[k].replace(/"/g, '&quot;')}">${ICON.copy} Copy this scene as code</button></div>`).join('')}
    ${links ? `<div class="links"><a href="${NPM}">npm</a><a href="${REPO}">${ICON.github} GitHub</a><a href="${DOCS_URL}">Docs</a></div>` : ''}`;
}

/** The agent-first entry: install the topographic skill, then ask for a terrain in words. */
const SKILL = 'npx skills add yahyabedirhan/topographic';
const ASKS = [
  'Add a 3D topographic terrain of Mount Fuji behind my landing page hero.',
  'Render a 10-second orbit of this terrain as an MP4 for my video intro.',
  'Use this exact scene in my React app.',
];
/** The current scene as a prompt an agent can act on, with the skill install first. */
const SCENE_PROMPT = `Install the topographic skill with \`${SKILL}\`, then add this terrain to my project: location istanbul, 3D, 36 contour lines with every 4th line bold, camera at azimuth 341.8° and elevation 39.3°.`;

function agentBody(title) {
  return `<div class="pt">${title}</div>
    <div class="seg" style="grid-template-columns:1fr 1fr"><button data-tab="agent" class="on">With an agent</button><button data-tab="hand">By hand</button></div>
    <div data-pane="agent" style="display:grid;gap:10px">
      <div class="hint">Install the topographic skill once. Your agent then installs the packages and writes the code.</div>
      <div class="cmd"><b>$</b>${SKILL}<button class="cp" data-copy="${SKILL}" title="Copy">${ICON.copy}</button></div>
      <div class="pt" style="margin-top:2px">Then ask</div>
      ${ASKS.map((a) => `<div class="cmd" style="font-family:var(--sans);white-space:normal;font-weight:400">“${a}”<button class="cp" data-copy="${a}" title="Copy">${ICON.copy}</button></div>`).join('')}
      <button class="wide" data-copy="${SCENE_PROMPT.replace(/"/g, '&quot;')}">${ICON.copy} Copy this scene as a prompt</button>
      <div class="hint">Works with Claude Code, Cursor, Codex and other agents that read skills.</div>
    </div>
    <div data-pane="hand" hidden style="display:grid;gap:10px">
      <div class="cmd"><b>$</b>${INST.js}<button class="cp" data-copy="${INST.js}" title="Copy">${ICON.copy}</button></div>
      <pre>${hl(SCENE.js)}</pre>
      <button class="wide" data-copy="${SCENE.js.replace(/"/g, '&quot;')}">${ICON.copy} Copy this scene as code</button>
    </div>
    <div class="links"><a href="${NPM}">npm</a><a href="${REPO}">${ICON.github} GitHub</a><a href="${DOCS_URL}">Docs</a></div>`;
}


// ---------------------------------------------------------------- round 2: Install alone in the corner
// Sizes from apps/playground/src/style.css: .pt-top at 16px from the top and right with an 8px gap,
// .pt-cluster padding 6px around 36px .pt-ibtn circles (48px tall), popovers 10px under the cluster,
// 22px radius. Export is 412px wide; Install is 456px so the skill command shows in full beside its Copy pill. The popover's parts copy the Export popover (exporting.tsx):
// .pt-link-shot preview with a label chip, .pt-urlchip parameter chips, .pt-linkrow fields with the
// .pt-copy pill, .pt-code with line numbers and tinted values.
const css2 = `
.pi .cover{position:absolute;top:10px;right:10px;width:180px;height:60px;background:url(${shot('playground-dark')}) -1000px -10px/1440px 900px no-repeat}
.pi .cluster{position:absolute;top:16px;right:72px;display:flex;align-items:center;gap:2px;padding:6px;border-radius:999px}
.pi .solo{position:absolute;top:16px;right:16px;padding:6px;border-radius:999px;display:flex}
.pi .ib{position:relative;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:var(--fg)}
.pi .ib.open{background:color-mix(in srgb,var(--fg) 14%,transparent)}
.pi .ib .tag{position:absolute;top:-1px;right:-5px;padding:2px 3px;border-radius:999px;font:600 9px/1 var(--sans);color:var(--paper);background:var(--fg)}
.pi .ib .dot{position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--fg)}
.pi .pop2{position:absolute;top:74px;right:16px;width:456px;padding:14px 16px 16px;border-radius:22px;display:grid;gap:8px}
.pi .shot{position:relative;margin:0;border-radius:14px;overflow:hidden;background:var(--paper);box-shadow:inset 0 0 0 .5px var(--line)}
.pi .shot .live{position:absolute;inset:0}
.pi .shot figcaption{position:absolute;left:8px;top:8px;padding:4px 7px;border-radius:999px;font:500 10.5px/1 var(--sans);color:var(--mut);background:color-mix(in srgb,var(--paper) 72%,transparent);z-index:1}
.pi .chips{display:flex;flex-wrap:wrap;gap:5px}
.pi .uc{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px 0 8px;border-radius:999px;font-size:11.5px;line-height:1;background:color-mix(in srgb,var(--fg) 7%,transparent);box-shadow:inset 0 0 0 .5px var(--line)}
.pi .uc i{font:normal 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--mut)}
.pi .sec{margin-top:6px;padding-top:10px;border-top:.5px solid var(--line);display:grid;gap:8px}
.pi .sec-t{display:flex;align-items:center;gap:7px;font:600 10.5px/1 var(--sans);letter-spacing:.08em;text-transform:uppercase;color:var(--mut)}
.pi .sec-t svg{color:var(--fg)}
.pi .hint2{color:var(--mut);font-size:12.5px;line-height:1.45}
.pi .hint2 code{font:11.5px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--fg)}
.pi .row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;padding:4px 4px 4px 12px;border-radius:12px;background:color-mix(in srgb,var(--paper) 42%,transparent);box-shadow:inset 0 0 0 .5px var(--line)}
.pi .row b{color:var(--mut);font:400 12px ui-monospace,SFMono-Regular,Menlo,monospace}
.pi .row code{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:6px 0;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--fg)}
.pi .pill2{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px 0 10px;border:0;border-radius:999px;background:var(--fg);color:var(--paper);font:500 12.5px/1 var(--sans);cursor:pointer;white-space:nowrap}
.pi .pill2.quiet{background:color-mix(in srgb,var(--fg) 8%,transparent);color:var(--fg)}
.pi .head2{display:flex;align-items:center;justify-content:space-between;gap:12px}
.pi .code2{margin:0;padding:10px 12px 10px 8px;border-radius:12px;background:color-mix(in srgb,var(--paper) 42%,transparent);box-shadow:inset 0 0 0 .5px var(--line);font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--fg);display:grid;grid-template-columns:18px minmax(0,1fr);column-gap:10px;white-space:pre}
.pi .code2 .ln{color:color-mix(in srgb,var(--mut) 70%,transparent);text-align:right}
.pi .code2 .key{color:#c4a574}.pi .code2 .str{color:#7dba9a}.pi .code2 .num{color:#8aadd4}.pi .code2 .tg{font-weight:600}
.pi .ibtn{display:grid;place-items:center;width:28px;height:28px;flex:none;border:0;border-radius:8px;background:transparent;color:var(--mut);cursor:pointer}
.pi .ibtn:hover{background:color-mix(in srgb,var(--fg) 8%,transparent);color:var(--fg)}
.pi .row.q{background:transparent}
.pi .row.q code{color:color-mix(in srgb,var(--fg) 82%,transparent)}
.pi .codebox{position:relative}
.pi .codebox .ibtn{position:absolute;top:6px;right:6px}
.pi .foot{display:flex;align-items:center;gap:6px;color:var(--mut);font-size:12px}
.pi .foot a{color:var(--fg);text-decoration:none;margin-left:auto;display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:8px}
.pi .foot a:hover{background:color-mix(in srgb,var(--fg) 8%,transparent)}
.pi .code2 .vp{padding:0 4px;margin:0 -1px;border-radius:5px;background:color-mix(in srgb,currentColor 14%,transparent);box-shadow:inset 0 0 0 .5px color-mix(in srgb,currentColor 38%,transparent)}
`;
const LU = (d, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const GLYPH = {
  earth: '<path d="M21.54 15H17a2 2 0 0 0-2 2v4.54"/><path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17"/><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05"/><circle cx="12" cy="12" r="10"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>',
  code: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  sparkles: '<path d="M9.94 14.06 4 20M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
};
/** The top-right corner after the change: the four existing buttons, then Install alone at the far right, open. */
const corner = (icon) => `<div class="cover"></div>
  <div class="cluster glass"><span class="ib">${LU(GLYPH.earth)}<i class="dot"></i></span><span class="ib">${LU(GLYPH.box)}<span class="tag">3D</span></span><span class="ib">${LU(GLYPH.sliders)}</span><span class="ib">${LU(GLYPH.share)}</span></div>
  <div class="solo glass"><span class="ib open" title="Install">${LU(GLYPH[icon])}</span></div>`;
const field = (cmd, label = 'Copy', quiet = false) => `<div class="row"><b>$</b><code>${cmd}</code><button class="pill2${quiet ? ' quiet' : ''}" data-copy="${cmd}">${LU(GLYPH.copy, 14)}${label}</button></div>`;
const CHIPS = [['location', 'istanbul'], ['mode', '3d'], ['lines', '36'], ['indexEvery', '4'], ['azimuth', '341.8°'], ['elevation', '39.3°']];
const chips = (n = CHIPS.length) => `<div class="chips">${CHIPS.slice(0, n).map(([k, v]) => `<span class="uc"><i>${k}</i>${v}</span>`).join('')}</div>`;
const preview = (h, label) => `<figure class="shot" style="height:${h}px"><div class="live"></div><figcaption>${label}</figcaption></figure>`;
/** The scene as React code with tinted values, as Export's code view draws it. */
const SCENE_CODE = [
  '<span class="tg">&lt;Topography</span>',
  '  <span class="key">location</span>=<span class="str vp">"istanbul"</span>',
  '  <span class="key">mode</span>=<span class="str vp">"3d"</span>',
  '  <span class="key">lines</span>={{ count: <span class="num vp">36</span>, indexEvery: <span class="num vp">4</span> }}',
  '  <span class="key">camera</span>={{ azimuth: <span class="num vp">341.8</span>, elevation: <span class="num vp">39.3</span> }}',
  '<span class="tg">/&gt;</span>',
];
const codeView = () => `<pre class="code2">${SCENE_CODE.map((l, i) => `<span class="ln">${i + 1}</span><span>${l}</span>`).join('')}</pre>`;
const SKILL2 = 'npx skills add yahyabedirhan/topographic';
/** A quiet icon-only copy button: every copy after a part's first is one of these, so each part has one bright button. */
const icopy = (value, title = 'Copy') => `<button class="ibtn" data-copy="${value.replace(/"/g, '&quot;')}" title="${title}" aria-label="${title}">${LU(GLYPH.copy, 14)}</button>`;
const qfield = (cmd) => `<div class="row q"><b>$</b><code>${cmd}</code>${icopy(cmd)}</div>`;
/** The scene in the screenshot as JS, matching the npm install line above it, drawn as Export's code view. */
const SCENE_JS = [
  '<span class="tg">createTopography</span>(el, {',
  '  <span class="key">location</span>: <span class="str vp">\'istanbul\'</span>,',
  '  <span class="key">mode</span>: <span class="str vp">\'3d\'</span>,',
  '  <span class="key">lines</span>: { count: <span class="num vp">36</span>, indexEvery: <span class="num vp">4</span> },',
  '  <span class="key">camera</span>: { azimuth: <span class="num vp">341.8</span>, elevation: <span class="num vp">39.3</span> },',
  '});',
];
const SCENE_JS_TEXT = `createTopography(el, {\n  location: 'istanbul',\n  mode: '3d',\n  lines: { count: 36, indexEvery: 4 },\n  camera: { azimuth: 341.8, elevation: 39.3 },\n});`;
const SCENE_LINK = 'https://topographic.yahyapak.dev/?s=istanbul-3d-36-4-341.8-39.3';
/** Mounts a round 2 variant: the corner, the popover, then the live preview of the scene (Istanbul in 3D). */
function mount2(stage, icon, pop) {
  stage.append(h`<style>${css}${css2}</style><div class="pi">${corner(icon)}<div class="pop2 glass">${pop}</div></div>`);
  wireCopy(stage);
  placeTerrain(stage.querySelector('.shot .live'), 'istanbul', { theme: { mode: 'dark', ink: '#c4cfe2', paper: '#0b0b0d' }, lines: { count: 36, indexEvery: 4, opacity: 1 }, camera: { azimuth: 341.8, elevation: 39.3, radius: 1.5, motion: 'orbit' } });
}
const ROUND2 = [
  {
    key: 'A4',
    name: 'A1 with the scene\'s code and link, one bright button per part',
    note: 'Round 3, built from what you liked in A1–A3. A1\'s base: the live preview and the parameter chips, with the label "Istanbul · 3D" only. Then the Agent skill part and the npm package part, each with its command. The npm package part also holds this scene as code and its link, a shortcut to Export, so people see how to make exactly what is on screen. Each part has one bright Copy; every other copy is a quiet icon button, and "Open Export" is a text link.',
    render(stage) {
      mount2(stage, 'code', `${preview(148, 'Istanbul · 3D')}${chips()}
        <div class="sec"><div class="sec-t">${LU(GLYPH.sparkles, 13)}${INSTALL_LABELS.agent}</div>${field(SKILL2)}</div>
        <div class="sec"><div class="sec-t">${LU(GLYPH.hand, 13)}${INSTALL_LABELS.npm}</div>${field('npm install topographic')}
          ${qfield('npm install topographic topographic-react')}
          <div class="codebox"><pre class="code2">${SCENE_JS.map((l, i) => `<span class="ln">${i + 1}</span><span>${l}</span>`).join('')}</pre>${icopy(SCENE_JS_TEXT, 'Copy this code')}</div>
          <div class="foot"><a href="#">${LU(GLYPH.share, 13)}Export</a></div></div>`);
    },
  },
  {
    key: 'A1',
    archived: true,
    name: 'Preview and chips, then two commands',
    note: 'Install is a glass circle of its own at the far top-right, the size of the cluster beside it (48px glass, 36px button). Its popover follows Export: a live preview of the scene with a label chip and the parameter chips under it, then two parts. The agent skill part is the skill install and one line on what happens next. The npm package part is the npm line, and the React line under it. No tabs. Every field is Export\'s mono field with its Copy pill.',
    render(stage) {
      mount2(stage, 'code', `${preview(148, 'This scene')}${chips()}
        <div class="sec"><div class="sec-t">${LU(GLYPH.sparkles, 13)}${INSTALL_LABELS.agent}</div>${field(SKILL2)}</div>
        <div class="sec"><div class="sec-t">${LU(GLYPH.hand, 13)}${INSTALL_LABELS.npm}</div>${field('npm install topographic')}
          ${field('npm install topographic topographic-react', 'Copy', true)}</div>`);
    },
  },
  {
    key: 'A2',
    archived: true,
    name: 'Smaller preview, the scene as code',
    note: 'Same corner and parts as A1, with a shorter preview and the scene\'s code in the npm package part, drawn as Export\'s code view: line numbers and tinted values, with Copy in the part\'s header. People see the exact settings that make what is on screen, and the install line above them. The longest popover of the three, still under the 720px cap.',
    render(stage) {
      mount2(stage, 'download', `${preview(108, 'This scene · Istanbul in 3D')}
        <div class="sec"><div class="sec-t">${LU(GLYPH.sparkles, 13)}${INSTALL_LABELS.agent}</div>${field(SKILL2)}</div>
        <div class="sec"><div class="sec-t">${LU(GLYPH.hand, 13)}${INSTALL_LABELS.npm}</div>${field('npm install topographic topographic-react')}
          <div class="head2"><span class="hint2">This scene</span><button class="pill2" data-copy="&lt;Topography location=&quot;istanbul&quot; mode=&quot;3d&quot; /&gt;">${LU(GLYPH.copy, 14)}Copy</button></div>
          ${codeView()}</div>`);
    },
  },
  {
    key: 'A3',
    archived: true,
    name: 'Large preview, one line each',
    note: 'The quietest: a large live preview carries the visual, then one field per part and nothing else. The React line and the scene code stay in Export. Best if the popover should feel like a start button rather than a reference.',
    render(stage) {
      mount2(stage, 'terminal', `${preview(212, 'Istanbul · 3D · 36 lines')}
        <div class="sec"><div class="sec-t">${LU(GLYPH.sparkles, 13)}${INSTALL_LABELS.agent}</div>${field(SKILL2)}</div>
        <div class="sec"><div class="sec-t">${LU(GLYPH.hand, 13)}${INSTALL_LABELS.npm}</div>${field('npm install topographic')}</div>`);
    },
  },
];

const mount = (stage, html) => {
  stage.append(h`<style>${css}</style><div class="pi">${html}</div>`);
  wireCopy(stage);
  wireTabs(stage);
};

export default {
  id: 'playground-install',
  title: 'Playground install entry',
  question: 'Where in the playground does a visitor find install and the code for what they see, without hunting inside Export?',
  surface: 'topographic.yahyapak.dev: the top-right cluster, the top-left wordmark row, or the bottom dock',
  variants: [
    ...ROUND2,
    {
      key: 'A',
      archived: true,
      name: 'Install pill beside the controls',
      note: 'A labelled "Install" pill sits left of the top-right cluster and opens a playground-style popover: JS / React / HTML tabs, a copyable install line, this scene as code with "Copy this scene as code", and npm, GitHub and Docs links. The only labelled button in the top bar, so it is found first. Today install lives only inside Export.',
      render(stage) {
        mount(stage, `
          <span class="pill glass open" style="top:16px;right:172px"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5.5 4 1.5 8l4 4M10.5 4l4 4-4 4"/></svg>Install</span>
          <div class="pop glass" style="top:74px;right:172px">${body('Use it in your project')}</div>`);
      },
    },
    {
      key: 'B',
      archived: true,
      name: 'Docs · npm in the wordmark row, plus a copy chip',
      note: 'The quietest change: "Docs" and "npm" join yahyapak.dev and About under the wordmark, and a small copy chip with the install command sits below them. One click copies; no popover. The scene code stays in Export. The tooltip shows the copied state.',
      render(stage) {
        mount(stage, `
          <div class="wm"><span>topographic</span>
            <span class="site"><a>yahyapak.dev</a><a>About</a><a class="new" href="${DOCS_URL}">Docs</a><a class="new" href="${NPM}">npm</a></span>
            <button class="chip glass" data-copy="npm install topographic" style="margin-top:4px">npm i topographic ${ICON.copy}</button></div>
          <span class="tip" style="top:104px;left:150px">Copied · paste in your terminal</span>`);
      },
    },
    {
      key: 'C',
      archived: true,
      name: 'End card in the dock',
      note: 'A "Use it in your project" card closes the row of looks in the bottom dock, where people already browse. It opens a popover above the dock with this scene as React code first, since the dock is about the current look. Reads as the next step after picking a look.',
      render(stage) {
        mount(stage, `
          <div style="position:absolute;left:1100px;top:832px;width:174px;height:48px;border-radius:16px;background:#ecebe8;color:#0b0b0d;display:flex;align-items:center;gap:8px;padding:0 12px;font:600 12.5px/1.15 var(--sans)">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5.5 4 1.5 8l4 4M10.5 4l4 4-4 4"/></svg><span>Use it in your<br>project</span></div>
          <div class="ring" style="left:1100px;top:832px;width:174px;height:48px;border-radius:16px"></div>
          <div class="pop glass" style="bottom:84px;left:880px">${body('This scene as code', { first: 'react' })}</div>`);
      },
    },
    {
      key: 'D',
      archived: true,
      name: 'First-visit banner',
      note: 'A one-time glass banner at the top centre after the first look change: "Like it? npm install topographic" with Copy, Docs and a close button. Never shows again once closed. Catches visitors who never open a menu; costs one dismissal for everyone else.',
      render(stage) {
        mount(stage, `
          <div class="glass" style="position:absolute;top:18px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:6px 6px 6px 16px;border-radius:999px">
            <span style="font-weight:500">Like it? Use it in your project</span>
            <span class="cmd" style="padding:6px 6px 6px 10px;border-radius:999px"><b>$</b>npm install topographic<button class="cp" data-copy="npm install topographic">${ICON.copy}</button></span>
            <a href="${DOCS_URL}" style="color:var(--fg);text-decoration:none;font-weight:500;padding:0 6px">Docs</a>
            <button class="cp" aria-label="Close" style="border-radius:50%;font-size:16px">×</button></div>`);
      },
    },
    {
      key: 'E',
      archived: true,
      name: 'Agent first: skill, then ask',
      note: 'Agent-first take on A. The "Install" pill opens on a "With an agent" tab: install the topographic skill with one command, then three example asks (a website, a video, this scene) to copy, and "Copy this scene as a prompt". "By hand" keeps the npm line and the scene code. The skill is skills/topographic in draft PR #77.',
      render(stage) {
        mount(stage, `
          <span class="pill glass open" style="top:16px;right:172px"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5.5 4 1.5 8l4 4M10.5 4l4 4-4 4"/></svg>Install</span>
          <div class="pop glass" style="top:74px;right:172px">${agentBody('Use it in your project')}</div>`);
      },
    },
    {
      key: 'F',
      archived: true,
      name: 'This scene as a prompt, from the dock',
      note: 'No install step on screen at all: the dock end card copies one prompt that tells an agent to install the skill and rebuild exactly what is on screen. The prompt is shown so people see what they paste. The npm route stays in Export. Best for people who will never open a terminal themselves.',
      render(stage) {
        mount(stage, `
          <div style="position:absolute;left:1100px;top:832px;width:174px;height:48px;border-radius:16px;background:#ecebe8;color:#0b0b0d;display:flex;align-items:center;gap:8px;padding:0 12px;font:600 12.5px/1.15 var(--sans)">
            ${ICON.copy}<span>Give this to<br>your agent</span></div>
          <div class="ring" style="left:1100px;top:832px;width:174px;height:48px;border-radius:16px"></div>
          <div class="pop glass" style="bottom:84px;left:880px">
            <div class="pt">This scene, for your agent</div>
            <pre style="white-space:pre-wrap;font-family:var(--sans);font-size:13px;line-height:1.5">${SCENE_PROMPT}</pre>
            <button class="wide" data-copy="${SCENE_PROMPT.replace(/"/g, '&quot;')}">${ICON.copy} Copy prompt</button>
            <div class="hint">The prompt installs the topographic skill, which installs the packages and writes the code. Prefer npm? Use Export.</div>
          </div>
`);
      },
    },
    {
      key: 'G',
      archived: true,
      name: 'Skill chip in the wordmark row',
      note: 'Agent-first take on B: the always-visible chip under the wordmark copies the skill install instead of npm. "Docs" and "npm" sit beside About for people who install by hand. The quietest agent-first option.',
      render(stage) {
        mount(stage, `
          <div class="wm"><span>topographic</span>
            <span class="site"><a>yahyapak.dev</a><a>About</a><a class="new" href="${DOCS_URL}">Docs</a><a class="new" href="${NPM}">npm</a></span>
            <button class="chip glass" data-copy="${SKILL}" style="margin-top:4px">✦ ${SKILL} ${ICON.copy}</button>
            <span style="font:400 11.5px var(--sans);color:var(--mut);letter-spacing:0">Install the skill, then ask your agent for a terrain.</span></div>
          <span class="tip" style="top:126px;left:330px">Copied · paste in your terminal</span>`);
      },
    },
  ],
};
