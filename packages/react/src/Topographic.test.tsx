import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Topographic } from './Topographic.js';

describe('<Topographic> on the server', () => {
  it('renders a plain div without touching WebGL', () => {
    const html = renderToString(<Topographic styleName="dunes" className="hero" style={{ height: 200 }} lines={{ count: 20 }} />);
    expect(html).toBe('<div class="hero" style="position:relative;height:200px"></div>');
  });
  it('renders children in an overlay', () => {
    expect(renderToString(<Topographic><h1>Hi</h1></Topographic>)).toContain('<h1>Hi</h1>');
  });
});
