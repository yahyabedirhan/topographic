import { viewProjection, type Pose } from './camera.js';
import { sampleGrid, type Heightfield } from './heightfield.js';
import { meshResolution, toUniforms, type Settings } from './settings.js';
import { terrainFragmentSource, terrainVertexSource } from './shader/terrain.glsl.js';
import type { ResolvedTheme } from './theme.js';

type GL = WebGLRenderingContext | WebGL2RenderingContext;

export interface TerrainFrame {
  width: number;
  height: number;
  settings: Settings;
  theme: ResolvedTheme;
  frameMs: number;
  col: number;
  pose: Pose;
  field: Heightfield | null;
  heightVersion: number;
}

export interface TerrainPass {
  readonly mesh: number;
  readonly ok: boolean;
  draw(gl: GL, webgl2: boolean, frame: TerrainFrame): void;
  dispose(gl: GL): void;
}

const ENDLESS_REACH = 2.45;

function compile(gl: GL, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    console.error('[topographic] shader compile failed:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function buildMesh(segments: number, block: boolean, height: Heightfield | null): { data: Float32Array; index: Uint16Array; topCount: number; count: number } {
  const n = segments;
  const verts: number[] = [];
  const at = (u: number, v: number) => (height ? sampleGrid(height, u, v) : 0);
  const push = (u: number, v: number, side: number, lift: number, h: number) => { verts.push(u, v, side, lift, h); };
  for (let y = 0; y <= n; y++) for (let x = 0; x <= n; x++) push(x / n, y / n, 0, 1, at(x / n, y / n));
  const idx: number[] = [];
  const id = (x: number, y: number) => y * (n + 1) + x;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const a = id(x, y), b = id(x + 1, y), c = id(x, y + 1), d = id(x + 1, y + 1);
      idx.push(a, c, b, b, c, d);
    }
  }
  const topCount = idx.length;
  if (block) {
    const wall = (pts: [number, number][]) => {
      const base = verts.length / 5;
      for (const [u, v] of pts) { push(u, v, 1, 1, at(u, v)); push(u, v, 1, 0, 0); }
      for (let i = 0; i < pts.length - 1; i++) {
        const a = base + i * 2;
        idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
      }
    };
    const line = (axis: 'u' | 'v', fixed: number, from: number, to: number) => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const t = from + ((to - from) * i) / n;
        pts.push(axis === 'u' ? [t, fixed] : [fixed, t]);
      }
      return pts;
    };
    wall(line('u', 0, 0, 1));
    wall(line('u', 1, 1, 0));
    wall(line('v', 1, 0, 1));
    wall(line('v', 0, 1, 0));
  }
  return { data: new Float32Array(verts), index: new Uint16Array(idx), topCount, count: idx.length };
}

export function createTerrainPass(): TerrainPass {
  let program: WebGLProgram | null = null;
  let vbo: WebGLBuffer | null = null;
  let ibo: WebGLBuffer | null = null;
  let ok = false;
  let failed = false;
  let segments = -1;
  let block = true;
  let topCount = 0;
  let count = 0;
  let mesh = 0;
  let builtHeight = -1;
  const locations = new Map<string, WebGLUniformLocation | null>();
  const sent = new Map<string, string>();

  function loc(gl: GL, name: string): WebGLUniformLocation | null {
    if (!program) return null;
    if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
    return locations.get(name) ?? null;
  }

  function set1(gl: GL, name: string, value: number): void {
    const key = String(value);
    if (sent.get(name) === key) return;
    sent.set(name, key);
    const at = loc(gl, name);
    if (at) gl.uniform1f(at, value);
  }

  function setv(gl: GL, name: string, value: ArrayLike<number>): void {
    const key = Array.prototype.join.call(value, ',');
    if (sent.get(name) === key) return;
    sent.set(name, key);
    const at = loc(gl, name);
    if (!at) return;
    if (name === 'uParams') gl.uniform1fv(at, value as Float32Array);
    else if (value.length === 2) gl.uniform2f(at, value[0], value[1]);
    else gl.uniform4f(at, value[0], value[1], value[2], value[3]);
  }

  function init(gl: GL, webgl2: boolean): boolean {
    if (program || failed) return ok;
    const vs = compile(gl, gl.VERTEX_SHADER, terrainVertexSource(webgl2));
    const fs = compile(gl, gl.FRAGMENT_SHADER, terrainFragmentSource(webgl2));
    if (!vs || !fs) { failed = true; return false; }
    program = gl.createProgram();
    if (!program) { failed = true; return false; }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aUV');
    gl.bindAttribLocation(program, 1, 'aSide');
    gl.bindAttribLocation(program, 2, 'aLift');
    gl.bindAttribLocation(program, 3, 'aHeight');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
      console.error('[topographic] 3D program link failed:', gl.getProgramInfoLog(program));
      failed = true;
      program = null;
      return false;
    }
    vbo = gl.createBuffer();
    ibo = gl.createBuffer();
    ok = true;
    return true;
  }

  function rebuild(gl: GL, nextSegments: number, nextBlock: boolean, height: Heightfield | null, heightVersion: number): void {
    const meshData = buildMesh(nextSegments, nextBlock, height);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, meshData.data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshData.index, gl.STATIC_DRAW);
    segments = nextSegments;
    block = nextBlock;
    builtHeight = heightVersion;
    topCount = meshData.topCount;
    count = meshData.count;
    mesh = nextSegments;
  }

  return {
    get mesh() { return mesh; },
    get ok() { return ok; },
    draw(gl, webgl2, frame) {
      if (!init(gl, webgl2) || !program) return;
      const { settings, theme, pose } = frame;
      const nextSegments = meshResolution(settings.detail);
      const nextBlock = settings.extent === 'block';
      gl.useProgram(program);
      if (nextSegments !== segments || nextBlock !== block || frame.heightVersion !== builtHeight) {
        sent.clear();
        rebuild(gl, nextSegments, nextBlock, frame.field, frame.heightVersion);
      }
      const stride = 20;
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 16);
      const heightSampler = loc(gl, 'uHeightTex');
      if (heightSampler) gl.uniform1i(heightSampler, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.BLEND);
      gl.clearColor(theme.paper[0], theme.paper[1], theme.paper[2], theme.paper[3]);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const u = toUniforms(settings);
      setv(gl, 'uParams', u.uParams);
      set1(gl, 'uStyle', u.uStyle);
      set1(gl, 'uSeed', u.uSeed);
      set1(gl, 'uCenter', u.uCenter);
      set1(gl, 'uFade', u.uFade);
      set1(gl, 'uDark', theme.dark);
      setv(gl, 'uInk', theme.ink);
      setv(gl, 'uPaper', theme.paper);
      setv(gl, 'uRes', [frame.width, frame.height]);
      set1(gl, 'uTime', frame.frameMs / 1000);
      set1(gl, 'uCol', frame.col);
      set1(gl, 'uHeight', settings.elevation);
      set1(gl, 'uHasHeight', frame.field ? 1 : 0);
      set1(gl, 'uHeightAspect', frame.field?.aspect || 1);
      set1(gl, 'uReach', nextBlock ? 1 : ENDLESS_REACH);
      const vp = loc(gl, 'uViewProj');
      if (vp) gl.uniformMatrix4fv(vp, false, viewProjection(pose, frame.width / frame.height));
      if (!nextBlock) {
        gl.drawElements(gl.TRIANGLES, topCount, gl.UNSIGNED_SHORT, 0);
        return;
      }
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.5, 1.5);
      gl.drawElements(gl.TRIANGLES, count - topCount, gl.UNSIGNED_SHORT, topCount * 2);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.drawElements(gl.TRIANGLES, topCount, gl.UNSIGNED_SHORT, 0);
    },
    dispose(gl) {
      if (program) gl.deleteProgram(program);
      if (vbo) gl.deleteBuffer(vbo);
      if (ibo) gl.deleteBuffer(ibo);
      program = null;
      vbo = null;
      ibo = null;
      ok = false;
      failed = false;
      segments = -1;
      builtHeight = -1;
      locations.clear();
      sent.clear();
    },
  };
}
