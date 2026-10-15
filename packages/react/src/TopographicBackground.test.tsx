import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TopographicBackground } from './TopographicBackground.js';

describe('<TopographicBackground> on the server', () => {
  it('renders a plain div without touching WebGL', () => {
    const html = renderToString(<TopographicBackground styleName="dunes" className="hero" style={{ height: 200 }} lines={{ count: 20 }} />);
    expect(html).toBe('<div class="hero" style="position:relative;height:200px"></div>');
  });
  it('renders children in an overlay', () => {
    expect(renderToString(<TopographicBackground><h1>Hi</h1></TopographicBackground>)).toContain('<h1>Hi</h1>');
  });
});
