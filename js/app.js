(() => {
// Tout le mouvement du site, sans bibliothèque d'animation : une boucle, des ressorts, IntersectionObserver.
// Le contenu est lisible sans ce fichier (les états cachés n'existent que sous html.js, retiré au bout de 2,5 s si rien ne démarre).
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const css = n => getComputedStyle(root).getPropertyValue(n).trim();
const clamp = (a, b, x) => Math.min(b, Math.max(a, x));
root.classList.add('booted');

/* ---------- Une seule boucle pour tout ---------- */
const ticks = new Set();
// Lenis : défilement amorti à la molette ; le tactile garde le défilement natif ; rien avec le mouvement réduit
const lenis = !calm && window.Lenis ? new Lenis({ lerp: .1 }) : null;
let last = performance.now();
requestAnimationFrame(function loop(t) {
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  lenis?.raf(t);
  ticks.forEach(f => f(dt, t));
  requestAnimationFrame(loop);
});
// ressort amorti : tout ce qui suit le curseur a de l'inertie, sans saccade
const spring = (x = 0, k = 170, c = 26) => ({ x, to: x, v: 0, step(dt) { this.v += (k * (this.to - this.x) - c * this.v) * dt; this.x += this.v * dt; return this.x; } });

/* ---------- Barre, ancres, menu ---------- */
const bar = $('.bar'), menu = $('#menu');
const stick = () => bar.classList.toggle('is-stuck', scrollY > 24);
addEventListener('scroll', stick, { passive: true }); stick();
document.addEventListener('click', e => {
  const a = e.target.closest('a[href*="#"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  if (!target) return;
  e.preventDefault(); menu?.hidePopover?.();
  history.pushState(null, '', url.hash);
  lenis ? lenis.scrollTo(target, { offset: -bar.offsetHeight }) : target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
});
$$('a', menu || document.createElement('nav')).forEach(a => a.addEventListener('click', () => menu.hidePopover?.()));

/* ---------- Apparitions : titres par lignes, blocs, volets sur les images ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
const watch = els => els.forEach(el => io.observe(el));
const heroEls = $$('.hero [data-lines], .hero [data-reveal]');
watch($$('[data-lines], [data-reveal], [data-wipe]').filter(el => !heroEls.includes(el)));

/* ---------- Fond : du papier à la nuit pour les projets, puis retour ---------- */
const night = $('[data-night]');
if (night) {
  let cur = -1;
  const tone = () => {
    const r = night.getBoundingClientRect(), vh = innerHeight;
    const n = Math.round(clamp(0, 1, Math.min((vh * .8 - r.top) / (vh * .45), (r.bottom - vh * .2) / (vh * .45))) * 100) / 100;
    if (n !== cur) { cur = n; root.style.setProperty('--n', n); }
  };
  addEventListener('scroll', tone, { passive: true }); addEventListener('resize', tone); tone();
}

/* ---------- Cartes en courbes de niveau ---------- */
const hexLum = h => { const n = parseInt(h.slice(1), 16); return ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; };
const paperC = css('--paper'), darkPaper = hexLum(paperC) < .5;
const LIGHT = { paper: paperC, ink: css('--ink'), accent: '#D2602A', dark: darkPaper ? 1 : 0 };
const NIGHT = { paper: css('--night'), ink: '#E9EBE6', accent: '#D2602A', dark: 1 };
const seen = el => { const s = { on: false }; new IntersectionObserver(([e]) => (s.on = e.isIntersecting)).observe(el); return s; };
const load = src => new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ko; im.src = src; });
// silhouette d'un dessin au trait (emblèmes) : réduit puis agrandi, c'est un flou qui marche partout ; l'opacité, normalisée, passe dans le vert
const silhouette = im => {
  const W = 256, H = Math.round(W * im.naturalHeight / im.naturalWidth), s = document.createElement('canvas'), b = document.createElement('canvas');
  s.width = 36; s.height = Math.max(4, Math.round(36 * H / W)); s.getContext('2d').drawImage(im, 0, 0, s.width, s.height);
  b.width = W; b.height = H; const x = b.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(s, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H), p = d.data; let mx = 1;
  for (let i = 3; i < p.length; i += 4) mx = Math.max(mx, p[i]);
  for (let i = 0; i < p.length; i += 4) { p[i + 1] = Math.min(255, p[i + 3] * 1100 / mx); p[i] = p[i + 2] = 0; p[i + 3] = 255; }
  x.putImageData(d, 0, 0); return b;
};

// Une carte vivante : la traînée du curseur écarte les courbes sur son passage, plus fort quand le geste est rapide ; si une image
// est donnée (portrait, emblème), sa carte de hauteur plie le terrain et la traînée l'ouvre en fenêtre. Sans souris, une traînée parcourt seule l'image,
// et un toucher lance une onde. Rendu seulement à l'écran ; au repos, une image sur deux.
function scene(c, o) {
  let r; try { r = window.Relief?.createRelief(c, o); } catch {}
  if (!r) return null;
  const host = o.host || c.parentElement, el = o.image?.el;
  let TW = 1, TH = 1, rect = [0, 0, 1, 1], ready = !el, amt = el ? 0 : 1;
  if (!el) r.state.photoOn = 0; // une carte sans image : la traînée ne fait que pousser les courbes, aucune fenêtre (sinon un trou noir)
  const tc = document.createElement('canvas'), tx = tc.getContext('2d');
  const clear = () => { tx.globalCompositeOperation = 'source-over'; tx.fillStyle = '#000'; tx.fillRect(0, 0, TW, TH); };
  const measure = () => {
    r.resize();
    TW = 256; TH = Math.max(64, Math.min(1024, Math.round(256 * c.clientHeight / Math.max(1, c.clientWidth)))); tc.width = TW; tc.height = TH; clear();
    if (el) { const a = c.getBoundingClientRect(), b = el.getBoundingClientRect(); rect = [(b.left - a.left) / a.width, 1 - (b.bottom - a.top) / a.height, b.width / a.width, b.height / a.height]; }
  };
  const stamp = (x, y, rad, al, rgb = '255,255,255') => { // x, y en uv de la carte, y vers le bas
    const X = x * TW, Y = y * TH, R = rad * TH, g = tx.createRadialGradient(X, Y, 0, X, Y, R);
    g.addColorStop(0, `rgba(${rgb},${al})`); g.addColorStop(1, `rgba(${rgb},0)`);
    tx.globalCompositeOperation = 'lighter'; tx.fillStyle = g; tx.fillRect(X - R, Y - R, R * 2, R * 2);
  };
  const vis = seen(c), t0 = performance.now(); let shown = false;
  const draw = (extra = {}) => {
    r.setImage(tc, 2);
    const s = o.parallax && !calm ? scrollY / (c.clientHeight || 1) : 0;
    r.render({ time: calm ? 14 : (performance.now() - t0) / 1000, imgAmt: amt, cam: [0, s * .45], imgRect: [rect[0], rect[1] - s * .15, rect[2], rect[3]], ...extra });
    o.onDraw?.(s);
    if (!shown) { shown = true; c.classList.add('is-on'); } // la carte apparaît en fondu à sa première image, pas d'un coup
  };
  measure();
  new ResizeObserver(() => { measure(); if (calm) draw(); }).observe(host);
  addEventListener('zc:layout', () => { measure(); if (calm) draw(); }); // une image déplacée sans changer de taille (portrait recentré)
  if (el) Promise.all([o.image.height && load(o.image.height), load(o.image.photo)]).then(([hm, ph]) => {
    // un emblème (sans carte de hauteur) reste dessiné par-dessus : rien à révéler, seulement sa silhouette dans le terrain
    try { r.setImage(hm || silhouette(ph), 0); if (hm) r.setImage(ph, 1); else r.state.photoOn = 0; } catch { return o.onFail?.(); } // ouvert en file:// : WebGL refuse les images du disque, l'image reste affichée
    ready = true; o.onReady?.();
    if (calm) { // mouvement réduit : image à moitié révélée, fixe
      const g = tx.createLinearGradient(rect[0] * TW, 0, (rect[0] + rect[2]) * TW, 0);
      g.addColorStop(0, '#fff'); g.addColorStop(.45, '#fff'); g.addColorStop(.62, '#000');
      tx.fillStyle = g; tx.fillRect(0, 0, TW, TH); amt = 1; draw();
    }
  }).catch(() => o.onFail?.());
  if (calm) { draw(); return r; }

  const sx = spring(.5, 110, 20), sy = spring(.5, 110, 20), waves = [];
  let active = false, speed = 0, lx = .5, ly = .5, T = Math.random() * 9, idle = 9, skip = false;
  if (fine) {
    host.addEventListener('pointermove', e => { const a = c.getBoundingClientRect(); sx.to = (e.clientX - a.left) / a.width; sy.to = (e.clientY - a.top) / a.height; if (!active) { sx.x = sx.to; sy.x = sy.to; } active = true; });
    host.addEventListener('pointerleave', () => (active = false));
  }
  host.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; const a = c.getBoundingClientRect(); waves.push({ x: (e.clientX - a.left) / a.width, y: (e.clientY - a.top) / a.height, t: 0 }); });
  ticks.add(dt => {
    if (!ready || !vis.on) return;
    if (el && amt < 1) amt = Math.min(1, amt + dt / 1.2);
    tx.globalCompositeOperation = 'source-over'; tx.fillStyle = `rgba(0,0,0,${1 - Math.pow(.93, dt * 60)})`; tx.fillRect(0, 0, TW, TH);
    let x = lx, y = ly, on = false;
    if (fine) { x = sx.step(dt); y = sy.step(dt); on = active; }
    else if (el) { // sans survol, la traînée parcourt seule l'image
      T += dt; on = true;
      x = rect[0] + rect[2] * (.5 + .3 * Math.sin(T * .45));
      y = 1 - rect[1] - rect[3] * (.55 + .28 * Math.sin(T * .29 + 1));
    }
    if (on) { // une traînée continue : des tampons rapprochés le long du geste ; plus il est rapide, plus elle est large et marquée
      // tout en pixels : la même taille de pinceau sur un hero de 900 px et sur une section de 4000 px
      const ch = c.clientHeight || 1, dpx = Math.hypot((x - lx) * (c.clientWidth || 1), (y - ly) * ch);
      speed += (dpx / Math.max(dt, 1e-3) - speed) * Math.min(1, dt * 10);
      const radPx = (o.brush || 34) + Math.min(speed * .05, o.brushMax || 40), rad = radPx / ch;
      const al = (fine ? .2 : .14) + Math.min(speed * .0006, .35), n = Math.min(32, Math.ceil(dpx / (radPx * .4)));
      for (let i = 1; i <= n; i++) {
        const px = lx + (x - lx) * i / n, py = ly + (y - ly) * i / n;
        stamp(px, py, rad, al / Math.sqrt(n), '255,0,0'); stamp(px, py, rad * 2.2, al * .7 / Math.sqrt(n), '0,255,0');
      }
    }
    lx = x; ly = y;
    for (let i = waves.length; i--;) {
      const w = waves[i]; w.t += dt;
      if (w.t > 1.1) { waves.splice(i, 1); continue; }
      tx.globalCompositeOperation = 'lighter'; tx.strokeStyle = `rgba(255,255,255,${.45 * (1 - w.t / 1.1)})`; tx.lineWidth = .12 * TH;
      tx.beginPath(); tx.arc(w.x * TW, w.y * TH, w.t * .6 * TH, 0, 7); tx.stroke();
    }
    idle = on || waves.length ? 0 : idle + dt;
    if (idle > 2.5 && (skip = !skip)) return; // au repos, le terrain dérive à peine : une image sur deux
    draw();
  });
  return r;
}

const wm = $('.work-map'); if (wm) scene(wm, { ...NIGHT, seed: window.Relief?.seedOf('projets'), peaks: 6, rough: .9, levels: 15, warp: .1 });

// hero : le portrait, la traînée révèle la photo ; le nom avance plus vite que le terrain (vraie profondeur)
const hero = $('.hero'), face = $('.hero-face'), hc = $('.hero-map');
if (hero && face && hc) {
  const img = $('img', face), name = $('.hero-name');
  // le portrait se cale au milieu de l'espace entre « Ziyad » et « Chaabi » (les deux mots n'ont pas la même largeur)
  const centre = () => {
    const w = $$('.ln', name);
    if (w.length < 2 || getComputedStyle(face).position !== 'absolute') return (face.style.left = '');
    const h = hero.getBoundingClientRect(), a = w[0].getBoundingClientRect(), b = w[1].getBoundingClientRect();
    face.style.left = `${((a.right + b.left) / 2 - h.left).toFixed(1)}px`; dispatchEvent(new Event('zc:layout'));
  };
  centre(); addEventListener('resize', centre); document.fonts?.ready.then(centre);
  if (!scene(hc, { ...LIGHT, seed: window.Relief?.seedOf('ziyad-chaabi'), peaks: 5, rough: .8, levels: 16, warp: .08, brush: 64, brushMax: 70, maxDpr: innerWidth > 1100 ? 1.5 : 2, host: hero, parallax: true,
    image: { el: face, height: face.dataset.height, photo: img.currentSrc || img.src },
    onReady: () => root.classList.add('face-gl'), onFail: () => root.classList.add('face-plain'),
    onDraw: s => { if (name) name.style.translate = `0 ${(-s * innerHeight * .12).toFixed(1)}px`; } })) root.classList.add('face-plain'); // sans WebGL, la photo
}

// étude de cas : l'emblème arrive (transition de page), puis se fond dans la carte et se révèle à la traînée
const cm = $('.cs-map'), emb = $('.cs-emblem img');
if (cm) {
  const go = () => scene(cm, { ...LIGHT, seed: window.Relief?.seedOf(location.pathname.split('/').pop()), peaks: 4, rough: .6, levels: 14, warp: .1, edge: .02, blur: .03, host: cm.parentElement,
    ...(emb?.dataset.photo ? { image: { el: emb, photo: emb.dataset.photo } } : {}) });
  // pendant la transition, l'emblème vole au-dessus de tout : on attend qu'il soit posé avant de le fondre dans la carte
  let started = false; const start = () => { if (!started) { started = true; go(); } };
  addEventListener('pagereveal', e => (e.viewTransition ? e.viewTransition.finished.then(start, start) : start()), { once: true });
  setTimeout(start, 900);
}

/* ---------- Étincelles d'étoiles, de temps en temps ---------- */
if (!calm) $$('[data-stars]').forEach(box => {
  const n = +box.dataset.stars || 10, frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const sp = document.createElement('i'); sp.className = 'spark'; sp.setAttribute('aria-hidden', 'true');
    sp.style.cssText = `left:${(Math.random() * 96 + 2).toFixed(1)}%;top:${(Math.random() * 92 + 4).toFixed(1)}%;--s:${(6 + Math.random() * 10).toFixed(0)}px;--d:${(Math.random() * 14).toFixed(1)}s;--t:${(7 + Math.random() * 9).toFixed(1)}s`;
    frag.append(sp);
  }
  box.append(frag);
});

/* ---------- Premier passage : monogramme, puis les objets se rangent dans la bande ---------- */
function intro() {
  if (!root.classList.contains('is-intro')) return Promise.resolve();
  try { sessionStorage.setItem('zc-intro', '1'); } catch {}
  const box = $('.intro'), stack = $('.intro-stack'), items = $$('.band-item:not(.is-dup)');
  items.forEach(p => { const im = $('img', p).cloneNode(); im.removeAttribute('loading'); im.removeAttribute('srcset'); im.src = $('img', p).currentSrc || im.src; stack.append(im); });
  const imgs = [...stack.children], flick = 30, start = 240;
  return new Promise(done => {
    let over = false;
    const end = () => { if (over) return; over = true; root.classList.remove('is-intro'); done(); };
    const skip = () => { imgs.forEach(i => i.getAnimations().forEach(a => a.cancel())); end(); };
    ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, skip, { once: true, passive: true }));
    imgs.forEach((im, i) => im.animate([{ opacity: 1 }, { opacity: 1 }], { delay: start + i * flick, duration: flick, fill: i === imgs.length - 1 ? 'forwards' : 'none' }));
    setTimeout(() => {
      if (over) return;
      const c = stack.getBoundingClientRect(), cx = c.left + c.width / 2, cy = c.top + c.height / 2;
      box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
      items.forEach(it => {
        const b = it.getBoundingClientRect();
        it.animate([{ translate: `${cx - b.left - b.width / 2}px ${cy - b.top - b.height / 2}px`, scale: b.height ? c.height / b.height : 1 }, { translate: '0 0', scale: 1 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
      });
      setTimeout(end, 260);
    }, start + imgs.length * flick);
  });
}
intro().then(() => watch(heroEls));

/* ---------- Bandeau : deux lignes géantes, la vitesse suit celle du défilement ---------- */
const mqs = $$('.mq');
if (mqs.length && !calm) {
  const st = mqs.map(el => ({ el, x: 0, w: 1, dir: +el.dataset.dir }));
  const size = () => st.forEach(s => (s.w = s.el.firstElementChild.getBoundingClientRect().width || 1));
  size(); addEventListener('resize', size); document.fonts?.ready.then(size);
  const vis = seen($('.statement'));
  let ly = scrollY, vel = 0;
  ticks.add(dt => {
    const y = scrollY; vel += ((y - ly) / Math.max(dt, 1e-3) - vel) * Math.min(1, dt * 5); ly = y;
    if (!vis.on) return;
    const sp = 36 + Math.min(Math.abs(vel) * .4, 900);
    st.forEach(s => { s.x = (((s.x + s.dir * sp * dt) % s.w) - s.w) % s.w; s.el.style.transform = `translate3d(${s.x.toFixed(1)}px,0,0)`; });
  });
}

/* ---------- Aperçu qui suit le curseur sur les listes ---------- */
// chaque ligne a son aperçu : la vraie capture quand elle existe, sinon une carte avec le nom du projet
const peek = $('.peek'), rows = $$('.idx-item');
if (peek && rows.length && fine && !calm) {
  const pimg = $('img', peek), ptitle = $('.peek-title', peek), psub = $('.peek-sub', peek), px = spring(0, 110, 20), py = spring(0, 110, 20);
  let on = false, tilt = 0, mx = 0, my = 0;
  const hide = () => { on = false; peek.classList.remove('is-on'); };
  rows.forEach(row => {
    row.addEventListener('pointerenter', e => {
      if (row.closest('[data-view="grid"]')) return;
      mx = e.clientX; my = e.clientY;
      const src = row.dataset.peek;
      peek.classList.toggle('is-card', !src);
      if (src && pimg.getAttribute('src') !== src) pimg.src = src;
      if (!src) { ptitle.textContent = $('.idx-title', row)?.textContent.trim() || ''; psub.textContent = [$('.idx-zone', row)?.textContent, $('.idx-year', row)?.textContent].filter(Boolean).join(', '); }
      if (!peek.classList.contains('is-on')) { px.x = px.to = e.clientX + 28; py.x = py.to = e.clientY - 120; px.v = py.v = 0; }
      on = true; peek.classList.add('is-on');
    });
    row.addEventListener('pointerleave', hide);
  });
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; px.to = mx + 28; py.to = my - peek.offsetHeight * .6; }, { passive: true });
  // la page défile sous le curseur immobile : on vérifie qu'il est encore sur une ligne
  addEventListener('scroll', () => { if (on && !document.elementFromPoint(mx, my)?.closest('.idx-item')) hide(); }, { passive: true });
  ticks.add(dt => {
    if (!on && !peek.classList.contains('is-on')) return;
    px.step(dt); py.step(dt);
    tilt += (clamp(-6, 6, px.v * .012) - tilt) * Math.min(1, dt * 10); // il s'incline selon la vitesse du geste
    peek.style.transform = `translate3d(${px.x.toFixed(1)}px,${py.x.toFixed(1)}px,0) rotate(${tilt.toFixed(2)}deg)`;
  });
}

/* ---------- Liste / grille ---------- */
$$('.view-toggle').forEach(tg => {
  const list = tg.closest('.index')?.querySelector('.idx');
  if (!list) return;
  const set = (v, anim) => {
    list.dataset.view = v;
    $$('button', tg).forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v));
    if (anim && !calm) list.animate([{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }], { duration: 250, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };
  try { const v = localStorage.getItem('zc-view'); if (v === 'grid' || v === 'list') set(v, false); } catch {}
  tg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; set(b.dataset.view, true); try { localStorage.setItem('zc-view', b.dataset.view); } catch {} });
});

/* ---------- Étude de cas : le cadre reste collé, les écrans changent au défilement ---------- */
$$('.built').forEach(b => {
  const shots = $$('.built-shot', b), steps = $$('.built-step', b);
  const show = i => { shots.forEach((s, j) => s.classList.toggle('is-on', j === i)); steps.forEach((s, j) => s.classList.toggle('is-on', j === i)); };
  show(0);
  const sio = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && show(+e.target.dataset.step)), { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => sio.observe(s));
});

/* ---------- Boutons : légère attraction vers le curseur (6 px au plus) ---------- */
if (fine && !calm) $$('.btn').forEach(b => {
  b.addEventListener('pointermove', e => {
    const r = b.getBoundingClientRect();
    b.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width - .5) * 12).toFixed(1)}px`);
    b.style.setProperty('--my', `${(((e.clientY - r.top) / r.height - .5) * 8).toFixed(1)}px`);
  });
  b.addEventListener('pointerleave', () => { b.style.removeProperty('--mx'); b.style.removeProperty('--my'); });
});

/* ---------- Copier l'e-mail ---------- */
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const out = b.parentElement.querySelector('.copy-msg');
  try { await navigator.clipboard.writeText(b.dataset.copy); out.textContent = b.dataset.done; } catch { out.textContent = b.dataset.copy; }
  clearTimeout(b.t); b.t = setTimeout(() => (out.textContent = ''), 2600);
}));
})();
