/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to `1` at build time to include the playground debug heartbeat. Unset in public builds. */
  readonly VITE_TOPOGRAPHIC_DEBUG?: string;
}
