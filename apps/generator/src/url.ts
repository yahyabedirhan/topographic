import { fromQuery, resolveSettings, toQuery, type Settings } from 'topography';

/** Settings from the current URL (?s=dunes&lc=24...). */
export function readUrl(): Settings {
  return resolveSettings(fromQuery(window.location.search));
}

/** Mirrors settings into the URL without adding history entries. */
export function writeUrl(s: Settings): void {
  const q = toQuery(s);
  const next = `${window.location.pathname}?${q}${window.location.hash}`;
  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(null, '', next);
}

export function shareUrl(s: Settings): string {
  return `${window.location.origin}${window.location.pathname}?${toQuery(s)}`;
}
