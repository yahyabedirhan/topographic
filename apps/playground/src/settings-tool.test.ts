import { describe, expect, it } from 'vitest';
import { resolveSettings } from 'topographic';
import { applySettingsInput } from './settings-tool';

const coloured = resolveSettings({ style: 'granite', theme: { mode: 'dark', paper: '#0b0b0d', ink: '#d7d2c8' } });

describe('set_settings input', () => {
  it('clears the earlier colours when only the theme mode changes, and says so', () => {
    const { next, adjustments } = applySettingsInput(coloured, { theme: { mode: 'light' } });
    expect(next.theme).toEqual({ mode: 'light', ink: undefined, paper: undefined });
    expect(adjustments).toHaveLength(1);
    expect(adjustments[0]).toMatch(/theme\.ink and theme\.paper were cleared/);
  });

  it('keeps the colours given with the new mode', () => {
    const { next, adjustments } = applySettingsInput(coloured, { theme: { mode: 'light', paper: '#f7f4ee' } });
    expect(next.theme).toEqual({ mode: 'light', ink: undefined, paper: '#f7f4ee' });
    expect(adjustments).toEqual([expect.stringMatching(/earlier theme\.ink was cleared/)]);
  });

  it('keeps the colours when the mode stays the same or is not given', () => {
    expect(applySettingsInput(coloured, { theme: { mode: 'dark' } })).toEqual({ next: coloured, adjustments: [] });
    expect(applySettingsInput(coloured, { lines: { count: 40 } }).next.theme).toEqual(coloured.theme);
  });

  it('reports clamped values and unknown keys', () => {
    const { next, adjustments } = applySettingsInput(coloured, { camera: { elevation: 90 }, nope: 1 });
    expect(next.camera.elevation).toBe(80);
    expect(adjustments).toEqual(['camera.elevation: 90 adjusted to 80', 'ignored unknown key "nope"']);
  });
});
