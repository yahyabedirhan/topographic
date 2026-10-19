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
  if (section.contact) out.push(contactLinks());
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

/** The maintainer's links, the same four as the playground's About page (apps/playground/src/About.tsx). */
const CONTACT = [
  { label: 'X', href: 'https://x.com/yahyabedirhan', path: 'M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.3 4.7H5.5l11.2 14.5Z' },
  { label: 'GitHub', href: 'https://github.com/yahyabedirhan', path: 'M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/yahyabedirhanpak', path: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5Z' },
];
export const contactLinks = () => `<nav class="contact" aria-label="Yahya Bedirhan Pak elsewhere">${CONTACT.map((c) =>
  `<a href="${c.href}" target="_blank" rel="noopener noreferrer" aria-label="${c.label}" title="${c.label}"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="${c.path}"/></svg></a>`).join('')}
  <a href="mailto:y.bedirhanpak@gmail.com" aria-label="Email" title="Email"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg></a></nav>`;
