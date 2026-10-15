import { describe, expect, it } from 'vitest';
import { latToY, lonToX, resample, type BBox, type Mosaic } from './pipeline';
import { fitRotating, minimapTurn, NORTH_UP, northTarget } from './compass';
// Core internals that the package does not export. Read-only here: the 3D mapping lives in packages/core.
import { viewProjection } from '../../../../packages/core/src/camera';
import { terrainVertexSource } from '../../../../packages/core/src/shader/terrain.glsl';

/** About the Istanbul frame from the bug report. */
const BBOX: BBox = { west: 28.45, south: 40.78, east: 29.65, north: 41.36 };
const GRID = 16;

/** A mosaic around the bbox with one bump at its north-east corner. */
function northEastBump(): Mosaic {
  const z = 9;
  const x0 = Math.floor(lonToX(BBOX.west, z) * 256) - 2;
  const y0 = Math.floor(latToY(BBOX.north, z) * 256) - 2;
  const width = Math.ceil(lonToX(BBOX.east, z) * 256) + 2 - x0;
  const height = Math.ceil(latToY(BBOX.south, z) * 256) + 2 - y0;
  const meters = new Float32Array(width * height);
  const bx = lonToX(BBOX.east - 0.1, z) * 256 - x0;
  const by = latToY(BBOX.north - 0.05, z) * 256 - y0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) meters[y * width + x] = 1000 * Math.exp(-((x - bx) ** 2 + (y - by) ** 2) / 20);
  }
  return { meters, width, height, originX: x0, originY: y0, z };
}

function argmax(a: Float32Array): { col: number; row: number } {
  let best = 0;
  for (let i = 1; i < a.length; i++) if (a[i] > a[best]) best = i;
  return { col: best % GRID, row: Math.floor(best / GRID) };
}

/** Clip-space x/y of a grid point (u east, v north, both 0..1) through the 3D vertex mapping. */
function project3d(u: number, v: number, azimuth: number, elevation: number): [number, number] {
  const src = terrainVertexSource(false);
  const m = /vec3 world=vec3\(p\.x\*\.9, y, (-?)p\.y\*\.9\);/.exec(src);
  if (!m) throw new Error('terrain vertex shader changed its world mapping; update this test');
  const zSign = m[1] === '-' ? -1 : 1;
  const world = [(u - 0.5) * 0.9, 0.05, zSign * (v - 0.5) * 0.9, 1];
  const vp = viewProjection({ azimuth, elevation, radius: 2.45 }, 1);
  const clip = [0, 1, 2, 3].map((r) => vp[r] * world[0] + vp[4 + r] * world[1] + vp[8 + r] * world[2] + vp[12 + r] * world[3]);
  return [clip[0] / clip[3], clip[1] / clip[3]];
}

describe('region orientation', () => {
  it('puts a north-east bump in the last row (north) and last column (east)', () => {
    const { col, row } = argmax(resample(northEastBump(), BBOX, GRID));
    expect(col).toBeGreaterThanOrEqual(GRID - 3);
    expect(row).toBeGreaterThanOrEqual(GRID - 3);
  });

  it('2D: row 0 is the first texture row, which gl_FragCoord puts at the bottom of the screen', () => {
    // texImage2D uploads row 0 at t=0 without UNPACK_FLIP_Y, and regionUv() maps gl_FragCoord.y=0 (bottom) to t=0.
    // So the south row is drawn at the bottom and the north row at the top. Screenshot-verified.
    const { row } = argmax(resample(northEastBump(), BBOX, GRID));
    const screenYFromTop = 1 - (row + 0.5) / GRID;
    expect(screenYFromTop).toBeLessThan(0.25);
  });

  // Fails until packages/core/src/shader/terrain.glsl.ts maps north to -z (see the bug report).
  // Remove `.fails` once core is fixed.
  it('3D: seen from straight above at azimuth 0, north is up and east is right', () => {
    const [nx, ny] = project3d(1, 1, 0, 80);
    const [sx, sy] = project3d(0, 0, 0, 80);
    expect(nx).toBeGreaterThan(sx);
    expect(ny).toBeGreaterThan(sy);
  });

  // Same core bug: at every azimuth, east-then-north turns clockwise on screen, so no camera angle undoes it.
  it('3D: every azimuth is a rotation of the map, never a mirror', () => {
    for (const az of [0, 42, 60, 90, 180, 270]) {
      const [ax, ay] = project3d(0, 0, az, 80); // SW
      const [bx, by] = project3d(1, 0, az, 80); // SE
      const [cx, cy] = project3d(0, 1, az, 80); // NW
      const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      expect(cross).toBeGreaterThan(0); // counter-clockwise, as on a north-up map
    }
  });

  it('the minimap turns like the terrain on screen: north up at azimuth 0, clockwise as the azimuth grows', () => {
    for (const az of [NORTH_UP, 30, 90, 135, 200, 270, 341.8]) {
      const [nx, ny] = project3d(0.5, 1, az, 80);
      const [sx, sy] = project3d(0.5, 0, az, 80);
      // Screen direction of north, as a CSS angle: 0 is up, positive is clockwise (clip y points up).
      const screen = (Math.atan2(nx - sx, ny - sy) * 180) / Math.PI;
      const diff = ((screen - minimapTurn(az)) % 360 + 540) % 360 - 180;
      expect(Math.abs(diff)).toBeLessThan(2);
    }
  });

  it('the compass turns the short way back to north', () => {
    expect(northTarget(30)).toBe(0);
    expect(northTarget(341.8)).toBe(360);
    expect(northTarget(-20)).toBe(360);
  });

  it('sizes the minimap so any rotation fits its square', () => {
    for (const aspect of [0.5, 1, 1.55, 3]) {
      const { width, height } = fitRotating(aspect, 100);
      expect(Math.hypot(width, height)).toBeCloseTo(100, 6);
      expect(width / height).toBeCloseTo(aspect, 6);
    }
  });
});
