import { ZOOM_MAX, ZOOM_MIN } from 'topographic';

/**
 * The 2D view's geometry for the pointer controls. The renderer draws the field point
 * (panX / 0.9, -panZ / 0.9) at the view centre, zoom times closer, with the view `height` pixels
 * tall. These helpers keep the ground under a pointer under it while it moves or zooms.
 */
export interface View2d { panX: number; panZ: number; zoom: number }

const round3 = (n: number) => Number(n.toFixed(3));

/** The view after dragging (dx, dy) pixels: the ground follows the pointer. */
export function pan2d(from: View2d, dx: number, dy: number, height: number): Pick<View2d, 'panX' | 'panZ'> {
  const k = 0.9 / (Math.max(1, height) * from.zoom);
  return { panX: round3(from.panX - dx * k), panZ: round3(from.panZ - dy * k) };
}

/**
 * The view at `zoom` (clamped), keeping the ground at (ox, oy) pixels from the view centre in place.
 * Without an offset it zooms around the centre.
 */
export function zoom2d(from: View2d, zoom: number, ox = 0, oy = 0, height = 1): View2d {
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
  const k = (0.9 / Math.max(1, height)) * (1 / from.zoom - 1 / next);
  return { panX: round3(from.panX + ox * k), panZ: round3(from.panZ + oy * k), zoom: round3(next) };
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
