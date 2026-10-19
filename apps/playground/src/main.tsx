/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { startAnalytics } from './analytics';
import { consent } from './consent';
import { App } from './App';
import { startErrorReporting } from './errors';
import { schedulePerformanceSample } from './perf';
import { watchFrameHealth } from './device';
import { TerrainBoundary } from './boundary';
import { resolveRoute } from './route';
import './style.css';

// A public build replaces this with a false constant, so the debug module is left out of the bundle.
if (import.meta.env.VITE_TOPOGRAPHIC_DEBUG === '1') {
  void import('./debug').then((mod) => mod.installDebug());
}

const base = import.meta.env.BASE_URL;
const root = createRoot(document.getElementById('root')!);
const route = resolveRoute(location.pathname, location.search, location.hash, base);
// Unknown paths fall back to index.html on the Worker; send them home, keeping ?analytics_optout and the like.
if (route.page === 'redirect') history.replaceState(null, '', route.to);
if (route.page === 'about') {
  // A separate chunk, so the playground bundle does not grow.
  void import('./About').then(({ About }) => {
    document.title = 'About: topographic';
    root.render(<About home={base} />);
  });
} else {
  root.render(
    <TerrainBoundary>
      <App />
    </TerrainBoundary>,
  );
}

// Without VITE_SENTRY_DSN or VITE_POSTHOG_KEY these are no-ops and the clients are not built in.
startErrorReporting();
startAnalytics();
if (import.meta.env.VITE_POSTHOG_KEY && consent() === 'all') {
  watchFrameHealth();
  schedulePerformanceSample();
}
