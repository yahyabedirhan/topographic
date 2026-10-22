// Copied from github.com/yahyabedirhan/personal-website at 73972e0, src/bg.js (Apache-2.0).
// The one change: styleMap comes from src/data.js there and is inlined here.
// scripts/blend-check.mjs runs it beside the library to prove the scenes blend draws the same pixels.
// One WebGL context for the whole site. Low resolution, capped frame rate on phones,
// paused when the tab is hidden, a single still frame under reduced motion.
import { FRAG } from './topo.glsl.js';
// topo style per background state, from src/data.js
const styleMap = [0, 7, 3, 4, 5, 11];

export function createBackground(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return { setState() {}, setDark() {} };
  gl.getExtension('OES_standard_derivatives');
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o)); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uRes', 'uTime', 'uDark', 'uW', 'uN', 'uMap', 'uFade', 'uCol', 'uMouse']) U[n] = gl.getUniformLocation(prog, n);
  gl.uniform1fv(U.uMap, styleMap); gl.uniform1f(U.uFade, .7);

  const coarse = matchMedia('(pointer: coarse)').matches;
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const w = [1, 0, 0, 0, 0, 0]; let target = 0, dark = 0, darkT = 0, raf = 0, last = 0, t = 0, lastDraw = 0;
  const lines = () => (innerWidth < 600 ? 36 : innerWidth < 1024 ? 30 : 24);
  const resize = () => {
    // phones: 1x device pixels; desktop: up to 1.5x. Thin lines stay crisp enough, fill cost drops a lot.
    const k = Math.min(devicePixelRatio || 1, innerWidth < 600 || coarse ? 1 : 1.5);
    canvas.width = Math.round(innerWidth * k); canvas.height = Math.round(innerHeight * k);
    gl.viewport(0, 0, canvas.width, canvas.height); kick();
  };
  const draw = () => {
    gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform1f(U.uTime, t); gl.uniform1f(U.uDark, dark);
    gl.uniform1fv(U.uW, w); gl.uniform1f(U.uN, lines());
    // faded column: half the page width (576 / 2 + 24 gutter) plus 20px of margin
    gl.uniform1f(U.uCol, Math.min(332, innerWidth / 2) / innerHeight);
    gl.uniform1f(U.uFade, .7 * (innerWidth < 720 ? .4 : 1));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = now => {
    raf = 0;
    const minGap = coarse ? 1000 / 30 : 0; // 30fps cap on phones
    if (now - lastDraw >= minGap - 2) {
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; lastDraw = now;
      const k = 1 - Math.exp(-dt * 4.5);
      let moving = false;
      for (let i = 0; i < w.length; i++) { const d = (i === target ? 1 : 0) - w[i]; w[i] += d * k; if (Math.abs(d) > .002) moving = true; }
      const dd = darkT - dark; dark += dd * (1 - Math.exp(-dt * 6)); if (Math.abs(dd) > .002) moving = true;
      if (!still.matches) t += dt;
      draw();
      if (still.matches && !moving) return; // reduced motion: settle on a still frame
    }
    if (!document.hidden) raf = requestAnimationFrame(frame);
  };
  function kick() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else kick(); });
  still.addEventListener?.('change', kick);
  addEventListener('resize', resize); resize();
  return {
    setState(i) { target = i; kick(); },
    setDark(d, instant) { darkT = d ? 1 : 0; if (instant) dark = darkT; kick(); },
  };
}
