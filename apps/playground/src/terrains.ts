import { useCallback, useEffect, useRef } from 'react';
import { mergeSettings, type Settings } from 'topographic';
import type { BBox } from './region/pipeline';
import { sameBox, terrainDefaults } from './region/places';
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
  /** The Map popover's Apply: the place, its defaults (MAP_TERRAIN_DEFAULTS for most), and a saved dock item. */
  apply(bbox: BBox, placeId: string | null, minimap?: Promise<string | null>): void;
  openSaved(item: SavedTerrain): void;
  openLook(i: number): void;
  /** Shuffle keeps a map place's shape and rolls everything that still shows. */
  shuffle(): void;
}

/** How long after the last change an edit is written to the active saved item. */
const SAVE_DELAY = 500;
/** How long after the last change the active saved item's picture is drawn again. */
const THUMB_DELAY = 1000;

export function useTerrains(pg: Playground): Terrains {
  const region = useRegion(pg);
  const saved = useSaved();
  const live = useRef(pg);
  live.current = pg;

  const activeSaved = region.bbox ? saved.items.find((it) => sameBox(it.bbox, region.bbox!)) ?? null : null;

  // Edits to the active saved item are written back half a second after the last change, the camera
  // included, so a click on the item brings back the view it was left in. Built-in looks keep nothing.
  const pending = useRef<{ id: string; settings: Settings } | null>(null);
  const timer = useRef(0);
  const { update } = saved;
  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const next = pending.current;
    pending.current = null;
    if (next) update(next.id, next.settings);
  }, [update]);
  const activeId = activeSaved?.id ?? null;
  useEffect(() => {
    if (!activeId) return;
    pending.current = { id: activeId, settings: pg.settings };
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_DELAY);
  }, [pg.settings, activeId, flush]);
  // A different item, or none: write what is still pending for the last one.
  useEffect(() => flush, [activeId, flush]);

  // The active item's picture: drawn once its place has loaded, and again a second after its settings change.
  const thumbKey = activeSaved ? JSON.stringify({ ...activeSaved.settings, camera: null }) : '';
  useEffect(() => {
    if (region.status !== 'ready' || !region.field || !activeSaved) return;
    let dead = false;
    const { id, settings, thumb } = activeSaved;
    const field = region.field;
    const draw = () => placeThumb(settings, field).then((url) => { if (!dead && url) saved.setThumb(id, url); });
    const wait = thumb ? window.setTimeout(draw, THUMB_DELAY) : (draw(), 0);
    return () => { dead = true; window.clearTimeout(wait); };
    // Keyed on the settings without the camera, so a camera drag does not redraw it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region.status, region.field, activeId, thumbKey]);

  return {
    region,
    saved,
    activeSaved,
    lookIndex: region.bbox ? -1 : pg.lookIndex,
    apply(bbox, placeId, minimap) {
      const now = live.current;
      const settings = mergeSettings(now.settings, terrainDefaults(placeId));
      region.setPlace(bbox, placeId);
      const item = saved.save({ bbox, placeId, settings });
      minimap?.then((url) => { if (url) saved.setMinimap(item.id, url); });
    },
    openSaved(item) {
      flush();
      if (!region.bbox || !sameBox(region.bbox, item.bbox)) region.showPlace(item.bbox, item.placeId);
      // The item's own settings, camera and motion included, as it was last left.
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
