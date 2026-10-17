# Changelog

## 0.4.0

- `quality` setting: `auto`, `low`, `medium` or `high`. `auto` starts phones on the low tier, steps down when frames miss 60 Hz or 120 Hz, and caps pixel ratio, canvas size and mesh size per tier. The React component takes `quality` as a prop.
- The frame budget follows the screen's refresh period.
- A drawing buffer of zero size is treated as a lost WebGL context and rebuilt. A drag no longer stalls the renderer until the context is lost.
- Phones ask for the low power GPU.
- `snapshot()` can take a temporary patch and height grid, then restores the view.
- License changed from MIT to Apache 2.0. The packages include LICENSE and NOTICE.
- Homepage is now https://topographic.yahyapak.dev. New package descriptions, keywords and READMEs.
