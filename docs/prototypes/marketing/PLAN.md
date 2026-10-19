# 0.6.0 plan

The plan for the changes that are costly to undo.
Agents wrote it while the maintainer was away.
The rename (part 1) is built as a draft pull request.
Part 2 is decided (ten built-in locations plus live fetch) and is built next. Parts 3 and 4 wait for D5 and D7.

## Part 1: public names

This part is built as a draft pull request, using the maintainer's names (`shape`, `<topographic-view>`) and a clean break, as the maintainer decided.

| 0.5.0 | 0.6.0 |
|---|---|
| `createTopographicBackground(el, settings)` | `createTopography(el, settings)` |
| `TopographicBackground` type | `Topography` type, and `TopographyInstance` in React |
| `<TopographicBackground>` and `useTopographicBackground()` | `<Topography>` and `useTopography()` |
| `<topographic-bg>` and `TopographicBackgroundElement` | `<topographic-view>` and `TopographyElement` |
| `style`, `styleName`, `style-name` | `shape` |

The trade-off is a clean break (D3).
0.x versions allow breaking changes, and the launch was recent, so few users depend on the old names.
Aliases would keep old code working for one release, but every editor's autocomplete would show both names.

## Part 2: real locations in the library (D4)

The ten playground places move into the library, so `location="fuji"` works with no setup.

- A new entry point `topographic/locations` exports each location as a lazy import, so a page that uses Fuji downloads only Fuji.
- Each built-in location is a 256 × 256 height grid stored as a 16-bit PNG, about 60 to 120 KB each, generated once by a script from the same Terrarium tiles the playground uses.
- `fetchLocation({ west, south, east, north })` runs the playground's pipeline for any area up to 300 km wide. It fetches tiles from AWS Open Data at runtime.
- The `location` setting takes an id or a heightfield, and the camera defaults come with each built-in location.

Trade-offs:

- Built-in grids work offline and give the same result every time, which video frames and games need, but they add about 1 MB to the package on disk (not to a page's download).
- Live fetching covers any area, but it needs the network and a third-party tile host.
- The maintainer chose both.

## Part 3: named looks (D5)

The core `PRESETS` and the playground's looks become one list of named looks with ids, such as `survey-map` and `rose-pod`.
`look="survey-map"` applies a look, and other settings override it.
The trade-off is one more concept to learn, against a much shorter first example.

## Part 4: exports that back the claims (D7)

The games claim needs a way to take the terrain out of the library.

- `topography.heightfield()` returns the current height grid, for generated land as well as a location, computed on the CPU from the same field the shader draws.
- `exportHeightmap({ size, format: 'png16' | 'float32' })` gives a file a game engine imports as terrain.
- `record()` gains 2D, and a longer maximum (60 s) using chunked encoding.
- A mesh export (glTF) is a later option. It costs more and is not needed for the first games claim.

The trade-off is scope.
Without these, the positioning should say websites and video, and keep games out until they ship.

## Part 5: the copy

After parts 1 to 4, every surface gets the copy picked on the boards: the README, the package READMEs and npm pages, the GitHub description and topics, the playground's title and install entry, the docs page at `/docs`, the About page, yahyapak.dev, the social cards and the launch videos' end cards.
