// PROTOTYPE variant C, "Filmstrip": a strip of large preset cards along the bottom edge, like a photo app's
// filters. The selected card grows an "Adjust" popover that holds the sliders and colours for that look.
import { useState } from 'react';
import { GROUPS, PRESETS } from 'topography.js';
import { Backdrop, ColorField, ExportActions, GROUP_LABELS, ModeToggle, ParamRows, PRESET_KIND, Wordmark, usePresetThumbs, type Playground } from './shared';

export function VariantC({ pg }: { pg: Playground }) {
  const thumbs = usePresetThumbs(pg, 400, 256);
  const [adjust, setAdjust] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [group, setGroup] = useState<(typeof GROUPS)[number]>('lines');
  const selected = pg.presetIndex;
  return (
    <>
      <Backdrop pg={pg} />
      <Wordmark />
      <div className="c-top">
        <ModeToggle pg={pg} />
        <div className="c-export">
          <button className="c-pill pt-glass" onClick={() => setExportOpen(!exportOpen)} aria-expanded={exportOpen}>Use this background</button>
          {exportOpen && <div className="pt-pop pt-pop-down c-exportpop"><div className="pt-pop-title">Copy or download</div><ExportActions pg={pg} /></div>}
        </div>
      </div>
      <div className="c-strip-wrap">
        <div className="c-strip">
          {selected < 0 && (
            <div className="c-card on c-custom">
              <div className="c-img c-customimg">Custom</div>
              <div className="c-meta"><span>Your tweaks</span><small>Edited</small></div>
              <button className="c-adjust" onClick={() => setAdjust(!adjust)}>{adjust ? 'Done' : 'Adjust'}</button>
              {adjust && (
                <div className="c-pop pt-glass">
                  <div className="c-seg">{GROUPS.map((g) => <button key={g} className={g === group ? 'on' : ''} onClick={() => setGroup(g)}>{GROUP_LABELS[g]}</button>)}</div>
                  <ParamRows pg={pg} group={group} />
                  <div className="c-row"><span className="pt-label">Colours</span><ColorField pg={pg} which="ink" align="right" /><ColorField pg={pg} which="paper" align="right" /></div>
                </div>
              )}
            </div>
          )}
          {PRESETS.map((p, i) => (
            <div key={p.name} className={`c-card ${i === selected ? 'on' : ''}`}>
              <button className="c-img" onClick={() => { pg.applyPreset(i); }}>
                {thumbs[i] ? <img src={thumbs[i]} alt="" /> : <span className="a-ph" />}
              </button>
              <div className="c-meta">
                <span>{p.name}</span><small>{PRESET_KIND(i)}</small>
              </div>
              {i === selected && <button className="c-adjust" onClick={() => setAdjust(!adjust)} aria-expanded={adjust}>{adjust ? 'Done' : 'Adjust'}</button>}
              {i === selected && adjust && (
                <div className="c-pop pt-glass">
                  <div className="c-seg">
                    {GROUPS.map((g) => <button key={g} className={g === group ? 'on' : ''} onClick={() => setGroup(g)}>{GROUP_LABELS[g]}</button>)}
                  </div>
                  <ParamRows pg={pg} group={group} />
                  <div className="c-row">
                    <span className="pt-label">Colours</span>
                    <ColorField pg={pg} which="ink" align="right" />
                    <ColorField pg={pg} which="paper" align="right" />
                    <span className="spacer" />
                    <button className="ghost" onClick={pg.shuffle}>Shuffle seed</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
