// Modèles 3D procéduraux (méthode img2threejs : analyse de la référence → spec → construction par passes).
// Tout est construit en code, sans fichier 3D à télécharger. Nécessite window.THREE (+ RoundedBoxGeometry, RoomEnvironment).
(() => {
const T = () => window.THREE, A = () => window.THREE_ADDONS;

const mat = {
  whitePlastic: () => new (T().MeshPhysicalMaterial)({ color: '#f1f1ee', roughness: .55, clearcoat: .25, clearcoatRoughness: .5 }),
  foam: () => new (T().MeshStandardMaterial)({ color: '#9a9c9f', roughness: .95 }),
  glossBlack: () => new (T().MeshPhysicalMaterial)({ color: '#0d0e10', roughness: .12, clearcoat: 1, metalness: .2 }),
  lens: () => new (T().MeshPhysicalMaterial)({ color: '#1b2430', roughness: .05, metalness: .6, clearcoat: 1 }),
  fabric: () => new (T().MeshStandardMaterial)({ color: '#5d6066', roughness: 1 }),
  graphite: () => new (T().MeshPhysicalMaterial)({ color: '#2a2c30', metalness: .85, roughness: .32, clearcoat: .3 }),
  alu: () => new (T().MeshPhysicalMaterial)({ color: '#b9bcc0', metalness: .9, roughness: .38 }),
};
const rbox = (w, h, d, r, m) => new (T().Mesh)(new (A().RoundedBoxGeometry)(w, h, d, 6, r), m);
// profil en super-ellipse extrudé avec un biseau doux : formes « galet » (visière du casque)
function pebble(w, h, depth, bevel, n, m) {
  const s = new (T().Shape)(), N = 96;
  for (let i = 0; i <= N; i++) {
    const t = i / N * Math.PI * 2, c = Math.cos(t), si = Math.sin(t);
    const x = Math.sign(c) * Math.abs(c) ** (2 / n) * (w / 2 - bevel), y = Math.sign(si) * Math.abs(si) ** (2 / n) * (h / 2 - bevel);
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  const geo = new (T().ExtrudeGeometry)(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 10, curveSegments: 48 });
  geo.translate(0, 0, -depth / 2);
  return new (T().Mesh)(geo, m);
}

/* ---------- Matières communes : papier, encre, laiton ---------- */
const clay = (color, rough = .82) => new (T().MeshStandardMaterial)({ color, roughness: rough });
const gloss = color => new (T().MeshPhysicalMaterial)({ color, roughness: .18, clearcoat: 1, clearcoatRoughness: .12 });
const brass = () => new (T().MeshPhysicalMaterial)({ color: '#c49a4a', metalness: 1, roughness: .28, clearcoat: .4 });
// courbe une géométrie autour de l'axe vertical (façade galbée du casque, feuilles)
const bendZ = (geo, k, half) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / half; p.setZ(i, p.getZ(i) - k * x * x); } geo.computeVertexNormals(); return geo; };
// texte gravé, dessiné dans une texture
function label(text, { w = 512, h = 256, bg = null, fg = '#121417', size = 150 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '760 ' + size + 'px Archivo, system-ui, sans-serif';
  x.fillText(text, w / 2, h / 2 + size * .04);
  return loadTexture(c);
}

/* ---------- Île topographique : le socle commun à tous les projets ----------
   Plaques découpées dans le papier, empilées comme une maquette de courbes de niveau ;
   une plaque sur trois prend la couleur du projet (les courbes maîtresses de la carte). */
function plinth(color, { seed = 1, R = 1.7, layers = 6, squash = .62 } = {}) {
  const THREE = T(), g = new THREE.Group(), h = .065;
  const paper = clay('#DADDD6', .95), acc = clay(color, .8);
  for (let i = 0; i < layers; i++) {
    const s = new THREE.Shape(), N = 120, r0 = R * (1 - i / layers * .55);
    for (let k = 0; k <= N; k++) {
      const t = k / N * Math.PI * 2;
      const r = r0 * (1 + .07 * Math.sin(3 * t + seed + i * .6) + .045 * Math.sin(5 * t + seed * 2.3 - i) + .025 * Math.sin(9 * t + i * 1.7));
      if (k) s.lineTo(Math.cos(t) * r, Math.sin(t) * r * squash); else s.moveTo(Math.cos(t) * r, Math.sin(t) * r * squash);
    }
    const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: .01, bevelSize: .012, bevelSegments: 2, curveSegments: 6 });
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, i % 3 === 2 ? acc : paper);
    m.position.set(.06 * Math.sin(i * 1.3 + seed), i * h, .04 * Math.cos(i + seed));
    g.add(m);
  }
  return g;
}

/* ---------- Meta Quest 3 (référence : photo de présentation, avril 2025) ----------
   Spec : visière 1.84 × 0.98 × 0.5, façade galbée en arc (flèche 0.14), trois capteurs en pilule
   verticale noirs brillants (deux objectifs à gauche et à droite, capteur de profondeur au centre),
   mousse faciale grise en retrait, bras rigides blancs, sangle tissu à l'arrière.
   Passe 4 : la visière en boîte plate faisait « brique » ; elle est maintenant très arrondie et cintrée. */
function quest() {
  const THREE = T(), g = new THREE.Group(), black = gloss('#0E0F11');
  const white = new THREE.MeshPhysicalMaterial({ color: '#F2F2EF', roughness: .42, clearcoat: .35, clearcoatRoughness: .4 });
  const visor = pebble(1.84, .98, .34, .15, 3, white); bendZ(visor.geometry, .14, .92); g.add(visor);
  const front = pebble(1.74, .9, .03, .06, 3.2, white); bendZ(front.geometry, .14, .92); front.position.z = .23; g.add(front);
  for (const x of [-.6, 0, .6]) {
    const zAt = .345 - .14 * (x / .92) ** 2, yaw = Math.atan(2 * .14 * x / .92 ** 2);
    const pill = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .3, 8, 24), black);
    pill.scale.z = .25; pill.position.set(x, 0, zAt); pill.rotation.y = yaw; g.add(pill);
    for (const y of x ? [.11, -.11] : [.1]) {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .03, 32), gloss('#1d2633'));
      lens.rotation.x = Math.PI / 2; lens.position.set(x, y, zAt + .02); g.add(lens);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.05, .008, 8, 32), new THREE.MeshPhysicalMaterial({ color: '#3a3d42', metalness: .9, roughness: .3 }));
      ring.position.copy(lens.position); ring.position.z += .012; ring.rotation.y = yaw; g.add(ring);
    }
  }
  const foam = new THREE.Mesh(new (A().RoundedBoxGeometry)(1.6, .8, .3, 6, .14), clay('#7d8086', .97)); foam.position.z = -.36; g.add(foam);
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new (A().RoundedBoxGeometry)(.08, .2, 1.05, 4, .035), white);
    arm.position.set(sx * .9, .02, -.66); arm.rotation.y = sx * .14; g.add(arm);
  }
  const path = new THREE.CatmullRomCurve3([[-.98, .02, -1.12], [-.86, .06, -1.62], [0, .1, -1.92], [.86, .06, -1.62], [.98, .02, -1.12]].map(p => new THREE.Vector3(...p)));
  const band = new THREE.Mesh(new THREE.TubeGeometry(path, 80, .05, 12, false), clay('#4e5157', .98)); band.scale.y = 2.4; g.add(band);
  return g;
}
// manette Touch Plus : poignée inclinée, tête ovale avec joystick et deux boutons, gâchette
function controller(side = 1) {
  const THREE = T(), g = new THREE.Group();
  const body = new THREE.MeshPhysicalMaterial({ color: '#16181b', roughness: .5, clearcoat: .2 });
  const grip = new THREE.Mesh(new THREE.CapsuleGeometry(.11, .55, 8, 20), body); grip.rotation.x = 1.05; grip.position.set(0, -.2, -.3); g.add(grip);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.26, 32, 20), body); head.scale.set(.95, .34, 1.15); g.add(head);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .07, 24), clay('#2a2d31', .6)); stick.position.set(-.07 * side, .11, .02); g.add(stick);
  for (const [dx, dz] of [[.08, -.04], [.12, .07]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .03, 20), clay('#2a2d31', .5)); b.position.set(dx * side, .1, dz); g.add(b); }
  const trig = new THREE.Mesh(new (A().RoundedBoxGeometry)(.1, .16, .12, 3, .04), body); trig.position.set(0, -.08, .22); trig.rotation.x = .5; g.add(trig);
  return g;
}

/* ---------- Hotel Murder VR : la clé de la chambre, et la loupe de l'enquête ---------- */
function hotelKey(color) {
  const THREE = T(), g = new THREE.Group();
  // porte-clé losange, numéro gravé en or
  const s = new THREE.Shape(), r = .08, W = .55, H = .95;
  s.moveTo(0, H); s.quadraticCurveTo(r, H - r, W, r * .4); s.quadraticCurveTo(W + r * .6, 0, W, -r * .4); s.quadraticCurveTo(r, -H + r, 0, -H);
  s.quadraticCurveTo(-r, -H + r, -W, -r * .4); s.quadraticCurveTo(-W - r * .6, 0, -W, r * .4); s.quadraticCurveTo(-r, H - r, 0, H);
  const hole = new THREE.Path(); hole.absarc(0, H - .2, .07, 0, Math.PI * 2, true); s.holes.push(hole);
  const fob = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .1, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 4, curveSegments: 16 }), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color).multiplyScalar(.62), roughness: .55, clearcoat: .25, clearcoatRoughness: .5 }));
  fob.rotation.x = -Math.PI / 2; fob.rotation.z = .5; fob.position.set(-.55, 0, .15); g.add(fob);
  const num = new THREE.Mesh(new THREE.PlaneGeometry(.62, .31), new THREE.MeshBasicMaterial({ map: label('313', { fg: '#E2C27A', size: 170 }), transparent: true, toneMapped: false }));
  num.rotation.x = -Math.PI / 2; num.rotation.z = .5 + Math.PI / 2; num.position.set(-.55, .14, .15); g.add(num);
  // anneau, puis la clé en laiton : anneau, tige, panneton
  const ringPos = new THREE.Vector3(-.55 - Math.sin(.5) * .75, .06, .15 - Math.cos(.5) * .75);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.16, .022, 12, 48), brass()); ring.position.copy(ringPos); ring.rotation.x = -Math.PI / 2 + .25; g.add(ring);
  const key = new THREE.Group(); key.position.copy(ringPos).add(new THREE.Vector3(.25, 0, -.18)); key.rotation.y = 2.45; g.add(key);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(.17, .045, 16, 48), brass()); bow.rotation.x = Math.PI / 2; key.add(bow);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.1, 20), brass()); shaft.rotation.z = Math.PI / 2; shaft.position.x = .72; key.add(shaft);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .06, 24), brass()); collar.rotation.z = Math.PI / 2; collar.position.x = .26; key.add(collar);
  for (const [x, d] of [[1.12, .2], [1.02, .14], [.92, .18]]) { const t = new THREE.Mesh(new THREE.BoxGeometry(.07, .03, d), brass()); t.position.set(x, 0, d / 2); key.add(t); }
  // la loupe
  const lens = new THREE.Group(); lens.position.set(.75, .05, .35); lens.rotation.y = -.7; g.add(lens);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.42, .045, 16, 64), gloss('#1a1c20')); rim.rotation.x = -Math.PI / 2; lens.add(rim);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .02, 64), new THREE.MeshPhysicalMaterial({ color: '#dfe8ea', roughness: .05, transparent: true, opacity: .28, clearcoat: 1 })); lens.add(glass);
  const handle = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .55, 8, 16), clay('#5b3a26', .5)); handle.rotation.z = Math.PI / 2; handle.position.x = .78; lens.add(handle);
  return g;
}

/* ---------- Turaty Naturels : nature morte (flacon, savon noir, argile, olivier) ---------- */
function apothecary(color) {
  const THREE = T(), g = new THREE.Group(), V = pts => pts.map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(V([[0, 0], [.3, 0], [.33, .03], [.33, .62], [.3, .72], [.16, .8], [.1, .84], [.1, .9]]), 64), new THREE.MeshPhysicalMaterial({ color: '#8a4d17', roughness: .12, clearcoat: 1, transparent: true, opacity: .9 })));
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(.336, .336, .32, 64, 1, true), new THREE.MeshStandardMaterial({ map: label('TURATY  ·  TURATY  ·  ', { w: 2048, h: 256, bg: '#EEF0EB', size: 120 }), roughness: .9 }));
  lab.position.y = .36; lab.rotation.y = -2.2; g.add(lab);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .16, 32), clay('#16181b', .45)); collar.position.y = .97; g.add(collar);
  const bulb = new THREE.Mesh(new THREE.LatheGeometry(V([[0, 0], [.1, 0], [.11, .08], [.09, .2], [.05, .27], [0, .28]]), 32), clay('#16181b', .55)); bulb.position.y = 1.05; g.add(bulb);
  // porte-savon et savon noir
  const dish = new THREE.Mesh(new (A().RoundedBoxGeometry)(.95, .07, .62, 4, .03), clay('#b8892a', .7)); dish.position.set(.95, .035, .25); dish.rotation.y = -.35; g.add(dish);
  const soap = new THREE.Mesh(new (A().RoundedBoxGeometry)(.66, .2, .42, 6, .09), clay('#26241f', .55)); soap.position.set(.95, .17, .25); soap.rotation.y = -.35; g.add(soap);
  // bol d'argile
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(V([[0, 0], [.18, 0], [.32, .06], [.4, .2], [.38, .22], [.3, .1], [0, .08]]), 48), clay('#EEF0EB', .6)); bowl.position.set(-.85, 0, .35); g.add(bowl);
  const powder = new THREE.Mesh(new THREE.SphereGeometry(.33, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), clay('#c79a85', .95)); powder.scale.y = .28; powder.position.set(-.85, .13, .35); g.add(powder);
  // feuilles d'olivier
  for (const [x, z, ry, sc] of [[-.25, .7, .4, 1], [.35, .75, -.9, .85], [-.5, -.3, 2.2, .9]]) {
    const ls = new THREE.Shape(); ls.moveTo(-.4, 0); ls.quadraticCurveTo(0, .12, .4, 0); ls.quadraticCurveTo(0, -.12, -.4, 0);
    const leaf = new THREE.Mesh(bendZ(new THREE.ExtrudeGeometry(ls, { depth: .008, bevelEnabled: false, curveSegments: 16 }), -.06, .4), clay(color, .6));
    leaf.rotation.set(-Math.PI / 2, 0, ry); leaf.scale.setScalar(sc); leaf.position.set(x, .02, z); g.add(leaf);
  }
  return g;
}

/* ---------- lolop : une carte à trois couloirs, dessinée en courbes de niveau sur un terrain lisse ---------- */
function lanes(color) {
  const THREE = T(), g = new THREE.Group(), S = 2.6, e = S / 2 - .22;
  const dLine = (x, z, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz))); return Math.hypot(x - ax - vx * t, z - az - vz * t); };
  const field = (x, z) => {
    const lane = Math.min(dLine(x, z, -e, e, -e, -e), dLine(x, z, -e, -e, e, -e), dLine(x, z, -e, e, e, e), dLine(x, z, e, e, e, -e), dLine(x, z, -e, e, e, -e));
    const river = dLine(x, z, -e, -e, e, e);
    const s = v => v * v * (3 - 2 * v), clamp = v => Math.max(0, Math.min(1, v));
    let h = .3 + .13 * Math.sin(x * 3.1 + 1) * Math.cos(z * 2.7) + .07 * Math.sin(x * 6.3 + z * 4.1);
    h *= s(clamp((lane - .08) / .22)) * s(clamp((river - .06) / .2));
    return { h, lane, river };
  };
  // la carte : papier, couloirs sable, rivière à la couleur du projet, courbes de niveau à l'encre (maîtresses en couleur)
  const R = 1024, cv = document.createElement('canvas'); cv.width = cv.height = R;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(R, R), ink = [18, 20, 23], acc = new THREE.Color(color);
  const accent = [acc.r * 255, acc.g * 255, acc.b * 255];
  const H = [];
  for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) H.push(field((i / (R - 1) - .5) * S, (j / (R - 1) - .5) * S));
  for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
    const k = j * R + i, { h, lane, river } = H[k];
    let c = river < .07 ? accent : lane < .085 ? [205, 199, 184] : [233, 235, 230];
    // une courbe tous les 0.035 : on teste le changement de niveau avec les voisins
    const lv = Math.floor(h / .035), r2 = i < R - 1 ? Math.floor(H[k + 1].h / .035) : lv, d2 = j < R - 1 ? Math.floor(H[k + R].h / .035) : lv;
    // pas de courbes dans les couloirs ni la rivière (terrain presque plat : elles y grouillaient)
    if (lane > .1 && river > .09 && h > .04 && (lv !== r2 || lv !== d2)) c = Math.max(lv, r2, d2) % 4 === 0 ? accent : ink.map((v, n) => v * .8 + [233, 235, 230][n] * .2);
    img.data.set([c[0], c[1], c[2], 255], k * 4);
  }
  ctx.putImageData(img, 0, 0);
  const geo = new THREE.PlaneGeometry(S, S, 160, 160); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, field(p.getX(i), p.getZ(i)).h);
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: loadTexture(cv), roughness: .92 })));
  // socle juste sous le terrain : à la même hauteur, les deux surfaces se disputaient les pixels des couloirs (z-fighting)
  const base = new THREE.Mesh(new THREE.BoxGeometry(S, .14, S), clay('#DADDD6', .95)); base.position.y = -.085; g.add(base);
  const band = new THREE.Mesh(new THREE.BoxGeometry(S + .002, .03, S + .002), clay(color, .8)); band.position.y = -.115; g.add(band);
  for (const [x, z, c] of [[-e + .12, e - .12, color], [e - .12, -e + .12, '#D2602A']]) {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.17, 0), gloss(c)); crystal.scale.y = 1.7; crystal.position.set(x, .42, z); g.add(crystal);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(.16, .22, .14, 6), clay('#DADDD6', .85)); ped.position.set(x, .07, z); g.add(ped);
  }
  return g;
}

// écran à coins arrondis, UV calées sur la boîte englobante
function screenMesh(w, h, r, texture) {
  const s = new (T().Shape)();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new (T().ShapeGeometry)(s, 24);
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + .5, pos.getY(i) / h + .5);
  return new (T().Mesh)(geo, new (T().MeshBasicMaterial)({ map: texture, toneMapped: false }));
}

/* ---------- Téléphone (référence : smartphone actuel, bords plats) ----------
   Spec : 0.72 × 1.52 × 0.075, écran presque bord à bord, îlot noir en haut, bloc photo au dos. */
function phone(texture) {
  const g = new (T().Group)();
  g.add(rbox(.72, 1.52, .075, .11, mat.graphite()));
  const glass = rbox(.7, 1.5, .01, .1, mat.glossBlack()); glass.position.z = .036; g.add(glass);
  const scr = screenMesh(.66, 1.43, .085, texture); scr.position.z = .0425; g.add(scr);
  const island = rbox(.17, .045, .004, .022, mat.glossBlack()); island.position.set(0, .66, .045); g.add(island);
  const cam = rbox(.26, .26, .03, .06, mat.graphite()); cam.position.set(-.17, .52, -.05); g.add(cam);
  return g;
}

/* ---------- Ordinateur portable (référence : portable 14", charnière arrière) ----------
   Spec : base 2.4 × 0.07 × 1.62, écran 16:10 ouvert à ~105°, bordures noires fines. */
function laptop(texture) {
  const g = new (T().Group)();
  const base = rbox(2.4, .07, 1.62, .035, mat.alu()); g.add(base);
  // clavier dessiné dans une texture (6 rangées de touches)
  const kc = document.createElement('canvas'); kc.width = 1024; kc.height = 400;
  const k = kc.getContext('2d'); k.fillStyle = '#26282c'; k.fillRect(0, 0, 1024, 400);
  const rows = [14, 14, 14, 13, 12, 9];
  rows.forEach((n, r) => { const kw = 1000 / 14.6, y = 8 + r * 65; let x = 12 + (14 - n) * kw / 2;
    for (let i = 0; i < n; i++) { const w = r === 5 && i === 4 ? kw * 5.2 : kw - 8; k.fillStyle = '#121316'; k.beginPath(); k.roundRect(x, y, w, 56, 8); k.fill(); x += w + 8; } });
  const deck = rbox(2.1, .005, .82, .02, new (T().MeshStandardMaterial)({ map: loadTexture(kc), roughness: .6 })); deck.position.set(0, .037, -.22); g.add(deck);
  const pad = rbox(.8, .004, .48, .03, mat.alu()); pad.position.set(0, .037, .45); g.add(pad);
  const lid = new (T().Group)(); lid.position.set(0, .035, -.8);
  const shell = rbox(2.4, 1.56, .05, .04, mat.alu()); shell.position.y = .78; lid.add(shell);
  const bezel = rbox(2.34, 1.5, .01, .03, mat.glossBlack()); bezel.position.set(0, .78, .027); lid.add(bezel);
  const scr = screenMesh(2.24, 1.4, .015, texture); scr.position.set(0, .8, .033); lid.add(scr);
  lid.rotation.x = -.26; // ~105° d'ouverture
  g.add(lid);
  return g;
}

/* ---------- Scène prête à l'emploi : lumière studio, ombre douce, inertie souris + scroll ---------- */
function stage(canvas, { items, camera: camPos = [0, .4, 5.2], fov = 30, calm, shadow: sh = [3.4, 1.4, -1] }) {
  const THREE = T();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new (A().RoomEnvironment)(), .04).texture;
  const key = new THREE.DirectionalLight('#fff6ec', 1.4); key.position.set(3, 5, 4); scene.add(key);
  const camera = new THREE.PerspectiveCamera(fov, 1, .1, 100); camera.position.set(...camPos); camera.lookAt(0, 0, 0);
  const root = new THREE.Group(); scene.add(root);
  items.forEach(it => root.add(it));
  // ombre de contact : un disque dégradé sous les objets
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), grd = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  grd.addColorStop(0, 'rgba(18,20,23,.28)'); grd.addColorStop(.7, 'rgba(18,20,23,0)'); x.fillStyle = grd; x.fillRect(0, 0, 128, 128);
  // taille réglée par appareil pour que l'ombre ne soit jamais coupée par le bord du cadre
  if (sh) {
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(sh[0], sh[1]), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = sh[2]; scene.add(shadow);
  }

  const size = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);
  const target = { x: 0, y: 0 }, s = { x: 0, y: 0, scroll: 0 };
  addEventListener('pointermove', e => { target.x = e.clientX / innerWidth - .5; target.y = e.clientY / innerHeight - .5; });
  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);
  const t0 = performance.now();
  const api = { scene, camera, root, renderer, scroll: 0, render: () => renderer.render(scene, camera) };
  const frame = () => {
    if (!visible) return;
    const t = (performance.now() - t0) / 1000;
    s.x += (target.x - s.x) * .05; s.y += (target.y - s.y) * .05;
    root.rotation.y = s.x * .5 + api.scroll * .6;
    root.rotation.x = s.y * .25;
    root.position.y = Math.sin(t * 1.1) * .04;
    renderer.render(scene, camera);
  };
  if (calm) frame(); else gsap.ticker.add(frame);
  return api;
}

function loadTexture(src) {
  const THREE = T();
  if (src instanceof HTMLCanvasElement) { const tx = new THREE.CanvasTexture(src); tx.colorSpace = THREE.SRGBColorSpace; return tx; }
  const tx = new THREE.TextureLoader().load(src);
  tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  return tx;
}

// écran sans capture (lolop…) : on y affiche la couverture en relief du projet
function coverTexture(seed, color, portrait) {
  const c = document.createElement('canvas');
  window.Relief?.paintCover(c, { slug: seed, color, relief: { peaks: 3, rough: .6 } }, portrait ? { w: 390, h: 844 } : { w: 1440, h: 900 });
  return loadTexture(c);
}

// Monte chaque <canvas class="device-canvas" data-device="laptop|phone|duo|quest"> de la page.
function mountAll() {
  gsap.registerPlugin(ScrollTrigger);
  const base = document.body.dataset.base || '';
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tex = (src, c, portrait) => src ? loadTexture(window.ZC_TEX?.[src] || base + src) : coverTexture(c.dataset.seed, c.dataset.color, portrait);
  document.querySelectorAll('canvas.device-canvas').forEach(c => {
    let items = [], cam = [0, .4, 5.2];
    const d = c.dataset.device;
    let shadow;
    const color = c.dataset.color || '#D2602A', seed = window.Relief?.seedOf(c.dataset.seed || d) || 1;
    if (d === 'quest') {
      const q = quest(); q.scale.setScalar(.82); q.rotation.set(.12, -.55, 0); q.position.set(0, .35, 0);
      const l = controller(-1), r = controller(1); l.scale.setScalar(.75); r.scale.setScalar(.75);
      l.position.set(-1.2, -.45, .75); l.rotation.set(.35, .9, .25); r.position.set(1.25, -.43, .6); r.rotation.set(.3, -1, -.2);
      items = [q, l, r]; cam = [0, .9, 7]; shadow = null;
    }
    if (d === 'hotel') { const k = hotelKey(color); k.rotation.set(.5, -.2, 0); k.position.y = .05; items = [k]; cam = [0, 1.6, 5.6]; shadow = null; }
    if (d === 'apothecary') { const ap = apothecary(color); ap.rotation.y = .25; ap.position.y = -.45; items = [ap]; cam = [0, 1.15, 5.4]; shadow = null; }
    if (d === 'lanes') { const m = lanes(color); m.rotation.set(.15, .78, 0); m.position.y = -.25; items = [m]; cam = [0, 2.4, 5.6]; shadow = null; }
    if (d === 'phone') { const p = phone(tex(c.dataset.screenM || c.dataset.screen, c, true)); p.rotation.set(0, -.32, .04); items = [p]; cam = [0, .05, 4.6]; shadow = [1.5, .6, -.95]; }
    if (d === 'laptop') { const l = laptop(tex(c.dataset.screen, c)); l.rotation.set(.32, -.42, 0); l.position.y = -.45; items = [l]; cam = [0, .7, 6.1]; shadow = [3.6, 1.5, -.75]; }
    if (d === 'duo') {
      const l = laptop(tex(c.dataset.screen, c)); l.rotation.set(.3, -.36, 0); l.position.set(-.4, -.45, 0);
      const p = phone(tex(c.dataset.screenM, c, true)); p.scale.setScalar(.9); p.position.set(1.15, -.2, .9); p.rotation.set(-.04, -.55, .04);
      items = [l, p]; cam = [.15, .6, 7.4]; shadow = [4.4, 1.7, -.75];
    }
    if (!items.length) return;
    // chaque projet posé sur son île en courbes de niveau (la carte de lolop est déjà un terrain)
    if (d !== 'lanes') { const isle = plinth(color, { seed, R: d === 'duo' ? 2.2 : 1.8 }); isle.position.y = { quest: -1.2, apothecary: -.88, hotel: -1.1, phone: -1.2, laptop: -1.45, duo: -1.4 }[d]; items.push(isle); shadow = null; }
    const api = stage(c, { items, camera: cam, calm, shadow });
    c.classList.add('is-live');
    ScrollTrigger.create({ trigger: c, start: 'top bottom', end: 'bottom top', onUpdate: s => (api.scroll = (s.progress - .5) * .8) });
    if (!calm) {
      gsap.from(api.root.rotation, { y: '-=1.1', duration: 2.4, ease: 'expo.out', delay: .3 });
      gsap.from(api.root.position, { y: '-=.6', duration: 2, ease: 'expo.out', delay: .3 });
    }
  });
}
const go = () => (window.THREE ? mountAll() : addEventListener('three:ready', mountAll, { once: true }));
document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go();

window.ZCDevices = { quest, controller, hotelKey, apothecary, lanes, plinth, phone, laptop, stage, loadTexture };
})();
