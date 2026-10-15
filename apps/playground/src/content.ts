// Install and usage text shared by the page, the markdown docs, llms.txt and the WebMCP tools.

export const PACKAGE = 'topographic';
export const REACT_PACKAGE = 'topographic-react';

export const INSTALL = {
  npm: `npm install ${PACKAGE}`,
  react: `npm install ${PACKAGE} ${REACT_PACKAGE}`,
  webComponent: `<script type="module">
  import '${PACKAGE}/element';
</script>

<topographic-bg style-name="dunes" line-count="30"></topographic-bg>`,
  reactUsage: `import { TopographicBackground } from '${REACT_PACKAGE}';

export function Hero() {
  return (
    <TopographicBackground styleName="granite" terrain={{ roughness: 0.3 }} style={{ height: '100vh' }}>
      <h1>Hello</h1>
    </TopographicBackground>
  );
}`,
  vanilla: `import { createTopographicBackground } from '${PACKAGE}';

const topographic = createTopographicBackground(document.querySelector('#hero'), {
  style: 'gentle-summit',
  lines: { count: 36, indexEvery: 5 },
  theme: { mode: 'dark' },
});

topographic.update({ terrain: { peaks: 3 } });   // live, clamped
const png = await topographic.snapshot({ width: 1920, height: 1080 });
topographic.destroy();`,
  css: `topographic-bg {
  --topographic-ink: #9fb3c8;      /* line colour */
  --topographic-paper: transparent; /* let the page show through */
}`,
};

export const TAGLINE = 'Animated contour lines, like those on a topographic map, as the background of a web page. One WebGL shader, seven terrain styles, readable settings.';
