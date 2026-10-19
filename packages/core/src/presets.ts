import type { SettingsInput } from './settings.js';

export interface Preset {
  name: string;
  settings: SettingsInput;
}

/** Curated starting points. The first one is the default look. */
export const PRESETS: readonly Preset[] = [
  { name: 'Drifting lobes', settings: { landform: 'drifting-lobes' } },
  { name: 'Granite', settings: { landform: 'granite', lines: { count: 34 }, terrain: { roughness: 0.15 } } },
  { name: 'Five petals', settings: { landform: 'five-petals' } },
  { name: 'Seed pod', settings: { landform: 'seed-pod', motion: { speed: 0.7 } } },
  { name: 'Gentle summit', settings: { landform: 'gentle-summit', lines: { count: 26 } } },
  { name: 'Long ridge', settings: { landform: 'long-ridge', terrain: { sharpness: 0.4 } } },
  { name: 'Dunes', settings: { landform: 'dunes', motion: { sparkle: 0.3 } } },
  { name: 'Survey map', settings: { landform: 'gentle-summit', lines: { count: 44, indexEvery: 5, opacity: 0.55 },
    terrain: { peaks: 3, spread: 0.6, roughness: 0.2 }, motion: { speed: 0.4, sparkle: 0 } } },
  { name: 'Terraces', settings: { landform: 'gentle-summit', terrain: { terracing: 0.8, peaks: 2 }, motion: { sparkle: 0.2 } } },
  { name: 'Rocky', settings: { landform: 'long-ridge', terrain: { roughness: 0.55, sharpness: 0.3 }, lines: { count: 36 } } },
];
