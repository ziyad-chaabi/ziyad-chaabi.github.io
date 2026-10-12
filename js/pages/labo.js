(() => {
// Le labo, en coupe : une couche par année, une colonne par domaine, un galet par projet (rendus par build.mjs).
// Ce fichier ajoute la fiche de prélèvement, le filtre par domaine, la carotte (signature de la page : elle se remplit
// des couches traversées et sert de navigation) et les nouveaux dépôts publics, posés dans leur couche en direct.
const { paintCover, seedOf } = window.Relief;
const { site, skipRepos } = window.ZC;
const COL = { pro: '#D2602A', mobile: '#5B8DEF', xr: '#C772B5', web: '#4FAE7B', data: '#C9A33C', jeux: '#E07A5F' };
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

window.ZC_PAGE = function ({ $, $$, calm, lenis }) {
  const cut = $('.lab-cut'), sample = $('.sample'), zoneName = Object.fromEntries(window.ZC.zones.map(z => [z.id, z.name]));
  if (!cut) return;
  const jump = y => (lenis ? lenis.scrollTo(y, { duration: calm ? 0 : 1.4 }) : scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' }));

  /* ---------- La fiche de prélèvement ---------- */
  let opener = null;
  function open(btn) {
    const d = btn.dataset, page = btn.getAttribute('href');
    const acts = [page && `<a class="btn" href="${page}">Lire la fiche</a>`, d.repo && `<a class="btn btn-line" href="${esc(d.repo)}" target="_blank" rel="noopener">Code sur GitHub</a>`,
      d.demo && `<a class="btn btn-line" href="${esc(d.demo)}" target="_blank" rel="noopener">Démo en ligne</a>`].filter(Boolean).join('');
    sample.innerHTML = `<button type="button" class="sample-close" aria-label="Fermer la fiche">×</button>
      <div class="sample-pic">${d.img ? `<img src="${esc(d.img)}" alt="">` : '<canvas></canvas>'}</div>
      <div class="sample-body"><p class="sample-meta">Prélevé en ${d.year}, ${esc(zoneName[d.zone] || '')}, ${esc(d.ctx)}${d.stars ? `, ★ ${d.stars}` : ''}</p>
      <h2 id="sample-h">${esc(d.name)}</h2><p>${esc(d.desc)}</p>
      ${d.stack ? `<ul class="chips">${d.stack.split('|').map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      ${acts ? `<div class="sample-acts">${acts}</div>` : '<p class="note">Code privé : pas de dépôt public.</p>'}</div>`;
    if (!d.img) paintCover($('canvas', sample), { slug: d.seed, color: btn.closest('.sp').style.getPropertyValue('--c') || COL[d.zone], relief: { peaks: 2 + (seedOf(d.seed) | 0) % 4, rough: .5 } });
    sample.hidden = false; sample.style.setProperty('--c', btn.closest('.sp').style.getPropertyValue('--c'));
    opener?.classList.remove('is-open'); opener = btn; btn.classList.add('is-open');
    $('.sample-close', sample).addEventListener('click', close);
    if (!calm) gsap.fromTo(sample, { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .45, ease: 'power3.out' });
    $('.sample-close', sample).focus({ preventScroll: true });
  }
  function close() { sample.hidden = true; opener?.classList.remove('is-open'); opener?.focus({ preventScroll: true }); opener = null; }
  addEventListener('keydown', e => { if (e.key === 'Escape' && !sample.hidden) close(); });
  // un clic ouvre la fiche ; Ctrl/Cmd + clic garde le comportement d'un lien
  cut.addEventListener('click', e => {
    const b = e.target.closest('.sp-btn');
    if (!b || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); b === opener && !sample.hidden ? close() : open(b);
  });

  /* ---------- Filtre par domaine : les en-têtes de colonne ---------- */
  const heads = $$('.lab-cols button');
  heads.forEach(b => b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') !== 'true';
    heads.forEach(x => x.setAttribute('aria-pressed', on && x === b));
    cut.dataset.filter = on ? b.dataset.z : '';
  }));

  /* ---------- Les couches se dessinent (les galets se posent via Scrollcraft, data-sc-in) ---------- */
  if (!calm) {
    $$('.st-line').forEach(p => gsap.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: p.closest('.st-edge'), start: 'top 85%', once: true } }));
  }

  /* ---------- La carotte ---------- */
  const core = $('.core'), fill = $('.core-fill'), bit = $('.core-bit');
  const strata = $$('.st', cut);
  let top = 0, height = 1;
  function drawCore() {
    const r = cut.getBoundingClientRect(); top = r.top + scrollY; height = r.height;
    // un segment par couche (même motif, même teinte), un point par galet, à sa place
    fill.innerHTML = strata.map(st => {
      const b = st.getBoundingClientRect(), h = b.height / height * 100;
      const dots = $$('.sp', st).map(sp => { const s = sp.getBoundingClientRect(); return `<i data-zone="${sp.dataset.zone}" style="top:${((s.top + s.height / 2 - b.top) / b.height * 100).toFixed(1)}%;left:${(20 + ((s.left + s.width / 2 - r.left) / r.width) * 60).toFixed(1)}%;--c:${sp.style.getPropertyValue('--c')}"></i>`; }).join('');
      return `<span class="${st.className}" style="height:${h.toFixed(2)}%">${dots}</span>`;
    }).join('');
    // chaque année face au haut de sa couche dans le tube
    $$('.core li').forEach((li, i) => { li.style.top = `${((strata[i].getBoundingClientRect().top - r.top) / height * 100).toFixed(2)}%`; });
  }
  const progress = () => Math.min(1, Math.max(0, (scrollY + innerHeight * .5 - top) / height));
  gsap.ticker.add(() => {
    const p = progress();
    core.style.setProperty('--p', p.toFixed(4));
    core.classList.toggle('is-on', scrollY + innerHeight * .6 > top);
  });
  $$('.core button').forEach(b => b.addEventListener('click', () => {
    const st = b.dataset.go === 'rock' ? $('.st-rock') : $(`.st[data-year="${b.dataset.go}"]`);
    jump(st.getBoundingClientRect().top + scrollY - 120);
  }));
  // un clic sur le tube descend à la profondeur visée
  $('.core-tube').addEventListener('click', e => { const t = e.currentTarget.getBoundingClientRect(); jump(top + (e.clientY - t.top) / t.height * height - innerHeight * .5); });
  document.fonts.ready.then(drawCore); addEventListener('resize', drawCore); drawCore();

  /* ---------- Étoiles en direct, et les dépôts publiés depuis la dernière synchronisation ---------- */
  const live = $('.lab-live');
  (async () => {
    let list;
    try { const c = JSON.parse(localStorage.getItem('zc-repos2') || 'null'); if (c && Date.now() - c.t < 6e5) list = c.r; } catch {}
    if (!list) {
      const r = await fetch('https://api.github.com/users/Subdij/repos?per_page=100&sort=pushed');
      if (!r.ok) throw new Error(r.status);
      list = (await r.json()).map(x => ({ n: x.name, s: x.stargazers_count, f: x.fork, d: x.description, l: x.language, p: x.pushed_at, h: x.homepage }));
      try { localStorage.setItem('zc-repos2', JSON.stringify({ t: Date.now(), r: list })); } catch {}
    }
    const btns = $$('.sp-btn', cut), byRepo = new Map(btns.filter(b => b.dataset.repo).map(b => [b.dataset.repo.split('/').pop(), b]));
    let fresh = 0;
    for (const r of list) {
      const b = byRepo.get(r.n);
      if (b) { if (r.s) b.dataset.stars = r.s; continue; }
      if (r.f || skipRepos.includes(r.n)) continue;
      const zone = { 'C#': 'xr', Java: 'mobile', Kotlin: 'mobile', Python: 'data' }[r.l] || 'web', year = r.p.slice(0, 4);
      const ul = $(`.st[data-year="${year}"] .st-cell[data-zone="${zone}"]`) || $(`.st .st-cell[data-zone="${zone}"]`);
      if (!ul) continue;
      fresh++;
      const name = r.n.replace(/[-_]/g, ' ');
      ul.insertAdjacentHTML('beforeend', `<li class="sp is-new" data-zone="${zone}" style="--c:${COL[zone]};--dx:0px;--dy:0px"><button type="button" class="sp-btn" data-name="${esc(name)}" data-desc="${esc(r.d || 'Un dépôt tout juste publié sur GitHub.')}" data-stack="${esc(r.l || '')}" data-year="${year}" data-ctx="Nouveau dépôt" data-zone="${zone}" data-repo="${site.github}/${esc(r.n)}"${r.h ? ` data-demo="${esc(r.h)}"` : ''}${r.s ? ` data-stars="${r.s}"` : ''} data-seed="${esc(r.n)}"><svg class="peb" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="50" rx="44" ry="34"/><ellipse cx="50" cy="50" rx="26" ry="20"/><ellipse cx="50" cy="50" rx="8" ry="6"/></svg><span class="sp-name">${esc(name)}</span></button></li>`);
    }
    if (fresh) drawCore();
    live.textContent = `Étoiles à jour depuis GitHub${fresh ? `, ${fresh} dépôt${fresh > 1 ? 's' : ''} publié${fresh > 1 ? 's' : ''} depuis la dernière synchronisation` : ''}. La coupe se refait seule à chaque nouveau dépôt.`;
  })().catch(() => {});
};
})();
