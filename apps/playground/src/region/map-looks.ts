import type { SettingsInput } from 'topographic';
import istanbulThumb from '../assets/map-looks/istanbul-thumb.webp';
import istanbulMinimap from '../assets/map-looks/istanbul-minimap.webp';
import geirangerfjordThumb from '../assets/map-looks/geirangerfjord-thumb.webp';
import geirangerfjordMinimap from '../assets/map-looks/geirangerfjord-minimap.webp';
import fujiThumb from '../assets/map-looks/fuji-thumb.webp';
import fujiMinimap from '../assets/map-looks/fuji-minimap.webp';
import yosemiteThumb from '../assets/map-looks/yosemite-thumb.webp';
import yosemiteMinimap from '../assets/map-looks/yosemite-minimap.webp';
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
 * Istanbul, decoded with readSettings from the query
 * `?lf=gentle-summit&seed=67&lc=36&lw=0&lo=0.9&ix=4&fd=0.15&m=dark&paper=0b0b0d&mode=3d&ex=block&ev=0.12&az=341.6&ce=45.3&rd=1.15&px=-0.005&pz=-0.013&place=istanbul`.
 */
export const ISTANBUL_SETTINGS = {
  shape: 'gentle-summit',
  seed: 67,
  lines: { count: 36, width: 0, opacity: 0.9, indexEvery: 4 },
  terrain: { peaks: 1, spread: 0.5, roughness: 0, sharpness: 0.5, terracing: 0, variant: 0.5 },
  motion: { speed: 1, warp: 0.47, sparkle: 0.6 },
  layout: { anchor: 0, fade: 0.15 },
  theme: { mode: 'dark', paper: '#0b0b0d' },
  mode: '3d',
  elevation: 0.12,
  extent: 'block',
  camera: { azimuth: 341.6, elevation: 45.3, radius: 1.15, motion: 'still', panX: -0.005, panZ: -0.013 },
} as const satisfies SettingsInput;

/**
 * Geirangerfjord, Mount Fuji and Yosemite share the rose pod look on #0b0b0d paper, with their own ink, elevation and camera
 * angle, decoded from `?look=rose-pod&lc=36&lw=0&lo=0.9&ix=4&ink=…&paper=0b0b0d&mode=3d&ex=block&ev=…&az=341.8&ce=…&rd=1.32&px=0.033&pz=-0.049&place=…`.
 */
function rosePod(ink: string, elevation: number, cameraElevation: number): SettingsInput {
  return {
    shape: 'seed-pod',
    seed: 71,
    lines: { count: 36, width: 0, opacity: 0.9, indexEvery: 4 },
    terrain: { peaks: 1, spread: 0.5, roughness: 0, sharpness: 0.5, terracing: 0, variant: 0.5 },
    motion: { speed: 0.55, warp: 0.47, sparkle: 0.6 },
    layout: { anchor: 0, fade: 0.15 },
    theme: { mode: 'dark', paper: '#0b0b0d', ink },
    mode: '3d',
    elevation,
    extent: 'block',
      camera: { azimuth: 341.8, elevation: cameraElevation, radius: 1.32, motion: 'still', panX: 0.033, panZ: -0.049 },
  };
}

function mapLook(id: string, placeId: string, settings: SettingsInput, thumb: string, minimap: string): MapLook {
  const place = findPlace(placeId);
  if (!place) throw new Error(`No place ${placeId}`);
  return { id, name: place.name, placeId, bbox: place.bbox, settings, thumb, minimap };
}

/** The built-in map terrains, in dock order. */
export const MAP_LOOKS: readonly MapLook[] = [
  mapLook('istanbul', 'istanbul', ISTANBUL_SETTINGS, istanbulThumb, istanbulMinimap),
  mapLook('geirangerfjord', 'geirangerfjord', rosePod('#a8c7f0', 0.16, 35), geirangerfjordThumb, geirangerfjordMinimap),
  mapLook('fuji', 'fuji', rosePod('#9fbecc', 0.24, 30), fujiThumb, fujiMinimap),
  mapLook('yosemite', 'yosemite', rosePod('#a8eff0', 0.16, 35), yosemiteThumb, yosemiteMinimap),
];

export function findMapLook(id: string | null): MapLook | undefined {
  return MAP_LOOKS.find((look) => look.id === id);
}
