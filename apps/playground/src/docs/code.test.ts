import { describe, expect, it } from 'vitest';
import { asProps, codeFor, highlight } from './code';

describe('codeFor', () => {
  it('writes short settings on one line in each language', () => {
    expect(codeFor({ location: 'everest' })).toEqual({
      js: "createTopography(el, { location: 'everest' });",
      react: '<Topography location="everest" />',
      html: '<topographic-view location="everest"></topographic-view>',
    });
  });

  it('writes groups as objects in JavaScript and React, and as attributes on the element', () => {
    const code = codeFor({ shape: 'long-ridge', lines: { count: 46, indexEvery: 5 }, camera: { elevation: 34, motion: 'orbit' } });
    expect(code.js).toBe("createTopography(el, {\n  shape: 'long-ridge',\n  lines: { count: 46, indexEvery: 5 },\n  camera: { elevation: 34, motion: 'orbit' },\n});");
    expect(code.react).toContain('lines={{ count: 46, indexEvery: 5 }}');
    expect(code.html).toContain('line-count="46"');
    expect(code.html).toContain('index-every="5"');
    expect(code.html).toContain('camera-elevation="34"');
    expect(code.html).toContain('camera-motion="orbit"');
  });

  it('rounds numbers to two places', () => {
    expect(codeFor({ seed: 12, elevation: 0.123456 }).js).toBe('createTopography(el, { seed: 12, elevation: 0.12 });');
  });
});

describe('asProps', () => {
  it('keeps the keys asked for, with each group in the library order', () => {
    const props = asProps({ shape: 'granite', seed: 3, lines: { indexEvery: 4, count: 36 }, mode: '3d' }, ['shape', 'lines', 'theme']);
    expect(props).toEqual({ shape: 'granite', lines: { count: 36, indexEvery: 4 } });
    expect(Object.keys(props.lines as object)).toEqual(['count', 'indexEvery']);
  });
});

describe('highlight', () => {
  it('escapes markup and marks strings and tags', () => {
    expect(highlight('<Topography shape="dunes" />')).toBe('<span class="tk-t">&lt;Topography</span> <span class="tk-a">shape</span>=<span class="tk-s">"dunes"</span> <span class="tk-t">/&gt;</span>');
  });
});
