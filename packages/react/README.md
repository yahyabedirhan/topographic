# topographic-react

[![npm](https://img.shields.io/npm/v/topographic-react)](https://www.npmjs.com/package/topographic-react)

Try it live in the [playground](https://yahyabedirhan.github.io/topographic/).

React bindings for [`topographic`](https://www.npmjs.com/package/topographic), the JavaScript library for topographic backgrounds. It works with React 18 and 19 and is safe for server rendering.

```sh
npm install topographic topographic-react
```

```tsx
import { TopographicBackground } from 'topographic-react';

export function Hero() {
  return (
    <TopographicBackground styleName="granite" terrain={{ roughness: 0.3 }} style={{ height: '100vh' }}>
      <h1>Hello</h1>
    </TopographicBackground>
  );
}
```

To put the background on your own element, use `useTopographicBackground(settings)`, which returns a ref.

- [Project README](https://github.com/yahyabedirhan/topographic#readme)
- [Guide](https://github.com/yahyabedirhan/topographic/blob/main/docs/guide.md)

MIT licence.
