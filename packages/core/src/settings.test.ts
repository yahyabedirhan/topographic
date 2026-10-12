import { afterEach, describe, expect, it, vi } from 'vitest';
import { PARAMS } from './params.js';
import { PRESETS } from './presets.js';
import { STYLES } from './styles.js';
import { fromAttributes, fromQuery, mergeSettings, resetWarnings, resolveSettings, toAttributes, toQuery, toUniforms } from './settings.js';

afterEach(() => { resetWarnings(); vi.restoreAllMocks(); });

describe('params table', () => {
  it('has unique keys, attributes, short keys and slots', () => {
    for (const field of ['attr', 'short'] as const) expect(new Set(PARAMS.map((p) => p[field])).size).toBe(PARAMS.length);
    expect(new Set(PARAMS.map((p) => `${p.group}.${p.key}`)).size).toBe(PARAMS.length);
    expect(new Set(PARAMS.map((p) => p.slot)).size).toBe(PARAMS.length);
  });
  it('defaults sit inside their ranges', () => {
    for (const p of PARAMS) { expect(p.default).toBeGreaterThanOrEqual(p.min); expect(p.default).toBeLessThanOrEqual(p.max); }
  });
});

describe('resolveSettings', () => {
  it('fills defaults', () => {
    const s = resolveSettings();
    expect(s.style).toBe('drifting-lobes');
    expect(s.lines.count).toBe(30);
    expect(s.theme.mode).toBe('auto');
  });
  it('clamps and rounds', () => {
    const s = resolveSettings({ lines: { count: 500, opacity: -2, indexEvery: 2.6 } });
    expect(s.lines).toMatchObject({ count: 60, opacity: 0, indexEvery: 3 });
  });
  it('replaces non-numbers with the default', () => {
    expect(resolveSettings({ lines: { count: Number.NaN } }).lines.count).toBe(30);
  });
  it('falls back from an unknown style and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveSettings({ style: 'volcano' }).style).toBe('drifting-lobes');
    resolveSettings({ style: 'volcano' });
    expect(warn).toHaveBeenCalledTimes(1);
  });
  it('applies style defaults under user values', () => {
    expect(resolveSettings({ style: 'dunes' }).layout.fade).toBe(0.5);
    expect(resolveSettings({ style: 'dunes', layout: { fade: 0.9 } }).layout.fade).toBe(0.9);
  });
  it('resolves every preset to its own style', () => {
    for (const p of PRESETS) expect(resolveSettings(p.settings).style).toBe(p.settings.style);
  });
});

describe('mergeSettings', () => {
  it('merges a partial update without touching other groups', () => {
    const a = resolveSettings({ terrain: { roughness: 0.3 } });
    const b = mergeSettings(a, { lines: { count: 12 } });
    expect(b.lines.count).toBe(12);
    expect(b.terrain.roughness).toBe(0.3);
    expect(a.lines.count).toBe(30);
  });
});

describe('toUniforms', () => {
  it('maps values into shader slots with the style index', () => {
    const u = toUniforms(resolveSettings({ style: 'dunes', layout: { anchor: 1 } }));
    expect(u.uStyle).toBe(11);
    expect(u.uParams[0]).toBe(30);
    expect(u.uParams[1]).toBeCloseTo(1.41);
    expect(u.uParams[10]).toBeCloseTo(1);
    expect(u.uCenter).toBe(1);
  });
  it('uses the prototype style indices', () => {
    expect(STYLES.map((s) => s.index)).toEqual([0, 1, 3, 4, 5, 7, 11]);
  });
});

describe('serialisation', () => {
  it('round-trips through the URL query', () => {
    const s = resolveSettings({ style: 'granite', seed: 42, lines: { count: 18 }, theme: { mode: 'dark', paper: 'transparent' } });
    const q = toQuery(s);
    expect(q).toContain('s=granite');
    expect(resolveSettings(fromQuery(q))).toEqual(s);
  });
  it('round-trips through element attributes', () => {
    const s = resolveSettings({ style: 'seed-pod', terrain: { peaks: 3 }, motion: { speed: 0 } });
    const attrs = toAttributes(s);
    expect(attrs).toMatchObject({ 'style-name': 'seed-pod', peaks: '3', speed: '0' });
    expect(resolveSettings(fromAttributes((n) => attrs[n] ?? null))).toEqual(s);
  });
});
