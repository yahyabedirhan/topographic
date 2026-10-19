import { PLACE_GROUPS, type Place, type PlaceGroup } from './places';

/** Letters that Unicode does not split into a base letter and a mark. */
const LETTERS: Record<string, string> = { ø: 'o', æ: 'ae', œ: 'oe', ß: 'ss', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i' };

/** Lower case without accents or apostrophes, so "reunion" finds Réunion and "kauai" finds Kauaʻi. */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[øæœßłđðþı]/g, (c) => LETTERS[c])
    .replace(/['’ʻʼ`]/g, '');
}

/** What a place is found by: its name, note, country, continent and kind. */
function haystack(place: Place): string {
  return fold([place.name, place.note, place.country ?? '', place.group, place.kind ?? ''].join(' '));
}

export interface PlaceGroupResult {
  group: PlaceGroup;
  places: Place[];
}

/**
 * The places that hold every word of the query, grouped by continent in menu order, with empty
 * groups left out. An empty query keeps every place.
 */
export function searchPlaces(places: readonly Place[], query: string): PlaceGroupResult[] {
  const words = fold(query).split(/[\s,]+/).filter(Boolean);
  const hits = words.length ? places.filter((place) => { const text = haystack(place); return words.every((w) => text.includes(w)); }) : places;
  return PLACE_GROUPS
    .map((group) => ({ group, places: hits.filter((place) => place.group === group) }))
    .filter((result) => result.places.length > 0);
}
