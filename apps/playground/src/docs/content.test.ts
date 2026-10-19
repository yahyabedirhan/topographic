import { describe, expect, it } from 'vitest';
import { CODE, LOOK_GALLERY, LOOK_NAMES, SECTIONS, lookId } from './content';

describe('docs content', () => {
  it('names only looks the library has, in snippets and in the gallery', () => {
    const ids = new Set(LOOK_NAMES.map(lookId));
    expect(ids.size).toBe(26);
    const used = Object.values(CODE).flatMap((s) => Object.values(s)).join('\n').matchAll(/look[=:]\s*["']([\w-]+)["']/g);
    const named = [...used].map((m) => m[1]);
    expect(named.length).toBeGreaterThan(0);
    for (const id of named) expect(ids.has(id), id).toBe(true);
    for (const l of LOOK_GALLERY) expect(l.shot).toMatch(new RegExp(`^look-${lookId(l.name)}-[23]d$`));
  });

  it('shows no API that ships after 0.6.0', () => {
    const text = JSON.stringify({ CODE, SECTIONS });
    for (const later of ['heightfield()', 'exportHeightmap', 'PRESETS', 'element.topography<', 'map.topography', 'topography.setHeightfield(field)']) expect(text, later).not.toContain(later);
  });
});
