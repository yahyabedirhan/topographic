// PROTOTYPE decisions and reviews waiting for the maintainer, each tied to the board variants it is about.
// An option with `board` and `variant` renders that variant live; an option without one is shown as text.
// Answer in chat or in the session pane as "<id>: <option>", such as "R4: A2".

export const WAITING = [
  {
    id: 'R1', kind: 'Review', title: 'The line',
    question: 'Which wording becomes the one line on every surface?',
    context: [
      'The line goes under the name in the README, into the GitHub About box, the npm descriptions, yahyapak.dev, the social cards and the docs opening.',
      'Your starting sentence: "Topographic terrain rendered with WebGL. Generate a land or turn a real place into a topographic terrain."',
      'You asked to take the writing deliberately, so it lives on the writing desk, where you edit every line and see it in place.',
    ],
    recommend: 'Write your idea in the "Your idea" field on the writing desk; we refine one line at a time from there.',
    link: { href: 'writing.html', label: 'Open the writing desk' },
    options: [],
  },
  {
    id: 'R2', kind: 'Review', title: 'Docs page, round 2',
    question: 'Does variant A, rebuilt with your five changes, ship as /docs?',
    context: [
      'Your changes: the playground wordmark font; Playground, GitHub, npm and yahyapak.dev as icon links top left; the section illustrations kept; the playground\'s Tune inputs driving the figure and rewriting the code block; real places as a first-class section.',
      'Open it full size to scroll and play with the inputs.',
    ],
    recommend: 'Ship A at /docs. The existing /docs/*.md files for agents stay where they are.',
    link: { href: 'docs/a.html', label: 'Open docs page A full size' },
    options: [{ label: 'A, round 2', board: 'docs-page', variant: 'A' }],
  },
  {
    id: 'R3', kind: 'Decision', title: 'Where the Docs link sits',
    question: 'Which placement of the Docs link in the playground\'s top-left row?',
    context: ['Both show the real wordmark row over the playground. Placement 1 keeps the quiet 11 px style after About; placement 2 puts Docs first, in the text colour.'],
    recommend: 'Placement 1, "About · Docs": the row stays calm, and the docs page itself carries the weight.',
    options: [{ label: 'Both placements', board: 'docs-page', variant: 'D' }],
  },
  {
    id: 'R4', kind: 'Review', title: 'README header and GitHub repo',
    question: 'Do the README first screen and the repo\'s About and social image ship as shown, and with which real place?',
    context: [
      'README: variant A with the install line below a moving real-terrain hero.',
      'GitHub: variant A with your topics, the new line, and a real terrain in the social image. GitHub only accepts a still image there, so the motion lives in the README hero.',
      'You upload the social image yourself in the repo settings; GitHub has no API for it.',
    ],
    recommend: 'README A with an Everest orbit as the hero; GitHub A with the Grand Canyon as the social image.',
    options: [
      { label: 'README A', board: 'readme-header', variant: 'A' },
      { label: 'GitHub A', board: 'github-repo', variant: 'A' },
      { label: 'GitHub A2', board: 'github-repo', variant: 'A2' },
    ],
  },
  {
    id: 'R5', kind: 'Decision', title: 'npm pages',
    question: 'Which new npm page layout ships for both packages?',
    context: [
      'All three start from A: a moving real-terrain hero, real places first, then generated shapes, then 2D and 3D, with each snippet beside the result it gives. Secondary views are stills.',
      'npm pages only change when 0.6.0 is published, and their images are hosted at topographic.yahyapak.dev/readme/.',
    ],
    recommend: 'Pick after comparing; A is the round-1 baseline for reference.',
    options: [
      { label: 'D', board: 'npm-page', variant: 'D' },
      { label: 'E', board: 'npm-page', variant: 'E' },
      { label: 'F', board: 'npm-page', variant: 'F' },
      { label: 'A (round 1 baseline)', board: 'npm-page', variant: 'A' },
    ],
  },
  {
    id: 'R6', kind: 'Decision', title: 'Playground install entry',
    question: 'Which version of the Install popover ships?',
    context: [
      'All three put the Install button in the top-right corner at the size of the other buttons, and follow the Export popover: a visual preview, then "With an agent" (npx skills add yahyabedirhan/topographic) and "By hand" (npm install), with no tabs.',
    ],
    recommend: 'Pick after comparing.',
    options: [
      { label: 'A1', board: 'playground-install', variant: 'A1' },
      { label: 'A2', board: 'playground-install', variant: 'A2' },
      { label: 'A3', board: 'playground-install', variant: 'A3' },
    ],
  },
  {
    id: 'R7', kind: 'Review', title: 'yahyapak.dev project page',
    question: 'Does variant A with icons on the Playground, Docs and npm links ship?',
    context: ['It ships in the same personal-website pull request as #26, which already fixes the 8 old playground links.'],
    recommend: 'Ship it.',
    options: [{ label: 'A with icons', board: 'site-page', variant: 'A' }],
  },
  {
    id: 'R8', kind: 'Decision', title: 'Social cards',
    question: 'Which layout becomes the playground\'s card, and which the docs page\'s card?',
    context: ['All three now use real terrains, the new copy, and code beside the result it gives. Each card has Save PNG.'],
    recommend: 'The code-and-result layout for /docs; the full-bleed real terrain for the playground.',
    options: [
      { label: 'A', board: 'social-card', variant: 'A' },
      { label: 'B', board: 'social-card', variant: 'B' },
      { label: 'C', board: 'social-card', variant: 'C' },
    ],
  },
  {
    id: 'D9', kind: 'Decision', title: 'Locations in 0.6.0',
    question: 'Does #81 (locations in the library) ship inside 0.6.0?',
    context: [
      'Marketing may lead the product, but code examples must run: the README, npm, docs and social cards show location="everest".',
      'Without #81 in 0.6.0, a reader who copies that code gets an error on day one.',
    ],
    recommend: 'A: put #81 in 0.6.0. Games stay copy only, with no code shown, so #78 can wait.',
    options: [
      { label: 'A: #81 in 0.6.0', text: 'Real places are the lead feature everywhere, and their code works the day it ships.' },
      { label: 'B: rename only', text: 'Snippets show only shape. Real places appear as pictures and words, with no location code until #81 ships.' },
    ],
  },
  {
    id: 'D8', kind: 'Decision', title: 'The topographic-marketing repository',
    question: 'Should the new repository be private or public on GitHub?',
    context: ['At the end of this session the whole prototype branch, with its history, every board (picked and archived), the feedback log, the plan and the writing drafts, moves to ~/Developer/yahyabedirhan/topographic-marketing.'],
    recommend: 'Private.',
    options: [
      { label: 'Private', text: 'Only you can see it. Mock pages of npm and GitHub stay out of public view.' },
      { label: 'Public', text: 'Anyone can browse the prototypes and the process.' },
      { label: 'Local only', text: 'A git repository on your Mac with no GitHub remote.' },
    ],
  },
];
