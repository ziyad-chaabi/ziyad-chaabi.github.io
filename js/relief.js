(() => {
// « Relief » : un champ de hauteur (bruit + sommets) dessiné en courbes de niveau, en WebGL2.
// Sert au hero (terrain + portrait), au fond de la section des projets et aux études de cas.
// Le portrait : sa carte de hauteur plie le terrain ; la traînée du curseur (uTrail) fait « monter l'eau »
// et la vraie photo apparaît palier par palier, du plus bas au plus haut. Au bord de l'eau, les courbes passent en orange.

const VERT = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uTime, uSeed, uPeaks, uRough, uLevels, uDark;
uniform vec3 uPointer;   // xy en uv, z = force
uniform vec2 uCam;       // décalage du terrain (profondeur au défilement)
uniform vec3 uInk, uPaper, uAccent;
// uImg : R + B = hauteur du visage sur 16 bits, G = silhouette ; uPhoto : la photo ; uTrail : la traînée (R) ; uImgRect : zone du portrait en uv
uniform sampler2D uImg, uPhoto, uTrail; uniform float uImgAmt; uniform vec4 uImgRect;

vec2 imgUv(vec2 uv){ return (uv - uImgRect.xy) / uImgRect.zw; }
float imgMask(vec2 q){ return smoothstep(0., .1, q.x) * smoothstep(1., .9, q.x) * smoothstep(0., .08, q.y) * smoothstep(1., .92, q.y) * uImgAmt; }

float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){ float a = .5, s = 0.; for(int i = 0; i < 5; i++){ s += a * noise(p); p = p * 2.03 + 17.1; a *= .5; } return s; }

float height(vec2 uv){
  vec2 asp = vec2(uRes.x / uRes.y, 1.);
  vec2 p = uv * asp + uCam;
  float t = uTime * .03;
  vec2 w = vec2(fbm(p * 1.4 + uSeed + t), fbm(p * 1.4 - uSeed * 1.7 - t));
  float h = fbm(p * 1.8 + w * .9 + uSeed) * uRough;
  for(int i = 0; i < 7; i++){
    if(float(i) >= uPeaks) break;
    vec2 c = vec2(h21(vec2(uSeed, float(i))), h21(vec2(float(i), uSeed + 3.1))) * .8 + .1;
    c += .03 * vec2(sin(t * 3. + float(i)), cos(t * 2.4 + float(i)));
    float r = .12 + .14 * h21(vec2(uSeed + float(i), 9.));
    h += (.55 + .45 * h21(vec2(float(i) * 7., uSeed))) * exp(-dot(p - c * asp, p - c * asp) / (r * r));
  }
  vec2 q = imgUv(uv); float m = imgMask(q);
  vec4 px = texture(uImg, vec2(q.x, 1. - q.y));
  return mix(h, h * .45, px.g * m) + dot(px.rb, vec2(65280., 255.)) / 65535. * 1.2 * m;
}

void main(){
  vec2 asp = vec2(uRes.x / uRes.y, 1.);
  // autour du curseur, les courbes s'écartent un peu
  vec2 d = (vUv - uPointer.xy) * asp;
  float near = exp(-dot(d, d) / .02) * uPointer.z;
  float h = height(vUv - d / asp * near * .3);
  float v = h * uLevels;
  float f = abs(fract(v - .5) - .5) / max(fwidth(v), 1e-4);
  bool major = mod(floor(v + .5), 5.) == 0.;
  float line = 1. - smoothstep(0., major ? 1.6 : .9, f);
  vec3 base = mix(uPaper, uPaper * (uDark > .5 ? 1.25 : .965), smoothstep(.2, 1.4, h));
  o = vec4(mix(base, major ? uAccent : uInk, line * (major ? (uDark > .5 ? .6 : .8) : (uDark > .5 ? .3 : .26))), 1.);

  vec2 q = imgUv(vUv); float m = imgMask(q);
  if(m > 0.){
    float tr = clamp((texture(uTrail, vec2(q.x, 1. - q.y)).r - .05) / .95, 0., 1.);
    float lvl = tr * 1.9;                       // l'eau monte avec la traînée, jusqu'au-dessus du plus haut sommet
    float tier = (floor(v) + 1.) / uLevels;     // le palier de ce point : il apparaît d'un coup, courbe par courbe
    float wet = smoothstep(tier - .012, tier + .012, lvl) * m;
    o.rgb = mix(o.rgb, texture(uPhoto, vec2(q.x, 1. - q.y)).rgb, wet);
    float shore = (1. - smoothstep(0., 1.4 / uLevels, abs(h - lvl))) * smoothstep(.02, .1, tr) * m;
    o.rgb = mix(o.rgb, uAccent, line * shore);
  }
}`;

const hex = c => { const n = parseInt(String(c).trim().slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const seedOf = s => { let x = 0; for (const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) % 9973; return x / 97.3; };

function createRelief(canvas, o = {}) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, antialias: false, alpha: false });
  if (!gl) return null;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uRes', 'uTime', 'uSeed', 'uPeaks', 'uRough', 'uLevels', 'uDark', 'uPointer', 'uCam', 'uInk', 'uPaper', 'uAccent', 'uImg', 'uPhoto', 'uTrail', 'uImgAmt', 'uImgRect']) U[n] = gl.getUniformLocation(prog, n);
  gl.uniform1i(U.uImg, 0); gl.uniform1i(U.uPhoto, 1); gl.uniform1i(U.uTrail, 2);

  const state = { time: 0, seed: 3.3, peaks: 3, rough: .6, levels: 14, dark: 0, pointer: [.5, .5, 0], cam: [0, 0], imgAmt: 0, imgRect: [0, 0, 1, 1], ink: '#121417', paper: '#EEF0EB', accent: '#D2602A', ...o };
  const dpr = Math.min(devicePixelRatio || 1, o.maxDpr || 1.5);
  // une texture par unité, réutilisée (la traînée est envoyée à chaque image)
  const tex = [];
  function setImage(img, unit = 0) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    if (!tex[unit]) {
      tex[unit] = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex[unit]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } else gl.bindTexture(gl.TEXTURE_2D, tex[unit]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  }
  // sans portrait, les unités pointent vers un pixel noir (pas d'avertissement « texture manquante »)
  const blank = new Uint8Array([0, 0, 0, 255]);
  for (const u of [0, 1, 2]) { gl.activeTexture(gl.TEXTURE0 + u); tex[u] = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex[u]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blank);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
  function resize() {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr)); canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function render(extra) {
    if (extra) Object.assign(state, extra);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, state.time); gl.uniform1f(U.uSeed, state.seed); gl.uniform1f(U.uPeaks, state.peaks);
    gl.uniform1f(U.uRough, state.rough); gl.uniform1f(U.uLevels, state.levels); gl.uniform1f(U.uDark, state.dark);
    gl.uniform3fv(U.uPointer, state.pointer); gl.uniform2fv(U.uCam, state.cam);
    gl.uniform1f(U.uImgAmt, state.imgAmt); gl.uniform4fv(U.uImgRect, state.imgRect);
    gl.uniform3fv(U.uInk, hex(state.ink)); gl.uniform3fv(U.uPaper, hex(state.paper)); gl.uniform3fv(U.uAccent, hex(state.accent));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  resize();
  return { state, render, resize, setImage, canvas };
}

window.Relief = { createRelief, seedOf };
})();
