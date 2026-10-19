// PROTOTYPE names for the code the prototypes show, in the proposed 0.6.0 API. One edit renames them everywhere.
// Live renders still call the 0.5.0 library through live.js, where the same setting is `style`.

/** The land-shape setting: `shape: 'dunes'`, `shape="dunes"`. */
export const SHAPE_KEY = 'shape';
/** The custom element's tag. */
export const ELEMENT_TAG = 'topographic-view';

/** Rewrites a snippet written with `shape` and `topographic-view` to the names above. */
export const named = (code) => code
  .replace(/\bshape(?=[=:])/g, SHAPE_KEY)
  .replace(/topographic-view/g, ELEMENT_TAG);
