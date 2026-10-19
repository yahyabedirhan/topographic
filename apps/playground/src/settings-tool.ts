import { LOOKS, mergeSettings, type Settings, type SettingsInput } from 'topographic';

const TOP_KEYS = ['look', 'shape', 'seed', 'theme', 'lines', 'terrain', 'motion', 'layout', 'mode', 'elevation', 'extent', 'detail', 'quality', 'camera', 'view2d'];

/** Notes on values that were moved into range, kept, cleared or ignored, for the agent that sent `input`. */
function adjustments(input: Record<string, unknown>, out: Settings): string[] {
  const notes: string[] = [];
  if (typeof input.look === 'string' && !LOOKS.some((l) => l.id === input.look)) notes.push(`ignored unknown look "${input.look}"`);
  if (typeof input.shape === 'string' && input.shape !== out.shape) notes.push(`unknown shape "${input.shape}", kept "${out.shape}"`);
  if (typeof input.mode === 'string' && input.mode !== out.mode) notes.push(`mode: ${JSON.stringify(input.mode)} adjusted to ${out.mode}`);
  if (typeof input.extent === 'string' && input.extent !== out.extent) notes.push(`extent: ${JSON.stringify(input.extent)} adjusted to ${out.extent}`);
  if (typeof input.elevation === 'number' && input.elevation !== out.elevation) notes.push(`elevation: ${input.elevation} adjusted to ${out.elevation}`);
  if (typeof input.detail === 'number' && input.detail !== out.detail) notes.push(`detail: ${input.detail} adjusted to ${out.detail}`);
  if (typeof input.quality === 'string' && input.quality !== out.quality) notes.push(`quality: ${JSON.stringify(input.quality)} adjusted to ${out.quality}`);
  for (const [g, v] of Object.entries(input)) {
    if (!TOP_KEYS.includes(g)) { notes.push(`ignored unknown key "${g}"`); continue; }
    if (v && typeof v === 'object' && g !== 'theme') {
      const gotGroup = out[g as 'lines'] as Record<string, unknown>;
      for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
        const got = gotGroup[k];
        if (got === undefined) notes.push(`ignored unknown key "${g}.${k}"`);
        else if (got !== n) notes.push(`${g}.${k}: ${JSON.stringify(n)} adjusted to ${JSON.stringify(got)}`);
      }
    }
  }
  return notes;
}

/**
 * A new `theme.mode` clears the ink and paper colours the input does not give, as the page's theme
 * button does, so the canvas takes the new mode's colours. Colours given with the mode are kept.
 */
function themeInput(current: Settings, input: SettingsInput): { input: SettingsInput; cleared: ('ink' | 'paper')[] } {
  const theme = input.theme;
  if (!theme || theme.mode === undefined || theme.mode === current.theme.mode) return { input, cleared: [] };
  const cleared = (['ink', 'paper'] as const).filter((k) => !(k in theme) && current.theme[k] !== undefined);
  if (!cleared.length) return { input, cleared };
  return { input: { ...input, theme: { ...theme, ...Object.fromEntries(cleared.map((k) => [k, undefined])) } }, cleared };
}

/** What `set_settings` does: merges `input` into `current` and reports what was adjusted. */
export function applySettingsInput(current: Settings, input: Record<string, unknown>): { next: Settings; adjustments: string[] } {
  const theme = themeInput(current, input as SettingsInput);
  const next = mergeSettings(current, theme.input);
  const notes = adjustments(input, next);
  if (theme.cleared.length) {
    notes.push(`theme.mode changed to ${next.theme.mode}, so the earlier ${theme.cleared.map((k) => `theme.${k}`).join(' and ')} ${theme.cleared.length > 1 ? 'were' : 'was'} cleared and the mode's own colours apply; give them with the mode to keep them`);
  }
  return { next, adjustments: notes };
}
