import { describe, expect, it } from 'vitest';
import { mergeSettings, resolveSettings } from 'topographic';
import { embedCode } from './embed';

describe('embed code', () => {
  it('leaves out the extent and camera that match the library defaults', () => {
    const s = mergeSettings(resolveSettings({ shape: 'dunes' }), { mode: '3d' });
    const react = embedCode(s, 'react');
    expect(react).toContain('mode="3d"');
    expect(react).not.toContain('extent');
    expect(react).not.toContain('camera');
    expect(embedCode(s, 'html')).not.toContain('extent=');
    expect(embedCode(s, 'html')).not.toContain('azimuth');
    expect(JSON.parse(embedCode(s, 'json'))).toEqual({ shape: 'dunes', mode: '3d' });
  });

  it('leaves out the playground\'s own detail and budget, and states any other', () => {
    const high = mergeSettings(resolveSettings({ shape: 'dunes' }), { detail: 1, quality: 'high' });
    expect(JSON.parse(embedCode(high, 'json'))).toEqual({ shape: 'dunes' });
    const medium = mergeSettings(high, { detail: 0.5, quality: 'medium' });
    expect(JSON.parse(embedCode(medium, 'json'))).toEqual({ shape: 'dunes', quality: 'medium' });
  });

  it('states a block and a camera that differ from the defaults, with quoted strings', () => {
    const s = mergeSettings(resolveSettings({ shape: 'dunes' }), { mode: '3d', extent: 'block', camera: { azimuth: 90, panX: 0.2 } });
    expect(embedCode(s, 'react')).toContain('extent="block"');
    expect(embedCode(s, 'react')).toContain('camera={{ azimuth: 90, panX: 0.2 }}');
    expect(embedCode(s, 'html')).toContain('extent="block"');
    expect(embedCode(s, 'html')).toContain('pan-x="0.2"');
    expect(JSON.parse(embedCode(s, 'json'))).toMatchObject({ extent: 'block', camera: { azimuth: 90, panX: 0.2 } });
  });
});
