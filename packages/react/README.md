# topography-react

[![npm](https://img.shields.io/npm/v/topography-react)](https://www.npmjs.com/package/topography-react)

Try it live in the [playground](https://yahyabedirhan.github.io/topography/).

React bindings for Topography, the JavaScript package for creating animated topographic backgrounds. The core package is [`topography.js`](https://www.npmjs.com/package/topography.js). It works with React 18 and 19 and is safe for server rendering.

```sh
npm install topography.js topography-react
```

```tsx
import { Topography } from 'topography-react';

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
