/** A square elevation grid. Row 0 is south, column 0 is west. 0 is low, 1 is high. */
export interface Heightfield {
  samples: Float32Array;
  size: number;
  /** Width / height of the place in web mercator, so the block matches the map. */
  aspect: number;
}

/** Bilinear sample. u and v are 0..1 across the grid. */
export function sampleGrid(field: Heightfield, u: number, v: number): number {
  const n = field.size;
  if (n < 2) return field.samples[0] ?? 0;
  const x = Math.min(1, Math.max(0, u)) * (n - 1);
  const y = Math.min(1, Math.max(0, v)) * (n - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const at = (px: number, py: number) => field.samples[py * n + px];
  const x1 = Math.min(n - 1, x0 + 1);
  const y1 = Math.min(n - 1, y0 + 1);
  const a = at(x0, y0);
  const b = at(x1, y0);
  const c = at(x0, y1);
  const d = at(x1, y1);
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}
