import type { SettingsInput } from 'topographic';

export interface Look {
  name: string;
  settings: SettingsInput;
}

/**
 * Each look's 3D camera pose. A click on the look always brings it back; the motion stays as it is.
 * A plain landform without a look uses the playground camera (share-url.ts).
 */
export const LOOK_CAMERAS: Readonly<Record<string, { azimuth: number; elevation: number; radius: number }>> = {
  'Survey ridge': { azimuth: 349.7, elevation: 33.6, radius: 1.92 },
  'Fine granite': { azimuth: 79.7, elevation: 30, radius: 1.92 },
  'Wide lobes': { azimuth: 79.7, elevation: 30, radius: 1.92 },
  'Rose pod': { azimuth: 294.7, elevation: 34, radius: 2.3 },
  'Terraces': { azimuth: 294.7, elevation: 34, radius: 2.3 },
  'High dunes': { azimuth: 14.7, elevation: 34, radius: 1.92 },
  'Moss granite': { azimuth: 79.7, elevation: 30, radius: 1.92 },
  'Sea dunes': { azimuth: 14.7, elevation: 34, radius: 1.92 },
  'Night flower': { azimuth: 79.7, elevation: 30, radius: 1.92 },
  'Night lobes': { azimuth: 294.7, elevation: 34, radius: 2.3 },
  'Violet pod': { azimuth: 294.7, elevation: 34, radius: 2.3 },
  'Ink petals': { azimuth: 79.7, elevation: 30, radius: 1.92 },
  'Stepped petals': { azimuth: 79.7, elevation: 30, radius: 1.92 },
  'Day lobes': { azimuth: 294.7, elevation: 34, radius: 2.3 },
  'Still dunes': { azimuth: 14.7, elevation: 34, radius: 1.92 },
  'Rocky spine': { azimuth: 324.7, elevation: 34, radius: 1.92 },
  'Pale dunes': { azimuth: 14.7, elevation: 34, radius: 1.92 },
  'Stone grain': { azimuth: 79.7, elevation: 30, radius: 1.92 },
  'Open pod': { azimuth: 349.7, elevation: 38, radius: 1.92 },
  'Quiet hill': { azimuth: 294.7, elevation: 34, radius: 2.3 },
  'Bloom': { azimuth: 79.7, elevation: 30, radius: 1.92 },
  'Soft summit': { azimuth: 294.7, elevation: 34, radius: 2.3 },
  'Paper ridge': { azimuth: 324.7, elevation: 34, radius: 1.92 },
  'Centred lobes': { azimuth: 349.7, elevation: 38, radius: 1.92 },
};

type Mode = 'light' | 'dark';

function look(
  name: string,
  landform: SettingsInput['landform'],
  seed: number,
  mode: Mode,
  paper: string,
  ink: string,
  rest: Omit<SettingsInput, 'landform' | 'seed' | 'theme' | 'camera'> = {},
): Look {
  const { layout, ...groups } = rest;
  return {
    name,
    settings: { landform, seed, ...groups, layout: { fade: 0.15, ...layout }, theme: { mode, paper, ink }, camera: LOOK_CAMERAS[name] },
  };
}

export const LOOKS: readonly Look[] = [
  look('Survey ridge', 'long-ridge', 113, 'dark', '#141414', '#e8e6e1', { terrain: { roughness: 0.12 }, lines: { count: 46, indexEvery: 5, opacity: 0.55, width: 0.12 } }),
  look('Fine granite', 'granite', 191, 'dark', '#0b0b0d', '#d7d2c8', { lines: { count: 54, width: 0.1, opacity: 0.62 } }),
  look('Wide lobes', 'drifting-lobes', 157, 'dark', '#12141a', '#c9c2b4', { terrain: { peaks: 3, spread: 0.75, variant: 0.4 }, lines: { count: 30, width: 0.16 } }),
  look('Rose pod', 'seed-pod', 71, 'dark', '#1a1214', '#f0b2a8', { motion: { speed: 0.55 }, lines: { count: 24, width: 0.18 } }),
  look('Terraces', 'gentle-summit', 131, 'dark', '#16130f', '#e0b089', { terrain: { terracing: 0.85, peaks: 2 }, lines: { count: 36, width: 0.14 } }),
  look('High dunes', 'dunes', 227, 'dark', '#101614', '#c6d6a8', { terrain: { roughness: 0.35 }, lines: { count: 40, width: 0.14 } }),
  look('Moss granite', 'granite', 53, 'dark', '#101614', '#9dcec0', { terrain: { roughness: 0.22 }, lines: { count: 40, width: 0.14 } }),
  look('Sea dunes', 'dunes', 97, 'dark', '#0e1a22', '#8ec4d4', { lines: { count: 48, width: 0.12 } }),
  look('Night flower', 'five-petals', 179, 'dark', '#10151c', '#a9c7e4', { lines: { count: 44, indexEvery: 4, width: 0.12 } }),
  look('Night lobes', 'drifting-lobes', 11, 'dark', '#0b0b0d', '#9fb0cc', { terrain: { variant: 0.15 }, lines: { count: 22, width: 0.18 } }),
  look('Violet pod', 'seed-pod', 211, 'dark', '#16131a', '#b9a4e0', { motion: { warp: 0.7 }, lines: { count: 30, width: 0.16 } }),
  look('Ink petals', 'five-petals', 37, 'dark', '#16131a', '#cbb6ea', { lines: { count: 26, width: 0.2 } }),
  look('Stepped petals', 'five-petals', 233, 'light', '#f6eef2', '#6b3050', { terrain: { terracing: 0.72 }, lines: { count: 28, width: 0.16 } }),
  look('Day lobes', 'drifting-lobes', 83, 'light', '#f6eef2', '#5c3348', { terrain: { variant: 0.92 }, lines: { count: 28, width: 0.16 } }),
  look('Still dunes', 'dunes', 163, 'light', '#f3ece4', '#7a3e2e', { motion: { speed: 0 }, lines: { count: 26, width: 0.14 } }),
  look('Rocky spine', 'long-ridge', 181, 'light', '#efe6d6', '#5c3a28', { terrain: { roughness: 0.62, sharpness: 0.22 }, lines: { count: 34, width: 0.18 } }),
  look('Pale dunes', 'dunes', 23, 'light', '#efe6d6', '#6b4630', { lines: { count: 34, width: 0.16 } }),
  look('Stone grain', 'granite', 127, 'light', '#e7e2d8', '#3a342c', { terrain: { roughness: 0.5 }, lines: { count: 32, width: 0.16 } }),
  look('Open pod', 'seed-pod', 149, 'light', '#f4f1ea', '#2c2c2a', { layout: { anchor: 1, fade: 0.15 }, lines: { count: 20, width: 0.16 } }),
  look('Quiet hill', 'gentle-summit', 197, 'light', '#f7f4ee', '#2c2c2a', { layout: { fade: 0.05 }, lines: { count: 14, width: 0.14 } }),
  look('Bloom', 'five-petals', 101, 'light', '#f3efe6', '#3c4a36', { terrain: { terracing: 0.45 }, lines: { count: 20, width: 0.18 } }),
  look('Soft summit', 'gentle-summit', 67, 'light', '#e5eef0', '#1e4650', { lines: { count: 16, width: 0.16 } }),
  look('Paper ridge', 'long-ridge', 41, 'light', '#f7f4ee', '#3d4c63', { terrain: { sharpness: 0.35 }, lines: { count: 22, width: 0.16 } }),
  look('Centred lobes', 'drifting-lobes', 223, 'light', '#e7eef6', '#243656', { layout: { anchor: 1, fade: 0.15 }, terrain: { variant: 0.55 }, lines: { count: 24, width: 0.16 } }),
];
