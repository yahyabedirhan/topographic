// Code for the docs page: a small highlighter, and the JavaScript, React and HTML that draw a figure's settings.
import { PARAMS } from 'topographic';

export type Lang = 'js' | 'react' | 'html' | 'css' | 'sh';
/** One snippet in one or more languages. */
export type Snippet = Partial<Record<Lang, string>>;

export const LANG_NAMES: Record<Lang, string> = { js: 'JavaScript', react: 'React', html: 'HTML', css: 'CSS', sh: 'Shell' };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const KW = /^(import|from|export|default|function|return|const|let|await|async|for|new|null|true|false|if|of|undefined)$/;

/** Highlights a snippet of JavaScript, JSX, HTML, CSS or shell as HTML with `tk-*` spans. */
export function highlight(code: string, lang: Lang = 'js'): string {
  const re = lang === 'css'
    ? /(\/\*[\s\S]*?\*\/)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(--?[\w-]+|[a-z-]+)(?=\s*:)|(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|vh|%)?\b)|([\w-]+(?=\s*\{))/g
    : lang === 'sh'
      ? /(#[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(\bnpm\b|\bnpx\b|\bcurl\b)|(\b\d+(?:\.\d+)*\b)|(\$)/g
      : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.-]*|\/?>)|(\b[a-zA-Z_][\w-]*(?==[{"']))|(\b[A-Za-z_]\w*\b)|(\b\d+(?:\.\d+)?\b)/g;
  let out = '';
  let last = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index));
    const [t] = m;
    let cls = '';
    if (lang === 'css') cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'a' : m[4] ? 'n' : m[5] ? 't' : '';
    else if (lang === 'sh') cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'n' : m[5] ? 'p' : '';
    else if (m[1]) cls = 'c';
    else if (m[2]) cls = 's';
    else if (m[3]) cls = 't';
    else if (m[4]) cls = 'a';
    else if (m[5]) cls = KW.test(t) ? 'k' : '';
    else if (m[6]) cls = 'n';
    out += cls ? `<span class="tk-${cls}">${esc(t)}</span>` : esc(t);
    last = (m.index ?? 0) + t.length;
  }
  return out + esc(code.slice(last));
}

/** The highlighter's grammar for a language: React and HTML read as JavaScript. */
export const grammar = (lang: Lang): Lang => (lang === 'react' || lang === 'html' ? 'js' : lang);

type Value = string | number | { [k: string]: Value };
export type Props = Record<string, Value>;

const num = (v: number) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(2)));
const jsVal = (v: Value): string => (typeof v === 'string' ? `'${v}'` : typeof v === 'number' ? num(v) : `{ ${Object.entries(v).map(([k, x]) => `${k}: ${jsVal(x)}`).join(', ')} }`);
const ATTR: Record<string, Record<string, string>> = {
  top: { shape: 'shape', seed: 'seed', location: 'location', look: 'look', mode: 'mode', elevation: 'elevation', extent: 'extent', detail: 'detail' },
  camera: { azimuth: 'azimuth', elevation: 'camera-elevation', radius: 'radius', motion: 'camera-motion', speed: 'camera-speed' },
  theme: { mode: 'theme', ink: 'ink', paper: 'paper' },
};
const attrOf = (group: string | null, key: string) =>
  group ? ATTR[group]?.[key] ?? PARAMS.find((p) => p.group === group && p.key === key)?.attr ?? key : ATTR.top[key] ?? key;

/**
 * JavaScript, React and HTML for one set of settings, in the order given. Groups stay objects in JavaScript and
 * React, and become one attribute per value on the element. Long code puts each value on its own line.
 */
export function codeFor(props: Props): { js: string; react: string; html: string } {
  const entries = Object.entries(props).filter(([, v]) => v !== undefined);
  const block = (v: Value) => {
    const one = jsVal(v);
    return typeof v === 'object' && one.length > 58 ? `{\n${Object.entries(v).map(([k, x]) => `    ${k}: ${jsVal(x)},`).join('\n')}\n  }` : one;
  };
  const one = entries.map(([k, v]) => `${k}: ${jsVal(v)}`).join(', ');
  const js = one.length < 44 ? `createTopography(el, { ${one} });` : `createTopography(el, {\n${entries.map(([k, v]) => `  ${k}: ${block(v)},`).join('\n')}\n});`;
  const rv = (v: Value) => (typeof v === 'string' ? `"${v}"` : typeof v === 'number' ? `{${num(v)}}` : `{${jsVal(v)}}`);
  const reactProps = entries.map(([k, v]) => `${k}=${rv(v)}`);
  const react = reactProps.join(' ').length < 52 ? `<Topography ${reactProps.join(' ')} />` : `<Topography\n${reactProps.map((x) => `  ${x}`).join('\n')}\n/>`;
  const attrs: string[] = [];
  for (const [k, v] of entries) {
    if (typeof v === 'object') for (const [kk, vv] of Object.entries(v)) attrs.push(`${attrOf(k, kk)}="${typeof vv === 'number' ? num(vv) : String(vv)}"`);
    else attrs.push(`${attrOf(null, k)}="${typeof v === 'number' ? num(v) : v}"`);
  }
  const tag = 'topographic-view';
  const html = attrs.join(' ').length < 48 ? `<${tag} ${attrs.join(' ')}></${tag}>` : `<${tag}\n${attrs.map((a) => `  ${a}`).join('\n')}\n></${tag}>`;
  return { js, react, html };
}

const ORDER: Record<string, string[]> = {
  camera: ['azimuth', 'elevation', 'radius', 'motion', 'panX', 'panZ'],
  theme: ['mode', 'ink', 'paper'],
};

/** A group's values in the order the library lists them, whatever order they were set in. */
function ordered(group: string, v: Record<string, unknown>): Record<string, Value> {
  const keys = ORDER[group] ?? PARAMS.filter((p) => p.group === group).map((p) => p.key);
  const out: Record<string, Value> = {};
  for (const k of keys) if (v[k] !== undefined) out[k] = v[k] as Value;
  for (const k of Object.keys(v)) if (!(k in out) && v[k] !== undefined) out[k] = v[k] as Value;
  return out;
}

/** The settings a figure shows, as the props a reader would write: only `keys`, groups in the library's order. */
export function asProps(settings: object, keys: readonly string[]): Props {
  const s = settings as Record<string, unknown>;
  const out: Props = {};
  for (const k of keys) {
    const v = s[k];
    if (v === undefined || v === null) continue;
    out[k] = typeof v === 'object' ? ordered(k, v as Record<string, unknown>) : (v as Value);
  }
  return out;
}
