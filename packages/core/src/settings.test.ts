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


describe('location setting', () => {
  const grid = { samples: new Float32Array(4), size: 2, aspect: 1.5 };

  it('is the generated terrain by default', () => {
    expect(resolveSettings().location).toBeNull();
  });
  it('takes a built-in id with its camera, elevation and block extent', () => {
    const s = resolveSettings({ location: 'everest' });
    expect(s.location).toBe('everest');
    expect(s.camera).toMatchObject({ azimuth: 341.8, elevation: 40, radius: 1.32, motion: 'still' });
    expect(s.elevation).toBe(0.2);
    expect(s.extent).toBe('block');
    expect(s.lines).toEqual({ count: 36, width: 0, opacity: 0.9, indexEvery: 4 });
    expect(s.layout.fade).toBe(0.15);
    expect(s.mode).toBe('2d');
  });
  it('keeps the values you set over the location\'s', () => {
    const s = resolveSettings({ location: 'everest', mode: '3d', elevation: 0.3, camera: { azimuth: 90, motion: 'orbit' }, lines: { count: 20 }, layout: { fade: 0.6 } });
    expect(s.lines).toEqual({ count: 20, width: 0, opacity: 0.9, indexEvery: 4 });
    expect(s.layout.fade).toBe(0.6);
    expect(s.mode).toBe('3d');
    expect(s.elevation).toBe(0.3);
    expect(s.camera).toMatchObject({ azimuth: 90, elevation: 40, radius: 1.32, motion: 'orbit' });
  });
  it('takes a height grid as it is, without camera defaults', () => {
    const s = resolveSettings({ location: grid });
    expect(s.location).toBe(grid);
    expect(s.camera).toEqual(resolveSettings().camera);
    expect(s.lines).toEqual(resolveSettings().lines);
  });
  it('warns once and uses the generated terrain for an unknown id or a broken grid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveSettings({ location: 'atlantis' }).location).toBeNull();
    resolveSettings({ location: 'atlantis' });
    expect(resolveSettings({ location: { samples: new Float32Array(3), size: 2, aspect: 1 } }).location).toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
  });
  it('applies a new location\'s view on update, and leaves the camera alone when the location stays', () => {
    const start = resolveSettings({ location: 'everest' });
    const moved = mergeSettings(start, { camera: { azimuth: 12 } });
    expect(mergeSettings(moved, { location: 'everest' }).camera.azimuth).toBe(12);
    const fuji = mergeSettings(moved, { location: 'fuji' });
    expect(fuji.camera).toMatchObject({ azimuth: 341.8, elevation: 30 });
    expect(fuji.elevation).toBe(0.24);
    expect(mergeSettings(moved, { location: 'fuji', camera: { elevation: 50 } }).camera.elevation).toBe(50);
    expect(mergeSettings(moved, { location: 'fuji', lines: { opacity: 0.5 } }).lines.opacity).toBe(0.5);
    expect(mergeSettings(fuji, { location: null }).location).toBeNull();
  });
  it('shares a height grid between merges instead of copying it', () => {
    const s = mergeSettings(resolveSettings({ location: grid }), { seed: 3 });
    expect(s.location).toBe(grid);
  });
  it('reads and writes the location attribute', () => {
    expect(fromAttributes((n) => (n === 'location' ? 'fuji' : null)).location).toBe('fuji');
    expect(fromAttributes((n) => (n === 'location' ? '' : null)).location).toBeNull();
    expect(toAttributes(resolveSettings({ location: 'fuji' })).location).toBe('fuji');
    expect(toAttributes(resolveSettings({ location: grid })).location).toBeUndefined();
  });
});

describe('look and location together', () => {
  const look = LOOKS.find((l) => l.settings.lines?.count !== undefined && l.settings.lines.count !== 36)!;

  it('applies the look, then the place, then the input', () => {
    const s = resolveSettings({ look: look.id, location: 'everest' });
    expect(s.location).toBe('everest');
    expect(s.shape).toBe(resolveSettings({ look: look.id }).shape);
    expect(s.lines.count).toBe(36);
    expect(resolveSettings({ look: look.id, location: 'everest', lines: { count: 20 } }).lines.count).toBe(20);
  });

  it('keeps the place and its view when the look changes', () => {
    const start = resolveSettings({ location: 'everest' });
    const next = mergeSettings(start, { look: look.id });
    expect(next.location).toBe('everest');
    expect(next.lines.count).toBe(36);
    expect(next.camera.azimuth).toBe(start.camera.azimuth);
  });

  it('keeps a height grid as the same object when the look changes', () => {
    const grid = { samples: new Float32Array(4), size: 2, aspect: 1 };
    const next = mergeSettings(resolveSettings({ location: grid }), { look: look.id });
    expect(next.location).toBe(grid);
  });
});
