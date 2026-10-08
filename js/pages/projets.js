(() => {
const { paintCover } = window.Relief;
const { projects } = window.ZC;

window.ZC_PAGE = function ({ $, $$, calm }) {
  const list = $('.rows-all');
  const items = $$('.row-item', list);
  const filters = $$('.filters button'), views = $$('.views button');

  // fromTo (et pas from) : si on clique vite, une animation interrompue ne laisse plus les projets invisibles.
  const animate = () => { if (!calm) gsap.fromTo(items.filter(i => !i.hidden), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, ease: 'power3.out', stagger: .04, overwrite: true }); };

  filters.forEach(b => b.addEventListener('click', () => {
    filters.forEach(x => x.setAttribute('aria-pressed', x === b));
    items.forEach(i => (i.hidden = b.dataset.f !== 'all' && i.dataset.kind !== b.dataset.f));
    animate();
    ScrollTrigger.refresh();
  }));

  views.forEach(b => b.addEventListener('click', () => {
    views.forEach(x => x.setAttribute('aria-pressed', x === b));
    const grid = b.dataset.v === 'grid';
    list.classList.toggle('is-grid', grid);
    try { localStorage.setItem('zc-view', b.dataset.v); } catch {}
    if (grid) $$('canvas[data-cover]', list).forEach(c => paintCover(c, projects.find(p => p.slug === c.dataset.cover)));
    animate();
    ScrollTrigger.refresh();
  }));

  try { if (localStorage.getItem('zc-view') === 'grid') views[1].click(); } catch {}
}
})();
