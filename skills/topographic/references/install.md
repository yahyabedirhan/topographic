# Installing topographic

Follow these steps in order.
The install is done when step 5 shows the terrain in the running page.

## 1. Pick the packages

- `topographic` always: the core library and the `<topographic-view>` web component.
- `topographic-react` too when the project's `package.json` lists `react`.

## 2. Install them

```sh
npm install topographic                     # plain JavaScript, HTML or any framework
npm install topographic topographic-react   # React
```

Leave the version unpinned, so the newest release installs.

## 3. Add a first terrain

Put it where the user asked for it, in the project's own idiom.

```js
import { createTopography } from 'topographic';

const topography = createTopography(document.querySelector('#terrain'), { shape: 'long-ridge' });
```

```tsx
import { Topography } from 'topographic-react';

<Topography shape="long-ridge" className="terrain" />
```

```html
<script type="module">import 'topographic/element';</script>
<topographic-view shape="long-ridge" class="terrain"></topographic-view>
```

## 4. Give it a size

Size the element the terrain draws in: the element passed to `createTopography`, or `<Topography>` and `<topographic-view>` themselves.
A height on a wrapper around them does not reach them.
Use the project's own CSS: a height for a section, or fixed and behind the content for a full page.
The guide's [Sizing and layering](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#sizing-and-layering) has both.

With server rendering, create the terrain in the browser only.
`topographic-react` already does this; for the other two, read [Server rendering and Next.js](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#server-rendering-and-nextjs).

## 5. See it draw

Run the project's dev server and open the page.
Contour lines draw in the element and move.
A flat colour instead means WebGL is missing: check `topography.status` and the console, then the guide's [Troubleshooting](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#troubleshooting).
