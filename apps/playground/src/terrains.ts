import { useCallback, useEffect, useRef, useState } from 'react';
import { mergeSettings, resolveSettings, type Settings } from 'topographic';
import { findMapLook, MAP_LOOKS, type MapLook } from './region/map-looks';
import type { BBox } from 'topographic/locations';
import { sameBox, terrainDefaults } from './region/places';
import { useRegion, type RegionController } from './region/useRegion';
import { useSaved, type SavedStore, type SavedTerrain } from './saved';
import { placeThumb, type Playground } from './shared';
import { track } from './analytics';

/**
 * Every dock item is a whole terrain: a shape plus its colours and lines. Built-in looks are
 * generated shapes; saved items are map places. This hook joins the place, the saved list and the
 * settings, so a click on any item switches both.
 */
export interface Terrains {
  region: RegionController;
  saved: SavedStore;
  /** The saved item whose box is applied, if any. Null while a built-in map terrain is open. */
  activeSaved: SavedTerrain | null;
  /** The built-in map terrain that was opened from the dock (or from its own link), while its place stays applied. */
  activeMapLook: MapLook | null;
  /** The built-in look that matches the settings, or -1. A map place selects no look. */
  lookIndex: number;
  /** The Map popover's Apply: the place, its defaults (MAP_TERRAIN_DEFAULTS for most), and a saved dock item. */
  apply(bbox: BBox, placeId: string | null, minimap?: Promise<string | null>): void;
  openSaved(item: SavedTerrain): void;
  /** Opens a built-in map terrain with its own settings. Like a look, edits to it are not kept. */
  openMapLook(look: MapLook): void;
  openLook(i: number): void;
  /** Shuffle keeps a map place's shape and rolls everything that still shows. */
  shuffle(): void;
}

/** How long after the last change an edit is written to the active saved item. */
const SAVE_DELAY = 500;
/** How long after the last change the active saved item's picture is drawn again. */
const THUMB_DELAY = 1000;

/** A built-in map terrain's settings with the viewer's detail and budget. */
function viewerQuality(look: MapLook, now: Settings): Settings {
  return mergeSettings(resolveSettings(look.settings), { detail: now.detail, quality: now.quality });
}

export function useTerrains(pg: Playground): Terrains {
  const region = useRegion(pg);
  const saved = useSaved();
  const live = useRef(pg);
  live.current = pg;

  // A built-in map terrain is open from a dock click, or from a link that carries exactly its place
  // and settings. It stays open while its place does; a saved item with the same box then waits.
  const [mapLookId, setMapLookId] = useState<string | null>(() => {
    const key = JSON.stringify(pg.settings);
    return MAP_LOOKS.find((look) => region.bbox && sameBox(look.bbox, region.bbox) && region.placeId === look.placeId
      && JSON.stringify(viewerQuality(look, pg.settings)) === key)?.id ?? null;
  });
  const openLookItem = findMapLook(mapLookId);
  const activeMapLook = openLookItem && region.bbox && sameBox(region.bbox, openLookItem.bbox) ? openLookItem : null;
  // Any other place, or none: the built-in is closed for good, so a later visit to its box is not it.
  useEffect(() => { if (mapLookId && !activeMapLook) setMapLookId(null); }, [mapLookId, activeMapLook]);
  const activeSaved = region.bbox && !activeMapLook ? saved.items.find((it) => sameBox(it.bbox, region.bbox!)) ?? null : null;

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
    activeMapLook,
    lookIndex: region.bbox ? -1 : pg.lookIndex,
    apply(bbox, placeId, minimap) {
      track('place_applied', { place: placeId ?? 'custom' });
      const now = live.current;
      const settings = mergeSettings(now.settings, terrainDefaults(placeId));
      setMapLookId(null);
      region.setPlace(bbox, placeId);
      const item = saved.save({ bbox, placeId, settings });
      minimap?.then((url) => { if (url) saved.setMinimap(item.id, url); });
    },
    openSaved(item) {
      flush();
      setMapLookId(null);
      if (!region.bbox || !sameBox(region.bbox, item.bbox)) region.showPlace(item.bbox, item.placeId);
      // The item's own settings, camera and motion included, as it was last left.
      live.current.replace(item.settings);
    },
    openMapLook(look) {
      flush();
      setMapLookId(look.id);
      if (!region.bbox || !sameBox(region.bbox, look.bbox)) region.showPlace(look.bbox, look.placeId);
      // Always the defined settings, camera and pan included: a built-in keeps no edits. Detail and budget stay the viewer's.
      live.current.replace(viewerQuality(look, live.current.settings));
    },
    openLook(i) {
      setMapLookId(null);
      if (region.bbox) region.clear();
      live.current.applyLook(i);
    },
    shuffle() {
      live.current.shuffle(Boolean(region.bbox));
    },
  };
}
