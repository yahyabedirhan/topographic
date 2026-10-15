import { useEffect } from 'react';

export function PrototypeSwitcher({ variants, current, onChange }: { variants: { key: string; name: string }[]; current: string; onChange(key: string): void }) {
  const i = Math.max(0, variants.findIndex((v) => v.key === current));
  const go = (d: number) => onChange(variants[(i + d + variants.length) % variants.length].key);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable], [role="slider"], .pt-panel:not([hidden])') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('.pt-panel:not([hidden])')) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  });
  return (
    <div className="pt-switcher" role="navigation" aria-label="Prototype variants">
      <button onClick={() => go(-1)} aria-label="Previous variant">‹</button>
      <span><b>PROTOTYPE</b> {variants[i].key} · {variants[i].name}</span>
      <button onClick={() => go(1)} aria-label="Next variant">›</button>
    </div>
  );
}
