(() => {
// Parcours : un monde continu. Le relief WebGL est la seule toile ; la caméra le survole d'une étape à l'autre,
// entre les vraies coordonnées (latitude, longitude), en reculant pendant les longs vols puis en se posant.
// La route se trace derrière elle et les coordonnées de la caméra défilent en direct (la signature de la page).
// Scrollcraft (worldflight) gère la piste, les fenêtres de texte et l'événement sc:waypoint ; ce fichier dessine la carte.
window.ZC_PAGE = function ({ $, $$, calm, lenis }) {
  const root = $('.pc');
  if (!root) return;
  const world = $('.pc-world', root), canvas = $('.pc-map', root), spacer = $('[data-sc-spacer]', root);
  const legs = $$('[data-sc-segment]', root).map(el => ({ w: +el.dataset.scW, lat: +el.dataset.lat, lon: +el.dataset.lon, place: el.dataset.place }));
  const total = legs.reduce((a, l) => a + l.w, 0);
  let c = 0; legs.forEach(l => { l.c0 = c; c += l.w; });

  // projection simple autour de 49,3° N : 1 unité de terrain = 120 km (y vers le nord)
  const toW = (lat, lon) => [(lon - 3.6) * .603, (lat - 49.3) * .925];
  const toLL = (x, y) => [y / .925 + 49.3, x / .603 + 3.6];
  legs.forEach((l, i) => { l.p = toW(l.lat, l.lon); l.zoom = i === 0 ? 1.05 : l.place === 'Troyes' || l.place.startsWith('Saint') ? 1.55 : 1.15; });
  const routeLen = [0]; for (let i = 1; i < legs.length; i++) routeLen[i] = routeLen[i - 1] + Math.hypot(legs[i].p[0] - legs[i - 1].p[0], legs[i].p[1] - legs[i - 1].p[1]);

  const smooth = x => (x = Math.min(1, Math.max(0, x)), x * x * (3 - 2 * x));
  const ease = x => (x = Math.min(1, Math.max(0, x)), x < .5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
  // où est la caméra à la position t (en hauteurs d'écran) sur la piste
  function camAt(t) {
    let k = 0; for (let i = 0; i < legs.length; i++) if (t >= legs[i].c0) k = i;
    const L = legs[k], local = Math.min(1, (t - L.c0) / L.w);
    // posée, la caméra ne s'arrête jamais tout à fait : elle continue de descendre doucement (10 % de zoom) pendant la lecture
    const end = l => l.zoom * 1.1;
    if (k === 0) return { x: L.p[0], y: L.p[1], zoom: .62 + (end(L) - .62) * (1 - (1 - local) ** 2), k, route: 0 };
    const A = legs[k - 1], d = Math.hypot(L.p[0] - A.p[0], L.p[1] - A.p[1]);
    // vol pendant la première partie de la jambe (plus longue pour un long vol), puis la caméra se pose et le texte arrive
    const T = d > 1 ? .66 : .5, e = calm ? 1 : ease(local / T), settle = calm ? 0 : Math.max(0, (local - T) / (1 - T));
    const zoom = (end(A) + (L.zoom - end(A)) * e) / (1 + Math.min(1.4, d * .9) * Math.sin(Math.PI * e)) * (1 + .1 * settle);
    return { x: A.p[0] + (L.p[0] - A.p[0]) * e, y: A.p[1] + (L.p[1] - A.p[1]) * e, zoom, k, route: routeLen[k - 1] + (routeLen[k] - routeLen[k - 1]) * e };
  }

  const r = window.Relief.createRelief(canvas, { seed: window.Relief.seedOf('parcours-carte'), peaks: 0, rough: 1.45, levels: 17, maxDpr: 1.25 });
  if (!r) world.classList.add('no-gl');
  const pins = $$('.pc-pin', root).map(el => ({ el, p: toW(...(() => { const l = legs.find(l => l.place === el.dataset.place); return [l.lat, l.lon]; })()), place: el.dataset.place }));
  const all = $('.pc-route-all', root), done = $('.pc-route-done', root), latlon = $('.pc-latlon', root);
  const rail = $$('.pc-rail button', root), chrome = $$('.pc-rail, .pc-coords, [data-sc-world-copy]', root);
  const mobile = matchMedia('(max-width: 860px)');

  let top = 0, vh = innerHeight;
  const measure = () => { top = root.getBoundingClientRect().top + scrollY; vh = innerHeight; r?.resize(); };
  addEventListener('resize', measure); measure();

  const t0 = performance.now();
  let lastK = -1, lastSig = '';
  function frame() {
    const t = Math.min(total, Math.max(0, (scrollY - top) / vh));
    const cam = camAt(t);
    const W = innerWidth, H = innerHeight, asp = W / H;
    // point de mire : à droite du texte sur grand écran, au-dessus du texte sur téléphone
    const F = mobile.matches ? [.5, .7] : [.66, .5];
    const camOff = [cam.x - .5 * asp - (F[0] - .5) * asp / cam.zoom, cam.y - .5 - (F[1] - .5) / cam.zoom];
    r?.render({ cam: camOff, zoom: cam.zoom, time: calm ? 8 : (performance.now() - t0) / 1000 });
    // repère monde -> pixels écran (même formule que le shader)
    const toS = ([x, y]) => [((x - camOff[0] - .5 * asp) * cam.zoom / asp + .5) * W, (1 - ((y - camOff[1] - .5) * cam.zoom + .5)) * H];
    pins.forEach(pn => {
      const [sx, sy] = toS(pn.p);
      pn.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
      const on = legs[cam.k].place === pn.place;
      pn.el.classList.toggle('is-on', on);
      // Saint-André est à 3 km de Troyes : son nom ne s'affiche que quand on y est
      pn.el.classList.toggle('is-hidden', pn.place.startsWith('Saint') && !on);
    });
    const pts = legs.map(l => toS(l.p).map(v => v.toFixed(1)).join(' '));
    const d = 'M' + pts.join(' L');
    all.setAttribute('d', d); done.setAttribute('d', d);
    done.style.strokeDasharray = `${(cam.route / routeLen.at(-1)).toFixed(4)} 1`;
    const [lat, lon] = toLL(cam.x, cam.y);
    latlon.textContent = `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`;
    if (cam.k !== lastK) { lastK = cam.k; rail.forEach((b, i) => b.toggleAttribute('aria-current', i === cam.k)); }
    // le monde est fini : le pied de page arrive, la carte et ses repères s'effacent derrière lui
    const end = spacer.getBoundingClientRect().bottom < H * .98;
    chrome.forEach(el => el.classList.toggle('is-off', end));
    // ce que le harnais de vérification doit voir bouger (Scrollcraft data-sc-verify-state)
    const sig = `${cam.x.toFixed(3)},${cam.y.toFixed(3)},${cam.zoom.toFixed(3)}`;
    if (sig !== lastSig) { lastSig = sig; world.dataset.scVerifyState = sig; }
  }
  gsap.ticker.add(frame);

  // la carte se parcourt aussi au clic : chaque étape du rail emmène la caméra jusqu'à elle
  const goTo = i => { const y = top + (legs[i].c0 + legs[i].w * .75) * vh; lenis ? lenis.scrollTo(y, { duration: 1.6 }) : scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' }); };
  rail.forEach((b, i) => b.addEventListener('click', () => goTo(i)));
  // un lien atteint au clavier dans un bloc encore invisible : on amène la piste jusqu'à ce bloc
  $$('.pc-step', root).forEach(el => el.addEventListener('focusin', () => { if (+getComputedStyle(el).opacity < .85) { const i = +el.dataset.leg, y = top + (legs[i].c0 + legs[i].w * .75) * vh; scrollTo(0, y); lenis?.scrollTo(y, { immediate: true }); } }));
};
})();
