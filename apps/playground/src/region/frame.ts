import type { BBox } from './pipeline';

/** A rectangle on the map, in CSS pixels from the map's top-left corner. */
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Which edges a handle moves: a corner moves two, an edge one. */
export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export const HANDLES: readonly Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** The frame never gets smaller than this on screen, so its handles stay apart. */
export const MIN_FRAME_PX = 28;

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

/** Width over height of a box as the Web Mercator map draws it. */
export function screenAspect(bbox: BBox): number {
  const width = ((bbox.east - bbox.west) * Math.PI) / 180;
  const height = mercY(bbox.north) - mercY(bbox.south);
  return width / Math.max(height, 1e-9);
}

/** The largest rectangle of this aspect that fits in `area`, centred. */
export function fitRect(area: Rect, aspect: number): Rect {
  const aw = area.right - area.left;
  const ah = area.bottom - area.top;
  const w = Math.min(aw, ah * aspect);
  const h = w / aspect;
  const cx = (area.left + area.right) / 2;
  const cy = (area.top + area.bottom) / 2;
  return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
}

/** Moves the edges a handle holds by (dx, dy), inside `bounds` and never under MIN_FRAME_PX. */
export function resizeRect(start: Rect, handle: Handle, dx: number, dy: number, bounds: Rect): Rect {
  const r = { ...start };
  if (handle.includes('w')) r.left = Math.min(Math.max(bounds.left, start.left + dx), start.right - MIN_FRAME_PX);
  if (handle.includes('e')) r.right = Math.max(Math.min(bounds.right, start.right + dx), start.left + MIN_FRAME_PX);
  if (handle.includes('n')) r.top = Math.min(Math.max(bounds.top, start.top + dy), start.bottom - MIN_FRAME_PX);
  if (handle.includes('s')) r.bottom = Math.max(Math.min(bounds.bottom, start.bottom + dy), start.top + MIN_FRAME_PX);
  return r;
}

/** Keeps a rectangle inside `bounds`, shrinking it only when it cannot fit. */
export function containRect(rect: Rect, bounds: Rect): Rect {
  const w = Math.min(rect.right - rect.left, bounds.right - bounds.left);
  const h = Math.min(rect.bottom - rect.top, bounds.bottom - bounds.top);
  const left = Math.min(Math.max(rect.left, bounds.left), bounds.right - w);
  const top = Math.min(Math.max(rect.top, bounds.top), bounds.bottom - h);
  return { left, top, right: left + w, bottom: top + h };
}

const mix = (a: Rect, b: Rect, t: number): Rect => ({
  left: a.left + (b.left - a.left) * t,
  top: a.top + (b.top - a.top) * t,
  right: a.right + (b.right - a.right) * t,
  bottom: a.bottom + (b.bottom - a.bottom) * t,
});

/**
 * The rectangle closest to `next` on the way from `valid` that still passes `ok`.
 * Dragging past a limit then stops the frame at the limit instead of refusing the whole move.
 */
export function clampTowards(valid: Rect, next: Rect, ok: (rect: Rect) => boolean): Rect {
  if (ok(next)) return next;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mix(valid, next, mid))) lo = mid;
    else hi = mid;
  }
  return mix(valid, next, lo);
}
