/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveSettings, type Settings, type Topography } from 'topographic';
import { pageBridge, registerTools } from './webmcp';

type Tool = { name: string; execute(input?: Record<string, unknown>): Promise<unknown> };

function stubModelContext(): Record<string, Tool> {
  const tools: Record<string, Tool> = {};
  (document as unknown as { modelContext: unknown }).modelContext = { registerTool: (t: Tool) => { tools[t.name] = t; } };
  return tools;
}

afterEach(() => { delete (document as unknown as { modelContext?: unknown }).modelContext; });

describe('WebMCP settings tools', () => {
  it('get_settings reads a set_settings change at once, before React renders it', async () => {
    const tools = stubModelContext();
    const state = { current: resolveSettings({ shape: 'granite', mode: '3d' }) };
    const rendered: Settings[] = [];
    const update = vi.fn();
    const stop = registerTools(pageBridge(state, (s) => rendered.push(s), () => ({ update } as unknown as Topography)));

    await tools.set_settings.execute({ camera: { azimuth: 120 } });
    await tools.set_settings.execute({ camera: { azimuth: 200, radius: 2.5 } });
    const got = await tools.get_settings.execute({}) as { settings: Settings };

    expect(got.settings.camera).toMatchObject({ azimuth: 200, radius: 2.5 });
    expect(update).toHaveBeenLastCalledWith(got.settings);
    expect(rendered.at(-1)).toBe(got.settings);
    stop();
  });

  it('randomize also lands before it returns', async () => {
    const tools = stubModelContext();
    const state = { current: resolveSettings({ shape: 'granite' }) };
    const stop = registerTools(pageBridge(state, () => {}, () => null));
    const out = await tools.randomize.execute({}) as { config: { seed: number } };
    const got = await tools.get_settings.execute({}) as { settings: Settings };
    expect(got.settings.seed).toBe(out.config.seed);
    stop();
  });
});
