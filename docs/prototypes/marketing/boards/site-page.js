// PROTOTYPE board: yahyapak.dev/projects/topographic, in the real page's layout and type
// (personal-website src/main.js project() and src/style.css), with new copy and the new playground URL.
import { terrain, h, shot, LOOKS, LOGO } from '../live.js';
import { COPY, SNIP, hl, ICON, wireCopy, SITE_URL, DOCS_URL, PLACE_LOOK } from '../kit.js';
import { placeTerrain } from '../places.js';

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
.sp .pj-links.ico{gap:8px 20px}
.sp .pj-links.ico a{display:inline-flex;gap:7px;align-items:center}
.sp .pj-links.ico svg{flex:none;opacity:.9}
.sp .live-hero{position:relative;height:270px;border-radius:10px;overflow:hidden;margin:32px 0 28px;box-shadow:inset 0 0 0 .5px var(--line)}
`;

const ABOUT = COPY.line;
const DETAILS = 'Use it in plain HTML, in JavaScript or in React. In the <a href="#" style="text-decoration:underline;text-underline-offset:3px">playground</a>, you change the settings and copy the code, a PNG image or a video.';
const LINKS = [
  ['Playground', SITE_URL, true], ['Docs', DOCS_URL, true],
  ['npm: topographic', 'https://www.npmjs.com/package/topographic'], ['npm: topographic-react', 'https://www.npmjs.com/package/topographic-react'],
];
// Round 2 copy: the line, and details that say how to use it without listing uses or selling "no dependencies".
const ABOUT2 = COPY.line;
const DETAILS2 = 'Use it in plain HTML, in JavaScript or in React. In the <a href="#" style="text-decoration:underline;text-underline-offset:3px">playground</a>, pick a real place or shape a land, then copy the code, a PNG image or a video.';
// Small icons in the site's own icon style (personal-website src/icons.js: 24px grid, 16px, 1.8 stroke or solid).
const SITE_ICON = {
  playground: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3.5c4.9 0 8.5 3.4 8.5 8.1 0 4.6-3.8 8.9-8.7 8.9-4.7 0-8.3-3.7-8.3-8.2C3.5 7.5 7 3.5 12 3.5Z"/><path d="M12.2 7.6c2.6 0 4.5 1.8 4.5 4.2 0 2.5-2 4.6-4.6 4.6-2.4 0-4.3-1.9-4.3-4.3 0-2.6 1.8-4.5 4.4-4.5Z"/><circle cx="12.1" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>',
  docs: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 6.5c-1.6-1.3-4.2-2-8-2v13c3.8 0 6.4.7 8 2 1.6-1.3 4.2-2 8-2v-13c-3.8 0-6.4.7-8 2Z"/><path d="M12 6.5v13"/></svg>',
  npm: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2 7h20v9h-10v1.8H8V16H2V7Zm1.6 1.6v5.8h3.2v-4.2h1.6v4.2h1.6V8.6H3.6Zm8 0v7.3h3.2v-1.5h3.2V8.6h-6.4Zm3.2 1.6h1.6v2.6h-1.6v-2.6Zm4.8-1.6v5.8h1.6V8.6h-1.6Z"/></svg>',
};
const LINKS2 = [['Playground', SITE_URL, SITE_ICON.playground], ['Docs', DOCS_URL, SITE_ICON.docs],
  ['topographic', 'https://www.npmjs.com/package/topographic', SITE_ICON.npm], ['topographic-react', 'https://www.npmjs.com/package/topographic-react', SITE_ICON.npm]];
const links2 = `<nav class="pj-links ico">${LINKS2.map(([l, href, icon], i) => `<a href="${href}" class="${i < 2 ? 'main' : ''}">${icon}<span>${l}</span></a>`).join('')}</nav>`;

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
  size: [1440, 1320],
  variants: [
    {
      key: 'A',
      name: 'Today’s order, the line, icon links',
      note: 'Round 2. The page keeps its structure (icon, title, repo, about, links, hero, details). Playground, Docs and both npm packages now carry small icons drawn like the GitHub mark beside the repo link: a contour ring, a book and the npm mark, so the row reads as four places to go rather than four text links. The about text is the new line; the hero is the Grand Canyon, live from real elevation (on the real site, an animated WebP).',
      render(stage) {
        mount(stage, `${head()}
          <p class="pj-about">${ABOUT2}</p>${links2}
          <figure class="hero"><div class="live-hero" id="sp-a" style="margin:0;height:340px"></div></figure>
          <p class="details">${DETAILS2}</p>`);
        placeTerrain(stage.querySelector('#sp-a'), 'grand-canyon', PLACE_LOOK);
      },
    },
    {
      key: 'B',
      archived: true,
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
      archived: true,
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
