(() => {
const { paintCover } = window.Relief;
const { projects } = window.ZC;

// Compétences : scène partagée. À gauche les outils, à droite les projets où ils ont servi.
// En descendant, le groupe qui passe au milieu de l'écran choisit son premier outil ; survol, focus ou clic choisissent à la main.
// Des fils partent de l'outil choisi vers chacun de ses projets (signature de la page, écran large seulement).
window.ZC_PAGE = function ({ $, $$, calm }) {
  const side = $('.skills-side'), title = $('.side-skill', side), list = $('.side-list', side);
  const skills = $$('.skill'), svg = $('.threads'), split = $('.split');
  let current, manual = 0;
  const show = btn => {
    if (!btn || current === btn) return;
    current?.classList.remove('is-active'); btn.classList.add('is-active'); current = btn;
    title.textContent = $('span', btn).textContent;
    const ps = btn.dataset.projects.split(' ').filter(Boolean).map(s => projects.find(p => p.slug === s));
    list.innerHTML = ps.length
      ? ps.map(p => `<li><a href="projets/${p.slug}.html"><canvas data-c="${p.slug}"></canvas><span>${p.title}</span></a></li>`).join('')
      : '<li class="empty">Utilisé en formation ou sur des projets plus petits, visibles dans le labo.</li>';
    $$('canvas[data-c]', list).forEach(c => paintCover(c, projects.find(p => p.slug === c.dataset.c)));
    if (!calm) gsap.from(list.children, { x: 20, autoAlpha: 0, duration: .45, ease: 'power3.out', stagger: .05 });
  };
  const pick = b => { manual = performance.now(); show(b); };
  skills.forEach(b => { b.addEventListener('pointerenter', () => pick(b)); b.addEventListener('focus', () => pick(b)); b.addEventListener('click', () => pick(b)); });
  show(skills[0]);
  // le groupe au milieu de l'écran prend la main, sauf si l'on vient de choisir un outil soi-même
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && performance.now() - manual > 2500) show($('.skill', e.target)); }), { rootMargin: '-48% 0px -48% 0px' });
  $$('.sg').forEach(g => io.observe(g));

  // les fils : une courbe de l'outil choisi vers chaque projet de la colonne de droite
  const wide = matchMedia('(min-width: 961px)');
  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(split);
  let last = '';
  gsap.ticker.add(() => {
    if (!visible || !wide.matches || !current) { if (last) { svg.innerHTML = ''; last = ''; } return; }
    const a = current.getBoundingClientRect();
    if (a.bottom < 0 || a.top > innerHeight) { if (last) { svg.innerHTML = ''; last = ''; } return; }
    const x0 = a.right + 10, y0 = a.top + a.height / 2;
    const d = $$('a', list).map(el => { const b = el.getBoundingClientRect(), x1 = b.left - 10, y1 = b.top + b.height / 2, m = (x0 + x1) / 2;
      return `M${x0.toFixed(1)} ${y0.toFixed(1)} C${m.toFixed(1)} ${y0.toFixed(1)} ${m.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`; });
    const out = d.map(p => `<path d="${p}"/>`).join('') + `<circle cx="${x0.toFixed(1)}" cy="${y0.toFixed(1)}" r="3.5"/>`;
    if (out !== last) { svg.innerHTML = out; last = out; }
  });
};
})();
