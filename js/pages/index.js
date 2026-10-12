(() => {
// Accueil : le visage en courbes de niveau, sur son propre plan (entre « Ziyad » et « Chaabi »).
// Il sort de la carte à l'arrivée, puis y retourne pendant que la phrase s'assemble (--sc-p du héros).
// Clic maintenu : la loupe s'ouvre sur la vraie photo.
window.ZC_PAGE = function ({ $, calm }) {
  const hero = $('.hero-home'), c = $('canvas[data-face]'), stage = $('.hh-stage');
  if (!hero || !c) return;
  // mouvement réduit : pas d'épinglage ni de fondus, la composition reste entière et la phrase passe dessous
  if (calm) {
    hero.removeAttribute('data-sc-act'); hero.classList.add('is-static');
    hero.querySelectorAll('[data-sc-cue]').forEach(el => { el.removeAttribute('data-sc-cue'); el.removeAttribute('data-sc-kinetic'); });
  }
  const r = window.Relief.createRelief(c, { seed: window.Relief.seedOf('ziyad-chaabi'), peaks: 0, rough: .5, levels: 16, layer: 2, imgRect: [0, 0, 1, 1] });
  if (!r) return c.parentElement.classList.add('no-gl');
  const load = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.src = window.ZC_TEX?.[src] || document.body.dataset.base + src; });
  const intro = { v: 0 };
  Promise.all([load(c.dataset.face), load(c.dataset.photo)]).then(([hm, ph]) => {
    r.setImage(hm, 0); r.setImage(ph, 1);
    gsap.to(intro, { v: 1, duration: calm ? 0 : 1.8, delay: calm ? 0 : .2, ease: 'power2.inOut' });
  });

  const ptr = { x: .5, y: .5, z: 0 };
  const px = gsap.quickTo(ptr, 'x', { duration: .45, ease: 'power3' }), py = gsap.quickTo(ptr, 'y', { duration: .45, ease: 'power3' });
  const pz = gsap.quickTo(ptr, 'z', { duration: 1.4, ease: 'power2' });
  hero.addEventListener('pointermove', e => { const b = c.getBoundingClientRect(); px((e.clientX - b.left) / b.width); py(1 - (e.clientY - b.top) / b.height); pz(1); });
  hero.addEventListener('pointerleave', () => pz(0));
  const lens = v => gsap.to(r.state, { lens: v, duration: v > .2 ? .8 : .5, ease: 'expo.out', overwrite: true });
  hero.addEventListener('pointerdown', e => { if (!e.target.closest('a, button')) { pz(1); lens(.75); } });
  addEventListener('pointerup', () => lens(.13));
  addEventListener('pointercancel', () => lens(.13));

  addEventListener('resize', () => r.resize());
  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(c);
  const t0 = performance.now();
  gsap.ticker.add(() => {
    if (!visible) return;
    const p = +hero.style.getPropertyValue('--sc-p') || 0;
    const sink = 1 - gsap.utils.clamp(0, 1, (p - .3) / .4); // le visage s'aplatit entre 30 et 70 % du héros
    const amt = intro.v * sink * sink * (3 - 2 * sink);
    r.render({ time: calm ? 12 : (performance.now() - t0) / 1000, pointer: [ptr.x, ptr.y, ptr.z], imgAmt: amt });
    // ce qui change vraiment à l'écran, pour le harnais Scrollcraft : échelle du terrain et présence du visage
    stage.dataset.scVerifyState = `${(1 + p * .16).toFixed(3)},${amt.toFixed(2)}`;
  });
};
})();
