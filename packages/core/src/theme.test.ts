import { describe, expect, it } from 'vitest';
import { THEME_DEFAULTS, parseColor, resolveTheme } from './theme.js';

describe('parseColor', () => {
  it('parses hex forms', () => {
    expect(parseColor('#fff')).toEqual([1, 1, 1, 1]);
    expect(parseColor('#00000080')![3]).toBeCloseTo(0.502);
  });
  it('parses rgb() and rgba()', () => {
    expect(parseColor('rgb(255, 0, 0)')).toEqual([1, 0, 0, 1]);
    expect(parseColor('rgba(0 0 255 / 50%)')).toEqual([0, 0, 1, 0.5]);
  });
  it('handles transparent and rejects unknown input', () => {
    expect(parseColor('transparent')).toEqual([0, 0, 0, 0]);
    expect(parseColor('nope')).toBeNull();
  });
});

describe('resolveTheme', () => {
  it('uses mode defaults', () => {
    expect(resolveTheme({ mode: 'dark' })).toEqual({ ...THEME_DEFAULTS.dark, dark: 1 });
    expect(resolveTheme({ mode: 'auto' }, { prefersDark: false }).dark).toBe(0);
  });
  it('prefers settings over CSS variables over defaults', () => {
    const cssVar = (n: string) => (n === '--topography-ink' ? '#ff0000' : '');
    expect(resolveTheme({ mode: 'light' }, { cssVar }).ink).toEqual([1, 0, 0, 1]);
    expect(resolveTheme({ mode: 'light', ink: '#00ff00' }, { cssVar }).ink).toEqual([0, 1, 0, 1]);
  });
  it('supports transparent paper', () => {
    expect(resolveTheme({ mode: 'light', paper: 'transparent' }).paper[3]).toBe(0);
  });
  it('resolves unknown colour names through the browser hook', () => {
    expect(resolveTheme({ mode: 'light', ink: 'tomato' }, { computeColor: () => 'rgb(255, 99, 71)' }).ink[0]).toBe(1);
  });
});
