/** @vitest-environment happy-dom */
import { describe, expect, it } from 'vitest';
import * as core from 'topographic';
import * as react from 'topographic-react';
import 'topographic/element';
import { CODE, LOOK_GALLERY } from './content';

const snippets = Object.values(CODE).flatMap((s) => Object.values(s)).join('\n');

/** The page must show only what the library really exports and does, so these checks read the library itself. */
describe('docs snippets against the library', () => {
  it('import only names the packages export', () => {
    const modules: Record<string, object> = { topographic: core, 'topographic-react': react };
    for (const m of snippets.matchAll(/import \{([^}]+)\} from '([\w/-]+)'/g)) {
      const mod = modules[m[2]];
      // topographic/locations comes with the location setting (pull request 87); check it once this base has it.
      if (!mod) { expect(m[2]).toBe('topographic/locations'); continue; }
      for (const name of m[1].split(',').map((n) => n.trim())) expect(name in mod, `${name} from ${m[2]}`).toBe(true);
    }
  });

  it('call only methods the instance and the element have', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const instance = core.createTopography(host) as unknown as Record<string, unknown>;
    const element = document.createElement('topographic-view') as unknown as Record<string, unknown>;
    for (const m of snippets.matchAll(/(?:\btopography|\.topographic)\.(\w+)/g)) expect(m[1] in instance, `topography.${m[1]}`).toBe(true);
    for (const m of snippets.matchAll(/\bmap\.(\w+)/g)) expect(m[1] in element, `element.${m[1]}`).toBe(true);
    (instance.destroy as () => void)();
  });

  it('name only looks the library has', () => {
    const named = [...snippets.matchAll(/look[=:]\s*["']([\w-]+)["']/g)].map((m) => m[1]);
    expect(named.length).toBeGreaterThan(0);
    for (const id of named) expect(core.findLook(id), id).toBeDefined();
    for (const l of LOOK_GALLERY) expect(core.LOOKS.some((look) => look.name === l.name && l.shot.startsWith(`look-${look.id}-`)), l.shot).toBe(true);
  });
});
