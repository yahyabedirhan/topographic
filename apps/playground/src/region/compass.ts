/**
 * The minimap's maths, kept apart from React so it can be tested. The 3D camera at azimuth 0 looks
 * from the south with north at the top of the screen. A larger azimuth orbits the camera clockwise
 * seen from above, which turns the terrain on screen clockwise too: at 90 north points right.
 */

/** The azimuth that puts north at the top of the screen. */
export const NORTH_UP = 0;

/** How far the north-up minimap turns, clockwise in CSS degrees, to match the 3D view at this azimuth. */
export function minimapTurn(azimuth: number): number {
  return ((azimuth % 360) + 360) % 360;
}

/** The north-up azimuth nearest to `from`, so the camera turns the short way back: 0 or 360. */
export function northTarget(from: number): number {
  const a = minimapTurn(from);
  return a > 180 ? 360 : 0;
}

/** The size of a north-up image of this aspect (width / height) whose every rotation fits in a square of `side`. */
export function fitRotating(aspect: number, side: number): { width: number; height: number } {
  const a = Math.max(aspect, 0.05);
  const height = side / Math.hypot(a, 1);
  return { width: height * a, height };
}
