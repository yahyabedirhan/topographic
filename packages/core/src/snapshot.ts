/** A part of the frame in fractions from its top-left corner: 0 to 1 on each axis. */
export interface SnapshotRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapshotFrame {
  /** The size the whole frame is drawn at. */
  frameWidth: number;
  frameHeight: number;
  /** The pixels read back, in the frame's top-down coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
}

const finite = (v: number) => Number.isFinite(v);

/**
 * Where a snapshot draws and what it reads back. Without a region the frame is the output. With one,
 * the whole frame is drawn at the size that makes the region `width × height`, so the picture is the
 * same view as on screen, cut down. One output side alone keeps the region's own aspect ratio.
 */
export function snapshotFrame(canvasWidth: number, canvasHeight: number, o: { width?: number; height?: number; region?: SnapshotRegion } = {}): SnapshotFrame {
  const r = o.region;
  if (!r) {
    const aspect = canvasWidth / canvasHeight;
    const width = Math.round(o.width ?? (o.height ? o.height * aspect : canvasWidth));
    const height = Math.round(o.height ?? (o.width ? o.width / aspect : canvasHeight));
    return { frameWidth: width, frameHeight: height, x: 0, y: 0, width, height };
  }
  if (![r.x, r.y, r.width, r.height].every(finite) || r.width <= 0 || r.height <= 0 || r.x < 0 || r.y < 0
    || r.x + r.width > 1 + 1e-6 || r.y + r.height > 1 + 1e-6) {
    throw new Error('[topographic] snapshot region must lie inside the frame (fractions 0..1)');
  }
  const regionW = canvasWidth * r.width;
  const regionH = canvasHeight * r.height;
  const aspect = regionW / regionH;
  const width = Math.round(o.width ?? (o.height ? o.height * aspect : regionW));
  const height = Math.round(o.height ?? (o.width ? o.width / aspect : regionH));
  const frameWidth = Math.max(width, Math.round(width / r.width));
  const frameHeight = Math.max(height, Math.round(height / r.height));
  const x = Math.min(frameWidth - width, Math.max(0, Math.round(r.x * frameWidth)));
  const y = Math.min(frameHeight - height, Math.max(0, Math.round(r.y * frameHeight)));
  return { frameWidth, frameHeight, x, y, width, height };
}
