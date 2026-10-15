import { describe, expect, it } from 'vitest';
import { LIBERTY_STYLE, MAP_CREDIT, mapStyle, quietStyle, readBasemap } from './basemap';

describe('basemap choice', () => {
  it('keeps Liberty behind the flag and uses the quiet map otherwise', () => {
    expect(readBasemap('?basemap=liberty')).toBe('liberty');
    expect(readBasemap('?basemap=quiet')).toBe('quiet');
    expect(readBasemap('')).toBe('quiet');
    expect(mapStyle('?basemap=liberty', 'dark')).toBe(LIBERTY_STYLE);
    expect(mapStyle('', 'light')).toMatchObject({ name: 'topographic-quiet' });
  });

  it('paints paper and water differently in each theme, and credits the tiles', () => {
    const dark = quietStyle('dark');
    const light = quietStyle('light');
    const paint = (style: ReturnType<typeof quietStyle>, id: string) => style.layers.find((layer) => layer.id === id)?.paint;
    expect(paint(dark, 'land')).toMatchObject({ 'background-color': '#121214' });
    expect(paint(light, 'land')).toMatchObject({ 'background-color': '#f4f2ee' });
    expect(paint(dark, 'water')).not.toEqual(paint(light, 'water'));
    expect(dark.layers.map((layer) => layer.id).join(' ')).not.toContain('poi');
    expect(dark.sources.openmaptiles).toMatchObject({
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: MAP_CREDIT,
    });
    expect(MAP_CREDIT).toContain('OpenMapTiles');
    expect(MAP_CREDIT).toContain('OpenStreetMap');
  });
});
