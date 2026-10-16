# Low-end device matrix

Emulated in Chrome with SwiftShader. This is not a physical iPhone or Moto.

| Device | CSS | DPR |
| --- | --- | --- |
| iPhone SE | 375×667 | 2 |
| iPhone 14 Pro | 393×852 | 3 |
| Moto G4 | 360×640 | 3 |

Each stress run lasted about 70 seconds and did both 2D and 3D: drag, orbit, shuffle, style thumbs, the map picker, a PNG download, a video export attempt, portrait/landscape, and one forced WebGL context loss with no `restoreContext()`. CPU throttle was 4× and 6×. The stress network was Slow 4G (150 ms, 180 KB/s down). Loading shots used Slow 3G (400 ms, 50 KB/s) after a 4 second hold on elevation tiles. `MAX_TEXTURE_SIZE` and `MAX_RENDERBUFFER_SIZE` were capped at 2048.

Frame p50/p95 are animation-frame gaps. Canvas MB is the backing-store estimate (every canvas at 4 bytes per pixel, plus a 16-bit depth buffer on the main canvas). Heap is `performance.memory.usedJSHeapSize`.

| Device | CPU | Crash | Tier | GL after loss | Frame p50 | Frame p95 | Long task p50 | Long task p95 | Heap | Canvas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone SE | 4× | no | low | webgl2 | 83 ms | 383 ms | 109 ms | 835 ms | 42 MB | 1.5 MB |
| iPhone SE | 6× | no | low | webgl2 | 83 ms | 467 ms | 96 ms | 1075 ms | 34 MB | 1.5 MB |
| iPhone 14 Pro | 4× | no | low | webgl2 | 133 ms | 283 ms | 107 ms | 1841 ms | 24 MB | 2.0 MB |
| iPhone 14 Pro | 6× | no | low | webgl2 | 83 ms | 667 ms | 111 ms | 1227 ms | 40 MB | 2.0 MB |
| Moto G4 | 4× | no | low | webgl2 | 83 ms | 333 ms | 96 ms | 692 ms | 40 MB | 1.4 MB |
| Moto G4 | 6× | no | low | webgl2 | 83 ms | 367 ms | 90 ms | 706 ms | 36 MB | 1.4 MB |

No page errors. Every run downloaded a PNG. The video export was started; on this software GPU it did not finish inside 18 seconds, and the page stayed up. Context loss did not fire `webglcontextrestored` (restore was never requested). The page replaced the canvas and came back as WebGL2. The recovery line was visible while it was lost.

A 2D drag on the iPhone 14 Pro viewport wrote `an=0.68`. Before the long stress, a short settle landed on `low` for both iPhones and `medium` for the Moto; the 70 second runs all finished on `low`.

Screenshots in this folder:

- `default-iphone-se.png`, `default-iphone-14-pro.png`, `default-moto-g4.png`
- `dock-a-iphone-14-pro.png`, `dock-b-iphone-14-pro.png`, `dock-a-iphone-se.png`, `dock-b-iphone-se.png`
- `link-a-iphone-14-pro.png`, `link-b-iphone-14-pro.png`
- `loading-a-slow3g-iphone-14-pro.png`, `loading-b-slow3g-iphone-14-pro.png`
- `tier-iphone-se.png`, `tier-iphone-14-pro.png`, `tier-moto-g4.png`
- `anchor-2d-iphone-14-pro.png`
- `map-iphone-14-pro.png`
- `recovery-iphone-14-pro.png`
- `landscape-iphone-se.png`, `landscape-iphone-14-pro.png`, `landscape-moto-g4.png`

Raw numbers: `results.json`. The runner is `scripts/device-matrix.mjs`.
