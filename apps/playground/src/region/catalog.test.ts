import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOCATIONS, areaProblem as limitProblem } from 'topographic/locations';
import rows from './catalog.json';
import { PLACE_GROUPS, PLACES, allPlaces, catalogPlaces, findPlace, loadCatalog, type CatalogRow } from './places';
import { readRegion } from './url';
import { regionQuery } from './tools';

const catalog = catalogPlaces(rows as unknown as CatalogRow[]);
const files = new URL('../../public/places/', import.meta.url);

describe('place catalog', () => {
  it('has unique ids, a continent from the menu and a box within the pipeline limits', () => {
    expect(new Set(catalog.map((p) => p.id)).size).toBe(catalog.length);
    for (const place of catalog) {
      expect(PLACE_GROUPS, place.id).toContain(place.group);
      expect(limitProblem(place.bbox), place.id).toBeNull();
    }
  });

  it('holds each built-in place once, with the library\'s own name and box', () => {
    for (const location of LOCATIONS) {
      const place = catalog.find((p) => p.id === location.id);
      expect(place?.name).toBe(location.name);
      expect(place?.bbox).toBe(location.bbox);
      expect(place?.grid).toBeUndefined();
    }
  });

  it('has a grid file for every other place, and no file without a place', () => {
    const own = catalog.filter((p) => !PLACES.some((b) => b.id === p.id));
    for (const place of own) {
      expect(existsSync(new URL(`${place.id}.png`, files)), place.id).toBe(true);
      expect(place.grid!.maxMeters, place.id).toBeGreaterThan(place.grid!.minMeters);
    }
    expect(readdirSync(files).sort()).toEqual(own.map((p) => `${p.id}.png`).sort());
  });

  it('opens and writes a link to a catalog place by its id once the catalog has loaded', async () => {
    expect(allPlaces()).toBe(PLACES);
    expect(findPlace('fitz-roy')).toBeUndefined();
    await loadCatalog();
    const place = findPlace('fitz-roy')!;
    expect(readRegion('?place=fitz-roy')).toEqual({ bbox: place.bbox, place: 'fitz-roy' });
    expect(regionQuery({ bbox: place.bbox, placeId: 'fitz-roy' })).toBe('place=fitz-roy');
  });
});
