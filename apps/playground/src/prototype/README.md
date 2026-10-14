# Playground prototypes (throwaway)

Five background-first versions of the playground, on the existing route and switched with `?variant=A..E` or the yellow bar at the bottom (← and → keys work too). They only load in the dev server, so a production build never ships them.

```sh
npm run prototype        # builds the packages, starts Vite and opens /?variant=A
```

| Key | Name | Idea |
| --- | --- | --- |
| A | Glass dock | The map is the page. A floating dock holds thumbnails; tune, colour and export open as popovers above it. |
| B | Command palette | Only the map and a search hint. ⌘K or / opens one palette for looks, settings, colours and export. |
| C | Filmstrip | Large preset cards along the bottom edge; the selected card grows an Adjust popover. |
| D | Inspector card | One compact card that drags anywhere, snaps to a side and folds into its header. |
| E | Gallery first | Opens on a grid of every look; choosing one zooms into a full-screen editor with an edge rail. |

Shared pieces live in `shared.tsx`: state and URL config, WebMCP registration, preset thumbnails rendered with one off-screen renderer, and an HSV colour picker with no dependencies. `shots.mjs` takes the screenshots in `docs/prototypes/`.

Once a direction wins, rewrite it properly in `App.tsx` and delete this folder.
