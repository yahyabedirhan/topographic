import { describe, expect, it } from 'vitest';
import { PLACE_GROUPS, loadCatalog } from './places';
import { fold, searchPlaces } from './search';

const places = await loadCatalog();
const ids = (query: string) => searchPlaces(places, query).flatMap((g) => g.places.map((p) => p.id));

describe('place search', () => {
  it('ignores case, accents and apostrophes', () => {
    expect(ids('reunion')).toContain('reunion');
    expect(ids('RÉUNION')).toContain('reunion');
    expect(ids('patagonia')).toContain('fitz-roy');
    expect(ids('galapagos')).toContain('galapagos');
    expect(fold('Kauaʻi')).toBe('kauai');
    expect(fold('Ålesund Øresund')).toBe('alesund oresund');
  });

  it('finds a place by its name, note, country, continent and kind', () => {
    expect(ids('fitz roy')).toEqual(['fitz-roy']);
    expect(ids('granite spires')).toContain('fitz-roy');
    expect(ids('argentina')).toContain('fitz-roy');
    expect(ids('antarctica')).toContain('mount-erebus');
    const volcanoes = ids('volcano');
    expect(volcanoes).toContain('mount-erebus');
    expect(volcanoes).toContain('fuji');
  });

  it('keeps only the places that hold every word', () => {
    const both = ids('volcano antarctica');
    expect(both).toContain('mount-erebus');
    expect(both).not.toContain('fuji');
    expect(both.every((id) => places.find((p) => p.id === id)!.group === 'Antarctica')).toBe(true);
  });

  it('groups the results by continent in menu order and leaves out empty groups', () => {
    const groups = searchPlaces(places, 'volcano').map((g) => g.group);
    expect(groups).toEqual(PLACE_GROUPS.filter((g) => groups.includes(g)));
    expect(searchPlaces(places, 'argentina').map((g) => g.group)).toEqual(['South America']);
    expect(searchPlaces(places, '').map((g) => g.group)).toEqual([...PLACE_GROUPS]);
  });

  it('returns nothing when no place matches', () => {
    expect(searchPlaces(places, 'atlantis')).toEqual([]);
  });
});
