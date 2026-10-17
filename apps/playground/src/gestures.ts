import { ZOOM_MAX, ZOOM_MIN } from 'topographic';

/**
 * The 2D view's geometry for the pointer controls. The renderer draws the field point (x, y) at the
 * view centre, zoom times closer, with the screen height as the unit at zoom 1 and y up. These
 * helpers keep the ground under a pointer under it while it moves or zooms. `half` is how far the
 * centre may go from the middle, so some of the terrain always stays in view.
 */
export interface View2d { x: number; y: number; zoom: number }

const round3 = (n: number) => Number(n.toFixed(3));
const within = (v: number, h: number) => Math.min(h, Math.max(-h, v));

/** The view after dragging (dx, dy) pixels on a view `height` pixels tall: the ground follows the pointer. */
export function pan2d(from: View2d, dx: number, dy: number, height: number, half: readonly [number, number]): View2d {
  const k = 1 / (Math.max(1, height) * from.zoom);
  return { x: round3(within(from.x - dx * k, half[0])), y: round3(within(from.y + dy * k, half[1])), zoom: from.zoom };
}

/**
 * The view at `zoom` (clamped), keeping the ground at (ox, oy) pixels from the view centre in place.
 * Without an offset it zooms around the centre.
 */
export function zoom2d(from: View2d, zoom: number, ox: number, oy: number, height: number, half: readonly [number, number]): View2d {
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
  const k = (1 / Math.max(1, height)) * (1 / from.zoom - 1 / next);
  return { x: round3(within(from.x + ox * k, half[0])), y: round3(within(from.y - oy * k, half[1])), zoom: round3(next) };
}

/**
 * What a two finger touch is doing once it has moved: both fingers up or down together, at the same
 * spread, is a tilt (as in Google Maps); anything else is a pinch, which zooms, twists and pans.
 * Null while the fingers have barely moved.
 */
export function twoFingerKind(midDx: number, midDy: number, spread: number): 'tilt' | 'pinch' | null {
  const moved = Math.hypot(midDx, midDy);
  if (moved < 10 && Math.abs(spread - 1) < 0.06) return null;
  return Math.abs(midDy) > 10 && Math.abs(midDy) > 2 * Math.abs(midDx) && Math.abs(spread - 1) < 0.12 ? 'tilt' : 'pinch';
}

/** The wheel's zoom factor: above 1 zooms in. A pinch arrives as a wheel with ctrlKey and steps harder. */
export function wheelZoom(deltaY: number, deltaMode: number, pinch: boolean): number {
  const px = deltaMode === 1 ? 16 : deltaMode === 2 ? 400 : 1;
  return Math.exp(-deltaY * px * (pinch ? 0.01 : 0.002));
}

/** The parts of a wheel event that tell a mouse from a trackpad. */
export interface WheelLike { deltaMode: number; deltaX: number; deltaY: number; ctrlKey: boolean; wheelDeltaY?: number }

/**
 * A mouse wheel's notch, as opposed to a trackpad's smooth scroll or pinch. Firefox counts a notch in
 * lines. Chrome and Safari report a notch's legacy wheelDelta in multiples of 120, and a trackpad's as
 * -3 × deltaY. Unknown events count as smooth.
 */
export function isWheelNotch(e: WheelLike): boolean {
  if (e.ctrlKey) return false;
  if (e.deltaMode !== 0) return true;
  if (e.deltaX !== 0) return false;
  const legacy = e.wheelDeltaY;
  return typeof legacy === 'number' && legacy !== 0 && legacy % 120 === 0 && legacy !== -3 * e.deltaY;
}

/** One notch zooms by 1.5, a fast spin by up to three notches at once. Above 1 zooms in. */
export function notchZoom(e: WheelLike): number {
  const delta = e.deltaY || e.deltaX;
  const notches = Math.min(3, Math.max(1, Math.abs(delta) / (e.deltaMode === 0 ? 100 : 3)));
  return 1.5 ** (delta < 0 ? notches : -notches);
}

