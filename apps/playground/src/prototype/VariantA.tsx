// PROTOTYPE variant A, "Glass dock": the map is the page. A floating dock at the bottom holds style thumbnails,
// and each tool (tune, colour, export) opens as a popover above it, so nothing ever shrinks the background.
import { useState } from 'react';
import { GROUPS, PRESETS } from 'topography.js';
import { Backdrop, ColorField, ExportActions, GROUP_LABELS, ModeToggle, ParamRows, Wordmark, usePresetThumbs, type Playground } from './shared';

type Tool = 'tune' | 'export' | null;

export function VariantA({ pg }: { pg: Playground }) {
  const thumbs = usePresetThumbs(pg, 192, 124);
  const [tool, setTool] = useState<Tool>(null);
  const [group, setGroup] = useState<(typeof GROUPS)[number]>('lines');
  const toggle = (t: Tool) => setTool(tool === t ? null : t);
  return (
    <>
      <Backdrop pg={pg} />
      <Wordmark />
      <div className="a-top"><ModeToggle pg={pg} /></div>
      <div className="a-dock-wrap">
        {tool === 'tune' && (
          <div className="a-sheet pt-glass">
            <div className="a-tabs">
              {GROUPS.map((g) => <button key={g} className={g === group ? 'on' : ''} onClick={() => setGroup(g)}>{GROUP_LABELS[g]}</button>)}
              <span className="spacer" />
              <button className="ghost" onClick={pg.shuffle}>Seed {pg.settings.seed} ↻</button>
            </div>
            <ParamRows pg={pg} group={group} />
          </div>
        )}
        {tool === 'export' && <div className="a-sheet pt-glass"><div className="pt-label">Copy or download</div><ExportActions pg={pg} /></div>}
        <nav className="a-dock pt-glass" aria-label="Presets and tools">
          <div className="a-thumbs">
            {PRESETS.map((p, i) => (
              <button key={p.name} className={`a-thumb ${i === pg.presetIndex ? 'on' : ''}`} onClick={() => pg.applyPreset(i)} title={p.name}>
                {thumbs[i] ? <img src={thumbs[i]} alt="" /> : <span className="a-ph" />}
                <span>{p.name}</span>
              </button>
            ))}
          </div>
          <div className="a-sep" />
          <button className={`a-tool ${tool === 'tune' ? 'on' : ''}`} onClick={() => toggle('tune')}>Tune</button>
          <ColorField pg={pg} which="ink" />
          <ColorField pg={pg} which="paper" />
          <button className={`a-tool ${tool === 'export' ? 'on' : ''}`} onClick={() => toggle('export')}>Export</button>
        </nav>
      </div>
    </>
  );
}
