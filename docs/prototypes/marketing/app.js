// PROTOTYPE shell: one board at a time, one variant at a time, switchable from the bottom bar.
// URL: ?board=<id>&variant=<key>, or &view=grid to see every variant of a board side by side.
// Each variant has an id such as positioning/B, for feedback in chat.
import { destroyLive } from './live.js';
import { ROUND, START, PLACES, PULLS, DECISIONS } from './review.js';
// Every file in boards/ is a board. ORDER puts the important ones first; the rest follow by name.
const ORDER = ['api-naming', 'docs-page', 'readme-header', 'github-repo', 'playground-install', 'npm-page', 'site-page', 'social-card', 'positioning'];
const modules = import.meta.glob('./boards/*.js', { eager: true });
export const BOARDS = Object.values(modules).map((m) => m.default)
  .sort((a, b) => ((ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99)) || a.id.localeCompare(b.id));

const app = document.getElementById('app');
const params = () => new URLSearchParams(location.search);
// Archived variants and boards were not picked in a review round. They stay in the code and come back with
// ?archived=1, which the "Show archived" toggle on each page sets.
const showArchived = () => params().get('archived') === '1';
/** The variants a board shows: archived ones only when asked, or when one is opened directly. */
const shown = (board, keep) => board.variants.filter((v) => !v.archived || showArchived() || v === keep);
const archivedCount = (board) => board.variants.filter((v) => v.archived).length;
const toggle = () => `<label class="mb-arch"><input type="checkbox" data-a="arch"${showArchived() ? ' checked' : ''}> Show archived</label>`;
const wireToggle = (root) => {
  const box = root.querySelector('[data-a=arch]');
  if (box) box.onchange = () => go({ archived: box.checked ? '1' : null });
};

function go(next, replace = false) {
  const p = params();
  for (const [k, v] of Object.entries(next)) v == null ? p.delete(k) : p.set(k, v);
  history[replace ? 'replaceState' : 'pushState'](null, '', `?${p}`);
  render();
}

function current() {
  const p = params();
  const board = BOARDS.find((b) => b.id === p.get('board'));
  if (!board) return { board: null };
  const variant = board.variants.find((v) => v.key === p.get('variant')) ?? shown(board)[0] ?? board.variants[0];
  return { board, variant, grid: p.get('view') === 'grid' };
}

function render() {
  destroyLive();
  app.replaceChildren();
  const { board, variant, grid } = current();
  if (!board) return renderIndex();
  document.title = `${board.title} · marketing board`;
  const head = document.createElement('header');
  head.className = 'mb-head';
  head.innerHTML = `<a href="?" class="mb-back">All boards</a>
    <h1>${board.title}</h1>
    <p class="mb-q">${board.question}</p>
    <p class="mb-surface">Goes on: ${board.surface}</p>
    ${board.archived ? '<p class="mb-surface"><b>Archived board.</b> Not picked in review; kept for reference.</p>' : ''}
    ${archivedCount(board) ? `<p class="mb-surface">${shown(board).length} shown · ${archivedCount(board)} archived ${toggle()}</p>` : ''}`;
  app.append(head);
  wireToggle(head);
  if (grid) {
    const wrap = document.createElement('section');
    wrap.className = 'mb-grid';
    for (const v of shown(board)) wrap.append(card(board, v, true));
    app.append(wrap);
  } else {
    app.append(card(board, variant, false));
  }
  app.append(bar(board, variant, grid));
}

function card(board, v, small) {
  const el = document.createElement('article');
  el.className = `mb-card${small ? ' small' : ''}`;
  el.innerHTML = `<div class="mb-cap"><span class="mb-id">${board.id}/${v.key}</span><h2>${v.name}</h2>${v.archived ? '<span class="mb-tag">Archived</span>' : ''}
    ${small ? `<a href="?board=${board.id}&variant=${v.key}">Open</a>` : ''}</div>
    <p class="mb-note">${v.note ?? ''}</p>`;
  const frame = document.createElement('div');
  frame.className = 'mb-frame';
  const [w, hgt] = board.size ?? [1440, 900];
  const stage = document.createElement('div');
  stage.className = 'mb-stage';
  stage.style.width = `${w}px`;
  stage.style.height = `${hgt}px`;
  frame.append(stage);
  el.append(frame);
  // Scale the fixed-size stage to the card width, so every variant is judged at its real size.
  const fit = () => {
    const s = frame.clientWidth / w;
    stage.style.transform = `scale(${s})`;
    frame.style.height = `${hgt * s}px`;
  };
  new ResizeObserver(fit).observe(frame);
  queueMicrotask(() => v.render(stage));
  return el;
}

function bar(board, v, grid) {
  const keys = shown(board, v).map((x) => x.key);
  const i = keys.indexOf(v.key);
  const step = (d) => go({ variant: keys[(i + d + keys.length) % keys.length], view: null });
  const el = document.createElement('nav');
  el.className = 'mb-bar';
  el.innerHTML = `
    <select aria-label="Board">${BOARDS.filter((b) => !b.archived || b === board || showArchived()).map((b) => `<option value="${b.id}"${b === board ? ' selected' : ''}>${b.title}</option>`).join('')}</select>
    <button data-a="prev" aria-label="Previous variant">‹</button>
    <span class="mb-label">${grid ? 'All variants' : `${v.key} · ${v.name}`}</span>
    <button data-a="next" aria-label="Next variant">›</button>
    <button data-a="grid">${grid ? 'One' : 'Grid'}</button>
    <button data-a="copy" title="Copy the variant id for feedback">Copy id</button>`;
  el.querySelector('select').onchange = (e) => go({ board: e.target.value, variant: null, view: null });
  el.querySelector('[data-a=prev]').onclick = () => step(-1);
  el.querySelector('[data-a=next]').onclick = () => step(1);
  el.querySelector('[data-a=grid]').onclick = () => go({ view: grid ? null : 'grid' });
  el.querySelector('[data-a=copy]').onclick = async (e) => {
    await navigator.clipboard.writeText(`${board.id}/${v.key}`);
    e.target.textContent = 'Copied';
  };
  return el;
}

function renderIndex() {
  document.title = 'topographic launch review';
  const el = document.createElement('section');
  el.className = 'mb-index';
  const arch = showArchived() ? '&archived=1' : '';
  const boardRow = (b) => {
    const n = shown(b).length;
    const a = archivedCount(b);
    return row(`?board=${b.id}&view=grid${arch}`, b.title, b.question, `${n} variant${n === 1 ? '' : 's'}${a ? ` · ${a} archived` : ''} · ${b.surface}`);
  };
  const archivedBoards = BOARDS.filter((b) => b.archived);
  const row = (href, title, mid, end, ext) =>
    `<li><a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}><b>${title}</b><span>${mid}</span><em>${end}</em></a></li>`;
  el.innerHTML = `<p class="mb-small">${ROUND}</p>
    <h1>topographic launch review</h1>
    <ul class="mb-start">${START.map((s) => `<li>${s}</li>`).join('')}</ul>
    <h2>Prototype boards</h2>
    <p class="mb-small">${toggle()}</p>
    <ol>${BOARDS.filter((b) => !b.archived).map(boardRow).join('')}</ol>
    ${archivedBoards.length ? `<details class="mb-archived"${showArchived() ? ' open' : ''}><summary>Archived (${archivedBoards.length})</summary><ol>${archivedBoards.map(boardRow).join('')}</ol></details>` : ''}
    <h2>Decisions waiting for you</h2>
    <ol class="mb-dec">${DECISIONS.map((d) => `<li><b>${d.id}</b><span>${d.q}<br><small>Options: ${d.options}${d.board ? ` · see the <a href="?board=${d.board}&view=grid">${d.board}</a> board` : ''}</small></span><em>Default: ${d.def}${d.after ? ' · after the launch' : ''}</em></li>`).join('')}</ol>
    <h2>Pull requests</h2>
    ${PULLS.length ? `<ol>${PULLS.map((p) => row(p.href, p.title, p.note, p.state, true)).join('')}</ol>` : '<p class="mb-small">None yet.</p>'}
    <h2>Notion and other places</h2>
    <ol>${PLACES.map((p) => row(p.href, p.title, p.note, p.kind, true)).join('')}</ol>
    <p class="mb-small">Keys on a board: ← → switch variants, G toggles the grid. Each variant's id is in its caption and on the Copy id button.</p>`;
  app.append(el);
  wireToggle(el);
}

addEventListener('popstate', render);
addEventListener('keydown', (e) => {
  if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
  const { board, variant, grid } = current();
  if (!board) return;
  const keys = shown(board, variant).map((x) => x.key);
  const i = keys.indexOf(variant.key);
  if (e.key === 'ArrowRight') go({ variant: keys[(i + 1) % keys.length], view: null });
  if (e.key === 'ArrowLeft') go({ variant: keys[(i - 1 + keys.length) % keys.length], view: null });
  if (e.key === 'g') go({ view: grid ? null : 'grid' });
});
render();
