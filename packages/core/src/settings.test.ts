import { afterEach, describe, expect, it, vi } from 'vitest';
import { PARAMS } from './params.js';
import { PRESETS } from './presets.js';
import { STYLES } from './styles.js';
import { fromAttributes, fromQuery, mergeSettings, meshResolution, resetWarnings, resolveSettings, terrainSegments, toAttributes, toQuery, toUniforms } from './settings.js';

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

describe('view settings', () => {
  it('defaults to the flat 2d map', () => {
    const s = resolveSettings();
    expect(s.mode).toBe('2d');
    expect(s.extent).toBe('endless');
    expect(s.elevation).toBe(0.62);
    expect(s.camera).toEqual({ azimuth: 349.7, elevation: 33.6, radius: 1.92, motion: 'still', panX: 0, panZ: 0, zoom: 1 });
    expect(meshResolution(0)).toBe(32);
    expect(meshResolution(s.detail)).toBe(96);
    expect(meshResolution(1)).toBe(160);
    expect(terrainSegments(s.detail, false)).toBe(96);
    expect(terrainSegments(s.detail, true)).toBe(192);
    expect(terrainSegments(1, true)).toBe(192);
  });
  it('clamps the camera above the horizon and keeps 2d values', () => {
    const s = resolveSettings({ mode: '3d', elevation: 4, extent: 'endless', camera: { elevation: -20, radius: 99, azimuth: 400.26 } });
    expect(s.mode).toBe('3d');
    expect(s.extent).toBe('endless');
    expect(s.elevation).toBe(1);
    expect(s.camera.elevation).toBe(2);
    expect(s.camera.radius).toBe(6.5);
    expect(s.camera.azimuth).toBe(400.3);
    expect(s.lines.count).toBe(30);
    expect(resolveSettings({ camera: { panX: 99, panZ: Number.NaN } }).camera).toMatchObject({ panX: 6, panZ: 0 });
  });
  it('warns once for an unknown mode, extent or camera motion', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = resolveSettings({ mode: 'vr', extent: 'sphere', camera: { motion: 'spin' } } as never);
    expect(s.mode).toBe('2d');
    expect(s.extent).toBe('endless');
    expect(s.camera.motion).toBe('still');
    resolveSettings({ mode: 'vr', extent: 'sphere', camera: { motion: 'spin' } } as never);
    expect(warn).toHaveBeenCalledTimes(3);
  });
  it('round-trips 3d settings through the query and attributes', () => {
    const s = resolveSettings({
      style: 'gentle-summit', seed: 7, mode: '3d', elevation: 0.2, extent: 'block', detail: 0.15,
      camera: { azimuth: 12, elevation: 18, radius: 3, motion: 'orbit', panX: 0.25, panZ: -0.1234 },
    });
    expect(s.camera.panZ).toBe(-0.123);
    const q = toQuery(s);
    expect(q).toContain('px=0.25');
    expect(q).toContain('pz=-0.123');
    expect(toQuery(resolveSettings({ mode: '3d' }))).toBe('s=drifting-lobes&mode=3d');
    expect(resolveSettings(fromQuery(q))).toEqual(s);
    const attrs = toAttributes(s);
    expect(attrs).toMatchObject({ mode: '3d', extent: 'block', 'camera-motion': 'orbit', azimuth: '12', 'pan-x': '0.25' });
    expect(resolveSettings(fromAttributes((n) => attrs[n] ?? null))).toEqual(s);
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

  it('reads, clamps and writes the 2D zoom', () => {
    expect(resolveSettings({ camera: { zoom: 2.5 } }).camera.zoom).toBe(2.5);
    expect(resolveSettings({ camera: { zoom: 40 } }).camera.zoom).toBe(8);
    expect(resolveSettings({ camera: { zoom: 0.2 } }).camera.zoom).toBe(1);
    expect(toQuery(resolveSettings({ camera: { zoom: 2 } }))).toContain('zm=2');
    expect(resolveSettings(fromQuery('zm=3')).camera.zoom).toBe(3);
  });
});

