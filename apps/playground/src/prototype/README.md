# Playground prototypes (throwaway)

Five popovers continued from the glass dock, on the existing route. Switch them with `?variant=P1` through `P5`, or the yellow bar. `?variant=A2` and `?variant=A` open P1. They only load in the dev server, so a production build never ships them.

```sh
npm run prototype        # builds the packages, starts Vite and opens /?variant=P1
```

The top cluster and the bottom dock are the same glass pill: paper at half opacity, the same blur and the same hairline. Tune sits at the right end of the cluster, and its popover lines up with that pill's right edge. There is no search field. Lines, terrain, motion and layout stay as icon groups. Export is a glass dialog with a fixed box, so changing step or format does not resize it. The preview keeps a heading on the live lines, and the source is larger and highlighted.

| Key | Name | Tune | Export |
| --- | --- | --- | --- |
| P1 | Line | Each setting is a short row. Opening one adds a thin slider, and the description stays in a tooltip. | Preview beside a tall highlighted source. Formats are a stable row. |
| P2 | Strip | Every setting in the group is one line: name, slider, value. Nothing expands. | The preview stays put. The other side steps through a note, the format, then the source, inside the same box. |
| P3 | Dial | Names are chips. The open setting is one dial and a short slider. | Preview across the top, source filling the rest. |
| P4 | Grid | The group is a two-column grid of short sliders. | Formats in a rail. Preview and a wide source sit beside it. |
| P5 | Focus | One slider. The other names in the group are chips, so the popover stays the same height. | The source is the tall pane. Formats sit under it. The preview stays on the left. |

Shared pieces live in `shared.tsx` (state, shuffle, thumbnails, the colour picker), `ui.tsx` (the dock, the cluster, the tune popovers) and `exporting.tsx`. `shots.mjs` takes the screenshots in `docs/prototypes/`.

Once a direction wins, rewrite it properly in `App.tsx` and delete this folder.
