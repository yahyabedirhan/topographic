/** `full` draws like `high` with no pixel caps of its own: only the renderer's `maxPixelRatio` and `maxPixels` apply. */
export type QualityName = 'auto' | 'low' | 'medium' | 'high' | 'full';
export type TierId = Exclude<QualityName, 'auto' | 'full'>;

export const QUALITIES: readonly QualityName[] = ['auto', 'low', 'medium', 'high', 'full'];

/** One step of the ladder. Pixel caps are the iPhone 14 Pro CSS frame (393×852) times the DPR. */
export interface QualityTier {
  id: TierId;
  maxPixelRatio: number;
  maxPixels: number;
  /** Segments along one side, including a real place. Uint16 indices stay safe under 256. */
  meshCap: number;
}

/**
 * Frame budgets are the display periods: 1000/60 and 1000/120.
 * Idle presentation sat on 16.7 ms under software GL, so those steps did not
 * separate. A drag that called update() every frame landed around 50–90 ms at
 * 393×852, mesh 96. The ladder therefore cuts pixels and vertices, and the
 * renderer steps down only when presented frames miss the period above. It does
 * not step up: vsync hides spare time.
 */
export const FRAME_MS = { hz60: 1000 / 60, hz120: 1000 / 120 } as const;

const PHONE_W = 393;
const PHONE_H = 852;

export const QUALITY_TIERS: Record<TierId, QualityTier> = {
  // DPR 1 is the size that still presented on the 16.7 ms beat in the bench.
  low: { id: 'low', maxPixelRatio: 1, maxPixels: PHONE_W * PHONE_H, meshCap: 64 },
  // Half the fragments of DPR 2 (1.5² / 2²) and no 192-segment place mesh.
  medium: { id: 'medium', maxPixelRatio: 1.5, maxPixels: Math.round(PHONE_W * PHONE_H * 1.5 * 1.5), meshCap: 96 },
  high: { id: 'high', maxPixelRatio: 2, maxPixels: 1920 * 1080 * 2, meshCap: 192 },
};

export interface DeviceSignals {
  mobile: boolean;
  cores: number;
  /** GB, when the browser exposes navigator.deviceMemory. Safari leaves this empty. */
  memory?: number;
  saveData: boolean;
}

export function readDeviceSignals(view: Pick<Window, 'navigator' | 'matchMedia'> = window): DeviceSignals {
  const nav = view.navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const coarse = view.matchMedia?.('(pointer: coarse)').matches ?? false;
  const mobile = coarse || /Android|iPhone|iPad|iPod/i.test(nav.userAgent || '');
  return {
    mobile,
    cores: nav.hardwareConcurrency || 4,
    memory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined,
    saveData: Boolean(nav.connection?.saveData),
  };
}

/**
 * Where `auto` starts. A phone starts at low: the iPhone 14 Pro already holds 60 fps there, and
 * opening at medium allocates a larger canvas that is then thrown away. Desktops start at high.
 */
export function detectTier(signals: DeviceSignals): TierId {
  if (signals.saveData || signals.mobile) return 'low';
  if ((signals.memory !== undefined && signals.memory <= 4) || signals.cores <= 4) return 'medium';
  return 'high';
}

/** The `full` quality: the high tier's mesh, with no pixel ratio or pixel count cap. */
const FULL_TIER: QualityTier = { ...QUALITY_TIERS.high, maxPixelRatio: Infinity, maxPixels: Infinity };

export function tierFor(quality: QualityName, signals: DeviceSignals, stepped: TierId): QualityTier {
  if (quality === 'full') return FULL_TIER;
  const id = quality === 'auto' ? stepped : quality;
  return QUALITY_TIERS[id];
}

const ORDER: TierId[] = ['low', 'medium', 'high'];

/**
 * Next tier after a run of frame gaps. `sawFast` means a gap under 12 ms, so the
 * screen is refreshing at 120 Hz and a 16 ms gap is a missed beat.
 */
export function stepTier(current: TierId, gaps: readonly number[], sawFast: boolean): TierId {
  if (gaps.length < 12) return current;
  const sorted = [...gaps].sort((a, b) => a - b);
  const median = sorted[sorted.length >> 1];
  const index = ORDER.indexOf(current);
  const missed = sawFast ? median > 12 : median > FRAME_MS.hz60 * 1.35;
  if (missed && index > 0) return ORDER[index - 1];
  return current;
}
