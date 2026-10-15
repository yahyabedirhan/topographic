import { GROUPS, paramsIn, resolveSettings, type Settings, type SettingsInput } from 'topographic';
import { readSettings, withQuery, writeSettings } from './share-url';

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
  if (s.mode !== d.mode) out.mode = s.mode;
  if (s.elevation !== d.elevation) out.elevation = s.elevation;
  if (s.extent !== d.extent) out.extent = s.extent;
  if (s.detail !== d.detail) out.detail = s.detail;
  const camera = Object.fromEntries((['azimuth', 'elevation', 'radius', 'motion'] as const)
    .filter((k) => s.camera[k] !== d.camera[k])
    .map((k) => [k, s.camera[k]]));
  if (Object.keys(camera).length) out.camera = camera;
  return out as SettingsInput & { style: string };
}

export const readUrl = (search = window.location.search): Settings => readSettings(search);

/** The page URL for these settings. It keeps the region params already in the page URL. */
export const shareUrl = (s: Settings, loc: Pick<Location, 'origin' | 'pathname' | 'search'> = window.location) =>
  withQuery(loc.origin + loc.pathname, writeSettings(loc.search, s));
