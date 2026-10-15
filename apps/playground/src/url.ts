import { GROUPS, fromQuery, paramsIn, resolveSettings, type Settings, type SettingsInput } from 'topography.js';

export function configOf(s: Settings): SettingsInput & { style: string } {
  const d = resolveSettings({ style: s.style });
  const out: Record<string, unknown> = { style: s.style };
  if (s.seed) out.seed = s.seed;
  for (const g of GROUPS) {
    const changed = Object.fromEntries(paramsIn(g)
      .map((p) => [p.key, (s[g] as Record<string, number>)[p.key]] as const)
      .filter(([k, v]) => v !== (d[g] as Record<string, number>)[k]));
    if (Object.keys(changed).length) out[g] = changed;
  }
  const theme = Object.fromEntries(Object.entries(s.theme).filter(([k, v]) => v !== undefined && !(k === 'mode' && v === 'auto')));
  if (Object.keys(theme).length) out.theme = theme;
  return out as SettingsInput & { style: string };
}

export function readUrl(search = window.location.search): Settings {
  const q = new URLSearchParams(search);
  const json = q.get('config');
  if (json) {
    try { return resolveSettings(JSON.parse(json) as SettingsInput); } catch { }
  }
  return resolveSettings(fromQuery(search));
}

export function urlFor(s: Settings): string {
  return `${window.location.pathname}?config=${encodeURIComponent(JSON.stringify(configOf(s)))}${window.location.hash}`;
}

export function writeUrl(s: Settings): void {
  const next = urlFor(s);
  if (next !== window.location.pathname + window.location.search + window.location.hash) window.history.replaceState(null, '', next);
}

export const shareUrl = (s: Settings) => window.location.origin + urlFor(s).replace(window.location.hash, '');
