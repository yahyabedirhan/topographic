import type { Settings } from './settings.js';

/** A land shape for the procedural terrain. `index` selects the branch in the combined shader. */
export interface Landform {
  id: LandformId;
  name: string;
  index: number;
  description: string;
  /** Per-landform starting values, applied before user settings. */
  defaults?: DeepPartialSettings;
}

export type DeepPartialSettings = { [K in keyof Settings]?: Settings[K] extends object ? Partial<Settings[K]> : Settings[K] };

export type LandformId = 'drifting-lobes' | 'granite' | 'five-petals' | 'seed-pod' | 'gentle-summit' | 'long-ridge' | 'dunes';

export const LANDFORMS: readonly Landform[] = [
  { id: 'drifting-lobes', name: 'Drifting lobes', index: 0, description: 'Three soft lobes drifting off to the side, morphing towards four.' },
  { id: 'granite', name: 'Granite', index: 1, description: 'Many small lumpy lobes with a stone-grain tint.' },
  { id: 'five-petals', name: 'Five petals', index: 3, description: 'A breathing five-petal summit.' },
  { id: 'seed-pod', name: 'Seed pod', index: 4, description: 'Two long lobes slowly turning, like a seed pod.' },
  { id: 'gentle-summit', name: 'Gentle summit', index: 5, description: 'One soft, slightly oval hill leaning with the flow.' },
  { id: 'long-ridge', name: 'Long ridge', index: 7, description: 'A long winding ridge with rounded ends.' },
  { id: 'dunes', name: 'Dunes', index: 11, description: 'Long wind ripples with no summits.', defaults: { layout: { fade: 0.5 } } },
];

export const DEFAULT_LANDFORM: LandformId = 'drifting-lobes';

export function findLandform(id: string): Landform | undefined {
  return LANDFORMS.find((s) => s.id === id);
}
