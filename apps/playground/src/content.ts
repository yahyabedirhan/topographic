export const PACKAGE = 'topographic';
export const REACT_PACKAGE = 'topographic-react';

/** Installs the topographic agent skill, for coding agents that read skills. */
export const SKILL_INSTALL = 'npx skills add yahyabedirhan/topographic';

export const INSTALL = {
  npm: `npm install ${PACKAGE}`,
  react: `npm install ${PACKAGE} ${REACT_PACKAGE}`,
  webComponent: `<script type="module">
  import '${PACKAGE}/element';
</script>

<topographic-view shape="dunes" line-count="30"></topographic-view>`,
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
  css: `topographic-view {
  --topographic-ink: #9fb3c8;      /* line colour */
  --topographic-paper: transparent; /* let the page show through */
}`,
};

export const TAGLINE = 'Topographic terrain rendered with WebGL. Generate a land or turn a real place into a topographic terrain.';
