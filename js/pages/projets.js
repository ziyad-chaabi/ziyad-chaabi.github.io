(() => {
// Projets : une galerie qu'on longe. Scrollcraft (pan) fait glisser le rail ; ce fichier ajoute
// le sol du musée (un relief qui défile à 60 % de la vitesse du rail et prend la couleur de l'objet au centre),
// l'index qui emmène jusqu'à un objet, et le clavier qui ramène l'objet sélectionné dans le champ.
window.ZC_PAGE = function ({ $, $$, calm, lenis }) {
  const act = $('.gal'), rail = $('.gal-rail'), floor = $('.gal-floor');
  if (!act || !rail) return;
  const objs = $$('.gal-obj', rail);
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

  // l'objet dont le centre est le plus proche du centre de la zone visible du rail
  const focusX = () => { const ix = $('.gal-index'); return ix && innerWidth > 860 ? (ix.getBoundingClientRect().right + innerWidth) / 2 : innerWidth / 2; };
  // position de scroll qui amène un objet au centre : le rail parcourt (débord × 1,02) sur la course épinglée
  function scrollFor(obj) {
    const over = rail.scrollWidth - innerWidth, travel = act.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, (obj.offsetLeft + obj.offsetWidth / 2 - focusX()) / (over * 1.02)));
    return act.getBoundingClientRect().top + scrollY + p * travel;
  }
  // avec Lenis, un scrollTo natif est aussitôt écrasé : on passe par lui, immédiat pour le clavier
  const go = (obj, instant) => { const y = scrollFor(obj); if (lenis && !instant) return lenis.scrollTo(y, { duration: 1.2 }); scrollTo(0, y); lenis?.scrollTo(y, { immediate: true }); };
  $$('.gal-index a[data-go]').forEach(a => a.addEventListener('click', e => {
    if (calm) return; // mouvement réduit : la grille est déjà entière, le lien ouvre la fiche
    e.preventDefault(); go($(`.gal-obj[data-slug="${a.dataset.go}"]`, rail));
  }));
  // tabulation dans le rail : l'objet qui reçoit le focus est ramené au centre, sans animation
  if (!calm) objs.forEach(o => o.addEventListener('focusin', () => go(o, true)));

  const r = !calm && window.Relief.createRelief(floor, { seed: window.Relief.seedOf('galerie'), peaks: 0, rough: 1, levels: 14, maxDpr: 1.25 });
  if (!r) return;
  addEventListener('resize', () => r.resize());
  const cols = objs.map(o => hex(o.dataset.color || '#D2602A'));
  const cur = [...cols[0]], t0 = performance.now();
  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(act);
  gsap.ticker.add(() => {
    if (!visible) return;
    const fx = focusX();
    let best = 0, bd = Infinity;
    objs.forEach((o, i) => { const b = o.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - fx); if (d < bd) { bd = d; best = i; } });
    cur.forEach((v, k) => (cur[k] += (cols[best][k] - v) * .06));
    const shift = new DOMMatrixReadOnly(getComputedStyle(rail).transform).m41; // translation du rail en px
    r.render({ cam: [-shift / innerHeight * .6, 0], accent: toHex(cur), time: (performance.now() - t0) / 1000 });
  });
};
})();
