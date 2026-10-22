// The public lines of the docs page, from the writing desk's defaults in the marketing prototypes
// (docs/prototypes/marketing/opening.js and writing.js on the prototype/marketing branch).
// The page and its HTML head both read them here, so a new line from the desk is one edit.

/** The headline, the line under it and the two opening paragraphs that the README, the npm pages and the docs share. */
export const OPENING = {
  head: 'Topographic terrain, rendered live with WebGL.',
  sub: 'Generate a land. Or turn a real place into one.',
  open1: 'topographic draws terrain as contour lines, from real elevation data or from a shape and a seed. The same settings draw the same land on every screen.',
  open2: 'Try any setting below. The terrain and its code change together, ready to copy.',
} as const;

/** The one-line description from the writing desk, for search results and link previews. */
export const LINE = 'Topographic terrain rendered with WebGL. Generate a land or turn a real place into a topographic terrain.';

/** The site's address, with a trailing slash. */
export const SITE = 'https://topographic.yahyapak.dev/';

/** The head of /docs: the browser tab, search results and link previews. */
export const DOCS_META = {
  title: `Docs: ${OPENING.head.replace(/\.$/, '')}`,
  description: LINE,
  url: `${SITE}docs`,
  // TODO: og-docs.png is rendered with the other social cards on feature/launch-surfaces (apps/playground/public/og-docs.png).
  // Until that lands, previews of /docs show no image.
  image: `${SITE}og-docs.png`,
  imageAlt: 'The topographic docs: real places and generated land, drawn as live contour lines.',
} as const;
