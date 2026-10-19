// PROTOTYPE the public text as the writing desk last saved it: copy-draft.json through the dev server, each
// field falling back to opening.js when the desk is empty or not running. Boards import TEXT, so the README,
// the npm pages, the GitHub card and the social cards always show what the desk shows.
import { OPENING } from './opening.js';

let saved = {};
try { saved = await (await fetch('/__copy-draft')).json(); } catch { /* no desk running: use the defaults */ }
const pick = (k, fallback) => (typeof saved[k] === 'string' && saved[k].trim() ? saved[k].trim() : fallback);

export const TEXT = {
  line: pick('line', OPENING.line),
  head: pick('head', OPENING.head),
  sub: pick('sub', OPENING.sub),
  open1: pick('open1', OPENING.open1),
  open2: pick('open2', OPENING.open2),
  github: pick('github', pick('line', OPENING.line)),
  npmCore: pick('npmCore', pick('line', OPENING.line)),
  npmReact: pick('npmReact', 'React component for topographic. Generate a land or turn a real place into a topographic terrain, rendered with WebGL.'),
};
