// PROTOTYPE decisions view: pick a decision on the left, switch its options on the right.
// Options tied to a board variant render it live at its real size, scaled to fit, as the boards do.
// URL: decisions.html?d=<id>&o=<option index>. Keys: ← → switch options, ↑ ↓ switch decisions.
import { WAITING } from './decisions-data.js';
import { destroyLive } from './live.js';

const modules = import.meta.glob('./boards/*.js', { eager: true });
const BOARDS = Object.fromEntries(Object.values(modules).map((m) => [m.default.id, m.default]));
const root = document.getElementById('dv');

const get = () => {
  const p = new URLSearchParams(location.search);
  const d = WAITING.find((x) => x.id === p.get('d')) ?? WAITING[0];
  const o = Math.min(Number(p.get('o') ?? 0) || 0, Math.max(0, d.options.length - 1));
  return { d, o };
};
const go = (d, o = 0) => { history.replaceState(null, '', `?d=${d}&o=${o}`); render(); };

function render() {
  destroyLive();
  const { d, o } = get();
  root.innerHTML = `
    <nav class="dv-list"><a href="./" class="mb-back">Review hub</a><h1>Waiting for you</h1>
      ${WAITING.map((x) => `<button data-d="${x.id}" class="${x === d ? 'on' : ''}"><b>${x.id}</b><span>${x.title}</span><small>${x.kind} · ${x.options.length || 'no'} option${x.options.length === 1 ? '' : 's'}</small></button>`).join('')}
    </nav>
    <section class="dv-main">
      <span class="dv-kind">${d.kind} ${d.id}</span><h2>${d.title}</h2>
      <p class="dv-q">${d.question}</p>
      <div class="dv-ctx">${d.context.map((c) => `<p>${c}</p>`).join('')}</div>
      <p class="dv-rec"><b>Recommended</b>${d.recommend}</p>
      ${d.link ? `<a class="dv-link" href="${d.link.href}" target="_blank">${d.link.label} ↗</a>` : ''}
      ${d.options.length ? `<div class="dv-opts">${d.options.map((x, i) => `<button data-o="${i}" class="${i === o ? 'on' : ''}">${x.label}</button>`).join('')}
        <span class="ans">Answer in chat: <code>${d.id}: ${d.options[o].label.split(':')[0]}</code></span></div>` : ''}
      <div id="dv-view"></div>
    </section>`;
  root.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => go(b.dataset.d)));
  root.querySelectorAll('[data-o]').forEach((b) => b.addEventListener('click', () => go(d.id, b.dataset.o)));
  if (d.options.length) show(d.options[o]);
}

function show(opt) {
  const view = document.getElementById('dv-view');
  if (opt.text) { view.innerHTML = `<div class="dv-text">${opt.text}</div>`; return; }
  const board = BOARDS[opt.board];
  const v = board?.variants.find((x) => x.key === opt.variant);
  if (!v) { view.innerHTML = `<div class="dv-missing">${opt.board}/${opt.variant} arrives with round 2.</div>`; return; }
  const [w, h] = board.size ?? [1440, 900];
  view.innerHTML = `<p class="mb-note"><span class="mb-id">${board.id}/${v.key}</span> ${v.name}. ${v.note ?? ''}</p>
    <div class="mb-frame"><div class="mb-stage" style="width:${w}px;height:${h}px"></div></div>`;
  const frame = view.querySelector('.mb-frame');
  const stage = view.querySelector('.mb-stage');
  const fit = () => { const s = frame.clientWidth / w; stage.style.transform = `scale(${s})`; frame.style.height = `${h * s}px`; };
  new ResizeObserver(fit).observe(frame);
  v.render(stage);
}

addEventListener('keydown', (e) => {
  if (e.target.closest?.('input, textarea, select')) return;
  const { d, o } = get();
  const i = WAITING.indexOf(d);
  if (e.key === 'ArrowRight' && d.options.length) go(d.id, (o + 1) % d.options.length);
  if (e.key === 'ArrowLeft' && d.options.length) go(d.id, (o - 1 + d.options.length) % d.options.length);
  if (e.key === 'ArrowDown') go(WAITING[(i + 1) % WAITING.length].id);
  if (e.key === 'ArrowUp') go(WAITING[(i - 1 + WAITING.length) % WAITING.length].id);
});
render();
