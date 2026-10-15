// WebMCP tool definitions as plain data (names, descriptions, input schemas). webmcp.ts binds them
// to the page; docs.ts documents them in llms.txt. Schemas are generated from the params table.
import { GROUPS, PARAMS, STYLES } from 'topographic';

const groupSchema = (g: string) => ({
  type: 'object',
  additionalProperties: false,
  properties: Object.fromEntries(PARAMS.filter((p) => p.group === g).map((p) => [p.key, {
    type: 'integer' in p ? 'integer' : 'number', minimum: p.min, maximum: p.max, description: p.description,
  }])),
});

export const SETTINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    style: { type: 'string', enum: STYLES.map((s) => s.id), description: 'Terrain style.' },
    seed: { type: 'integer', minimum: 0, maximum: 999999, description: 'Same seed, same terrain. 0 is the original look.' },
    ...Object.fromEntries(GROUPS.map((g) => [g, groupSchema(g)])),
    theme: {
      type: 'object', additionalProperties: false,
      properties: {
        mode: { type: 'string', enum: ['auto', 'light', 'dark'] },
        ink: { type: 'string', description: 'CSS colour of the lines.' },
        paper: { type: 'string', description: "CSS colour of the background, or 'transparent'." },
      },
    },
  },
} as const;

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  readOnly: boolean;
}

export const TOOL_DEFS: ToolDef[] = [
  { name: 'list_styles', title: 'List styles', readOnly: true,
    description: 'Lists the terrain styles and the presets, with ids, names and descriptions.',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'get_settings', title: 'Get settings', readOnly: true,
    description: 'Returns the current settings: the full resolved object and the minimal config JSON (only non-default values).',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'set_settings', title: 'Set settings', readOnly: false,
    description: 'Changes the background. Takes a partial settings object; values are merged into the current settings, clamped to their ranges, and applied live. Returns the resulting config and any adjustments made.',
    inputSchema: SETTINGS_SCHEMA },
  { name: 'randomize', title: 'Randomize', readOnly: false,
    description: 'Picks a new random seed. With style: true, also picks a random style.',
    inputSchema: { type: 'object', properties: { style: { type: 'boolean', description: 'Also randomize the style.' } } } },
  { name: 'take_screenshot', title: 'Take screenshot', readOnly: true,
    description: 'Renders the current background to a PNG and returns it as a data URL. Defaults to 1200 px wide at the screen aspect ratio.',
    inputSchema: { type: 'object', properties: {
      width: { type: 'integer', minimum: 16, maximum: 4096 }, height: { type: 'integer', minimum: 16, maximum: 4096 } } } },
  { name: 'get_embed_code', title: 'Get embed code', readOnly: true,
    description: 'Returns code that reproduces the current background: html (web component), react, vanilla (JS) or json (config).',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['html', 'react', 'vanilla', 'json'] } }, required: ['format'] } },
  { name: 'get_install_instructions', title: 'Get install instructions', readOnly: true,
    description: 'Returns install and setup instructions for npm, the web component, React or vanilla JS.',
    inputSchema: { type: 'object', properties: { target: { type: 'string', enum: ['npm', 'web-component', 'react', 'vanilla'] } } } },
];
