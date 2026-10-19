import { describe, expect, it } from 'vitest';
import { tidy, withMarkers } from './text';

const NB = ' ';

describe('tidy', () => {
  it('joins the last words of a block with no-break spaces', () => {
    expect(tidy('The same settings draw the same land on every screen.')).toBe(`The same settings draw the same land on${NB}every${NB}screen.`);
  });

  it('leaves tags and their attributes alone', () => {
    const out = tidy('Heights come from <a href="https://example.com/a b">Mapzen Terrain Tiles</a> on AWS.');
    expect(out).toContain('<a href="https://example.com/a b">');
    expect(out.endsWith(`Tiles</a>${NB}on${NB}AWS.`)).toBe(true);
  });

  it('counts an entity as one character', () => {
    expect(tidy('Use <code>&lt;topographic-view&gt;</code> anywhere')).toBe(`Use <code>&lt;topographic-view&gt;</code>${NB}anywhere`);
  });
});

describe('withMarkers', () => {
  it('glues a marker to inline code before it', () => {
    expect(withMarkers('through <code>fetchLocation()</code><sup class="fn"></sup>', [5]))
      .toBe('through <span class="nw"><code>fetchLocation()</code><sup class="fn" id="fnref-5"><a href="#fn-5">5</a></sup></span>');
  });

  it('numbers and links each marker, glued to the word before it', () => {
    expect(withMarkers('A word.<sup class="fn"></sup> Another.<sup class="fn"></sup>', [3, 4])).toBe(
      'A <span class="nw">word.<sup class="fn" id="fnref-3"><a href="#fn-3">3</a></sup></span> '
      + '<span class="nw">Another.<sup class="fn" id="fnref-4"><a href="#fn-4">4</a></sup></span>',
    );
  });
});
