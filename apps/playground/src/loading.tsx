import { visualVariants, type VariantId } from './variants';

/**
 * Shown instead of the default terrain while a shared place is still loading.
 * Both variants are prototypes: ?loading=a or ?loading=b, or ?variant= for all of them.
 * SVG and CSS only, so a phone does not start a second WebGL context for the wait.
 */
export function TerrainLoading({ variant = visualVariants(location.search).loading }: { variant?: VariantId }) {
  const rings = [18, 34, 50, 66, 82];
  return (
    <div className={`pt-loading pt-loading-${variant}`} role="status" aria-live="polite" data-loading={variant}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        {rings.map((r, i) => (
          <ellipse key={r} cx="100" cy="108" rx={r} ry={r * (variant === 'b' ? 0.42 : 0.62)} />
        ))}
      </svg>
      <p>{variant === 'a' ? 'Loading terrain' : 'The terrain is on its way'}</p>
    </div>
  );
}
