// PROTOTYPE board: 1200x630 Open Graph cards for the playground and the docs, live terrain plus type.
// "Save PNG" takes the terrain layer from the live instance's snapshot() and paints the type over it on
// a 2D canvas with the same layout numbers, so the saved file matches the card.
import { terrain, h, LOOKS, LOGO } from '../live.js';
import { COPY, PLACE_LOOK } from '../kit.js';
import { placeTerrain } from '../places.js';

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
.sc .code{position:absolute;padding:12px 16px;border-radius:12px;background:rgba(15,15,18,.82);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);font:400 18px/1.5 'JetBrains Mono',monospace;color:#cfcdc7;white-space:pre}
.sc .code b{color:#8b8a86;font-weight:400}.sc .code i{color:#8fd6a5;font-style:normal}
.sc .chips span i{color:#8fd6a5;font-style:normal}.sc .chips span{font-family:'JetBrains Mono',monospace;font-size:18px}
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
      const bmp = await createImageBitmap(await (await t).snapshot({ width: w, height: hh }));
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
/** Fills text word by word inside maxW, one line every lh pixels. */
function wrap(ctx, text, x, y, maxW, lh) {
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = word; } else line = next;
  }
  if (line) ctx.fillText(line, x, y);
}
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
      name: 'Playground: Everest full bleed, the line, the call that draws it',
      note: 'Round 2. For the playground URL. Everest and the Khumbu from real elevation fill the card; the line sits bottom-left on a soft gradient, with the one call that draws this view and a light pill to open the playground. No use keywords. Save PNG composites a frame of the live terrain and the type on a canvas.',
      render(stage) {
        const head = COPY.the.head;
        stage.append(h`<style>${css}</style><div class="sc">
          <div class="live" id="sc-a" style="inset:0"></div>
          <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,11,13,.94) 26%,rgba(11,11,13,0) 72%)"></div>
          <div class="mark" style="left:72px;top:64px"><img src="${LOGO}" alt="">topographic</div>
          <h1 style="left:72px;top:180px;width:660px;font-size:56px">${head}</h1>
          <div class="line" style="left:72px;top:330px;width:520px">${COPY.the.sub}</div>
          <div class="code" style="left:72px;top:416px"><b>createTopography</b>(el, { location: <i>'everest'</i> })</div>
          <div class="pill" style="left:72px;top:500px">Open the playground →</div>
        </div>`);
        const t = placeTerrain(stage.querySelector('#sc-a'), 'everest', PLACE_LOOK);
        saver(stage, t, [0, 0, W, H], 'og-playground.png', (ctx, logo) => {
          const g = ctx.createLinearGradient(0, 0, W, 0);
          g.addColorStop(0.26, 'rgba(11,11,13,.94)'); g.addColorStop(0.72, 'rgba(11,11,13,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          mark(ctx, logo, 72, 64);
          font(ctx, '600 56px Literata', '#ecebe8');
          wrap(ctx, head, 72, 184, 660, 58);
          font(ctx, '500 24px Inter', '#b9b8b3'); wrap(ctx, COPY.the.sub, 72, 333, 520, 31);
          ctx.fillStyle = 'rgba(15,15,18,.82)'; ctx.beginPath(); ctx.roundRect(72, 416, 520, 51, 12); ctx.fill();
          const parts = [['createTopography', '#8b8a86'], ['(el, { location: ', '#cfcdc7'], ["'everest'", '#8fd6a5'], [' })', '#cfcdc7']];
          let x = 88;
          for (const [txt, c] of parts) { font(ctx, '400 18px JetBrains Mono', c); ctx.fillText(txt, x, 430); x += ctx.measureText(txt).width; }
          ctx.fillStyle = '#ecebe8'; ctx.beginPath(); ctx.roundRect(72, 500, 296, 50, 25); ctx.fill();
          font(ctx, '600 22px Inter', '#0b0b0d'); ctx.fillText('Open the playground →', 94, 514);
        });
      },
    },
    {
      key: 'B',
      name: 'Docs: the code on the left, the Grand Canyon it draws on the right',
      note: 'Round 2. For /docs. The card is a working snippet with real parameters (<code>location="grand-canyon"</code>, <code>lines={{ count: 48 }}</code>) beside the live terrain those exact settings draw. A link preview that teaches the API and proves it.',
      render(stage) {
        stage.append(h`<style>${css}</style><div class="sc">
          <div class="live" id="sc-b" style="left:600px;top:0;right:0;bottom:0"></div>
          <div class="mark" style="left:64px;top:56px"><img src="${LOGO}" alt="">topographic <span style="font:500 22px Inter;color:#8b8a86;margin-left:4px">docs</span></div>
          <h1 style="left:64px;top:156px;font-size:56px">Start with a real place.</h1>
          <pre style="left:64px;top:262px;width:480px"><b>$</b> npm i topographic

&lt;Topography
  location=<i>"grand-canyon"</i>
  lines={{ count: <i>48</i> }}
/&gt;</pre>
        </div>`);
        const t = placeTerrain(stage.querySelector('#sc-b'), 'grand-canyon', { ...PLACE_LOOK, lines: { count: 48, opacity: 1 } });
        saver(stage, t, [600, 0, 600, H], 'og-docs.png', (ctx, logo) => {
          ctx.fillStyle = '#0b0b0d'; ctx.fillRect(0, 0, 600, H);
          mark(ctx, logo, 64, 56);
          font(ctx, '600 30px Literata', '#ecebe8');
          const mw = ctx.measureText('topographic').width;
          font(ctx, '500 22px Inter', '#8b8a86'); ctx.fillText('docs', 64 + 56 + 14 + mw + 18, 74);
          font(ctx, '600 56px Literata', '#ecebe8'); ctx.fillText('Start with a real place.', 64, 162);
          ctx.fillStyle = '#17171b'; ctx.beginPath(); ctx.roundRect(64, 262, 480, 234, 16); ctx.fill();
          const lines = [[['$ ', '#8b8a86'], ['npm i topographic', '#cfcdc7']], [], [['<Topography', '#cfcdc7']],
            [['  location=', '#cfcdc7'], ['"grand-canyon"', '#a9c7e4']], [['  lines={{ count: ', '#cfcdc7'], ['48', '#a9c7e4'], [' }}', '#cfcdc7']], [['/>', '#cfcdc7']]];
          lines.forEach((parts, i) => {
            let x = 88;
            for (const [txt, c] of parts) { font(ctx, '400 20px JetBrains Mono', c); ctx.fillText(txt, x, 284 + i * 32); x += ctx.measureText(txt).width; }
          });
        });
      },
    },
    {
      key: 'C',
      name: 'Centred wordmark over Yosemite in 2D, its settings as chips',
      note: 'Round 2. Brand-first and quiet: Yosemite Valley as a flat contour map, full bleed, the wordmark and the line in the centre, and the three settings that draw it as chips instead of use keywords. Works for both URLs with only the line changed.',
      render(stage) {
        const chips = [['location', "'yosemite'"], ['mode', "'2d'"], ['lines', '{ count: 40 }']];
        stage.append(h`<style>${css}</style><div class="sc">
          <div class="live" id="sc-c" style="inset:0"></div>
          <div style="position:absolute;inset:0;background:radial-gradient(ellipse 52% 46% at 50% 50%,rgba(11,11,13,.94),rgba(11,11,13,0))"></div>
          <div class="mark" style="left:0;right:0;top:196px;justify-content:center;font-size:64px"><img src="${LOGO}" alt="" style="width:88px;height:88px">topographic</div>
          <div class="line" style="left:0;right:0;top:320px;text-align:center;color:#ecebe8">${COPY.the.head}</div>
          <div class="chips" style="left:0;right:0;top:384px;justify-content:center">${chips.map(([k, v]) => `<span>${k}: <i>${v}</i></span>`).join('')}</div>
        </div>`);
        const t = placeTerrain(stage.querySelector('#sc-c'), 'yosemite', { ...PLACE_LOOK, mode: '2d', lines: { count: 40, opacity: 1 }, camera: { motion: 'still' } });
        saver(stage, t, [0, 0, W, H], 'og-brand.png', (ctx, logo) => {
          const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.52);
          g.addColorStop(0, 'rgba(11,11,13,.94)'); g.addColorStop(1, 'rgba(11,11,13,0)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          font(ctx, '600 64px Literata', '#ecebe8');
          const tw = ctx.measureText('topographic').width;
          mark(ctx, logo, (W - (88 + 14 + tw)) / 2, 196, 88, 64);
          font(ctx, '500 24px Inter', '#ecebe8'); ctx.textAlign = 'center'; ctx.fillText(COPY.the.head, W / 2, 323); ctx.textAlign = 'left';
          font(ctx, '500 18px JetBrains Mono', '#ecebe8');
          const ws = chips.map(([k, v]) => ctx.measureText(`${k}: ${v}`).width + 36);
          let cx = (W - ws.reduce((a, b) => a + b, 0) - 24) / 2;
          chips.forEach(([k, v], i) => {
            ctx.fillStyle = 'rgba(11,11,13,.7)'; ctx.beginPath(); ctx.roundRect(cx, 384, ws[i], 42, 21); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.stroke();
            font(ctx, '500 18px JetBrains Mono', '#ecebe8'); ctx.fillText(`${k}: `, cx + 18, 396);
            font(ctx, '500 18px JetBrains Mono', '#8fd6a5'); ctx.fillText(v, cx + 18 + ctx.measureText(`${k}: `).width, 396);
            cx += ws[i] + 12;
          });
        });
      },
    },
  ],
};
