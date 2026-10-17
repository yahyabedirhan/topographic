export const COMMON_UNIFORMS = /* glsl */ `
uniform vec2 uRes;
uniform float uTime;
uniform float uDark;
uniform float uParams[16];// see params.ts for the slot of each setting
uniform float uFade;
uniform float uCol;
uniform float uCenter;
uniform float uStyle;
uniform float uSeed;
uniform vec4 uInk;
uniform vec4 uPaper;
uniform float uHasHeight;
uniform float uHeightAspect;
// 2D only: the field point at the view centre (xy) and the zoom (z).
uniform vec3 uView;
`;

export const COMMON_MATH = /* glsl */ `
vec2 seedOffset(){ return step(.5,uSeed)*vec2(fract(sin(uSeed*12.9898)*43758.5453), fract(sin(uSeed*78.233)*43758.5453))*97.; }
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){p+=seedOffset();float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
float smin(float a, float b, float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
float S(float r){ return smoothstep(.03,.3,r); }
`;

export const COMMON_FRAG = /* glsl */ `
float granite(vec2 p){ return .55*fbm(p*9.)+.25*fbm(p*38.)+.2*hash(floor(gl_FragCoord.xy*.7)); }
float colMask(vec2 p){ return mix(1., smoothstep(uCol*.75, uCol*1.5, abs(p.x)), uFade*(1.-uCenter)); }

vec4 paint(vec3 c, float a){
  a=clamp(a,0.,1.)*uInk.a;
  if(uPaper.a>.999){
    vec3 light=mix(uPaper.rgb,c,a); vec3 dark=uPaper.rgb+c*a*.62;
    return vec4(mix(light,dark,uDark),1.);
  }
  float oa=a+uPaper.a*(1.-a);
  return vec4((c*a+uPaper.rgb*uPaper.a*(1.-a))/max(oa,1e-4),oa);
}
`;

export const COMMON = COMMON_UNIFORMS + COMMON_MATH + COMMON_FRAG;

export const VERTEX_100 = `attribute vec2 aPos; void main(){ gl_Position=vec4(aPos,0.,1.); }`;
export const VERTEX_300 = `#version 300 es
in vec2 aPos; void main(){ gl_Position=vec4(aPos,0.,1.); }`;

export function wrapFragment(body: string, webgl2: boolean): string {
  if (webgl2) {
    return `#version 300 es
precision highp float;
out vec4 fragColor;
#define OUT_COLOR fragColor
${body}`;
  }
  return `#extension GL_OES_standard_derivatives : enable
precision highp float;
#define OUT_COLOR gl_FragColor
${body}`;
}
