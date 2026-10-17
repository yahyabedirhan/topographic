/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to `1` at build time to include the playground debug heartbeat. Unset in public builds. */
  readonly VITE_TOPOGRAPHIC_DEBUG?: string;
  /** PostHog project key. Unset means no analytics and no PostHog code in the build. */
  readonly VITE_POSTHOG_KEY?: string;
  /** PostHog ingest host. Defaults to https://eu.i.posthog.com. */
  readonly VITE_POSTHOG_HOST?: string;
  /** Sentry DSN. Unset means no error reporting and no Sentry code in the build. */
  readonly VITE_SENTRY_DSN?: string;
}

/** The `topographic` package version, set at build time. */
declare const __APP_VERSION__: string;
