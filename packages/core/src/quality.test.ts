import { describe, expect, it } from 'vitest';
import { detectTier, FRAME_MS, stepTier, tierFor } from './quality.js';
import { fromQuery, resolveSettings, terrainSegments, toQuery } from './settings.js';

describe('quality tiers', () => {
  it('starts phones at medium and a tiny phone at low', () => {
    expect(detectTier({ mobile: true, cores: 6, saveData: false })).toBe('medium');
    expect(detectTier({ mobile: true, cores: 4, memory: 2, saveData: false })).toBe('low');
    expect(detectTier({ mobile: false, cores: 8, memory: 8, saveData: false })).toBe('high');
    expect(detectTier({ mobile: false, cores: 4, memory: 8, saveData: false })).toBe('medium');
  });
  it('steps down when frames miss the refresh, and never steps up', () => {
    const slow = Array.from({ length: 16 }, () => 28);
    expect(stepTier('medium', slow, false)).toBe('low');
    expect(stepTier('low', slow, false)).toBe('low');
    const skippedBeat = Array.from({ length: 16 }, () => 16.7);
    expect(stepTier('high', skippedBeat, true)).toBe('medium');
    const held = Array.from({ length: 16 }, () => FRAME_MS.hz60);
    expect(stepTier('medium', held, false)).toBe('medium');
    const hz120 = Array.from({ length: 16 }, () => FRAME_MS.hz120);
    expect(stepTier('medium', hz120, true)).toBe('medium');
  });
  it('caps a place mesh on the low tier and keeps the desktop floor', () => {
    expect(terrainSegments(1, true)).toBe(192);
    expect(terrainSegments(0.5, true, tierFor('low', { mobile: true, cores: 4, saveData: false }, 'low').meshCap)).toBe(64);
    expect(terrainSegments(1, false, 96)).toBe(96);
  });
  it('round-trips quality through the query and omits auto', () => {
    expect(toQuery(resolveSettings({ mode: '3d' }))).not.toContain('ql=');
    const s = resolveSettings({ quality: 'low', mode: '3d' });
    expect(toQuery(s)).toContain('ql=low');
    expect(resolveSettings(fromQuery(toQuery(s))).quality).toBe('low');
    expect(resolveSettings({ quality: 'cinema' as 'low' }).quality).toBe('auto');
  });
});
