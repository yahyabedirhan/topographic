import { useState, type MutableRefObject } from 'react';
import { GROUPS, paramsIn, STYLES, THEME_DEFAULTS, rgbaToCss, type Settings, type SettingsInput, type Topography } from 'topography';
import { embedCode } from './embed';
import { downloadPng, PNG_SIZES } from './png';
import { shareUrl } from './url';

const GROUP_LABELS = { lines: 'Lines', terrain: 'Terrain', motion: 'Motion', layout: 'Layout' } as const;

const toHex = (css: string) => {
  const m = css.match(/[\d.]+/g)!.map(Number);
  return '#' + m.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');
};

interface Props {
  settings: Settings;
  mode: 'light' | 'dark';
  onChange: (patch: SettingsInput) => void;
  instance: MutableRefObject<Topography | null>;
}

export function Panel({ settings, mode, onChange, instance }: Props) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState('');
  const [size, setSize] = useState(0);
  const [busy, setBusy] = useState(false);

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(''), 1400);
  };
  const defaults = THEME_DEFAULTS[mode];
  const transparent = settings.theme.paper === 'transparent';

  return (
    <aside className={`panel ${open ? '' : 'closed'}`} aria-label="Settings" id="settings">
      <div className="panel-head">
        <strong>Settings</strong>
        <button id="panel-toggle" className="ghost" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="panel-body">{open ? 'Hide' : 'Show'}</button>
      </div>
      {open && (
        <div className="panel-body" id="panel-body">
          <section>
            <h3>Style</h3>
            <div className="chips">
              {STYLES.map((s) => (
                <button key={s.id} id={`style-${s.id}`} aria-pressed={s.id === settings.style} className={s.id === settings.style ? 'on' : ''} title={s.description}
                  onClick={() => onChange({ style: s.id })}>{s.name}</button>
              ))}
            </div>
            <div className="row">
              <label htmlFor="seed">Seed</label>
              <input id="seed" type="number" min={0} value={settings.seed} onChange={(e) => onChange({ seed: Number(e.target.value) })} />
              <button id="randomize" onClick={() => onChange({ seed: Math.floor(Math.random() * 100000) + 1 })}>Randomize</button>
            </div>
          </section>

          {GROUPS.map((g) => (
            <section key={g}>
              <h3>{GROUP_LABELS[g]}</h3>
              {paramsIn(g).map((p) => {
                const v = (settings[g] as Record<string, number>)[p.key];
                return (
                  <div className="slider" key={p.key} title={p.description}>
                    <label htmlFor={p.attr}>{p.label}</label>
                    <input id={p.attr} type="range" min={p.min} max={p.max} step={p.step} value={v}
                      onChange={(e) => onChange({ [g]: { [p.key]: Number(e.target.value) } })} />
                    <output>{p.integer ? v : v.toFixed(2)}</output>
                  </div>
                );
              })}
            </section>
          ))}

          <section>
            <h3>Colour</h3>
            <div className="row">
              {(['light', 'dark'] as const).map((m) => (
                <button key={m} id={`mode-${m}`} aria-pressed={settings.theme.mode === m} className={settings.theme.mode === m ? 'on' : ''} onClick={() => onChange({ theme: { mode: m } })}>{m}</button>
              ))}
              <button id="mode-auto" aria-pressed={settings.theme.mode === 'auto'} className={settings.theme.mode === 'auto' ? 'on' : ''} onClick={() => onChange({ theme: { mode: 'auto' } })}>auto</button>
            </div>
            <div className="row">
              <label>Ink <input id="ink" type="color" value={settings.theme.ink ?? toHex(rgbaToCss(defaults.ink))} onChange={(e) => onChange({ theme: { ink: e.target.value } })} /></label>
              <label>Paper <input id="paper" type="color" disabled={transparent} value={transparent ? '#000000' : settings.theme.paper ?? toHex(rgbaToCss(defaults.paper))} onChange={(e) => onChange({ theme: { paper: e.target.value } })} /></label>
              <label><input id="paper-transparent" type="checkbox" checked={transparent} onChange={(e) => onChange({ theme: { paper: e.target.checked ? 'transparent' : undefined } })} /> Transparent</label>
              <button id="colour-reset" className="ghost" onClick={() => onChange({ theme: { ink: undefined, paper: undefined } })}>Reset</button>
            </div>
          </section>

          <section>
            <h3>Export</h3>
            <div className="row">
              <button id="copy-html" onClick={() => copy('html', embedCode(settings, 'html'))}>{copied === 'html' ? 'Copied' : 'Copy HTML'}</button>
              <button id="copy-jsx" onClick={() => copy('jsx', embedCode(settings, 'react'))}>{copied === 'jsx' ? 'Copied' : 'Copy JSX'}</button>
              <button id="copy-json" onClick={() => copy('json', embedCode(settings, 'json'))}>{copied === 'json' ? 'Copied' : 'Copy config JSON'}</button>
              <button id="copy-link" onClick={() => copy('link', shareUrl(settings))}>{copied === 'link' ? 'Copied' : 'Copy link'}</button>
            </div>
            <div className="row">
              <select id="png-size" value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="PNG size">
                {PNG_SIZES.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
              </select>
              <button id="download-png" disabled={busy} onClick={async () => {
                if (!instance.current) return;
                setBusy(true);
                try { await downloadPng(instance.current, PNG_SIZES[size]); } catch (e) { alert(String(e)); } finally { setBusy(false); }
              }}>{busy ? 'Rendering…' : 'Download PNG'}</button>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
