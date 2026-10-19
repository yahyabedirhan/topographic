// PROTOTYPE parts the variants share: tables, lists and the body of a section with its notes.
import {
  BADGE, CODE, paramRows, VIEW_ROWS, CAMERA_ROWS, TOP_ROWS, THEME_ROWS, TIERS, MEMBERS, SNAPSHOT_OPTIONS, RECORD_OPTIONS,
  WEBMCP_TOOLS, FALLBACKS, LIMITS, QUESTIONS, MOTIONS, codeBlock, codeTabs, volcano,
} from './docs-content.js';

const c = (s) => `<code>${s}</code>`;

/** A settings table. `prop` adds the React prop column for dense layouts. */
export function settingsTable(rows, { attr = true, what = true } = {}) {
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Setting</th>${attr ? '<th>Attribute</th>' : ''}<th>Range</th><th>Default</th>${what ? '<th>What it does</th>' : ''}</tr></thead><tbody>
  ${rows.map((r) => `<tr><td>${c(r.key)}${r.badge ? BADGE : ''}</td>${attr ? `<td>${c(r.attr)}</td>` : ''}<td class="num">${r.range}</td><td class="num">${c(r.def)}</td>${what ? `<td>${r.what}</td>` : ''}</tr>`).join('')}
  </tbody></table></div>`;
}

export function rowsFor(section) {
  if (section.params) return paramRows(section.params);
  if (section.rows === 'theme') return THEME_ROWS;
  if (section.rows === 'view') return VIEW_ROWS;
  if (section.rows === 'camera') return CAMERA_ROWS;
  return null;
}

export const ALL_ROWS = () => [
  ...TOP_ROWS, ...paramRows('lines'), ...paramRows('terrain'), ...paramRows('motion'), ...paramRows('layout'),
  ...THEME_ROWS, ...VIEW_ROWS, ...CAMERA_ROWS,
];

export const tiersTable = () => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tier</th><th>Pixel ratio</th><th>Most pixels</th><th>Mesh</th></tr></thead><tbody>
  ${TIERS.map((t) => `<tr><td>${c(t.id)}</td><td class="num">${t.dpr}</td><td class="num">${t.px}</td><td class="num">${t.mesh}</td></tr>`).join('')}</tbody></table></div>`;

export const fallbackTable = () => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Situation</th><th>What you see</th><th>status</th></tr></thead><tbody>
  ${FALLBACKS.map(([a, b, s]) => `<tr><td>${a}</td><td>${b}</td><td>${c(s)}</td></tr>`).join('')}</tbody></table></div>`;

export const membersTable = () => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Member</th><th>What it does</th></tr></thead><tbody>
  ${MEMBERS.map(([m, w]) => `<tr><td>${c(m)}</td><td>${w}</td></tr>`).join('')}</tbody></table></div>`;

export const snapshotTable = () => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>snapshot option</th><th>What it does</th><th>Default</th></tr></thead><tbody>
  ${SNAPSHOT_OPTIONS.map(([k, w, d]) => `<tr><td>${c(k)}</td><td>${w}</td><td>${d}</td></tr>`).join('')}</tbody></table></div>`;

export const recordTable = () => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>record option</th><th>Range</th><th>Default</th></tr></thead><tbody>
  ${RECORD_OPTIONS.map(([k, r, d]) => `<tr><td>${c(k)}</td><td>${r}</td><td>${d}</td></tr>`).join('')}</tbody></table></div>`;

export const toolsTable = () => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th><a href="https://github.com/webmachinelearning/webmcp" target="_blank" rel="noreferrer">WebMCP</a> tool</th><th>What it does</th></tr></thead><tbody>
  ${WEBMCP_TOOLS.map(([k, w]) => `<tr><td>${c(k)}</td><td>${w}</td></tr>`).join('')}</tbody></table></div>`;

export const motionsTable = () => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>camera.motion</th><th>The path</th></tr></thead><tbody>
  ${MOTIONS.map((m) => `<tr><td>${c(`'${m.id}'`)}</td><td>${m.what}</td></tr>`).join('')}</tbody></table></div>`;

export const limitsList = (cls = 'limits') => `<dl class="${cls}">${LIMITS.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>`;
export const questionsList = (cls = 'faq') => `<div class="${cls}">${QUESTIONS.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>`;

/** The tables and lists a section carries, after its prose. */
export function extras(section) {
  const out = [];
  const rows = rowsFor(section);
  if (rows) out.push(settingsTable(rows));
  if (section.id === 'camera') out.push(motionsTable());
  if (section.id === 'export') out.push(snapshotTable(), recordTable());
  if (section.members) out.push(membersTable());
  if (section.tiers) out.push(tiersTable(), fallbackTable());
  if (section.tools) out.push(toolsTable());
  if (section.limits) out.push(limitsList());
  if (section.questions) out.push(questionsList());
  return out.join('');
}

/** A section's code, as one block for single-language snippets and tabs otherwise. */
export function sectionCode(section) {
  const code = CODE[section.code];
  if (!code) return '';
  const keys = Object.keys(code);
  if (keys.length === 1) {
    const [k] = keys;
    const file = { sh: 'terminal', css: 'style.css', react: 'Hero.jsx', html: 'index.html', js: 'main.js' }[k];
    return codeBlock(code[k], { file, lang: k, one: k === 'sh' && !code[k].includes('\n') });
  }
  if (section.id === 'page') return codeBlock(code.css, { file: 'style.css', lang: 'css' }) + codeBlock(code.react, { file: 'Hero.jsx', lang: 'react' });
  return codeTabs(code, { id: section.id });
}

/** Numbers the footnote markers of the sections in order, page-wide, and returns each section's note numbers. */
export function numberNotes(sections) {
  let n = 0;
  return Object.fromEntries(sections.map((s) => [s.id, s.notes.map(() => ++n)]));
}

/** The body with numbered markers. */
export function bodyWithMarkers(section, numbers) {
  let i = 0;
  // The marker stays glued to the word before it, so it never wraps onto a line of its own.
  return section.body.replace(/([^\s<>]*)<sup class="fn"><\/sup>/g, (_, word) => {
    const n = numbers[i++];
    return n ? `<span class="nw">${word}<sup class="fn" id="fnref-${n}"><a href="#fn-${n}">${n}</a></sup></span>` : word;
  });
}

let field;
/** The heightfield a live setting names: 'volcano' for the made-up one. */
export const fieldFor = (name) => (name === 'volcano' ? (field ??= volcano(128)) : null);
