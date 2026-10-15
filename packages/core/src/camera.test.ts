import { describe, expect, it } from 'vitest';
import { CAMERA_TARGET, blockLift, cameraPose, cameraTarget, clampPan, eyePosition, panBy, terrainHalfSize, viewProjection, viewShift, type Pose } from './camera.js';
import { DEFAULT_CAMERA } from './settings.js';

function project(pose: Pose, aspect: number, point: readonly [number, number, number], shift?: [number, number]): [number, number, number] {
  const m = viewProjection(pose, aspect, shift);
  const x = point[0], y = point[1], z = point[2];
  const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
  const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
  const cz = m[2] * x + m[6] * y + m[10] * z + m[14];
  const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
  return [cx / cw, cy / cw, cz / cw];
}

describe('camera', () => {
  it('keeps every path above the horizon', () => {
    for (const motion of ['still', 'orbit', 'push', 'flyover', 'drone'] as const) {
      for (let t = 0; t <= 40; t += 0.5) {
        const pose = cameraPose({ ...DEFAULT_CAMERA, motion, elevation: 2 }, t);
        expect(pose.elevation).toBeGreaterThanOrEqual(2);
        expect(pose.elevation).toBeLessThanOrEqual(80);
        expect(eyePosition(pose)[1]).toBeGreaterThan(CAMERA_TARGET[1]);
      }
    }
  });
  it('aims the default view at the terrain centre', () => {
    const ndc = project(DEFAULT_CAMERA, 16 / 9, CAMERA_TARGET);
    expect(ndc[0]).toBeCloseTo(0, 4);
    expect(ndc[1]).toBeCloseTo(0, 4);
    expect(ndc[2]).toBeGreaterThan(-1);
    expect(ndc[2]).toBeLessThan(1);
  });
  it('orbits without changing elevation or zoom', () => {
    const pose = cameraPose({ ...DEFAULT_CAMERA, motion: 'orbit' }, 3);
    expect(pose.azimuth).toBeCloseTo(DEFAULT_CAMERA.azimuth + 42);
    expect(pose.elevation).toBe(DEFAULT_CAMERA.elevation);
    expect(pose.radius).toBe(DEFAULT_CAMERA.radius);
  });
});

describe('lens shift', () => {
  it('is zero without insets or with even ones', () => {
    expect(viewShift(null, 1000, 500)).toEqual([0, 0]);
    expect(viewShift({ top: 40, right: 20, bottom: 40, left: 20 }, 1000, 500)).toEqual([0, 0]);
  });
  it('moves the centre to the middle of the free area', () => {
    // 2000×1000 with 80 px at the top and 130 at the bottom: the free area's middle sits 25 px higher.
    const [sx, sy] = viewShift({ top: 80, right: 0, bottom: 130, left: 0 }, 2000, 1000);
    expect(sx).toBe(0);
    const centrePx = (1 - sy) / 2 * 1000;
    expect(centrePx).toBeCloseTo(80 + (1000 - 80 - 130) / 2, 6);
    const [lx] = viewShift({ top: 0, right: 0, bottom: 0, left: 300 }, 2000, 1000);
    expect((lx + 1) / 2 * 2000).toBeCloseTo(300 + 1700 / 2, 6);
  });
  it('keeps some room when the insets cover the view', () => {
    const [, sy] = viewShift({ top: 0, right: 0, bottom: 5000, left: 0 }, 100, 100);
    expect(sy).toBeLessThan(1);
    expect(Number.isFinite(sy)).toBe(true);
  });
  it('slides the picture without moving the camera', () => {
    const shift: [number, number] = [0.1, 0.05];
    const plain = project(DEFAULT_CAMERA, 2, [0.3, 0.1, -0.2]);
    const moved = project(DEFAULT_CAMERA, 2, [0.3, 0.1, -0.2], shift);
    expect(moved[0] - plain[0]).toBeCloseTo(0.1, 5);
    expect(moved[1] - plain[1]).toBeCloseTo(0.05, 5);
    expect(moved[2]).toBeCloseTo(plain[2], 6);
    const centre = project(DEFAULT_CAMERA, 2, CAMERA_TARGET, shift);
    expect(centre[0]).toBeCloseTo(0.1, 5);
    expect(centre[1]).toBeCloseTo(0.05, 5);
  });
});

describe('pan', () => {
  const pose: Pose = { ...DEFAULT_CAMERA, panX: 0.2, panZ: -0.1 };
  it('aims at the panned target and orbits around it', () => {
    expect(cameraTarget(pose)).toEqual([0.2, CAMERA_TARGET[1], -0.1]);
    const ndc = project(pose, 16 / 9, cameraTarget(pose));
    expect(ndc[0]).toBeCloseTo(0, 4);
    expect(ndc[1]).toBeCloseTo(0, 4);
    for (const motion of ['orbit', 'push', 'flyover', 'drone'] as const) {
      const p = cameraPose({ ...DEFAULT_CAMERA, motion, panX: 0.2, panZ: -0.1 }, 7);
      expect([p.panX, p.panZ]).toEqual([0.2, -0.1]);
    }
  });
  it('keeps the ground under the pointer', () => {
    const before = project(pose, 2, [0.25, CAMERA_TARGET[1], -0.05]);
    const [panX, panZ] = panBy(pose, 40, 0, 1000);
    const after = project({ ...pose, panX, panZ }, 2, [0.25, CAMERA_TARGET[1], -0.05]);
    // 40 px right on a 1000 px tall view is 0.08 in clip space at aspect 1 (0.04 at aspect 2).
    expect(after[0] - before[0]).toBeCloseTo(0.04, 2);
    expect(Math.abs(after[1] - before[1])).toBeLessThan(0.005);
    const [, z2] = panBy(pose, 0, 30, 1000);
    const down = project({ ...pose, panZ: z2, panX: pose.panX }, 2, [0.25, CAMERA_TARGET[1], -0.05]);
    expect(down[1]).toBeLessThan(before[1]);
  });
  it('clamps the target to the terrain', () => {
    const half = terrainHalfSize(2, 'block');
    expect(half[0]).toBeCloseTo(0.9);
    expect(half[1]).toBeCloseTo(0.45);
    expect(clampPan(3, -3, half)).toEqual([half[0], -half[1]]);
    expect(clampPan(0.1, -0.2, half)).toEqual([0.1, -0.2]);
    expect(clampPan(Number.NaN, 0, half)).toEqual([0, 0]);
    expect(terrainHalfSize(2, 'endless')[0]).toBeCloseTo(0.9 * 2.45);
    const place = terrainHalfSize(2, 'block', 2);
    expect(place[0] / place[1]).toBeCloseTo(2);
  });
});

describe('block lift', () => {
  it('centres a block between its near and far edges, the same all the way round', () => {
    const half = terrainHalfSize(2, 'block', 2);
    const r = Math.sqrt((half[0] ** 2 + half[1] ** 2) / 2);
    const lifts = [0, 90, 200, 349.7].map((azimuth) => {
      const pose: Pose = { ...DEFAULT_CAMERA, azimuth };
      const lift = blockLift(pose, 2, half);
      const az = azimuth * Math.PI / 180;
      const near = project(pose, 2, [Math.sin(az) * r, 0, Math.cos(az) * r], [0, lift]);
      const far = project(pose, 2, [-Math.sin(az) * r, CAMERA_TARGET[1], -Math.cos(az) * r], [0, lift]);
      expect((near[1] + far[1]) / 2).toBeCloseTo(0, 5);
      return lift;
    });
    expect(lifts[0]).toBeGreaterThan(0);
    for (const l of lifts) expect(l).toBeCloseTo(lifts[0], 6);
    expect(blockLift(DEFAULT_CAMERA, 2, null)).toBe(0);
  });
});
