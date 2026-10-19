// PROTOTYPE board: the one line and the first screen that say what topographic is.
import { terrain, h, shot, LOOKS, INSTALL, LOGO } from '../live.js';

const css = `
.pz{position:absolute;inset:0;font-family:Inter,sans-serif;color:#ecebe8;background:#0b0b0d}
.pz h1{font:600 64px/1.05 Literata,Georgia,serif;letter-spacing:-.02em}
.pz p.sub{font-size:21px;line-height:1.5;color:#b9b8b3;max-width:620px}
.pz .chip{display:inline-flex;gap:12px;align-items:center;padding:12px 16px;border-radius:12px;background:#17171b;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);font:500 16px/1 'JetBrains Mono',monospace}
.pz .chip b{color:#8b8a86;font-weight:400}
.pz .btn{display:inline-block;padding:13px 18px;border-radius:999px;background:#ecebe8;color:#0b0b0d;font-weight:600;font-size:15px;text-decoration:none}
.pz .row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.pz .logo{width:44px;height:44px;border-radius:10px}
.pz .live{position:absolute}
.pz .tag{font:500 12px/1 Inter;letter-spacing:.08em;text-transform:uppercase;color:#8b8a86}
`;
const style = () => h`<style>${css}</style>`;

export default {
  id: 'positioning',
  title: 'Positioning',
  question: 'What one sentence and first screen say what topographic is, without tying it to one use?',
  surface: 'README tagline, npm description, site, playground title, video end cards',
  variants: [
    {
      key: 'A',
      name: 'Terrain toolkit',
      note: 'Says the category first ("topographic terrain"), then lists three uses as equals. The live 3D view carries the visual. Line: "Topographic terrain in 2D and 3D, for websites, videos and games."',
      render(stage) {
        stage.append(style(), h`<div class="pz">
          <div class="live" id="a-live" style="inset:0 0 0 38%"></div>
          <div style="position:absolute;inset:0;background:linear-gradient(90deg,#0b0b0d 34%,rgba(11,11,13,.0) 62%)"></div>
          <div style="position:absolute;left:96px;top:190px;width:640px;display:grid;gap:28px">
            <div class="row"><img class="logo" src="${LOGO}" alt=""><span style="font:600 22px Literata">topographic</span></div>
            <h1>Topographic terrain in 2D and 3D.</h1>
            <p class="sub">Generate land or load a real place. Use it as a website, render it to video, or bring it into your game.</p>
            <div class="row"><span class="chip"><b>$</b>${INSTALL}</span><a class="btn">Open the playground</a></div>
          </div></div>`);
        terrain(stage.querySelector('#a-live'), LOOKS.granite3d);
      },
    },
    {
      key: 'B',
      name: 'Three uses, side by side',
      note: 'Shows the three uses as three framed scenes: a browser, a video timeline and a game HUD. Proves the range at a glance. The game frame needs D7 (heightmap export) to be honest.',
      render(stage) {
        stage.append(style(), h`<div class="pz" style="background:#0e0e11">
          <div style="text-align:center;padding-top:80px;display:grid;gap:18px;justify-items:center">
            <span class="tag">topographic</span>
            <h1 style="font-size:58px">Contour maps and terrain,<br>for anything you make.</h1>
            <div class="row" style="justify-content:center"><span class="chip"><b>$</b>${INSTALL}</span></div>
          </div>
          <div style="position:absolute;left:72px;right:72px;bottom:80px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
            ${['Your website', 'Your video', 'Your game'].map((t, i) => `
              <figure style="margin:0;display:grid;gap:12px">
                <div style="position:relative;height:330px;border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.1)">
                  <div class="live" id="b-live-${i}" style="inset:0"></div>
                  ${i === 0 ? `<div style="position:absolute;inset:0 0 auto;height:30px;background:#1b1b20;display:flex;gap:6px;align-items:center;padding:0 12px"><i style="width:9px;height:9px;border-radius:50%;background:#444"></i><i style="width:9px;height:9px;border-radius:50%;background:#444"></i><i style="width:9px;height:9px;border-radius:50%;background:#444"></i></div><div style="position:absolute;left:28px;top:120px;font:600 30px Literata">Your product</div>` : ''}
                  ${i === 1 ? `<div style="position:absolute;inset:auto 0 0;height:46px;background:rgba(0,0,0,.6);display:flex;align-items:center;gap:10px;padding:0 14px;font:500 12px 'JetBrains Mono'"><span>▶</span><span style="flex:1;height:4px;border-radius:2px;background:linear-gradient(90deg,#ecebe8 38%,#444 38%)"></span><span>00:04 / 00:12</span></div>` : ''}
                  ${i === 2 ? `<div style="position:absolute;left:14px;top:14px;font:600 13px 'JetBrains Mono';background:rgba(0,0,0,.55);padding:8px 10px;border-radius:8px">ALT 2,140 m · WP 3/7</div><div style="position:absolute;right:14px;bottom:14px;width:90px;height:90px;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.5);background:rgba(0,0,0,.35)"></div>` : ''}
                </div>
                <figcaption style="font:500 16px Inter;color:#d8d7d3">${t}</figcaption>
              </figure>`).join('')}
          </div></div>`);
        terrain(stage.querySelector('#b-live-0'), LOOKS.ridge2d);
        terrain(stage.querySelector('#b-live-1'), LOOKS.terraces3d);
        terrain(stage.querySelector('#b-live-2'), { ...LOOKS.granite3d, camera: { motion: 'flyover' } });
      },
    },
    {
      key: 'C',
      name: 'Code is the brush',
      note: 'Developer-first. The proposed 0.6.0 API on the left, its live result on the right. The line is about control: "Describe a landscape in a few settings."',
      render(stage) {
        stage.append(style(), h`<div class="pz" style="display:grid;grid-template-columns:1fr 1fr">
          <div style="padding:120px 72px;display:grid;gap:30px;align-content:start">
            <span class="tag">topographic</span>
            <h1 style="font-size:56px">Describe a landscape.<br>Get it in 2D or 3D.</h1>
            <pre style="margin:0;padding:24px 26px;border-radius:14px;background:#141418;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);font:400 17px/1.7 'JetBrains Mono';color:#cfcdc7">
<span style="color:#8b8a86">import</span> { createTopography } <span style="color:#8b8a86">from</span> <span style="color:#a9c7e4">'topographic'</span>;

createTopography(canvasHost, {
  landform: <span style="color:#a9c7e4">'granite'</span>,
  seed: <span style="color:#e0a24a">67</span>,
  mode: <span style="color:#a9c7e4">'3d'</span>,
  lines: { count: <span style="color:#e0a24a">36</span>, indexEvery: <span style="color:#e0a24a">4</span> },
  camera: { motion: <span style="color:#a9c7e4">'orbit'</span> },
});</pre>
            <div class="row"><span class="chip"><b>$</b>${INSTALL}</span></div>
          </div>
          <div style="position:relative"><div class="live" id="c-live" style="inset:0"></div></div>
        </div>`);
        terrain(stage.querySelector('#c-live'), LOOKS.granite3d);
      },
    },
    {
      key: 'D',
      name: 'Any place on Earth',
      note: 'Leads with real places, the most surprising feature. Full-bleed Mount Fuji, location chips along the bottom. Line: "Real places and made-up land, drawn in contour lines."',
      render(stage) {
        stage.append(style(), h`<div class="pz">
          <img src="${shot('place-fuji')}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
          <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,13,.85),rgba(11,11,13,0) 45%,rgba(11,11,13,.9))"></div>
          <div style="position:absolute;left:96px;top:96px;display:grid;gap:22px;max-width:900px">
            <span class="tag">topographic</span>
            <h1 style="font-size:72px">Real places and made-up land,<br>drawn in contour lines.</h1>
          </div>
          <div style="position:absolute;left:96px;right:96px;bottom:80px;display:flex;justify-content:space-between;align-items:end">
            <div class="row">${['Mount Fuji', 'Matterhorn', 'Grand Canyon', 'Istanbul', 'Everest', 'Any area up to 300 km'].map((p, i) => `<span class="chip" style="font-family:Inter;font-size:14px;${i === 0 ? 'background:#ecebe8;color:#0b0b0d' : ''}">${p}</span>`).join('')}</div>
            <span class="chip"><b>$</b>${INSTALL}</span>
          </div></div>`);
      },
    },
  ],
};
