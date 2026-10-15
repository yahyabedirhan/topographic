import { useEffect, useRef } from 'react';
import { mergeSettings } from 'topographic';
import type { BBox } from './region/pipeline';
import { MAP_TERRAIN_DEFAULTS, sameBox } from './region/places';
import { useRegion, type RegionController } from './region/useRegion';
import { useSaved, type SavedStore, type SavedTerrain } from './saved';
import { placeThumb, type Playground } from './shared';

/**
 * Every dock item is a whole terrain: a shape plus its colours and lines. Built-in looks are
 * generated shapes; saved items are map places. This hook joins the place, the saved list and the
 * settings, so a click on any item switches both.
 */
export interface Terrains {
  region: RegionController;
  saved: SavedStore;
  /** The saved item whose box is applied, if any. */
  activeSaved: SavedTerrain | null;
  /** The built-in look that matches the settings, or -1. A map place selects no look. */
  lookIndex: number;
  /** The Map popover's Apply: the place, MAP_TERRAIN_DEFAULTS, and a saved dock item. */
  apply(bbox: BBox, placeId: string | null): void;
  openSaved(item: SavedTerrain): void;
  openLook(i: number): void;
  /** Shuffle keeps a map place's shape and rolls everything that still shows. */
  shuffle(): void;
}

export function useTerrains(pg: Playground): Terrains {
  const region = useRegion(pg);
  const saved = useSaved();
  const live = useRef(pg);
  live.current = pg;

  const activeSaved = region.bbox ? saved.items.find((it) => sameBox(it.bbox, region.bbox!)) ?? null : null;

  // A new saved item gets its picture once its place has loaded.
  useEffect(() => {
    if (region.status !== 'ready' || !region.field || !activeSaved || activeSaved.thumb) return;
    let dead = false;
    const { id, settings } = activeSaved;
    placeThumb(settings, region.field).then((url) => { if (!dead && url) saved.setThumb(id, url); });
    return () => { dead = true; };
  }, [region.status, region.field, activeSaved, saved]);

  return {
    region,
    saved,
    activeSaved,
    lookIndex: region.bbox ? -1 : pg.lookIndex,
    apply(bbox, placeId) {
      const now = live.current;
      const settings = mergeSettings(now.settings, MAP_TERRAIN_DEFAULTS);
      region.setPlace(bbox, placeId);
      saved.save({ bbox, placeId, settings });
    },
    openSaved(item) {
      if (!region.bbox || !sameBox(region.bbox, item.bbox)) region.showPlace(item.bbox, item.placeId);
      live.current.replace(item.settings);
    },
    openLook(i) {
      if (region.bbox) region.clear();
      live.current.applyLook(i);
    },
    shuffle() {
      live.current.shuffle(Boolean(region.bbox));
    },
  };
}
