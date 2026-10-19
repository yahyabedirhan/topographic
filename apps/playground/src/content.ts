export const PACKAGE = 'topographic';
export const REACT_PACKAGE = 'topographic-react';

export const INSTALL = {
  npm: `npm install ${PACKAGE}`,
  react: `npm install ${PACKAGE} ${REACT_PACKAGE}`,
  webComponent: `<script type="module">
  import '${PACKAGE}/element';
</script>

<topographic-map shape="dunes" line-count="30"></topographic-map>`,
  reactUsage: `import { Topography } from '${REACT_PACKAGE}';

export function Hero() {
  return (
    <Topography shape="granite" terrain={{ roughness: 0.3 }} style={{ height: '100vh' }}>
      <h1>Hello</h1>
    </Topography>
  );
}`,
  vanilla: `import { createTopography } from '${PACKAGE}';

const topography = createTopography(document.querySelector('#hero'), {
  shape: 'gentle-summit',
  lines: { count: 36, indexEvery: 5 },
  theme: { mode: 'dark' },
});

topography.update({ terrain: { peaks: 3 } });   // live, clamped
const png = await topographic.snapshot({ width: 1920, height: 1080 });
topography.destroy();`,
  css: `topographic-map {
  --topographic-ink: #9fb3c8;      /* line colour */
  --topographic-paper: transparent; /* let the page show through */
}`,
};

export const TAGLINE = 'Animated contour lines, like those on a topographic map, as the background of a web page. One WebGL shader, seven terrain styles, readable settings.';
