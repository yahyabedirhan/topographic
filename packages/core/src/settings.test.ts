import { afterEach, describe, expect, it, vi } from 'vitest';
import { PARAMS } from './params.js';
import { LOOKS, findLook } from './looks.js';
import { SHAPES } from './shapes.js';
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
    expect(s.shape).toBe('drifting-lobes');
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
  it('falls back from an unknown shape and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveSettings({ shape: 'volcano' }).shape).toBe('drifting-lobes');
    resolveSettings({ shape: 'volcano' });
    expect(warn).toHaveBeenCalledTimes(1);
  });
  it('applies shape defaults under user values', () => {
    expect(resolveSettings({ shape: 'dunes' }).layout.fade).toBe(0.5);
    expect(resolveSettings({ shape: 'dunes', layout: { fade: 0.9 } }).layout.fade).toBe(0.9);
  });
});

describe('looks', () => {
  it('gives every look a unique id made from its name', () => {
    expect(new Set(LOOKS.map((l) => l.id)).size).toBe(LOOKS.length);
    for (const l of LOOKS) expect(l.id).toBe(l.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    expect(findLook('rose-pod')?.name).toBe('Rose pod');
    expect(findLook('Rose pod')).toBeUndefined();
  });
  it('resolves a look to the same settings as its own values', () => {
    for (const l of LOOKS) expect(resolveSettings({ look: l.id })).toEqual(resolveSettings(l.settings));
    const s = resolveSettings({ look: 'survey-map' });
    expect(s).toMatchObject({ shape: 'gentle-summit', lines: { count: 44, indexEvery: 5, opacity: 0.55 }, terrain: { peaks: 3, spread: 0.6 } });
    expect(resolveSettings({ look: 'rose-pod' })).toMatchObject({ shape: 'seed-pod', seed: 71, theme: { mode: 'dark', paper: '#1a1214', ink: '#f0b2a8' } });
  });
  it('lets the settings next to a look override its values', () => {
    const s = resolveSettings({ look: 'rose-pod', lines: { count: 40 }, theme: { ink: '#ffffff' }, camera: { azimuth: 10 } });
    expect(s.lines).toMatchObject({ count: 40, width: 0.18 });
    expect(s.theme).toEqual({ mode: 'dark', paper: '#1a1214', ink: '#ffffff' });
    expect(s.camera).toMatchObject({ azimuth: 10, elevation: 34, radius: 2.3 });
    expect(s.motion.speed).toBe(0.55);
  });
  it('takes a shape next to a look, with that shape\'s defaults under the look', () => {
    const s = resolveSettings({ look: 'rose-pod', shape: 'dunes' });
    expect(s.shape).toBe('dunes');
    expect(s.seed).toBe(71);
    expect(s.layout.fade).toBe(0.15);
  });
  it('ignores an unknown look and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveSettings({ look: 'volcano', shape: 'dunes' })).toEqual(resolveSettings({ shape: 'dunes' }));
    resolveSettings({ look: 'volcano' });
    expect(mergeSettings(resolveSettings(), { look: 'volcano' })).toEqual(resolveSettings());
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('unknown look "volcano"');
  });
  it('applies a look in an update and keeps the view', () => {
    const from = mergeSettings(resolveSettings({ shape: 'granite', terrain: { peaks: 5 } }), {
      mode: '3d', elevation: 0.3, quality: 'low', camera: { motion: 'orbit', panX: 0.2 }, view2d: { zoom: 2 },
    });
    const s = mergeSettings(from, { look: 'sea-dunes', lines: { count: 12 } });
    const look = resolveSettings({ look: 'sea-dunes' });
    expect(s).toMatchObject({ shape: 'dunes', seed: 97, theme: look.theme, terrain: look.terrain, motion: look.motion, layout: look.layout });
    expect(s.lines).toEqual({ ...look.lines, count: 12 });
    expect(s).toMatchObject({ mode: '3d', elevation: 0.3, quality: 'low', view2d: { zoom: 2 } });
    expect(s.camera).toMatchObject({ azimuth: 14.7, elevation: 34, radius: 1.92, motion: 'orbit', panX: 0.2 });
  });
  it('reads a look from the attributes and the query', () => {
    expect(resolveSettings(fromAttributes((n) => ({ look: 'night-lobes', 'line-count': '40' } as Record<string, string>)[n] ?? null)))
      .toEqual(resolveSettings({ look: 'night-lobes', lines: { count: 40 } }));
    expect(resolveSettings(fromQuery('look=night-lobes&lc=40'))).toEqual(resolveSettings({ look: 'night-lobes', lines: { count: 40 } }));
  });
});

describe('view settings', () => {
  it('defaults to the flat 2d map', () => {
    const s = resolveSettings();
    expect(s.mode).toBe('2d');
    expect(s.extent).toBe('endless');
    expect(s.elevation).toBe(0.62);
    expect(s.camera).toEqual({ azimuth: 349.7, elevation: 33.6, radius: 1.92, motion: 'still', panX: 0, panZ: 0 });
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
      shape: 'gentle-summit', seed: 7, mode: '3d', elevation: 0.2, extent: 'block', detail: 0.15,
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
  it('maps values into shader slots with the shape index', () => {
    const u = toUniforms(resolveSettings({ shape: 'dunes', layout: { anchor: 1 } }));
    expect(u.uStyle).toBe(11);
    expect(u.uParams[0]).toBe(30);
    expect(u.uParams[1]).toBeCloseTo(1.41);
    expect(u.uParams[10]).toBeCloseTo(1);
    expect(u.uCenter).toBe(1);
  });
  it('uses the prototype shape indices', () => {
    expect(SHAPES.map((s) => s.index)).toEqual([0, 1, 3, 4, 5, 7, 11]);
  });
});

describe('serialisation', () => {
  it('round-trips through the URL query', () => {
    const s = resolveSettings({ shape: 'granite', seed: 42, lines: { count: 18 }, theme: { mode: 'dark', paper: 'transparent' } });
    const q = toQuery(s);
    expect(q).toContain('s=granite');
    expect(resolveSettings(fromQuery(q))).toEqual(s);
  });
  it('reads the shape from s=, as links made before 0.6.0 do', () => {
    expect(resolveSettings(fromQuery('s=dunes&seed=3')).shape).toBe('dunes');
  });
  it('round-trips through element attributes', () => {
    const s = resolveSettings({ shape: 'seed-pod', terrain: { peaks: 3 }, motion: { speed: 0 } });
    const attrs = toAttributes(s);
    expect(attrs).toMatchObject({ shape: 'seed-pod', peaks: '3', speed: '0' });
    expect(resolveSettings(fromAttributes((n) => attrs[n] ?? null))).toEqual(s);
  });

  it('reads, clamps and writes the 2D view apart from the camera', () => {
    expect(resolveSettings().view2d).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(resolveSettings({ view2d: { x: 0.25, zoom: 2.5 } }).view2d).toEqual({ x: 0.25, y: 0, zoom: 2.5 });
    expect(resolveSettings({ view2d: { zoom: 40 } }).view2d.zoom).toBe(8);
    expect(resolveSettings({ view2d: { zoom: 0.2 } }).view2d.zoom).toBe(1);
    expect(resolveSettings({ view2d: { zoom: 2 } }).camera).toEqual(resolveSettings().camera);
    expect(toQuery(resolveSettings({ view2d: { x: 0.1, y: -0.2, zoom: 2 } }))).toContain('vx=0.1&vy=-0.2&vz=2');
    expect(resolveSettings(fromQuery('vx=0.3&vz=3')).view2d).toEqual({ x: 0.3, y: 0, zoom: 3 });
    expect(toAttributes(resolveSettings({ view2d: { zoom: 2 } }))).toMatchObject({ 'view-zoom': '2' });
  });
});

