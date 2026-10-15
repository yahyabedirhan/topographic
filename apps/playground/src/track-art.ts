// The SVG drawings in Tune and Export, as markup strings: row glyphs, slider-track art that draws each
// setting's effect, the small live previews and the export pictures. Plain strings keep them cheap to redraw.

const n1 = (v: number) => Math.round(v * 10) / 10;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
let UID = 0;
const uid = () => `ta${++UID}`;

/** Glyphs on lucide's 24-unit grid, stroked with currentColor. */
export const GLYPHS = {
  count: '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="9.5"/>',
  width: '<path d="M4 6h16" stroke-width="1"/><path d="M4 12h16" stroke-width="2"/><path d="M4 18h16" stroke-width="3.2"/>',
  opacity: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
  indexEvery: '<circle cx="12" cy="12" r="3" stroke-width="1.25"/><circle cx="12" cy="12" r="6.5" stroke-width="2.6"/><circle cx="12" cy="12" r="10" stroke-width="1.25"/>',
  peaks: '<path d="M2 20 8 9l4 6 3-4 7 9z"/>',
  spread: '<path d="M12 4v16"/><path d="m7 9-3 3 3 3"/><path d="m17 9 3 3-3 3"/><path d="M4 12h4.5M15.5 12H20"/>',
  sharpness: '<path d="M3 20c5 0 7.5-2 9-16 1.5 14 4 16 9 16"/>',
  variant: '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-7.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/>',
  roughness: '<path d="M2 16l3-3 2 2 3-5 2 3 3-5 2 4 3-2 2 2"/><path d="M2 20h20"/>',
  terracing: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
  speed: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  warp: '<path d="M2 9c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 16c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>',
  sparkle: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/>',
  anchor: '<line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
  fade: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9.5 4v16M14.5 4v16" stroke-dasharray="2 2.2"/>',
  extent: '<path d="M2 18 7 8h10l5 10z"/><path d="M12 8v10M4.5 13h15"/>',
  elevation: '<path d="M2 20h20"/><path d="M4 20c3-1 5-9 8-9s5 8 8 9"/><path d="M12 8V2.5M9.5 5 12 2.5 14.5 5"/>',
  camMotion: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  azimuth: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>',
  angle: '<path d="M3 19h18"/><path d="M3 19 17 7"/><path d="M10.5 19a7.5 7.5 0 0 0-1.9-5"/>',
  distance: '<circle cx="4.5" cy="12" r="2"/><circle cx="19.5" cy="12" r="2"/><path d="M8 12h8" stroke-dasharray="1.5 2.5"/>',
  detail: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  // choices
  block: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  endless: '<path d="M1.5 19 7 7h10l5.5 12"/><path d="M1.5 19h21"/><path d="M12 7v12M4.2 13h15.6"/><path d="M7 7l-1.5 12M17 7l1.5 12" opacity=".5"/>',
  still: '<circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="8" stroke-dasharray="1.6 3.2"/>',
  orbit: '<ellipse cx="12" cy="12" rx="9.5" ry="5.5"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><path d="m14.6 3.9 3.2 2.6-3.6 1.8"/>',
  push: '<circle cx="19.5" cy="12" r="2.3" fill="currentColor" stroke="none"/><path d="M2.5 12h11"/><path d="m10.5 8.5 3.5 3.5-3.5 3.5"/>',
  flyover: '<path d="M2.5 14.5C6 5 18 5 21.5 14.5"/><path d="m17.8 13.1 3.7 1.4.9-3.8"/><path d="M8 21l4-4.5 4 4.5"/>',
  drone: '<path d="M2.5 18 7 11l4 4 4.5-7.5 4.5 3.5"/><circle cx="20.5" cy="11" r="1.8" fill="currentColor" stroke="none"/>',
  low: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/>',
  medium: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
  high: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M6.6 3v18M10.2 3v18M13.8 3v18M17.4 3v18M3 6.6h18M3 10.2h18M3 13.8h18M3 17.4h18" stroke-width="1.1"/>',
  // export
  style: '<circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><path d="M5 17A12 12 0 0 1 17 5"/>',
  seed: '<rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01M10 14h.01M15 6h.01M18 9h.01"/>',
  look: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  mode: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  theme: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
  ink: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  paper: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  place: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h16M12 17v4" transform="translate(-4 0)"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  wide: '<rect width="20" height="11.25" x="2" y="6.4" rx="1.6"/>',
  play: '<path d="M6 3.8v16.4a.8.8 0 0 0 1.2.7l13-8.2a.8.8 0 0 0 0-1.4l-13-8.2A.8.8 0 0 0 6 3.8z" fill="currentColor"/>',
} as const;

export type GlyphName = keyof typeof GLYPHS;

/** A glyph as a whole SVG element string, for markup built from strings. */
export const glyphSvg = (name: GlyphName, size = 16, stroke = 1.75) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[name]}</svg>`;

/** The keys a slider track can draw. */
export type TrackKind =
  | 'count' | 'width' | 'opacity' | 'indexEvery' | 'peaks' | 'spread' | 'sharpness' | 'variant' | 'roughness' | 'terracing'
  | 'speed' | 'warp' | 'sparkle' | 'anchor' | 'fade' | 'elevation' | 'azimuth' | 'angle' | 'distance';

/** The inside of a W×24 SVG that pictures what the setting does, from its minimum on the left to its maximum on the right. */
export function trackArt(k: TrackKind, W: number): string {
  const m = 12;
  let s = '';
  switch (k) {
    case 'count': { const N = 27; for (let i = 0; i <= N; i++) { const x = n1(2 + (W - 4) * Math.pow(i / N, 0.7)); s += `<path d="M${x} 6.5V17.5" stroke-width="1.2"/>`; } return s; }
    case 'width': return `<path d="M2 ${m - 0.35}L${W - 4} ${m - 2.4}a2.4 2.4 0 0 1 0 4.8L2 ${m + 0.35}a.35 .35 0 0 1 0-.7z" fill="currentColor" stroke="none"/>`;
    case 'opacity': { const id = uid(); return `<defs><linearGradient id="${id}"><stop offset="0" stop-color="currentColor" stop-opacity=".04"/><stop offset="1" stop-color="currentColor" stop-opacity="1"/></linearGradient></defs><rect x="1" y="8.5" width="${W - 2}" height="7" rx="3.5" fill="url(#${id})" stroke="none"/><rect x="1.25" y="8.75" width="${W - 2.5}" height="6.5" rx="3.25" stroke-width=".5" opacity=".5"/>`; }
    case 'indexEvery': { for (let i = 0; i <= 10; i++) { const x = n1(3 + i * (W - 6) / 10); s += i === 0 ? `<circle cx="${x}" cy="12" r="2" stroke-width="1.2"/>` : `<path d="M${x} ${i % 5 === 0 ? 5.5 : 8.5}V${i % 5 === 0 ? 18.5 : 15.5}" stroke-width="${i % 5 === 0 ? 2.2 : 1.2}"/>`; } return s; }
    case 'peaks': { for (let i = 1; i <= 6; i++) { const cx = 3 + (i - 1) * (W - 6) / 5; const gw = 7 + (i - 1) * 4.2; const x0 = clamp(cx - gw / 2, 1, W - 1 - gw); let d = `M${n1(x0)} 18`; for (let j = 0; j < i; j++) { const px = x0 + 3.5 + j * 4.2; d += ` L${n1(px)} ${j % 2 ? 8.5 : 6.5} L${n1(px + 2.1)} ${j === i - 1 ? 18 : 13}`; } d += ` L${n1(x0 + gw)} 18`; s += `<path d="${d}" stroke-width="1.3"/>`; } return s; }
    case 'spread': { let x = 6; let g = 2.5; while (x < W - 6) { s += `<path d="M${n1(x - 3)} 17 L${n1(x)} 8 L${n1(x + 3)} 17" stroke-width="1.3"/>`; x += 6 + g; g += 1.3; } return s; }
    case 'sharpness': { const n = 8; const bw = (W - 4) / n; let d = ''; for (let j = 0; j < n; j++) { const p = lerp(0.35, 7, Math.pow(j / (n - 1), 1.3)); for (let q = 0; q <= 14; q++) { const u = q / 14 * 2 - 1; const y = 18 - 11 * Math.pow(Math.cos(Math.PI * u / 2), p); d += `${j === 0 && q === 0 ? 'M' : 'L'}${n1(2 + bw * j + bw * q / 14)} ${n1(y)}`; } } return `<path d="${d}" stroke-width="1.3"/>`; }
    case 'variant': { const n = 6; for (let j = 0; j < n; j++) { const cx = 8 + j * (W - 16) / (n - 1); const lob = j < 3 ? 3 : 4; let d = ''; for (let q = 0; q <= 48; q++) { const th = q / 48 * Math.PI * 2; const r = 4.6 * (1 + 0.3 * Math.cos(lob * th + j * 0.6)); d += `${q ? 'L' : 'M'}${n1(cx + r * Math.cos(th))} ${n1(12 + r * Math.sin(th))}`; } s += `<path d="${d}Z" stroke-width="1.2"/>`; } return s; }
    case 'roughness': { let d = ''; for (let x = 1; x <= W - 1; x += 1.5) { const a = 0.2 + (x / W) * 5.4; const y = m + a * (Math.sin(x * 1.9) + 0.7 * Math.sin(x * 4.3 + 1) + 0.5 * Math.sin(x * 0.6)) / 2.2; d += `${x === 1 ? 'M' : 'L'}${n1(x)} ${n1(y)}`; } return `<path d="${d}" stroke-width="1.3"/>`; }
    case 'terracing': { let d = ''; const st = 6; for (let x = 1; x <= W - 1; x += 0.5) { const r = x / W; const t = Math.min(1, r * 1.5); const q = (Math.floor(r * st) + 0.5) / st; const y = 20 - 16 * lerp(r, q, t); d += `${x === 1 ? 'M' : 'L'}${n1(x)} ${n1(y)}`; } return `<path d="${d}" stroke-width="1.4"/>`; }
    case 'speed': { [7, 12, 17].forEach((y, ri) => { let x = 2 + ri * 3; let len = 1; while (x < W - 2) { const e = Math.min(W - 2, x + len); s += `<path d="M${n1(x)} ${y}H${n1(e)}" stroke-width="1.4" opacity="${ri === 1 ? 1 : 0.55}"/>`; const r = x / W; x = e + lerp(7, 3, r); len = lerp(1, 18, r); } }); return s; }
    case 'warp': { let d = ''; for (let x = 1; x <= W - 1; x += 1) { const a = 0.3 + (x / W) * 6.5; d += `${x === 1 ? 'M' : 'L'}${x} ${n1(m + a * Math.sin(x / W * Math.PI * 2 * 7))}`; } return `<path d="${d}" stroke-width="1.4"/>`; }
    case 'sparkle': { s += `<path d="M2 12H${W - 2}" stroke-width="1" opacity=".45"/>`; let x = 5; let i = 0; while (x < W - 6) { const r = x / W; if (r > 0.55 && i % 3 === 0) { const z = lerp(2.5, 4.5, r); s += `<path d="M${n1(x)} ${n1(12 - z)}Q${n1(x)} 12 ${n1(x + z)} 12Q${n1(x)} 12 ${n1(x)} ${n1(12 + z)}Q${n1(x)} 12 ${n1(x - z)} 12Q${n1(x)} 12 ${n1(x)} ${n1(12 - z)}Z" fill="currentColor" stroke="none"/>`; } else s += `<circle cx="${n1(x)}" cy="12" r="${n1(lerp(0.7, 1.7, r))}" fill="currentColor" stroke="none"/>`; x += lerp(14, 6, r); i++; } return s; }
    case 'anchor': { s += `<path d="M3 12H${W - 3}" stroke-width="1" stroke-dasharray="1.5 3.5" opacity=".7"/>`; [3, 6.5, 10].forEach((r) => { s += `<path d="M1 ${12 - r}A${r} ${r} 0 0 1 1 ${12 + r}" stroke-width="1.2"/>`; }); [2.5, 6, 9.5].forEach((r) => { s += `<circle cx="${W - 11}" cy="12" r="${r}" stroke-width="1.2"/>`; }); return s; }
    case 'fade': { for (let x = 3; x < W - 2; x += 4) s += `<path d="M${x} 5V19" stroke-width="1.2" opacity="${n1(1 - 0.88 * Math.pow(x / W, 0.8))}"/>`; return s; }
    case 'elevation': { let d = 'M1 19'; for (let x = 1; x <= W - 1; x += 2) { const r = x / W; d += ` L${x} ${n1(19 - 14 * Math.pow(r, 1.35) - 0.7 * Math.sin(x / 4.2) * r)}`; } d += ` L${W - 1} 19Z`; return `<path d="${d}" fill="currentColor" stroke="none"/>`; }
    case 'azimuth': { const L = ['N', 'E', 'S', 'W', 'N']; for (let a = 0; a <= 360; a += 15) { const x = n1(2 + (W - 4) * a / 360); const card = a % 90 === 0; s += `<path d="M${x} ${card ? 13 : 15.5}V20" stroke-width="${card ? 1.4 : 1}"/>`; if (card) s += `<text x="${x}" y="9.5" text-anchor="${a === 0 ? 'start' : a === 360 ? 'end' : 'middle'}" font-size="8.5" font-weight="600" fill="currentColor" stroke="none" font-family="-apple-system,Inter,sans-serif">${L[a / 90]}</text>`; } return s; }
    case 'angle': { const n = 9; for (let i = 0; i < n; i++) { const bx = 5 + i * (W - 14) / (n - 1); const a = (2 + 78 * i / (n - 1)) * Math.PI / 180; s += `<path d="M${n1(bx - 3)} 19H${n1(bx + 6)}M${n1(bx - 3)} 19L${n1(bx - 3 + 12 * Math.cos(a))} ${n1(19 - 12 * Math.sin(a))}" stroke-width="1.2"/>`; } return s; }
    case 'distance': { const n = Math.floor((W - 8) / 11) + 1; for (let i = 0; i < n; i++) { const r = lerp(3.6, 0.8, i / (n - 1)); s += `<circle cx="${n1(4 + i * (W - 8) / (n - 1))}" cy="12" r="${n1(r)}" fill="currentColor" stroke="none"/>`; } return s; }
  }
  return s;
}

// ---------------------------------------------------------------- previews

function ringPath(cx: number, cy: number, r: number, seed: number, sx = 1.3, sy = 1): string {
  let d = '';
  for (let q = 0; q <= 72; q++) {
    const th = q / 72 * Math.PI * 2;
    const rr = r * (1 + 0.09 * Math.sin(3 * th + seed) + 0.05 * Math.sin(5 * th + seed * 2.1 + r * 0.04));
    d += `${q ? 'L' : 'M'}${n1(cx + rr * Math.cos(th) * sx)} ${n1(cy + rr * Math.sin(th) * sy)}`;
  }
  return `${d}Z`;
}

export interface LinesLook { count: number; width: number; opacity: number; indexEvery: number }

/** Contour rings with the line count, width, opacity and index lines of the settings. */
export function contourArt(S: LinesLook, W: number, H: number, cx: number, cy: number, reach = Math.hypot(W, H)): string {
  const n = Math.round(S.count);
  const gap = Math.max(3.2, reach / (n * 0.62));
  const px = 0.5 + S.width * 3.5;
  const o = 0.2 + 0.8 * S.opacity;
  const ie = Math.round(S.indexEvery);
  let s = '';
  for (let i = 1; i <= n; i++) {
    const r = i * gap;
    if (r > reach * 1.2) break;
    const idx = ie > 0 && i % ie === 0;
    s += `<path d="${ringPath(cx, cy, r, 1.3)}" stroke-width="${n1(px * (idx ? 1.9 : 1) * 0.75)}" opacity="${n1(idx ? Math.min(1, o + 0.25) : o)}"/>`;
  }
  return `<g fill="none" stroke="currentColor">${s}</g>`;
}

export interface ShapeLook { peaks: number; spread: number; sharpness: number; roughness: number; terracing: number; variant: number }

function profileFn(S: ShapeLook) {
  const P = Math.round(S.peaks);
  const sp = S.spread;
  const sh = S.sharpness;
  const pk: { c: number; a: number; w: number }[] = [];
  for (let i = 0; i < P; i++) {
    const off = P === 1 ? 0 : (i / (P - 1) - 0.5) * 2;
    pk.push({ c: 0.5 + off * sp * 0.36 + (P > 1 ? (i % 2 ? 0.03 : -0.02) : 0) + (S.variant - 0.5) * 0.04, a: i === Math.floor(P / 2) ? 1 : lerp(0.78, 0.55, Math.abs(off)), w: lerp(0.2, 0.13, sh) });
  }
  const p = sh < 0.5 ? lerp(0.6, 1.6, sh * 2) : lerp(1.6, 5, (sh - 0.5) * 2);
  return (u: number) => {
    let h = 0;
    for (const k of pk) { const d = Math.abs(u - k.c) / k.w; if (d < 1) h = Math.max(h, k.a * Math.pow(Math.cos(Math.PI * d / 2), p)); }
    h += S.roughness * 0.12 * (Math.sin(u * 90) + 0.6 * Math.sin(u * 210 + 1) + 0.4 * Math.sin(u * 37)) * Math.min(1, h * 3 + 0.15);
    if (S.terracing > 0) { const st = 8; const q = Math.round(h * st) / st; h = lerp(h, q, S.terracing); }
    return clamp(h, 0, 1.15);
  };
}

/** A side profile of the generated terrain: peaks, spread, sharpness, roughness and terracing. */
export function terrainArt(S: ShapeLook, W: number, base: number, top: number): string {
  const f = profileFn(S);
  let d = `M0 ${base}`;
  for (let x = 0; x <= W; x += 1.5) d += ` L${n1(x)} ${n1(base - (base - top) * f(x / W))}`;
  d += ` L${W} ${base}Z`;
  const id = uid();
  let hatch = '';
  for (let y = base - 4; y > top - 6; y -= 5) hatch += `<path d="M0 ${y}H${W}" stroke-width=".75"/>`;
  return `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="currentColor" fill-opacity=".07" stroke="none"/><g clip-path="url(#${id})" stroke="currentColor" opacity=".35" fill="none">${hatch}</g><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>`;
}

export interface FlowLook { speed: number; warp: number; sparkle: number }

/** Flow lines: warp bends them, speed adds trails, sparkle travels along them (animated by CSS). */
export function flowArt(S: FlowLook, W: number, H: number): string {
  let s = '';
  const rows = 7;
  const a = S.warp * 9;
  for (let i = 0; i < rows; i++) {
    const y0 = 10 + i * (H - 20) / (rows - 1);
    let d = '';
    for (let x = -2; x <= W + 2; x += 3) d += `${x === -2 ? 'M' : 'L'}${x} ${n1(y0 + a * Math.sin(x / W * Math.PI * 2 * 2.2 + i * 0.9) + a * 0.4 * Math.sin(x / 37 + i))}`;
    s += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1" opacity=".55"/>`;
    const trails = Math.round(S.speed * 2);
    for (let t = 1; t <= trails; t++) s += `<path d="${d}" transform="translate(${-t * 2.5} 0)" fill="none" stroke="currentColor" stroke-width="1" opacity="${n1(0.16 / t)}"/>`;
    if (S.sparkle > 0) {
      // The dots travel one dash period per loop, at a pace set by speed, so the loop never jumps.
      const gap = n1(lerp(60, 9, S.sparkle));
      const style = S.speed > 0 ? ` style="--to:${n1(i * 7 - gap - 0.1)};animation-duration:${((gap + 0.1) / (14 * S.speed)).toFixed(2)}s"` : '';
      s += `<path class="pt-flow-dot" d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="0.1 ${gap}" stroke-dashoffset="${i * 7}" opacity="${n1(0.4 + 0.6 * S.sparkle)}"${style}/>`;
    }
  }
  return `<g stroke-linecap="round">${s}</g>`;
}

/** A mini page: the summit moves from the side to the centre with anchor, and the text column fades the lines. */
export function layoutArt(S: { anchor: number; fade: number }, W: number, H: number): string {
  const cx = lerp(W * 0.86, W * 0.5, S.anchor);
  const cy = H * 0.52;
  const id = uid();
  const col = W * 0.34;
  const cl = W / 2 - col / 2;
  return `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="var(--paper)" stop-opacity="0"/><stop offset=".22" stop-color="var(--paper)" stop-opacity="${n1(S.fade * 0.95)}"/><stop offset=".78" stop-color="var(--paper)" stop-opacity="${n1(S.fade * 0.95)}"/><stop offset="1" stop-color="var(--paper)" stop-opacity="0"/></linearGradient></defs>`
    + contourArt({ count: 26, width: 0.2, opacity: 0.45, indexEvery: 5 }, W, H, cx, cy, W * 1.1)
    + `<rect x="${n1(cl - col * 0.25)}" y="0" width="${n1(col * 1.5)}" height="${H}" fill="url(#${id})"/>`
    + `<g fill="currentColor"><rect x="${n1(cl + col * 0.12)}" y="${n1(H * 0.3)}" width="${n1(col * 0.76)}" height="7" rx="2"/><rect x="${n1(cl + col * 0.05)}" y="${n1(H * 0.3 + 15)}" width="${n1(col * 0.9)}" height="3" rx="1.5" opacity=".45"/><rect x="${n1(cl + col * 0.1)}" y="${n1(H * 0.3 + 23)}" width="${n1(col * 0.8)}" height="3" rx="1.5" opacity=".45"/><rect x="${n1(cl + col * 0.3)}" y="${n1(H * 0.3 + 35)}" width="${n1(col * 0.4)}" height="9" rx="4.5" opacity=".8"/></g>`
    + `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="3.5" fill="currentColor"/>`;
}

export interface RigLook { azimuth: number; angle: number; distance: number; elevation: number; motion: string }

/** The camera from above (azimuth, with the orbit path) and from the side (angle, distance over the terrain's height). */
export function rigArt(S: RigLook, W: number, H: number): string {
  const az = ((S.azimuth % 360) + 360) % 360 * Math.PI / 180;
  const tc = { x: 62, y: H / 2 + 5 };
  const R = Math.min(36, H / 2 - 13);
  const P = (r: number, a: number) => [n1(tc.x + r * Math.sin(a)), n1(tc.y + r * Math.cos(a))];
  const cam = P(R, az);
  const moving = S.motion !== 'still';
  let top = `<circle cx="${tc.x}" cy="${tc.y}" r="${R}" stroke-width="1" opacity="${moving ? 0.7 : 0.3}" stroke-dasharray="${moving ? '0' : '2 3'}"/>`;
  const [sx, sy] = P(R, 0);
  top += `<path d="M${tc.x} ${tc.y}L${sx} ${sy}A${R} ${R} 0 0 ${az > Math.PI ? 1 : 0} ${cam[0]} ${cam[1]}Z" fill="currentColor" fill-opacity=".09" stroke="none"/>`;
  [5, 10, 15].forEach((r) => { top += `<path d="${ringPath(tc.x, tc.y, r * R / 36, 0.8, 1.15, 1)}" stroke-width=".9" opacity=".55"/>`; });
  top += `<path d="M${tc.x} ${tc.y - R - 3}V${tc.y - R + 4}" stroke-width="1.4"/><text x="${tc.x}" y="${tc.y - R - 6}" text-anchor="middle" font-size="8.5" font-weight="600" fill="currentColor" stroke="none" opacity=".7">N</text>`;
  top += `<path d="M${cam[0]} ${cam[1]}L${tc.x} ${tc.y}" stroke-width="1" stroke-dasharray="2.5 2.5" opacity=".7"/>`;
  if (S.motion === 'orbit' || S.motion === 'drone') {
    const a2 = az + 0.62;
    const [hx, hy] = P(R, a2);
    const d = [Math.cos(a2), -Math.sin(a2)];
    const q = [-d[1], d[0]];
    top += `<path d="M${n1(hx - 5 * d[0] + 3.5 * q[0])} ${n1(hy - 5 * d[1] + 3.5 * q[1])}L${hx} ${hy}L${n1(hx - 5 * d[0] - 3.5 * q[0])} ${n1(hy - 5 * d[1] - 3.5 * q[1])}" stroke-width="1.5"/>`;
  }
  top += `<circle cx="${cam[0]}" cy="${cam[1]}" r="4.5" fill="currentColor" stroke="var(--paper)" stroke-width="1.5"/>`;
  const azl = P(R * 0.55, az / 2);
  top += `<text x="${azl[0]}" y="${n1(azl[1] + 3)}" text-anchor="middle" font-size="9.5" font-weight="500" fill="currentColor" stroke="none">${Math.round(az * 180 / Math.PI)}°</text>`;
  // side view
  const gx0 = 128;
  const gx1 = W - 12;
  const gy = H - 16;
  const tx = gx0 + (gx1 - gx0) * 0.66;
  const hgt = 4 + S.elevation * (H * 0.3);
  let prof = `M${gx0} ${gy}`;
  for (let x = gx0; x <= gx1; x += 2) { const u = (x - tx) / 44; prof += ` L${x} ${n1(gy - hgt * Math.exp(-u * u * 2))}`; }
  prof += ` L${gx1} ${gy}Z`;
  const tgt = { x: tx, y: gy - hgt };
  const ang = S.angle * Math.PI / 180;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const dist = lerp(36, Math.min(tx - gx0 + 4, (tgt.y - 8) / Math.max(s, 0.2)), clamp((S.distance - 1.15) / (6.5 - 1.15) * 1.6));
  const c2 = { x: tgt.x - dist * c, y: tgt.y - dist * s };
  const ar = 20;
  const side = `<path d="M${gx0} ${gy}H${gx1}" stroke-width="1" opacity=".4"/><path d="${prof}" stroke-width="1.3" fill="currentColor" fill-opacity=".08"/>`
    + `<path d="M${n1(tgt.x - ar - 8)} ${n1(tgt.y)}H${n1(tgt.x)}" stroke-width=".8" opacity=".45"/>`
    + `<path d="M${n1(tgt.x - ar)} ${n1(tgt.y)}A${ar} ${ar} 0 0 1 ${n1(tgt.x - ar * c)} ${n1(tgt.y - ar * s)}" stroke-width="1.6"/>`
    + `<path d="M${n1(c2.x)} ${n1(c2.y)}L${n1(tgt.x)} ${n1(tgt.y)}" stroke-width="1" stroke-dasharray="2.5 2.5" opacity=".75"/>`
    + `<text x="${n1(tgt.x - (ar + 5) * Math.cos(ang / 2))}" y="${n1(tgt.y - (ar + 5) * Math.sin(ang / 2) + 3.5)}" text-anchor="end" font-size="9.5" font-weight="500" fill="currentColor" stroke="none">${Math.round(S.angle)}°</text>`
    + `<circle cx="${n1(tgt.x)}" cy="${n1(tgt.y)}" r="2.2" fill="currentColor" stroke="none"/>`
    + `<text x="${n1((c2.x + tgt.x) / 2 + 9 * s)}" y="${n1((c2.y + tgt.y) / 2 - 9 * c)}" font-size="9.5" fill="currentColor" stroke="none" opacity=".7">${S.distance.toFixed(2)}</text>`
    + `<g transform="translate(${n1(c2.x)} ${n1(c2.y)}) rotate(${n1(S.angle)})"><rect x="-8" y="-4.5" width="10" height="9" rx="2" fill="currentColor" stroke="var(--paper)" stroke-width="1.2"/><path d="M2 -1.5 6.5 -4.2V4.2L2 1.5z" fill="currentColor" stroke="none"/></g>`;
  return `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" font-family="-apple-system,Inter,sans-serif">${top}<path d="M116 10V${H - 10}" stroke-width=".5" opacity=".35"/>${side}</g>`;
}

// ---------------------------------------------------------------- export pictures

/**
 * The camera path from above, north up: the camera's poses over the clip (azimuth 0 sits south of the
 * terrain), with the camera at time T (0..1). Drawn centred in a W×H box.
 */
export function pathArt(poses: readonly { azimuth: number; radius: number }[], W: number, H: number, T: number): string {
  const cx = W / 2;
  const cy = H / 2;
  const maxR = Math.max(...poses.map((p) => p.radius), 0.001);
  const k = (H / 2 - 12) / maxR;
  const at = (p: { azimuth: number; radius: number }) => {
    const a = p.azimuth * Math.PI / 180;
    return [cx + Math.sin(a) * p.radius * k, cy + Math.cos(a) * p.radius * k] as const;
  };
  let rings = '';
  [0.14, 0.26, 0.38].forEach((f) => { rings += `<path d="${ringPath(cx, cy, f * H, 0.8, 1.2, 1)}" stroke-width=".9" opacity=".45"/>`; });
  const ring = `<circle cx="${cx}" cy="${cy}" r="${n1(poses[0].radius * k)}" stroke-width=".8" stroke-dasharray="2 3" opacity=".35"/>`;
  const d = poses.map((p, i) => { const [x, y] = at(p); return `${i ? 'L' : 'M'}${n1(x)} ${n1(y)}`; }).join('');
  const f = clamp(T) * (poses.length - 1);
  const i = Math.min(poses.length - 2, Math.floor(f));
  const [ax, ay] = at(poses[Math.max(0, i)]);
  const [bx, by] = at(poses[Math.min(poses.length - 1, i + 1)]);
  const u = f - i;
  const [sx, sy] = at(poses[0]);
  const north = `<path d="M${cx} 5V11" stroke-width="1.2" opacity=".6"/>`;
  return `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${rings}${ring}${north}<path d="${d}" stroke-width="1.8" opacity=".9"/><circle cx="${n1(sx)}" cy="${n1(sy)}" r="2.2" fill="var(--paper)" stroke-width="1.2"/><path d="M${n1(lerp(ax, bx, u))} ${n1(lerp(ay, by, u))}L${n1(cx)} ${n1(cy)}" stroke-width="1" stroke-dasharray="2.5 2.5" opacity=".6"/><circle cx="${n1(lerp(ax, bx, u))}" cy="${n1(lerp(ay, by, u))}" r="4" fill="currentColor" stroke="var(--paper)" stroke-width="1.5"/></g>`;
}

/** A 4 second ruler with frame ticks and a playhead at T (0..1). */
export function timelineArt(W: number, H: number, T: number, seconds = 4, fps = 24): string {
  let s = '';
  const frames = seconds * fps;
  for (let f = 0; f <= frames; f++) {
    const x = n1(10 + (W - 20) * f / frames);
    const sec = f % fps === 0;
    s += `<path d="M${x} ${sec ? H - 22 : H - 16}V${H - 10}" stroke-width="${sec ? 1.2 : 0.8}" opacity="${sec ? 0.7 : 0.3}"/>`;
    if (sec) s += `<text x="${x}" y="13" text-anchor="${f === 0 ? 'start' : f === frames ? 'end' : 'middle'}" font-size="9.5" fill="currentColor" stroke="none" opacity=".6" font-family="-apple-system,Inter,sans-serif">${f / fps} s</text>`;
  }
  const px = n1(10 + (W - 20) * clamp(T));
  return `<g stroke="currentColor">${s}<path d="M${px} 4V${H - 4}" stroke-width="2" stroke-linecap="round"/></g>`;
}
