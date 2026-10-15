import { describe, expect, it } from 'vitest';
import { mergeSettings } from 'topographic';
import { embedCode } from './embed';
import { baseline } from './share-url';

describe('embed code', () => {
  it('leaves out the extent and camera that match the library defaults', () => {
    const s = mergeSettings(baseline({ style: 'dunes' }), { mode: '3d' });
    const react = embedCode(s, 'react');
    expect(react).toContain('mode="3d"');
    expect(react).not.toContain('extent');
    expect(react).not.toContain('camera');
    expect(embedCode(s, 'html')).not.toContain('extent=');
    expect(embedCode(s, 'html')).not.toContain('azimuth');
    expect(JSON.parse(embedCode(s, 'json'))).toEqual({ style: 'dunes', mode: '3d' });
  });

  it('states a block and a camera that differ from the defaults, with quoted strings', () => {
    const s = mergeSettings(baseline({ style: 'dunes' }), { mode: '3d', extent: 'block', camera: { azimuth: 90, panX: 0.2 } });
    expect(embedCode(s, 'react')).toContain('extent="block"');
    expect(embedCode(s, 'react')).toContain('camera={{ azimuth: 90, panX: 0.2 }}');
    expect(embedCode(s, 'html')).toContain('extent="block"');
    expect(embedCode(s, 'html')).toContain('pan-x="0.2"');
    expect(JSON.parse(embedCode(s, 'json'))).toMatchObject({ extent: 'block', camera: { azimuth: 90, panX: 0.2 } });
  });
});
