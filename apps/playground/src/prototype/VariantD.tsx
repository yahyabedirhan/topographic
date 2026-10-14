// PROTOTYPE variant D, "Inspector card": one compact card that floats over the map and can be dragged anywhere
// (it snaps to the nearest edge) or folded into a pill. Thumbnails on top, accordion settings below.
import { useRef, useState } from 'react';
import { GROUPS, PRESETS, type GroupName } from 'topography.js';
import { Backdrop, ColorField, ExportActions, GROUP_LABELS, ModeToggle, ParamRows, Wordmark, usePresetThumbs, type Playground } from './shared';

const W = 312;

export function VariantD({ pg }: { pg: Playground }) {
  const thumbs = usePresetThumbs(pg, 176, 112);
  const [pos, setPos] = useState(() => ({ x: innerWidth - W - 24, y: 72 }));
  const [dragging, setDragging] = useState(false);
  const [folded, setFolded] = useState(false);
  const [open, setOpen] = useState<GroupName | 'export' | null>('lines');
  const grab = useRef({ dx: 0, dy: 0 });
  const card = useRef<HTMLDivElement>(null);

  const down = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    setDragging(true);
  };
  const move = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPos({ x: e.clientX - grab.current.dx, y: e.clientY - grab.current.dy });
  };
  const up = () => {
    if (!dragging) return;
    setDragging(false);
    const h = card.current?.offsetHeight ?? 400;
    const x = pos.x + W / 2 < innerWidth / 2 ? 24 : innerWidth - W - 24;
    setPos({ x, y: Math.min(Math.max(16, pos.y), innerHeight - Math.min(h, 120) - 16) });
  };
  const side = pos.x + W / 2 < innerWidth / 2 ? 'right' : 'left';

  return (
    <>
      <Backdrop pg={pg} />
      <Wordmark><small>drag the inspector anywhere</small></Wordmark>
      <div ref={card} className={`d-card pt-glass ${dragging ? 'drag' : ''} ${folded ? 'folded' : ''}`} style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
        <header className="d-head" onPointerDown={down} onPointerMove={move} onPointerUp={up} onDoubleClick={() => setFolded(!folded)}>
          <span className="d-grip" aria-hidden="true">⠿</span>
          <strong>{PRESETS[pg.presetIndex]?.name ?? 'Custom'}</strong>
          <span className="spacer" />
          <ModeToggle pg={pg} />
          <button className="pt-icon d-fold" onClick={() => setFolded(!folded)} aria-label={folded ? 'Expand' : 'Fold'}>{folded ? '▾' : '▴'}</button>
        </header>
        {!folded && (
          <div className="d-body">
            <div className="d-thumbs">
              {PRESETS.map((p, i) => (
                <button key={p.name} className={i === pg.presetIndex ? 'on' : ''} onClick={() => pg.applyPreset(i)} title={p.name}>
                  {thumbs[i] ? <img src={thumbs[i]} alt="" /> : <span className="a-ph" />}
                </button>
              ))}
              <button className="d-shuffle" onClick={pg.shuffle} title="Shuffle seed">↻<small>{pg.settings.seed}</small></button>
            </div>
            <div className="d-colours">
              <span className="d-colour d-ink"><ColorField pg={pg} which="ink" align={side} />Ink</span>
              <span className="d-colour d-paper"><ColorField pg={pg} which="paper" align={side} />Paper</span>
            </div>
            {[...GROUPS, 'export' as const].map((g) => (
              <section key={g} className={`d-sec ${open === g ? 'open' : ''}`}>
                <button className="d-sec-head" onClick={() => setOpen(open === g ? null : g)} aria-expanded={open === g}>
                  {g === 'export' ? 'Export' : GROUP_LABELS[g]}<span>{open === g ? '−' : '+'}</span>
                </button>
                {open === g && (g === 'export' ? <ExportActions pg={pg} compact /> : <ParamRows pg={pg} group={g} />)}
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
