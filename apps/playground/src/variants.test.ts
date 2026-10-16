import { describe, expect, it } from 'vitest';
import { visualVariants } from './variants';

describe('visual variants', () => {
  it('defaults to a and lets one key override the group', () => {
    expect(visualVariants('')).toEqual({ dock: 'a', link: 'a', loading: 'a', og: 'a' });
    expect(visualVariants('?variant=b').dock).toBe('b');
    expect(visualVariants('?variant=b&dock=a')).toEqual({ dock: 'a', link: 'b', loading: 'b', og: 'b' });
    expect(visualVariants('loading=b&og=b').loading).toBe('b');
    expect(visualVariants('loading=b&og=b').link).toBe('a');
  });
});
