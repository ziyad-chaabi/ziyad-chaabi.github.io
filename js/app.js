(() => {
const { createRelief, paintCover, seedOf } = window.Relief;
const { projects } = window.ZC;

gsap.registerPlugin(ScrollTrigger, SplitText);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const page = document.body.dataset.page;
const ctx = { calm, fine, lenis: null, $, $$ };

/* ---------- Défilement doux ---------- */
if (!calm && window.Lenis) {
  ctx.lenis = new Lenis({ lerp: .09, wheelMultiplier: 1 });
  ctx.lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => ctx.lenis.raf(t * 1000));
  // Pas de lagSmoothing(0) : au chargement d'une page le navigateur bloque ~1 s, et sans lissage
  // les animations du voile « sautaient » directement à la fin (la page apparaissait d'un coup).
}

/* ---------- Voile : chargement et transitions entre pages ---------- */
const veil = $('.veil'), veilText = $('.veil-text'), veilCount = $('.veil-count');
const flood = !calm && createRelief($('.veil canvas'), { mode: 1, levels: 9, rough: .9, peaks: 4, seed: 7.7, accent: '#D2602A', ink: '#121417' });
const showVeil = p => {
  if (flood) veil.style.background = 'transparent';
  veil.style.visibility = p > .001 ? 'visible' : 'hidden';
  if (flood) flood.render({ progress: p, time: performance.now() / 1000 });
  else veil.style.opacity = p > .5 ? 1 : 0;
};
const veilState = { p: 1, reveal: 0 };
const drawVeil = () => { if (flood) flood.state.reveal = veilState.reveal; showVeil(veilState.p); };
addEventListener('resize', () => { flood?.resize(); drawVeil(); });

let leaving = false;
function leave(href, label) {
  if (leaving) return; // un deuxième clic pendant la sortie relançait une seconde animation
  leaving = true;
  try { sessionStorage.setItem('zc-ptr', JSON.stringify(ctx.pointer)); } catch {}
  if (calm) return void (location.href = href);
  veilText.textContent = label || '';
  veilCount.textContent = '';
  // Le texte apparaît PUIS s'efface sur cette page-ci : il ne traverse plus le changement de page.
  // Entre deux documents, l'affichage et la police repartent de zéro, et le texte « scintillait ».
  // power3.out : l'encre couvre tout de suite, le clic se voit dès la première image.
  gsap.timeline({ onComplete: () => (location.href = href) })
    .to(veilState, { p: 1, duration: .95, ease: 'power3.out', onUpdate: drawVeil })
    .fromTo(veilText, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .4, ease: 'power2.out' }, .15)
    .to(veilText, { opacity: 0, y: -12, duration: .3, ease: 'power2.in' }, .8);
}

const breathe = fn => requestAnimationFrame(() => requestAnimationFrame(fn));
function arrive() {
  const first = !sessionStorage.getItem('zc-seen');
  sessionStorage.setItem('zc-seen', '1');
  // On n'attend que les polices (pour découper les titres) : attendre « load », c'était attendre three.js,
  // les textures et les vidéos depuis le CDN, et rester plusieurs secondes sur le voile.
  const ready = Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);
  if (calm) { showVeil(0); return ready.then(enter); }
  veilState.p = 1; drawVeil();
  // enter() est lancé pendant que le voile se retire, plus à la fin : avant, la page apparaissait,
  // puis ses titres disparaissaient pour rejouer leur entrée (l'effet « la page se recharge deux fois »).
  const tl = gsap.timeline({ paused: true }).add(enter, .45);
  if (first) {
    // Premier passage : on part des coordonnées de Troyes et on compte jusqu'à 100.
    veilText.innerHTML = 'Ziyad Chaabi<br><span>48°17′ N, 4°04′ E</span>';
    const n = { v: 0 };
    const count = gsap.to(n, { v: 100, duration: 1.9, ease: 'power2.inOut', onUpdate: () => { veilCount.textContent = String(Math.round(n.v)).padStart(3, '0'); veilState.reveal = n.v / 100; } });
    gsap.from(veilText, { opacity: 0, y: 16, duration: .8, ease: 'power3.out' });
    ready.then(() => count.then(() => breathe(() => tl.play())));
  } else {
    veilText.textContent = ''; // le titre a déjà été montré par la page précédente, avant de partir
    ready.then(() => breathe(() => tl.play()));
  }
  tl.to([veilText, veilCount], { opacity: 0, y: -12, duration: .4, ease: 'power2.in' }, 0)
    .to(veilState, { reveal: 0, duration: .9, ease: 'power2.in' }, .2)
    .to(veilState, { p: 0, duration: 1.2, ease: 'power3.inOut', onUpdate: drawVeil }, .15);
  // l'encre « respire » pendant l'attente
  gsap.ticker.add(function idle() { if (tl.progress() >= 1) gsap.ticker.remove(idle); else drawVeil(); });
}

// Retour arrière depuis le cache du navigateur : on enlève le voile tout de suite.
addEventListener('pageshow', e => { if (e.persisted) { leaving = false; veilState.p = 0; drawVeil(); } });

document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  const url = new URL(a.href, location.href);
  if (a.target === '_blank' || a.hasAttribute('download') || url.origin !== location.origin || /\.(pdf|mp4)$/i.test(url.pathname)) return;
  if (url.pathname === location.pathname) {
    if (url.hash) { e.preventDefault(); ctx.lenis ? ctx.lenis.scrollTo(url.hash, { offset: -80 }) : $(url.hash)?.scrollIntoView(); }
    return;
  }
  e.preventDefault();
  closeMenu();
  leave(url.href, a.dataset.t || a.textContent.trim());
});

/* ---------- Curseur ---------- */
if (fine && !calm) {
  const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), lab = $('.cursor-label');
  document.documentElement.classList.add('has-cursor');
  const dx = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
  ctx.pointer = { x: innerWidth / 2, y: innerHeight / 2 };
  // la page précédente a noté où était la souris : sans ça, le curseur restait invisible
  // (le natif est masqué) jusqu'au premier mouvement
  try {
    const p = JSON.parse(sessionStorage.getItem('zc-ptr') || 'null');
    if (p) { ctx.pointer = p; gsap.set([dot, ring], { x: p.x, y: p.y }); cur.classList.add('is-on'); }
  } catch {}
  addEventListener('pointermove', e => {
    ctx.pointer.x = e.clientX; ctx.pointer.y = e.clientY;
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    cur.classList.add('is-on');
  });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
  addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('[data-cursor], a, button, label, input, textarea, select');
    const text = t?.dataset.cursor || '';
    cur.classList.toggle('is-link', !!t && !text);
    cur.classList.toggle('is-label', !!text);
    cur.classList.toggle('is-text', !!t && /INPUT|TEXTAREA/.test(t.tagName));
    lab.textContent = text;
  });
} else ctx.pointer = { x: innerWidth / 2, y: innerHeight / 2 };

/* ---------- Navigation ---------- */
const menuBtn = $('.menu-btn');
function closeMenu() { document.body.classList.remove('menu-open'); menuBtn?.setAttribute('aria-expanded', 'false'); }
menuBtn?.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', open);
  if (open && !calm) gsap.from('.menu-panel a', { yPercent: 110, duration: .7, ease: 'power3.out', stagger: .05 });
});
addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

const clock = $$('[data-clock]');
const tick = () => { const t = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(new Date()); clock.forEach(c => (c.textContent = t)); };
tick(); setInterval(tick, 15000);

const head = $('.site-head');
// En haut de page, la barre reste transparente ; dès qu'on défile, elle devient une bande lisible qui reste en place.
const stick = () => head.classList.toggle('is-stuck', scrollY > 30);
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: stick }); stick();

/* ---------- Visiteurs : au total, ce mois-ci, aujourd'hui ----------
   Un visiteur = un appareil. On calcule une empreinte de l'appareil à partir de ce qui ne change ni avec le navigateur
   (Opera, Chrome, Edge, Firefox…) ni avec le réseau (Wi-Fi, 4G) : fabricant de la carte graphique, nombre de cœurs,
   taille de l'écran, fuseau horaire, plateforme, écran tactile, profondeur de couleurs. Deux personnes sur la même box
   ont deux appareils, donc deux empreintes. L'empreinte est hachée (SHA-256) ici ; rien d'autre n'est envoyé.
   Abacus sert aussi de registre « déjà vu » : la clé d'une empreinte renvoie 1 au premier passage de la période.
   Rafraîchir ou changer de page ne recompte rien ; le navigateur garde aussi « déjà compté » pour éviter des appels.
   Pas de comptage en local ni pour les robots.
   ponytail: compteurs publics (Abacus), gonflables à la main ; deux appareils strictement identiques (même modèle,
   même écran, même fuseau) comptent pour un. Seule une connexion des visiteurs relierait le téléphone et le PC
   d'une même personne. */
(() => {
  if (!$$('[data-stat]').length) return;
  const API = 'https://abacus.jasoncameron.dev', NS = 'ziyad-chaabi-visites';
  const day = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date()); // AAAA-MM-JJ, heure de Paris
  const month = day.slice(0, 7);
  const periods = { total: ['visiteurs', 'oui', 'v-'], month: ['mois-' + month, month, `m-${month}-`], day: ['jour-' + day, day, `d-${day}-`] };
  const live = location.hostname === 'ziyad-chaabi.github.io' && !navigator.webdriver;
  let seen = {};
  try { seen = JSON.parse(localStorage.getItem('zc-vu3') || '{}'); } catch {}
  const remember = (k, mark) => { seen[k] = mark; try { localStorage.setItem('zc-vu3', JSON.stringify(seen)); } catch {} };
  const call = (op, key) => fetch(`${API}/${op}/${NS}/${key}`).then(r => (r.ok ? r.json() : r.status === 404 ? { value: 0 } : Promise.reject())).then(d => d.value);
  const num = new Intl.NumberFormat('fr-FR');
  const show = (k, v) => { $(`[data-stat="${k}"]`).textContent = num.format(v); };

  // empreinte de l'appareil, identique d'un navigateur à l'autre et d'un réseau à l'autre ;
  // calculée seulement au premier passage d'une période (elle ouvre un contexte WebGL, rendu aussitôt)
  let fpOnce;
  const fingerprint = () => fpOnce ||= (async () => {
    try {
      let gpu = 'aucun';
      const gl = document.createElement('canvas').getContext('webgl'), ext = gl?.getExtension('WEBGL_debug_renderer_info');
      // seulement le fabricant : Firefox simplifie le nom du modèle, Chrome le donne en entier
      if (gl) { gpu = (String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).match(/nvidia|geforce|radeon|amd|intel|apple|adreno|mali|powervr|qualcomm/i)?.[0] || 'autre').toLowerCase().replace('geforce', 'nvidia').replace('radeon', 'amd'); gl.getExtension('WEBGL_lose_context')?.loseContext(); }
      const sw = Math.max(screen.width, screen.height), sh = Math.min(screen.width, screen.height);
      const parts = [gpu, navigator.hardwareConcurrency, sw, sh, screen.colorDepth, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.platform, navigator.maxTouchPoints];
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ziyad-chaabi:' + parts.join('|')));
      return [...new Uint8Array(buf)].slice(0, 10).map(x => x.toString(16).padStart(2, '0')).join('');
    } catch { return null; }
  })();

  Object.entries(periods).forEach(async ([k, [key, mark, prefix]]) => {
    try {
      if (!live || seen[k] === mark) return show(k, await call('get', key)); // déjà compté (ou pas en ligne) : on lit
      const fp = await fingerprint();
      // registre : la clé de cette empreinte vaut 1 au premier passage de la période, plus ensuite
      const isNew = fp ? (await call('hit', prefix + fp)) === 1 : true;
      show(k, await call(isNew ? 'hit' : 'get', key));
      remember(k, mark);
    } catch {} // service injoignable : on laisse le tiret
  });
})();

/* ---------- Copier l'e-mail ---------- */
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const v = b.dataset.copy, out = b.closest('.foot-mail')?.querySelector('.copy-msg') || b;
  try { await navigator.clipboard.writeText(v); out.textContent = 'Adresse copiée'; } catch { out.textContent = v; }
  setTimeout(() => (out.textContent = ''), 2600);
}));

/* ---------- Fond en relief (hero) ---------- */
function heroRelief(c) {
  const dark = c.dataset.relief === 'dark';
  const r = createRelief(c, {
    seed: seedOf(c.dataset.seed || page), peaks: +(c.dataset.peaks || 4), rough: +(c.dataset.rough || .7), levels: +(c.dataset.levels || 14),
    accent: c.dataset.accent || '#D2602A', paper: dark ? '#121417' : '#EEF0EB', ink: dark ? '#EEF0EB' : '#121417', dark: dark ? 1 : 0,
  });
  if (!r) return c.classList.add('no-gl');
  // accueil : le relief dessine le portrait placé dans .hero-stage, et la loupe suit le curseur de près
  const stageEl = c.dataset.img && c.parentElement.querySelector('.hero-stage');
  if (stageEl) {
    const place = () => { const cb = c.getBoundingClientRect(), sb = stageEl.getBoundingClientRect();
      r.state.imgRect = [(sb.left - cb.left) / cb.width, 1 - (sb.bottom - cb.top) / cb.height, sb.width / cb.width, sb.height / cb.height]; };
    const load = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.src = window.ZC_TEX?.[src] || document.body.dataset.base + src; });
    Promise.all([load(c.dataset.img), load(c.dataset.photo)]).then(([hm, ph]) => {
      r.setImage(hm, 0); r.setImage(ph, 1); place();
      gsap.to(r.state, { imgAmt: 1, duration: calm ? 0 : 2.6, delay: calm ? 0 : .5, ease: 'power2.inOut', onComplete: () => calm && frame() });
    });
    addEventListener('resize', place); document.fonts.ready.then(place);
    // clic maintenu : la loupe s'ouvre sur tout le portrait
    const lens = v => gsap.to(r.state, { lens: v, duration: v > .2 ? .8 : .5, ease: 'expo.out', overwrite: true });
    c.parentElement.addEventListener('pointerdown', e => { if (!e.target.closest('a, button')) { pz(1); lens(.75); } });
    addEventListener('pointerup', () => lens(.13));
    addEventListener('pointercancel', () => lens(.13));
  }
  const lag = stageEl ? .45 : 1.2;
  const ptr = { x: .5, y: .5, z: 0 };
  const px = gsap.quickTo(ptr, 'x', { duration: lag, ease: 'power3' }), py = gsap.quickTo(ptr, 'y', { duration: lag, ease: 'power3' });
  const pz = gsap.quickTo(ptr, 'z', { duration: 1.4, ease: 'power2' });
  c.parentElement.addEventListener('pointermove', e => {
    const b = c.getBoundingClientRect();
    px((e.clientX - b.left) / b.width); py(1 - (e.clientY - b.top) / b.height); pz(1);
  });
  c.parentElement.addEventListener('pointerleave', () => pz(0));
  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(c);
  addEventListener('resize', () => r.resize());
  const t0 = performance.now();
  // le terrain dérive très lentement : une image sur deux suffit et divise le coût du shader par deux
  let skip = false;
  const frame = () => { if (visible && (skip = !skip)) r.render({ time: calm ? 12 : (performance.now() - t0) / 1000, pointer: [ptr.x, ptr.y, ptr.z] }); };
  if (calm) frame(); else gsap.ticker.add(frame);
}

/* ---------- Couvertures générées + aperçu qui suit le curseur ---------- */
const bySlug = Object.fromEntries(projects.map(p => [p.slug, p]));
function covers() {
  $$('canvas[data-cover]').forEach(c => { const p = bySlug[c.dataset.cover]; if (p && !paintCover(c, p)) c.classList.add('no-gl'); });
  $$('canvas[data-cover-auto]').forEach(c => paintCover(c, { slug: c.dataset.coverAuto, color: '#D2602A', relief: { peaks: 3, rough: .6 } }));
  const peek = $('.peek');
  if (!peek || !fine || calm) return;
  const pc = $('canvas', peek), pimg = $('img', peek);
  const qx = gsap.quickTo(peek, 'x', { duration: .6, ease: 'power3' }), qy = gsap.quickTo(peek, 'y', { duration: .6, ease: 'power3' });
  const qr = gsap.quickTo(peek, 'rotation', { duration: .6, ease: 'power3' });
  let last = null, lx = 0;
  // overwrite : sinon l'animation d'apparition (plus longue) finissait après celle de disparition et l'aperçu restait affiché.
  const hidePeek = () => gsap.to(peek, { autoAlpha: 0, scale: .85, duration: .25, overwrite: 'auto' });
  // la page défile sous le curseur sans qu'il bouge : on vérifie qu'il est encore sur une ligne
  addEventListener('scroll', () => { const el = document.elementFromPoint(ctx.pointer.x, ctx.pointer.y); if (!el?.closest('[data-peek]')) hidePeek(); }, { passive: true });
  addEventListener('pagehide', hidePeek);
  $$('[data-peek]').forEach(row => {
    row.addEventListener('pointerenter', () => {
      if (row.closest('.is-grid')) return;
      const p = bySlug[row.dataset.peek];
      // vraie capture si on en a une, sinon la couverture en relief
      pimg.hidden = !row.dataset.img; pc.hidden = !!row.dataset.img;
      if (row.dataset.img) pimg.src = row.dataset.img;
      else if (p && last !== p.slug) { paintCover(pc, p); last = p.slug; }
      $('.peek-title', peek).textContent = p?.title || '';
      gsap.to(peek, { autoAlpha: 1, scale: 1, duration: .45, ease: 'power3.out', overwrite: 'auto' });
    });
    row.addEventListener('pointerleave', hidePeek);
    row.addEventListener('click', hidePeek);
    row.addEventListener('pointermove', e => { qx(e.clientX + 30); qy(e.clientY - 130); qr(gsap.utils.clamp(-8, 8, (e.clientX - lx) * .4)); lx = e.clientX; });
  });
}

/* ---------- Apparitions au scroll ---------- */
function reveals() {
  $$('[data-split]:not([data-hero])').forEach(el => {
    SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: s =>
      gsap.from(s.lines, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }) });
  });
  gsap.utils.toArray('[data-reveal]').forEach(el => gsap.from(el, { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
  gsap.utils.toArray('[data-wipe]').forEach(el => gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } }));
  gsap.utils.toArray('[data-speed]').forEach(el => gsap.to(el, { yPercent: () => -+el.dataset.speed * 100, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.utils.toArray('[data-line]').forEach(el => gsap.from(el, { scaleX: 0, transformOrigin: 'left', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }));
}

let entered = false;
function enter() {
  if (entered) return; entered = true;
  document.documentElement.classList.add('is-ready');
  // filet du <head> déjà tombé (page restée trop longtemps sous le voile) : la page est visible, on ne rejoue rien
  if (!calm && document.documentElement.classList.contains('js')) {
    const heroLines = $$('[data-hero]');
    heroLines.forEach((el, i) => SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: s => gsap.from(s.lines, { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: .09, delay: i * .12 }) }));
    gsap.from('[data-hero-fade]', { autoAlpha: 0, y: 20, duration: 1, ease: 'power3.out', stagger: .08, delay: .35 });
  }
  dispatchEvent(new Event('page:enter'));
  ScrollTrigger.refresh();
}

$$('[data-relief]').forEach(heroRelief);
covers();
if (!calm) reveals();
arrive();

if (window.ZC_PAGE) window.ZC_PAGE(ctx);
})();
