/**
 * Error reporting. It is built in only when `VITE_SENTRY_DSN` is set; without it every call here
 * does nothing and @sentry/browser is not part of the build.
 *
 * Until Sentry loads, a small buffer keeps the first few window errors and rejections, then hands
 * them over. At most `MAX_EVENTS` reports leave one page, so a failing device cannot flood the quota.
 */
import { gpuName, qualityTier } from './device';
import { consent } from './consent';

export const MAX_EVENTS = 10;

type Report =
  | { kind: 'error'; error: unknown; context?: Record<string, string> }
  | { kind: 'message'; message: string; context?: Record<string, string> };

export interface Reporter {
  report(r: Report): void;
}

/** Holds reports until a reporter arrives, capped at `max`, and counts every report against `max`. */
export function createErrorQueue(enabled: boolean, max = MAX_EVENTS) {
  let sink: Reporter | null = null;
  const early: Report[] = [];
  let sent = 0;
  return {
    push(r: Report): void {
      if (!enabled || sent >= max) return;
      sent += 1;
      if (sink) { try { sink.report(r); } catch { /* never throw from reporting */ } }
      else early.push(r);
    },
    attach(next: Reporter): void {
      sink = next;
      for (const r of early.splice(0)) { try { next.report(r); } catch { /* ignore */ } }
    },
    get pending(): number { return early.length; },
  };
}

// Any opt out (`?optout` or `?optout=all`) also turns error reports off.
const DSN = (consent() === 'all' && import.meta.env.VITE_SENTRY_DSN) || undefined;
const queue = createErrorQueue(Boolean(DSN));

function tags(): Record<string, string> {
  return { quality_tier: qualityTier() ?? 'unknown', gpu: gpuName() ?? 'unknown' };
}

/** Reports a caught error, such as one from the React error boundary. */
export function reportError(error: unknown, context?: Record<string, string>): void {
  if (!DSN) return;
  queue.push({ kind: 'error', error, context: { ...tags(), ...context } });
}

/** Reports a notable event that is not an exception, such as a lost WebGL context. */
export function reportMessage(message: string, context?: Record<string, string>): void {
  if (!DSN) return;
  queue.push({ kind: 'message', message, context: { ...tags(), ...context } });
}

/** Starts the early buffer now and loads Sentry once the page is idle after the first paint. */
export function startErrorReporting(): void {
  if (!DSN) return;
  const dsn = DSN;
  let loaded = false;
  const onError = (e: ErrorEvent) => { if (!loaded) reportError(e.error ?? e.message, { source: 'window.error' }); };
  const onRejection = (e: PromiseRejectionEvent) => { if (!loaded) reportError(e.reason, { source: 'unhandledrejection' }); };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  // The event does not bubble, so listen in the capture phase for every canvas.
  window.addEventListener('webglcontextlost', () => reportMessage('webglcontextlost'), true);
  const go = () => {
    void import('./sentry').then(({ startSentry }) => {
      const reporter = startSentry(dsn, MAX_EVENTS);
      loaded = true;
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      queue.attach(reporter);
    }).catch(() => {});
  };
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  const later = () => (idle ? idle(go, { timeout: 4000 }) : window.setTimeout(go, 1500));
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
}
