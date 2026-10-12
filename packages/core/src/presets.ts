import type { SettingsInput } from './settings.js';

export interface Preset {
  name: string;
  settings: SettingsInput;
}

/** Curated starting points. The first one is the default look. */
export const PRESETS: readonly Preset[] = [
  { name: 'Drifting lobes', settings: { style: 'drifting-lobes' } },
  { name: 'Granite', settings: { style: 'granite', lines: { count: 34 }, terrain: { roughness: 0.15 } } },
  { name: 'Five petals', settings: { style: 'five-petals' } },
  { name: 'Seed pod', settings: { style: 'seed-pod', motion: { speed: 0.7 } } },
  { name: 'Gentle summit', settings: { style: 'gentle-summit', lines: { count: 26 } } },
  { name: 'Long ridge', settings: { style: 'long-ridge', terrain: { sharpness: 0.6 } } },
  { name: 'Dunes', settings: { style: 'dunes', motion: { sparkle: 0.3 } } },
  { name: 'Survey map', settings: { style: 'gentle-summit', lines: { count: 44, indexEvery: 5, opacity: 0.55 },
    terrain: { peaks: 3, spread: 0.6, roughness: 0.2 }, motion: { speed: 0.4, sparkle: 0 } } },
  { name: 'Terraces', settings: { style: 'gentle-summit', terrain: { terracing: 0.8, peaks: 2 }, motion: { sparkle: 0.2 } } },
  { name: 'Rocky', settings: { style: 'long-ridge', terrain: { roughness: 0.55, sharpness: 0.7 }, lines: { count: 36 } } },
];
