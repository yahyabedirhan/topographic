/** The PostHog client, in its own chunk. Imported only by `analytics.ts` in a build with a key. */
// The slim build has capture, pageview and pageleave, without replay, surveys or the toolbar.
import posthog from 'posthog-js/dist/module.slim';

export function startPostHog(key: string, host: string): (event: string, props: Record<string, unknown>) => void {
  posthog.init(key, {
    api_host: host,
    persistence: 'memory',
    disable_session_recording: true,
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    respect_dnt: true,
    disable_surveys: true,
  });
  return (event, props) => { posthog.capture(event, props); };
}
