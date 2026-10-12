import { GROUPS, paramsIn, resolveSettings, toAttributes, type Settings, type Topography } from 'topography';

/** HTML embed: the element plus its module import. */
export function htmlSnippet(s: Settings): string {
  const attrs = Object.entries(toAttributes(s)).map(([k, v]) => `${k}="${v}"`).join(' ');
  return `<script type="module" src="https://esm.sh/topography/element"></script>
<topography-bg ${attrs} style="position:fixed;inset:0;z-index:-1"></topography-bg>`;
}

/** React embed: only values that differ from the style's defaults. */
export function jsxSnippet(s: Settings): string {
  const d = resolveSettings({ style: s.style });
  const props: string[] = [`styleName="${s.style}"`];
  if (s.seed) props.push(`seed={${s.seed}}`);
  for (const g of GROUPS) {
    const changed = paramsIn(g)
      .map((p) => [p.key, (s[g] as Record<string, number>)[p.key], (d[g] as Record<string, number>)[p.key]] as const)
      .filter(([, v, dv]) => v !== dv)
      .map(([k, v]) => `${k}: ${v}`);
    if (changed.length) props.push(`${g}={{ ${changed.join(', ')} }}`);
  }
  const theme = Object.entries(s.theme).filter(([k, v]) => v !== undefined && !(k === 'mode' && v === 'auto'));
  if (theme.length) props.push(`theme={{ ${theme.map(([k, v]) => `${k}: '${v}'`).join(', ')} }}`);
  return `import { Topography } from 'topography-react';

<Topography
  ${props.join('\n  ')}
  style={{ position: 'fixed', inset: 0, zIndex: -1 }}
/>`;
}

export const PNG_SIZES = [
  { label: 'Screen x2', width: 0, height: 0 },
  { label: '1920 × 1080', width: 1920, height: 1080 },
  { label: '2560 × 1440', width: 2560, height: 1440 },
  { label: '3840 × 2160', width: 3840, height: 2160 },
  { label: '1170 × 2532 (phone)', width: 1170, height: 2532 },
] as const;

export async function downloadPng(t: Topography, size: (typeof PNG_SIZES)[number]): Promise<void> {
  const w = size.width || t.canvas.clientWidth * 2;
  const h = size.height || t.canvas.clientHeight * 2;
  const blob = await t.snapshot({ width: w, height: h });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `topography-${t.settings.style}-${t.settings.seed}-${w}x${h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
