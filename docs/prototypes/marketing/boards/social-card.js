// PROTOTYPE board: 1200x630 Open Graph cards for the playground and the docs, live terrain plus type.
// "Save PNG" takes the terrain layer from the live instance's snapshot() and paints the type over it on
// a 2D canvas with the same layout numbers, so the saved file matches the card.
import { terrain, h, LOOKS, LOGO } from '../live.js';
import { COPY } from '../kit.js';

const W = 1200;
const H = 630;
const css = `
.sc{position:absolute;inset:0;background:#0b0b0d;color:#ecebe8;font-family:Inter,sans-serif;overflow:hidden}
.sc .live{position:absolute}
.sc .mark{position:absolute;display:flex;gap:14px;align-items:center;font:600 30px/1 Literata,Georgia,serif}
.sc .mark img{width:56px;height:56px}
.sc h1{position:absolute;margin:0;font:600 72px/1.04 Literata,Georgia,serif;letter-spacing:-.02em}
.sc .line{position:absolute;font:500 24px/1.3 Inter;color:#b9b8b3}
.sc .pill{position:absolute;padding:14px 22px;border-radius:999px;background:#ecebe8;color:#0b0b0d;font:600 22px/1 Inter}
.sc pre{position:absolute;margin:0;padding:20px 24px;border-radius:16px;background:#17171b;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);font:400 20px/1.6 'JetBrains Mono',monospace;color:#cfcdc7}
.sc pre b{color:#8b8a86;font-weight:400}.sc pre i{color:#a9c7e4;font-style:normal}
.sc .chips{position:absolute;display:flex;gap:12px}
.sc .chips span{padding:10px 18px;border-radius:999px;background:rgba(11,11,13,.7);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);font:500 20px/1 Inter;backdrop-filter:blur(8px)}
.sc .save{position:absolute;right:16px;top:16px;z-index:5;border:0;border-radius:999px;padding:9px 14px;font:600 13px Inter;background:rgba(236,235,232,.92);color:#0b0b0d;cursor:pointer}
`;

const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

/** Adds the Save PNG button: terrain layer from snapshot(), then paint(ctx) draws the type in canvas units. */
function saver(stage, t, liveRect, file, paint) {
  const b = document.createElement('button');
  b.className = 'save';
  b.textContent = 'Save PNG';
  b.onclick = async () => {
    b.textContent = 'Rendering…';
    try {
      await document.fonts.ready;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#0b0b0d';
      ctx.fillRect(0, 0, W, H);
      const [x, y, w, hh] = liveRect;
      const bmp = await createImageBitmap(await t.snapshot({ width: w, height: hh }));
      ctx.drawImage(bmp, x, y, w, hh);
      await paint(ctx, await loadImg(LOGO));
      const a = document.createElement('a');
      a.href = cv.toDataURL('image/png');
      a.download = file;
      a.click();
      b.textContent = 'Saved';
    } catch (e) {
      b.textContent = 'Failed';
      console.warn(e);
    }
  };
  stage.querySelector('.sc').append(b);
}

const font = (ctx, f, color) => { ctx.font = f; ctx.fillStyle = color; ctx.textBaseline = 'top'; };
function mark(ctx, logo, x, y, size = 56, px = 30) {
  ctx.drawImage(logo, x, y, size, size);
  font(ctx, `600 ${px}px Literata`, '#ecebe8');
  ctx.fillText('topographic', x + size + 14, y + (size - px) / 2 + 2);
}

export default {
  id: 'social-card',
  title: 'Social cards',
  question: 'Which Open Graph card makes a shared link to the playground or the docs look like a terrain library worth opening?',
  surface: 'og:image for topographic.yahyapak.dev and /docs, and link previews in Slack, X, iMessage and Discord',
  size: [W, H],
  variants: [
    {
      key: 'A',
      name: 'Playground: full-bleed terrain, one call to action',
      note: 'For the playground URL. A live 3D terrain fills the card, the type sits bottom-left on a soft gradient, and a light pill says "Open the playground". Save PNG composites the terrain snapshot and the type on a canvas; a render script can produce the final asset the same way.',
      render(stage) {
        stage.append(h`<style>${css}</style><div class="sc">
          <div class="live" id="sc-a" style="inset:0"></div>
          <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,11,13,.94) 22%,rgba(11,11,13,0) 70%)"></div>
          <div class="mark" style="left:72px;top:64px"><img src="${LOGO}" alt="">topographic</div>
          <h1 style="left:72px;top:236px">Topographic terrain<br>in 2D and 3D.</h1>
          <div class="line" style="left:72px;top:418px">For websites, videos and games.</div>
          <div class="pill" style="left:72px;top:490px">Open the playground →</div>
        </div>`);
        const t = terrain(stage.querySelector('#sc-a'), LOOKS.terraces3d);
        saver(stage, t, [0, 0, W, H], 'og-playground.png', (ctx, logo) => {
          const g = ctx.createLinearGradient(0, 0, W, 0);
          g.addColorStop(0.22, 'rgba(11,11,13,.94)'); g.addColorStop(0.7, 'rgba(11,11,13,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          mark(ctx, logo, 72, 64);
          font(ctx, '600 72px Literata', '#ecebe8');
          ctx.fillText('Topographic terrain', 72, 240); ctx.fillText('in 2D and 3D.', 72, 315);
          font(ctx, '500 24px Inter', '#b9b8b3'); ctx.fillText('For websites, videos and games.', 72, 421);
          ctx.fillStyle = '#ecebe8'; ctx.beginPath(); ctx.roundRect(72, 490, 296, 50, 25); ctx.fill();
          font(ctx, '600 22px Inter', '#0b0b0d'); ctx.fillText('Open the playground →', 94, 504);
        });
      },
    },
    {
      key: 'B',
      name: 'Docs: code on the left, the result on the right',
      note: 'For /docs. The card is the first snippet: install, import and one component, in the proposed 0.6.0 names, beside its live 2D result. A link preview that already teaches the API. The type is the hero; the terrain is the proof.',
      render(stage) {
        stage.append(h`<style>${css}</style><div class="sc">
          <div class="live" id="sc-b" style="left:600px;top:0;right:0;bottom:0"></div>
          <div class="mark" style="left:64px;top:56px"><img src="${LOGO}" alt="">topographic <span style="font:500 22px Inter;color:#8b8a86;margin-left:4px">docs</span></div>
          <h1 style="left:64px;top:160px;font-size:58px">Start in one line.</h1>
          <pre style="left:64px;top:270px;width:480px"><b>$</b> npm i topographic

<b>import</b> { Topography }
  <b>from</b> <i>'topographic-react'</i>;

&lt;Topography landform=<i>"long-ridge"</i> /&gt;</pre>
        </div>`);
        const t = terrain(stage.querySelector('#sc-b'), { ...LOOKS.ridge2d, lines: { count: 40, indexEvery: 5, opacity: 0.95 } });
        saver(stage, t, [600, 0, 600, H], 'og-docs.png', (ctx, logo) => {
          ctx.fillStyle = '#0b0b0d'; ctx.fillRect(0, 0, 600, H);
          mark(ctx, logo, 64, 56);
          font(ctx, '600 30px Literata', '#ecebe8');
          const mw = ctx.measureText('topographic').width;
          font(ctx, '500 22px Inter', '#8b8a86'); ctx.fillText('docs', 64 + 56 + 14 + mw + 18, 74);
          font(ctx, '600 58px Literata', '#ecebe8'); ctx.fillText('Start in one line.', 64, 166);
          ctx.fillStyle = '#17171b'; ctx.beginPath(); ctx.roundRect(64, 270, 480, 234, 16); ctx.fill();
          const lines = [['$ ', 'npm i topographic'], ['', ''], ['import ', '{ Topography }'], ['  from ', "'topographic-react';"], ['', ''], ['', '<Topography landform="long-ridge" />']];
          lines.forEach(([k, v], i) => {
            const y = 292 + i * 32;
            font(ctx, '400 20px JetBrains Mono', '#8b8a86'); ctx.fillText(k, 88, y);
            font(ctx, '400 20px JetBrains Mono', '#cfcdc7'); ctx.fillText(v, 88 + ctx.measureText(k).width, y);
          });
        });
      },
    },
    {
      key: 'C',
      name: 'Centred wordmark over 2D lines, three uses',
      note: 'Brand-first and quiet: full-bleed live 2D dunes, the wordmark and line in the centre, three chips for the uses. Works for both URLs with only the line changed. The Games chip needs D7.',
      render(stage) {
        stage.append(h`<style>${css}</style><div class="sc">
          <div class="live" id="sc-c" style="inset:0"></div>
          <div style="position:absolute;inset:0;background:radial-gradient(ellipse 52% 46% at 50% 50%,rgba(6,32,31,.92),rgba(6,32,31,0))"></div>
          <div class="mark" style="left:0;right:0;top:206px;justify-content:center;font-size:64px"><img src="${LOGO}" alt="" style="width:88px;height:88px">topographic</div>
          <div class="line" style="left:0;right:0;top:330px;text-align:center;color:#d5ece6">${COPY.taglineShort}</div>
          <div class="chips" style="left:0;right:0;top:394px;justify-content:center"><span>Websites</span><span>Videos</span><span>Games</span></div>
        </div>`);
        const t = terrain(stage.querySelector('#sc-c'), LOOKS.dunes2d);
        saver(stage, t, [0, 0, W, H], 'og-brand.png', (ctx, logo) => {
          const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.52);
          g.addColorStop(0, 'rgba(6,32,31,.92)'); g.addColorStop(1, 'rgba(6,32,31,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          font(ctx, '600 64px Literata', '#ecebe8');
          const tw = ctx.measureText('topographic').width;
          const x = (W - (88 + 14 + tw)) / 2;
          mark(ctx, logo, x, 206, 88, 64);
          font(ctx, '500 24px Inter', '#d5ece6'); ctx.textAlign = 'center'; ctx.fillText(COPY.taglineShort, W / 2, 333); ctx.textAlign = 'left';
          font(ctx, '500 20px Inter', '#ecebe8');
          const chips = ['Websites', 'Videos', 'Games'];
          const ws = chips.map((c) => ctx.measureText(c).width + 36);
          let cx = (W - ws.reduce((a, b) => a + b, 0) - 24) / 2;
          chips.forEach((c, i) => {
            ctx.fillStyle = 'rgba(11,11,13,.7)'; ctx.beginPath(); ctx.roundRect(cx, 394, ws[i], 42, 21); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();
            font(ctx, '500 20px Inter', '#ecebe8'); ctx.fillText(c, cx + 18, 405);
            cx += ws[i] + 12;
          });
        });
      },
    },
  ],
};
