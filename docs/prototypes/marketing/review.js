// PROTOTYPE review hub content: everything waiting for the maintainer's review, in one place.
// The index page renders it above the board list. Update it whenever a review item lands.

export const ROUND = 'Round 3 · 2026-10-19';

export const START = [
  'One item is still to review: <code>playground-install/A4</code>, the Install popover built from your notes on A1–A3 (preview and chips labelled "Istanbul · 3D", Agent skill and npm package parts, the scene\'s code and link as a shortcut to Export, one bright Copy per part). "Decisions and reviews" opens on it.',
  'Rebuilt from your decisions: <code>npm-page/F</code> (a moving Grand Canyon hero, then 2D, 3D, beige paper with dark navy lines and more lines, for a real place and a generated shape, code beside each result; quiet black and white labels in Inter), <code>social-card/A</code> (no action button, no URL; Save PNG sits above the frame as a prototype tool) and <code>github-repo/A2</code> (Yosemite, no URL in the image).',
  'No baked image carries <code>topographic.yahyapak.dev</code> any more: social cards, the GitHub social preview, the README hero and the npm pictures. Links in page text stay.',
  'The README, npm, GitHub and social card boards read the line, the headline and the two opening paragraphs from the writing desk, so every surface stays in sync with it. Everything not picked is archived; "Show archived" brings it back. Items 1–5 and 7–11 are decided; the pull requests, 12–15, wait for one review together after your own step.',
];

/** Places to review outside the boards. Each: { title, kind, href, note }. */
export const PLACES = [
  { title: 'Decisions and reviews', kind: 'Start here', href: 'decisions.html', note: 'The 15 items from the round 3 list: what is still to review first, then the pull requests for later, then every decision in your words.' },
  { title: 'Writing desk', kind: 'Edit here', href: 'writing.html', note: 'Every public line in one place: write your idea and each line, see it live on the README, a social card, GitHub, npm and a search result. Saves as you type.' },
  { title: 'Docs page A, reference essay', kind: 'Full page', href: 'docs/a.html', note: 'The anatomy layout in dark: sticky nav, one column, margin notes and controls, live figures.' },
  { title: 'Docs page B, live split', kind: 'Full page', href: 'docs/b.html', note: 'One sticky live terrain that changes as each section scrolls in.' },
  { title: 'Docs page C, developer reference', kind: 'Full page', href: 'docs/c.html', note: 'Three columns: filterable nav, prose and tables, sticky code with JS / React / HTML.' },
  { title: '0.6.0 plan', kind: 'Plan', href: 'https://github.com/yahyabedirhan/topographic/blob/prototype/marketing/docs/prototypes/marketing/PLAN.md', note: 'The costly-to-undo changes as one plan: names, locations in the library, looks, heightmap export, the copy. Trade-offs and picks.' },
  { title: 'Feedback log', kind: 'File', href: 'https://github.com/yahyabedirhan/topographic/blob/prototype/marketing/docs/prototypes/marketing/FEEDBACK.md', note: 'What was shown in each round and what you chose.' },
  { title: 'Launch framework (MARK-1)', kind: 'Notion', href: 'https://app.notion.com/p/3fe271c227d4813e86b3e8ff63a002a5', note: 'The repeatable method: eight phases, surface checklist by product kind, messaging kit, prototyping, the topographic case study.' },
  { title: 'topographic launch (MARK-2)', kind: 'Notion', href: 'https://app.notion.com/p/3fe271c227d481a598e9ecea192cd971', note: 'The checklist for this launch. Tick an item only when its proof is live.' },
];

/** Pull requests opened for this launch. Filled in as they open. */
export const PULLS = [
  { title: 'Issues #78–#82', href: 'https://github.com/yahyabedirhan/topographic/issues?q=is%3Aissue+78..82', note: 'Next-release work behind the launch copy: heightmap export, glTF mesh, 2D and longer video, locations in the library, the look setting.', state: 'Open issues' },
  { title: 'topographic #77', href: 'https://github.com/yahyabedirhan/topographic/pull/77', note: 'Renames the public API: createTopography, Topography, useTopography, &lt;topographic-view&gt;, shape. The Tune popover section Shape becomes Form. Old ?s= links and saved terrains keep working. Typecheck, tests and build pass; two saved-camera smoke checks fail before and after the rename.', state: 'Draft, names and clean break decided' },
  { title: 'topographic #83', href: 'https://github.com/yahyabedirhan/topographic/pull/83', note: 'The topographic agent skill, stacked on #77. Fresh agents installed and used it in plain Vite, Vite + React and Next.js; all three pass after one wording fix about sizing. Moves onto main when #77 merges.', state: 'Open, stacked on #77' },
  { title: 'topographic #84', href: 'https://github.com/yahyabedirhan/topographic/pull/84', note: 'Cyprus uses the shared place camera, colours and lines in the playground, with a new README screenshot. Typecheck, tests, build and smoke pass.', state: 'Open, ready to merge' },
  { title: 'personal-website #26', href: 'https://github.com/yahyabedirhan/personal-website/pull/26', note: 'Points the 8 old github.io playground links on the topographic page at topographic.yahyapak.dev. No copy changes.', state: 'Open, ready to merge' },
];

/** Decisions waiting for the maintainer, with the default agents used. */
export const DECISIONS = [
  { id: 'D6', q: 'Launch videos and the new framing', def: 'Replace the end-card line and install line in all six, after 0.6.0', options: 'End cards only · Re-cut copy-heavy ones · Leave', after: true },
];
