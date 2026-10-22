import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { LANG_NAMES, grammar, highlight, type Lang, type Snippet } from './code';

const STORE = 'topographic-docs-lang';
const read = (): Lang | null => { try { return localStorage.getItem(STORE) as Lang | null; } catch { return null; } };
const save = (lang: Lang) => { try { localStorage.setItem(STORE, lang); } catch { /* storage may be blocked */ } };

/** The language the reader picked last, shared by every tabbed block on the page and kept for the next visit. */
const LangContext = createContext<{ lang: Lang; pick: (lang: Lang) => void }>({ lang: 'js', pick: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  // The page is HTML from the build, which cannot know this browser's pick, so the saved pick is applied after hydration.
  const [lang, setLang] = useState<Lang>('js');
  useEffect(() => { const saved = read(); if (saved) setLang(saved); }, []);
  const pick = (next: Lang) => { setLang(next); save(next); };
  return <LangContext.Provider value={{ lang, pick }}>{children}</LangContext.Provider>;
}

const COPY = <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.6" /><path d="M10.5 3.5v-.4A1.6 1.6 0 0 0 8.9 1.5H3.1A1.6 1.6 0 0 0 1.5 3.1v5.8a1.6 1.6 0 0 0 1.6 1.6h.4" /></svg>;
const CHECK = <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 8.5 3 3 7-7" /></svg>;

/** A quiet copy button that turns into a check for a moment. */
export function CopyButton({ text }: { text: () => string }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setDone(false), 1200);
    return () => window.clearTimeout(id);
  }, [done]);
  return (
    <button
      type="button"
      className={`copy${done ? ' done' : ''}`}
      aria-label={done ? 'Copied' : 'Copy code'}
      title={done ? 'Copied' : 'Copy code'}
      onClick={async () => { try { await navigator.clipboard.writeText(text()); } catch { /* clipboard may be blocked */ } setDone(true); }}
    >
      {done ? CHECK : COPY}
    </button>
  );
}

/** One block of code, with no title bar: just the code and a copy button in its top-right corner. */
export function CodeBlock({ code, lang = 'js', one = false, id }: { code: string; lang?: Lang; one?: boolean; id?: string }) {
  const text = code.trim();
  return (
    <figure className={`code${one ? ' one' : ''}`} id={id}>
      <pre><code dangerouslySetInnerHTML={{ __html: highlight(text, grammar(lang)) }} /></pre>
      <CopyButton text={() => text} />
    </figure>
  );
}

/** Code in several languages, one tab each. The tab follows the reader's last pick on the page. */
export function CodeTabs({ code, id }: { code: Snippet; id?: string }) {
  const { lang, pick } = useContext(LangContext);
  const langs = (Object.keys(code) as Lang[]).filter((k) => code[k]);
  if (langs.length === 1) return <CodeBlock code={code[langs[0]]!} lang={langs[0]} id={id} one={langs[0] === 'sh' && !code[langs[0]]!.trim().includes('\n')} />;
  const shown = langs.includes(lang) ? lang : langs[0];
  const text = code[shown]!.trim();
  return (
    <figure className="code tabs" id={id}>
      <div className="code-head">
        <div className="code-tabs" role="tablist" aria-label="Language">
          {langs.map((k) => (
            <button key={k} type="button" className="code-tab" role="tab" aria-selected={k === shown} onClick={() => pick(k)}>{LANG_NAMES[k]}</button>
          ))}
        </div>
        <CopyButton text={() => text} />
      </div>
      <pre role="tabpanel" data-lang={shown}><code dangerouslySetInnerHTML={{ __html: highlight(text, grammar(shown)) }} /></pre>
    </figure>
  );
}

/** Tabbed code that a figure rewrites as its inputs change; a soft flash marks each rewrite. */
export function LiveCode({ code }: { code: Snippet }) {
  const box = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(code);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = box.current;
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }, [key]);
  return <div className="livecode" ref={box}><CodeTabs code={code} /></div>;
}
