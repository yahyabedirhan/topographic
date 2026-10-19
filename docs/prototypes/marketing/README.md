# Marketing board

Prototypes for every public surface of topographic: the positioning line, the API names, the docs page, the README header, the npm and GitHub pages, the playground's install entry, yahyapak.dev and the social cards.
None of it ships.

## Running it

Run `npm run marketing` from the repository root.
It builds the packages and opens `http://localhost:5199/docs/prototypes/marketing/`.

## Boards and variants

Each file in `boards/` is one board: one question, and two to five variants that answer it in structurally different ways.
Each variant has an id such as `positioning/B`.
The bottom bar switches variants, and **Grid** shows every variant of a board side by side.
The ← and → keys also switch variants, and G toggles the grid.

Give feedback by id, and mix variants freely, such as "the headline of `positioning/B` with the layout of `positioning/C`".
`FEEDBACK.md` records each round: what was shown, what was said and what was chosen.

## Live renders

`live.js` mounts the real library from `packages/core/dist`, so a live variant shows what the library draws today.
Variants use the 0.5.0 API names inside `live.js`, while the code they show uses the proposed 0.6.0 names.

## Videos

Video and GIF variants are made in Havooch Studio, and their feedback goes through the Havooch player.
A board links to the rendered file when a video is the thing being judged.
