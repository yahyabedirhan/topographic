import type { CameraSettings } from './settings.js';

export interface Pose {
  azimuth: number;
  elevation: number;
  radius: number;
}

export const CAMERA_TARGET: readonly [number, number, number] = [0, 0.12, 0];
const FOV = 32 * Math.PI / 180;

function clampElevation(v: number): number {
  return Math.min(80, Math.max(2, v));
}

/** Where the camera sits at `seconds` along its path. Elevation stays above the horizon. */
export function cameraPose(camera: CameraSettings, seconds: number): Pose {
  const t = Number.isFinite(seconds) ? seconds : 0;
  switch (camera.motion) {
    case 'orbit':
      return { azimuth: camera.azimuth + t * 14, elevation: camera.elevation, radius: camera.radius };
    case 'push': {
      const w = 0.5 - 0.5 * Math.cos(t * 0.45);
      return {
        azimuth: camera.azimuth,
        elevation: clampElevation(camera.elevation + 4 * Math.sin(t * 0.45)),
        radius: camera.radius * (1 - 0.24 * w),
      };
    }
    case 'flyover': {
      const sweep = Math.sin(t * 0.28);
      return {
        azimuth: camera.azimuth + sweep * 62,
        elevation: clampElevation(camera.elevation * 0.82 + 6 + sweep * 4),
        radius: camera.radius * (1.06 - 0.2 * (0.5 + 0.5 * sweep)),
      };
    }
    case 'drone':
      return {
        azimuth: camera.azimuth + t * 11,
        elevation: clampElevation(camera.elevation + Math.sin(t * 0.8) * 6),
        radius: camera.radius * (1 + Math.sin(t * 0.55) * 0.08),
      };
    default:
      return { azimuth: camera.azimuth, elevation: clampElevation(camera.elevation), radius: camera.radius };
  }
}

export function eyePosition(pose: Pose): [number, number, number] {
  const az = pose.azimuth * Math.PI / 180;
  const el = clampElevation(pose.elevation) * Math.PI / 180;
  const cp = Math.cos(el);
  const [tx, ty, tz] = CAMERA_TARGET;
  return [
    tx + pose.radius * cp * Math.sin(az),
    ty + pose.radius * Math.sin(el),
    tz + pose.radius * cp * Math.cos(az),
  ];
}

function sub(a: readonly [number, number, number], b: readonly [number, number, number]): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function dot(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a: readonly [number, number, number], b: readonly [number, number, number]): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm(a: readonly [number, number, number]): [number, number, number] {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

function mul(a: Float32Array, b: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

function lookAt(eye: readonly [number, number, number], target: readonly [number, number, number]): Float32Array {
  const z = norm(sub(eye, target));
  const x = norm(cross([0, 1, 0], z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}

function perspective(aspect: number): Float32Array {
  const f = 1 / Math.tan(FOV / 2);
  const near = 0.06;
  const far = 48;
  const m = new Float32Array(16);
  m[0] = f / Math.max(aspect, 0.01);
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}

export function viewProjection(pose: Pose, aspect: number): Float32Array {
  return mul(perspective(aspect), lookAt(eyePosition(pose), CAMERA_TARGET));
}
