(() => {
// Fiche projet : le folio de la marge suit le chapitre en cours. Sa vignette est la carte du projet
// (même graine, même couleur que la couverture), et elle gagne des courbes de niveau à chaque nouveau chapitre lu.
window.ZC_PAGE = function ({ $, $$ }) {
  const folio = $('.folio'), chapters = $$('.ed-ch');
  if (!folio || !chapters.length) return;
  const num = $('.folio-n', folio), title = $('.folio-t', folio), c = $('.folio-map', folio);
  const { createRelief, seedOf } = window.Relief;
  const r = createRelief(c, { seed: seedOf(folio.dataset.seed), peaks: +folio.dataset.peaks, rough: +folio.dataset.rough, accent: folio.dataset.color, time: 40, maxDpr: 2 });
  let read = 0, current = -1;
  const draw = () => r?.render({ levels: 3 + read * 3 });
  const show = i => {
    if (i === current) return;
    current = i;
    read = Math.max(read, i + 1);
    num.textContent = `Chapitre ${i + 1} sur ${chapters.length}`;
    title.textContent = chapters[i].dataset.ch;
    folio.classList.add('is-on');
    draw();
  };
  // le chapitre qui traverse le milieu de l'écran ; le folio se retire sur la page de titre et au colophon
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) show(chapters.indexOf(e.target)); }), { rootMargin: '-50% 0px -50% 0px' });
  chapters.forEach(ch => io.observe(ch));
  new IntersectionObserver(([e]) => folio.classList.toggle('is-away', e.isIntersecting), { rootMargin: '0px 0px -40% 0px' }).observe($('.ed-colophon'));
  new IntersectionObserver(([e]) => { if (e.isIntersecting) { folio.classList.remove('is-on'); current = -1; } }, { rootMargin: '-50% 0px -50% 0px' }).observe($('.ed-title'));
  addEventListener('resize', () => { r?.resize(); draw(); });
};
})();
