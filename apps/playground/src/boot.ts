// Runs once per full page load, from src/layouts/Base.astro, and keeps working across the client router's page
// changes: error reporting, analytics, the frame-health watch and the pageviews of client-side navigations.
import { pageLeft, pageShown, startAnalytics } from './analytics';
import { consent } from './consent';
import { watchFrameHealth } from './device';
import { startErrorReporting } from './errors';
import { schedulePerformanceSample } from './perf';

// A public build replaces this with a false constant, so the debug module is left out of the bundle.
if (import.meta.env.VITE_TOPOGRAPHIC_DEBUG === '1') {
  void import('./debug').then((mod) => mod.installDebug());
}

// Without VITE_SENTRY_DSN or VITE_POSTHOG_KEY these are no-ops and the clients are not built in.
startErrorReporting();
startAnalytics();
if (import.meta.env.VITE_POSTHOG_KEY && consent() === 'all') {
  watchFrameHealth();
  schedulePerformanceSample();
}

document.addEventListener('astro:before-swap', pageLeft);
document.addEventListener('astro:after-swap', pageShown);
