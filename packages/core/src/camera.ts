import type { CameraSettings } from './settings.js';

export interface Pose {
  azimuth: number;
  elevation: number;
  radius: number;
  /** Where the camera looks on the ground, east-west and north-south from the terrain centre. Defaults to 0. */
  panX?: number;
  panZ?: number;
}

/** The point the camera looks at with no pan: the terrain centre, a little above the ground. */
export const CAMERA_TARGET: readonly [number, number, number] = [0, 0.12, 0];
const FOV = 32 * Math.PI / 180;
/** The terrain stretches this far past the view when the extent is endless. */
export const ENDLESS_REACH = 2.45;

/** Space that page UI covers on each side of the canvas, in CSS pixels. */
export interface ViewInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The point a pose looks at: the terrain centre moved by the pan. */
export function cameraTarget(pose: Pose): [number, number, number] {
  return [CAMERA_TARGET[0] + (pose.panX ?? 0), CAMERA_TARGET[1], CAMERA_TARGET[2] + (pose.panZ ?? 0)];
}

function clampElevation(v: number): number {
  return Math.min(80, Math.max(2, v));
}

/** Where the camera sits at `seconds` along its path. Elevation stays above the horizon. */
export function cameraPose(camera: CameraSettings, seconds: number): Pose {
  const t = Number.isFinite(seconds) ? seconds : 0;
  switch (camera.motion) {
    case 'orbit':
      return withPan({ azimuth: camera.azimuth + t * 14, elevation: camera.elevation, radius: camera.radius }, camera);
    case 'push': {
      const w = 0.5 - 0.5 * Math.cos(t * 0.45);
      return withPan({
        azimuth: camera.azimuth,
        elevation: clampElevation(camera.elevation + 4 * Math.sin(t * 0.45)),
        radius: camera.radius * (1 - 0.24 * w),
      }, camera);
    }
    case 'flyover': {
      const sweep = Math.sin(t * 0.28);
      return withPan({
        azimuth: camera.azimuth + sweep * 62,
        elevation: clampElevation(camera.elevation * 0.82 + 6 + sweep * 4),
        radius: camera.radius * (1.06 - 0.2 * (0.5 + 0.5 * sweep)),
      }, camera);
    }
    case 'drone':
      return withPan({
        azimuth: camera.azimuth + t * 11,
        elevation: clampElevation(camera.elevation + Math.sin(t * 0.8) * 6),
        radius: camera.radius * (1 + Math.sin(t * 0.55) * 0.08),
      }, camera);
    default:
      return withPan({ azimuth: camera.azimuth, elevation: clampElevation(camera.elevation), radius: camera.radius }, camera);
  }
}

function withPan(pose: Pose, camera: Partial<Pick<CameraSettings, 'panX' | 'panZ'>>): Pose {
  return { ...pose, panX: camera.panX ?? 0, panZ: camera.panZ ?? 0 };
}

export function eyePosition(pose: Pose): [number, number, number] {
  const az = pose.azimuth * Math.PI / 180;
  const el = clampElevation(pose.elevation) * Math.PI / 180;
  const cp = Math.cos(el);
  const [tx, ty, tz] = cameraTarget(pose);
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

/**
 * How far the picture moves, in clip space (-1..1 across the view), so its centre lands in the middle
 * of the part the insets leave free. Positive x is right, positive y is up. Insets that leave no room
 * are scaled down until a sliver stays free.
 */
export function viewShift(insets: ViewInsets | null | undefined, width: number, height: number): [number, number] {
  if (!insets || !(width > 0) || !(height > 0)) return [0, 0];
  const side = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
  const fit = (a: number, b: number, size: number): [number, number] => {
    const sum = a + b;
    const k = sum > size * 0.9 ? (size * 0.9) / sum : 1;
    return [a * k, b * k];
  };
  const [left, right] = fit(side(insets.left), side(insets.right), width);
  const [top, bottom] = fit(side(insets.top), side(insets.bottom), height);
  return [(left - right) / width, (bottom - top) / height];
}

/** The view-projection matrix. `shift` moves the projected picture in clip space (a lens shift), not the camera. */
export function viewProjection(pose: Pose, aspect: number, shift: readonly [number, number] = [0, 0]): Float32Array {
  const m = mul(perspective(aspect), lookAt(eyePosition(pose), cameraTarget(pose)));
  if (shift[0] || shift[1]) {
    // x' = x + sx * w for every column: the picture slides without changing the perspective.
    for (let c = 0; c < 4; c++) {
      m[c * 4] += shift[0] * m[c * 4 + 3];
      m[c * 4 + 1] += shift[1] * m[c * 4 + 3];
    }
  }
  return m;
}

/**
 * How far to slide the picture up (clip space) so a block of terrain sits centred on screen, not
 * just the point the camera aims at: in perspective the near edge reaches further down than the far
 * edge reaches up. The block's footprint is taken as a circle of its root-mean-square radius, so the
 * answer does not change as the camera orbits. Endless terrain uses its block-sized middle. 0 without a footprint.
 */
export function blockLift(pose: Pose, aspect: number, half: readonly [number, number] | null): number {
  if (!half) return 0;
  const r = Math.sqrt((half[0] * half[0] + half[1] * half[1]) / 2);
  const m = viewProjection(pose, aspect);
  const [tx, ty, tz] = cameraTarget(pose);
  const az = pose.azimuth * Math.PI / 180;
  // From the camera towards the target, flat on the ground.
  const fx = -Math.sin(az), fz = -Math.cos(az);
  const ndcY = (x: number, y: number, z: number) => {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return w > 1e-4 ? (m[1] * x + m[5] * y + m[9] * z + m[13]) / w : Number.NaN;
  };
  const near = ndcY(tx - fx * r, 0, tz - fz * r);
  const far = ndcY(tx + fx * r, ty, tz + fz * r);
  if (!Number.isFinite(near) || !Number.isFinite(far)) return 0;
  return Math.min(0.6, Math.max(-0.6, -(near + far) / 2));
}

/** Mirrors the terrain vertex shader: half the terrain's size on the ground, in world units [x, z]. */
export function terrainHalfSize(viewAspect: number, extent: 'block' | 'endless', heightAspect?: number | null): [number, number] {
  const reach = extent === 'block' ? 1 : ENDLESS_REACH;
  const viewA = Number.isFinite(viewAspect) && viewAspect > 0 ? viewAspect : 1;
  let fx = viewA, fz = 1;
  if (heightAspect !== undefined && heightAspect !== null) {
    const ra = Math.max(heightAspect || 1, 0.05);
    const s = Math.min(Math.min(viewA, 1.15) / ra, 1);
    fx = ra * s; fz = s;
  }
  return [0.5 * reach * fx * 0.9, 0.5 * reach * fz * 0.9];
}

/** Keeps the pan over the terrain, so the camera always looks at some of it. */
export function clampPan(panX: number, panZ: number, half: readonly [number, number]): [number, number] {
  const c = (v: number, h: number) => (Number.isFinite(v) ? Math.min(h, Math.max(-h, v)) : 0);
  return [c(panX, half[0]), c(panZ, half[1])];
}

/**
 * The pan after dragging the view by (dx, dy) CSS pixels on a view `viewHeight` pixels tall: the
 * ground under the pointer follows it. Dragging right moves the terrain right; dragging down pulls
 * the far side toward the camera.
 */
export function panBy(pose: Pose, dx: number, dy: number, viewHeight: number): [number, number] {
  const perPx = (2 * pose.radius * Math.tan(FOV / 2)) / Math.max(1, viewHeight);
  const az = pose.azimuth * Math.PI / 180;
  const el = clampElevation(pose.elevation) * Math.PI / 180;
  // Ground distance shrinks on screen by sin(elevation); a floor keeps low views from racing.
  const along = perPx / Math.max(0.3, Math.sin(el));
  const right: [number, number] = [Math.cos(az), -Math.sin(az)];
  const forward: [number, number] = [-Math.sin(az), -Math.cos(az)];
  const x = (pose.panX ?? 0) - right[0] * dx * perPx + forward[0] * dy * along;
  const z = (pose.panZ ?? 0) - right[1] * dx * perPx + forward[1] * dy * along;
  return [x, z];
}
