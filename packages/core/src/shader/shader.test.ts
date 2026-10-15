import { describe, expect, it } from 'vitest';
import { PARAMS } from '../params.js';
import { STYLES } from '../styles.js';
import { wrapFragment } from './common.glsl.js';
import { terrainFragmentSource, terrainVertexSource } from './terrain.glsl.js';
import { TOPOGRAPHIC_FRAGMENT } from './topographic.glsl.js';

describe('topographic shader source', () => {
  it('declares every uniform the renderer sets', () => {
    for (const u of ['uRes', 'uTime', 'uDark', 'uParams', 'uFade', 'uCol', 'uCenter', 'uStyle', 'uSeed', 'uInk', 'uPaper', 'uHasHeight', 'uHeightAspect', 'uHeightTex'])
      expect(TOPOGRAPHIC_FRAGMENT).toMatch(new RegExp(`uniform \\w+ ${u}\\b`));
  });
  it('reads every numeric param slot', () => {
    for (const p of PARAMS) if (typeof p.slot === 'number') expect(TOPOGRAPHIC_FRAGMENT).toContain(`uParams[${p.slot}]`);
  });
  it('has a branch for every style index', () => {
    for (const s of STYLES) {
      const name = `STYLE_${s.id.toUpperCase().replace(/-/g, '_')}`;
      expect(TOPOGRAPHIC_FRAGMENT).toContain(`#define ${name} ${s.index}\n`);
      expect(TOPOGRAPHIC_FRAGMENT).toContain(`if(s==${name})`);
    }
  });
  it('samples a heightfield from the mesh in 3D and the screen in 2D', () => {
    expect(terrainVertexSource(false)).toContain('attribute float aHeight');
    expect(terrainVertexSource(false)).toContain('uHasHeight');
    expect(terrainFragmentSource(false)).toContain('REGION_FROM_MESH');
    expect(TOPOGRAPHIC_FRAGMENT).toContain('regionSample');
    expect(TOPOGRAPHIC_FRAGMENT).not.toContain('#define REGION_FROM_MESH');
  });
  it('shades the block walls from the same surface height the vertex shader lifts to', () => {
    expect(terrainVertexSource(false)).toContain('surfaceY(p, aHeight)');
    expect(terrainFragmentSource(false)).toContain('surfaceY(vP, regionSample(vUV))');
  });
  it('wraps for both WebGL versions', () => {
    expect(wrapFragment(TOPOGRAPHIC_FRAGMENT, true).startsWith('#version 300 es')).toBe(true);
    expect(wrapFragment(TOPOGRAPHIC_FRAGMENT, false)).toContain('GL_OES_standard_derivatives');
  });
});
