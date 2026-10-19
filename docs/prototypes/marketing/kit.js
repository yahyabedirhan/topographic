// PROTOTYPE kit shared by the surface boards: the proposed 0.6.0 snippets, the proposed copy, a tiny
// syntax highlighter, npm-style badges and a copy-to-clipboard wiring. Lives outside boards/ because
// app.js loads every file in boards/ as a board.

/** The first working code, in the proposed 0.6.0 names. Library props only: no className, no CSS sizing. */
export const SNIP = {
  js: `import { createTopography } from 'topographic';

const topography = createTopography(el, { landform: 'long-ridge' });`,
  react: `import { Topography } from 'topographic-react';

<Topography landform="long-ridge" />`,
  html: `<script type="module">import 'topographic/element';</script>

<topographic-map landform="dunes"></topographic-map>`,
  place: `<Topography location="fuji" mode="3d" />`,
  look: `<Topography look="survey-map" />`,
};
export const INSTALL_FOR = {
  js: 'npm install topographic',
  react: 'npm install topographic topographic-react',
  html: 'npm install topographic',
};

/** Proposed copy, kept in one place so every board says the same thing. */
export const COPY = {
  tagline: 'Topographic terrain in 2D and 3D, for websites, videos and games.',
  taglineShort: 'Topographic terrain in 2D and 3D',
  sub: 'Generate land or load a real place. Put it on a website, render it to video, or bring it into your game.',
  // GitHub About descriptions, one per github-repo variant (each ≤ 350 characters)
  ghA: 'Topographic terrain in 2D and 3D, rendered with WebGL. Generate land or load a real place, then put it on a website, render it to video or bring it into a game. No dependencies; works in plain HTML and React.',
  ghB: 'Contour maps and 3D terrain for websites, videos and games. Procedural landforms or real elevation data, drawn with WebGL. Web component, React component, PNG and video export, zero dependencies.',
  ghC: 'WebGL topographic terrain: animated contour lines in 2D and 3D, procedural or from real elevation data.',
  topics: ['topography', 'topographic-map', 'contour-lines', 'terrain', 'terrain-generation', 'procedural-generation',
    'heightmap', 'elevation-data', 'dem', 'cartography', 'webgl', 'webgl2', 'shaders', '3d', 'generative-art',
    'creative-coding', 'animation', 'react', 'web-components', 'gamedev'],
  // npm descriptions: three strategies, one per npm-page variant
  npm: {
    A: {
      core: 'Topographic terrain in 2D and 3D with WebGL: animated contour lines, procedural landforms and real elevation data, for websites, videos and games. No dependencies.',
      react: 'React component for topographic: 2D contour maps and 3D terrain with WebGL, from procedural landforms or real elevation data.',
    },
    B: {
      core: 'Contour lines and 3D terrain in WebGL. Procedural landforms or real heightmaps, frame-exact PNG and video export, a web component and zero dependencies.',
      react: '<Topography /> for React: contour lines and 3D terrain in WebGL, procedural or from real heightmaps, with PNG and video export.',
    },
    C: {
      core: 'Draw topographic maps and 3D terrain in the browser, then put them on a page, record them to video or export frames. WebGL, no dependencies.',
      react: 'Draw topographic maps and 3D terrain in React with one component, then record them to video or export frames.',
    },
  },
  keywords: {
    core: ['topographic', 'topography', 'topographic-map', 'contour', 'contour-lines', 'isolines', 'terrain', 'terrain-generation',
      'procedural', 'procedural-generation', 'heightmap', 'heightfield', 'elevation', 'dem', 'cartography', 'webgl', 'webgl2',
      'shader', '3d', 'generative-art', 'creative-coding', 'video', 'png-export', 'gamedev', 'web-component', 'webmcp'],
    react: ['react', 'react-component', 'hooks'],
    dropped: ['background', 'animated-background', 'quality-tiers', 'map'],
  },
};

export const SITE_URL = 'https://topographic.yahyapak.dev';
export const DOCS_URL = 'https://topographic.yahyapak.dev/docs';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Highlights JS, JSX and HTML just enough for a prototype. Classes: k keyword, s string, t tag, c comment. */
export function hl(code) {
  const re = /(\/\/[^\n]*)|('[^']*'|"[^"]*")|\b(import|from|const|await|export|function|return|new)\b|(<\/?)([A-Za-z][\w.-]*)|([<>&])/g;
  let out = '';
  let last = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index));
    if (m[1]) out += `<span class="c">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="s">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="k">${m[3]}</span>`;
    else if (m[5]) out += `${esc(m[4])}<span class="t">${m[5]}</span>`;
    else out += esc(m[6]);
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}

/** A shields.io-style badge as HTML, so it renders without a network call. */
export function badge(label, value, color = '#007ec6') {
  return `<span style="display:inline-flex;font:400 11px/20px Verdana,DejaVu Sans,sans-serif;border-radius:3px;overflow:hidden;vertical-align:middle;text-shadow:0 1px 0 rgba(1,1,1,.3)"><span style="background:#555;color:#fff;padding:0 6px">${label}</span><span style="background:${color};color:#fff;padding:0 6px">${value}</span></span>`;
}

/** Wires every [data-copy] button under root to copy its value and say so. */
export function wireCopy(root) {
  for (const b of root.querySelectorAll('[data-copy]')) {
    b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); } catch { /* the prototype only shows the state */ }
      const was = b.innerHTML;
      b.textContent = 'Copied';
      setTimeout(() => { b.innerHTML = was; }, 1200);
    });
  }
}

/** Wires a tab row: buttons with data-tab switch panes with data-pane inside the same root. */
export function wireTabs(root) {
  for (const b of root.querySelectorAll('[data-tab]')) {
    b.addEventListener('click', () => {
      for (const x of root.querySelectorAll('[data-tab]')) x.classList.toggle('on', x === b);
      for (const p of root.querySelectorAll('[data-pane]')) p.hidden = p.dataset.pane !== b.dataset.tab;
    });
  }
}

export const ICON = {
  copy: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>',
  link: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"/></svg>',
  book: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"/></svg>',
  law: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8.75.75V2h.985c.304 0 .603.08.867.231l1.29.736c.038.022.08.033.124.033h2.234a.75.75 0 0 1 0 1.5h-.427l2.111 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.006.005-.01.01-.045.04c-.21.176-.441.327-.686.45C14.556 10.78 13.88 11 13 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L12.178 4.5h-.162c-.305 0-.604-.079-.868-.231l-1.29-.736a.245.245 0 0 0-.124-.033H8.75V13h2.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h2.5V3.5h-.984a.245.245 0 0 0-.124.033l-1.289.737c-.265.15-.564.23-.869.23h-.162l2.112 4.692a.75.75 0 0 1-.154.838l-.53-.53.529.531-.001.002-.002.002-.006.006-.016.015-.045.04c-.21.176-.441.327-.686.45C4.556 10.78 3.88 11 3 11a4.498 4.498 0 0 1-2.023-.454 3.544 3.544 0 0 1-.686-.45l-.045-.04-.016-.015-.006-.006-.004-.004v-.001a.75.75 0 0 1-.154-.838L2.178 4.5H1.75a.75.75 0 0 1 0-1.5h2.234a.249.249 0 0 0 .125-.033l1.288-.737c.265-.15.564-.23.869-.23h.984V.75a.75.75 0 0 1 1.5 0Zm2.945 8.477c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L13 6.327Zm-10 0c.285.135.718.273 1.305.273s1.02-.138 1.305-.273L3 6.327Z"/></svg>',
  star: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>',
  repo: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>',
  github: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>',
};
