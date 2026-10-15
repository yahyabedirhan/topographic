# Playground prototypes (throwaway)

Five continuations of the glass dock, on the existing route. Switch them with `?variant=A1` through `A5`, or the yellow bar (`?variant=A` opens A1). They only load in the dev server, so a production build never ships them.

```sh
npm run prototype        # builds the packages, starts Vite and opens /?variant=A1
```

| Key | Name | Idea |
| --- | --- | --- |
| A1 | Stage | The map is the page. Tune is a draggable card of dials. Export fades the scene so a heading sits on the lines, then walks through the format and the payload. |
| A2 | Popover | Tune opens under its icon. Export is a dialog with a live frame of this background beside the steps. |
| A3 | Sheet | Tune is a sheet on the right. Export is a reading column on the left, the same three steps, over the map. |
| A4 | Mixer | Tune is a wide bank of dials above the examples. Export starts from the outcome (a page, the settings, or a still image). |
| A5 | Rail | Tune is a sheet on the left with the groups in a vertical rail. Export reveals the heading, then the paragraph, then the formats. |

The bottom dock keeps the example thumbnails and the paper and ink swatches. The top right is icon buttons: tune, shuffle, export, and the light or dark switch. Each one has a tooltip.

Tune follows the shape of a knobs panel. Each setting is a row with a dial, the name and the value. Drag a dial, or open one row for a slider and a sentence about it. A field finds a setting by name. Reset puts that setting back. The mixer lays the same dials out in a bank.

Shuffle picks a pattern, a harmonious paper and ink, and glides the other settings. Export always shows the thing you will copy or download before the button that takes it.

Shared pieces live in `shared.tsx` (state, shuffle, thumbnails, the colour picker), `ui.tsx` (the dock, the icon cluster, the tune panel) and `exporting.tsx`. `shots.mjs` takes the screenshots in `docs/prototypes/`.

Once a direction wins, rewrite it properly in `App.tsx` and delete this folder.
