// -- https://xemantic.github.io/shader-web-background/
const shaderWebBackground={};(()=>{'use strict';const t=(a,b)=>{b.initHalfFloatRGBATexture(b.width,b.height);a.texParameteri(a.TEXTURE_2D,
a.TEXTURE_MIN_FILTER,a.LINEAR);a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,
a.LINEAR);a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE);a.texParameteri(a.TEXTURE_2D,
a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE)},x=(a,b)=>{console.warn("shader-web-background cannot shade, adding fallback CSS classes");
document.documentElement.classList.add("shader-web-background-fallback");b.classList.add("shader-web-background-fallback");
if(a instanceof shaderWebBackground.GlError)console.warn("Not sufficient WebGL support:",
a);else throw a;};
function y(a,b){if(!a)throw new shaderWebBackground.ConfigError(b);}
function z(a){y(a instanceof HTMLCanvasElement,"config.canvas must be instance of canvas");
return a}
function A(){const a=document.createElement("canvas"),b=a.style;a.id="shader-web-background";b.width=
"100vw";b.height="100vh";b.position="fixed";b.top="0";b.left="0";b.zIndex=-9999;return a}
function B(a,b,c){y(a instanceof HTMLScriptElement&&a.type===b,'Shader source element of id "'+
c+'" should be of type: <script type="'+(b+'" id="'+c+'">'))}
function D(a){const b=document.getElementById(a);y(b,'Missing shader source: <script type="x-shader/x-fragment" id="'+
(a+'">'));B(b,"x-shader/x-fragment",a);return b.text}
function E(a){a+="Vertex";const b=document.getElementById(a);return b?(B(b,"x-shader/x-vertex",
a),b.text):"attribute vec2 V;void main(){gl_Position=vec4(V,0,1);}"}
function F(a,b){"loading"!==document.readyState?b():window.addEventListener(a,b)}
class G{constructor(a,b,c,d){this.g=c;const l=a.gl;this.h=()=>{for(const f of d)f.u(l,
f.location,b)};this.i=()=>{var f=c.v,h=a.gl;h.bindBuffer(h.ARRAY_BUFFER,a.j);h.enableVertexAttribArray(f);
h.vertexAttribPointer(f,2,h.FLOAT,!1,0,0);h.drawArrays(h.TRIANGLE_STRIP,0,4);h.disableVertexAttribArray(f);
h.bindBuffer(h.ARRAY_BUFFER,null);f=a.gl;for(h=0;h<a.g;h++)f.activeTexture(f.TEXTURE0+
h),f.bindTexture(f.TEXTURE_2D,null);a.g=0}}}
function H(a){var b={antialias:!1,depth:!1,alpha:!1};try{return new I(a,b)}catch(c){throw new shaderWebBackground.GlError(c.message);
}}
function J(a,b,c,d,l,f){function h(e,m,n){try{{var k=p;const q=k.gl,P=K(k,e,q.VERTEX_SHADER,m),
Q=K(k,e,q.FRAGMENT_SHADER,n),v=q.createProgram();q.attachShader(v,P);q.attachShader(v,
Q);q.linkProgram(v);var r=v}return r}catch(q){throw new shaderWebBackground.ConfigError(q.message);
}}const p=H(a),w=[],g={gl:p.gl,canvas:a,width:0,height:0,cssPixelRatio:0,cssWidth:0,
cssHeight:0,isOverShader:(e,m)=>{const n=a.getBoundingClientRect();return e>=n.left&&
e<=n.right&&m>=n.top&&m<=n.bottom},toShaderX:e=>(e-a.getBoundingClientRect().left)*
g.cssPixelRatio+.5,toShaderY:e=>a.height-(e-a.getBoundingClientRect().top)*g.cssPixelRatio-
.5,s:()=>g.cssWidth!==a.clientWidth||g.cssHeight!==a.clientHeight?(g.resize(),!0):
!1,resize:()=>{const e=window.devicePixelRatio||1,m=a.clientWidth,n=a.clientHeight,
k=Math.floor(m*e),r=Math.floor(n*e);a.width=k;a.height=r;g.width=k;g.height=r;g.cssPixelRatio=
e;g.cssWidth=m;g.cssHeight=n;p.gl.viewport(0,0,p.canvas.width,p.canvas.height);for(const q of w)q.g.l(k,
r)},texture:(e,m)=>{{var n=p;const k=n.gl;m=m instanceof L?m.g:m;k.activeTexture(k.TEXTURE0+
n.g);k.bindTexture(k.TEXTURE_2D,m);k.uniform1i(e,n.g++)}},buffers:{},initHalfFloatRGBATexture:(e,
m)=>{p.h.g(e,m)}},R=Object.keys(b).length-1;let S=0;for(const e in b){if(S++<R){const k=
b[e].texture||t;g.buffers[e]=M(p,()=>{k(p.gl,g)})}const m=N(p,h(e,E(e),D(e)),g.buffers[e]),
n=b[e].uniforms||{};var u=Object.keys(n);for(const k of m.m)y(n[k.name],'No configuration for uniform "'+
k.name+'" defined in shader "'+e+'"'),u=u.filter(r=>r!==k.name);0!==u.length&&console.warn('Extra uniforms configured for shader "'+
e+'", which are not present in the shader code - might have been removed by GLSL compiler if not used: '+
u.join(", "));u=m.m.map(k=>({location:k.location,u:n[k.name]}));w.push(new G(p,g,
m,u))}const C=()=>{g.s()&&d&&d(g.width,g.height,g);l&&l(g);for(const e of w)e.g.i(e.h,
e.i);f&&f(g);requestAnimationFrame(C)};F("load",()=>{g.resize();c&&c(g);d&&d(g.width,
g.height,g);requestAnimationFrame(C)});return g}
shaderWebBackground.Error=class extends Error{constructor(a){super(a);this.name="shaderWebBackground.Error"}};
shaderWebBackground.ConfigError=class extends shaderWebBackground.Error{constructor(a){super(a);
this.name="shaderWebBackground.ConfigError"}};
shaderWebBackground.GlError=class extends shaderWebBackground.Error{constructor(a){super(a);this.name=
"shaderWebBackground.GlError"}};
shaderWebBackground.shade=function(a){y(a,"Missing config argument");const b=a.canvas?
z(a.canvas):A();y(a.shaders,"No shaders specified in config");try{const c=J(b,a.shaders,
a.onInit,a.onResize,a.onBeforeFrame,a.onAfterFrame);a.canvas||F("DOMContentLoaded",
()=>{document.body.appendChild(b)});return c}catch(c){(a.onError||x)(c,b)}};const O=[-1,1,1,1,-1,-1,1,-1];
function T(a,b){return a.j(a.gl.getExtension(b),b+" extension is not supported")}
class U{constructor(a,b){this.gl=a;this.j=b}g(){}}
class V extends U{constructor(a,b){super(a,b);this.h=T(this,"OES_texture_half_float");
T(this,"OES_texture_half_float_linear")}g(a,b){const c=this.gl;c.texImage2D(c.TEXTURE_2D,
0,c.RGBA,a,b,0,c.RGBA,this.h.HALF_FLOAT_OES,null)}}
class W extends U{constructor(a,b){super(a,b);T(this,"EXT_color_buffer_float");this.gl.getExtension("OES_texture_float_linear")}g(a,
b){const c=this.gl;c.texImage2D(c.TEXTURE_2D,0,c.RGBA16F,a,b,0,c.RGBA,c.HALF_FLOAT,
null)}}
function X(a){a=a.split(/\r?\n/);const b=a.length.toString().length;var c=[];a.forEach((d,
l)=>{l=(l+1).toString();l=l.length>=b?l:" ".repeat(b-l.length)+l;c.push(l+": "+d+
"\n")});return c.join("")}function M(a,b){return new L(a.gl,()=>{b(a.gl)})}
function N(a,b,c){const d=a.gl;a=[];const l=d.getProgramParameter(b,d.ACTIVE_UNIFORMS);
for(let f=0;f<l;f++){const h=d.getActiveUniform(b,f);a.push({name:h.name,location:d.getUniformLocation(b,
h.name)})}return{v:d.getAttribLocation(b,"V"),m:a,l:c?(f,h)=>c.l(f,h):()=>{},i:(f,
h)=>{d.useProgram(b);f();c?(f=c.g,c.g=c.h,c.h=f,c.i(h)):h()}}}
function K(a,b,c,d){a=a.gl;c=a.createShader(c);a.shaderSource(c,d);a.compileShader(c);
if(!a.getShaderParameter(c,a.COMPILE_STATUS)){const l=String(a.getShaderInfoLog(c));
a.deleteShader(c);b="Cannot compile shader - "+b+": "+l;console.log(b);console.log(X(d));
throw Error(b);}return c}
class I{constructor(a,b){this.canvas=a;const c=(l,f)=>{if(!l)throw Error(f);return l};
let d=a.getContext("webgl2",b);if(d)this.h=new W(d,c);else if(d=a.getContext("webgl",
b))this.h=new V(d,c);c(d,"webgl context not supported on supplied canvas element: "+
a);this.gl=d;a=d.createBuffer();d.bindBuffer(d.ARRAY_BUFFER,a);d.bufferData(d.ARRAY_BUFFER,
new Float32Array(O),d.STATIC_DRAW);d.bindBuffer(d.ARRAY_BUFFER,null);this.j=a;this.buffers=
{};this.g=0}}
function Y(a){const b=a.gl,c=b.createTexture();b.bindTexture(b.TEXTURE_2D,c);a.o(b);
b.bindTexture(b.TEXTURE_2D,null);return c}
class L{constructor(a,b){this.j=a.createFramebuffer();this.gl=a;this.o=b;this.g=this.h=
null}l(){this.h&&this.gl.deleteTexture(this.h);this.g&&this.gl.deleteTexture(this.g);
this.h=Y(this);this.g=Y(this)}i(a){const b=this.gl;b.bindFramebuffer(b.FRAMEBUFFER,
this.j);b.framebufferTexture2D(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,this.g,
0);a();b.framebufferTexture2D(b.FRAMEBUFFER,b.COLOR_ATTACHMENT0,b.TEXTURE_2D,null,
0);b.bindFramebuffer(b.FRAMEBUFFER,null)}};})()
//# sourceMappingURL=shader-web-background.min.js.map
