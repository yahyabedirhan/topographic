// PROTOTYPE review hub content: everything waiting for the maintainer's review, in one place.
// The index page renders it above the board list. Update it whenever a review item lands.

export const ROUND = 'Round 1 · 2026-10-19';

export const START = [
  'New: agent-first install variants E, F and G on the playground-install board, and the topographic skill in #77.',
  'Start with the boards. Each variant has an id such as <code>positioning/B</code>. Give feedback by id, and mix freely.',
  'Then read the decisions: each one has the default agents used while you were away.',
  'Pull requests are drafts or open, none merged. The Notion pages are the reusable framework and this launch\'s checklist.',
];

/** Places to review outside the boards. Each: { title, kind, href, note }. */
export const PLACES = [
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
  { title: 'topographic #77', href: 'https://github.com/yahyabedirhan/topographic/pull/77', note: 'Renames the public API: createTopography, Topography, useTopography, &lt;topographic-view&gt;, shape. Old ?s= links and saved terrains keep working. Tests, typecheck, build and smoke pass.', state: 'Draft, uses D1–D3 defaults' },
  { title: 'topographic skill (in #77)', href: 'https://github.com/yahyabedirhan/topographic/tree/effort/topography-api/skills/topographic', note: 'A short entry point for agents: an install check, one example and a map of guide sections. references/install.md loads only for the first install. Install with npx skills add yahyabedirhan/topographic.', state: 'Draft, on the #77 branch' },
  { title: 'personal-website #26', href: 'https://github.com/yahyabedirhan/personal-website/pull/26', note: 'Points the 8 old github.io playground links on the topographic page at topographic.yahyapak.dev. No copy changes.', state: 'Open, ready to merge' },
];

/** Decisions waiting for the maintainer, with the default agents used. */
export const DECISIONS = [
  { id: 'D3', q: 'Old names in 0.6.0', def: 'Clean break with a migration table', options: 'Clean break · Aliases for one release' },
  { id: 'D4', q: 'How real locations ship in the library', def: 'Ten built-in locations in topographic/locations, plus fetchLocation() for any area', options: 'Built-in plus live · Built-in only · Live only' },
  { id: 'D5', q: 'Named looks as a library setting', def: 'Yes: one look setting, merging core presets and playground looks', options: 'Yes · Playground only' },
  { id: 'D6', q: 'Launch videos and the new framing', def: 'Replace the end-card line and install line in all six, after 0.6.0', options: 'End cards only · Re-cut copy-heavy ones · Leave', after: true },
  { id: 'D7', q: 'The games claim has no product behind it', def: 'Add getHeightfield() and 16-bit PNG heightmap export, and longer 2D and 3D video, before claiming games', options: 'Heightmap export · Heightmap and mesh · Claim web and video only' },
];
