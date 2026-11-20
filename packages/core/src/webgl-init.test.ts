/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTopography } from './renderer.js';
import { createTerrainPass } from './terrain3d.js';

afterEach(() => { vi.restoreAllMocks(); });

function fakeGL(opts: { program: object | null; linked: boolean }): { calls: string[]; gl: object } {
  const calls: string[] = [];
  const known: Record<string, unknown> = {
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    COMPILE_STATUS: 0x8B81,
    LINK_STATUS: 0x8B82,
    isContextLost: () => false,
    createShader: () => ({}),
    shaderSource() {},
    compileShader() {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => '',
    deleteShader() {},
    createProgram: () => opts.program,
    attachShader(program: unknown) {
      calls.push('attachShader');
      if (!program) throw new TypeError('attachShader called with a null program');
    },
    bindAttribLocation() { calls.push('bindAttribLocation'); },
    linkProgram() { calls.push('linkProgram'); },
    getProgramParameter: () => opts.linked,
    getProgramInfoLog: () => 'link failed',
    deleteProgram() { calls.push('deleteProgram'); },
    useProgram() { calls.push('useProgram'); },
    getExtension: () => null,
  };
  const gl = new Proxy(known, {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol' || prop in target) return Reflect.get(target, prop, receiver);
      throw new Error(`unexpected gl.${String(prop)}`);
    },
  });
  return { calls, gl };
}

function withGL(gl: object, run: () => void): void {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
    if (String(type).startsWith('webgl')) return gl as WebGL2RenderingContext;
    return orig.apply(this, [type, ...args] as unknown as Parameters<typeof orig>);
  } as typeof HTMLCanvasElement.prototype.getContext;
  try { run(); }
  finally { HTMLCanvasElement.prototype.getContext = orig; }
}

describe('update when scenes is missing', () => {
  it('accepts update({ scene }) without throwing', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const host = document.createElement('div');
    document.body.append(host);
    const topo = createTopography(host);
    delete (topo.settings as { scenes?: unknown }).scenes;
    expect(() => topo.update({ scene: 2 })).not.toThrow();
    expect(topo.settings.scenes).toEqual([]);
    expect(topo.settings.scene).toBe(0);
    topo.destroy();
    host.remove();
  });
});

describe('webgl program setup', () => {
  it('falls back when createProgram returns null', () => {
    const { calls, gl } = fakeGL({ program: null, linked: false });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const host = document.createElement('div');
    document.body.append(host);
    let status = '';
    withGL(gl, () => {
      const topo = createTopography(host);
      status = topo.status;
      topo.destroy();
    });
    expect(status).toBe('fallback');
    expect(calls).not.toContain('attachShader');
    expect(warn.mock.calls.some((c) => String(c[0]).includes('WebGL unavailable'))).toBe(true);
    host.remove();
  });

  it('falls back when the program fails to link', () => {
    const { calls, gl } = fakeGL({ program: {}, linked: false });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const host = document.createElement('div');
    document.body.append(host);
    let status = '';
    withGL(gl, () => {
      const topo = createTopography(host);
      status = topo.status;
      topo.destroy();
    });
    expect(status).toBe('fallback');
    expect(calls).toContain('attachShader');
    expect(calls).toContain('linkProgram');
    expect(calls).not.toContain('useProgram');
    expect(error.mock.calls.some((c) => String(c[0]).includes('program link failed'))).toBe(true);
    host.remove();
  });

  it('does not attach 3D shaders when createProgram returns null', () => {
    const { calls, gl } = fakeGL({ program: null, linked: false });
    const pass = createTerrainPass();
    expect(() => pass.draw(gl as WebGL2RenderingContext, true, {} as never)).not.toThrow();
    expect(pass.ok).toBe(false);
    expect(calls).not.toContain('attachShader');
  });

  it('drops a 3D program that fails to link', () => {
    const { calls, gl } = fakeGL({ program: {}, linked: false });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pass = createTerrainPass();
    expect(() => pass.draw(gl as WebGL2RenderingContext, true, {} as never)).not.toThrow();
    expect(pass.ok).toBe(false);
    expect(calls).toContain('attachShader');
    expect(calls).toContain('linkProgram');
    expect(calls).not.toContain('useProgram');
    expect(error.mock.calls.some((c) => String(c[0]).includes('3D program link failed'))).toBe(true);
  });
});
