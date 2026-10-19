import { DEFAULT_SHAPE, LOOKS, PARAMS, fromQuery, mergeSettings, resolveSettings, type ParamDef, type Settings, type SettingsInput } from 'topographic';

const VIEW = ['m', 'ink', 'paper', 'mode', 'ex', 'ev', 'dl', 'ql', 'az', 'ce', 'rd', 'cm', 'cs', 'px', 'pz', 'vx', 'vy', 'vz'] as const;

/** Every query key the settings own. `s` is the shape. The region keys belong to region/url.ts. */
export const SETTINGS_KEYS: readonly string[] = ['look', 's', 'seed', ...(PARAMS as readonly ParamDef[]).map((p) => p.short), ...VIEW];

/** The playground draws at the finest detail and the high budget unless the settings name their own. */
export const PLAYGROUND_QUALITY = { detail: 1, quality: 'high' } as const satisfies SettingsInput;

/** The settings for `input` at the playground's quality. A link or a saved terrain that names a detail or budget keeps it. */
export const playgroundSettings = (input: SettingsInput = {}): Settings =>
  mergeSettings(resolveSettings(input), { detail: input.detail ?? PLAYGROUND_QUALITY.detail, quality: input.quality ?? PLAYGROUND_QUALITY.quality });

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const colourOut = (c: string) => HEX.test(c) ? c.slice(1) : c;
const colourIn = (c: string) => HEX.test(`#${c}`) ? `#${c}` : c;

function diff(s: Settings, base: Settings): [string, string][] {
  const out: [string, string][] = [];
  const put = (key: string, a: unknown, b: unknown) => { if (a !== b) out.push([key, String(a)]); };
  put('s', s.shape, base.shape);
  put('seed', s.seed, base.seed);
  for (const p of PARAMS as readonly ParamDef[]) put(p.short, (s[p.group] as Record<string, number>)[p.key], (base[p.group] as Record<string, number>)[p.key]);
  put('m', s.theme.mode, base.theme.mode);
  if (s.theme.ink !== base.theme.ink && s.theme.ink) out.push(['ink', colourOut(s.theme.ink)]);
  if (s.theme.paper !== base.theme.paper && s.theme.paper) out.push(['paper', colourOut(s.theme.paper)]);
  put('mode', s.mode, base.mode);
  put('ex', s.extent, base.extent);
  put('ev', s.elevation, base.elevation);
  put('dl', s.detail, base.detail);
  put('ql', s.quality, base.quality);
  put('az', s.camera.azimuth, base.camera.azimuth);
  put('ce', s.camera.elevation, base.camera.elevation);
  put('rd', s.camera.radius, base.camera.radius);
  put('cm', s.camera.motion, base.camera.motion);
  put('cs', s.camera.speed, base.camera.speed);
  put('px', s.camera.panX, base.camera.panX);
  put('pz', s.camera.panZ, base.camera.panZ);
  put('vx', s.view2d.x, base.view2d.x);
  put('vy', s.view2d.y, base.view2d.y);
  put('vz', s.view2d.zoom, base.view2d.zoom);
  return out;
}

/** What a bare playground URL opens: the built-in Istanbul map terrain, as map-looks.ts decodes it. */
export const HOME_QUERY = 's=gentle-summit&seed=67&lc=36&lw=0&lo=0.9&ix=4&fd=0.15&m=dark&paper=0b0b0d&mode=3d&ex=block&ev=0.12&az=341.6&ce=45.3&rd=1.15&cm=push&cs=0.2&px=-0.005&pz=-0.013&place=istanbul';

/** The settings of a link with a region and no settings keys, which links wrote while a bare URL was fine granite. */
export const REGION_ONLY_QUERY = 'look=fine-granite&mode=3d';

/** The query keys region/url.ts owns. */
const REGION_KEYS = ['region', 'place'];

/** A query with no settings or region keys is the home view: HOME_QUERY, with every other param kept after it. */
export function homeSearch(search: string): string {
  const q = new URLSearchParams(search);
  if ([...SETTINGS_KEYS, ...REGION_KEYS].some((key) => q.has(key))) return search;
  const home = new URLSearchParams(HOME_QUERY);
  for (const [k, v] of q) home.append(k, v);
  return queryText(home);
}

const same = (a: Settings, b: Settings) => !diff(a, b).length && a.theme.ink === b.theme.ink && a.theme.paper === b.theme.paper;

/** The settings as the fewest query params: a diff against the shape defaults or against a library look of the same shape. */
export function settingsParams(s: Settings): [string, string][] {
  const plain = diff(s, { ...playgroundSettings({ shape: s.shape }), shape: DEFAULT_SHAPE });
  let best = plain;
  for (const look of LOOKS) {
    const base = playgroundSettings({ look: look.id });
    if (base.shape !== s.shape) continue;
    const entries: [string, string][] = [['look', look.id], ...diff(s, base)];
    if (entries.length < best.length && same(decode(new URLSearchParams(entries)), s)) best = entries;
  }
  // An empty query means the home view, so every other view names its shape.
  return best.length ? best : [['s', s.shape]];
}

export function readSettings(search: string): Settings {
  const q = new URLSearchParams(homeSearch(search));
  return decode(SETTINGS_KEYS.some((key) => q.has(key)) ? q : new URLSearchParams(REGION_ONLY_QUERY));
}

/** `look=` is a library look by id, as links made before 0.6.0 also wrote it. The other params override it. */
function decode(q: URLSearchParams): Settings {
  for (const key of ['ink', 'paper']) {
    const v = q.get(key);
    if (v) q.set(key, colourIn(v));
  }
  return playgroundSettings(fromQuery(q.toString()));
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
