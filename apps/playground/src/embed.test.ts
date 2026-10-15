import { describe, expect, it } from 'vitest';
import { mergeSettings } from 'topographic';
import { embedCode } from './embed';
import { baseline } from './share-url';

describe('embed code', () => {
  it('states the endless extent the library does not default to, with quoted strings', () => {
    const s = mergeSettings(baseline({ style: 'dunes' }), { mode: '3d' });
    const react = embedCode(s, 'react');
    expect(react).toContain('mode="3d"');
    expect(react).toContain('extent="endless"');
    expect(embedCode(s, 'html')).toContain('extent="endless"');
    expect(JSON.parse(embedCode(s, 'json'))).toMatchObject({ mode: '3d', extent: 'endless' });
  });

  it('states the playground camera, which differs from the library default', () => {
    const s = mergeSettings(baseline({ style: 'dunes' }), { mode: '3d' });
    const camera = { azimuth: 349.7, elevation: 33.6, radius: 1.92 };
    expect(JSON.parse(embedCode(s, 'json'))).toMatchObject({ camera });
    expect(embedCode(s, 'react')).toContain("camera={{ azimuth: 349.7, elevation: 33.6, radius: 1.92 }}");
    expect(embedCode(s, 'html')).toContain('349.7');
  });
});
