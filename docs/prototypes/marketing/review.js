// PROTOTYPE review hub content: everything waiting for the maintainer's review, in one place.
// The index page renders it above the board list. Update it whenever a review item lands.

export const ROUND = 'Round 2 · 2026-10-19';

export const START = [
  'Start with the boards you picked in round 1, rebuilt from your feedback: real places lead (Everest, the Grand Canyon, Yosemite Valley, drawn live from real elevation), then generated shapes, then 2D and 3D. Primary views move; secondary views are stills.',
  'New variants to judge: <code>playground-install/A1</code>–<code>A3</code> (Install alone in the top-right corner, an Export-style popover with a live preview, "With an agent" and "By hand"), and <code>npm-page/D</code>–<code>F</code> (code beside its result, pair after pair, for both packages).',
  'Updated in place: <code>readme-header/A</code> (install below the image), <code>github-repo/A</code> and <code>A2</code> (real-place social previews), <code>site-page/A</code> (link icons), and all three <code>social-card</code> layouts (code with the result its parameters give).',
  'Variants you did not pick are archived, and so is the positioning board. "Show archived" brings them back. Every board uses line L1 from <code>kit.js</code> COPY.lines until you pick one on the writing page. Code names follow your decisions: <code>shape</code> and <code>&lt;topographic-view&gt;</code>.',
];

/** Places to review outside the boards. Each: { title, kind, href, note }. */
export const PLACES = [
  { title: 'Decisions and reviews', kind: 'Start here', href: 'decisions.html', note: 'Everything waiting for you, each with its context, a recommendation and the variants it is about, switchable live.' },
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
