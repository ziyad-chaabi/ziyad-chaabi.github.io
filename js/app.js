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

function map(c, o) {
  let r; try { r = window.Relief?.createRelief(c, o); } catch {}
  if (!r) return;
  const px = spring(.5, 90, 18), py = spring(.5, 90, 18), pz = spring(0, 60, 16), vis = seen(c), t0 = performance.now();
  const draw = () => r.render({ time: calm ? 14 : (performance.now() - t0) / 1000, pointer: [px.x, py.x, pz.x] });
  new ResizeObserver(() => { r.resize(); draw(); }).observe(c);
  if (calm) return draw();
  const host = c.parentElement;
  if (fine) {
    host.addEventListener('pointermove', e => { const b = c.getBoundingClientRect(); px.to = (e.clientX - b.left) / b.width; py.to = 1 - (e.clientY - b.top) / b.height; pz.to = 1; });
    host.addEventListener('pointerleave', () => (pz.to = 0));
  }
  let odd = false;
  ticks.add(dt => {
    px.step(dt); py.step(dt); pz.step(dt);
    // le terrain dérive lentement : une image sur deux suffit, sauf quand le curseur le déforme
    if (vis.on && ((odd = !odd) || pz.x > .01)) draw();
  });
}
const wm = $('.work-map'); if (wm) map(wm, { ...NIGHT, seed: window.Relief?.seedOf('projets'), peaks: 6, rough: .9, levels: 15 });
const cm = $('.cs-map'); if (cm) map(cm, { ...LIGHT, seed: window.Relief?.seedOf(location.pathname.split('/').pop()), peaks: 4, rough: .6, levels: 14 });

/* ---------- Hero : le portrait en courbes de niveau, la traînée du curseur révèle la photo ---------- */
const hero = $('.hero'), face = $('.hero-face'), hc = $('.hero-map');
if (hero && face && hc && window.Relief) {
  let r; try { r = Relief.createRelief(hc, { ...LIGHT, seed: Relief.seedOf('ziyad-chaabi'), peaks: 5, rough: .8, levels: 16, maxDpr: innerWidth > 1100 ? 1.5 : 2 }); } catch {}
  if (r) heroFace(r);
}
function heroFace(r) {
  // la traînée : une petite toile en niveaux de gris, dans le repère du portrait, qui s'efface doucement
  const TW = 96, TH = 120, tc = document.createElement('canvas'); tc.width = TW; tc.height = TH;
  const tx = tc.getContext('2d'); tx.fillStyle = '#000'; tx.fillRect(0, 0, TW, TH);
  const stamp = (x, y, rad, a) => {
    const g = tx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    tx.globalCompositeOperation = 'lighter'; tx.fillStyle = g; tx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  let rect = [0, 0, 1, 1];
  const measure = () => { r.resize(); const a = hc.getBoundingClientRect(), b = face.getBoundingClientRect(); rect = [(b.left - a.left) / a.width, 1 - (b.bottom - a.top) / a.height, b.width / a.width, b.height / a.height]; };
  measure(); new ResizeObserver(() => { measure(); if (calm && ready) draw(); }).observe(hero);
  const img = $('img', face), load = src => new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ko; im.src = src; });
  let amt = 0, ready = false;
  const vis = seen(hc), t0 = performance.now();
  const sx = spring(.5, 120, 20), sy = spring(.5, 120, 20), sz = spring(0, 50, 14);
  let active = false, speed = 0, lx = .5, ly = .5, T = 0, idle = 0, skip = false;
  const waves = [];
  const draw = (extra = {}) => {
    const s = calm ? 0 : scrollY, H = hc.clientHeight || 1;
    r.render({ time: calm ? 14 : (performance.now() - t0) / 1000, imgAmt: amt, cam: [0, s / H * .45], imgRect: [rect[0], rect[1] - s / H * .15, rect[2], rect[3]], ...extra });
  };
  Promise.all([load(face.dataset.height), load(img.currentSrc || img.src)]).then(([hm, ph]) => {
    try { r.setImage(hm, 0); r.setImage(ph, 1); } catch { return; } // ouvert en file:// : WebGL refuse les images du disque, la photo reste affichée
    ready = true; root.classList.add('face-gl');
    if (calm) { // mouvement réduit : portrait à moitié révélé, fixe
      const g = tx.createLinearGradient(0, 0, TW, 0); g.addColorStop(0, '#fff'); g.addColorStop(.42, '#fff'); g.addColorStop(.62, '#000');
      tx.fillStyle = g; tx.fillRect(0, 0, TW, TH); r.setImage(tc, 2); amt = 1; draw();
    }
  }).catch(() => {});
  if (calm) return draw();

  if (fine) {
    hero.addEventListener('pointermove', e => { const b = face.getBoundingClientRect(); sx.to = (e.clientX - b.left) / b.width; sy.to = (e.clientY - b.top) / b.height; active = true; });
    hero.addEventListener('pointerleave', () => (active = false));
  }
  // au toucher, une onde part du doigt, révèle la photo puis se referme
  face.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; const b = face.getBoundingClientRect(); waves.push({ x: (e.clientX - b.left) / b.width * TW, y: (e.clientY - b.top) / b.height * TH, t: 0 }); });
  const name = $('.hero-name');
  ticks.add(dt => {
    if (!ready || !vis.on) return;
    amt = Math.min(1, amt + dt / 1.2);
    tx.globalCompositeOperation = 'source-over'; tx.fillStyle = `rgba(0,0,0,${1 - Math.pow(.955, dt * 60)})`; tx.fillRect(0, 0, TW, TH);
    let x, y, on;
    if (fine) { x = sx.step(dt); y = sy.step(dt); on = active; }
    else { T += dt; x = .5 + .27 * Math.sin(T * .45); y = .44 + .26 * Math.sin(T * .29 + 1); on = true; } // sans survol, la traînée parcourt seule le visage
    speed += (Math.hypot(x - lx, y - ly) / Math.max(dt, 1e-3) - speed) * Math.min(1, dt * 8); lx = x; ly = y;
    if (on && x > -.15 && x < 1.15 && y > -.15 && y < 1.15) stamp(x * TW, y * TH, (fine ? .09 + Math.min(speed * .06, .22) : .11) * TH, fine ? .5 : .32); // le masque grandit avec la vitesse, se resserre à l'arrêt
    for (let i = waves.length; i--;) {
      const w = waves[i]; w.t += dt;
      if (w.t > 1.1) { waves.splice(i, 1); continue; }
      tx.globalCompositeOperation = 'lighter'; tx.strokeStyle = `rgba(255,255,255,${.5 * (1 - w.t / 1.1)})`; tx.lineWidth = .16 * TH;
      tx.beginPath(); tx.arc(w.x, w.y, w.t * TH, 0, 7); tx.stroke();
    }
    sz.to = on || waves.length ? 1 : 0; sz.step(dt);
    idle = on || waves.length ? 0 : idle + dt;
    if (idle > 2 && (skip = !skip)) return; // au repos : une image sur deux
    r.setImage(tc, 2);
    draw({ pointer: [rect[0] + x * rect[2], rect[1] + (1 - y) * rect[3], sz.x] });
    if (name) name.style.translate = `0 ${-Math.min(scrollY, innerHeight) * .12}px`; // le nom avance plus vite que le terrain : vraie profondeur
  });
}

/* ---------- Premier passage : monogramme, puis les objets se rangent dans la bande ---------- */
function intro() {
  if (!root.classList.contains('intro')) return Promise.resolve();
  try { sessionStorage.setItem('zc-intro', '1'); } catch {}
  const box = $('.intro'), stack = $('.intro-stack'), items = $$('.band-item:not(.is-dup)');
  items.forEach(p => { const im = $('img', p).cloneNode(); im.removeAttribute('loading'); im.removeAttribute('srcset'); im.src = $('img', p).currentSrc || im.src; stack.append(im); });
  const imgs = [...stack.children], flick = 30, start = 240;
  return new Promise(done => {
    let over = false;
    const end = () => { if (over) return; over = true; root.classList.remove('intro'); done(); };
    const skip = () => { imgs.forEach(i => i.getAnimations().forEach(a => a.cancel())); end(); };
    ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, skip, { once: true, passive: true }));
    imgs.forEach((im, i) => im.animate([{ opacity: 1 }, { opacity: 1 }], { delay: start + i * flick, duration: flick, fill: i === imgs.length - 1 ? 'forwards' : 'none' }));
    setTimeout(() => {
      if (over) return;
      const c = stack.getBoundingClientRect(), cx = c.left + c.width / 2, cy = c.top + c.height / 2;
      box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
      items.forEach(it => {
        const b = it.getBoundingClientRect();
        it.animate([{ translate: `${cx - b.left - b.width / 2}px ${cy - b.top - b.height / 2}px`, scale: c.height / b.height }, { translate: '0 0', scale: 1 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
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
const peek = $('.peek'), rows = $$('[data-peek]');
if (peek && rows.length && fine && !calm) {
  const pimg = $('img', peek), px = spring(0, 110, 20), py = spring(0, 110, 20);
  let on = false, tilt = 0, mx = 0, my = 0;
  const hide = () => { on = false; peek.classList.remove('is-on'); };
  rows.forEach(row => {
    row.addEventListener('pointerenter', e => {
      if (row.closest('[data-view="grid"]')) return;
      if (pimg.getAttribute('src') !== row.dataset.peek) pimg.src = row.dataset.peek;
      if (!peek.classList.contains('is-on')) { px.x = px.to = e.clientX + 28; py.x = py.to = e.clientY - 120; px.v = py.v = 0; }
      on = true; peek.classList.add('is-on');
    });
    row.addEventListener('pointerleave', hide);
  });
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; px.to = mx + 28; py.to = my - peek.offsetHeight * .6; }, { passive: true });
  // la page défile sous le curseur immobile : on vérifie qu'il est encore sur une ligne
  addEventListener('scroll', () => { if (on && !document.elementFromPoint(mx, my)?.closest('[data-peek]')) hide(); }, { passive: true });
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
