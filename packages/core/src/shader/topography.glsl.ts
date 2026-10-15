import { STYLES } from '../styles.js';
import { COMMON } from './common.glsl.js';

const STYLE_DEFINES = STYLES.map((s) => `#define STYLE_${s.id.toUpperCase().replace(/-/g, '_')} ${s.index}`).join('\n');

const FIELD = /* glsl */ `
${STYLE_DEFINES}
#define AX ((1.-uCenter)*.5*uRes.x/uRes.y)

vec4 scenePetal(int s, vec2 p){
  float t=uTime*.08*uParams[3]; vec3 c=uInk.rgb; float n=uParams[0]; float px=uParams[1]; float a=1.;
  float W=uParams[5];
  vec2 w=vec2(fbm(p*1.4+vec2(t,0.)),fbm(p*1.4+vec2(0.,t)+5.))-.5;
  vec2 q=p-vec2(AX*1.05,0.); float r=length(q); float ang=atan(q.y,q.x); float f=0.;
  if(s==STYLE_DRIFTING_LOBES){
    q=rot(t*.35)*(p-vec2(AX*1.1,.14)+w*.3*W); r=length(q); ang=atan(q.y,q.x);
    float lobes=mix(sin(ang*3.+t*2.),sin(ang*4.-t*1.5),uParams[6]);
    f=r*(1.+.25*sin(t*1.3)*q.x/max(r,1e-3))*n*.85+.8*lobes*S(r); a=.95;
  } else if(s==STYLE_GRANITE){
    q=p-vec2(AX*1.0,-.2)+w*.25*W; r=length(q); ang=atan(q.y,q.x);
    f=r*n*1.1+(.35*sin(ang*7.+t*2.)+(fbm(q*2.+t*.5)-.5)*1.4)*S(r); px*=1.2; c*=mix(.7,1.3,granite(p));
  } else if(s==STYLE_FIVE_PETALS){
    q=p-vec2(AX*1.05,-.1)+w*.1*W; r=length(q); ang=atan(q.y,q.x);
    f=r*(1.+.4*sin(t*2.)*q.y/max(r,1e-3))*n*.9+.6*sin(ang*5.+t*4.)*S(r);
  } else if(s==STYLE_SEED_POD){
    q=rot(-t*.5)*(p-vec2(AX*.95,.2)+w*.25*W); r=length(q); ang=atan(q.y,q.x);
    f=r*(1.+.2*sin(t*1.7))*n*.8+(1.1*sin(ang*2.+t*1.2)+.3*sin(ang*6.-t*3.))*S(r);
  }
  float pk=uParams[7], sp=uParams[8], rg=uParams[9], sh=uParams[10], ix=uParams[11], tr=uParams[12];
  for(int k=1;k<6;k++){ if(float(k)<pk-.5){ float fk=float(k);
    vec2 ck=vec2(AX*1.05,0.)+sp*1.2*(.35+.12*fk)*vec2(cos(fk*2.4+t*.2),sin(fk*2.4+t*.2)*.8);
    vec2 qk=p-ck+w*.2*W; r=min(r,length(qk));
    f=smin(f, length(qk)*n*(.85+.08*fk)+.5*sin(atan(qk.y,qk.x)*(2.+fk)+t*2.+fk)*S(length(qk))+fk*.9, 5.); } }
  f+=((fbm(p*3.+t*.3)-.5)*5.+(fbm(p*8.-t*.2)-.5)*2.)*rg*S(r);
  f=sign(f)*pow(abs(f)/n+1e-4,sh)*n;
  f+=tr*.6*sin(f*1.5708)*S(r);
  float rough=1.+rg*4.+(pk-1.)+abs(sh-1.)*3.+tr*2.;
  // atan() jumps a whole turn at the seam; cap fwidth so the seam doesn't draw a dashed line
  float fw=min(fwidth(f), (fwidth(r)*n*3.+1e-4)*rough); float dd=abs(fract(f)-.5);
  float idx=floor(f+.5); float isIx=ix>.5&&mod(idx,floor(ix+.5))<.5?1.:0.; px*=1.+.2*isIx;
  float l=(1.-smoothstep(px*fw*.5, px*fw*.5+fw, .5-dd))*(1.+.15*isIx);
  float beads=smoothstep(.75,1.,sin(ang*40.+t*8.*float(s+1)))*l*uParams[4];
  float m=colMask(p)*smoothstep(2.2,.1,r);
  return paint(c,(l*.75+beads*.7)*a*uParams[2]*m);
}

vec4 sceneShape(int s, vec2 p){
  float t=uTime*.08*uParams[3]; vec3 c=uInk.rgb; float n=uParams[0]; float px=uParams[1]; float W=uParams[5];
  vec2 w=vec2(fbm(p*1.4+vec2(t,0.)),fbm(p*1.4+vec2(0.,t)+5.))-.5;
  vec2 C=vec2(AX*1.05,0.); vec2 q=p-C; float r=length(q); float f=0.;
  if(s==STYLE_GENTLE_SUMMIT){
    q=(p-C-vec2(0.,.05))*mat2(1.,.18,0.,1.15); q+=w*.25*W*S(length(q)); r=length(q);
    f=r*n*.75+.25*sin(atan(q.y,q.x)*2.+t)*S(r);
  } else if(s==STYLE_LONG_RIDGE){
    q=rot(.35)*(p-C); q.y-= .12*sin(q.x*3.+t)+(fbm(q*1.5+t*.3)-.5)*.3*W;
    float d=length(vec2(max(abs(q.x)-.45,0.),q.y)); r=d; f=d*n*.9+(q.x*q.x)*2.+.5;
  } else if(s==STYLE_DUNES){
    q=rot(-.4)*p; f=(q.y+.08*sin(q.x*4.+t*2.)+(fbm(q*vec2(1.,2.5)+t*.2)-.5)*.5*W)*n*.6; r=1.;
  }
  float rg=uParams[9], sh=uParams[10], ix=uParams[11], tr=uParams[12];
  f+=((fbm(p*3.+t*.3)-.5)*5.+(fbm(p*8.-t*.2)-.5)*2.)*rg*S(r);
  f=sign(f)*pow(abs(f)/n+1e-4,sh)*n; f+=tr*.6*sin(f*1.5708)*S(r);
  float fw=max(fwidth(f),1e-4); float dd=abs(fract(f)-.5);
  float idx=floor(f+.5); float isIx=ix>.5&&mod(idx,floor(ix+.5))<.5?1.:0.; px*=1.+.2*isIx;
  float l=(1.-smoothstep(px*fw*.5, px*fw*.5+fw, .5-dd))*(1.+.15*isIx);
  float beads=smoothstep(.75,1.,sin((p.x+p.y)*60.+t*8.))*l*uParams[4];
  return paint(c,(l*.75+beads*.7)*uParams[2]*colMask(p));
}

void main(){
  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  int s=int(uStyle+.5);
  bool petal=s==STYLE_DRIFTING_LOBES||s==STYLE_GRANITE||s==STYLE_FIVE_PETALS||s==STYLE_SEED_POD;
  OUT_COLOR = petal ? scenePetal(s,p) : sceneShape(s,p);
}
`;

/** Fragment shader body (without version header); see wrapFragment. */
export const TOPOGRAPHY_FRAGMENT = COMMON + FIELD;
