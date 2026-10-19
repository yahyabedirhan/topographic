// PROTOTYPE board: the /docs page on topographic.yahyapak.dev, and the link to it from the playground.
// A, B and C are whole pages in docs/, shown in an iframe at 1440 × 900. In the grid, each page runs in
// lite mode (one live view, stills for the rest) so four iframes stay under the browser's WebGL limit.
import { h, shot } from '../live.js';

const page = (file, title) => (stage) => {
  const lite = stage.closest('.small') ? '?lite' : '';
  stage.append(h`<iframe src="/docs/prototypes/marketing/docs/${file}${lite}" title="${title}" style="display:block;width:1440px;height:900px;border:0;background:#0b0b0d"></iframe>`);
};

/* D: the playground's top-left wordmark (apps/playground/src/shared.tsx Wordmark, style.css .pt-wordmark). */
const css = `
.wd{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;background:#0b0b0d;font-family:Inter,system-ui,sans-serif}
.wd .half{position:relative;overflow:hidden;background:url(${shot('playground-dark')}) 0 0/1440px 900px no-repeat}
.wd .half+.half{box-shadow:inset 1px 0 0 rgba(255,255,255,.14)}
.wd .patch{position:absolute;left:0;top:0;width:230px;height:84px;background:#0c0c0e}
.wd .mark{position:absolute;top:22px;left:22px;display:grid;gap:7px;justify-items:start;font:600 17px/1 Literata,Georgia,serif;letter-spacing:-.01em;color:#ecebe8}
.wd .mark a{color:inherit;text-decoration:none;text-shadow:0 0 1px #0b0b0d,0 0 2px #0b0b0d,0 0 3px #0b0b0d,0 0 8px #0b0b0d}
.wd .mark .site{font:400 12px/1 Inter,system-ui,sans-serif;letter-spacing:0;color:#8b8a86}
.wd .mark .sm{font-size:11px;opacity:.7}
.wd .line{display:flex;gap:10px;align-items:baseline}
.wd .mark .docs-strong{font:500 12px/1 Inter,system-ui,sans-serif;color:#ecebe8;opacity:1}
.wd .zoom{position:absolute;left:40px;right:40px;top:300px;height:330px;border-radius:16px;overflow:hidden;background:url(${shot('playground-dark')}) 0 0/4320px 2700px no-repeat;box-shadow:0 0 0 1px rgba(255,255,255,.14),0 30px 80px -20px rgba(0,0,0,.8)}
.wd .zoom .patch{width:690px;height:252px}
.wd .zoom .mark{transform:scale(3);transform-origin:0 0;top:66px;left:66px}
.wd .cap{position:absolute;left:40px;right:40px;top:650px;display:grid;gap:8px;color:#d8d7d3;font-size:15px;line-height:1.5}
.wd .cap b{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;margin-right:10px;border-radius:50%;background:#ecebe8;color:#0b0b0d;font:600 13px/1 Inter}
.wd .cap h3{font:600 18px/1.3 Inter;color:#ecebe8;display:flex;align-items:center}
.wd .cap p{color:#8b8a86;font-size:14px}
`;
const mark = (rows) => `<div class="mark"><a>topographic</a><a class="site">yahyapak.dev</a>${rows}</div>`;
const ONE = `<span class="line"><a class="site sm">About</a><a class="site sm">Docs</a></span>`;
const TWO = `<span class="line"><a class="docs-strong">Docs</a><a class="site sm">About</a></span>`;

export default {
  id: 'docs-page',
  title: 'Docs page',
  question: 'What does a /docs page that holds everything topographic can do look like, in dark mode, at the craft of skills.wheresryan.sh/anatomy?',
  surface: 'topographic.yahyapak.dev/docs, linked next to About at the top left of the playground',
  size: [1440, 900],
  variants: [
    {
      key: 'A',
      name: 'Reference essay',
      note: 'The anatomy layout in dark. A sticky nav whose contour-ring marker follows the section, one 560 px column, numbered section rules, and a margin with footnotes and controls: sliders there drive the live lines, terrain, 3D and camera figures. Galleries of the seven landforms (drawn by the library through snapshot()), nine looks and ten locations, and theme tabs over one live view. Six live views at most. Open it full size: <a href="docs/a.html" target="_blank">docs/a.html</a>.',
      render: page('a.html', 'Docs variant A, reference essay'),
    },
    {
      key: 'B',
      name: 'Live split',
      note: 'Scrollytelling. One sticky live terrain on the right changes its settings as each of the 24 sections crosses the middle of the screen, with a readout of what it draws written as 0.6.0 code. Each section has an "On the stage" panel: landform and look chips, sliders, motions, and real snapshot() and record() runs. One WebGL context for the whole page. Open it full size: <a href="docs/b.html" target="_blank">docs/b.html</a>.',
      render: page('b.html', 'Docs variant B, live split'),
    },
    {
      key: 'C',
      name: 'Developer reference',
      note: 'Dense three columns, like an API reference. A filterable nav (press /), prose with every table open, and a sticky code column per section. One language choice (JavaScript, React, HTML) for the page, and a names switch that shows each snippet with the 0.5.0 names. A single live preview moves into whichever section you preview. Adds one full-width table of every setting. Open it full size: <a href="docs/c.html" target="_blank">docs/c.html</a>.',
      render: page('c.html', 'Docs variant C, developer reference'),
    },
    {
      key: 'D',
      name: 'Docs link in the playground',
      note: 'The playground\'s top-left wordmark with a Docs link, over the real dark playground. 1 (left): Docs after About, in the same quiet 11 px style, so the row reads "About  Docs". 2 (right): Docs before About, at 12 px in the text colour, so the way to the docs is the first link people see. Both keep the wordmark and yahyapak.dev as they are.',
      render(stage) {
        const half = (n, rows, title, text) => `<div class="half"><div class="patch"></div>${mark(rows)}
          <div class="zoom"><div class="patch"></div>${mark(rows)}</div>
          <div class="cap"><h3><b>${n}</b>${title}</h3><p>${text}</p></div></div>`;
        stage.append(h`<style>${css}</style><div class="wd">
          ${half(1, ONE, 'After About, same weight', 'Quiet, and consistent with the current row. Docs is the last thing in the corner, so it is easy to miss.')}
          ${half(2, TWO, 'Before About, in the text colour', 'Docs leads the row and is brighter than About. One more step of emphasis in the corner, still under the wordmark.')}
        </div>`);
      },
    },
  ],
};
