import { afterEach, describe, expect, it, vi } from 'vitest';
import { stepBlend, type BlendState } from './renderer.js';
import { DEFAULT_COLUMN, MAX_SCENES, fromAttributes, mergeSettings, resetWarnings, resolveSettings, toAttributes } from './settings.js';
import { tierFor } from './quality.js';
import { THEME_DEFAULTS, mixTheme, resolveTheme } from './theme.js';
import { TOPOGRAPHIC_FRAGMENT } from './shader/topographic.glsl.js';

afterEach(() => { resetWarnings(); vi.restoreAllMocks(); });

describe('scenes settings', () => {
  it('defaults to no scenes, scene 0 and a 300 px column', () => {
    const s = resolveSettings();
    expect(s.scenes).toEqual([]);
    expect(s.scene).toBe(0);
    expect(s.column).toBe(DEFAULT_COLUMN);
    expect(DEFAULT_COLUMN).toBe(300);
  });
  it('resolves each scene shape and keeps its ink', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = resolveSettings({ scenes: [{ shape: 'dunes', ink: '#f80' }, { shape: 'volcano' }, { shape: 'long-ridge', ink: '  ' }], scene: 2 });
    expect(s.scenes).toEqual([{ shape: 'dunes', ink: '#f80' }, { shape: 'drifting-lobes' }, { shape: 'long-ridge' }]);
    expect(s.scene).toBe(2);
    expect(warn).toHaveBeenCalledOnce();
  });
  it('keeps the target scene inside the list', () => {
    expect(resolveSettings({ scenes: [{ shape: 'dunes' }, { shape: 'granite' }], scene: 7 }).scene).toBe(1);
    expect(resolveSettings({ scenes: [{ shape: 'dunes' }], scene: -3 }).scene).toBe(0);
    expect(resolveSettings({ scenes: [{ shape: 'dunes' }, { shape: 'granite' }], scene: 1.4 }).scene).toBe(1);
    const s = resolveSettings({ scenes: [{ shape: 'dunes' }, { shape: 'granite' }, { shape: 'seed-pod' }], scene: 2 });
    expect(mergeSettings(s, { scenes: [{ shape: 'dunes' }] }).scene).toBe(0);
  });
  it(`blends at most ${MAX_SCENES} scenes`, () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = resolveSettings({ scenes: Array.from({ length: 12 }, () => ({ shape: 'dunes' })) });
    expect(s.scenes).toHaveLength(MAX_SCENES);
    expect(warn).toHaveBeenCalledOnce();
  });
  it('keeps the scenes on an update that does not name them', () => {
    const s = resolveSettings({ scenes: [{ shape: 'dunes' }, { shape: 'granite' }], scene: 1 });
    const next = mergeSettings(s, { lines: { count: 24 } });
    expect(next.scenes).toEqual(s.scenes);
    expect(next.scene).toBe(1);
    expect(mergeSettings(s, { scene: 0 }).scene).toBe(0);
  });
  it('keeps the scenes and the target when a look changes', () => {
    const s = resolveSettings({ scenes: [{ shape: 'dunes' }, { shape: 'granite', ink: '#f80' }], scene: 1 });
    const next = mergeSettings(s, { look: 'survey-map' });
    expect(next.scenes).toEqual(s.scenes);
    expect(next.scene).toBe(1);
  });
  it('clamps the column and keeps it when a look changes', () => {
    expect(resolveSettings({ column: -5 }).column).toBe(0);
    expect(resolveSettings({ column: 331.6 }).column).toBe(332);
    expect(resolveSettings({ column: 1e9 }).column).toBe(4000);
    expect(mergeSettings(resolveSettings({ column: 332 }), { look: 'survey-map' }).column).toBe(332);
  });
  it('round-trips scenes, scene and column through attributes', () => {
    const s = resolveSettings({ scenes: [{ shape: 'dunes', ink: '#f80' }, { shape: 'seed-pod' }], scene: 1, column: 332 });
    const attrs = toAttributes(s);
    expect(attrs).toMatchObject({ scene: '1', column: '332' });
    const back = resolveSettings(fromAttributes((n) => attrs[n] ?? null));
    expect(back.scenes).toEqual(s.scenes);
    expect(back.scene).toBe(1);
    expect(back.column).toBe(332);
    expect(toAttributes(resolveSettings())).not.toHaveProperty('scenes');
  });
  it('ignores a scenes attribute that is not JSON', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveSettings(fromAttributes((n) => (n === 'scenes' ? 'dunes' : null))).scenes).toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('stepBlend', () => {
  const state = (weights: number[], dark = 0): BlendState => ({ weights, dark });
  it('moves weights by 1 - exp(-dt * 4.5) and the dark amount by 1 - exp(-dt * 6)', () => {
    const s = state([1, 0, 0]);
    expect(stepBlend(s, 2, 1, 0.016)).toBe(true);
    const k = 1 - Math.exp(-0.016 * 4.5);
    expect(s.weights[0]).toBeCloseTo(1 - k, 12);
    expect(s.weights[1]).toBe(0);
    expect(s.weights[2]).toBeCloseTo(k, 12);
    expect(s.dark).toBeCloseTo(1 - Math.exp(-0.016 * 6), 12);
  });
  it('takes at most a 0.05 s step', () => {
    const a = state([0, 1]);
    const b = state([0, 1]);
    stepBlend(a, 0, 0, 0.05);
    stepBlend(b, 0, 0, 2);
    expect(b).toEqual(a);
  });
  it('reports settled once every value is within 0.002 of its target', () => {
    const s = state([0.9985, 0.0015], 0.999);
    expect(stepBlend(s, 0, 1, 0.016)).toBe(false);
    expect(stepBlend(state([0.99, 0.01]), 0, 0, 0.016)).toBe(true);
  });
  it('matches the reference loop over a whole fade', () => {
    // The loop in personal-website src/bg.js, frame by frame.
    const ref = [1, 0, 0, 0, 0, 0];
    let refDark = 0;
    const s = state([1, 0, 0, 0, 0, 0]);
    for (let f = 0; f < 200; f++) {
      const dt = f === 0 ? 0 : 0.0167;
      const k = 1 - Math.exp(-dt * 4.5);
      for (let i = 0; i < ref.length; i++) ref[i] += ((i === 3 ? 1 : 0) - ref[i]) * k;
      refDark += (1 - refDark) * (1 - Math.exp(-dt * 6));
      stepBlend(s, 3, 1, dt);
    }
    expect(s.weights).toEqual(ref);
    expect(s.dark).toBe(refDark);
  });
});

describe('mixTheme', () => {
  it('is the light theme at 0 and the dark theme at 1', () => {
    const light = resolveTheme({ mode: 'light' });
    const dark = resolveTheme({ mode: 'dark' });
    expect(mixTheme(light, dark, 0)).toEqual({ ink: THEME_DEFAULTS.light.ink, paper: THEME_DEFAULTS.light.paper, dark: 0 });
    expect(mixTheme(light, dark, 1)).toEqual({ ink: THEME_DEFAULTS.dark.ink, paper: THEME_DEFAULTS.dark.paper, dark: 1 });
    const half = mixTheme(light, dark, 0.5);
    expect(half.ink[0]).toBeCloseTo(0.51, 12);
    expect(half.paper[2]).toBeCloseTo((0.965 + 0.05) / 2, 12);
  });
});

describe('full quality', () => {
  it('leaves the pixel ratio and pixel count to the renderer options', () => {
    const t = tierFor('full', { mobile: true, cores: 2, saveData: true }, 'low');
    expect(t.maxPixelRatio).toBe(Infinity);
    expect(t.maxPixels).toBe(Infinity);
    expect(t.meshCap).toBe(192);
    expect(resolveSettings({ quality: 'full' }).quality).toBe('full');
  });
});

describe('scene blend shader', () => {
  it('declares the scene uniforms and divides by the weights drawn', () => {
    for (const u of ['uSceneCount', 'uSceneWeight', 'uSceneShape', 'uSceneInk']) expect(TOPOGRAPHIC_FRAGMENT).toMatch(new RegExp(`uniform \\w+ ${u}\\b`));
    expect(TOPOGRAPHIC_FRAGMENT).toContain('uSceneWeight[i]>0.002');
    expect(TOPOGRAPHIC_FRAGMENT).toContain('c/max(tw,1e-4)');
  });
});
