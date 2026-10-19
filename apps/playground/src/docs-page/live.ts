// Live views for the docs page. A long page of figures must not hold a WebGL context per figure: browsers allow
// about 16, and each one costs memory. A view mounts when its element comes near the viewport and is destroyed when
// it leaves, keeping its settings and heights so it comes back as it was. Pictures that do not move are drawn
// once as stills, one at a time, by one short-lived view.
import { createTopography, resolveSettings, type Heightfield, type Pose, type Settings, type SettingsInput, type SnapshotOptions, type Topography } from 'topographic';

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => Boolean(v) && typeof v === 'object' && !Array.isArray(v) && !ArrayBuffer.isView(v);

/** A deep merge of settings: groups merge key by key, and every other value in `b` replaces the one in `a`. */
export function merge<T extends object>(a: T, b: object | undefined): T {
  const out: Obj = { ...(a as Obj) };
  for (const [k, v] of Object.entries(b ?? {})) out[k] = isObj(v) && isObj(out[k]) ? merge(out[k] as Obj, v) : v;
  return out as T;
}

/**
 * The library's dark default ink at 0.4 opacity is made to sit quietly behind text. Figures on a docs page are the
 * subject, so they get a brighter ink and stronger lines unless the section sets its own.
 */
export function vivid(s: SettingsInput): SettingsInput {
  const theme = s.theme ?? {};
  const dark = theme.mode !== 'light';
  return {
    ...s,
    lines: { opacity: dark ? 0.72 : 0.6, ...s.lines },
    theme: { ...theme, ...(dark && !theme.ink ? { ink: '#9fb0cc' } : {}) },
  };
}

/** Full settings for update(): the given settings on top of the defaults, so nothing stays from the last ones. */
export function fullSettings(s: SettingsInput): SettingsInput {
  const full = resolveSettings(s);
  return { ...full, theme: { ink: undefined, paper: undefined, ...full.theme } };
}

export interface LiveView {
  readonly settings: SettingsInput;
  /** Where the 3D camera is now, or null while the view is not mounted. */
  readonly pose: Pose | null;
  update(patch: SettingsInput): void;
  setHeightfield(field: Heightfield | null): void;
  /** A PNG of the view; mounts it first when it is away from the viewport. */
  snapshot(opts: SnapshotOptions): Promise<Blob | null>;
  destroy(): void;
}

interface Entry {
  el: HTMLElement;
  settings: SettingsInput;
  field: Heightfield | null;
  t: Topography | null;
  mount(): void;
  unmount(): void;
}

const entries = new Set<Entry>();
const io = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((list) => {
  for (const e of list) {
    const entry = [...entries].find((x) => x.el === e.target);
    if (!entry) continue;
    if (e.isIntersecting) entry.mount();
    else entry.unmount();
  }
}, { rootMargin: '700px 0px' });

/** How many live views hold a WebGL context right now. */
export const liveCount = () => [...entries].filter((e) => e.t).length;

/** A live view of `settings` in `el`, which holds a WebGL context only while it is within 700 px of the viewport. */
export function lazyLive(el: HTMLElement, settings: SettingsInput, { field = null }: { field?: Heightfield | null } = {}): LiveView {
  const entry: Entry = {
    el, settings, field, t: null,
    mount() {
      if (entry.t) return;
      entry.t = createTopography(el, entry.settings, { maxPixelRatio: 2 });
      if (entry.field) entry.t.setHeightfield(entry.field);
    },
    unmount() {
      entry.t?.destroy();
      entry.t = null;
    },
  };
  entries.add(entry);
  if (io) io.observe(el);
  else entry.mount();
  return {
    get settings() { return entry.settings; },
    get pose() { return entry.t?.pose ?? null; },
    update(patch) {
      entry.settings = merge(entry.settings, patch);
      entry.t?.update(patch);
    },
    setHeightfield(f) {
      entry.field = f;
      entry.t?.setHeightfield(f);
    },
    async snapshot(opts) {
      entry.mount();
      return entry.t ? entry.t.snapshot(opts) : null;
    },
    destroy() {
      io?.unobserve(el);
      entry.unmount();
      entries.delete(entry);
    },
  };
}

export interface StillItem extends SettingsInput { field?: Heightfield | null }

let queue: Promise<unknown> = Promise.resolve();

/**
 * Draws each settings object to a PNG with one temporary view, then frees its WebGL context. Calls wait for each
 * other, so the page never holds more than one extra context for stills. Returns object URLs, null for a failure.
 */
export function stills(list: StillItem[], { width = 640, height = 400, frame = 4000 } = {}): Promise<(string | null)[]> {
  const job = queue.then(async () => {
    const host = document.createElement('div');
    host.style.cssText = `position:fixed;left:-${width + 50}px;top:0;width:${width}px;height:${height}px;pointer-events:none`;
    document.body.append(host);
    const t = createTopography(host, { motion: { speed: 0 } }, { maxPixelRatio: 1 });
    const urls: (string | null)[] = [];
    try {
      for (const { field, ...item } of list) {
        const full: Settings = resolveSettings(item);
        try {
          const blob = await t.snapshot({ width, height, frame, patch: { ...full, theme: { ink: undefined, paper: undefined, ...full.theme } }, ...(field !== undefined ? { field } : {}) });
          urls.push(URL.createObjectURL(blob));
        } catch {
          urls.push(null);
        }
      }
    } finally {
      t.destroy();
      host.remove();
    }
    return urls;
  });
  queue = job.catch(() => {});
  return job;
}

/** A made-up volcano as a heightfield, to show setHeightfield without a network call. */
export function volcano(size = 128): Heightfield {
  const samples = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1) - 0.5;
      const v = y / (size - 1) - 0.5;
      const r = Math.hypot(u * 1.15, v);
      const cone = Math.max(0, 1 - r * 2.3) ** 1.6;
      const crater = Math.exp(-((r / 0.05) ** 2)) * 0.18;
      const ridges = 0.035 * Math.sin(Math.atan2(v, u) * 9 + r * 18) * Math.max(0, 1 - r * 2.2);
      const lake = Math.exp(-(((u - 0.28) / 0.07) ** 2 + ((v + 0.22) / 0.05) ** 2)) * 0.05;
      samples[y * size + x] = Math.min(1, Math.max(0, 0.04 + cone * 0.92 - crater + ridges - lake));
    }
  }
  return { samples, size, aspect: 1.25 };
}
