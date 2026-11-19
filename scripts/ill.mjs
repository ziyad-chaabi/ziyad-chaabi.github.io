// Dessine la série spatiale au trait (img/ill/<slug>.svg), dans l'esprit des courbes de niveau du site.
// Un astre = un disque, des bandes, des cratères, des anneaux, et des îlots en courbes de niveau pour le relief.
// Le cadrage suit celui de la photo d'origine (même rapport, même silhouette) : la carte de hauteur des emblèmes reste juste.
// node scripts/ill.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const GRAY = '#8B929B', ACC = '#D2602A';
const f = n => +n.toFixed(1);
const rng = s => () => ((s = (s * 16807) % 2147483647) / 2147483647);

// courbe fermée lissée (Catmull-Rom → Bézier) passant par les points
const closed = pts => {
  const n = pts.length, P = i => pts[(i + n) % n];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
};
// îlot en courbes de niveau : contours emboîtés, de plus en plus petits, qui dérivent vers le sommet
function topo(cx, cy, R, seed, { n = 4, amp = .28, sx = 1, sy = 1, acc = 0 } = {}) {
  const r = rng(seed), ph = [r() * 6.3, r() * 6.3, r() * 6.3], dir = r() * 6.3, out = [];
  for (let k = 0; k < n; k++) {
    const s = 1 - k / n * .82, ox = Math.cos(dir) * R * .18 * k / n, oy = Math.sin(dir) * R * .18 * k / n, pts = [];
    for (let i = 0; i < 28; i++) {
      const t = i / 28 * Math.PI * 2, w = 1 + amp * (Math.sin(2 * t + ph[0]) * .5 + Math.sin(3 * t + ph[1]) * .32 + Math.sin(5 * t + ph[2]) * .18);
      pts.push([cx + ox + Math.cos(t) * R * s * w * sx, cy + oy + Math.sin(t) * R * s * w * sy]);
    }
    out.push(`<path${k < acc ? ' class="a"' : ''} d="${closed(pts)}"/>`);
  }
  return out.join('');
}
const circle = (cx, cy, r, c = '') => `<circle${c ? ` class="${c}"` : ''} cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>`;
const ell = (cx, cy, rx, ry, c = '') => `<ellipse${c ? ` class="${c}"` : ''} cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}"/>`;
// ombre propre : le même disque décalé vers la lumière, plusieurs fois ; ses bords dessinent le terminateur
const shade = (cx, cy, r, dx, dy, n = 5) => Array.from({ length: n }, (_, k) => circle(cx + dx * r * (k + 1), cy + dy * r * (k + 1), r)).join('');
// bandes d'une géante : lignes ondulées, inclinées
const bands = (cx, cy, r, ys, { wave = 3, tilt = 0, acc = [] } = {}) => `<g transform="rotate(${tilt} ${f(cx)} ${f(cy)})">${ys.map((y, i) => {
  const Y = cy + y * r, x0 = cx - r * 1.1, step = r * 2.2 / 6;
  let d = `M${f(x0)} ${f(Y)}`; for (let k = 0; k < 6; k++) d += `q${f(step / 2)} ${f((k % 2 ? 1 : -1) * wave)} ${f(step)} 0`;
  return `<path${acc.includes(i) ? ' class="a"' : ''} d="${d}"/>`;
}).join('')}</g>`;
// cratère : rebord et fond
const crater = (x, y, r, c = '') => ell(x, y, r, r * .82, c) + ell(x + r * .12, y + r * .1, r * .55, r * .42);
const craters = (cx, cy, R, seed, n, max) => { const r = rng(seed); let s = ''; for (let i = 0; i < n; i++) { const a = r() * 6.3, d = Math.sqrt(r()) * R * .86; s += crater(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + r() * max); } return s; };
const dots = (cx, cy, R, seed, n, cls = '') => { const r = rng(seed); let s = ''; for (let i = 0; i < n; i++) { const a = r() * 6.3, d = Math.sqrt(r()) * R * .9; s += circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, .5 + r() * .9, r() < .3 ? 'a' : cls); } return s; };
// anneaux : la moitié arrière passe derrière la planète (masque), la moitié avant devant
const rings = (cx, cy, list, tilt, half) => `<g transform="rotate(${tilt} ${f(cx)} ${f(cy)})">${list.map(([rx, ry, c]) =>
  `<path${c ? ` class="${c}"` : ''} d="M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 0 ${half === 'back' ? 1 : 0} ${f(cx + rx)} ${f(cy)}"/>`).join('')}</g>`;

// un astre rond : contour, puis tout le détail découpé dans le disque
const planet = (W, H, body, { r = .46, cx = W / 2, cy = H / 2, light = [-.07, -.06], nShade = 5, edge = '' } = {}) => {
  const R = Math.min(W, H) * r;
  return `<clipPath id="d"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}"/></clipPath>${circle(cx, cy, R, edge)}<g clip-path="url(#d)">${light ? shade(cx, cy, R, light[0], light[1], nShade) : ''}${body(cx, cy, R)}</g>`;
};

const D = {
  jupiter: (W, H) => planet(W, H, (x, y, R) => bands(x, y, R, [-.78, -.62, -.5, -.34, -.2, -.06, .1, .24, .4, .56, .72], { wave: 3.5, tilt: -8, acc: [3, 7] })
    + topo(x + R * .42, y + R * .28, R * .17, 7, { n: 4, sx: 1.5, sy: .8, acc: 2, amp: .12 }) + ell(x - R * .3, y + R * .5, 5, 3)),
  sun: (W, H) => {
    const x = W / 2, y = H / 2, R = W * .36; let rays = '';
    for (let i = 0; i < 48; i++) { const t = i / 48 * 6.283, l = R * (1.08 + (i % 3) * .05), m = R * (1.18 + (i % 4) * .06); rays += `<path${i % 4 ? '' : ' class="a"'} d="M${f(x + Math.cos(t) * l)} ${f(y + Math.sin(t) * l)}L${f(x + Math.cos(t) * m)} ${f(y + Math.sin(t) * m)}"/>`; }
    return rays + planet(W, H, (x, y, R) => [[-.4, -.3, 11], [.3, -.45, 23], [.45, .2, 31], [-.2, .4, 41], [.05, -.02, 53], [-.6, .15, 61]].map(([a, b, s]) => topo(x + a * R, y + b * R, R * .2, s, { n: 3, acc: 3 })).join(''), { r: .36, light: null, edge: 'a' });
  },
  saturne: (W, H) => {
    const x = W * .55, y = H * .5, R = H * .42;
    const list = [[W * .47, H * .2, ''], [W * .43, H * .18, 'a'], [W * .38, H * .16, ''], [W * .33, H * .14, 'd']];
    return `<mask id="m"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}" fill="#000"/></mask><g mask="url(#m)">${rings(x, y, list, -4, 'back')}</g>`
      + `<clipPath id="d"><circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}"/></clipPath>${circle(x, y, R)}<g clip-path="url(#d)">${shade(x, y, R, .08, -.05, 4)}${bands(x, y, R, [-.6, -.35, -.15, .1, .4, .65], { wave: 1.5, tilt: -4, acc: [2] })}</g>`
      + rings(x, y, list, -4, 'front');
  },
  terre: (W, H) => planet(W, H, (x, y, R) => topo(x + R * .15, y - R * .1, R * .42, 3, { n: 5, sx: .8, sy: 1.3, acc: 1 }) + topo(x + R * .62, y - R * .45, R * .2, 5, { n: 3, acc: 1 })
    + topo(x - R * .55, y - R * .55, R * .18, 9, { n: 3, acc: 1 }) + topo(x, y + R * 1.02, R * .5, 4, { n: 3, sx: 1.6, sy: .5, acc: 1 })
    + bands(x, y, R, [-.85, .55, .72], { wave: 4, tilt: 18 }).replace(/<path/g, '<path class="d"')),
  lune: (W, H) => planet(W, H, (x, y, R) => topo(x - R * .25, y - R * .3, R * .32, 12, { n: 3, sx: 1.3 }) + topo(x + R * .25, y - R * .05, R * .22, 14, { n: 3 })
    + topo(x - R * .5, y + R * .15, R * .2, 16, { n: 2 }) + craters(x, y, R, 21, 14, 4) + crater(x - R * .05, y + R * .62, 6, 'a')
    + [0, 1, 2, 3, 4, 5].map(i => { const t = i * 1.05 + .3; return `<path class="d" d="M${f(x - R * .05 + Math.cos(t) * 9)} ${f(y + R * .62 + Math.sin(t) * 8)}L${f(x - R * .05 + Math.cos(t) * 40)} ${f(y + R * .62 + Math.sin(t) * 34)}"/>`; }).join(''), { light: [.06, -.05], nShade: 3 }),
  mars: (W, H) => planet(W, H, (x, y, R) => topo(x - R * .1, y - R * .95, R * .28, 31, { n: 3, sx: 1.4, sy: .5, acc: 3 })
    + `<path class="a" d="M${f(x - R * .75)} ${f(y - R * .02)}c${f(R * .3)} ${f(-R * .1)} ${f(R * .6)} ${f(R * .12)} ${f(R * 1.1)} ${f(-R * .02)}"/><path class="a" d="M${f(x - R * .7)} ${f(y + R * .06)}c${f(R * .3)} ${f(-R * .08)} ${f(R * .6)} ${f(R * .12)} ${f(R * 1.05)} ${f(R * .02)}"/>`
    + topo(x + R * .15, y + R * .42, R * .36, 33, { n: 4, sx: 1.3 }) + topo(x - R * .55, y - R * .4, R * .2, 35, { n: 3 }) + craters(x, y, R, 37, 6, 3)),
  neptune: (W, H) => planet(W, H, (x, y, R) => bands(x, y, R, [-.7, -.45, -.1, .3, .62], { wave: 2, tilt: 6 }) + topo(x + R * .1, y + R * .2, R * .13, 41, { n: 3, sx: 1.7, sy: .7, acc: 1, amp: .1 })
    + `<path class="d" d="M${f(x - R * .3)} ${f(y + R * .45)}h${f(R * .35)}M${f(x + R * .25)} ${f(y - R * .18)}h${f(R * .25)}"/>`, { light: [-.06, -.07], nShade: 7 }),
  uranus: (W, H) => planet(W, H, (x, y, R) => bands(x, y, R, [-.55, -.2, .25], { wave: 1, tilt: 10, acc: [1] }), { light: [-.05, -.04], nShade: 9 }),
  venus: (W, H) => planet(W, H, (x, y, R) => [[-.35, -.35, 51, .4], [.3, -.2, 53, .35], [-.1, .35, 55, .45], [.5, .4, 57, .25], [-.6, .3, 59, .2]].map(([a, b, s, z], i) => topo(x + a * R, y + b * R, R * z, s, { n: 4, amp: .4, acc: i % 2 })).join('')),
  mercure: (W, H) => planet(W, H, (x, y, R) => craters(x, y, R, 61, 26, 5) + crater(x + R * .1, y + R * .05, 5, 'a')
    + Array.from({ length: 9 }, (_, i) => { const t = i * .7; return `<path class="d" d="M${f(x + R * .1 + Math.cos(t) * 8)} ${f(y + R * .05 + Math.sin(t) * 7)}L${f(x + R * .1 + Math.cos(t) * R * .8)} ${f(y + R * .05 + Math.sin(t) * R * .8)}"/>`; }).join(''), { r: .45 }),
  pluton: (W, H) => planet(W, H, (x, y, R) => topo(x + R * .22, y + R * .05, R * .42, 75, { n: 5, sx: .95, sy: 1.05, acc: 1, amp: .32 })
    + topo(x - R * .62, y + R * .45, R * .35, 71, { n: 4, sx: 1.2, acc: 1 }) + craters(x, y - R * .3, R * .6, 73, 5, 3), { r: .45 }),
  io: (W, H) => planet(W, H, (x, y, R) => [[-.3, -.3, 81], [.35, -.1, 83], [-.1, .4, 85], [.5, .45, 87]].map(([a, b, s]) => topo(x + a * R, y + b * R, R * .2, s, { n: 3, amp: .45 })).join('') + dots(x, y, R, 89, 34)),
  'saturne-dessus': (W, H) => {
    const x = W * .62, y = H * .5, R = H * .3;
    const ringE = [[.46, .44, ''], [.42, .4, 'a'], [.37, .35, ''], [.33, .31, 'd']].map(([a, b, c]) => ell(x - W * .08, y, W * a * .8, H * b, c)).join('');
    return `<mask id="m"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}" fill="#000"/></mask><g mask="url(#m)">${ringE}</g>`
      + `<clipPath id="d"><circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}"/></clipPath>${circle(x, y, R)}<g clip-path="url(#d)">${shade(x, y, R, .07, 0, 4)}${bands(x, y, R, [-.6, -.3, 0, .3, .6], { wave: 1.5, acc: [2] })}</g>`;
  },
  iss: (W, H) => {
    const y = H * .55, panel = (x0, y0, w, h) => `<rect x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="${f(h)}"/>` + Array.from({ length: 7 }, (_, i) => `<path d="M${f(x0 + w * (i + 1) / 8)} ${f(y0)}v${f(h)}"/>`).join('') + `<path d="M${f(x0)} ${f(y0 + h / 2)}h${f(w)}"/>`;
    return `<path class="a" d="M${f(W * .03)} ${f(y)}H${f(W * .97)}"/>` + [.03, .28, .54, .78].map(a => panel(W * a, y - H * .1, W * .19, H * .07) + panel(W * a, y + H * .03, W * .19, H * .07)).join('')
      + `<rect x="${f(W * .455)}" y="${f(H * .2)}" width="${f(W * .05)}" height="${f(H * .62)}" rx="2"/>` + [.28, .42, .66, .76].map(b => `<rect x="${f(W * .44)}" y="${f(H * b)}" width="${f(W * .08)}" height="${f(H * .06)}" rx="1.5"/>`).join('')
      + panel(W * .3, H * .1, W * .38, H * .06) + circle(W * .48, H * .86, 3, 'a');
  },
  earthrise: (W, H) => { // la Terre à demi éclairée au-dessus du bord de la Lune, tout entière dans le cadre
    const ex = W * .5, ey = H * .36, er = W * .15, cy = H * 2.1, R0 = cy - H * .7;
    const term = k => `M${f(ex - er)} ${f(ey + er * (.12 + k * .16))}Q${f(ex)} ${f(ey + er * (.55 + k * .16))} ${f(ex + er)} ${f(ey + er * (.12 + k * .16))}`;
    const earth = `<clipPath id="e"><circle cx="${f(ex)}" cy="${f(ey)}" r="${f(er)}"/></clipPath>${circle(ex, ey, er, 'a')}<g clip-path="url(#e)">`
      + topo(ex - er * .2, ey - er * .4, er * .36, 7, { n: 3 }) + topo(ex + er * .42, ey - er * .05, er * .2, 9, { n: 2 }) + `<path class="a" d="${term(0)}"/>` + [1, 2, 3].map(k => `<path d="${term(k)}"/>`).join('') + '</g>';
    const arc = k => { const c = cy + k * 8, x0 = 8 + k * 12, x1 = W - 8 - k * 12, y = x => c - Math.sqrt(R0 * R0 - (x - W / 2) ** 2); return `<path${k ? '' : ' class="a"'} d="M${f(x0)} ${f(y(x0))}A${f(R0)} ${f(R0)} 0 0 1 ${f(x1)} ${f(y(x1))}"/>`; };
    return earth + [0, 1, 2, 3, 4].map(arc).join('') + ell(64, H * .82, 11, 2.4) + ell(128, H * .86, 15, 3) + ell(150, H * .79, 6, 1.4)
      + [[30, 30], [168, 26], [150, 96], [40, 104], [92, 14], [180, 120]].map(([a, b], i) => circle(a, b, i % 3 ? .8 : 1.2, i % 3 ? '' : 'a')).join('');
  },
  empreinte: (W, H) => { // une empreinte de botte en courbes de niveau, semelle crantée au centre
    const x = W / 2, y = H / 2, sole = [[0, -1], [.38, -.93], [.55, -.7], [.52, -.35], [.4, -.05], [.36, .25], [.44, .55], [.38, .85], [.12, 1], [-.18, .98], [-.4, .8], [-.42, .5], [-.34, .2], [-.4, -.15], [-.52, -.5], [-.45, -.85], [-.22, -.99]];
    const at = k => closed(sole.map(([a, b]) => [x + a * 46 * k, y + b * 80 * k]));
    let tread = ''; for (let yy = y - 86; yy < y + 90; yy += 11) tread += `<path d="M${f(x - 50)} ${f(yy)}L${f(x)} ${f(yy + 8)}L${f(x + 50)} ${f(yy)}"/>`;
    return `<g transform="rotate(-10 ${f(x)} ${f(y)})"><clipPath id="s"><path d="${at(.76)}"/></clipPath><path class="a" d="${at(1)}"/><path d="${at(.88)}"/><path d="${at(.76)}"/><g clip-path="url(#s)">${tread}</g></g>`
      + [[36, 40], [166, 52], [30, 150], [170, 160], [52, 96], [150, 108], [100, 190], [96, 8]].map(([a, b], i) => i % 3 ? circle(a, b, .9) : crater(a, b, 3)).join('');
  },
  mccandless: (W, H) => { // le casque, la Terre dans la visière
    const x = W / 2, y = H * .45, R = 66, vx = x + 4, vy = y + 2;
    const visor = closed(Array.from({ length: 32 }, (_, i) => { const t = i / 32 * 6.283, c = Math.cos(t), s = Math.sin(t); return [vx + 46 * Math.sign(c) * Math.abs(c) ** .6, vy + 34 * Math.sign(s) * Math.abs(s) ** .6]; }));
    const limb = k => `M${f(vx - 50)} ${f(vy + 14 + k * 7)}Q${f(vx)} ${f(vy - 6 + k * 7)} ${f(vx + 50)} ${f(vy + 14 + k * 7)}`;
    return `<path d="M${f(x - 50)} ${f(y + 50)}A50 12 0 0 0 ${f(x + 50)} ${f(y + 50)}"/><path d="M${f(x - 42)} ${f(y + 58)}A42 10 0 0 0 ${f(x + 42)} ${f(y + 58)}"/>`
      + circle(x, y, R) + `<path d="M${f(x - R + 7)} ${f(y - 4)}A${R - 7} ${R - 7} 0 0 1 ${f(x + R - 7)} ${f(y - 4)}"/>`
      + `<clipPath id="v"><path d="${visor}"/></clipPath><path class="a" d="${visor}"/><g clip-path="url(#v)"><path class="a" d="${limb(0)}"/>${[1, 2, 3].map(k => `<path class="d" d="${limb(k)}"/>`).join('')}`
      + `<path d="M${f(vx - 34)} ${f(vy - 14)}L${f(vx - 16)} ${f(vy - 28)}M${f(vx - 30)} ${f(vy - 2)}L${f(vx - 4)} ${f(vy - 22)}"/></g>`
      + `<rect x="${f(x - R - 8)}" y="${f(y - 30)}" width="12" height="18" rx="2.5"/>` + [[24, 24], [176, 34], [170, 150], [28, 160], [150, 12]].map(([a, b], i) => circle(a, b, i % 2 ? .8 : 1.1, i % 2 ? '' : 'a')).join('');
  },
  sourire: (W, H) => {
    const x = W / 2, y = H / 2, R = H * .2;
    const list = [[W * .46, H * .2, 'd'], [W * .4, H * .16, ''], [W * .33, H * .13, 'a'], [W * .26, H * .1, '']];
    return `<mask id="m"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}" fill="#000"/></mask><g mask="url(#m)">${rings(x, y, list, 0, 'back')}</g>`
      + `<path class="a" d="M${f(x - R)} ${f(y)}A${f(R)} ${f(R)} 0 0 0 ${f(x + R)} ${f(y)}"/>${circle(x, y, R)}${rings(x, y, list, 0, 'front')}` + ell(x, y, R * 1.25, R * 1.25, 'd');
  },
  loin: (W, H) => { // Saturne entière et la Terre, un point au loin
    const x = W * .58, y = H * .52, R = H * .25;
    const list = [[W * .4, H * .2, ''], [W * .36, H * .18, 'a'], [W * .31, H * .155, ''], [W * .27, H * .135, 'd']];
    return `<mask id="m"><rect width="${W}" height="${H}" fill="#fff"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}" fill="#000"/></mask><g mask="url(#m)">${rings(x, y, list, -12, 'back')}</g>`
      + `<clipPath id="d"><circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}"/></clipPath>${circle(x, y, R)}<g clip-path="url(#d)">${shade(x, y, R, .08, -.05, 4)}${bands(x, y, R, [-.6, -.3, 0, .3, .6], { wave: 1.2, tilt: -12, acc: [2] })}</g>`
      + rings(x, y, list, -12, 'front') + circle(W * .14, H * .3, 1.6, 'a') + circle(W * .14, H * .3, 5, 'd');
  },
  bennu: (W, H) => { // l'astéroïde en toupie, ses blocs en îlots de courbes
    const x = W / 2, y = H / 2, rx = W * .3, ry = H * .38, r = rng(101);
    const body = k => closed(Array.from({ length: 30 }, (_, i) => { const t = i / 30 * 6.283, c = Math.cos(t), s = Math.sin(t), w = 1 + (r() - .5) * .06; return [x + rx * k * w * Math.sign(c) * Math.abs(c) ** .75, y - (1 - k) * ry * .2 + ry * k * w * Math.sign(s) * Math.abs(s) ** 1.15]; }));
    let rocks = ''; for (let i = 0; i < 9; i++) { const a = r() * 6.3, d = Math.sqrt(r()) * .62; rocks += topo(x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, 3 + r() * 6, 103 + i, { n: 2 + (i % 2), amp: .35, acc: i % 4 ? 0 : 1, sy: .8 }); }
    return `<clipPath id="b"><path d="${body(1)}"/></clipPath><path d="${body(1)}"/><g clip-path="url(#b)"><path d="${body(.84)}"/><path d="${body(.68)}"/>`
      + `<path class="a" d="M${f(x - rx)} ${f(y)}Q${f(x)} ${f(y + ry * .22)} ${f(x + rx)} ${f(y)}"/>${rocks}</g>`;
  },
};

const space = JSON.parse(readFileSync('data/space.json', 'utf8'));
mkdirSync('img/ill', { recursive: true });
for (const a of space) {
  const [, w0, h0] = a.sizes[0], W = 200, H = f(200 * h0 / w0);
  if (!D[a.slug]) throw new Error('pas de dessin pour ' + a.slug);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${w0}" height="${h0}"><style>*{vector-effect:non-scaling-stroke}path,circle,ellipse,rect{fill:none;stroke:${GRAY};stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}.a{stroke:${ACC}}.d{stroke-dasharray:1.5 4}</style>${D[a.slug](W, H)}</svg>`;
  writeFileSync(`img/ill/${a.slug}.svg`, svg.replace(/fill="(#fff|#000)"/g, `style="fill:$1;stroke:none"`)); // le style du dessin ne doit pas vider les masques
}
console.log(space.length + ' illustrations dans img/ill/');
