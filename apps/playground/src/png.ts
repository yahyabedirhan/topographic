import type { SnapshotRegion, Topography } from 'topographic';

export const PNG_SIZES = [
  { id: 'screen', label: 'Screen ×2', width: 0, height: 0 },
  { id: '1080p', label: '1920 × 1080', width: 1920, height: 1080 },
  { id: '1440p', label: '2560 × 1440', width: 2560, height: 1440 },
  { id: '4k', label: '3840 × 2160', width: 3840, height: 2160 },
  { id: 'phone', label: '1170 × 2532 (phone)', width: 1170, height: 2532 },
] as const;

export type PngSize = (typeof PNG_SIZES)[number];

/**
 * A PNG of the background. With a region, only that slice of the view, drawn at full detail; without one,
 * a size other than the window's shape lays the view out again at that shape.
 */
export async function renderPng(t: Topography, width?: number, height?: number, region?: SnapshotRegion): Promise<Blob> {
  if (region) return t.snapshot({ width: width || undefined, height: height || undefined, region });
  const w = width || t.canvas.clientWidth * 2;
  const h = height || (width ? Math.round((width * t.canvas.clientHeight) / t.canvas.clientWidth) : t.canvas.clientHeight * 2);
  return t.snapshot({ width: w, height: h });
}

/**
 * The part of the view a size crops to: the largest rectangle of its shape, placed by `at` (the
 * top-left corner along the free axis, 0 to 1 of the room left). Null for the window's own shape.
 */
export function cropRegion(viewAspect: number, width: number, height: number, at = 0.5): SnapshotRegion | null {
  if (!width || !height) return null;
  const aspect = width / height;
  if (Math.abs(aspect / viewAspect - 1) < 0.005) return null;
  const a = Math.min(1, Math.max(0, at));
  if (aspect < viewAspect) {
    const w = aspect / viewAspect;
    return { x: (1 - w) * a, y: 0, width: w, height: 1 };
  }
  const h = viewAspect / aspect;
  return { x: 0, y: (1 - h) * a, width: 1, height: h };
}

export async function downloadPng(t: Topography, size: PngSize, region?: SnapshotRegion | null): Promise<void> {
  const blob = await renderPng(t, size.width, size.height, region ?? undefined);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `topographic-${t.settings.landform}-${t.settings.seed}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
