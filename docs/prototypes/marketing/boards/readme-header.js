// PROTOTYPE board: the README's first screen, as GitHub renders it in dark mode, with the About sidebar.
import { terrain, h, shot, LOOKS, LOGO, NPM, NPM_REACT, PLAYGROUND } from '../live.js';
import { SNIP, COPY, hl, badge, ICON, DOCS_URL, wireCopy, PLACE_LOOK } from '../kit.js';
import { placeTerrain } from '../places.js';
import { TEXT } from '../draft.js';

const css = `
.gh{position:absolute;inset:0;background:#0d1117;color:#f0f6fc;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;overflow:hidden}
.gh a{color:#4493f8;text-decoration:none}
.gh .top{height:64px;background:#010409;display:flex;align-items:center;gap:14px;padding:0 24px;font-size:14px}
.gh .top .oct{color:#f0f6fc;display:grid}
.gh .top .crumb{color:#f0f6fc}.gh .top .crumb b{font-weight:600}
.gh .top .search{margin-left:auto;width:260px;height:32px;border-radius:6px;box-shadow:inset 0 0 0 1px #3d444d;color:#9198a1;display:flex;align-items:center;padding:0 10px;font-size:13px}
.gh .tabs{height:48px;background:#010409;border-bottom:1px solid #3d444d;display:flex;gap:4px;padding:0 24px;align-items:stretch}
.gh .tabs span{display:flex;align-items:center;gap:8px;padding:0 8px;color:#f0f6fc}
.gh .tabs span.on{box-shadow:inset 0 -2px 0 #f78166;font-weight:600}
.gh .tabs i{font-style:normal;font-size:12px;background:#2f3742;border-radius:99px;padding:0 6px;line-height:18px}
.gh .wrap{max-width:1280px;margin:0 auto;padding:0 32px}
.gh .title{display:flex;align-items:center;gap:8px;padding:16px 0;border-bottom:1px solid #3d444d}
.gh .title img{width:24px;height:24px;border-radius:50%}
.gh .title b{font-size:20px;font-weight:600}
.gh .pill{font-size:12px;color:#9198a1;box-shadow:inset 0 0 0 1px #3d444d;border-radius:99px;padding:0 7px;line-height:20px}
.gh .btns{margin-left:auto;display:flex;gap:8px}
.gh .btns span{display:flex;gap:6px;align-items:center;font-size:12px;font-weight:500;background:#212830;box-shadow:inset 0 0 0 1px #3d444d;border-radius:6px;padding:0 10px;height:28px;color:#f0f6fc}
.gh .cols{display:grid;grid-template-columns:minmax(0,1fr) 296px;gap:24px;padding-top:24px}
.gh .commit{display:flex;align-items:center;gap:8px;padding:0 16px;height:50px;border:1px solid #3d444d;border-radius:6px 6px 0 0;background:#151b23;font-size:13px;color:#9198a1}
.gh .commit b{color:#f0f6fc;font-weight:600}
.gh .files{height:38px;border:1px solid #3d444d;border-top:0;border-radius:0 0 6px 6px;display:flex;align-items:center;padding:0 16px;font-size:13px;color:#9198a1;gap:18px}
.gh .readme{margin-top:16px;border:1px solid #3d444d;border-radius:6px}
.gh .readme-h{height:46px;display:flex;align-items:center;gap:16px;padding:0 16px;border-bottom:1px solid #3d444d;font-size:14px}
.gh .readme-h span{display:flex;gap:8px;align-items:center;color:#9198a1}.gh .readme-h span.on{color:#f0f6fc;font-weight:600;box-shadow:inset 0 -2px 0 #f78166;height:100%}
.gh .md{padding:32px;font-size:16px;line-height:1.5}
.gh .md h1{font-size:2em;font-weight:600;padding-bottom:.3em;border-bottom:1px solid #3d444d;margin:0 0 16px;line-height:1.25}
.gh .md p{margin:0 0 16px}
.gh .md code{font:85% ui-monospace,SFMono-Regular,"SF Mono",Menlo,monospace;background:#656c7633;padding:.2em .4em;border-radius:6px}
.gh .md pre{position:relative;margin:0 0 16px;padding:16px;border-radius:6px;background:#151b23;font:13.6px/1.45 ui-monospace,SFMono-Regular,"SF Mono",Menlo,monospace;color:#f0f6fc;white-space:pre;overflow:hidden}
.gh .md pre code{background:none;padding:0;font-size:100%}
.gh .md pre .k{color:#ff7b72}.gh .md pre .s{color:#a5d6ff}.gh .md pre .t{color:#7ee787}.gh .md pre .c{color:#9198a1}
.gh .md pre button{position:absolute;right:8px;top:8px;width:32px;height:32px;border-radius:6px;border:0;background:#212830;box-shadow:inset 0 0 0 1px #3d444d;color:#9198a1;display:grid;place-items:center;cursor:pointer;font-size:11px}
.gh .md .c-row{text-align:center}
.gh .md .live{position:relative;border-radius:6px;overflow:hidden}
.gh .md details{border:1px solid #3d444d;border-radius:6px;margin:0 0 8px}
.gh .md summary{padding:8px 12px;cursor:pointer;font-weight:600}
.gh .md details pre{margin:0 12px 12px}
.gh .md table{border-collapse:collapse;width:100%;margin:0 0 16px;table-layout:fixed}
.gh .md td,.gh .md th{border:1px solid #3d444d;padding:6px 13px;vertical-align:top;font-size:14px}
.gh .md th{font-weight:600;text-align:left}
.gh .side h2{font-size:16px;font-weight:600;margin:0 0 16px}
.gh .side p{margin:0 0 16px;font-size:16px;line-height:1.5}
.gh .side .lnk{display:flex;gap:8px;align-items:center;font-weight:600;margin-bottom:16px;color:#4493f8}
.gh .side .lnk svg{color:#9198a1}
.gh .topics{display:flex;flex-wrap:wrap;gap:4px 4px;margin-bottom:16px}
.gh .topics span{font-size:12px;font-weight:500;line-height:22px;padding:0 10px;border-radius:99px;background:#388bfd1a;color:#4493f8}
.gh .meta{display:grid;gap:8px;color:#9198a1;font-size:14px;padding-bottom:20px;border-bottom:1px solid #3d444d}
.gh .meta span{display:flex;gap:8px;align-items:center}
.gh .rel{padding-top:16px}.gh .rel b{font-size:16px}.gh .rel .tag{display:flex;gap:8px;align-items:center;margin-top:12px}
.gh .rel .latest{font-size:12px;color:#3fb950;box-shadow:inset 0 0 0 1px #238636;border-radius:99px;padding:0 7px;line-height:20px}
`;

/** The GitHub frame around a README body: header, tabs, title row, commit row, About sidebar. */
function frame(stage, readme, description = TEXT.github) {
  stage.append(h`<style>${css}</style><div class="gh">
    <div class="top"><span class="oct">${ICON.github.replace(/16/g, '32')}</span><span class="crumb">yahyabedirhan / <b>topographic</b></span><span class="search">Type / to search</span></div>
    <div class="tabs"><span class="on">&lt;&gt; Code</span><span>Issues <i>3</i></span><span>Pull requests <i>1</i></span><span>Actions</span><span>Projects</span><span>Security</span><span>Insights</span></div>
    <div class="wrap">
      <div class="title"><img src="${LOGO}" alt=""><b>topographic</b><span class="pill">Public</span>
        <span class="btns"><span>Watch 2</span><span>Fork 4</span><span>${ICON.star} Star 128</span></span></div>
      <div class="cols">
        <div>
          <div class="commit"><b>yahyabedirhan</b> Merge pull request #64 from yahyabedirhan/fix/optout-wording <span style="margin-left:auto">412 commits</span></div>
          <div class="files"><span>📁 apps</span><span>📁 assets</span><span>📁 docs</span><span>📁 packages</span><span>📁 scripts</span><span>… 14 more files</span></div>
          <div class="readme"><div class="readme-h"><span class="on">${ICON.book} README</span><span>${ICON.law} Apache-2.0 license</span><span>Security</span></div>
            <div class="md">${readme}</div></div>
        </div>
        <aside class="side">
          <h2>About</h2>
          <p>${description}</p>
          <span class="lnk">${ICON.link} topographic.yahyapak.dev</span>
          <div class="topics">${COPY.topics.map((t) => `<span>${t}</span>`).join('')}</div>
          <div class="meta"><span>${ICON.book} Readme</span><span>${ICON.law} Apache-2.0 license</span><span>${ICON.star} 128 stars</span></div>
          <div class="rel"><b>Releases 6</b><div class="tag"><span>v0.5.0</span><span class="latest">Latest</span></div></div>
        </aside>
      </div>
    </div></div>`);
  wireCopy(stage);
}

const pre = (code) => `<pre><code>${hl(code)}</code><button data-copy="${code.replace(/"/g, '&quot;')}" title="Copy">${ICON.copy}</button></pre>`;
const npmLinks = `<a href="${NPM}">npm: topographic</a> · <a href="${NPM_REACT}">npm: topographic-react</a>`;

export default {
  id: 'readme-header',
  title: 'README header',
  question: 'What should the README show before the first scroll, so a visitor from GitHub reaches install and a working snippet fastest?',
  surface: 'README.md on GitHub (and its copy on npm)',
  size: [1440, 1560],
  variants: [
    {
      key: 'A',
      name: 'Badges, the line, a moving real place, then install',
      note: 'Round 3, the pick. The line and the two opening paragraphs come from the writing desk (<code>copy-draft.json</code>), so the README, npm and the docs say the same thing. The hero is a plain image with no text or URL on it. Round 2: badges stay on top (both npm packages and the license, without per-badge version numbers: the version shows once, in Releases; the zero-dependency badge is gone), then the new line and the link row, then the hero: Everest and the Khumbu, live from real elevation, orbiting. On GitHub it ships as <code>readme/hero-everest.webp</code>, an animated WebP loop (the only way to move in a README). <code>npm install topographic</code> now sits below the image, then the first snippet.',
      render(stage) {
        frame(stage, `
          <div class="c-row"><img src="${LOGO}" width="72" alt=""></div>
          <h1 style="text-align:center">topographic</h1>
          <p class="c-row" style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">${badge('npm', 'topographic', '#cb3837')} ${badge('npm', 'topographic-react', '#cb3837')} ${badge('license', 'Apache-2.0', '#007ec6')}</p>
          <p class="c-row">${TEXT.line}</p>
          <p>${TEXT.open1}</p>
          <p>${TEXT.open2}</p>
          <p class="c-row"><a href="${PLAYGROUND}"><b>Open the playground</b></a> · <a href="${DOCS_URL}">Docs</a> · ${npmLinks}</p>
          <div class="live" id="rh-a" style="height:400px;margin-bottom:16px;background:#0b0b0d"></div>
          ${pre('npm install topographic')}
          ${pre(SNIP.placeJs)}`);
        placeTerrain(stage.querySelector('#rh-a'), 'everest', PLACE_LOOK);
      },
    },
    {
      key: 'B',
      archived: true,
      name: 'Install first, code before the image',
      note: 'Left aligned and developer-first: the line, the npm links, then three snippets as &lt;details&gt; blocks (JavaScript open, React and HTML one click away). GitHub has no real tabs, so &lt;details&gt; is the closest honest tab. The live picture starts at the fold.',
      render(stage) {
        frame(stage, `
          <h1 style="display:flex;gap:12px;align-items:center"><img src="${LOGO}" width="40" alt="">topographic</h1>
          <p>${COPY.tagline} <a href="${PLAYGROUND}">Try it in the playground</a>.</p>
          <p style="font-size:14px">${badge('npm', 'v0.5.0', '#cb3837')} &nbsp;${npmLinks} · <a href="${DOCS_URL}">Docs</a></p>
          <details open><summary>JavaScript</summary>${pre(`npm install topographic\n`)}${pre(SNIP.js)}</details>
          <details><summary>React</summary>${pre('npm install topographic topographic-react')}${pre(SNIP.react)}</details>
          <details><summary>HTML</summary>${pre(SNIP.html)}</details>
          <div class="live" id="rh-b" style="height:240px;margin-top:16px"></div>`);
        // collapse <pre> margins inside details so the three blocks read as one tab set
        for (const p of stage.querySelectorAll('details pre')) p.style.margin = '0 12px 8px';
        terrain(stage.querySelector('#rh-b'), LOOKS.ridge2d);
      },
    },
    {
      key: 'C',
      archived: true,
      name: 'Three terrains, then install',
      note: 'Shows the range before the code: a three-column table of live terrains, then install and links.',
      render(stage) {
        const cell = (id, head, text) => `<td><div class="live" id="${id}" style="height:150px;margin-bottom:8px"></div><b>${head}</b><br><span style="color:#9198a1">${text}</span></td>`;
        frame(stage, `
          <h1 style="text-align:center">topographic</h1>
          <p class="c-row">${COPY.taglineShort}. Generate land or load a real place.</p>
          <table><tr>
            ${cell('rh-c0', '2D', 'Contour lines that drift.')}
            ${cell('rh-c1', '3D', 'A surface the camera orbits.')}
            ${cell('rh-c2', 'Any shape', 'A seed is a new land.')}
          </tr></table>
          ${pre('npm install topographic')}
          <p class="c-row">${npmLinks} · <a href="${PLAYGROUND}"><b>Playground</b></a> · <a href="${DOCS_URL}">Docs</a></p>`);
        terrain(stage.querySelector('#rh-c0'), LOOKS.dunes2d);
        terrain(stage.querySelector('#rh-c1'), LOOKS.terraces3d);
        terrain(stage.querySelector('#rh-c2'), { style: 'long-ridge', seed: 4, mode: '3d', lines: { count: 30, indexEvery: 5 }, theme: { ink: '#b9d3a0', paper: '#0c120a' }, camera: { motion: 'flyover' } });
      },
    },
  ],
};
