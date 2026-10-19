import { describe, expect, it } from 'vitest';
import { mergeSettings, type Settings } from 'topographic';
import { LOOKS } from './looks';
import cameras from './looks.cameras.json';
import { findLook, HOME_QUERY, lookSlug, playgroundSettings, readSettings, settingsParams, writeSettings } from './share-url';

const query = (s: Settings) => new URLSearchParams(settingsParams(s)).toString();
const roundTrip = (s: Settings) => expect(readSettings(writeSettings('', s))).toEqual(s);
const nightLobes = playgroundSettings(findLook('night-lobes')!.settings);

describe('share url', () => {
  it('gives every look a unique slug', () => {
    expect(lookSlug('Night lobes')).toBe('night-lobes');
    const slugs = LOOKS.map((l) => lookSlug(l.name));
    expect(new Set(slugs).size).toBe(LOOKS.length);
    for (const look of LOOKS) roundTrip(playgroundSettings(look.settings));
  });

  it('writes nothing for the home view, and names the shape otherwise', () => {
    const home = readSettings('');
    expect(home).toEqual(readSettings(HOME_QUERY));
    expect(query(home)).toBe('');
    expect(query(playgroundSettings())).toBe('s=drifting-lobes');
    roundTrip(playgroundSettings());
    expect(query(playgroundSettings({ shape: 'dunes' }))).toBe('s=dunes');
    roundTrip(playgroundSettings({ shape: 'dunes' }));
  });

  it('reads the shape from s=, as links made before 0.6.0 do', () => {
    expect(readSettings('s=dunes&seed=4').shape).toBe('dunes');
    expect(query(readSettings('s=dunes&seed=4'))).toBe('s=dunes&seed=4');
  });

  it('writes a look by name', () => {
    expect(query(nightLobes)).toBe('look=night-lobes');
    roundTrip(nightLobes);
  });

  it('writes a look plus the changed param', () => {
    const s = mergeSettings(nightLobes, { lines: { count: 40 } });
    expect(query(s)).toBe('look=night-lobes&lc=40');
    roundTrip(s);
  });

  it('writes 3D and the camera', () => {
    const s = mergeSettings(nightLobes, { mode: '3d', elevation: 0.7, camera: { motion: 'orbit', azimuth: 90 } });
    expect(query(s)).toBe('look=night-lobes&mode=3d&ev=0.7&az=90&cm=orbit');
    roundTrip(s);
  });

  it('writes the pan only when it is off centre', () => {
    const s = mergeSettings(nightLobes, { mode: '3d', camera: { panX: 0.2, panZ: -0.05 } });
    expect(query(s)).toBe('look=night-lobes&mode=3d&px=0.2&pz=-0.05');
    roundTrip(s);
    expect(query(mergeSettings(s, { camera: { panX: 0, panZ: 0 } }))).toBe('look=night-lobes&mode=3d');
    // A look always comes back centred.
    expect(playgroundSettings(findLook('night-lobes')!.settings).camera).toMatchObject({ panX: 0, panZ: 0 });
  });

  it('treats endless as the default and writes block', () => {
    expect(playgroundSettings().extent).toBe('endless');
    expect(readSettings('mode=3d').extent).toBe('endless');
    const s = mergeSettings(playgroundSettings(), { mode: '3d', extent: 'block' });
    expect(query(s)).toBe('mode=3d&ex=block');
    roundTrip(s);
  });

  it('keeps the default camera out of the URL', () => {
    expect(playgroundSettings().camera).toMatchObject({ azimuth: 349.7, elevation: 33.6, radius: 1.92 });
    expect(readSettings('mode=3d').camera).toMatchObject({ azimuth: 349.7, elevation: 33.6, radius: 1.92 });
    expect(query(mergeSettings(playgroundSettings(), { mode: '3d' }))).toBe('mode=3d');
    const map = mergeSettings(playgroundSettings(), { mode: '3d', camera: { azimuth: 341.8, elevation: 39.3, radius: 1.32 } });
    expect(query(map)).toBe('mode=3d&az=341.8&ce=39.3&rd=1.32');
    roundTrip(map);
  });

  it('gives every look its own camera and writes nothing for it', () => {
    expect(Object.keys(cameras).sort()).toEqual(LOOKS.map((l) => l.name).sort());
    for (const look of LOOKS) {
      const s = mergeSettings(playgroundSettings(look.settings), { mode: '3d' });
      expect(s.camera).toMatchObject((cameras as Record<string, object>)[look.name]);
      expect(query(s)).toBe(`look=${lookSlug(look.name)}&mode=3d` === HOME_QUERY ? '' : `look=${lookSlug(look.name)}&mode=3d`);
      roundTrip(s);
    }
    const moved = mergeSettings(nightLobes, { mode: '3d', camera: { azimuth: 12 } });
    expect(query(moved)).toBe('look=night-lobes&mode=3d&az=12');
  });

  it('writes colours without # and reads them back', () => {
    const s = playgroundSettings({ shape: 'gentle-summit', seed: 4, theme: { mode: 'dark', ink: '#9fb0cc', paper: '#0b0b0d' } });
    expect(query(s)).toBe('s=gentle-summit&seed=4&m=dark&ink=9fb0cc&paper=0b0b0d');
    roundTrip(s);
    expect(readSettings('ink=fff&paper=transparent').theme).toMatchObject({ ink: '#fff', paper: 'transparent' });
  });

  it('falls back to the shape defaults when a look loses its colours', () => {
    const s = { ...nightLobes, theme: { mode: 'auto' as const } };
    expect(query(s)).not.toContain('look=');
    roundTrip(s);
  });

  it('keeps region params and drops old settings keys', () => {
    const search = '?place=istanbul&lc=12&region=28.9,40.9,29.2,41.2&look=bloom&basemap=liberty';
    expect(writeSettings(search, mergeSettings(nightLobes, { lines: { count: 40 } })))
      .toBe('look=night-lobes&lc=40&place=istanbul&region=28.9,40.9,29.2,41.2&basemap=liberty');
  });

  it('treats elevation the same with or without a place', () => {
    expect(readSettings('place=istanbul').elevation).toBe(readSettings('').elevation);
    expect(writeSettings('place=istanbul', readSettings('place=istanbul'))).toBe('place=istanbul');
    const low = mergeSettings(nightLobes, { elevation: 0.1 });
    expect(writeSettings('place=istanbul', low)).toBe('look=night-lobes&ev=0.1&place=istanbul');
    expect(readSettings('look=night-lobes&ev=0.1&place=istanbul')).toEqual(low);
  });

  it('starts at the finest detail and the high budget, and keeps a link\'s own detail and budget', () => {
    expect(readSettings('')).toMatchObject({ detail: 1, quality: 'high' });
    expect(readSettings('look=night-lobes')).toMatchObject({ detail: 1, quality: 'high' });
    const medium = mergeSettings(nightLobes, { detail: 0.5, quality: 'medium' });
    expect(query(medium)).toBe('look=night-lobes&dl=0.5&ql=medium');
    expect(readSettings('look=night-lobes&dl=0.5&ql=medium')).toEqual(medium);
    expect(playgroundSettings({ detail: 0.12, quality: 'low' })).toMatchObject({ detail: 0.12, quality: 'low' });
  });
});
