/** The Sentry client, in its own chunk. Imported only by `errors.ts` in a build with a DSN. */
import * as Sentry from '@sentry/browser';
import type { BrowserOptions } from '@sentry/browser';
import type { Reporter } from './errors';
import { TRANSITION_ABORTED } from './report-filter';

/**
 * Absolute prefix of this build's own scripts. Astro emits them at `<base>_astro/`
 * (`https://topographic.yahyapak.dev/_astro/` in production). GitHub Pages only redirects
 * and does not serve the app, so its path is not included.
 */
export function playgroundScriptRoot(): string {
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${location.origin}${prefix}_astro/`;
}

/** `transport` is for tests that read the outgoing envelope. Production leaves it unset. */
export function startSentry(
  dsn: string,
  maxEvents: number,
  transport?: BrowserOptions['transport'],
): Reporter {
  let sent = 0;
  Sentry.init({
    dsn,
    sampleRate: 1,
    // `@sentry/browser` 11 has no `sendDefaultPii`. `userInfo: false` is what sets `infer_ip: 'never'`,
    // so Sentry does not store the visitor's IP or a location derived from it.
    // The query string holds the shared settings, so it stays out too.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, urlQueryParams: false, httpBodies: [] },
    ignoreErrors: [TRANSITION_ABORTED],
    // Scripts a browser, an in-app browser, a translation tool or an extension injects run from other URLs.
    // An error with no stack frame is still sent.
    allowUrls: [playgroundScriptRoot()],
    // Errors only: no tracing and no replay integrations are added.
    tracesSampleRate: 0,
    integrations: (defaults) => defaults.filter((i) => i.name !== 'BrowserSession'),
    ...(transport ? { transport } : {}),
    beforeSend(event) {
      // Window errors caught by Sentry itself also count against the per-page cap.
      sent += 1;
      if (sent > maxEvents) return null;
      if (event.request?.url) event.request.url = event.request.url.split(/[?#]/)[0];
      return event;
    },
  });
  return {
    report(r) {
      const scope = { tags: r.context };
      if (r.kind === 'error') Sentry.captureException(r.error, scope);
      else Sentry.captureMessage(r.message, { level: 'warning', ...scope });
    },
  };
}
