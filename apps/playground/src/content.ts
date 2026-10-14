export const PACKAGE = 'topography.js';
export const REACT_PACKAGE = 'topography-react';

export const INSTALL = {
  npm: `npm install ${PACKAGE}`,
  react: `npm install ${PACKAGE} ${REACT_PACKAGE}`,
  webComponent: `<script type="module">
  import '${PACKAGE}/element';
</script>

<topography-bg style-name="dunes" line-count="30"></topography-bg>`,
  reactUsage: `import { Topography } from '${REACT_PACKAGE}';

export function Hero() {
  return (
    <Topography styleName="granite" terrain={{ roughness: 0.3 }} style={{ height: '100vh' }}>
      <h1>Hello</h1>
    </Topography>
  );
}`,
  vanilla: `import { createTopography } from '${PACKAGE}';

const topography = createTopography(document.querySelector('#hero'), {
  style: 'gentle-summit',
  lines: { count: 36, indexEvery: 5 },
  theme: { mode: 'dark' },
});

topography.update({ terrain: { peaks: 3 } });   // live, clamped
const png = await topography.snapshot({ width: 1920, height: 1080 });
topography.destroy();`,
  css: `topography-bg {
  --topography-ink: #9fb3c8;      /* line colour */
  --topography-paper: transparent; /* let the page show through */
}`,
};

export const TAGLINE = 'Animated contour lines, like those on a topographic map, as the background of a web page. One WebGL shader, seven terrain styles, readable settings.';
