// PROTOTYPE board: yahyapak.dev/projects/topographic, in the real page's layout and type
// (personal-website src/main.js project() and src/style.css), with new copy and the new playground URL.
import { terrain, h, shot, LOOKS, LOGO } from '../live.js';
import { COPY, SNIP, hl, ICON, wireCopy, SITE_URL, DOCS_URL } from '../kit.js';

const css = `
.sp{position:absolute;inset:0;background:#0b0b0d;color:#ecebe8;font:400 15px/1.65 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;
  --mut:#8b8a86;--line:rgba(255,255,255,.09);--glass-fill:rgba(255,255,255,.045);--glass-edge:inset 0 0 0 .5px rgba(255,255,255,.12),inset 0 1px 0 rgba(255,255,255,.08),0 6px 24px -12px rgba(0,0,0,.6)}
.sp a{color:inherit;text-decoration:none}
.sp .bg{position:absolute;inset:0;opacity:.55}
.sp .wrap{position:relative;max-width:624px;margin:0 auto;padding:128px 24px 120px}
.sp .back{color:var(--mut)}
.sp .pj-head{margin-top:40px}
.sp .pj-icon{display:block;width:128px;height:128px;margin:0 0 calc(18px - 12.5px) -12.5px}
.sp h1{font:600 40px/1.1 Literata,Georgia,serif;letter-spacing:-.022em;margin:0 0 10px}
.sp .pj-repo{display:inline-flex;gap:8px;align-items:center;color:var(--mut);font-size:13px}
.sp .pj-about{margin:32px 0 40px}
.sp .pj-links{display:flex;flex-wrap:wrap;gap:6px 18px;margin:-16px 0 32px;font-size:13px}
.sp .pj-links a{color:var(--mut)}.sp .pj-links a.main{color:#ecebe8}
.sp .hero{margin:0 0 40px}.sp .hero img{display:block;width:100%;border-radius:10px}
.sp .details{color:#ecebe8;margin:28px 0 8px}
.sp code{font:500 .88em/1 ui-monospace,SFMono-Regular,Menlo,monospace;padding:.1em .35em;border-radius:5px;background:var(--line)}
.sp .opt{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 -14px;padding:12px 14px;border-radius:14px;background:var(--glass-fill);box-shadow:var(--glass-edge);backdrop-filter:blur(10px) saturate(1.5)}
.sp .opt code{background:none;padding:0;font-size:14px}
.sp .opt-btn{flex:none;font:500 13px Inter;padding:6px 14px;border-radius:99px;box-shadow:inset 0 0 0 .5px var(--mut);background:none;color:#ecebe8;border:0;cursor:pointer}
.sp pre{margin:12px -14px 0;padding:14px;border-radius:14px;background:rgba(0,0,0,.45);box-shadow:inset 0 0 0 .5px var(--line);font:400 13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre;color:#d8d7d3}
.sp pre .k{color:#d6a36a}.sp pre .s{color:#8fd6a5}.sp pre .t{color:#a9c7e4}
.sp h2{font:500 13px/1 Inter;color:var(--mut);margin:0 0 14px;letter-spacing:.01em}
.sp .rows{list-style:none;padding:0;margin:0}
.sp .rows li{margin:0 -14px}
.sp .row{display:grid;grid-template-columns:112px minmax(0,1fr) auto;column-gap:16px;align-items:baseline;padding:12px 14px;border-radius:14px}
.sp .row.on{background:var(--glass-fill);box-shadow:var(--glass-edge)}
.sp .pn{font-weight:500}.sp .pl{color:var(--mut)}.sp .pa{color:var(--mut)}
.sp .live-hero{position:relative;height:270px;border-radius:10px;overflow:hidden;margin:32px 0 28px;box-shadow:inset 0 0 0 .5px var(--line)}
`;

const ABOUT = 'Topographic terrain in 2D and 3D, rendered with WebGL. Generate land or load a real place, then put it on a website, render it to video, or bring it into a game.';
const DETAILS = 'The npm packages have no dependencies and work in plain HTML, in JavaScript and in React. In the <a href="#" style="text-decoration:underline;text-underline-offset:3px">playground</a>, you change the settings and copy the code, a PNG image or a video.';
const LINKS = [
  ['Playground', SITE_URL, true], ['Docs', DOCS_URL, true],
  ['npm: topographic', 'https://www.npmjs.com/package/topographic'], ['npm: topographic-react', 'https://www.npmjs.com/package/topographic-react'],
];

const head = (icon = true) => `<a class="back">← Index</a>
  <header class="pj-head">${icon ? `<img class="pj-icon" src="${LOGO}" alt="">` : ''}<h1>topographic</h1>
    <a class="pj-repo">${ICON.github}<span>github.com/yahyabedirhan/topographic</span></a></header>`;
const links = `<nav class="pj-links">${LINKS.map(([l, href, main]) => `<a href="${href}" class="${main ? 'main' : ''}">${l} ↗</a>`).join('')}</nav>`;

function mount(stage, html) {
  stage.append(h`<style>${css}</style><div class="sp"><div class="bg"></div><div class="wrap">${html}</div></div>`);
  wireCopy(stage);
  // the site's own background is a topo shader; the real library stands in for it, dimmed the same way
  terrain(stage.querySelector('.bg'), { style: 'gentle-summit', theme: { mode: 'dark' }, lines: { count: 28, indexEvery: 5, opacity: 0.35 } });
}

export default {
  id: 'site-page',
  title: 'yahyapak.dev page',
  question: 'In what order should the project page put about, install, links and the picture, so a visitor from yahyapak.dev starts using it?',
  surface: 'yahyapak.dev/projects/topographic (personal-website src/data.js, the topographic entry)',
  variants: [
    {
      key: 'A',
      name: 'Today’s order, new copy and links',
      note: 'Keeps the page’s structure (icon, title, repo, about, links, hero, details) and only fixes the words and links: the new positioning line, Playground and Docs first and pointing at topographic.yahyapak.dev (today they point at the old yahyabedirhan.github.io/topographic). Smallest change in data.js. The "game" clause needs D7.',
      render(stage) {
        mount(stage, `${head()}
          <p class="pj-about">${ABOUT}</p>${links}
          <figure class="hero"><img src="${shot('hero')}" alt=""></figure>
          <p class="details">${DETAILS}</p>`);
      },
    },
    {
      key: 'B',
      name: 'Install first',
      note: 'A copyable install row (the site’s glass row, like the About page’s opt-out box) and the first snippet sit right under the line, before the picture. Needs a small new block type in main.js ("install"); the rest stays data. Best for developers arriving from the home page row.',
      render(stage) {
        mount(stage, `${head()}
          <p class="pj-about" style="margin-bottom:24px">${ABOUT}</p>
          <div class="opt"><code>npm install topographic</code><button class="opt-btn" data-copy="npm install topographic">Copy</button></div>
          <pre>${hl(SNIP.react)}</pre>
          <nav class="pj-links" style="margin:24px 0 32px">${LINKS.map(([l, href, main]) => `<a href="${href}" class="${main ? 'main' : ''}">${l} ↗</a>`).join('')}</nav>
          <figure class="hero"><img src="${shot('hero')}" alt=""></figure>`);
      },
    },
    {
      key: 'C',
      name: 'Live hero first, links as rows',
      note: 'The page opens on a live 3D terrain (the real library, not a picture), then the title and line. The links become the site’s own glass rows with a one-line reason each, the same component as the home page’s project list, so the next click is obvious. Two WebGL views on one page; needs a small "live" block in main.js.',
      render(stage) {
        mount(stage, `<a class="back">← Index</a>
          <div class="live-hero" id="sp-c"></div>
          <h1>topographic</h1>
          <a class="pj-repo">${ICON.github}<span>github.com/yahyabedirhan/topographic</span></a>
          <p class="pj-about" style="margin:24px 0 32px">${ABOUT}</p>
          <h2>Start here</h2>
          <ul class="rows">
            <li><a class="row on" href="${SITE_URL}"><span class="pn">Playground</span><span class="pl">Pick a look or a real place, copy the code</span><span class="pa">↗</span></a></li>
            <li><a class="row" href="${DOCS_URL}"><span class="pn">Docs</span><span class="pl">Install and a first snippet in JS, React, HTML</span><span class="pa">↗</span></a></li>
            <li><a class="row" href="https://www.npmjs.com/package/topographic"><span class="pn">npm</span><span class="pl">topographic · topographic-react</span><span class="pa">↗</span></a></li>
          </ul>`);
        terrain(stage.querySelector('#sp-c'), LOOKS.terraces3d);
      },
    },
  ],
};
