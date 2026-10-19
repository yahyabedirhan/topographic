/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ create: [] as unknown[], update: [] as unknown[] }));
vi.mock('topographic', () => ({
  createTopography: (_el: unknown, settings: unknown) => {
    calls.create.push(settings);
    return { update: (patch: unknown) => calls.update.push(patch), destroy: () => {} };
  },
}));

const { Topography } = await import('./Topography.js');

describe('<Topography look>', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    calls.create.length = 0;
    calls.update.length = 0;
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('creates with the look and its overrides, and applies the overrides again on a new look', () => {
    act(() => root.render(<Topography look="rose-pod" lines={{ count: 40 }} />));
    expect(calls.create[0]).toMatchObject({ look: 'rose-pod', lines: { count: 40 } });
    calls.update.length = 0;
    act(() => root.render(<Topography look="sea-dunes" lines={{ count: 40 }} />));
    expect(calls.update).toEqual([expect.objectContaining({ look: 'sea-dunes', lines: { count: 40 } })]);
  });
});
