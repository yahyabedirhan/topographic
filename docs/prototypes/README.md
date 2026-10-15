# Prototypes

Design explorations for the playground, kept for maintainers. Each page is static HTML: open its `index.html` in a browser. None of it ships.

| Folder | What it explores | What was chosen |
|---|---|---|
| [dock-panels/](dock-panels/index.html) | One design for the cluster, the popovers and the dock: one anchor for every popover, one row grid, sections, segmented controls vs sliders, the dock's look controls. | V1 (section headers and hairlines) over V2 (inset cards). |
| [map-popover/](map-popover/index.html) | Five layouts for the Map popover (P1–P5), each with nothing applied, a moved frame and an applied place. | A mix: P1's map badge as the place menu, P3's status footer, P4's glass footer over an edge-to-edge map. |
| [tune-export/](tune-export/index.html) | Five directions for the Tune and Export popovers (P1–P5) across every tab. | A mix: P1's row icons, P2's sliders whose tracks draw their effect, P3's preview header per tab and camera diagram; for Export, P5's parameter chips, highlighted code values and video preview, P2's viewport cards with a movable phone crop. |
| [3d/](3d/) | Screenshots and notes from the 3D terrain prototype. | Shipped as `mode: '3d'`. |
| [region/](region/README.md) | The real-place picker: pipeline, limits and decisions. | Shipped as the Map popover. |

The map and dock pages use JPEG captures of the live playground as backgrounds, so they look the way they did when the choice was made.
