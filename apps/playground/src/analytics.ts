/**
 * Product analytics for the playground. It is built in only when `VITE_POSTHOG_KEY` is set.
 * Without a key, `track` does nothing and posthog-js is not part of the build.
 *
 * PostHog runs cookieless (`persistence: 'memory'`, `cookieless_mode: 'always'`), with no session recording and no autocapture.
 * Events carry only the small, fixed properties typed below: never free text, colours or the URL state.
 */

import { superProperties } from './device';
import { consent, safeStore, setConsent, type Consent } from './consent';
import { visitorId } from './visitor';

export type ExportFormat = 'link' | 'png' | 'video' | 'react' | 'html' | 'json';
export type PanelName = 'map' | 'tune' | 'export';
export type ViewMode = '2d' | '3d';
export type ImageVariant = 'screen' | 'phone' | '1080p';
export type VideoMotion = 'orbit' | 'push' | 'flyover' | 'drone';
export type VideoContainer = 'mp4' | 'webm';
export type ColourSlot = 'paper' | 'ink';
export type QualityLevel = 'auto' | 'low' | 'medium' | 'high';

interface VideoProps {
  motion: VideoMotion;
  container: VideoContainer;
  duration_s: number;
  fps: number;
  width: number;
  height: number;
}

/**
 * Every custom event the playground sends, with its properties. Names are snake_case object_action.
 * Pageview and pageleave are PostHog's own `$pageview` and `$pageleave`.
 */
export interface AnalyticsEvents {
  ui_click: { section: 'header'; target: 'github' | 'site'; href: string; outbound: boolean };
  view_mode_changed: { from: ViewMode; to: ViewMode };
  panel_opened: { panel: PanelName; tab?: string };
  panel_closed: { panel: PanelName; open_ms: number; tab?: string };
  export_tab_changed: { from: ExportFormat; to: ExportFormat; from_ms: number };
  dock_item_clicked: { kind: 'look' | 'map_look' | 'saved'; preset: string; index: number };
  saved_terrain_deleted: { index: number };
  place_applied: { place: string };
  region_loaded: { ms: number; ok: boolean; place: string; tiles: number | null };
  setting_changed: { group: string; key: string };
  quality_changed: { setting: 'detail' | 'budget'; value: string };
  theme_toggled: { to: 'light' | 'dark' };
  shuffle_clicked: { target: 'all' | ColourSlot };
  colour_changed: { slot: ColourSlot; source: 'picker' | 'swatch' | 'hex' };
  link_copied: { params_count: number };
  code_copied: { lang: 'react' | 'html' | 'json' | 'install' };
  export_image_downloaded: { variant: ImageVariant; format: 'png'; width: number; height: number; style: string; theme: string; mode: ViewMode; duration_ms: number };
  export_image_failed: { variant: ImageVariant; error: string; duration_ms: number };
  export_video_started: VideoProps;
  export_video_completed: VideoProps & { prepare_ms: number; size_bytes: number };
  export_video_failed: VideoProps & { prepare_ms: number; error: string };
  performance_sample: PerformanceSample;
  low_performance_prompt_shown: { fps: number; view_mode: ViewMode; detail: 'low' | 'medium' | 'high'; budget: QualityLevel };
  low_performance_prompt_clicked: Record<string, never>;
  analytics_opted_out: { from: Exclude<Consent, 'none'> };
}

/** One frame-rate summary per visit, sent about 20 s in. */
export interface PerformanceSample {
  fps_median: number | null;
  fps_p10: number | null;
  refresh_hz: number | null;
  quality_tier: string | null;
  viewport: string;
  dpr: number;
  gpu: string | null;
  device_memory: number | null;
  browser: string;
  platform: 'mobile' | 'desktop';
  os: string;
  long_frames: number | null;
  context_losses: number;
  first_frame_ms: number | null;
  view_mode: ViewMode;
}

/** Properties registered once on every event after init. */
export interface SuperProperties {
  site: 'topographic';
  app: 'topographic';
  app_version: string;
  viewport_class: 'phone' | 'tablet' | 'desktop';
  is_mobile: boolean;
  platform: 'mobile' | 'desktop';
  os: string;
  initial_view_mode: ViewMode;
  /** The random id saved in this browser, sent only while the visitor has not opted out. */
  visitor_id?: string;
}

/** Event names, for tests and for checks that the map stays the single source. */
export const EVENT_NAMES = [
  'ui_click', 'view_mode_changed', 'panel_opened', 'panel_closed', 'export_tab_changed', 'dock_item_clicked',
  'saved_terrain_deleted', 'place_applied', 'region_loaded', 'setting_changed', 'quality_changed', 'theme_toggled',
  'shuffle_clicked', 'colour_changed', 'link_copied', 'code_copied', 'export_image_downloaded', 'export_image_failed',
  'export_video_started', 'export_video_completed', 'export_video_failed', 'performance_sample', 'low_performance_prompt_shown',
  'low_performance_prompt_clicked', 'analytics_opted_out',
] as const satisfies readonly (keyof AnalyticsEvents)[];

/** A short, fixed error label: the message's first line, without the library prefix, capped. */
export function errorLabel(error: unknown): string {
  const text = error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown';
  return text.replace('[topographic] ', '').split('\n')[0].slice(0, 80) || 'unknown';
}

/**
 * Collapses a burst of calls with the same key into one call `ms` after the last, with the last args.
 * Used for colour pickers and sliders, so a drag sends one event on commit.
 */
export function createDebouncer(ms: number, schedule = (fn: () => void, t: number) => setTimeout(fn, t) as unknown as number, cancel = (id: number) => clearTimeout(id)) {
  const timers: Record<string, number> = {};
  return (key: string, fn: () => void): void => {
    if (timers[key] !== undefined) cancel(timers[key]);
    timers[key] = schedule(() => { delete timers[key]; fn(); }, ms);
  };
}

export type AnalyticsEvent = keyof AnalyticsEvents;
type Capture = (event: string, props: Record<string, unknown>) => void;
export const debounced = createDebouncer(1200);
type Loader = (key: string, host: string) => Promise<Capture | null>;

export const DEFAULT_HOST = 'https://eu.i.posthog.com';

/** A tracker that queues events until the client loads. With no key it is a no-op and never loads. */
export function createTracker(key: string | undefined, host: string, load: Loader) {
  let capture: Capture | null = null;
  let queue: [string, Record<string, unknown>][] | null = key ? [] : null;
  let started = false;
  let stopped = false;
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
      if (!key || stopped) return;
      try {
        if (capture) capture(event, props as Record<string, unknown>);
        else if (queue && queue.length < 50) queue.push([event, props as Record<string, unknown>]);
      } catch { /* analytics never breaks the page */ }
    },
    /** Sends nothing more from this page. Events already queued still go out once the client loads. */
    stop(): void { stopped = true; },
  };
}

function doNotTrack(): boolean {
  const nav = navigator as Navigator & { msDoNotTrack?: string };
  const w = window as Window & { doNotTrack?: string };
  return [nav.doNotTrack, nav.msDoNotTrack, w.doNotTrack].some((v) => v === '1' || v === 'yes');
}

const KEY = import.meta.env.VITE_POSTHOG_KEY || undefined;
const HOST = import.meta.env.VITE_POSTHOG_HOST || DEFAULT_HOST;

let posthogLoaded = false;

// With `?optout=all` saved, the client is never loaded.
const tracker = createTracker(consent() === 'none' ? undefined : KEY, HOST, async (key, host) => {
  if (doNotTrack()) return null;
  const { startPostHog } = await import('./posthog');
  posthogLoaded = true;
  const props = superProperties();
  if (consent() === 'all') props.visitor_id = visitorId(safeStore());
  return startPostHog(key, host, props);
});

/** Sends one event. Does nothing in a build without a key. */
export function track<E extends AnalyticsEvent>(event: E, ...props: AnalyticsEvents[E] extends Record<string, never> ? [] : [AnalyticsEvents[E]]): void {
  if (!KEY || consent() !== 'all') return;
  tracker.track(event, (props[0] ?? {}) as AnalyticsEvents[E]);
}

/** True when this build can send analytics and the visitor has not opted out of everything. */
export function analyticsActive(): boolean {
  return Boolean(KEY) && consent() !== 'none';
}

/** Lowers the choice to `to`. From all, sends one final `analytics_opted_out` event first. Custom events stop at once. */
export function optOut(to: 'pageviews' | 'none' = 'none'): void {
  const from = consent();
  if (from === 'none' || from === to) return;
  if (KEY && from === 'all') {
    tracker.track('analytics_opted_out', { from });
    tracker.start();
    if (to === 'none') tracker.stop();
  } else if (KEY && to === 'none') tracker.stop();
  setConsent(to);
  // Pageviews only keeps PostHog running on this page, so it must stop sending the deleted id too.
  if (posthogLoaded && to === 'pageviews') import('./posthog').then((m) => m.dropVisitorId()).catch(() => {});
}

/** Clears the saved choice. Analytics start again on the next page load. */
export function optIn(): void { setConsent('all'); }

/** Sends one event once input on `key` has been quiet for a moment, with the latest props. */
export function trackDebounced<E extends AnalyticsEvent>(key: string, event: E, props: AnalyticsEvents[E]): void {
  if (!KEY || consent() !== 'all') return;
  debounced(key, () => { if (consent() === 'all') tracker.track(event, props); });
}

/** Loads PostHog once the page is idle after the first paint. */
export function startAnalytics(): void {
  if (!KEY || consent() === 'none') return;
  const go = () => tracker.start();
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  const later = () => (idle ? idle(go, { timeout: 4000 }) : window.setTimeout(go, 1500));
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
}
