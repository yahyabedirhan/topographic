import type { TopographicBackground } from 'topographic';

export const PNG_SIZES = [
  { id: 'screen', label: 'Screen ×2', width: 0, height: 0 },
  { id: '1080p', label: '1920 × 1080', width: 1920, height: 1080 },
  { id: '1440p', label: '2560 × 1440', width: 2560, height: 1440 },
  { id: '4k', label: '3840 × 2160', width: 3840, height: 2160 },
  { id: 'phone', label: '1170 × 2532 (phone)', width: 1170, height: 2532 },
] as const;

export async function renderPng(t: TopographicBackground, width?: number, height?: number): Promise<Blob> {
  const w = width || t.canvas.clientWidth * 2;
  const h = height || (width ? Math.round((width * t.canvas.clientHeight) / t.canvas.clientWidth) : t.canvas.clientHeight * 2);
  return t.snapshot({ width: w, height: h });
}

export async function downloadPng(t: TopographicBackground, size: (typeof PNG_SIZES)[number]): Promise<void> {
  const blob = await renderPng(t, size.width, size.height);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `topographic-${t.settings.style}-${t.settings.seed}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
