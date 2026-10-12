// Registers the page's WebMCP tools (https://github.com/webmachinelearning/webmcp).
// Uses document.modelContext, with the older navigator.modelContext as a fallback, and does
// nothing when neither exists. Tools are removed by aborting the registration signal.
import { mergeSettings, PRESETS, STYLES, type Settings, type SettingsInput, type Topography } from '@yahyabedirhan/topography';
import { INSTALL } from './content';
import { embedCode, type EmbedFormat } from './embed';
import { TOOL_DEFS } from './agent-tools';
import { renderPng } from './png';
import { configOf } from './url';

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

/** Lists which numbers were clamped or which keys were ignored, so the agent knows what happened. */
function adjustments(input: Record<string, unknown>, out: Settings): string[] {
  const notes: string[] = [];
  if (typeof input.style === 'string' && input.style !== out.style) notes.push(`unknown style "${input.style}", kept "${out.style}"`);
  for (const [g, v] of Object.entries(input)) {
    if (!['style', 'seed', 'theme', 'lines', 'terrain', 'motion', 'layout'].includes(g)) { notes.push(`ignored unknown key "${g}"`); continue; }
    if (v && typeof v === 'object' && g !== 'theme') {
      for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
        const got = (out[g as 'lines'] as Record<string, number>)[k];
        if (got === undefined) notes.push(`ignored unknown key "${g}.${k}"`);
        else if (got !== n) notes.push(`${g}.${k}: ${JSON.stringify(n)} adjusted to ${got}`);
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
    list_styles: () => ({
      styles: STYLES.map(({ id, name, description }) => ({ id, name, description })),
      presets: PRESETS.map((p) => ({ name: p.name, settings: p.settings })),
    }),
    get_settings: () => ({ settings: page.getSettings(), config: configOf(page.getSettings()) }),
    set_settings: (input) => {
      if (!input || typeof input !== 'object') throw new Error('expected a settings object');
      const next = mergeSettings(page.getSettings(), input as SettingsInput);
      page.setSettings(next);
      return { config: configOf(next), adjustments: adjustments(input, next) };
    },
    randomize: (input) => {
      const patch: SettingsInput = { seed: Math.floor(Math.random() * 999999) + 1 };
      if (input?.style) patch.style = STYLES[Math.floor(Math.random() * STYLES.length)].id;
      const next = mergeSettings(page.getSettings(), patch);
      page.setSettings(next);
      return { config: configOf(next) };
    },
    take_screenshot: async (input) => {
      const t = page.instance();
      if (!t) throw new Error('the background is not ready');
      const blob = await renderPng(t, Number(input?.width) || (input?.height ? 0 : 1200), Number(input?.height) || 0);
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
      execute: async (input: Record<string, unknown> = {}) => run[def.name](input),
    };
    Promise.resolve(mc.registerTool(tool, { signal: controller.signal }))
      .catch((e) => console.warn(`[topography] WebMCP could not register ${def.name}:`, e));
  }
  return () => controller.abort();
}
