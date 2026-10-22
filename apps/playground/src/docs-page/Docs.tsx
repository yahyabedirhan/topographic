import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { EMAIL, SOCIALS } from '../contact';
import { CodeBlock, CodeTabs, LangProvider } from './CodeBlocks';
import {
  AWS_OPEN_DATA, CAMERA_ROWS, CODE, FALLBACKS, GROUPS, LICENSE, LIMITS, MEMBERS, MOTIONS, NPM, NPM_REACT, PRIVACY, QUESTIONS, RECORD_OPTIONS, REPO,
  SECTIONS, SITE, SNAPSHOT_OPTIONS, TERRAIN_TILES, THEME_ROWS, TIERS, VIEW_ROWS, WEBMCP, WEBMCP_TOOLS, byId, paramRows, type DocSection, type Row,
} from './content';
import { OPENING } from './copy';
import {
  AgentsResult, CameraFigure, ElementResult, ExportResult, FirstFigure, HeightfieldFigure, Hero, InstallFigure, LayoutFigure,
  LinesFigure, LooksFigure, ModesFigure, MotionFigure, PageResult, PerformanceResult, PlacesFigure, ReactResult, ShapeFigure, SnapshotBox,
  TerrainFigure, ThemeFigure,
} from './figures';
import type { LiveView } from './live';
import { tidy, tidyParagraphs, withMarkers } from './text';
import './docs.css';

const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
const pad = (i: number) => String(i + 1).padStart(2, '0');

/** HTML from the page's own content, never from input. */
function Html({ as: Tag = 'span', html, className, id }: { as?: 'span' | 'p' | 'div' | 'dd' | 'dt' | 'td'; html: string; className?: string; id?: string }) {
  return <Tag className={className} id={id} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Note numbers run through the page; this gives each section the numbers of its notes. */
const NOTE_NUMBERS: Record<string, number[]> = (() => {
  let n = 0;
  return Object.fromEntries(SECTIONS.map((s) => [s.id, s.notes.map(() => ++n)]));
})();

/* ---------------------------------------------------------------- tables and lists */

const c = (s: string) => <code>{s}</code>;

function SettingsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr><th>Setting</th><th>Attribute</th><th>Range</th><th>Default</th><th>What it does</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.key}><td>{c(r.key)}</td><td>{c(r.attr)}</td><td className="num">{r.range}</td><td className="num">{c(r.def)}</td><Html as="td" html={tidy(r.what)} /></tr>)}</tbody>
      </table>
    </div>
  );
}

function Table({ head, rows, code = [0] }: { head: ReactNode[]; rows: string[][]; code?: number[] }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]}>{r.map((cell, i) => (code.includes(i) ? <td key={i}>{c(cell)}</td> : <Html key={i} as="td" html={tidy(cell)} />))}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Contact() {
  return (
    <nav className="contact" aria-label="Yahya Bedirhan Pak elsewhere">
      {SOCIALS.map((s) => (
        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d={s.path} /></svg>
        </a>
      ))}
      <a href={EMAIL} aria-label="Email" title="Email">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>
      </a>
    </nav>
  );
}

/** The tables and lists a section carries after its prose. */
function Extras({ s }: { s: DocSection }) {
  const rows = s.params ? paramRows(s.params) : s.rows === 'theme' ? THEME_ROWS : s.rows === 'view' ? VIEW_ROWS : s.rows === 'camera' ? CAMERA_ROWS : null;
  return (
    <>
      {rows ? <SettingsTable rows={rows} /> : null}
      {s.id === 'camera' ? <Table head={['camera.motion', 'The path']} rows={MOTIONS.map((m) => [`'${m.id}'`, m.what])} /> : null}
      {s.id === 'export' ? (
        <>
          <Table head={['snapshot option', 'What it does', 'Default']} rows={SNAPSHOT_OPTIONS} />
          <Table head={['record option', 'Range', 'Default']} rows={RECORD_OPTIONS} />
        </>
      ) : null}
      {s.members ? <Table head={['Member', 'What it does']} rows={MEMBERS} /> : null}
      {s.tiers ? (
        <>
          <Table head={['Tier', 'Pixel ratio', 'Most pixels', 'Mesh']} rows={TIERS.map((t) => [t.id, String(t.dpr), t.px, t.mesh])} />
          <Table head={['Situation', 'What you see', 'status']} rows={FALLBACKS} code={[2]} />
        </>
      ) : null}
      {s.tools ? <Table head={[<><a href={WEBMCP} target="_blank" rel="noreferrer">WebMCP</a> tool</>, 'What it does']} rows={WEBMCP_TOOLS} /> : null}
      {s.limits ? <dl className="limits">{LIMITS.map(([t, d]) => <div key={t}><Html as="dt" html={t} /><Html as="dd" html={tidy(d)} /></div>)}</dl> : null}
      {s.questions ? <div className="faq">{QUESTIONS.map(([q, a]) => <details key={q}><summary dangerouslySetInnerHTML={{ __html: q }} /><Html as="p" html={tidy(a)} /></details>)}</div> : null}
      {s.contact ? <Contact /> : null}
    </>
  );
}

/* ---------------------------------------------------------------- sections */

/** The figure of each section, and whether it comes before the code. Figures that write their own code come first. */
function figureOf(id: string, camera: (v: LiveView | null) => void): { node: ReactNode; first: boolean } | null {
  switch (id) {
    case 'install': return { node: <InstallFigure />, first: true };
    case 'first': return { node: <FirstFigure />, first: false };
    case 'locations': return { node: <PlacesFigure />, first: true };
    case 'landforms': return { node: <ShapeFigure />, first: true };
    case 'looks': return { node: <LooksFigure />, first: true };
    case 'lines': return { node: <LinesFigure />, first: true };
    case 'terrain': return { node: <TerrainFigure />, first: true };
    case 'motion': return { node: <MotionFigure />, first: true };
    case 'layout': return { node: <LayoutFigure />, first: true };
    case 'theme': return { node: <ThemeFigure />, first: true };
    case 'modes': return { node: <ModesFigure />, first: true };
    case 'camera': return { node: <CameraFigure onView={camera} />, first: true };
    case 'export': return { node: <ExportResult />, first: false };
    case 'heightfields': return { node: <HeightfieldFigure />, first: true };
    case 'react': return { node: <ReactResult />, first: false };
    case 'element': return { node: <ElementResult />, first: false };
    case 'page': return { node: <PageResult />, first: false };
    case 'performance': return { node: <PerformanceResult />, first: false };
    case 'agents': return { node: <AgentsResult />, first: false };
    default: return null;
  }
}

function SectionCode({ s }: { s: DocSection }) {
  if (s.id === 'page') return <><CodeBlock code={CODE.pageCss.css!} lang="css" /><CodeBlock code={CODE.pageReact.react!} lang="react" /></>;
  if (!s.code || !CODE[s.code]) return null;
  return <CodeTabs code={CODE[s.code]} id={s.id === 'export' ? 'export-anchor' : undefined} />;
}

function Section({ s, index, camera, getCamera }: { s: DocSection; index: number; camera: (v: LiveView | null) => void; getCamera: () => LiveView | null }) {
  const numbers = NOTE_NUMBERS[s.id];
  const fig = figureOf(s.id, camera);
  const code = <SectionCode s={s} />;
  return (
    <section className="sec" id={s.id} aria-labelledby={`h-${s.id}`}>
      <h2 className="sec-h" id={`h-${s.id}`}><a href={`#${s.id}`}>{s.title}</a><span className="n">{pad(index)}</span></h2>
      <Html as="p" className="lede" html={tidy(s.lede)} />
      {s.body ? <Html as="div" className="body" html={tidyParagraphs(withMarkers(s.body, numbers))} /> : null}
      {fig?.first ? <>{fig.node}{code}</> : <>{code}{fig?.node}</>}
      <Extras s={s} />
      <aside className="mar">
        {s.notes.map((n, j) => (
          <p className="sn" key={numbers[j]} id={`fn-${numbers[j]}`} data-ref={`fnref-${numbers[j]}`}>
            <span className="k">{numbers[j]}</span><Html html={tidy(n)} />
          </p>
        ))}
        {s.id === 'export' ? <div className="sn box" data-ref="export-anchor"><SnapshotBox camera={getCamera} /></div> : null}
      </aside>
    </section>
  );
}

/* ---------------------------------------------------------------- the page */

/** The product's own places first, then the source and its maker. */
function BrandLinks({ home }: { home: string }) {
  const rows: [string, string, boolean][][] = [
    [['playground', home, false], ['npm', NPM, true]],
    [['GitHub', REPO, true], ['yahyapak.dev', SITE, true]],
  ];
  return (
    <div className="blinks-rows">
      {rows.map((row, i) => (
        <ul className="blinks" key={i}>
          {row.map(([label, href, out]) => <li key={label}><a href={href} {...(out ? { target: '_blank', rel: 'noreferrer' } : { 'data-astro-prefetch': '' })}>{label}</a></li>)}
        </ul>
      ))}
    </div>
  );
}

const RING = (
  <svg viewBox="0 0 34 24" aria-hidden="true">
    <path d="M3 12c0-6 7-9.5 14.5-9.5S31 6 31 12s-6.5 9.5-14 9.5S3 18 3 12z" />
    <path d="M8 12.2c0-3.7 4.3-6 9-6s8.6 2.3 8.6 5.8-4 6-8.8 6S8 15.9 8 12.2z" />
    <path d="M13 12.3c0-1.6 1.9-2.6 4-2.6s3.7 1 3.7 2.5-1.7 2.6-3.8 2.6-3.9-1-3.9-2.5z" />
  </svg>
);

const WIDE = '(min-width: 1041px)';

/** Lines each margin note up with its marker, below the note above it and clear of the margin's controls. */
function placeNotes(main: HTMLElement) {
  const wide = matchMedia(WIDE).matches;
  for (const sec of main.querySelectorAll<HTMLElement>('.sec')) {
    const notes = sec.querySelectorAll<HTMLElement>('.sn');
    if (!wide) { notes.forEach((n) => { n.style.top = ''; }); continue; }
    const base = sec.getBoundingClientRect().top;
    const blocks = [...sec.querySelectorAll('.fig > .ctl')].map((el) => { const r = el.getBoundingClientRect(); return [r.top - base, r.bottom - base]; });
    let floor = -Infinity;
    for (const n of notes) {
      const ref = document.getElementById(n.dataset.ref ?? '');
      let top = Math.max(ref ? ref.getBoundingClientRect().top - base - 3 : 110, floor);
      for (const [a, b] of blocks) if (top + n.offsetHeight > a && top < b) top = b + 16;
      n.style.top = `${top}px`;
      floor = top + n.offsetHeight + 14;
    }
  }
}

/** The docs page at /docs: one column of sections with live figures, the nav on the left and notes in the margin. */
export function Docs({ home }: { home: string }) {
  const main = useRef<HTMLElement>(null);
  const navlist = useRef<HTMLUListElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const cameraView = useRef<LiveView | null>(null);
  const [current, setCurrent] = useState(SECTIONS[0].id);
  const setCamera = useCallback((v: LiveView | null) => { cameraView.current = v; }, []);
  const getCamera = useCallback(() => cameraView.current, []);

  // Margin notes follow their markers as figures load and the window resizes.
  useEffect(() => {
    const el = main.current;
    if (!el) return;
    let raf = 0;
    const again = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => placeNotes(el)); };
    again();
    void document.fonts?.ready.then(again);
    const ro = new ResizeObserver(again);
    ro.observe(el);
    addEventListener('resize', again);
    addEventListener('docs-relayout', again);
    const late = window.setTimeout(again, 1200);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('resize', again); removeEventListener('docs-relayout', again); window.clearTimeout(late); };
  }, []);

  // The nav marks the section being read; the ring of contours moves to it.
  useEffect(() => {
    let raf = 0;
    const spy = () => {
      const y = innerHeight * 0.3;
      let id = SECTIONS[0].id;
      for (const s of SECTIONS) if ((document.getElementById(s.id)?.getBoundingClientRect().top ?? Infinity) < y) id = s.id;
      if (scrollY < 200) id = SECTIONS[0].id;
      setCurrent(id);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(spy); };
    spy();
    addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); removeEventListener('scroll', onScroll); };
  }, []);
  useEffect(() => {
    const a = navlist.current?.querySelector<HTMLElement>(`a[data-id="${current}"]`);
    const r = ring.current;
    if (!r) return;
    if (!a) { r.style.opacity = '0'; return; }
    r.style.opacity = '';
    r.style.transform = `translateY(${a.offsetTop + a.offsetHeight / 2 - 12}px)`;
    r.classList.remove('moving');
    void r.offsetWidth;
    r.classList.add('moving');
  }, [current]);

  // Figures change height as they hydrate, so jump to the #section again once the page runs.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  // On a wide screen a note marker flashes its note in the margin instead of jumping to it.
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('sup.fn a');
    if (!a || !matchMedia(WIDE).matches) return;
    const note = document.querySelector<HTMLElement>(a.getAttribute('href')!);
    if (!note) return;
    e.preventDefault();
    note.classList.remove('flash');
    void note.offsetWidth;
    note.classList.add('flash');
    window.setTimeout(() => note.classList.remove('flash'), 900);
  };

  return (
    <Tooltip.Provider delay={200}>
      <LangProvider>
        <div className="dx">
          <div className="mbar">
            <a className="wordmark" href="#top">topographic</a>
            <select aria-label="Jump to section" value={current} onChange={(e) => document.getElementById(e.target.value)?.scrollIntoView()}>
              {SECTIONS.map((s, i) => <option key={s.id} value={s.id}>{pad(i)} {s.nav}</option>)}
            </select>
          </div>
          <div className="page">
            <nav className="nav" aria-label="Docs">
              <div className="brand">
                <a className="wordmark" href="#top">topographic</a>
                <BrandLinks home={home} />
                {VERSION ? <span className="ver" title="The version these docs describe">{VERSION}</span> : null}
              </div>
              <div className="secs">
                <div className="ring" ref={ring} aria-hidden="true">{RING}</div>
                <ul ref={navlist}>
                  {GROUPS.map((g) => [
                    <li className="grp" key={`g-${g.name}`} aria-hidden="true" />,
                    ...g.ids.map((id) => <li key={id}><a href={`#${id}`} data-id={id} className={id === current ? 'on' : undefined}>{byId[id].nav}</a></li>),
                  ])}
                </ul>
              </div>
              <a className="nav-feedback" href="#feedback" data-id="feedback">Share feedback</a>
            </nav>
            <main id="top" ref={main} onClick={onClick}>
              <div className="head"><BrandLinks home={home} /></div>
              <h1 className="title">{OPENING.head}</h1>
              <p className="sub">{OPENING.sub}</p>
              <Hero />
              <div className="intro">
                <Html as="p" html={tidy(OPENING.open1)} />
                <Html as="p" html={tidy(OPENING.open2)} />
              </div>
              {SECTIONS.map((s, i) => <Section key={s.id} s={s} index={i} camera={setCamera} getCamera={getCamera} />)}
              <p className="coda"><span className="wm-inline">topographic</span> runs wherever JavaScript runs. Put it in a website, a video, a game, a slide, or something nobody has made&nbsp;yet.</p>
              <footer className="foot">
                <div><h3>Project</h3><ul>
                  <li><a href={home} data-astro-prefetch>Playground</a></li>
                  <li><a href={REPO} target="_blank" rel="noreferrer">GitHub</a></li>
                  <li><a href={NPM} target="_blank" rel="noreferrer">topographic on npm</a></li>
                  <li><a href={NPM_REACT} target="_blank" rel="noreferrer">topographic-react on npm</a></li>
                </ul></div>
                <div><h3>License</h3><ul>
                  <li><a href={LICENSE} target="_blank" rel="noreferrer">Apache 2.0</a></li>
                  <li><a href={PRIVACY} target="_blank" rel="noreferrer">Privacy</a></li>
                  <li><a href="https://yahyapak.dev" target="_blank" rel="noreferrer">yahyapak.dev</a></li>
                </ul></div>
                <div><h3>Data</h3><ul>
                  <li><a href={TERRAIN_TILES} target="_blank" rel="noreferrer">Mapzen Terrain Tiles</a></li>
                  <li><a href={AWS_OPEN_DATA} target="_blank" rel="noreferrer">AWS Open Data</a></li>
                  <li><a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a></li>
                  <li><a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a></li>
                  <li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></li>
                </ul></div>
              </footer>
            </main>
          </div>
        </div>
      </LangProvider>
    </Tooltip.Provider>
  );
}
