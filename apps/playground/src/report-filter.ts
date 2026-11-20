/**
 * View transitions the browser skips or aborts. The playground's client router moves between
 * /, /about and /docs with the View Transition API, and a hidden tab or a viewport change during
 * that move rejects the transition's promises. The page change still completes.
 * Current browsers use InvalidStateError; some use AbortError.
 */
export const TRANSITION_ABORTED = /(InvalidStateError|AbortError).*transition/i;

/** True when `error` is a view-transition abort, in the same `name: message` form Sentry matches. */
export function isTransitionAborted(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const named = error as { name?: unknown; message?: unknown };
    return TRANSITION_ABORTED.test(`${String(named.name)}: ${String(named.message)}`);
  }
  return TRANSITION_ABORTED.test(String(error));
}
