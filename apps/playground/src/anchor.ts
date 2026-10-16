/**
 * Horizontal drag of the 2D summit.
 * Anchor 0 puts the summit just off the right edge. Anchor 1 centres it.
 * The shader offset is `(1 - anchor) * 0.525 * width`, so a rightward drag lowers the anchor.
 */
export function anchorFromDrag(start: number, dx: number, width: number): number {
  const span = Math.max(1, width) * 0.525;
  const next = start - dx / span;
  return Math.min(1, Math.max(0, Math.round(next * 100) / 100));
}
