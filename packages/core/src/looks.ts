import type { SettingsInput } from './settings.js';

/** The ids of the built-in looks. A look's id is its name in lower case, with dashes. */
export type LookId =
  | 'survey-ridge' | 'fine-granite' | 'wide-lobes' | 'rose-pod' | 'terraces' | 'high-dunes' | 'moss-granite' | 'sea-dunes'
  | 'night-flower' | 'night-lobes' | 'violet-pod' | 'ink-petals' | 'stepped-petals' | 'day-lobes' | 'still-dunes' | 'rocky-spine'
  | 'pale-dunes' | 'stone-grain' | 'open-pod' | 'quiet-hill' | 'bloom' | 'soft-summit' | 'paper-ridge' | 'centred-lobes'
  | 'survey-map' | 'rocky';

/** A named, finished design: a shape, a seed, the line and terrain values, the colours and a 3D camera pose. */
export interface Look {
  id: LookId;
  name: string;
  settings: SettingsInput;
}

type Mode = 'light' | 'dark';
type Pose = { azimuth: number; elevation: number; radius: number };

// The four camera poses the looks share.
const LEFT: Pose = { azimuth: 79.7, elevation: 30, radius: 1.92 };
const RIGHT: Pose = { azimuth: 294.7, elevation: 34, radius: 2.3 };
const DUNES: Pose = { azimuth: 14.7, elevation: 34, radius: 1.92 };
const RIDGE: Pose = { azimuth: 324.7, elevation: 34, radius: 1.92 };
const ABOVE: Pose = { azimuth: 349.7, elevation: 38, radius: 1.92 };

const idOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') as LookId;

function look(
  name: string,
  shape: SettingsInput['shape'],
  seed: number,
  mode: Mode,
  paper: string,
  ink: string,
  camera: Pose,
  rest: Omit<SettingsInput, 'shape' | 'seed' | 'theme' | 'camera'> = {},
): Look {
  const { layout, ...groups } = rest;
  return {
    id: idOf(name),
    name,
    settings: { shape, seed, ...groups, layout: { fade: 0.15, ...layout }, theme: { mode, paper, ink }, camera: { ...camera } },
  };
}

/**
 * Every built-in look, in the order of the playground's dock. The playground opens on `fine-granite`.
 * `survey-map` and `rocky` set no colours, so they follow the page's light or dark theme.
 */
export const LOOKS: readonly Look[] = [
  look('Survey ridge', 'long-ridge', 113, 'dark', '#141414', '#e8e6e1', { azimuth: 349.7, elevation: 33.6, radius: 1.92 }, { terrain: { roughness: 0.12 }, lines: { count: 46, indexEvery: 5, opacity: 0.55, width: 0.12 } }),
  look('Fine granite', 'granite', 191, 'dark', '#0b0b0d', '#d7d2c8', LEFT, { lines: { count: 54, width: 0.1, opacity: 0.62 } }),
  look('Wide lobes', 'drifting-lobes', 157, 'dark', '#12141a', '#c9c2b4', LEFT, { terrain: { peaks: 3, spread: 0.75, variant: 0.4 }, lines: { count: 30, width: 0.16 } }),
  look('Rose pod', 'seed-pod', 71, 'dark', '#1a1214', '#f0b2a8', RIGHT, { motion: { speed: 0.55 }, lines: { count: 24, width: 0.18 } }),
  look('Terraces', 'gentle-summit', 131, 'dark', '#16130f', '#e0b089', RIGHT, { terrain: { terracing: 0.85, peaks: 2 }, lines: { count: 36, width: 0.14 } }),
  look('High dunes', 'dunes', 227, 'dark', '#101614', '#c6d6a8', DUNES, { terrain: { roughness: 0.35 }, lines: { count: 40, width: 0.14 } }),
  look('Moss granite', 'granite', 53, 'dark', '#101614', '#9dcec0', LEFT, { terrain: { roughness: 0.22 }, lines: { count: 40, width: 0.14 } }),
  look('Sea dunes', 'dunes', 97, 'dark', '#0e1a22', '#8ec4d4', DUNES, { lines: { count: 48, width: 0.12 } }),
  look('Night flower', 'five-petals', 179, 'dark', '#10151c', '#a9c7e4', LEFT, { lines: { count: 44, indexEvery: 4, width: 0.12 } }),
  look('Night lobes', 'drifting-lobes', 11, 'dark', '#0b0b0d', '#9fb0cc', RIGHT, { terrain: { variant: 0.15 }, lines: { count: 22, width: 0.18 } }),
  look('Violet pod', 'seed-pod', 211, 'dark', '#16131a', '#b9a4e0', RIGHT, { motion: { warp: 0.7 }, lines: { count: 30, width: 0.16 } }),
  look('Ink petals', 'five-petals', 37, 'dark', '#16131a', '#cbb6ea', LEFT, { lines: { count: 26, width: 0.2 } }),
  look('Stepped petals', 'five-petals', 233, 'light', '#f6eef2', '#6b3050', LEFT, { terrain: { terracing: 0.72 }, lines: { count: 28, width: 0.16 } }),
  look('Day lobes', 'drifting-lobes', 83, 'light', '#f6eef2', '#5c3348', RIGHT, { terrain: { variant: 0.92 }, lines: { count: 28, width: 0.16 } }),
  look('Still dunes', 'dunes', 163, 'light', '#f3ece4', '#7a3e2e', DUNES, { motion: { speed: 0 }, lines: { count: 26, width: 0.14 } }),
  look('Rocky spine', 'long-ridge', 181, 'light', '#efe6d6', '#5c3a28', RIDGE, { terrain: { roughness: 0.62, sharpness: 0.22 }, lines: { count: 34, width: 0.18 } }),
  look('Pale dunes', 'dunes', 23, 'light', '#efe6d6', '#6b4630', DUNES, { lines: { count: 34, width: 0.16 } }),
  look('Stone grain', 'granite', 127, 'light', '#e7e2d8', '#3a342c', LEFT, { terrain: { roughness: 0.5 }, lines: { count: 32, width: 0.16 } }),
  look('Open pod', 'seed-pod', 149, 'light', '#f4f1ea', '#2c2c2a', ABOVE, { layout: { anchor: 1, fade: 0.15 }, lines: { count: 20, width: 0.16 } }),
  look('Quiet hill', 'gentle-summit', 197, 'light', '#f7f4ee', '#2c2c2a', RIGHT, { layout: { fade: 0.05 }, lines: { count: 14, width: 0.14 } }),
  look('Bloom', 'five-petals', 101, 'light', '#f3efe6', '#3c4a36', LEFT, { terrain: { terracing: 0.45 }, lines: { count: 20, width: 0.18 } }),
  look('Soft summit', 'gentle-summit', 67, 'light', '#e5eef0', '#1e4650', RIGHT, { lines: { count: 16, width: 0.16 } }),
  look('Paper ridge', 'long-ridge', 41, 'light', '#f7f4ee', '#3d4c63', RIDGE, { terrain: { sharpness: 0.35 }, lines: { count: 22, width: 0.16 } }),
  look('Centred lobes', 'drifting-lobes', 223, 'light', '#e7eef6', '#243656', ABOVE, { layout: { anchor: 1, fade: 0.15 }, terrain: { variant: 0.55 }, lines: { count: 24, width: 0.16 } }),
  {
    id: 'survey-map', name: 'Survey map',
    settings: { shape: 'gentle-summit', lines: { count: 44, indexEvery: 5, opacity: 0.55 }, terrain: { peaks: 3, spread: 0.6, roughness: 0.2 }, motion: { speed: 0.4, sparkle: 0 }, camera: { ...RIGHT } },
  },
  {
    id: 'rocky', name: 'Rocky',
    settings: { shape: 'long-ridge', terrain: { roughness: 0.55, sharpness: 0.3 }, lines: { count: 36 }, camera: { ...RIDGE } },
  },
];

export function findLook(id: string | null | undefined): Look | undefined {
  return id ? LOOKS.find((l) => l.id === id) : undefined;
}
