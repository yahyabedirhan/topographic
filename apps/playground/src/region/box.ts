import type { BBox } from 'topographic/locations';

/** Two boxes count as the same place when every edge is within about ten metres. */
export function sameBox(a: BBox, b: BBox): boolean {
  const near = (x: number, y: number) => Math.abs(x - y) < 1e-4;
  return near(a.west, b.west) && near(a.south, b.south) && near(a.east, b.east) && near(a.north, b.north);
}
