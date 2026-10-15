# Region prototype

Pick a place on a map and draw it with the existing contour field. The use is fun, such as a city you know, rather than a survey. A production build does not ship this. It lives on the dev dock.

## Run it

```sh
npm ci
npm run prototype
```

That builds the packages, starts Vite and opens `/?variant=P2`. 2D is the default. Add `mode=3d` for the terrain view.

| Place | URL |
|---|---|
| Istanbul | `/?variant=P2&place=istanbul&region=28.94,40.99,29.07,41.08` |
| San Francisco | `/?variant=P2&place=san-francisco&region=-122.51,37.71,-122.38,37.81` |
| London | `/?variant=P2&place=london&region=-0.22,51.48,-0.06,51.57` |
| New York | `/?variant=P2&place=new-york&region=-74.06,40.68,-73.92,40.77` |

`region` is `west,south,east,north` in degrees. A JSON value works too: `{"bbox":[28.94,40.99,29.07,41.08]}` or `{"west":28.94,"south":40.99,"east":29.07,"north":41.08}`. `relief=measured` opts out of the dramatic stretch. `smooth=light` or `smooth=strong` opts out of medium. The same `config` query as the rest of the playground still sets the style, colours and camera. An explicit `elevation` in that config is kept. Without one, a place opens at 0.1.

Place opens a map. Frame (the default) uses pan and zoom, and the inset rectangle is the place. Rectangle is a drag. The four chips load those cities immediately. Use this place commits whatever the frame or the drag currently covers.

Regenerate the screenshots while that dev server is running:

```sh
node apps/playground/src/prototype/region/shots.mjs http://127.0.0.1:5173/ docs/prototypes/region
```

## What the pictures show

Same style throughout: gentle summit, 28 lines. The `*-2d.png` and `*-3d.png` files are dark paper. Each `*-3d-light.png` is that same view on light paper. 3D opens at elevation 0.1.

| File | What it is |
|---|---|
| `cities-overview.png` | The four cities in 3D, dark paper on the top row and light paper on the bottom, at elevation 0.1. |
| `istanbul-2d.png`, `istanbul-3d.png`, `istanbul-3d-light.png` | The historic peninsula and the Bosphorus, about 11 km by 9.9 km, 260 m of relief. |
| `san-francisco-2d.png`, `san-francisco-3d.png`, `san-francisco-3d-light.png` | The peninsula hills, about 11 km by 11 km, 282 m of relief. |
| `london-2d.png`, `london-3d.png`, `london-3d-light.png` | The Thames and the northern rise, about 11 km by 9.9 km, 135 m of relief. |
| `new-york-2d.png`, `new-york-3d.png`, `new-york-3d-light.png` | Lower Manhattan and the rivers, about 12 km by 9.9 km, 78 m of relief. |
| `elevation-sweep-istanbul.png` | Istanbul at 0.05, 0.1, 0.15, 0.2, 0.3 and 0.62. |
| `elevation-sweep-san-francisco.png` | The same sweep for San Francisco. |
| `elevation-sweep-london.png` | The same sweep for London. |
| `elevation-sweep-new-york.png` | The same sweep for New York. |
| `picker-frame.png`, `picker-rectangle.png` | The two ways to choose the rectangle. |

The heights are bare earth. The contours are the ground, and the buildings are absent. Sea water is put back to zero after the blur, and the contour shader sits that floor between the lines, so the Bosphorus, the bay, the Thames and the Hudson are blank paper rather than a striped shelf.

A load of one of these cities took about 6 seconds in this browser. Almost all of that is fetching the PNG tiles.

## Decisions

**Map.** [MapLibre GL JS](https://maplibre.org/) 6.14.0 and the [OpenFreeMap](https://openfreemap.org/) Liberty style (`https://tiles.openfreemap.org/styles/liberty`). No API key, no account, no view cap. MapLibre adds the attribution. The map stays flat. OpenFreeMap also serves Positron, Bright, Dark and Fiord.

Google Maps needs a key, a billing account, and terms that do not suit a public GitHub Pages site. Leaflet with the public OpenStreetMap raster tiles needs no key, and the OSM tile usage policy is a poor fit for a public app. OpenFreeMap is the keyless vector option that states commercial use and unlimited views on the public instance.

**Elevation.** [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) on AWS Open Data, terrarium PNGs, no key:

`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`

A browser request with an `Origin` header receives `Access-Control-Allow-Origin: *`. Height in metres is `(R * 256 + G + B / 256) - 32768`. Zooms 0 to 15. The EU bucket `elevation-tiles-prod-eu` returned 403 here, so the prototype uses the us-east-1 bucket. The registry describes the set as bare-earth terrain. The objects in the bucket were last written around 2017.

MapTiler and Mapbox terrain RGB, and the Google Elevation API, need a key and billing. A raw Copernicus or SRTM GeoTIFF is newer and is not a PNG tile a static page can fetch directly. Terrarium is the keyless tile that already answered the browser.

**Pipeline.** A module worker fetches the tiles, decodes them, stitches, and resamples onto a 256 by 256 grid. Dramatic mode (the default) stretches the 2nd to 98th percentile of the local heights across the block, so a flat city still reads as terrain. Measured mode treats 400 m as full height, so a low city stays low and a range above 400 m still fills the block. A gaussian blur keeps peaks round. Relief under 30 m gets a little more blur, and relief under 12 m gets more again.

**Height on screen.** The procedural terrain still defaults to elevation 0.62. A real place defaults to 0.1, unless the URL already set `elevation`. Clearing the place restores 0.62 when the slider is still on 0.1. A sweep from 0.05 to 0.62 is in the `elevation-sweep-*.png` grids. At 0.62 the block becomes a wall and the city is hard to read. At 0.1 the hills stay in the frame. 0.15 and 0.2 are a little taller and still calm. 0.05 is nearly flat.

The four cities have different relief in metres (78 m in New York, 282 m in San Francisco), and dramatic mode already stretches each one across the block. Scaling the slider by those metres would push New York and London toward the flat end of the sweep, so every city shares 0.1. The slider still overrides it.

The numeric work, timed by `pipeline.test.ts` on this machine, warm:

| Case | Time |
|---|---|
| 9 tiles, 768² source, 256 grid | 10 to 14 ms |
| 36 tiles, 1536² source, 256 grid | 9 to 11 ms |
| 2048² source, 512 grid | 37 to 46 ms |

Ten percent off those times is about a millisecond. An order of magnitude would land around 1 to 4 ms. The tile download is the wait, so the prototype stays in JavaScript. There is no Wasm build.

**Area.** Shortest side at least 1.5 km, longest side at most 64 km, aspect at most 3 to 1, and at most 36 tiles. The zoom is the finest level that stays inside that tile budget, and it never goes above 15. Under 1.5 km the source is only a handful of samples across, so the picture goes soft. Over 64 km the place is no longer a city, and the download grows. The four example cities sit near 10 km on a side, inside that range.

**Renderer.** The region replaces the procedural landform through `setHeightfield`. The style still sets line count, width, opacity, index, grain and colour. A real place holds its shape while you change style, and it holds still while motion is on. Block and endless, the camera, snapshot and record are the same controls as the 3D prototype. 2D fits the region inside the view and leaves paper around it. 3D uses the region's aspect for the footprint.

A region mesh is at least 192 by 192. The detail slider still tops out at 160 for procedural terrain. On the software renderer used for these screenshots, that mesh was about 15 fps and 60 to 75 ms. The same gaussian still rounds the crests, so the finer grid follows the smooth field. Heightfield lines are strengthened so a gentle city reads on both papers: about 2.2 times in light mode and 2.8 times in dark mode, then pulled toward a darker ink on light paper and a lighter ink on dark paper. 3D lighting on a heightfield eases off (a floor of 0.9 instead of 0.76) so a flat city is not crushed. The dock draws a style only after its thumbnail exists.

**Agents.** The dev page registers `set_region`, `get_region` and `clear_region` with WebMCP. The published tool list is unchanged. `llms.txt` and `docs/webmcp.md` describe the bbox and those tools. `set_region` accepts `place` (`istanbul`, `san-francisco`, `london`, `new-york`), the four edges, a `bbox` array, or a `region` string, plus optional `relief` and `smooth`.

## Attribution

The map control credits OpenFreeMap, OpenMapTiles and OpenStreetMap. Elevation follows the [Tilezen / joerd attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md). Terrain Tiles was accessed in October 2026 from <https://registry.opendata.aws/terrain-tiles>.

- Mapzen
- ArcticDEM terrain data DEM(s) were created from DigitalGlobe, Inc., imagery and funded under National Science Foundation awards 1043681, 1559691, and 1542736
- Australia terrain data © Commonwealth of Australia (Geoscience Australia) 2017
- Austria terrain data © offene Daten Österreichs – Digitales Geländemodell (DGM) Österreich
- Canada terrain data contains information licensed under the Open Government Licence – Canada
- Europe terrain data produced using Copernicus data and information funded by the European Union - EU-DEM layers
- Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration
- Mexico terrain data source: INEGI, Continental relief, 2016
- New Zealand terrain data Copyright 2011 Crown copyright (c) Land Information New Zealand and the New Zealand Government (All rights reserved)
- Norway terrain data © Kartverket
- United Kingdom terrain data © Environment Agency copyright and/or database right 2015. All rights reserved
- United States 3DEP (formerly NED) and global GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey

## Open questions

These are in the UI and the screenshots so they can be chosen by looking.

1. Frame or rectangle as the default way to pick? Frame is the default. Both are in the dialog.
2. Dramatic or measured as the default relief? Dramatic is the default, which is what makes a 78 m city fill the block at the same slider position as a 282 m city.
3. Light, medium or strong smoothing? Medium is the default.
4. Are 1.5 km and 64 km the right edges for a place?
5. Should a style keep warping the landform, or stay on the line treatment? A real place currently keeps the elevation shape.
6. Should this leave the prototype? The production build still omits the dock.
7. Is a 2017 bare-earth archive the right source for a fun map? It has no buildings.
8. Is 192 the right region mesh, or should the detail slider drive it the way it drives procedural terrain?

Looking at the screenshots is enough to answer these. Running it needs no API key.
