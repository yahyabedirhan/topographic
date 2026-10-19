// PROTOTYPE helpers shared by the boards: live terrain from the built package, assets and small DOM helpers.
// Uses the 0.5.0 API names on purpose: the rename is itself one of the boards.
import { createTopographicBackground } from '/packages/core/dist/index.js';

/** Mounts a live topographic into el. Returns the instance; the shell destroys it on switch. */
export function terrain(el, settings = {}, options = {}) {
  const t = createTopographicBackground(el, settings, { maxPixelRatio: 2, ...options });
  live.add(t);
  return t;
}

export const live = new Set();
export function destroyLive() {
  for (const t of live) t.destroy();
  live.clear();
}

export const shot = (name) => `/assets/screenshots/${name}.webp`;
export const LOGO = '/assets/images/logo/topographic.png';

/** html`...` for building variant markup from template strings. */
export function h(strings, ...values) {
  const tpl = document.createElement('template');
  tpl.innerHTML = strings.reduce((out, s, i) => out + s + (i < values.length ? values[i] : ''), '');
  return tpl.content;
}

/** Real looks from the README examples, as settings, so live renders match the screenshots. */
export const LOOKS = {
  granite3d: { style: 'granite', seed: 67, lines: { count: 36, indexEvery: 4 }, mode: '3d', theme: { mode: 'dark' }, camera: { motion: 'orbit' } },
  ridge2d: { style: 'long-ridge', lines: { count: 40, indexEvery: 5, opacity: 0.6 }, theme: { mode: 'dark' } },
  dunes2d: { style: 'dunes', theme: { ink: '#8fd6c8', paper: '#06201f' }, motion: { sparkle: 0.3 } },
  petals2d: { style: 'five-petals', theme: { ink: '#6b2e5f', paper: '#f6e4ea' } },
  terraces3d: { style: 'gentle-summit', terrain: { terracing: 0.8, peaks: 2 }, theme: { ink: '#e0a24a', paper: '#120d07' }, mode: '3d', camera: { motion: 'orbit' } },
  summit3dLight: { style: 'gentle-summit', mode: '3d', theme: { mode: 'light' }, camera: { motion: 'orbit' } },
};

export const INSTALL = 'npm install topographic';
export const INSTALL_REACT = 'npm install topographic topographic-react';
export const NPM = 'https://www.npmjs.com/package/topographic';
export const NPM_REACT = 'https://www.npmjs.com/package/topographic-react';
export const REPO = 'https://github.com/yahyabedirhan/topographic';
export const PLAYGROUND = 'https://topographic.yahyapak.dev';
