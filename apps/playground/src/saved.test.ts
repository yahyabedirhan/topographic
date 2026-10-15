import { describe, expect, it } from 'vitest';
import { resolveSettings } from 'topographic';
import { PLACES } from './region/places';
import { addSaved, readSaved, SAVED_KEY, SAVED_MAX, savedName, writeSaved, type SavedTerrain } from './saved';

const settings = resolveSettings({ style: 'dunes', mode: '3d' });

function memory() {
  const data = new Map<string, string>();
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
}

const box = (i: number) => ({ west: 10 + i, south: 40, east: 10.5 + i, north: 40.3 });

describe('saved map terrains', () => {
  it('adds new items first and names them by city or as Map N', () => {
    let items: SavedTerrain[] = [];
    items = addSaved(items, { bbox: PLACES[0].bbox, placeId: 'istanbul', settings }, 1).items;
    items = addSaved(items, { bbox: box(0), placeId: null, settings }, 2).items;
    items = addSaved(items, { bbox: box(1), placeId: null, settings }, 3).items;
    expect(items.map((it) => it.name)).toEqual(['Map 2', 'Map 1', 'Istanbul']);
    expect(savedName(items, null)).toBe('Map 3');
  });

  it('selects the existing item for the same box instead of adding one', () => {
    const first = addSaved([], { bbox: box(0), placeId: null, settings }, 1);
    const again = addSaved(first.items, { bbox: { ...box(0) }, placeId: null, settings }, 2);
    expect(again.items).toBe(first.items);
    expect(again.item.id).toBe(first.item.id);
  });

  it('keeps the newest dozen', () => {
    let items: SavedTerrain[] = [];
    for (let i = 0; i < SAVED_MAX + 3; i++) items = addSaved(items, { bbox: box(i), placeId: null, settings }, i).items;
    expect(items).toHaveLength(SAVED_MAX);
    expect(items[0].bbox).toEqual(box(SAVED_MAX + 2));
  });

  it('round-trips through storage under a versioned key', () => {
    const store = memory();
    const { items } = addSaved([], { bbox: box(0), placeId: null, settings }, 1);
    expect(writeSaved(items, store)).toBe(true);
    expect(store.data.has(SAVED_KEY)).toBe(true);
    expect(readSaved(store)).toEqual(items);
  });

  it('works without storage and ignores broken data', () => {
    expect(readSaved(null)).toEqual([]);
    expect(writeSaved([], null)).toBe(false);
    const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readSaved(throwing)).toEqual([]);
    expect(writeSaved([], throwing)).toBe(false);
    const store = memory();
    store.setItem(SAVED_KEY, '{nope');
    expect(readSaved(store)).toEqual([]);
    store.setItem(SAVED_KEY, JSON.stringify([{ id: 'x' }, 3]));
    expect(readSaved(store)).toEqual([]);
  });
});
