import { COMMON, COMMON_MATH, COMMON_UNIFORMS, wrapFragment } from './common.glsl.js';
import { CONTOUR_FIELD, CONTOUR_PAINT } from './topographic.glsl.js';

// The top surface's height, shared so the walls can shade relative to the rim above them.
const SURFACE = /* glsl */ `
uniform float uHeight;
float reliefOf(float f){
  float n=max(uParams[0],1.);
  float h=clamp(uHeight,0.,1.);
  float u=f/n;
  float sigma=mix(1.15,.92,h);
  float x=u+.18;
  float dome=exp(-(x*x)/(sigma*sigma));
  float shoulder=1.-smoothstep(0.,.55,abs(x)/sigma);
  dome=mix(dome, mix(dome,1.,.35), shoulder);
  return h*dome*mix(.6,.8,h);
}
float surfaceY(vec2 p, float h){
  if(uHasHeight>0.5) return 0.02+uHeight*h*.62;
  return 0.05+reliefOf(contourField(int(uStyle+.5), p).f);
}
`;

const VERT_BODY = /* glsl */ `
attribute vec2 aUV;
attribute float aSide;
attribute float aLift;
attribute float aHeight;
uniform mat4 uViewProj;
uniform float uReach;
varying vec2 vP;
varying vec3 vWorld;
varying float vSide;
varying vec2 vUV;
${COMMON_UNIFORMS}
${COMMON_MATH}
${CONTOUR_FIELD}
${SURFACE}
void main(){
  vec2 stretched=(aUV-0.5)*uReach;
  float viewA=uRes.x/max(uRes.y,1.);
  vec2 fp=vec2(viewA,1.);
  if(uHasHeight>0.5){
    float ra=max(uHeightAspect,.05);
    float s=min(min(viewA,1.15)/ra, 1.);
    fp=vec2(ra*s, s);
  }
  vec2 p=vec2(stretched.x*fp.x, stretched.y*fp.y);
  float y=aLift>0.5 ? surfaceY(p, aHeight) : 0.;
  vec3 world=vec3(p.x*.9, y, -p.y*.9);
  vP=p; vWorld=world; vSide=aSide; vUV=aUV;
  gl_Position=uViewProj*vec4(world,1.);
}
`;

const FRAG_BODY = /* glsl */ `
varying vec2 vP;
varying vec3 vWorld;
varying float vSide;
varying vec2 vUV;
#define REGION_FROM_MESH 1
uniform float uReach;
${COMMON}
${CONTOUR_FIELD}
${CONTOUR_PAINT}
${SURFACE}
#define LIGHT_DIR normalize(vec3(-.32,.88,.36))
// Walls stay close to the paper: a soft tint just under the rim that fades into the page at the base,
// a touch lighter on the face that turns towards the light.
vec4 wallPaint(){
  float top=max(surfaceY(vP, regionSample(vUV)),1e-3);
  float t=clamp(vWorld.y/top,0.,1.);
  vec3 n=cross(dFdx(vWorld), dFdy(vWorld));
  float face=length(n.xz)>1e-6 ? dot(normalize(n.xz), normalize(LIGHT_DIR.xz)) : 0.;
  return paint(uInk.rgb, .15*t*t*(1.+.18*face));
}
void main(){
  int s=int(uStyle+.5);
  if(vSide>0.5){ OUT_COLOR=wallPaint(); return; }
  vec4 color=contourPaint(s, vP);
  vec3 n=cross(dFdx(vWorld), dFdy(vWorld));
  float lenN=length(n);
  float ndl=lenN>1e-5 ? abs(dot(n/lenN, LIGHT_DIR)) : 1.;
  float floorShade=uHasHeight>0.5 ? .9 : .76;
  color.rgb*=mix(floorShade,1.,ndl);
  // Fade to the clear colour after shading, so the endless plane's edge meets the paper exactly.
  if(uReach>1.01){
    float e=length((vUV-0.5)*2.);
    color=mix(color, vec4(uPaper.rgb,uPaper.a), smoothstep(.58,1.,e));
  }
  OUT_COLOR=color;
}
`;

function asWebGL2(source: string, direction: 'in' | 'out'): string {
  return source.replace(/attribute /g, 'in ').replace(/varying /g, `${direction} `);
}

export function terrainVertexSource(webgl2: boolean): string {
  const body = webgl2 ? asWebGL2(VERT_BODY, 'out') : VERT_BODY;
  return webgl2 ? `#version 300 es\nprecision highp float;\n${body}` : `precision highp float;\n${body}`;
}

export function terrainFragmentSource(webgl2: boolean): string {
  const body = webgl2 ? asWebGL2(FRAG_BODY, 'in') : FRAG_BODY;
  return wrapFragment(body, webgl2);
}
