/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TerrainBoundary } from './boundary';

describe('terrain boundary', () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('shows the recovery line instead of a blank page, and remounts once', () => {
    let broken = true;
    function View() {
      if (broken) throw new Error('render failed');
      return <p>the terrain</p>;
    }
    const prev = console.error;
    console.error = () => {};
    act(() => { root.render(<TerrainBoundary><View /></TerrainBoundary>); });
    console.error = prev;
    expect(host.textContent).toBe('Bringing the terrain back');
    expect(host.querySelector('p')).toBeNull();
    broken = false;
    act(() => { host.querySelector('button')!.click(); });
    expect(host.textContent).toContain('the terrain');
    expect(host.querySelector('.pt-recover')).toBeNull();
  });

  it('stays on the recovery line when the error is still there', () => {
    function View(): never {
      throw new Error('still broken');
    }
    const prev = console.error;
    console.error = () => {};
    act(() => { root.render(<TerrainBoundary><View /></TerrainBoundary>); });
    act(() => { host.querySelector('button')!.click(); });
    console.error = prev;
    expect(host.textContent).toBe('Bringing the terrain back');
    expect(host.querySelector('button.pt-recover[role="status"]')).not.toBeNull();
  });
});
