import { COMMON, COMMON_MATH, COMMON_UNIFORMS, wrapFragment } from './common.glsl.js';
import { CONTOUR_FIELD, CONTOUR_PAINT } from './topographic.glsl.js';

const VERT_BODY = /* glsl */ `
attribute vec2 aUV;
attribute float aSide;
attribute float aLift;
attribute float aHeight;
uniform mat4 uViewProj;
uniform float uHeight;
uniform float uReach;
varying vec2 vP;
varying vec3 vWorld;
varying float vSide;
varying vec2 vUV;
${COMMON_UNIFORMS}
${COMMON_MATH}
${CONTOUR_FIELD}
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
  float y=0.;
  if(aLift>0.5){
    if(uHasHeight>0.5) y=0.02+uHeight*aHeight*.62;
    else y=0.05+reliefOf(contourField(int(uStyle+.5), p).f);
  }
  vec3 world=vec3(p.x*.9, y, p.y*.9);
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
vec4 strata(float y){
  float spacing=.05;
  float cell=y/spacing;
  float fw=max(fwidth(cell),1e-3);
  float d=abs(fract(cell));
  d=min(d,1.-d);
  float idx=abs(floor(cell+.5));
  float isIx=mod(idx,5.)<.5?1.:0.;
  float px=.11+.07*isIx;
  float line=(1.-smoothstep(px*fw*.45, px*fw*.45+fw, d))*(1.+.25*isIx);
  float rim=1.-smoothstep(.004,.012+fwidth(y), abs(y-0.012));
  return paint(uInk.rgb, max(line, rim*.65)*.9*max(uParams[2],.35));
}
void main(){
  int s=int(uStyle+.5);
  vec4 color=vSide>0.5 ? strata(vWorld.y) : contourPaint(s, vP);
  if(uReach>1.01 && vSide<0.5){
    float e=length((vUV-0.5)*2.);
    color=mix(color, vec4(uPaper.rgb,uPaper.a), smoothstep(.58,1.,e));
  }
  vec3 n=cross(dFdx(vWorld), dFdy(vWorld));
  float lenN=length(n);
  float ndl=lenN>1e-5 ? abs(dot(n/lenN, normalize(vec3(-.32,.88,.36)))) : 1.;
  color.rgb*=mix(.76,1.,ndl);
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
