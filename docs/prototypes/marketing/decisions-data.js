// PROTOTYPE decisions and reviews, numbered as in the maintainer's round 3 chat list (1–15), each tied to the
// board variants it is about. An option with `board` and `variant` renders that variant live; an option without
// one is shown as text. `state` is 'review' (waiting for the maintainer), 'later' (agreed to review together
// later) or 'decided'; a decided item quotes the decision in the maintainer's words in `decided`.
// Answer in chat or in the session pane as "<id>: <option>", such as "6: A4".

export const WAITING = [
  {
    id: '1', state: 'decided', kind: 'Review', title: 'The line',
    decided: '"Topographic terrain rendered with WebGL. Generate a land or turn a real place into a topographic terrain." I think this is really nice. "Topographic terrain, rendered live with WebGL" is something we can use. No topographic.yahyapak.dev in baked cards.',
    question: 'Which wording becomes the one line on every surface?',
    context: [
      'The line goes under the name in the README, into the GitHub About box, the npm descriptions, yahyapak.dev and the docs opening. The headline goes on the social cards and the GitHub image.',
      'The writing desk owns the text. The README, npm, GitHub and social card boards read it from <code>copy-draft.json</code>, so every surface shows what the desk shows.',
      'Baked images (social cards, the GitHub social preview, README and npm pictures) carry no URL: the address may change.',
    ],
    link: { href: 'writing.html', label: 'Open the writing desk' },
    options: [],
  },
  {
    id: '2', state: 'decided', kind: 'Decision', title: 'Install labels',
    decided: 'Okay the agent skill and npm package is nice wording.',
    question: 'What labels replace "With an agent" and "By hand" in the install parts of the playground and the docs?',
    context: ['Each part holds one command: <code>npx skills add yahyabedirhan/topographic</code> installs the agent skill; <code>npm install topographic</code> installs the package.'],
    options: [{ label: 'Agent skill / npm package', text: 'AGENT SKILL — npx skills add yahyabedirhan/topographic\nNPM PACKAGE — npm install topographic' }],
  },
  {
    id: '3', state: 'decided', kind: 'Review', title: 'README header',
    decided: 'I think this is looking really nice. This is just the README header and on top of it we will have the rest of the README content.',
    question: 'Does the README first screen ship as shown?',
    context: ['README A: the badges, the line and the two opening paragraphs from the writing desk, the link row, a moving real-terrain hero, then install and the first snippet. The rest of today\'s README follows under it.'],
    options: [{ label: 'README A', board: 'readme-header', variant: 'A' }],
  },
  {
    id: '4', state: 'decided', kind: 'Decision', title: 'GitHub social image',
    decided: 'There are two options: one is Everest, the other one is Yosemite. I think I like Yosemite better.',
    question: 'Which real place goes on the GitHub social preview?',
    context: ['GitHub A2: Yosemite Valley full bleed, the headline and the setting that draws it, with no URL in the image. You upload the image yourself in the repo settings; GitHub has no API for it.'],
    options: [{ label: 'GitHub A2', board: 'github-repo', variant: 'A2' }],
  },
  {
    id: '5', state: 'decided', kind: 'Decision', title: 'npm pages',
    decided: 'I think I\'m going to go with variant F. Start with 2D, then 3D, then change its color completely, then the line count; the same for the generated shapes. No red badges, no mono font, and show less content instead of letting it overflow.',
    question: 'Which npm page layout ships for both packages?',
    context: [
      'F, rebuilt from your notes: a moving Grand Canyon hero, then two build-ups with code beside each result. The place goes 2D, 3D, beige paper with dark navy lines, then more lines; the generated shape takes the same steps, then a new seed.',
      'Picture labels are quiet black and white in Inter, and short enough for the smallest picture.',
    ],
    options: [{ label: 'F', board: 'npm-page', variant: 'F' }],
  },
  {
    id: '6', state: 'review', kind: 'Review', title: 'Playground install entry',
    question: 'Does A4, built from your notes on A1–A3, ship as the Install popover?',
    context: [
      'A4 is A1 with the live preview and the parameter chips, labelled "Istanbul · 3D" only (no line count, no "This scene").',
      'The Agent skill and npm package parts each have their command. The npm package part also holds this scene as code and its link, as a shortcut to Export.',
      'Each part has one bright Copy. Every other copy is a quiet icon button, and "Open Export" is a text link.',
    ],
    recommend: 'Ship A4.',
    options: [
      { label: 'A4', board: 'playground-install', variant: 'A4' },
      { label: 'A1 (round 2)', board: 'playground-install', variant: 'A1' },
    ],
  },
  {
    id: '7', state: 'decided', kind: 'Decision', title: 'Docs link in the top-left row',
    decided: 'I think this is all good. This is the header part of things and the rest of the documentation will stay similar to what we have right now.',
    question: 'Which placement of the Docs link in the playground\'s top-left row?',
    context: ['Placement 1, "About · Docs": Docs after About, in the same quiet 11 px style.'],
    options: [{ label: 'About · Docs', board: 'docs-page', variant: 'D' }],
  },
  {
    id: '8', state: 'decided', kind: 'Review', title: 'yahyapak.dev project page',
    decided: 'I said I like this variant and you can go ahead and ship it.',
    question: 'Does variant A with icons on the Playground, Docs and npm links ship?',
    context: ['It ships in the same personal-website pull request as #26, which already fixes the 8 old playground links.'],
    options: [{ label: 'A with icons', board: 'site-page', variant: 'A' }],
  },
  {
    id: '9', state: 'decided', kind: 'Decision', title: 'Social cards',
    decided: 'Okay let\'s use variant A. No need to have that action button and no need to have that Save PNG if it\'s a part of the social card.',
    question: 'Which layout becomes the social card?',
    context: ['A without the action button and without a URL: the whole card is the link. Save PNG now sits above the card frame, as a prototype tool only.'],
    options: [{ label: 'A', board: 'social-card', variant: 'A' }],
  },
  {
    id: '10', state: 'decided', kind: 'Decision', title: 'Locations in 0.6.0',
    decided: '#81 in 0.6.0. We can build it and we can include it in that version.',
    question: 'Does #81 (locations in the library) ship inside 0.6.0?',
    context: ['The README, npm, docs and social cards show <code>location: \'grand-canyon\'</code> and other places, so the code works the day 0.6.0 ships.'],
    options: [],
  },
  {
    id: '11', state: 'decided', kind: 'Decision', title: 'The topographic-marketing repository',
    decided: 'The topographic marketing repository will be private.',
    question: 'Should the new repository be private or public on GitHub?',
    context: ['At the end of this session the prototype branch, with its history, every board, the feedback log, the plan and the writing drafts, moves to <code>~/Developer/yahyabedirhan/topographic-marketing</code>.'],
    options: [],
  },
  ...[
    ['12', 'topographic #77', 'Renames the public API: createTopography, Topography, useTopography, &lt;topographic-view&gt;, shape.', 'https://github.com/yahyabedirhan/topographic/pull/77'],
    ['13', 'topographic #83', 'The topographic agent skill, stacked on #77.', 'https://github.com/yahyabedirhan/topographic/pull/83'],
    ['14', 'topographic #84', 'Cyprus uses the shared place camera, colours and lines in the playground.', 'https://github.com/yahyabedirhan/topographic/pull/84'],
    ['15', 'personal-website #26', 'Points the 8 old github.io playground links at the playground.', 'https://github.com/yahyabedirhan/personal-website/pull/26'],
  ].map(([id, title, what, href]) => ({
    id, state: 'later', kind: 'Pull request', title,
    decided: 'Let\'s ship everything and have a list of pull requests that I will review afterwards, all of them together.',
    question: 'Review together with the other pull requests, after step 1 of the plan: the agent finishes its own remaining work first.',
    context: [what],
    link: { href, label: `Open ${title}` },
    options: [],
  })),
];
