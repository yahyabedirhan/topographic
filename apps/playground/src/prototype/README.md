# Playground prototype (throwaway)

The glass dock, on the existing route. Open it with `?variant=P2` (any `variant` value loads this screen in the dev server). A production build never ships it.

```sh
npm run prototype        # builds the packages, starts Vite and opens /?variant=P2
```

The top cluster and the bottom dock are the same glass pill. Tune is a strip: each setting is a name, a slider and a value. Export is a glass popover on that same corner, with Link, PNG, React, HTML and JSON. The dock is a playground-only strip of 24 looks. Each look has its own shape, colour and light or dark mode. Choosing one applies that whole look.

`shots.mjs` takes the screenshots in `docs/prototypes/`.

Place, in the top cluster, frames a real region and turns it into this same terrain. See `docs/prototypes/region/`.

Once a direction wins, rewrite it properly in `App.tsx` and delete this folder.
