# Changelog

## 0.6.0 (unreleased)

This release renames the public API.
It is a clean break: the old names are gone, with no deprecated aliases.

- The core function `createTopographicBackground` is now `createTopography`, and its instance type `TopographicBackground` is now `Topography`.
- The web component `<topographic-bg>` is now `<topographic-view>`, and its class `TopographicBackgroundElement` is now `TopographyElement`.
- The React component `TopographicBackground` is now `Topography`, and the hook `useTopographicBackground` is now `useTopography`.
- The React types are now `TopographyProps`, `TopographySettingsProps` and `TopographyRef`. `topographic-react` also exports the core instance type as `TopographyInstance`.
- The land shape setting `style` is now `shape`: in settings, as the element attribute (was `style-name`) and as the React prop (was `styleName`). The React `style` prop is now only React's CSS prop.
- The data exports `STYLES`, `findStyle`, `Style`, `StyleId` and `DEFAULT_STYLE` are now `SHAPES`, `findShape`, `Shape`, `ShapeId` and `DEFAULT_SHAPE`.
- The query key `s=` stays, and now names the shape. Links made before 0.6.0 keep working.
- Playground: the WebMCP tool `list_styles` is now `list_shapes`, and `randomize` takes `shape: true`. `set_settings` takes `shape`, and still takes the old `style` key for this release. Terrains saved with a `style` key load with that value as `shape`.
- Playground: the Tune › Terrain section with peaks, spread, sharpness and variant is now titled Form.
- Install lines in the READMEs no longer pin a version. Sizing and layering examples moved to the guide.
- New package descriptions and keywords: "Topographic terrain rendered with WebGL. Generate a land or turn a real place into a topographic terrain." The words background and animated-background are gone.
- New READMEs for the project and both packages: real places first, then generated shapes, then 2D and 3D, with each code example beside the picture it draws. Limits have their own section.
- Playground: **Install**, a new button in its own circle at the top right. It shows a preview of the view and its main settings, the agent skill and npm install lines, and this view's code and link with a shortcut to Export.
- Playground: new share images, `og.png` and `og-docs.png`, with a real place, the headline and the code that draws it. The page title and description use the new line.
- Playground: Export no longer shows the hint about tinted values under the code, and the HTML hint says element instead of background.

| Old name | New name |
|---|---|
| `createTopographicBackground` | `createTopography` |
| `TopographicBackground` (core instance type) | `Topography` |
| `<topographic-bg>` | `<topographic-view>` |
| `TopographicBackgroundElement` | `TopographyElement` |
| `TopographicBackground` (React component) | `Topography` |
| `useTopographicBackground` | `useTopography` |
| `TopographicBackgroundProps` | `TopographyProps` |
| `TopographicBackgroundSettingsProps` | `TopographySettingsProps` |
| `TopographicBackgroundRef` | `TopographyRef` |
| `style` setting | `shape` |
| `style-name` attribute | `shape` |
| `styleName` React prop | `shape` |
| `STYLES` | `SHAPES` |
| `findStyle` | `findShape` |
| `Style` | `Shape` |
| `StyleId` | `ShapeId` |
| `DEFAULT_STYLE` | `DEFAULT_SHAPE` |
| WebMCP `list_styles` | `list_shapes` |

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
