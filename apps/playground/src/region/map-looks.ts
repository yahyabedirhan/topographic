import type { SettingsInput } from 'topographic';
import istanbulThumb from '../assets/map-looks/istanbul-thumb.webp';
import istanbulMinimap from '../assets/map-looks/istanbul-minimap.webp';
import geirangerfjordThumb from '../assets/map-looks/geirangerfjord-thumb.webp';
import geirangerfjordMinimap from '../assets/map-looks/geirangerfjord-minimap.webp';
import fujiThumb from '../assets/map-looks/fuji-thumb.webp';
import fujiMinimap from '../assets/map-looks/fuji-minimap.webp';
import yosemiteThumb from '../assets/map-looks/yosemite-thumb.webp';
import yosemiteMinimap from '../assets/map-looks/yosemite-minimap.webp';
import cyprusThumb from '../assets/map-looks/cyprus-thumb.webp';
import cyprusMinimap from '../assets/map-looks/cyprus-minimap.webp';
import matterhornThumb from '../assets/map-looks/matterhorn-thumb.webp';
import matterhornMinimap from '../assets/map-looks/matterhorn-minimap.webp';
import grandCanyonThumb from '../assets/map-looks/grand-canyon-thumb.webp';
import grandCanyonMinimap from '../assets/map-looks/grand-canyon-minimap.webp';
import torresDelPaineThumb from '../assets/map-looks/torres-del-paine-thumb.webp';
import torresDelPaineMinimap from '../assets/map-looks/torres-del-paine-minimap.webp';
import everestThumb from '../assets/map-looks/everest-thumb.webp';
import everestMinimap from '../assets/map-looks/everest-minimap.webp';
import kilimanjaroThumb from '../assets/map-looks/kilimanjaro-thumb.webp';
import kilimanjaroMinimap from '../assets/map-looks/kilimanjaro-minimap.webp';
import type { BBox } from 'topographic/locations';
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
 * `?s=gentle-summit&seed=67&lc=36&lw=0&lo=0.9&ix=4&fd=0.15&m=dark&paper=0b0b0d&mode=3d&ex=block&ev=0.12&az=341.6&ce=45.3&rd=1.15&px=-0.005&pz=-0.013&place=istanbul`.
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
 * Every place but Istanbul shares the rose pod look on #0b0b0d paper, with its own ink, elevation and camera
 * angle, decoded from `?look=rose-pod&lc=36&lw=0&lo=0.9&ix=4&ink=…&paper=0b0b0d&mode=3d&ex=block&ev=…&az=341.8&ce=…&rd=1.32&px=0.003&pz=0.05&place=…`.
 */
function rosePod(ink: string, elevation: number, cameraElevation: number, azimuth = 341.8, camera: SettingsInput['camera'] = {}): SettingsInput {
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
    camera: { azimuth, elevation: cameraElevation, radius: 1.32, motion: 'still', panX: 0.003, panZ: 0.05, ...camera },
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
  // Each ink is a quiet tint of the land: dry stone, glacier ice, fjord water, red rock, granite and pine,
  // glacial lakes, volcanic ash, high snow and savanna.
  mapLook('grand-canyon', 'grand-canyon', rosePod('#dcb9a0', 0.08, 40, 10), grandCanyonThumb, grandCanyonMinimap),
  mapLook('geirangerfjord', 'geirangerfjord', rosePod('#a8c7f0', 0.16, 35), geirangerfjordThumb, geirangerfjordMinimap),
  mapLook('yosemite', 'yosemite', rosePod('#a8eff0', 0.16, 35), yosemiteThumb, yosemiteMinimap),
  mapLook('fuji', 'fuji', rosePod('#9fbecc', 0.24, 30), fujiThumb, fujiMinimap),
  mapLook('matterhorn', 'matterhorn', rosePod('#c4d7e8', 0.16, 35), matterhornThumb, matterhornMinimap),
  mapLook('torres-del-paine', 'torres-del-paine', rosePod('#b3d6d0', 0.16, 35), torresDelPaineThumb, torresDelPaineMinimap),
  mapLook('everest', 'everest', rosePod('#d5e2ee', 0.2, 40), everestThumb, everestMinimap),
  mapLook('kilimanjaro', 'kilimanjaro', rosePod('#d4c39e', 0.24, 30), kilimanjaroThumb, kilimanjaroMinimap),
  mapLook('cyprus', 'cyprus', rosePod('#d6cdb0', 0.1, 51.1, 0.1, { radius: 1.28, panX: -0.014, panZ: -0.01 }), cyprusThumb, cyprusMinimap),
];

export function findMapLook(id: string | null): MapLook | undefined {
  return MAP_LOOKS.find((look) => look.id === id);
}
