import { DEFAULT_STYLE, PARAMS, fromQuery, mergeSettings, resolveSettings, type ParamDef, type Settings, type SettingsInput } from 'topographic';
import { LOOKS, type Look } from './looks';

const VIEW = ['m', 'ink', 'paper', 'mode', 'ex', 'ev', 'dl', 'az', 'ce', 'rd', 'cm', 'px', 'pz'] as const;

/** Every query key the settings own. The region keys belong to region/url.ts. */
export const SETTINGS_KEYS: readonly string[] = ['look', 's', 'seed', ...(PARAMS as readonly ParamDef[]).map((p) => p.short), ...VIEW];

export const lookSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const findLook = (slug: string | null): Look | undefined => slug ? LOOKS.find((l) => lookSlug(l.name) === slug) : undefined;

/** The playground's 3D camera for generated terrain. The library's DEFAULT_CAMERA stays as it is. */
export const PLAYGROUND_CAMERA = { azimuth: 349.7, elevation: 33.6, radius: 1.92 } as const;

/**
 * The library defaults, except for the playground's 3D view of generated terrain: endless, from
 * PLAYGROUND_CAMERA. The library defaults stay 'block' and DEFAULT_CAMERA, so exported code states these.
 */
export const baseline = (input: SettingsInput = {}): Settings =>
  mergeSettings(resolveSettings(input), { extent: input.extent ?? 'endless', camera: { ...PLAYGROUND_CAMERA, ...input.camera } });

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const colourOut = (c: string) => HEX.test(c) ? c.slice(1) : c;
const colourIn = (c: string) => HEX.test(`#${c}`) ? `#${c}` : c;

function diff(s: Settings, base: Settings): [string, string][] {
  const out: [string, string][] = [];
  const put = (key: string, a: unknown, b: unknown) => { if (a !== b) out.push([key, String(a)]); };
  put('s', s.style, base.style);
  put('seed', s.seed, base.seed);
  for (const p of PARAMS as readonly ParamDef[]) put(p.short, (s[p.group] as Record<string, number>)[p.key], (base[p.group] as Record<string, number>)[p.key]);
  put('m', s.theme.mode, base.theme.mode);
  if (s.theme.ink !== base.theme.ink && s.theme.ink) out.push(['ink', colourOut(s.theme.ink)]);
  if (s.theme.paper !== base.theme.paper && s.theme.paper) out.push(['paper', colourOut(s.theme.paper)]);
  put('mode', s.mode, base.mode);
  put('ex', s.extent, base.extent);
  put('ev', s.elevation, base.elevation);
  put('dl', s.detail, base.detail);
  put('az', s.camera.azimuth, base.camera.azimuth);
  put('ce', s.camera.elevation, base.camera.elevation);
  put('rd', s.camera.radius, base.camera.radius);
  put('cm', s.camera.motion, base.camera.motion);
  put('px', s.camera.panX, base.camera.panX);
  put('pz', s.camera.panZ, base.camera.panZ);
  return out;
}

const same = (a: Settings, b: Settings) => !diff(a, b).length && a.theme.ink === b.theme.ink && a.theme.paper === b.theme.paper;

/** The settings as the fewest query params: a diff against the style defaults or against a look of the same style. */
export function settingsParams(s: Settings): [string, string][] {
  const plain = diff(s, { ...baseline({ style: s.style }), style: DEFAULT_STYLE });
  let best = plain;
  for (const look of LOOKS) {
    const base = baseline(look.settings);
    if (base.style !== s.style) continue;
    const entries: [string, string][] = [['look', lookSlug(look.name)], ...diff(s, base)];
    if (entries.length < best.length && same(decode(new URLSearchParams(entries)), s)) best = entries;
  }
  return best;
}

export const readSettings = (search: string): Settings => decode(new URLSearchParams(search));

function decode(q: URLSearchParams): Settings {
  const look = findLook(q.get('look'));
  const base = baseline(look ? look.settings : { style: q.get('s') ?? undefined });
  for (const key of ['ink', 'paper']) {
    const v = q.get(key);
    if (v) q.set(key, colourIn(v));
  }
  return mergeSettings(base, fromQuery(q.toString()));
}

/** A query string that keeps commas readable. */
export const queryText = (q: URLSearchParams) => q.toString().replace(/%2C/gi, ',');

/** Replaces the settings keys in a query string and keeps every other param after them. */
export function writeSettings(search: string, s: Settings): string {
  const rest = new URLSearchParams(search);
  for (const key of SETTINGS_KEYS) rest.delete(key);
  const q = new URLSearchParams(settingsParams(s));
  for (const [k, v] of rest) q.append(k, v);
  return queryText(q);
}

export const withQuery = (path: string, query: string, hash = '') => `${path}${query ? `?${query}` : ''}${hash}`;
