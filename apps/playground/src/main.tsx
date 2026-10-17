/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { startAnalytics } from './analytics';
import { App } from './App';
import { TerrainBoundary } from './boundary';
import './style.css';

// A public build replaces this with a false constant, so the debug module is left out of the bundle.
if (import.meta.env.VITE_TOPOGRAPHIC_DEBUG === '1') {
  void import('./debug').then((mod) => mod.installDebug());
}

createRoot(document.getElementById('root')!).render(
  <TerrainBoundary>
    <App />
  </TerrainBoundary>,
);

// Without VITE_POSTHOG_KEY this is a no-op and PostHog is not built in.
startAnalytics();
