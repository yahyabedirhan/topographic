/**
 * The only history writer in the playground.
 *
 * Safari (and iOS Chrome, which is WebKit) throws
 * `SecurityError: Attempt to use history.replaceState() more than 100 times per 10 seconds`
 * and an uncaught throw blanks the React tree. A 3D drag used to write `az` and `ce` on every
 * camera change, which crosses that line in a couple of seconds.
 *
 * Every URL update calls `schedulePageUrl`. Camera drags, the 2D anchor drag, sliders, quality,
 * the dock and the region query all get here through the settings effect or the region effect.
 * The live graphics tier, the loading flag and the dock's own scroll do not write the URL.
 * There is no `pushState` call.
 *
 * Writes are coalesced: a trailing wait of 300 ms from the first change in a burst, and never
 * more than one write per 250 ms (about four a second). `flushPageUrl` runs on pointerup,
 * pointercancel, gestureend and pagehide. An unchanged URL is skipped. A thrown `replaceState`
 * backs off for the Safari window before trying again.
 */

const TRAIL_MS = 300;
const MIN_GAP_MS = 250;
const BACKOFF_MS = 10_000;

let pending: string | null = null;
let timer: ReturnType<typeof setTimeout> | 0 = 0;
let lastWrite = Number.NEGATIVE_INFINITY;
let quietUntil = 0;
let dirtyAt = -1;

const now = () => Date.now();

function here(): string {
  const loc = globalThis.location;
  return `${loc.pathname}${loc.search}${loc.hash}`;
}

function clearTimer(): void {
  if (!timer) return;
  clearTimeout(timer);
  timer = 0;
}

function arm(immediate: boolean): void {
  clearTimer();
  if (pending === null) return;
  const t = now();
  const earliest = Math.max(quietUntil, lastWrite + MIN_GAP_MS);
  const due = immediate ? earliest : Math.max(dirtyAt + TRAIL_MS, earliest);
  const delay = Math.max(0, due - t);
  if (delay === 0) commit();
  else timer = globalThis.setTimeout(commit, delay);
}

function commit(): void {
  timer = 0;
  if (pending === null) return;
  const t = now();
  if (t < quietUntil || t < lastWrite + MIN_GAP_MS) {
    arm(true);
    return;
  }
  const next = pending;
  if (next === here()) {
    pending = null;
    dirtyAt = -1;
    return;
  }
  try {
    globalThis.history.replaceState(null, '', next);
    pending = null;
    dirtyAt = -1;
    lastWrite = now();
  } catch {
    quietUntil = now() + BACKOFF_MS;
    timer = globalThis.setTimeout(commit, BACKOFF_MS);
  }
}

/** Queue a full page URL. Later calls in the same burst replace earlier ones. */
export function schedulePageUrl(next: string): void {
  if (next === here()) {
    if (pending === null) return;
    pending = null;
    dirtyAt = -1;
    clearTimer();
    return;
  }
  if (next === pending) return;
  pending = next;
  if (dirtyAt < 0) dirtyAt = now();
  arm(false);
}

/** Write the queued URL now, still honouring the rate cap and a backoff. */
export function flushPageUrl(): void {
  if (pending === null) return;
  arm(true);
}

/** Pointer-up, pinch-end and page hide flush the URL the gesture finished on. */
export function bindPageUrlFlush(): () => void {
  const flush = () => flushPageUrl();
  window.addEventListener('pointerup', flush, true);
  window.addEventListener('pointercancel', flush, true);
  window.addEventListener('gestureend', flush);
  window.addEventListener('pagehide', flush);
  return () => {
    window.removeEventListener('pointerup', flush, true);
    window.removeEventListener('pointercancel', flush, true);
    window.removeEventListener('gestureend', flush);
    window.removeEventListener('pagehide', flush);
  };
}

/** Test helper. Drops a queued write and the rate-limit clock. */
export function resetPageHistory(): void {
  clearTimer();
  pending = null;
  dirtyAt = -1;
  lastWrite = Number.NEGATIVE_INFINITY;
  quietUntil = 0;
}
