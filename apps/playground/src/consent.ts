/**
 * The visitor's analytics choice, kept in this browser's local storage.
 *
 * - `?optout` keeps pageviews and pageleaves only: no custom events and no error reports.
 * - `?optout=all` sends nothing: the analytics and error clients are not loaded.
 * - `?optin` clears the choice.
 *
 * The parameter is removed from the address bar once it is read, so it does not end up in shared links.
 */

export type Consent = 'all' | 'pageviews' | 'none';
export const CONSENT_KEY = 'topographic:analytics';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function safeStore(): Store | null {
  try { return window.localStorage; } catch { return null; }
}

/** Reads the choice from the query string, saves it, and falls back to the saved value. */
export function resolveConsent(search: string, store: Store | null): { consent: Consent; handled: string | null } {
  const q = new URLSearchParams(search);
  const handled = q.has('optin') ? 'optin' : q.has('optout') ? 'optout' : null;
  try {
    if (handled === 'optin') store?.removeItem(CONSENT_KEY);
    else if (handled === 'optout') store?.setItem(CONSENT_KEY, q.get('optout') === 'all' ? 'none' : 'pageviews');
  } catch { /* storage can be blocked; the choice then lasts for this page only */ }
  if (handled === 'optin') return { consent: 'all', handled };
  if (handled === 'optout') return { consent: q.get('optout') === 'all' ? 'none' : 'pageviews', handled };
  let saved: string | null = null;
  try { saved = store?.getItem(CONSENT_KEY) ?? null; } catch { /* ignore */ }
  return { consent: saved === 'none' || saved === 'pageviews' ? saved : 'all', handled };
}

function initial(): Consent {
  if (typeof window === 'undefined') return 'all';
  const { consent, handled } = resolveConsent(window.location.search, safeStore());
  if (handled) {
    const url = new URL(window.location.href);
    url.searchParams.delete(handled);
    try { window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash); } catch { /* ignore */ }
  }
  return consent;
}

let current: Consent = initial();

export function consent(): Consent { return current; }

/** Saves a new choice for this browser. Takes effect for analytics now; a reload applies it fully. */
export function setConsent(next: Consent): void {
  current = next;
  const store = safeStore();
  try {
    if (next === 'all') store?.removeItem(CONSENT_KEY);
    else store?.setItem(CONSENT_KEY, next);
  } catch { /* ignore */ }
}
