// The head of each page: the browser tab, search results and link previews. src/layouts/Base.astro writes it.
import { DOCS_META, LINE, SITE } from './docs-page/copy';

export interface PageMeta {
  title: string;
  description: string;
  /** The canonical address. */
  url: string;
  image: string;
  imageAlt: string;
}

const SHARE = {
  image: `${SITE}og.png`,
  imageAlt: 'Everest and the Khumbu in 3D as pale contour lines, beside the headline and the code that draws it.',
};

export const PAGES = {
  home: { title: 'topographic: topographic terrain, rendered with WebGL', description: LINE, url: SITE, ...SHARE },
  about: {
    title: 'About: topographic',
    description: 'About topographic: the project, its maintainer, the latest updates, and the anonymous stats the playground keeps, with the opt out.',
    url: `${SITE}about`,
    ...SHARE,
  },
  docs: { ...DOCS_META },
} as const satisfies Record<string, PageMeta>;
