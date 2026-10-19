// PROTOTYPE board: the GitHub About sidebar (description, website, topics) and the 1280x640 social preview.
import { terrain, h, shot, LOOKS, LOGO } from '../live.js';
import { COPY, ICON } from '../kit.js';

const css = `
.gr{position:absolute;inset:0;background:#0d1117;color:#f0f6fc;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;display:grid;grid-template-columns:320px 960px;gap:40px;padding:48px 60px}
.gr .side h2{font-size:16px;font-weight:600;margin:0 0 16px}
.gr .side p{margin:0 0 16px;font-size:16px}
.gr .lnk{display:flex;gap:8px;align-items:center;font-weight:600;margin-bottom:16px;color:#4493f8}
.gr .lnk svg{color:#9198a1}
.gr .topics{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:16px}
.gr .topics span{font-size:12px;font-weight:500;line-height:22px;padding:0 10px;border-radius:99px;background:#388bfd1a;color:#4493f8}
.gr .count{font:12px ui-monospace,Menlo,monospace;color:#9198a1;border-top:1px solid #3d444d;padding-top:12px;display:grid;gap:4px}
.gr .lab{font-size:12px;color:#9198a1;margin-bottom:10px;display:flex;justify-content:space-between}
.gr .og-box{width:960px;height:480px;position:relative;border-radius:8px;overflow:hidden;box-shadow:0 0 0 1px #3d444d}
.gr .og{position:absolute;left:0;top:0;width:1280px;height:640px;transform:scale(${960 / 1280});transform-origin:0 0;background:#0b0b0d;color:#ecebe8;font-family:Inter,sans-serif;overflow:hidden}
.gr .og .live{position:absolute}
.gr .og h1{font:600 76px/1.04 Literata,Georgia,serif;letter-spacing:-.02em;margin:0}
.gr .og .mark{display:flex;gap:16px;align-items:center;font:600 34px Literata,Georgia,serif}
.gr .og .mark img{width:64px;height:64px}
.gr .og .chip{display:inline-flex;gap:12px;padding:14px 20px;border-radius:14px;background:rgba(23,23,27,.85);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);font:500 24px 'JetBrains Mono',monospace}
.gr .og .chip b{color:#8b8a86;font-weight:400}
.gr .og .url{font:500 22px Inter;color:#b9b8b3}
.gr .preview{margin-top:22px;display:flex;gap:16px;align-items:center;width:960px}
.gr .preview .card{width:400px;border-radius:12px;overflow:hidden;background:#151b23;box-shadow:0 0 0 1px #3d444d}
.gr .preview .thumb{height:200px;position:relative;overflow:hidden}
.gr .preview .thumb .og{transform:scale(${400 / 1280})}
.gr .preview .meta{padding:10px 14px;font-size:13px}.gr .preview .meta b{display:block;color:#f0f6fc}.gr .preview .meta span{color:#9198a1}
.gr .preview p{color:#9198a1;font-size:13px;max-width:440px}
`;

/** The About sidebar on the left; the social image on the right, at 1000px and again as a link-unfurl card. */
function compose(stage, desc, og, mount) {
  stage.append(h`<style>${css}</style><div class="gr">
    <aside class="side">
      <h2>About</h2>
      <p>${desc}</p>
      <span class="lnk">${ICON.link} topographic.yahyapak.dev</span>
      <div class="topics">${COPY.topics.map((t) => `<span>${t}</span>`).join('')}</div>
      <div class="count"><span>description: ${desc.length} / 350 characters</span><span>topics: ${COPY.topics.length} / 20</span></div>
    </aside>
    <div>
      <div class="lab"><span>Social preview · 1280×640 · Settings → General → Social preview</span><span>shown at 75%</span></div>
      <div class="og-box"><div class="og" id="og-main">${og}</div></div>
      <div class="preview">
        <div class="card"><div class="thumb"><div class="og">${og.replace(/class="live"[^>]*>/g, (m) => m.replace(/id="[^"]*"/, ''))}</div></div>
          <div class="meta"><b>GitHub - yahyabedirhan/topographic</b><span>${desc.slice(0, 96)}${desc.length > 96 ? '…' : ''}</span></div></div>
        <p>The same image as a link unfurl in Slack, X or iMessage: the type must still read at 400px wide.</p>
      </div>
    </div></div>`);
  const t = mount(stage.querySelector('#og-main'));
  // the unfurl copy shows a still of the live layer, so the board keeps one WebGL context per variant
  const still = stage.querySelector('.thumb .live');
  setTimeout(async () => {
    try { still.style.background = `url(${URL.createObjectURL(await t.snapshot())}) center/cover`; } catch { /* switched away */ }
  }, 3000);
}

export default {
  id: 'github-repo',
  title: 'GitHub repo',
  question: 'What description, topics and social image make the repo read as a terrain library at a glance, in search and in a shared link?',
  surface: 'GitHub About sidebar, GitHub search results, the social preview image used by every link unfurl',
  variants: [
    {
      key: 'A',
      name: 'Category line, full-bleed terrain',
      note: 'Description says the category, the three uses and the zero-dependency fact. The image is one big live 3D terrain with the wordmark and line in the lower left, like a film still. Topics are the same 20 on every variant; "gamedev" waits for D7.',
      render(stage) {
        compose(stage, COPY.ghA, `
          <div class="live" id="gr-a" style="inset:0"></div>
          <div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(11,11,13,.92) 8%,rgba(11,11,13,0) 62%)"></div>
          <div style="position:absolute;left:72px;bottom:64px;display:grid;gap:22px;max-width:900px">
            <div class="mark"><img src="${LOGO}" alt="">topographic</div>
            <h1>${COPY.taglineShort}.</h1>
            <span class="url">For websites, videos and games · github.com/yahyabedirhan/topographic</span>
          </div>`, (el) => terrain(el.querySelector('#gr-a'), LOOKS.terraces3d));
      },
    },
    {
      key: 'B',
      name: 'Uses line, split card with install',
      note: 'Description leads with the three uses and lists the features after. The image is split: type and the install line on a solid panel, live 2D lines on the right. It is the only card that teaches the install command.',
      render(stage) {
        compose(stage, COPY.ghB, `
          <div class="live" id="gr-b" style="inset:0 0 0 46%"></div>
          <div style="position:absolute;inset:0 54% 0 0;padding:72px;display:grid;align-content:space-between;background:#0b0b0d">
            <div class="mark"><img src="${LOGO}" alt="">topographic</div>
            <div style="display:grid;gap:18px">
              <h1 style="font-size:60px">Contour maps and 3D terrain.</h1>
              <div style="display:flex;gap:10px;font:500 22px Inter;color:#b9b8b3">Websites · Videos · Games</div>
            </div>
            <span class="chip"><b>$</b>npm i topographic</span>
          </div>`, (el) => terrain(el.querySelector('#gr-b'), { ...LOOKS.ridge2d, lines: { count: 40, indexEvery: 5, opacity: 0.95 } }));
      },
    },
    {
      key: 'C',
      name: 'Short line, mosaic of four',
      note: 'The shortest description (keywords only, fits GitHub search without cutting). The image is a 2×2 mosaic: live 2D dunes, a 3D look, a real place (Mount Fuji) and a light 2D look, with the wordmark on a centre band. Shows range rather than one picture.',
      render(stage) {
        compose(stage, COPY.ghC, `
          <div style="position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr">
            <div style="position:relative"><div class="live" id="gr-c" style="inset:0"></div></div>
            <img src="${shot('look-night-flower-3d')}" alt="" style="width:100%;height:100%;object-fit:cover">
            <img src="${shot('place-fuji')}" alt="" style="width:100%;height:100%;object-fit:cover">
            <img src="${shot('look-stepped-petals-2d')}" alt="" style="width:100%;height:100%;object-fit:cover">
          </div>
          <div style="position:absolute;left:0;right:0;top:220px;height:200px;background:rgba(11,11,13,.86);backdrop-filter:blur(8px);display:grid;place-items:center;align-content:center;gap:14px">
            <div class="mark" style="font-size:52px"><img src="${LOGO}" alt="" style="width:80px;height:80px">topographic</div>
            <span class="url">2D and 3D topographic terrain · generated or real places</span>
          </div>`, (el) => terrain(el.querySelector('#gr-c'), LOOKS.dunes2d));
      },
    },
  ],
};
