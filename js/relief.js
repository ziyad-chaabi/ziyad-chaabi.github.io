(() => {
// « Relief » : un champ de hauteur (bruit + sommets) dessiné en courbes de niveau, en WebGL2.
// Le même shader sert au fond des pages, aux couvertures de projets et aux transitions (mode inondation).

const VERT = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uTime, uSeed, uPeaks, uRough, uLevels, uMode, uProgress, uDark, uReveal;
uniform vec3 uPointer; // xy en uv, z = force
uniform vec3 uInk, uPaper, uAccent;
// portrait : R + B = hauteur sur 16 bits (floutée), G = silhouette ; uPhoto = la photo en couleur ; uImgRect = zone en uv (x, y, l, h)
uniform sampler2D uImg, uPhoto; uniform float uImgAmt, uLens; uniform vec4 uImgRect; // uLens : rayon de la loupe

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
  vec2 p = uv * asp;
  float t = uTime * .035;
  // déformation lente du terrain (domain warping)
  vec2 w = vec2(fbm(p * 1.4 + uSeed + t), fbm(p * 1.4 - uSeed * 1.7 - t));
  float h = fbm(p * 1.8 + w * .9 + uSeed) * uRough;
  // sommets placés par la graine du projet
  for(int i = 0; i < 7; i++){
    if(float(i) >= uPeaks) break;
    vec2 c = vec2(h21(vec2(uSeed, float(i))), h21(vec2(float(i), uSeed + 3.1))) * .8 + .1;
    c += .03 * vec2(sin(t * 3. + float(i)), cos(t * 2.4 + float(i)));
    float r = .12 + .14 * h21(vec2(uSeed + float(i), 9.));
    h += (.55 + .45 * h21(vec2(float(i) * 7., uSeed))) * exp(-dot((p - c * asp), (p - c * asp)) / (r * r));
  }
  // le terrain se plie pour dessiner le visage
  vec2 q = imgUv(uv); float m = imgMask(q);
  vec4 px = texture(uImg, vec2(q.x, 1. - q.y));
  // le terrain continue derrière le visage (plus calme sous la silhouette), le visage s'y ajoute : pas de cadre ni d'angle droit
  h = mix(h, h * .45, px.g * m) + dot(px.rb, vec2(65280., 255.)) / 65535. * 1.2 * m;
  // le curseur soulève le terrain (pas sur le visage, qu'il déformerait)
  vec2 d = (uv - uPointer.xy) * asp;
  h += uPointer.z * .9 * exp(-dot(d, d) / .018) * (1. - m);
  return h;
}

void main(){
  float h = height(vUv);
  float v = h * uLevels;
  float fw = fwidth(v);
  float f = abs(fract(v - .5) - .5) / max(fw, 1e-4);
  bool major = mod(floor(v + .5), 5.) == 0.;
  float line = 1. - smoothstep(0., major ? 1.6 : .9, f);

  if(uMode < .5){
    // carte : papier, courbes fines à l'encre, courbes maîtresses en couleur
    vec3 base = mix(uPaper, uPaper * (uDark > .5 ? 1.25 : .965), smoothstep(.2, 1.4, h));
    vec3 lc = major ? uAccent : uInk;
    float a = major ? .85 : (uDark > .5 ? .32 : .26);
    o = vec4(mix(base, lc, line * a), 1.);
    // sous le curseur, la vraie photo apparaît en couleur, avec son décor
    vec2 q = imgUv(vUv); float m = imgMask(q);
    if(m > 0.){
      vec2 asp = vec2(uRes.x / uRes.y, 1.);
      float lens = (1. - smoothstep(uLens, uLens + .006, length((vUv - uPointer.xy) * asp))) * uPointer.z * m;
      vec3 photo = texture(uPhoto, vec2(q.x, 1. - q.y)).rgb;
      o.rgb = mix(o.rgb, photo, lens);
    }
  } else {
    // inondation : l'encre monte jusqu'à couvrir tout l'écran
    float lvl = uProgress * 2.4 - .3;
    // à 100 %, plus aucun sommet ne dépasse : sinon la page transparaissait par endroits pendant le chargement
    float inside = max(smoothstep(lvl + .012, lvl - .012, h), step(.999, uProgress));
    float edge = 1. - smoothstep(0., 2.2, abs(h - lvl) / max(fwidth(h), 1e-4));
    // une bande de courbes juste au-dessus du rivage, qui s'éteint avec le voile
    // (avant : des courbes sur toute la zone découverte, qui disparaissaient d'un coup à la fin)
    float ring = line * (1. - smoothstep(lvl, lvl + .3, h)) * (1. - inside) * smoothstep(0., .25, uProgress);
    vec3 col = mix(uAccent, uInk, inside);
    // chargement : les courbes se « relèvent » des sommets vers la plaine
    float survey = line * inside * smoothstep(1.5 - uReveal * 1.9, 1.56 - uReveal * 1.9, h) * min(uReveal * 6., 1.);
    col = mix(col, major ? uAccent : vec3(.42, .45, .5), survey * (major ? .95 : .6));
    float a = max(inside, max(edge, ring * .55));
    o = vec4(col * a, a);
  }
}`;

const hex = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const seedOf = s => { let x = 0; for (const ch of String(s)) x = (x * 31 + ch.charCodeAt(0)) % 9973; return x / 97.3; };

function createRelief(canvas, o = {}) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true, preserveDrawingBuffer: !!o.preserve });
  if (!gl) return null;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uRes', 'uTime', 'uSeed', 'uPeaks', 'uRough', 'uLevels', 'uMode', 'uProgress', 'uDark', 'uReveal', 'uPointer', 'uInk', 'uPaper', 'uAccent', 'uImg', 'uPhoto', 'uImgAmt', 'uImgRect', 'uLens']) U[n] = gl.getUniformLocation(prog, n);

  const state = { imgAmt: 0, imgRect: [0, 0, 1, 1], lens: .13, time: 0, seed: 3.3, peaks: 3, rough: .6, levels: 14, mode: 0, progress: 0, dark: 0, reveal: 0, pointer: [.5, .5, 0], ink: '#121417', paper: '#EEF0EB', accent: '#D2602A', ...o };
  const dpr = Math.min(devicePixelRatio || 1, o.maxDpr || 1.5);
  function resize(w = canvas.clientWidth, h = canvas.clientHeight) {
    canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function render(extra) {
    if (extra) Object.assign(state, extra);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, state.time); gl.uniform1f(U.uSeed, state.seed); gl.uniform1f(U.uPeaks, state.peaks);
    gl.uniform1f(U.uRough, state.rough); gl.uniform1f(U.uLevels, state.levels); gl.uniform1f(U.uMode, state.mode);
    gl.uniform1f(U.uProgress, state.progress); gl.uniform1f(U.uDark, state.dark); gl.uniform1f(U.uReveal, state.reveal); gl.uniform3fv(U.uPointer, state.pointer);
    gl.uniform1f(U.uImgAmt, state.imgAmt); gl.uniform1f(U.uLens, state.lens); gl.uniform4fv(U.uImgRect, state.imgRect); gl.uniform1i(U.uImg, 0); gl.uniform1i(U.uPhoto, 1);
    gl.uniform3fv(U.uInk, hex(state.ink)); gl.uniform3fv(U.uPaper, hex(state.paper)); gl.uniform3fv(U.uAccent, hex(state.accent));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function setImage(img, unit = 0) {
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  resize();
  return { gl, state, render, resize, setImage, canvas };
}

// Couvertures : un seul contexte WebGL hors écran, copié dans des <canvas> 2D.
let coverGL;
function paintCover(target, p, extra = {}) {
  const w = extra.w || target.clientWidth || 800, h = extra.h || target.clientHeight || 500;
  if (!coverGL) {
    const c = document.createElement('canvas');
    coverGL = createRelief(c, { preserve: true, maxDpr: 1.5 });
    if (!coverGL) return false;
  }
  coverGL.canvas.style.width = w + 'px'; coverGL.canvas.style.height = h + 'px';
  coverGL.resize(w, h);
  coverGL.render({ time: 40, seed: seedOf(p.slug || p.title), peaks: p.relief?.peaks ?? 3, rough: p.relief?.rough ?? .5, levels: 16, mode: 0, dark: 0, pointer: [.5, .5, 0], accent: p.color || '#D2602A', paper: '#EEF0EB', ink: '#121417', ...extra, w: undefined, h: undefined });
  target.width = coverGL.canvas.width; target.height = coverGL.canvas.height;
  target.getContext('2d').drawImage(coverGL.canvas, 0, 0);
  return true;
}

window.Relief = { createRelief, paintCover, seedOf };
})();
