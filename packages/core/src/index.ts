export { createTopographicBackground, type TopographicBackground, type RendererOptions, type SnapshotOptions, type RendererStatus } from './renderer.js';
export { PARAMS, GROUPS, paramsIn, clampParam, type ParamDef, type GroupName, type GroupValues } from './params.js';
export { STYLES, DEFAULT_STYLE, findStyle, type Style, type StyleId } from './styles.js';
export { PRESETS, type Preset } from './presets.js';
export {
  defaultSettings, resolveSettings, mergeSettings, toUniforms, fromAttributes, toAttributes, toQuery, fromQuery,
  meshResolution, CAMERA_MOTIONS, DEFAULT_CAMERA, DEFAULT_DETAIL, DEFAULT_ELEVATION,
  type Settings, type SettingsInput, type ThemeSettings, type ThemeMode,
  type RenderMode, type TerrainExtent, type CameraMotion, type CameraSettings,
} from './settings.js';
export { parseColor, resolveTheme, resolveMode, rgbaToCss, THEME_DEFAULTS, type RGBA, type ResolvedTheme } from './theme.js';
export { TOPOGRAPHIC_FRAGMENT } from './shader/topographic.glsl.js';
