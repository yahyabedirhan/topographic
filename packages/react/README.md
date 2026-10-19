# topographic-react

[![npm](https://img.shields.io/npm/v/topographic-react)](https://www.npmjs.com/package/topographic-react)

Try it live in the [playground](https://topographic.yahyapak.dev/).

React bindings for [`topographic`](https://www.npmjs.com/package/topographic), the JavaScript library for topographic backgrounds. It works with React 18 and 19 and is safe for server rendering.

- Animated contour lines in 2D, or the same map as a 3D terrain
- Real elevation data through `setHeightfield()`
- Seven shapes and readable settings as props
- Automatic quality tiers for phones and fast screens
- PNG and video export

```sh
npm install topographic topographic-react
```

```tsx
import { Topography } from 'topographic-react';

export function Hero() {
  return (
    <Topography shape="granite" terrain={{ roughness: 0.3 }}>
      <h1>Hello</h1>
    </Topography>
  );
}
```

`<Topography>` renders a div; size it like any other div.
The [guide](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md#sizing-and-layering) shows how to size it and put it behind the page.

For the 3D terrain, add `mode="3d"`, and optionally `elevation`, `extent`, `detail`, `quality` and `camera`. `quality` is `auto` (the default, which follows the device), `low`, `medium` or `high`:

```tsx
<Topography shape="long-ridge" mode="3d" extent="block" camera={{ motion: 'orbit' }} style={{ height: '100vh' }} />
```

`onReady` gives you the instance, for `snapshot()`, `record()` and `setHeightfield()`. To show a real place, pass a square grid of heights from 0 to 1:

```tsx
<Topography mode="3d" onReady={(t) => t.setHeightfield({ samples, size: 256, aspect: 1.2 })} style={{ height: '100vh' }} />
```

The [playground](https://topographic.yahyapak.dev/) has ten real places ready, or any area up to 300 km wide.

To put the background on your own element, use `useTopography(settings)`, which returns a ref.

- [Project README](https://github.com/yahyabedirhan/topographic#readme)
- [Guide](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md)

Licensed under the Apache License 2.0. See LICENSE and NOTICE. If you use or adapt this code, please credit Yahya Bedirhan Pak with a link to [yahyapak.dev](https://yahyapak.dev).
