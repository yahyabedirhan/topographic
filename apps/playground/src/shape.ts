import { mergeSettings, type ParamDef, type Settings } from 'topographic';

/**
 * What a heightfield replaces. With a map place applied, the core renderer draws the place's
 * heights instead of the generated field, so these settings have no visible effect:
 * every Terrain param, Motion's warp, and the seed. The style still tints granite ink and sets
 * line defaults, so it is not listed; the dock keeps it with the shape anyway.
 */
export function ignoredWithPlace(param: Pick<ParamDef, 'group' | 'key'>): boolean {
  return param.group === 'terrain' || (param.group === 'motion' && param.key === 'warp');
}

/** `next` with the generated shape (style, seed, terrain and warp) of `from`. */
export function keepShape(next: Settings, from: Settings): Settings {
  return mergeSettings(next, {
    style: from.style,
    seed: from.seed,
    terrain: { ...from.terrain },
    motion: { warp: from.motion.warp },
  });
}
