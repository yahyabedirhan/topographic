import { useCallback, useRef, useState } from 'react';
import { resolveSettings, type Settings } from 'topographic';
import type { BBox } from './region/pipeline';
import { findPlace, sameBox } from './region/places';

/**
 * A terrain made in the Map popover and kept in the dock: the place's box and the full settings at
 * save time. The heightfield is not kept; a click fetches the tiles again (the browser caches them).
 */
export interface SavedTerrain {
  id: string;
  name: string;
  bbox: BBox;
  placeId: string | null;
  settings: Settings;
  /** A small image data URL for the dock, or null until the place has loaded once. */
  thumb: string | null;
  savedAt: number;
}

export const SAVED_KEY = 'topographic.saved.v1';
/** The dock keeps the newest dozen; the oldest goes first. */
export const SAVED_MAX = 12;
/** A thumbnail above this many characters is dropped rather than stored. */
export const THUMB_MAX = 40_000;

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

function storage(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

function isBox(v: unknown): v is BBox {
  const b = v as BBox;
  return Boolean(b) && [b.west, b.south, b.east, b.north].every((n) => typeof n === 'number' && Number.isFinite(n));
}

/** Reads the saved list. Anything unreadable counts as an empty list. */
export function readSaved(store: Storage | null = storage()): SavedTerrain[] {
  try {
    const raw = store?.getItem(SAVED_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return [];
    return list.flatMap((item): SavedTerrain[] => {
      const it = item as Partial<SavedTerrain>;
      if (typeof it.id !== 'string' || typeof it.name !== 'string' || !isBox(it.bbox) || !it.settings) return [];
      return [{
        id: it.id,
        name: it.name,
        bbox: it.bbox,
        placeId: typeof it.placeId === 'string' ? it.placeId : null,
        settings: resolveSettings(it.settings),
        thumb: typeof it.thumb === 'string' && it.thumb.length <= THUMB_MAX ? it.thumb : null,
        savedAt: typeof it.savedAt === 'number' ? it.savedAt : 0,
      }];
    }).slice(0, SAVED_MAX);
  } catch {
    return [];
  }
}

/** Writes the list. Returns false when storage is missing or full; the page keeps working either way. */
export function writeSaved(items: SavedTerrain[], store: Storage | null = storage()): boolean {
  if (!store) return false;
  try {
    store.setItem(SAVED_KEY, JSON.stringify(items));
    return true;
  } catch {
    // Full storage: try once more without pictures.
    try {
      store.setItem(SAVED_KEY, JSON.stringify(items.map((it) => ({ ...it, thumb: null }))));
      return true;
    } catch {
      return false;
    }
  }
}

/** A city keeps its name. Any other box is "Area", then "Area 2", "Area 3" and so on. */
export function savedName(items: SavedTerrain[], placeId: string | null): string {
  const city = findPlace(placeId)?.name;
  if (city) return city;
  const used = items.map((it) => /^Area(?: (\d+))?$/.exec(it.name)).filter(Boolean).map((m) => Number(m![1] ?? 1));
  return used.length ? `Area ${Math.max(...used) + 1}` : 'Area';
}

/**
 * Adds a terrain at the front. The same box again saves nothing and returns the existing item.
 * The list keeps at most SAVED_MAX items.
 */
export function addSaved(
  items: SavedTerrain[],
  entry: { bbox: BBox; placeId: string | null; settings: Settings },
  now = Date.now(),
): { items: SavedTerrain[]; item: SavedTerrain } {
  const existing = items.find((it) => sameBox(it.bbox, entry.bbox));
  if (existing) return { items, item: existing };
  const item: SavedTerrain = {
    id: `m${now.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`,
    name: savedName(items, entry.placeId),
    bbox: entry.bbox,
    placeId: entry.placeId,
    settings: entry.settings,
    thumb: null,
    savedAt: now,
  };
  return { items: [item, ...items].slice(0, SAVED_MAX), item };
}

export interface SavedStore {
  items: SavedTerrain[];
  save(entry: { bbox: BBox; placeId: string | null; settings: Settings }): SavedTerrain;
  remove(id: string): void;
  /** Writes new settings into an item; the box and name stay. */
  update(id: string, settings: Settings): void;
  setThumb(id: string, thumb: string): void;
}

/** The saved terrains, read once from localStorage and written back after every change. */
export function useSaved(): SavedStore {
  const [items, setItems] = useState<SavedTerrain[]>(() => readSaved());
  const live = useRef(items);
  const commit = useCallback((out: SavedTerrain[]) => {
    if (out === live.current) return;
    live.current = out;
    setItems(out);
    writeSaved(out);
  }, []);
  const save = useCallback((entry: { bbox: BBox; placeId: string | null; settings: Settings }) => {
    const { items: out, item } = addSaved(live.current, entry);
    commit(out);
    return item;
  }, [commit]);
  const remove = useCallback((id: string) => commit(live.current.filter((it) => it.id !== id)), [commit]);
  const update = useCallback((id: string, settings: Settings) => {
    const key = JSON.stringify(settings);
    if (!live.current.some((it) => it.id === id && JSON.stringify(it.settings) !== key)) return;
    commit(live.current.map((it) => (it.id === id ? { ...it, settings } : it)));
  }, [commit]);
  const setThumb = useCallback((id: string, thumb: string) => {
    if (thumb.length > THUMB_MAX || !live.current.some((it) => it.id === id && it.thumb !== thumb)) return;
    commit(live.current.map((it) => (it.id === id ? { ...it, thumb } : it)));
  }, [commit]);
  return { items, save, remove, update, setThumb };
}
