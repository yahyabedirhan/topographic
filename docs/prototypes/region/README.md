# Region picker

Pick a place on a map and draw it with the existing contour field. The use is fun, such as a city you know, rather than a survey. It is part of the [playground](https://yahyabedirhan.github.io/topographic/), behind the **Map** button. MapLibre loads only when Map opens.

## Run it

Open the [playground](https://yahyabedirhan.github.io/topographic/), or run it locally:

```sh
npm ci
npm run dev
```

That builds the packages and starts Vite. 2D is the default. Add `mode=3d` for the terrain view.

| Place | URL |
|---|---|
| Istanbul | `/?place=istanbul` (`28.45,40.78,29.65,41.36`, about 101 × 64 km) |
| San Francisco | `/?place=san-francisco` (`-122.75,37.53,-121.85,37.99`, about 79 × 51 km) |
| London | `/?place=london` (`-0.7,51.27,0.45,51.73`, about 80 × 51 km) |
| New York | `/?place=new-york` (`-74.45,40.46,-73.45,40.95`, about 84 × 54 km) |

Each city box holds the whole metro area and some of its surroundings: Istanbul with the Bosphorus, the Princes' Islands and some of the Sea of Marmara, the San Francisco Bay from Mount Tamalpais to Mount Diablo, Greater London with the Thames and the Downs, and New York's five boroughs with the harbour.

`region` is `west,south,east,north` in degrees. A JSON value works too: `{"bbox":[28.45,40.78,29.65,41.36]}` or `{"west":28.45,"south":40.78,"east":29.65,"north":41.36}`. `place=istanbul` (or `san-francisco`, `london`, `new-york`) names a city instead. The short settings keys of the rest of the playground set the style, colours and camera. Elevation is a plain setting: Apply sets it to 0.12, and the URL writes `ev=0.12`. There is no hidden place baseline.

Map opens a popover with the map edge to edge and a frame on it. A badge at the top left names the framed city, or Area, with its size; it opens the city menu (Istanbul, San Francisco, London, New York). Pan and zoom to move the area under the frame, or drag the frame's corners and edges to change its shape. Dragging stops at the place limits, so the frame is always valid. A glass footer says what the terrain is now and holds Clear and Apply. Apply turns to ✓ Applied while the frame shows the applied place.

Apply sets `MAP_TERRAIN_DEFAULTS` (in `region/places.ts`) on top of the current settings: 3D, a block, elevation 0.12, 36 lines at width 0 and opacity 0.9 with an index line every 4, and the camera at azimuth 341.8, angle 39.3, distance 1.32. It also saves the place as a dock item (`topographic.saved.v1` in localStorage: the box, the name and the settings, never the heightfield). Clear returns to the generated terrain and to the lines, camera, extent and elevation from before the first Apply. A side can be up to 300 km. Relief is always dramatic and smoothing always medium. The map uses the quiet paper style. Add `basemap=liberty` to open the previous OpenFreeMap Liberty style instead.

The script that took the screenshots below is gone. `scripts/readme-shots.mjs` takes the README shots of Istanbul and the picker.

## What the pictures show

Same style throughout: gentle summit, 28 lines. The `*-2d.png` and `*-3d.png` files are dark paper. Each `*-3d-light.png` is that same view on light paper. 3D opens at elevation 0.1.

These pictures were taken with the earlier boxes of about 10 km on a side.

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
| `picker-frame.png`, `picker-rectangle.png` | The two ways to choose the rectangle, on the quiet dark map. |
| `picker-frame-light.png`, `picker-rectangle-light.png` | The same two, on light paper. |

The heights are bare earth. The contours are the ground, and the buildings are absent. Sea water is put back to zero after the blur, and the contour shader sits that floor between the lines, so the Bosphorus, the bay, the Thames and the Hudson are blank paper rather than a striped shelf.

A load of one of these cities took about 6 seconds in this browser. Almost all of that is fetching the PNG tiles.

## Decisions

**Map.** [MapLibre GL JS](https://maplibre.org/) 6.14.0. The default picker is our own quiet style on [OpenFreeMap](https://openfreemap.org/) vector tiles (`https://tiles.openfreemap.org/planet`). No API key, no account, no view cap. Land, water, thin roads, and place names follow the playground paper and ink, in light and in dark. Pins, shields, and rail hatching are left out. `basemap=liberty` still loads `https://tiles.openfreemap.org/styles/liberty` when you want the previous look beside this one. The map stays flat. MapLibre shows the tile credit on the map. The line under the map is only the elevation credit.

A Protomaps planet PMTiles file is about 120 GB. GitHub Pages allows a 1 GB site and 100 MB per file, and Cloudflare R2's free tier stores 10 GB, so a full planet is not an unlimited free host. A low-zoom world plus these four cities would fit on Pages, and any other place would go soft once you zoomed in. OpenFreeMap's public tiles are the unlimited, keyless way to cover every place through zoom 14, and the style is ours. The tiles remain theirs.

Google Maps needs a key, a billing account, and terms that do not suit a public GitHub Pages site. Leaflet with the public OpenStreetMap raster tiles needs no key, and the OSM tile usage policy is a poor fit for a public app.

**Elevation.** [Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) on AWS Open Data, terrarium PNGs, no key:

`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`

A browser request with an `Origin` header receives `Access-Control-Allow-Origin: *`. Height in metres is `(R * 256 + G + B / 256) - 32768`. Zooms 0 to 15. The EU bucket `elevation-tiles-prod-eu` returned 403 here, so the picker uses the us-east-1 bucket. The registry describes the set as bare-earth terrain. The objects in the bucket were last written around 2017.

MapTiler and Mapbox terrain RGB, and the Google Elevation API, need a key and billing. A raw Copernicus or SRTM GeoTIFF is newer and is not a PNG tile a static page can fetch directly. Terrarium is the keyless tile that already answered the browser.

> **Since then:** the playground dropped the relief and smoothing options and the 0.1 place elevation. The notes below on measured relief, smoothing levels and the 0.1 default record the prototype decisions.

**Pipeline.** A module worker fetches the tiles, decodes them, stitches, and resamples onto a 256 by 256 grid. Dramatic mode (the default) stretches the 2nd to 98th percentile of the local heights across the block, so a flat city still reads as terrain. Measured mode treats 400 m as full height, so a low city stays low and a range above 400 m still fills the block. A gaussian blur keeps peaks round. Relief under 30 m gets a little more blur, and relief under 12 m gets more again.

**Height on screen.** The procedural terrain still defaults to elevation 0.62. A real place defaults to 0.1, unless the URL already set `elevation`. Clearing the place restores 0.62 when the slider is still on 0.1. A sweep from 0.05 to 0.62 is in the `elevation-sweep-*.png` grids. At 0.62 the block becomes a wall and the city is hard to read. At 0.1 the hills stay in the frame. 0.15 and 0.2 are a little taller and still calm. 0.05 is nearly flat.

The four cities have different relief in metres (78 m in New York, 282 m in San Francisco), and dramatic mode already stretches each one across the block. Scaling the slider by those metres would push New York and London toward the flat end of the sweep, so every city shares 0.1. The slider still overrides it.

The numeric work, timed by `pipeline.test.ts` on this machine, warm:

| Case | Time |
|---|---|
| 9 tiles, 768² source, 256 grid | 10 to 14 ms |
| 36 tiles, 1536² source, 256 grid | 9 to 11 ms |
| 2048² source, 512 grid | 37 to 46 ms |

Ten percent off those times is about a millisecond. An order of magnitude would land around 1 to 4 ms. The tile download is the wait, so the pipeline stays in JavaScript. There is no Wasm build.

**Area.** Shortest side at least 1.5 km, longest side at most 300 km, aspect at most 3 to 1, and at most 36 tiles. The zoom is the finest level that stays inside that tile budget, and it never goes above 15. Under 1.5 km the source is only a handful of samples across, so the picture goes soft. The four example cities are 80 to 100 km wide, the whole metro area of each.

**Renderer.** The region replaces the procedural landform through `setHeightfield`. The style still sets line count, width, opacity, index, grain and colour. The seed, every Terrain param and Motion's warp have no effect on a heightfield, so Tune dims them while a place is applied; speed still moves the sparkle. A real place holds its shape while you change style, and it holds still while motion is on. Block and endless, the camera, snapshot and record are the same controls as for procedural terrain. 2D fits the region inside the view and leaves paper around it. 3D uses the region's aspect for the footprint.

A region mesh is at least 192 by 192. The detail slider still tops out at 160 for procedural terrain. On the software renderer used for these screenshots, that mesh was about 15 fps and 60 to 75 ms. The same gaussian still rounds the crests, so the finer grid follows the smooth field. Heightfield lines respond to line width and opacity exactly like generated ones, then are pulled toward a darker ink on light paper and a lighter ink on dark paper. 3D lighting on a heightfield eases off (a floor of 0.9 instead of 0.76) so a flat city is not crushed. The dock draws a style only after its thumbnail exists.

**Agents.** The playground registers `set_region`, `get_region` and `clear_region` with WebMCP, beside its eight other tools. `llms.txt` and `docs/webmcp.md` describe the bbox and those tools. `set_region` accepts `place` (`istanbul`, `san-francisco`, `london`, `new-york`), the four edges, a `bbox` array, or a `region` string.

## Attribution

The © in the map's top-right corner opens the credits: OpenFreeMap, OpenMapTiles and OpenStreetMap, and `Elevation: Mapzen Terrain Tiles, AWS Open Data`. Nothing is repeated under the map. Elevation follows the [Tilezen / joerd attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md). Terrain Tiles was accessed in October 2026 from <https://registry.opendata.aws/terrain-tiles>.

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
6. Should this leave the prototype? Yes. The dock and the picker are now the published playground.
7. Is a 2017 bare-earth archive the right source for a fun map? It has no buildings.
8. Is 192 the right region mesh, or should the detail slider drive it the way it drives procedural terrain?

Looking at the screenshots is enough to answer these. Running it needs no API key.
