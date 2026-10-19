import { GROUPS, PARAMS, STYLES } from 'topographic';
import { AGENT_NAMES, PURPOSES } from './actor';

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
    mode: { type: 'string', enum: ['2d', '3d'], description: '2d is the map. 3d is the same map as a terrain. 2d is the default.' },
    elevation: { type: 'number', minimum: 0, maximum: 1, description: '3D height. 0 is flat like the map; higher values make the terrain taller, with a rounded crest.' },
    extent: { type: 'string', enum: ['block', 'endless'], description: 'block is a finite tabletop with cut sides. endless continues past the view. The playground defaults to endless.' },
    detail: { type: 'number', minimum: 0, maximum: 1, description: '3D mesh resolution. 0 is coarsest, 1 is finest.' },
    quality: { type: 'string', enum: ['auto', 'low', 'medium', 'high'], description: 'Graphics budget. auto follows the device and steps down if frames miss 60 Hz, or 120 Hz when that refresh is seen. low, medium and high stay put.' },
    camera: {
      type: 'object', additionalProperties: false,
      properties: {
        azimuth: { type: 'number', description: 'Degrees around the terrain. Any finite number.' },
        elevation: { type: 'number', minimum: 2, maximum: 80, description: 'Degrees above the horizon. Never below the terrain.' },
        radius: { type: 'number', minimum: 0.4, maximum: 6.5, description: 'Distance from the terrain centre.' },
        motion: { type: 'string', enum: ['still', 'orbit', 'push', 'flyover', 'drone'], description: 'How the camera moves. still holds the pose.' },
        panX: { type: 'number', minimum: -6, maximum: 6, description: 'Moves the point the camera looks at east across the ground. 0 is the terrain centre; kept over the terrain.' },
        panZ: { type: 'number', minimum: -6, maximum: 6, description: 'Moves the point the camera looks at south across the ground. 0 is the terrain centre; kept over the terrain.' },
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

/** What each purpose means, for agents choosing one. */
const PURPOSE_HELP = 'testing: developing or checking this site. demo: recording a demo, video or screenshots of topographic. creating: making a background, image, video or 3D view for someone. exploring: trying styles, places and settings. integrating: getting code to embed in a site or app. research: evaluating or comparing tools. reverse-engineering: studying how the playground or the library is built. other: anything else.';

export const TOOL_DEFS: ToolDef[] = [
  { name: 'identify_agent', title: 'Identify agent', readOnly: false,
    description: "Optional. Tells this site an AI agent is using it, so agent use is counted apart from people. Send only non-personal metadata: your agent's name and a purpose category, both from fixed lists. Do not include anything about the person you work for. Everything is stored as anonymous analytics. Call it once, before other tools; the playground works the same either way.",
    inputSchema: { type: 'object', additionalProperties: false, required: ['name', 'purpose'], properties: {
      name: { type: 'string', enum: AGENT_NAMES, description: 'Your agent or harness. chatgpt covers ChatGPT and Codex. Use other when yours is not listed.' },
      purpose: { type: 'string', enum: PURPOSES, description: PURPOSE_HELP },
    } } },
  { name: 'list_styles', title: 'List styles', readOnly: true,
    description: 'Lists the terrain styles and the presets, with ids, names and descriptions.',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'get_settings', title: 'Get settings', readOnly: true,
    description: 'Returns the current settings: the full resolved object, the minimal config JSON (only non-default values), and the graphics tier actually drawing (quality, fps, frameMs, mesh).',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'set_settings', title: 'Set settings', readOnly: false,
    description: 'Changes the background. Takes a partial settings object; values are merged into the current settings, clamped to their ranges, and applied live. Returns the resulting config and any adjustments made.',
    inputSchema: SETTINGS_SCHEMA },
  { name: 'randomize', title: 'Randomize', readOnly: false,
    description: 'Picks a new random seed. With style: true, also picks a random style.',
    inputSchema: { type: 'object', properties: { style: { type: 'boolean', description: 'Also randomize the style.' } } } },
  { name: 'take_screenshot', title: 'Take screenshot', readOnly: true,
    description: 'Renders the current background to a PNG and returns it as a data URL. Defaults to 1200 px wide at the screen aspect ratio. With region, only that slice of the current view, at full detail (for example a phone-shaped strip).',
    inputSchema: { type: 'object', properties: {
      width: { type: 'integer', minimum: 16, maximum: 4096 }, height: { type: 'integer', minimum: 16, maximum: 4096 },
      region: { type: 'object', additionalProperties: false, description: 'Part of the view, in fractions 0..1 from its top-left corner. Width or height alone keeps the region\'s shape.',
        properties: { x: { type: 'number', minimum: 0, maximum: 1 }, y: { type: 'number', minimum: 0, maximum: 1 }, width: { type: 'number', minimum: 0, maximum: 1 }, height: { type: 'number', minimum: 0, maximum: 1 } },
        required: ['x', 'y', 'width', 'height'] } } } },
  { name: 'record_video', title: 'Record video', readOnly: true,
    description: 'Renders a short 3D clip of the current terrain with a moving camera. Returns an MP4 or WebM data URL. Defaults to a 2 second orbit at 640×360.',
    inputSchema: { type: 'object', properties: {
      format: { type: 'string', enum: ['mp4', 'webm'] },
      motion: { type: 'string', enum: ['still', 'orbit', 'push', 'flyover', 'drone'] },
      seconds: { type: 'number', minimum: 0.5, maximum: 8 },
      width: { type: 'integer', minimum: 160, maximum: 1280 },
      height: { type: 'integer', minimum: 160, maximum: 720 },
    } } },
  { name: 'get_embed_code', title: 'Get embed code', readOnly: true,
    description: 'Returns code that reproduces the current background: html (web component), react, vanilla (JS) or json (config).',
    inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['html', 'react', 'vanilla', 'json'] } }, required: ['format'] } },
  { name: 'get_install_instructions', title: 'Get install instructions', readOnly: true,
    description: 'Returns install and setup instructions for npm, the web component, React or vanilla JS.',
    inputSchema: { type: 'object', properties: { target: { type: 'string', enum: ['npm', 'web-component', 'react', 'vanilla'] } } } },
];
