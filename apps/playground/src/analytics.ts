/**
 * Product analytics for the playground. It is built in only when `VITE_POSTHOG_KEY` is set.
 * Without a key, `track` does nothing and posthog-js is not part of the build.
 *
 * PostHog runs cookieless (`persistence: 'memory'`), with no session recording and no autocapture.
 * Events carry only the small, fixed properties typed below: never free text, colours or the URL state.
 */

export type ExportFormat = 'link' | 'png' | 'video' | 'react' | 'html' | 'json';

/** Every event the playground sends, with its properties. */
export interface AnalyticsEvents {
  dice_clicked: { target: 'shuffle' | 'paper' | 'ink' };
  export_clicked: { format: ExportFormat };
  style_changed: { style: string };
  theme_toggled: { mode: 'light' | 'dark' };
  link_copied: Record<string, never>;
  place_opened: { place: string };
  view_mode_changed: { mode: '2d' | '3d' };
  quality_changed: { quality: string };
}

export type AnalyticsEvent = keyof AnalyticsEvents;
type Capture = (event: string, props: Record<string, unknown>) => void;
type Loader = (key: string, host: string) => Promise<Capture | null>;

export const DEFAULT_HOST = 'https://eu.i.posthog.com';

/** A tracker that queues events until the client loads. With no key it is a no-op and never loads. */
export function createTracker(key: string | undefined, host: string, load: Loader) {
  let capture: Capture | null = null;
  let queue: [string, Record<string, unknown>][] | null = key ? [] : null;
  let started = false;
  return {
    enabled: Boolean(key),
    start(): void {
      if (!key || started) return;
      started = true;
      load(key, host).then((c) => {
        capture = c;
        const pending = queue ?? [];
        queue = null;
        if (c) for (const [e, p] of pending) c(e, p);
      }).catch(() => { queue = null; });
    },
    track<E extends AnalyticsEvent>(event: E, props: AnalyticsEvents[E]): void {
      if (!key) return;
      try {
        if (capture) capture(event, props);
        else if (queue && queue.length < 50) queue.push([event, props]);
      } catch { /* analytics never breaks the page */ }
    },
  };
}

function doNotTrack(): boolean {
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  const w = window as Window & { doNotTrack?: string };
  return [nav.doNotTrack, nav.msDoNotTrack, w.doNotTrack].some((v) => v === '1' || v === 'yes');
}

const KEY = import.meta.env.VITE_POSTHOG_KEY || undefined;
const HOST = import.meta.env.VITE_POSTHOG_HOST || DEFAULT_HOST;

const tracker = createTracker(KEY, HOST, async (key, host) => {
  if (doNotTrack()) return null;
  const { startPostHog } = await import('./posthog');
  return startPostHog(key, host);
});

/** Sends one event. Does nothing in a build without a key. */
export function track<E extends AnalyticsEvent>(event: E, ...props: AnalyticsEvents[E] extends Record<string, never> ? [] : [AnalyticsEvents[E]]): void {
  if (!KEY) return;
  tracker.track(event, (props[0] ?? {}) as AnalyticsEvents[E]);
}

/** Loads PostHog once the page is idle after the first paint. */
export function startAnalytics(): void {
  if (!KEY) return;
  const go = () => tracker.start();
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  const later = () => (idle ? idle(go, { timeout: 4000 }) : window.setTimeout(go, 1500));
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
}
