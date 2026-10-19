# Changelog

## 0.6.0 (unreleased)

This release renames the public API.
It is a clean break: the old names are gone, with no deprecated aliases.

- The core function `createTopographicBackground` is now `createTopography`, and its instance type `TopographicBackground` is now `Topography`.
- The web component `<topographic-bg>` is now `<topographic-map>`, and its class `TopographicBackgroundElement` is now `TopographyElement`.
- The React component `TopographicBackground` is now `Topography`, and the hook `useTopographicBackground` is now `useTopography`.
- The React types are now `TopographyProps`, `TopographySettingsProps` and `TopographyRef`. `topographic-react` also exports the core instance type as `TopographyInstance`.
- The land shape setting `style` is now `landform`: in settings, as the element attribute (was `style-name`) and as the React prop (was `styleName`). The React `style` prop is now only React's CSS prop.
- The data exports `STYLES`, `findStyle`, `Style`, `StyleId` and `DEFAULT_STYLE` are now `LANDFORMS`, `findLandform`, `Landform`, `LandformId` and `DEFAULT_LANDFORM`.
- `toQuery` writes the landform as `lf=`. `fromQuery` and the playground still read the old `s=` key, so links made before 0.6.0 keep working.
- Playground: the WebMCP tool `list_styles` is now `list_landforms`, and `randomize` takes `landform: true`. `set_settings` takes `landform`, and still takes the old `style` key for this release.
- Install lines in the READMEs no longer pin a version. Sizing and layering examples moved to the guide.

| Old name | New name |
|---|---|
| `createTopographicBackground` | `createTopography` |
| `TopographicBackground` (core instance type) | `Topography` |
| `<topographic-bg>` | `<topographic-map>` |
| `TopographicBackgroundElement` | `TopographyElement` |
| `TopographicBackground` (React component) | `Topography` |
| `useTopographicBackground` | `useTopography` |
| `TopographicBackgroundProps` | `TopographyProps` |
| `TopographicBackgroundSettingsProps` | `TopographySettingsProps` |
| `TopographicBackgroundRef` | `TopographyRef` |
| `style` setting | `landform` |
| `style-name` attribute | `landform` |
| `styleName` React prop | `landform` |
| `s=` query key | `lf=` (`s=` is still read) |
| `STYLES` | `LANDFORMS` |
| `findStyle` | `findLandform` |
| `Style` | `Landform` |
| `StyleId` | `LandformId` |
| `DEFAULT_STYLE` | `DEFAULT_LANDFORM` |
| WebMCP `list_styles` | `list_landforms` |

## 0.5.0

- `view2d` setting: `{ x, y, zoom }` gives the 2D map its own pan and zoom, from 1 to 8. Attributes `view-x`, `view-y` and `view-zoom`; query keys `vx`, `vy` and `vz`. The React component takes `view2d` as a prop. 3D ignores it, and existing 2D views do not change.
- The 3D camera can come about three times closer: the smallest radius is 0.4, was 1.15.
- New exports: `DEFAULT_VIEW2D`, `RADIUS_MIN`, `RADIUS_MAX`, `ZOOM_MIN` and `ZOOM_MAX`.
- Playground: gestures follow Google Maps and Google Earth. A drag moves the terrain. Scroll and pinch zoom toward the pointer, and a mouse wheel notch zooms an eased 1.5 step. In 3D, Shift, Cmd or Ctrl + drag and a right drag rotate and tilt. On touch, a twist rotates, two fingers up or down tilt, a double tap zooms in and a two finger tap zooms out.

## 0.4.0

- `quality` setting: `auto`, `low`, `medium` or `high`. `auto` starts phones on the low tier, steps down when frames miss 60 Hz or 120 Hz, and caps pixel ratio, canvas size and mesh size per tier. The React component takes `quality` as a prop.
- The frame budget follows the screen's refresh period.
- A drawing buffer of zero size is treated as a lost WebGL context and rebuilt. A drag no longer stalls the renderer until the context is lost.
- Phones ask for the low power GPU.
- `snapshot()` can take a temporary patch and height grid, then restores the view.
- License changed from MIT to Apache 2.0. The packages include LICENSE and NOTICE.
- Homepage is now https://topographic.yahyapak.dev. New package descriptions, keywords and READMEs.
