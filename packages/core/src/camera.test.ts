import { describe, expect, it } from 'vitest';
import { CAMERA_TARGET, cameraPose, eyePosition, viewProjection } from './camera.js';
import { DEFAULT_CAMERA } from './settings.js';

function project(pose: { azimuth: number; elevation: number; radius: number }, aspect: number, point: readonly [number, number, number]): [number, number, number] {
  const m = viewProjection(pose, aspect);
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
