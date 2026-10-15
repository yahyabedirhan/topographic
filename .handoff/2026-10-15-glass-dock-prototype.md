# Handoff: glass dock prototype

Repo: yahyabedirhan/topography (public). Branch: `cursor/glass-dock-variants-4197`. Pull request: https://github.com/yahyabedirhan/topography/pull/17

Checkout: `/Users/yahyabedirhanpak/Developer/yahyabedirhan/topography`. This is the calling checkout, not a treehouse worktree. Two other treehouse checkouts exist and were not touched.

Run the prototype with `npm run prototype`. It opens `/?variant=P2`. Any `variant` query loads this screen in the dev server. A production build does not.

## What Yahya decided

Settings stay on the P2 strip: each setting is a name, a slider and a value. The knobs are gone. Shuffle and the light/dark switch stay.

Export is a glass popover under the export icon, the same glass as the settings popover. There is no dialog and no map preview inside it. Formats, in order, starting on Link:

1. Link. One truncated line and Copy. The full URL is what Copy puts on the clipboard.
2. PNG. Three downloads: this screen, phone, 1920 × 1080.
3. React. `npm install topography.js topography-react`, then the component for the current background.
4. HTML. The `topography.js/element` script, then the `<topography-bg>` for the current background.
5. JSON. The settings as data.

The dock is a playground-only strip of 24 looks in `apps/playground/src/prototype/looks.ts`. Neighbours differ in shape and colour, and the strip mixes light and dark. Choosing one applies that whole look, including its seed and colours. The paper and ink dots still retune colour afterwards. The library `PRESETS` list is unchanged.

Dock thumbnails draw thinner lines than the live map (`width` times 0.62 in the thumbnail renderer). The selected tile is a capsule nested in the dock pill. The selection is a gap of the glass, not a dark stroke.

## What was not checked

Nobody looked at this build in the browser. A click-through was started against a Chrome tab whose server had already closed, so it never saw the canvas. Yahya still needs to walk the dock, the strip, and each export format, in light and in dark.

The dev server this session started was stopped on settlement. The right-hand pane was left open.

## WebMCP, next

WebMCP is already on the playground page. `apps/playground/src/webmcp.ts` registers seven tools when `document.modelContext` exists: `list_styles`, `get_settings`, `set_settings`, `randomize`, `take_screenshot`, `get_embed_code`, `get_install_instructions`. There is no Vite MCP.

`get_settings` was called once on the live page and returned drifting lobes at seed 0. That call went through a browser with WebMCP enabled. Do not use Terminal Browser. Yahya rejected it.

His everyday Chrome does not hand this session those tools. JavaScript from Apple Events was off (View > Developer > Allow JavaScript from Apple Events). Changing the tab address reloads the playground, because the page reads `?config=`. It does not click the controls.

After the visual pass, an agent should be able to do what a person can do on this prototype: pick a look, tune, shuffle, switch theme, and export. The current tools change settings and return code. They do not drive the new popover.

## Parked files

The old switcher and variants P1 and P3–P5 were taken out of `apps/playground/src/prototype/`. Copies of those files sit in `.scratch/prototype-retired/`, which is gitignored.

## Suggested skills

- prototype, for the throwaway screen
- show-me, when explaining WebMCP or a visual choice
- grilling, if the next visual pass opens a real design choice
