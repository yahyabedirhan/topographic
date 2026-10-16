/**
 * Shown instead of the default terrain while a shared place is still loading.
 * SVG and CSS only, so a phone does not start a second WebGL context for the wait.
 */
export function TerrainLoading() {
  const rings = [18, 34, 50, 66, 82];
  return (
    <div className="pt-loading" role="status" aria-live="polite" data-loading="terrain">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        {rings.map((r) => (
          <ellipse key={r} cx="100" cy="108" rx={r} ry={r * 0.62} />
        ))}
      </svg>
      <p>Loading terrain</p>
    </div>
  );
}
