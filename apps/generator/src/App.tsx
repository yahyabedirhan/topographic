import { useEffect, useRef, useState } from 'react';
import { mergeSettings, PRESETS, resolveSettings, resolveMode, type Settings, type SettingsInput, type Topography as Instance } from 'topography';
import { Topography } from 'topography-react';
import { Panel } from './Panel';
import { readUrl, writeUrl } from './url';

export function App() {
  const [settings, setSettings] = useState<Settings>(readUrl);
  const instance = useRef<Instance | null>(null);
  const [prefersDark, setPrefersDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => writeUrl(settings), [settings]);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setPrefersDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const change = (patch: SettingsInput) => setSettings((s) => mergeSettings(s, patch));
  const applyPreset = (i: number) => setSettings((s) => ({ ...resolveSettings(PRESETS[i].settings), seed: s.seed, theme: s.theme }));
  const mode = resolveMode(settings.theme.mode, prefersDark);

  return (
    <div className={`app ${mode}`}>
      <Topography
        className="stage"
        styleName={settings.style}
        seed={settings.seed}
        lines={settings.lines}
        terrain={settings.terrain}
        motion={settings.motion}
        layout={settings.layout}
        theme={settings.theme}
        onReady={(t) => { instance.current = t; }}
      />
      <header className="presets" aria-label="Presets">
        <span className="brand">topography</span>
        {PRESETS.map((p, i) => (
          <button key={p.name} onClick={() => applyPreset(i)}>{p.name}</button>
        ))}
      </header>
      <Panel settings={settings} mode={mode} onChange={change} instance={instance} />
    </div>
  );
}
