import type { SettingsInput } from 'topographic';
import istanbulThumb from '../assets/map-looks/istanbul-thumb.webp';
import istanbulMinimap from '../assets/map-looks/istanbul-minimap.webp';
import type { BBox } from './pipeline';
import { findPlace } from './places';

/**
 * A built-in map terrain: a place from PLACES with its full settings, camera and pan included.
 * It sits first in the dock for every visitor. Like a look, it is a preset: edits are not kept,
 * and a click brings back these settings.
 */
export interface MapLook {
  id: string;
  name: string;
  placeId: string;
  bbox: BBox;
  /** Every setting, so the look does not drift when a library default changes. */
  settings: SettingsInput;
  /** The dock picture, drawn like a saved terrain's (scripts/map-look-assets.mjs). */
  thumb: string;
  /** The basemap under the place's box, captured like Apply does (scripts/map-look-assets.mjs). */
  minimap: string;
}

/**
 * Istanbul, decoded with readSettings from the owner's link
 * `?s=gentle-summit&seed=67&lc=36&lw=0&lo=0.9&ix=4&fd=0.15&m=dark&mode=3d&ex=block&ev=0.12&az=353.3&ce=45.1&rd=1.15&px=0.043&pz=-0.075&place=istanbul`.
 */
export const ISTANBUL_SETTINGS = {
  style: 'gentle-summit',
  seed: 67,
  lines: { count: 36, width: 0, opacity: 0.9, indexEvery: 4 },
  terrain: { peaks: 1, spread: 0.5, roughness: 0, sharpness: 0.5, terracing: 0, variant: 0.5 },
  motion: { speed: 1, warp: 0.47, sparkle: 0.6 },
  layout: { anchor: 0, fade: 0.15 },
  theme: { mode: 'dark' },
  mode: '3d',
  elevation: 0.12,
  extent: 'block',
  detail: 0.5,
  camera: { azimuth: 353.3, elevation: 45.1, radius: 1.15, motion: 'still', panX: 0.043, panZ: -0.075 },
} as const satisfies SettingsInput;

function mapLook(id: string, placeId: string, settings: SettingsInput, thumb: string, minimap: string): MapLook {
  const place = findPlace(placeId);
  if (!place) throw new Error(`No place ${placeId}`);
  return { id, name: place.name, placeId, bbox: place.bbox, settings, thumb, minimap };
}

/** The built-in map terrains, in dock order. */
export const MAP_LOOKS: readonly MapLook[] = [
  mapLook('istanbul', 'istanbul', ISTANBUL_SETTINGS, istanbulThumb, istanbulMinimap),
];

export function findMapLook(id: string | null): MapLook | undefined {
  return MAP_LOOKS.find((look) => look.id === id);
}
