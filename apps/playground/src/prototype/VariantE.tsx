// PROTOTYPE variant E, "Gallery first": the page opens on a grid of every look. Hovering previews it on the
// map behind; choosing one zooms into a full-screen editor whose controls live on a thin rail at the right edge.
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { GROUPS, PRESETS, resolveSettings, type GroupName } from 'topography.js';
import { Backdrop, ColorPicker, currentColour, ExportActions, GROUP_LABELS, INK_SWATCHES, ModeToggle, PAPER_SWATCHES, ParamRows, PRESET_KIND, usePresetThumbs, type Playground } from './shared';

type Panel = GroupName | 'colour' | 'export' | null;

const withTransition = (fn: () => void) => {
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (d.startViewTransition) d.startViewTransition(() => flushSync(fn)); else fn();
};

export function VariantE({ pg }: { pg: Playground }) {
  const thumbs = usePresetThumbs(pg, 480, 600);
  const [view, setView] = useState<'gallery' | 'editor'>('gallery');
  const [panel, setPanel] = useState<Panel>(null);
  const [hover, setHover] = useState<number | null>(null);
  const preview = hover === null ? pg : { ...pg, settings: { ...resolveSettings(PRESETS[hover].settings), seed: pg.settings.seed, theme: pg.settings.theme } };
  const name = PRESETS[pg.presetIndex]?.name ?? 'Custom';

  return (
    <>
      <Backdrop pg={preview} className={`pt-stage e-stage ${view}`} />
      {view === 'gallery' && (
        <main className="e-gallery">
          <header className="e-head">
            <h1>topography.js</h1>
            <p>Pick a starting point. You can tune everything after.</p>
            <ModeToggle pg={pg} />
          </header>
          <div className="e-grid" onMouseLeave={() => setHover(null)}>
            {PRESETS.map((p, i) => (
              <button key={p.name} className={`e-tile ${i === pg.presetIndex ? 'on' : ''}`} onMouseEnter={() => setHover(i)}
                onClick={() => withTransition(() => { pg.applyPreset(i); setHover(null); setView('editor'); })}
                style={{ viewTransitionName: `tile-${i}` } as React.CSSProperties}>
                {thumbs[i] ? <img src={thumbs[i]} alt="" /> : <span className="a-ph" />}
                <span className="e-cap"><b>{p.name}</b><small>{PRESET_KIND(i)}</small></span>
              </button>
            ))}
          </div>
        </main>
      )}
      {view === 'editor' && (
        <>
          <button className="e-back pt-glass" onClick={() => withTransition(() => { setPanel(null); setView('gallery'); })}>← All looks</button>
          <div className="e-title"><b>{name}</b><button className="ghost" onClick={pg.shuffle}>seed {pg.settings.seed} ↻</button></div>
          <nav className="e-rail pt-glass" aria-label="Settings">
            {[...GROUPS, 'colour' as const, 'export' as const].map((g) => (
              <button key={g} className={panel === g ? 'on' : ''} onClick={() => setPanel(panel === g ? null : g)}>
                {g === 'colour' ? 'Colour' : g === 'export' ? 'Export' : GROUP_LABELS[g]}
              </button>
            ))}
            <span className="e-railsep" />
            <ModeToggle pg={pg} />
          </nav>
          {panel && (
            <aside className="e-sheet pt-glass">
              <div className="pt-label">{panel === 'colour' ? 'Colour' : panel === 'export' ? 'Use this background' : GROUP_LABELS[panel]}</div>
              {panel === 'colour' && (
                <div className="e-colours">
                  <div><div className="e-sub">Ink</div><ColorPicker value={currentColour(pg, 'ink')} swatches={INK_SWATCHES} onChange={(c) => pg.change({ theme: { ink: c } })} /></div>
                  <div><div className="e-sub">Paper</div><ColorPicker value={currentColour(pg, 'paper')} swatches={PAPER_SWATCHES} onChange={(c) => pg.change({ theme: { paper: c } })} /></div>
                </div>
              )}
              {panel === 'export' && <ExportActions pg={pg} />}
              {panel !== 'colour' && panel !== 'export' && <ParamRows pg={pg} group={panel} />}
            </aside>
          )}
        </>
      )}
    </>
  );
}
