import { GROUPS, paramsIn, resolveSettings, type Settings, type SettingsInput } from 'topographic';
import { PLAYGROUND_QUALITY, readSettings, withQuery, writeSettings } from './share-url';

/**
 * The settings that differ from the landform's defaults. The playground's own detail and budget are left out too,
 * so an embed at those keeps the library's defaults and follows each visitor's device.
 */
export function configOf(s: Settings): SettingsInput & { landform: string } {
  const d = resolveSettings({ landform: s.landform });
  const out: Record<string, unknown> = { landform: s.landform };
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
  if (s.detail !== d.detail && s.detail !== PLAYGROUND_QUALITY.detail) out.detail = s.detail;
  if (s.quality !== d.quality && s.quality !== PLAYGROUND_QUALITY.quality) out.quality = s.quality;
  const camera = Object.fromEntries((['azimuth', 'elevation', 'radius', 'motion', 'panX', 'panZ'] as const)
    .filter((k) => s.camera[k] !== d.camera[k])
    .map((k) => [k, s.camera[k]]));
  if (Object.keys(camera).length) out.camera = camera;
  const view2d = Object.fromEntries((['x', 'y', 'zoom'] as const).filter((k) => s.view2d[k] !== d.view2d[k]).map((k) => [k, s.view2d[k]]));
  if (Object.keys(view2d).length) out.view2d = view2d;
  return out as SettingsInput & { landform: string };
}

export const readUrl = (search = window.location.search): Settings => readSettings(search);

/** The page URL for these settings. It keeps the region params already in the page URL. */
export const shareUrl = (s: Settings, loc: Pick<Location, 'origin' | 'pathname' | 'search'> = window.location) =>
  withQuery(loc.origin + loc.pathname, writeSettings(loc.search, s));
