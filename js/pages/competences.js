(() => {
const { paintCover } = window.Relief;
const { projects } = window.ZC;

window.ZC_PAGE = function ({ $, $$, calm }) {
  const side = $('.skills-side'), title = $('.side-skill', side), list = $('.side-list', side);
  const skills = $$('.skill');
  let current;
  const show = btn => {
    if (current === btn) return;
    current?.classList.remove('is-active'); btn.classList.add('is-active'); current = btn;
    title.textContent = $('span', btn).textContent;
    const ps = btn.dataset.projects.split(' ').filter(Boolean).map(s => projects.find(p => p.slug === s));
    list.innerHTML = ps.length
      ? ps.map(p => `<li><a href="projets/${p.slug}.html" data-t="${p.title}" data-cursor="Ouvrir"><canvas data-c="${p.slug}"></canvas><span>${p.title}</span></a></li>`).join('')
      : '<li class="empty">Utilisé en formation ou sur des projets plus petits, visibles dans le labo.</li>';
    $$('canvas[data-c]', list).forEach(c => paintCover(c, projects.find(p => p.slug === c.dataset.c)));
    if (!calm) gsap.from(list.children, { x: 20, autoAlpha: 0, duration: .5, ease: 'power3.out', stagger: .06 });
  };
  skills.forEach(b => { b.addEventListener('pointerenter', () => show(b)); b.addEventListener('focus', () => show(b)); b.addEventListener('click', () => show(b)); });
  if (skills[0]) show(skills[0]);
}
})();
