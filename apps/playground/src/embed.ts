import { toAttributes, type Settings } from 'topographic';
import { PACKAGE, REACT_PACKAGE } from './content';
import { configOf } from './url';

export type EmbedFormat = 'html' | 'react' | 'vanilla' | 'json';

const literal = (v: unknown): string =>
  JSON.stringify(v, null, 2).replace(/"([a-zA-Z]\w*)":/g, '$1:').replace(/"/g, "'");

export function embedCode(s: Settings, format: EmbedFormat): string {
  const config = configOf(s);
  if (format === 'json') return JSON.stringify(config, null, 2);
  if (format === 'html') {
    const attrs = Object.entries(toAttributes(s)).map(([k, v]) => `  ${k}="${v}"`).join('\n');
    return `<script type="module">import '${PACKAGE}/element';</script>

<topographic-map
${attrs}
  style="position:fixed;inset:0;z-index:-1"
></topographic-map>`;
  }
  if (format === 'vanilla') {
    return `import { createTopography } from '${PACKAGE}';

const topography = createTopography(document.querySelector('#background'), ${literal(config).replace(/\n/g, '\n')});`;
  }
  const { landform, ...rest } = config;
  const props = [`landform="${landform}"`, ...Object.entries(rest).map(([k, v]) => typeof v === 'string' ? `${k}="${v}"` : `${k}={${typeof v === 'object' ? literal(v).replace(/\n\s*/g, ' ') : v}}`)];
  return `import { Topography } from '${REACT_PACKAGE}';

<Topography
  ${props.join('\n  ')}
  style={{ position: 'fixed', inset: 0, zIndex: -1 }}
/>`;
}
