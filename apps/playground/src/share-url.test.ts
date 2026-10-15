import { describe, expect, it } from 'vitest';
import { mergeSettings, type Settings } from 'topographic';
import { LOOKS } from './looks';
import { baseline, findLook, lookSlug, readSettings, settingsParams, writeSettings } from './share-url';

const query = (s: Settings) => new URLSearchParams(settingsParams(s)).toString();
const roundTrip = (s: Settings) => expect(readSettings(writeSettings('', s))).toEqual(s);
const nightLobes = baseline(findLook('night-lobes')!.settings);

describe('share url', () => {
  it('gives every look a unique slug', () => {
    expect(lookSlug('Night lobes')).toBe('night-lobes');
    const slugs = LOOKS.map((l) => lookSlug(l.name));
    expect(new Set(slugs).size).toBe(LOOKS.length);
    for (const look of LOOKS) roundTrip(baseline(look.settings));
  });

  it('writes nothing for the default page and only the style for style defaults', () => {
    expect(query(baseline())).toBe('');
    expect(query(baseline({ style: 'dunes' }))).toBe('s=dunes');
    roundTrip(baseline({ style: 'dunes' }));
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

  it('treats endless as the playground default and writes block', () => {
    expect(baseline().extent).toBe('endless');
    expect(readSettings('mode=3d').extent).toBe('endless');
    const s = mergeSettings(baseline(), { mode: '3d', extent: 'block' });
    expect(query(s)).toBe('mode=3d&ex=block');
    roundTrip(s);
  });

  it('writes colours without # and reads them back', () => {
    const s = baseline({ style: 'gentle-summit', seed: 4, theme: { mode: 'dark', ink: '#9fb0cc', paper: '#0b0b0d' } });
    expect(query(s)).toBe('s=gentle-summit&seed=4&m=dark&ink=9fb0cc&paper=0b0b0d');
    roundTrip(s);
    expect(readSettings('ink=fff&paper=transparent').theme).toMatchObject({ ink: '#fff', paper: 'transparent' });
  });

  it('falls back to the style defaults when a look loses its colours', () => {
    const s = { ...nightLobes, theme: { mode: 'auto' as const } };
    expect(query(s)).not.toContain('look=');
    roundTrip(s);
  });

  it('keeps region params and drops old settings keys', () => {
    const search = '?place=istanbul&lc=12&region=28.9,40.9,29.2,41.2&look=bloom&basemap=liberty';
    expect(writeSettings(search, mergeSettings(nightLobes, { lines: { count: 40 } })))
      .toBe('look=night-lobes&lc=40&ev=0.62&place=istanbul&region=28.9,40.9,29.2,41.2&basemap=liberty');
  });

  it('starts a place at the city height and writes ev only when it differs', () => {
    expect(readSettings('place=istanbul').elevation).toBe(0.1);
    expect(writeSettings('place=istanbul', readSettings('place=istanbul'))).toBe('place=istanbul');
    const high = mergeSettings(nightLobes, { elevation: 0.62 });
    expect(writeSettings('place=istanbul', high)).toBe('look=night-lobes&ev=0.62&place=istanbul');
    expect(readSettings('look=night-lobes&ev=0.62&place=istanbul')).toEqual(high);
  });
});
