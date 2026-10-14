// PROTOTYPE variant B, "Command palette": nothing on screen but the map and a hint. Everything (styles with
// thumbnails, every setting, colours, export) is one search away with ⌘K or /, and fully keyboard driven.
import { useEffect, useMemo, useRef, useState } from 'react';
import { GROUPS, paramsIn, PRESETS, type GroupName, type ParamDef } from 'topography.js';
import { embedCode } from '../embed';
import { downloadPng, PNG_SIZES } from '../png';
import { shareUrl } from '../url';
import { Backdrop, ColorPicker, currentColour, GROUP_LABELS, INK_SWATCHES, PAPER_SWATCHES, useCopy, usePresetThumbs, type Playground } from './shared';

type Item =
  | { kind: 'preset'; i: number; label: string }
  | { kind: 'param'; group: GroupName; p: ParamDef; label: string }
  | { kind: 'colour'; which: 'ink' | 'paper'; label: string }
  | { kind: 'action'; label: string; hint?: string; run(): void };

export function VariantB({ pg }: { pg: Playground }) {
  const thumbs = usePresetThumbs(pg, 240, 156);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const [active, setActive] = useState<Item | null>(null);
  const [copied, copy] = useCopy();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !open)) { e.preventDefault(); setOpen(true); }
    };
    addEventListener('keydown', on);
    return () => removeEventListener('keydown', on);
  }, [open]);
  useEffect(() => { if (open) { setQ(''); setSel(0); setActive(null); setTimeout(() => input.current?.focus()); } }, [open]);

  const all: Item[] = useMemo(() => [
    ...PRESETS.map((p, i) => ({ kind: 'preset' as const, i, label: p.name })),
    ...GROUPS.flatMap((g) => paramsIn(g).map((p) => ({ kind: 'param' as const, group: g, p, label: `${p.label}` }))),
    { kind: 'colour', which: 'ink', label: 'Ink colour' },
    { kind: 'colour', which: 'paper', label: 'Paper colour' },
    { kind: 'action', label: 'Shuffle seed', hint: 'R', run: pg.shuffle },
    { kind: 'action', label: `Switch to ${pg.mode === 'dark' ? 'light' : 'dark'}`, run: () => pg.change({ theme: { mode: pg.mode === 'dark' ? 'light' : 'dark', ink: undefined, paper: undefined } }) },
    { kind: 'action', label: 'Copy HTML embed', run: () => copy('Copy HTML embed', embedCode(pg.settings, 'html')) },
    { kind: 'action', label: 'Copy React embed', run: () => copy('Copy React embed', embedCode(pg.settings, 'react')) },
    { kind: 'action', label: 'Copy share link', run: () => copy('Copy share link', shareUrl(pg.settings)) },
    { kind: 'action', label: 'Download PNG 1920 × 1080', run: () => pg.instance.current && downloadPng(pg.instance.current, PNG_SIZES[1]) },
  ], [pg]);
  const items = all.filter((it) => it.label.toLowerCase().includes(q.toLowerCase()) || (it.kind === 'param' && GROUP_LABELS[it.group].toLowerCase().startsWith(q.toLowerCase())));
  const presets = items.filter((it) => it.kind === 'preset');
  const rows = items.filter((it) => it.kind !== 'preset');
  const flat = [...presets, ...rows];
  const cur = flat[Math.min(sel, flat.length - 1)];

  const choose = (it: Item | undefined) => {
    if (!it) return;
    if (it.kind === 'preset') pg.applyPreset(it.i);
    else if (it.kind === 'action') it.run();
    else setActive(it);
  };
  const nudge = (it: Item, dir: number, big: boolean) => {
    if (it.kind !== 'param') return;
    const v = (pg.settings[it.group] as Record<string, number>)[it.p.key];
    pg.change({ [it.group]: { [it.p.key]: v + dir * it.p.step * (big ? 10 : 1) } });
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); if (active) setActive(null); else setOpen(false); return; }
    if (active?.kind === 'param' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); nudge(active, e.key === 'ArrowLeft' ? -1 : 1, e.shiftKey); return; }
    if (active) { if (e.key === 'Enter') setActive(null); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(flat.length - 1, s + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (cur?.kind === 'preset' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); setSel((s) => Math.max(0, Math.min(presets.length - 1, s + (e.key === 'ArrowRight' ? 1 : -1)))); }
    if (e.key === 'Enter') { e.preventDefault(); choose(cur); }
  };
  const value = (it: Item) => {
    if (it.kind === 'param') { const v = (pg.settings[it.group] as Record<string, number>)[it.p.key]; return it.p.integer ? String(v) : v.toFixed(2); }
    if (it.kind === 'colour') return currentColour(pg, it.which);
    if (it.kind === 'action') return copied === it.label ? 'Copied' : it.hint ?? '';
    return '';
  };

  return (
    <>
      <Backdrop pg={pg} />
      {!open && (
        <button className="b-hint pt-glass" onClick={() => setOpen(true)}>
          <span className="b-mark">topography.js</span><span className="b-search">Search styles, settings, colours</span><kbd>⌘K</kbd>
        </button>
      )}
      {open && (
        <div className="b-scrim" onPointerDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="b-palette pt-glass" role="dialog" aria-label="Command palette">
            <div className="b-input">
              {active && <button className="b-crumb" onClick={() => setActive(null)}>{active.label} ×</button>}
              <input ref={input} value={q} placeholder={active ? (active.kind === 'param' ? '← → to adjust, ⇧ for bigger steps, Esc to go back' : 'Esc to go back') : 'Search styles, settings, colours, export…'}
                onChange={(e) => { setQ(e.target.value); setSel(0); setActive(null); }} onKeyDown={onKey} readOnly={!!active} />
            </div>
            {active?.kind === 'param' && (() => {
              const v = (pg.settings[active.group] as Record<string, number>)[active.p.key];
              const pct = ((v - active.p.min) / (active.p.max - active.p.min)) * 100;
              return (
                <div className="b-adjust">
                  <div className="b-big">{value(active)}</div>
                  <input type="range" className="b-range" min={active.p.min} max={active.p.max} step={active.p.step} value={v} style={{ ['--pct' as string]: `${pct}%` }}
                    onChange={(e) => pg.change({ [active.group]: { [active.p.key]: Number(e.target.value) } })} />
                  <p className="mut">{active.p.description}</p>
                </div>
              );
            })()}
            {active?.kind === 'colour' && (
              <div className="b-adjust b-colour">
                <ColorPicker value={currentColour(pg, active.which)} swatches={active.which === 'ink' ? INK_SWATCHES : PAPER_SWATCHES}
                  onChange={(c) => pg.change({ theme: { [active.which]: c } })} />
              </div>
            )}
            {!active && (
              <div className="b-results">
                {presets.length > 0 && <div className="pt-label b-section">Styles and presets</div>}
                {presets.length > 0 && (
                  <div className="b-thumbs">
                    {presets.map((it) => it.kind === 'preset' && (
                      <button key={it.label} className={`b-thumb ${cur === it ? 'sel' : ''} ${pg.presetIndex === it.i ? 'on' : ''}`}
                        onMouseEnter={() => setSel(flat.indexOf(it))} onClick={() => choose(it)}>
                        {thumbs[it.i] ? <img src={thumbs[it.i]} alt="" /> : <span className="a-ph" />}
                        <span>{it.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {rows.length > 0 && <div className="pt-label b-section">Settings and actions</div>}
                <ul className="b-rows">
                  {rows.map((it) => (
                    <li key={it.label + it.kind}>
                      <button className={cur === it ? 'sel' : ''} onMouseEnter={() => setSel(flat.indexOf(it))} onClick={() => choose(it)}>
                        <span className="b-kind">{it.kind === 'param' ? GROUP_LABELS[it.group] : it.kind === 'colour' ? 'Colour' : 'Action'}</span>
                        <span className="b-label">{it.label}</span>
                        {it.kind === 'colour' && <i className="b-chip" style={{ background: value(it) }} />}
                        <span className="b-value">{value(it)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {flat.length === 0 && <p className="mut b-empty">Nothing matches “{q}”.</p>}
              </div>
            )}
            <footer className="b-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> choose</span><span><kbd>esc</kbd> close</span></footer>
          </div>
        </div>
      )}
    </>
  );
}
