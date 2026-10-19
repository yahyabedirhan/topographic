// PROTOTYPE writing desk: one text field per public line, live previews where each line appears,
// suggestions to start from, and autosave to copy-draft.json through the dev server.
import { COPY } from './kit.js';
import { LOGO, shot } from './live.js';
import { OPENING } from './opening.js';

const START = OPENING.line;
const lines = COPY.lines ?? [];

/** Every public line. limit is the channel's hard or practical limit; aim is where it reads best. */
const SLOTS = [
  { id: 'line', label: 'The line', where: 'README under the name, GitHub About, npm, yahyapak.dev', limit: 160, aim: 110, start: START,
    sugs: lines.map((l) => [l.id, l.line]) },
  { id: 'head', label: 'Headline', where: 'Social cards, the docs page hero', limit: 60, aim: 48, start: OPENING.head,
    sugs: lines.map((l) => [l.id, l.head]) },
  { id: 'sub', label: 'Sub line', where: 'Under the headline', limit: 120, aim: 80, start: OPENING.sub,
    sugs: lines.map((l) => [l.id, l.sub]) },
  { id: 'github', label: 'GitHub description', where: 'Repository About sidebar and GitHub search', limit: 350, aim: 160, start: START },
  { id: 'npmCore', label: 'npm description: topographic', where: 'npm search results and the package page', limit: 250, aim: 180, start: START },
  { id: 'npmReact', label: 'npm description: topographic-react', where: 'npm search results and the package page', limit: 250, aim: 180,
    start: 'React component for topographic. Generate a land or turn a real place into a topographic terrain, rendered with WebGL.' },
  { id: 'title', label: 'Playground page title', where: 'Browser tab and search result title', limit: 60, aim: 50, start: 'topographic: topographic terrain, rendered with WebGL' },
  { id: 'meta', label: 'Playground meta description', where: 'Search result snippet and link previews', limit: 155, aim: 140, start: START },
  { id: 'site', label: 'yahyapak.dev project line', where: 'Home card and the project page', limit: 120, aim: 90, start: START },
  { id: 'open1', label: 'Opening, paragraph 1', where: 'The first paragraph under the line in the README, both npm pages and the docs', limit: 320, aim: 200, start: OPENING.open1 },
  { id: 'open2', label: 'Opening, paragraph 2', where: 'The second paragraph in the same three places', limit: 240, aim: 140, start: OPENING.open2 },
];

const state = { idea: '', ...Object.fromEntries(SLOTS.map((s) => [s.id, s.start])) };
const desk = document.getElementById('desk');
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function render() {
  desk.innerHTML = `
    <header class="wd-head">
      <a href="./" class="mb-back">Review hub</a>
      <h1>Writing desk</h1><span class="wd-status" id="status">Loading…</span>
      <p>Every public line in one place. Write in the fields; the previews on the right show each line where it will appear. Your text saves to <code>copy-draft.json</code> as you type, so the agent reads exactly what you wrote. Suggestions under a field replace its text when clicked.</p>
    </header>
    <section class="wd-slots">
      <div class="wd-slot idea"><div class="wd-top"><b>Your idea</b><span>The direction you want, in your words. Agents read this first.</span></div>
        <textarea data-id="idea" placeholder="Write or paste the idea you want to move forward with…">${esc(state.idea)}</textarea></div>
      ${SLOTS.map((s) => `
        <div class="wd-slot"><div class="wd-top"><b>${s.label}</b><span>${s.where}</span><span class="wd-count" data-count="${s.id}"></span></div>
          <textarea data-id="${s.id}" rows="2">${esc(state[s.id])}</textarea>
          ${s.sugs?.length ? `<div class="wd-sugs">${s.sugs.map(([k, t]) => `<button data-sug="${s.id}" data-text="${esc(t)}"><em>${k}</em>${esc(t)}</button>`).join('')}</div>` : ''}
        </div>`).join('')}
    </section>
    <aside class="wd-prev" id="prev"></aside>`;
  desk.querySelectorAll('textarea').forEach((t) => {
    fit(t);
    t.addEventListener('input', () => { state[t.dataset.id] = t.value; fit(t); update(); save(); });
  });
  desk.querySelectorAll('[data-sug]').forEach((b) => b.addEventListener('click', () => {
    const t = desk.querySelector(`textarea[data-id="${b.dataset.sug}"]`);
    t.value = b.dataset.text; t.dispatchEvent(new Event('input'));
  }));
  update();
}

const fit = (t) => { t.style.height = 'auto'; t.style.height = `${t.scrollHeight + 2}px`; };

function update() {
  for (const s of SLOTS) {
    const n = state[s.id].length;
    const el = desk.querySelector(`[data-count="${s.id}"]`);
    el.textContent = `${n} / ${s.limit}`;
    el.className = `wd-count${n > s.limit ? ' over' : n > s.aim ? ' warn' : ''}`;
  }
  const topics = COPY.topics ?? [];
  const kw = COPY.keywords?.core ?? [];
  document.getElementById('prev').innerHTML = `
    <div><p class="wd-label">README, first screen</p><div class="wd-card rd"><img src="${LOGO}" alt=""><h4>topographic</h4><p>${esc(state.line)}</p><p style="text-align:left;margin-top:14px">${esc(state.open1)}</p><p style="text-align:left;margin-top:8px">${esc(state.open2)}</p></div></div>
    <div><p class="wd-label">Social card</p><div class="wd-card og" style="background-image:url(${shot('place-grand-canyon')})"><div class="in">
      <span class="wm"><img src="${LOGO}" alt="">topographic</span><h3>${esc(state.head)}</h3><p>${esc(state.sub)}</p></div></div></div>
    <div><p class="wd-label">GitHub About</p><div class="wd-card gh"><h4>About</h4><div>${esc(state.github)}</div><div class="site">🔗 topographic.yahyapak.dev</div>
      <div class="topics">${topics.map((t) => `<i>${t}</i>`).join('')}</div></div></div>
    <div><p class="wd-label">npm search</p><div class="wd-card npm"><b>topographic</b><div>${esc(state.npmCore)}</div>
      <div class="kw">${kw.slice(0, 12).map((k) => `<i>${k}</i>`).join('')}</div><div class="meta">yahyabedirhan published 0.6.0</div>
      <hr style="border:0;border-top:1px solid #eee;margin:6px 0"><b>topographic-react</b><div>${esc(state.npmReact)}</div></div></div>
    <div><p class="wd-label">Search result for the playground</p><div class="wd-card serp"><div class="u">topographic.yahyapak.dev</div>
      <div class="t">${esc(state.title)}</div><div>${esc(state.meta)}</div></div></div>`;
}

let timer;
function save() {
  document.getElementById('status').textContent = 'Saving…';
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      await fetch('/__copy-draft', { method: 'POST', body: JSON.stringify(state) });
      document.getElementById('status').textContent = `Saved ${new Date().toLocaleTimeString()}`;
    } catch {
      document.getElementById('status').textContent = 'Not saved: start the board with npm run marketing';
    }
  }, 600);
}

try {
  const saved = await (await fetch('/__copy-draft')).json();
  for (const k of Object.keys(state)) if (typeof saved[k] === 'string') state[k] = saved[k];
  render();
  document.getElementById('status').textContent = saved.savedAt ? `Last saved ${new Date(saved.savedAt).toLocaleString()}` : 'Not saved yet';
} catch {
  render();
  document.getElementById('status').textContent = 'Saving is off: start the board with npm run marketing';
}
