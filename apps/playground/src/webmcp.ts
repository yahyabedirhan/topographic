import { LOOKS, mergeSettings, SHAPES, type Settings, type SettingsInput, type Topography } from 'topographic';
import { INSTALL } from './content';
import { embedCode, type EmbedFormat } from './embed';
import { TOOL_DEFS } from './agent-tools';
import { renderPng } from './png';
import { configOf } from './url';
import { AGENT_CHOICES, identifyAgent, trackToolCall } from './analytics';
import { isAgentName, isPurpose } from './actor';

/** Runs a WebMCP tool and sends `agent_tool_called` with its name, whether it worked and how long it took. */
export async function runTracked<T>(tool: string, fn: () => T | Promise<T>): Promise<T> {
  const start = performance.now();
  let ok = false;
  try { const out = await fn(); ok = true; return out; }
  finally { trackToolCall(tool, ok, performance.now() - start); }
}

export interface PageBridge {
  getSettings(): Settings;
  setSettings(s: Settings): void;
  instance(): Topography | null;
}

interface ModelContextLike {
  registerTool(tool: object, options?: { signal?: AbortSignal }): Promise<unknown> | unknown;
}

export function getModelContext(): ModelContextLike | null {
  const mc = (document as unknown as { modelContext?: ModelContextLike }).modelContext
    ?? (navigator as unknown as { modelContext?: ModelContextLike }).modelContext;
  return mc && typeof mc.registerTool === 'function' ? mc : null;
}

const blobToDataUrl = (b: Blob) => new Promise<string>((resolve, reject) => {
  const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(b);
});

const TOP_KEYS = ['look', 'shape', 'seed', 'theme', 'lines', 'terrain', 'motion', 'layout', 'mode', 'elevation', 'extent', 'detail', 'quality', 'camera', 'view2d'];

function adjustments(input: Record<string, unknown>, out: Settings): string[] {
  const notes: string[] = [];
  if (typeof input.look === 'string' && !LOOKS.some((l) => l.id === input.look)) notes.push(`ignored unknown look "${input.look}"`);
  if (typeof input.shape === 'string' && input.shape !== out.shape) notes.push(`unknown shape "${input.shape}", kept "${out.shape}"`);
  if (typeof input.mode === 'string' && input.mode !== out.mode) notes.push(`mode: ${JSON.stringify(input.mode)} adjusted to ${out.mode}`);
  if (typeof input.extent === 'string' && input.extent !== out.extent) notes.push(`extent: ${JSON.stringify(input.extent)} adjusted to ${out.extent}`);
  if (typeof input.elevation === 'number' && input.elevation !== out.elevation) notes.push(`elevation: ${input.elevation} adjusted to ${out.elevation}`);
      if (typeof input.detail === 'number' && input.detail !== out.detail) notes.push(`detail: ${input.detail} adjusted to ${out.detail}`);
  if (typeof input.quality === 'string' && input.quality !== out.quality) notes.push(`quality: ${JSON.stringify(input.quality)} adjusted to ${out.quality}`);
  for (const [g, v] of Object.entries(input)) {
    if (!TOP_KEYS.includes(g)) { notes.push(`ignored unknown key "${g}"`); continue; }
    if (v && typeof v === 'object' && g !== 'theme') {
      const gotGroup = out[g as 'lines'] as Record<string, unknown>;
      for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
        const got = gotGroup[k];
        if (got === undefined) notes.push(`ignored unknown key "${g}.${k}"`);
        else if (got !== n) notes.push(`${g}.${k}: ${JSON.stringify(n)} adjusted to ${JSON.stringify(got)}`);
      }
    }
  }
  return notes;
}

export function registerTools(page: PageBridge): () => void {
  const mc = getModelContext();
  if (!mc) return () => {};
  const controller = new AbortController();

  const run: Record<string, (input: Record<string, unknown>) => unknown> = {
    identify_agent: (input) => {
      if (!isAgentName(input?.name)) throw new Error(`name must be one of: ${AGENT_CHOICES.names.join(', ')}`);
      if (!isPurpose(input?.purpose)) throw new Error(`purpose must be one of: ${AGENT_CHOICES.purposes.join(', ')}`);
      const recorded = identifyAgent({ name: input.name, purpose: input.purpose });
      return {
        name: input.name, purpose: input.purpose, recorded,
        note: recorded ? 'Thank you. Only analytics changed; the playground works the same.' : 'Analytics are off in this browser, so nothing was recorded. The playground works the same.',
      };
    },
    list_shapes: () => ({
      shapes: SHAPES.map(({ id, name, description }) => ({ id, name, description })),
      looks: LOOKS.map(({ id, name, settings }) => ({ id, name, settings })),
    }),
    get_settings: () => {
      const settings = page.getSettings();
      const stats = page.instance()?.stats;
      return {
        settings,
        config: configOf(settings),
        graphics: stats ? { quality: stats.quality, fps: stats.fps, frameMs: stats.frameMs, mesh: stats.mesh } : null,
      };
    },
    set_settings: (input) => {
      if (!input || typeof input !== 'object') throw new Error('expected a settings object');
      // `style` is the name before 0.6.0, accepted for one release.
      const { style, ...rest } = input as Record<string, unknown>;
      const patch = style !== undefined && rest.shape === undefined ? { ...rest, shape: style } : rest;
      const next = mergeSettings(page.getSettings(), patch as SettingsInput);
      page.setSettings(next);
      const renamed = style !== undefined ? ['style is now named shape; use shape'] : [];
      return { config: configOf(next), adjustments: [...renamed, ...adjustments(patch, next)] };
    },
    randomize: (input) => {
      const patch: SettingsInput = { seed: Math.floor(Math.random() * 999999) + 1 };
      if (input?.shape) patch.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)].id;
      const next = mergeSettings(page.getSettings(), patch);
      page.setSettings(next);
      return { config: configOf(next) };
    },
    record_video: async (input) => {
      const t = page.instance();
      if (!t) throw new Error('the background is not ready');
      const format = input?.format === 'webm' ? 'webm' : 'mp4';
      const motion = typeof input?.motion === 'string' ? input.motion : 'orbit';
      const blob = await t.record({
        format,
        motion: motion as Settings['camera']['motion'],
        seconds: Number(input?.seconds) || 2,
        width: Number(input?.width) || 640,
        height: Number(input?.height) || 360,
        fps: 24,
      });
      return { mimeType: blob.type, byteLength: blob.size, dataUrl: await blobToDataUrl(blob) };
    },
    take_screenshot: async (input) => {
      const t = page.instance();
      if (!t) throw new Error('the background is not ready');
      const r = input?.region as { x?: unknown; y?: unknown; width?: unknown; height?: unknown } | undefined;
      const region = r ? { x: Number(r.x ?? 0), y: Number(r.y ?? 0), width: Number(r.width ?? 1), height: Number(r.height ?? 1) } : undefined;
      const blob = await renderPng(t, Number(input?.width) || (input?.height ? 0 : 1200), Number(input?.height) || 0, region);
      const bmp = await createImageBitmap(blob);
      return { width: bmp.width, height: bmp.height, mimeType: 'image/png', dataUrl: await blobToDataUrl(blob) };
    },
    get_embed_code: (input) => {
      const format = String(input?.format ?? 'html') as EmbedFormat;
      if (!['html', 'react', 'vanilla', 'json'].includes(format)) throw new Error('format must be html, react, vanilla or json');
      return { format, code: embedCode(page.getSettings(), format) };
    },
    get_install_instructions: (input) => {
      const all = {
        npm: INSTALL.npm,
        'web-component': `${INSTALL.npm}\n\n${INSTALL.webComponent}`,
        react: `${INSTALL.react}\n\n${INSTALL.reactUsage}`,
        vanilla: `${INSTALL.npm}\n\n${INSTALL.vanilla}`,
      };
      const target = input?.target as keyof typeof all | undefined;
      return target ? { target, instructions: all[target] ?? all.npm } : { ...all, css: INSTALL.css };
    },
  };

  for (const def of TOOL_DEFS) {
    const tool = {
      name: def.name,
      title: def.title,
      description: def.description,
      inputSchema: def.inputSchema,
      annotations: { readOnlyHint: def.readOnly },
      execute: async (input: Record<string, unknown> = {}) => runTracked(def.name, () => run[def.name](input)),
    };
    Promise.resolve(mc.registerTool(tool, { signal: controller.signal }))
      .catch((e) => console.warn(`[topographic] WebMCP could not register ${def.name}:`, e));
  }
  return () => controller.abort();
}
