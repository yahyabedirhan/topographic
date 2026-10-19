import { describe, expect, it } from 'vitest';
import { playgroundSettings, readSettings, writeSettings } from '../share-url';
import { findPlace } from './places';
import { findMapLook, MAP_LOOKS } from './map-looks';

/** The reference query for the built-in Istanbul. */
const ISTANBUL_URL = '?lf=gentle-summit&seed=67&lc=36&lw=0&lo=0.9&ix=4&fd=0.15&m=dark&paper=0b0b0d&mode=3d&ex=block&ev=0.12&az=341.6&ce=45.3&rd=1.15&px=-0.005&pz=-0.013&place=istanbul';

describe('built-in map terrains', () => {
  it('decodes Istanbul to exactly the settings of its reference query, camera and pan included', () => {
    const look = findMapLook('istanbul')!;
    expect(playgroundSettings(look.settings)).toEqual(readSettings(ISTANBUL_URL));
    expect(playgroundSettings(look.settings).camera).toMatchObject({ azimuth: 341.6, elevation: 45.3, radius: 1.15, panX: -0.005, panZ: -0.013 });
  });

  it('writes the same link back', () => {
    const look = findMapLook('istanbul')!;
    const q = new URLSearchParams(writeSettings('place=istanbul', playgroundSettings(look.settings)));
    expect(Object.fromEntries(q)).toEqual(Object.fromEntries(new URLSearchParams(ISTANBUL_URL)));
  });

  it.each([
    ['geirangerfjord', '?look=rose-pod&lc=36&lw=0&lo=0.9&ix=4&ink=a8c7f0&paper=0b0b0d&mode=3d&ex=block&ev=0.16&az=341.8&ce=35&rd=1.32&px=0.033&pz=-0.049&place=geirangerfjord'],
    ['fuji', '?look=rose-pod&lc=36&lw=0&lo=0.9&ix=4&ink=9fbecc&paper=0b0b0d&mode=3d&ex=block&ev=0.24&az=341.8&ce=30&rd=1.32&px=0.033&pz=-0.049&place=fuji'],
    ['yosemite', '?look=rose-pod&lc=36&lw=0&lo=0.9&ix=4&ink=a8eff0&paper=0b0b0d&mode=3d&ex=block&ev=0.16&az=341.8&ce=35&rd=1.32&px=0.033&pz=-0.049&place=yosemite'],
  ])('decodes %s to exactly the settings of its reference query', (id, url) => {
    expect(playgroundSettings(findMapLook(id)!.settings)).toEqual(readSettings(url));
  });

  it('uses each place\'s own box and name, with unique ids', () => {
    for (const look of MAP_LOOKS) {
      expect(look.bbox).toEqual(findPlace(look.placeId)!.bbox);
      expect(look.name).toBe(findPlace(look.placeId)!.name);
      expect(look.thumb).toBeTruthy();
      expect(look.minimap).toBeTruthy();
    }
    expect(new Set(MAP_LOOKS.map((l) => l.id)).size).toBe(MAP_LOOKS.length);
  });
});
