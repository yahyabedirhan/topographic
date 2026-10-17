import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { latestUpdates } from './changelog';

describe('latestUpdates', () => {
  it('reads the newest bullets with their version', () => {
    const md = '# Changelog\n\n## 0.2.0\n\n- `quality` setting. More text.\n- See [docs](x).\n\n## 0.1.0\n\n- First.\n- Second.\n';
    expect(latestUpdates(md)).toEqual([
      { version: '0.2.0', summary: 'quality setting.' },
      { version: '0.2.0', summary: 'See docs.' },
      { version: '0.1.0', summary: 'First.' },
    ]);
  });

  it('finds three entries in CHANGELOG.md with no dashes', () => {
    const rows = latestUpdates(readFileSync(`${process.cwd()}/CHANGELOG.md`, 'utf8'));
    expect(rows).toHaveLength(3);
    for (const r of rows) expect(r.summary).not.toMatch(/[\u2013\u2014]/);
  });
});
