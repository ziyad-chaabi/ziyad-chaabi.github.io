(() => {
const whenThree = () => (window.THREE ? Promise.resolve() : new Promise(r => addEventListener('three:ready', r, { once: true })));
// Le labo : un terrain 3D dont chaque sommet est un projet. Courbes de niveau dessinées par shader.
const { paintCover, seedOf } = window.Relief;
const { projects, repos, zones, labZone, skipRepos, site } = window.ZC;

const W = 22, D = 15; // taille du terrain
const ZC = { pro: '#D2602A', mobile: '#5B8DEF', xr: '#C772B5', web: '#4FAE7B', data: '#C9A33C', jeux: '#E07A5F' };

// Bruit de valeur 2D (déterministe) pour le relief de fond.
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x, y) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x, y) => { let s = 0, a = .5; for (let i = 0; i < 5; i++) { s += a * vnoise(x, y); x *= 2.02; y *= 2.02; a *= .5; } return s; };

function layout() {
  const items = [
    ...projects.map(p => ({ id: p.slug, name: p.title, zone: labZone[p.slug], year: p.year, desc: p.kicker, stack: p.stack.slice(0, 6), page: `projets/${p.slug}.html`, repo: p.links.find(l => l[1].includes('github.com'))?.[1], demo: p.links.find(l => !l[1].includes('github.com'))?.[1], color: p.color, relief: p.relief, big: true, ctx: p.context })),
    // dépôts synchronisés automatiquement (scripts/sync.mjs) : chacun a sa page et ses captures
    ...(window.ZC_AUTO || []).map(a => ({ id: a.slug, name: a.name, zone: a.zone, year: a.year, desc: a.desc, stack: a.stack || [], page: `projets/${a.slug}.html`, repo: `${site.github}/${a.repo}`, ghName: a.repo, demo: a.live, img: a.img, stars: a.stars, color: ZC[a.zone], big: false, ctx: 'Dépôt GitHub' })),
    // dépôts privés décrits à la main
    ...repos.filter(r => !r.repo).map(r => ({ id: r.n, name: r.n, zone: r.z, year: r.y, desc: r.d, stack: r.s, color: ZC[r.z], big: false, ctx: 'Code privé' })),
  ];
  // dans chaque zone : spirale dorée autour du centre, les gros projets au milieu
  for (const z of zones) {
    const zi = items.filter(i => i.zone === z.id).sort((a, b) => b.big - a.big);
    zi.forEach((it, k) => {
      const r = k === 0 ? 0 : .55 + Math.sqrt(k) * .62, a = k * 2.399963 + z.x * 3;
      it.x = z.x * W * .4 + Math.cos(a) * r;
      it.z = z.y * D * .38 + Math.sin(a) * r * .8;
      it.h = it.big ? 1.25 + (it.relief?.peaks || 3) * .12 : .55 + hash(k, z.x) * .35;
      it.s = it.big ? .55 : .38;
    });
  }
  return items;
}

function heightAt(x, z, items) {
  let h = fbm(x * .22 + 3, z * .22 - 1) * 1.3 - .35;
  for (const it of items) { const dx = x - it.x, dz = z - it.z; h += it.h * Math.exp(-(dx * dx + dz * dz) / (2 * it.s * it.s)); }
  const edge = Math.min(1, Math.max(0, 1 - Math.max(Math.abs(x) / (W / 2), Math.abs(z) / (D / 2)) ** 4)); // bords qui retombent
  return h * edge;
}

function main({ $, $$, calm, lenis }) {
  const { MapControls } = window.THREE_ADDONS;
  const lab = $('.lab'), stage = $('.lab-stage'), labelsEl = $('.lab-labels'), card = $('.lab-card');
  const items = layout();

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { lab.classList.add('no-gl'); $('.lab-list').hidden = false; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  stage.append(renderer.domElement);
  const scene = new THREE.Scene();
  const bg = new THREE.Color('#121417');
  scene.background = bg;
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 200);
  camera.position.set(0, 26, 6);

  // terrain
  const geo = new THREE.PlaneGeometry(W, D, 260, 180); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i), items));
  geo.computeVertexNormals();
  const focus = { value: new THREE.Vector3(0, -99, 0) };
  const mat = new THREE.ShaderMaterial({
    uniforms: { uBg: { value: bg }, uLine: { value: new THREE.Color('#E9EBE6') }, uAccent: { value: new THREE.Color('#D2602A') }, uLevels: { value: 7 }, uFocus: focus, uTime: { value: 0 } },
    vertexShader: `varying vec3 vPos; varying vec3 vN; void main(){ vPos = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform vec3 uBg, uLine, uAccent, uFocus; uniform float uLevels, uTime; varying vec3 vPos; varying vec3 vN;
      void main(){
        float v = vPos.y * uLevels; float fw = fwidth(v);
        float f = abs(fract(v - .5) - .5) / max(fw, 1e-4);
        bool major = mod(floor(v + .5), 5.) == 0.;
        float line = 1. - smoothstep(0., major ? 1.5 : .9, f);
        float shade = .5 + .5 * max(dot(normalize(vN), normalize(vec3(-.4, 1., .3))), 0.);
        vec3 base = uBg + vec3(.012, .013, .015) * smoothstep(-.2, 2.2, vPos.y) + (shade - .75) * .018;
        float near = exp(-pow(distance(vPos.xz, uFocus.xz), 2.) / .8);
        vec3 lc = major ? uAccent : uLine;
        float a = major ? .85 : .22 + near * .5;
        vec3 col = mix(base, lc, line * a);
        col += uAccent * near * .08;
        float edge = max(abs(vPos.x) / ${(W / 2).toFixed(1)}, abs(vPos.z) / ${(D / 2).toFixed(1)});
        gl_FragColor = vec4(mix(col, uBg, smoothstep(.78, 1., edge)), 1.);
        #include <colorspace_fragment>
      }`,
  });
  scene.add(new THREE.Mesh(geo, mat));

  // repères : une tige et un point au sommet de chaque projet
  const markerGeo = new THREE.SphereGeometry(.04, 12, 8);
  const lineMat = new THREE.LineBasicMaterial({ color: '#E9EBE6', transparent: true, opacity: .5 });
  for (const it of items) {
    const y = heightAt(it.x, it.z, items);
    it.top = new THREE.Vector3(it.x, y + (it.big ? .75 : .45), it.z);
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(it.x, y, it.z), it.top]), lineMat));
    const m = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({ color: it.big ? '#D2602A' : '#E9EBE6' }));
    m.position.copy(it.top); m.scale.setScalar(it.big ? 1.3 : .8); scene.add(m);
  }

  // étiquettes HTML (accessibles au clavier)
  const zoneLabels = zones.map(z => {
    const el = document.createElement('div'); el.className = 'lab-label is-zone'; el.innerHTML = `<span>${z.name}</span>`; labelsEl.append(el);
    const x = z.x * W * .4, zz = z.y * D * .38 + 2.3;
    return { el, v: new THREE.Vector3(x, heightAt(x, zz, items) + .2, zz) };
  });
  for (const it of items) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lab-label'; b.dataset.zone = it.zone; b.dataset.cursor = 'Ouvrir';
    b.innerHTML = `<span>${it.name}</span>`;
    b.addEventListener('click', () => open(it));
    labelsEl.append(b); it.el = b;
  }

  const controls = new MapControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = .08;
  controls.maxPolarAngle = 1.15; controls.minDistance = 5; controls.maxDistance = 26;
  controls.screenSpacePanning = false; controls.enableZoom = false; controls.target.set(-2.6, 0, .8);
  const clampTarget = () => { controls.target.x = THREE.MathUtils.clamp(controls.target.x, -W / 2, W / 2); controls.target.z = THREE.MathUtils.clamp(controls.target.z, -D / 2, D / 2); };

  const size = () => { const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);

  const v = new THREE.Vector3();
  const place = (el, p, extraHide) => {
    v.copy(p).project(camera);
    const hidden = v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1 || extraHide;
    el.style.visibility = hidden ? 'hidden' : 'visible';
    if (!hidden) el.style.transform = `translate(${(v.x * .5 + .5) * stage.clientWidth}px, ${(-v.y * .5 + .5) * stage.clientHeight}px) translate(-50%, -100%)`;
  };
  let filter = '', selected = null;
  const t0 = performance.now();
  const frame = () => {
    controls.update(); clampTarget();
    mat.uniforms.uTime.value = (performance.now() - t0) / 1000;
    const dist = camera.position.distanceTo(controls.target);
    for (const it of items) {
      place(it.el, it.top, !it.big && dist > 15 && it !== selected);
      it.el.classList.toggle('is-dim', !!filter && it.zone !== filter);
    }
    zoneLabels.forEach(z => place(z.el, z.v, dist < 7));
    renderer.render(scene, camera);
  };
  gsap.ticker.add(frame);

  const fly = (x, z, d = 7, dur = 1.6) => {
    const toPos = { x: x + d * .2, y: d * .75, z: z + d * .75 };
    gsap.to(controls.target, { x, y: 0, z, duration: dur, ease: 'power3.inOut' });
    gsap.to(camera.position, { ...toPos, duration: dur, ease: 'power3.inOut' });
  };

  // carte d'un projet
  function open(it) {
    selected?.el.classList.remove('is-on'); selected = it; it.el.classList.add('is-on');
    focus.value.set(it.x, 0, it.z);
    fly(it.x, it.z, 8.5);
    const acts = [
      it.page && `<a class="btn" href="${it.page}" data-t="${it.name}">Voir la page projet</a>`,
      it.repo && `<a class="btn btn-line" href="${it.repo}" target="_blank" rel="noopener">Code sur GitHub</a>`,
      it.demo && `<a class="btn btn-line" href="${it.demo}" target="_blank" rel="noopener">Démo en ligne</a>`,
    ].filter(Boolean).join('');
    card.innerHTML = `<button type="button" class="lab-close" aria-label="Fermer">×</button><canvas></canvas>
      <div class="lab-card-body"><p class="meta">${zones.find(z => z.id === it.zone).name}, ${it.ctx}, ${it.year}${it.stars ? `, ★ ${it.stars}` : ''}</p>
      <h2>${it.name}</h2><p>${it.desc}</p><ul class="chips">${it.stack.map(s => `<li>${s}</li>`).join('')}</ul><div class="actions">${acts}</div></div>`;
    card.hidden = false;
    const shot = it.img || (it.big && projects.find(p => p.slug === it.id)?.screen);
    if (shot) $('canvas', card).replaceWith(Object.assign(document.createElement('img'), { src: shot, alt: '' }));
    else paintCover($('canvas', card), { slug: it.id, color: it.color || ZC[it.zone], relief: it.relief || { peaks: 2 + (seedOf(it.id) | 0) % 4, rough: .5 } });
    $('.lab-close', card).addEventListener('click', close);
    if (!calm) gsap.fromTo(card, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, ease: 'power3.out' });
    $('.lab-close', card).focus({ preventScroll: true });
  }
  function close() {
    card.hidden = true; selected?.el.classList.remove('is-on');
    const back = selected?.el; selected = null; focus.value.set(0, -99, 0); back?.focus({ preventScroll: true });
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && !card.hidden) close(); });

  // filtres par zone
  const zf = $('.lab-zones');
  zf.innerHTML = `<button type="button" aria-pressed="true" data-z="">Tout</button>` + zones.map(z => `<button type="button" aria-pressed="false" data-z="${z.id}">${z.name}</button>`).join('');
  zf.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', zf).forEach(x => x.setAttribute('aria-pressed', x === b));
    filter = b.dataset.z;
    const z = zones.find(z => z.id === filter);
    z ? fly(z.x * W * .4, z.y * D * .38, 9) : fly(-2.6, .8, 16);
  });

  // vue liste
  const listBtn = $('.lab-listbtn'), listSec = $('.lab-list');
  listBtn.addEventListener('click', () => {
    const on = listBtn.getAttribute('aria-pressed') !== 'true';
    listBtn.setAttribute('aria-pressed', on); listSec.hidden = !on;
    ScrollTrigger.refresh();
    if (on) lenis ? lenis.scrollTo(listSec, { offset: -20 }) : listSec.scrollIntoView();
  });

  // zoom : boutons, pincement sur trackpad ou Ctrl + molette (la molette seule fait défiler la page)
  const zoom = (k, dur = .6) => {
    const off = camera.position.clone().sub(controls.target);
    const len = THREE.MathUtils.clamp(off.length() * k, controls.minDistance, controls.maxDistance);
    off.setLength(len).add(controls.target);
    gsap.to(camera.position, { x: off.x, y: off.y, z: off.z, duration: dur, ease: 'power3.out' });
  };
  renderer.domElement.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : .89, .3); }, { passive: false });
  $$('[data-zoom]').forEach(b => b.addEventListener('click', () => zoom(+b.dataset.zoom > 0 ? .7 : 1.4)));

  // entrée en scène : la caméra descend sur la carte
  const live = $('.lab-live');
  live.textContent = `${items.length} projets sur la carte.`;
  const intro = () => (calm ? (camera.position.set(-2.6, 11.5, 12.8), controls.update()) : gsap.to(camera.position, { x: -2.6, y: 11.5, z: 12.8, duration: 2.6, ease: 'expo.out' }));
  addEventListener('page:enter', intro, { once: true });
  if (document.documentElement.classList.contains('is-ready')) intro();

  // étoiles GitHub en direct + nouveaux dépôts publics posés sur la carte
  (async () => {
    let list;
    try { const c = JSON.parse(localStorage.getItem('zc-repos2') || 'null'); if (c && Date.now() - c.t < 6e5) list = c.r; } catch {}
    if (!list) {
      const r = await fetch('https://api.github.com/users/Subdij/repos?per_page=100&sort=pushed');
      if (!r.ok) throw new Error(r.status);
      list = (await r.json()).map(x => ({ n: x.name, s: x.stargazers_count, f: x.fork, d: x.description, l: x.language, p: x.pushed_at, h: x.homepage }));
      try { localStorage.setItem('zc-repos2', JSON.stringify({ t: Date.now(), r: list })); } catch {}
    }
    const known = new Set([...items.map(i => i.ghName || (i.repo || '').split('/').pop()), ...skipRepos]);
    let fresh = 0;
    for (const r of list) {
      const it = items.find(i => (i.repo || '').endsWith('/' + r.n));
      if (it) { it.stars = r.s; continue; }
      if (r.f || known.has(r.n)) continue;
      fresh++;
      const zone = { 'C#': 'xr', Java: 'mobile', Kotlin: 'mobile', Python: 'data' }[r.l] || 'web';
      const z = zones.find(q => q.id === zone), a = fresh * 2.4;
      const it2 = { id: r.n, name: r.n.replace(/[-_]/g, ' '), zone, year: r.p.slice(0, 4), desc: r.d || 'Un dépôt tout juste publié sur GitHub.', stack: r.l ? [r.l] : [], repo: `${site.github}/${r.n}`, demo: r.h || undefined, color: ZC[zone], big: false, ctx: 'Nouveau dépôt', stars: r.s };
      it2.x = z.x * W * .4 + Math.cos(a) * 3.2; it2.z = z.y * D * .38 + Math.sin(a) * 2.4;
      it2.top = new THREE.Vector3(it2.x, heightAt(it2.x, it2.z, items) + .45, it2.z);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'lab-label'; b.dataset.zone = zone; b.innerHTML = `<span>${it2.name}</span>`;
      b.addEventListener('click', () => open(it2)); labelsEl.append(b); it2.el = b; items.push(it2);
    }
    live.textContent = `${items.length} projets sur la carte, étoiles à jour depuis GitHub${fresh ? `, dont ${fresh} nouveaux` : ''}.`;
  })().catch(() => {});
}

window.ZC_PAGE = ctx => whenThree().then(() => main(ctx));
})();
