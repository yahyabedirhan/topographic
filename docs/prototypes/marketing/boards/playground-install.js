// PROTOTYPE board: where the playground offers install and a first snippet, drawn over a real screenshot.
// Styles copy the playground's tokens (apps/playground/src/style.css): glass, 22px popovers, 11px titles.
import { h, shot, NPM, REPO } from '../live.js';
import { hl, ICON, wireCopy, wireTabs, DOCS_URL } from '../kit.js';

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

<topographic-map location="istanbul" mode="3d"
  line-count="36"></topographic-map>`,
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
    {
      key: 'A',
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
