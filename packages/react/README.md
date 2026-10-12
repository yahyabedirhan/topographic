# @yahyapak/topography-react

[![npm](https://img.shields.io/npm/v/@yahyapak/topography-react)](https://www.npmjs.com/package/@yahyapak/topography-react)

React bindings for [`@yahyapak/topography`](https://www.npmjs.com/package/@yahyapak/topography): animated topographic contour-line backgrounds. It works with React 18 and 19 and is safe for server rendering.

```sh
npm install @yahyapak/topography @yahyapak/topography-react
```

```tsx
import { Topography } from '@yahyapak/topography-react';

export function Hero() {
  return (
    <Topography styleName="granite" terrain={{ roughness: 0.3 }} style={{ height: '100vh' }}>
      <h1>Hello</h1>
    </Topography>
  );
}
```

To put the background on your own element, use `useTopography(settings)`, which returns a ref.

- [Project README](https://github.com/yahyabedirhan/topography#readme)
- [Guide](https://github.com/yahyabedirhan/topography/blob/main/docs/guide.md)

MIT licence.
