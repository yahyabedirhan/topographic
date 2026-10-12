import { useEffect, useRef, useState } from 'react';
import { mergeSettings, PRESETS, resolveMode, resolveSettings, STYLES, type Settings, type SettingsInput, type Topography as Instance } from 'topography';
import { Topography } from 'topography-react';
import { Code } from './Code';
import { INSTALL, TAGLINE } from './content';
import { embedCode, type EmbedFormat } from './embed';
import { Panel } from './Panel';
import { readUrl, writeUrl } from './url';

const EMBED_TABS: { id: EmbedFormat; label: string }[] = [
  { id: 'html', label: 'HTML' }, { id: 'react', label: 'React' }, { id: 'vanilla', label: 'Vanilla JS' }, { id: 'json', label: 'Config JSON' },
];

export function App() {
  const [settings, setSettings] = useState<Settings>(readUrl);
  const instance = useRef<Instance | null>(null);
  const [prefersDark, setPrefersDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const [tab, setTab] = useState<EmbedFormat>('html');

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
  useEffect(() => { document.documentElement.dataset.theme = mode; }, [mode]);
  // the page's own controls are exposed to agents too (see webmcp.ts)
  useEffect(() => { (window as unknown as { __topography?: object }).__topography = { get settings() { return settings; }, setSettings, instance }; }, [settings]);

  return (
    <>
      <Topography
        className="stage"
        aria-hidden="true"
        styleName={settings.style}
        seed={settings.seed}
        lines={settings.lines}
        terrain={settings.terrain}
        motion={settings.motion}
        layout={settings.layout}
        theme={settings.theme}
        onReady={(t) => { instance.current = t; }}
      />
      <main className="wrap" id="top">
        <header className="head">
          <h1>topography</h1>
          <p>{TAGLINE}</p>
          <nav className="links" aria-label="Sections">
            <a href="#playground">Playground</a>
            <a href="#install">Install</a>
            <a href="#embed">Embed</a>
            <a href="#agents">For agents</a>
            <span className="spacer" />
            <button className="theme" id="theme-toggle" aria-label="Toggle light and dark"
              onClick={() => change({ theme: { mode: mode === 'dark' ? 'light' : 'dark' } })}>{mode === 'dark' ? 'Light' : 'Dark'}</button>
          </nav>
        </header>

        <section id="playground" aria-labelledby="playground-title">
          <h2 id="playground-title">Playground</h2>
          <p className="lead">The background of this page is the live preview. Pick a preset, or tune every setting in the panel.</p>
          <ul className="presets" aria-label="Presets">
            {PRESETS.map((p, i) => (
              <li key={p.name}><button id={`preset-${i}`} onClick={() => applyPreset(i)}>{p.name}</button></li>
            ))}
          </ul>
          <p className="mut small">Styles: {STYLES.map((s) => s.name).join(', ')}.</p>
        </section>

        <section id="install" aria-labelledby="install-title">
          <h2 id="install-title">Install</h2>
          <Code id="install-npm" label="npm" code={INSTALL.npm} />
          <h3>Web component</h3>
          <Code id="install-element" label="HTML" code={INSTALL.webComponent} />
          <h3>React</h3>
          <Code id="install-react" label="React" code={`${INSTALL.react}\n\n${INSTALL.reactUsage}`} />
          <h3>Vanilla JS</h3>
          <Code id="install-vanilla" label="JavaScript" code={INSTALL.vanilla} />
          <h3>Colours</h3>
          <Code id="install-css" label="CSS" code={INSTALL.css} />
        </section>

        <section id="embed" aria-labelledby="embed-title">
          <h2 id="embed-title">Embed this background</h2>
          <p className="lead">The code below always matches the current settings.</p>
          <div className="tabs" role="tablist" aria-label="Embed format">
            {EMBED_TABS.map((t) => (
              <button key={t.id} id={`embed-tab-${t.id}`} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
          <Code id="embed-code" label={`Embed (${tab})`} code={embedCode(settings, tab)} />
        </section>

        <section id="agents" aria-labelledby="agents-title">
          <h2 id="agents-title">For agents</h2>
          <p className="lead">
            Plain-text docs live at <a href="llms.txt">llms.txt</a> and <a href="llms-full.txt">llms-full.txt</a>, with markdown pages for{' '}
            <a href="docs/install.md">install</a>, <a href="docs/api.md">API</a> and <a href="docs/params.md">parameters</a>.
            The URL holds the settings as JSON (<code>?config=…</code>). In browsers with WebMCP, this page registers tools to read and change the settings, take a screenshot and get embed code.
          </p>
        </section>

        <footer className="links foot">
          <span>MIT licensed</span>
          <span className="spacer" />
          <a href="#top">Back to top</a>
        </footer>
      </main>
      <Panel settings={settings} mode={mode} onChange={change} instance={instance} />
    </>
  );
}
