// Génère toutes les pages HTML statiques à partir de js/data.js (contenu écrit à la main)
// et de data/auto.json (dépôts GitHub synchronisés par scripts/sync.mjs).
// Usage : node build.mjs   (aucune dépendance, aucun serveur nécessaire ensuite)
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import vm from 'node:vm';

// js/data.js est un script classique (il pose window.ZC) : on l'exécute dans un bac à sable.
const sandbox = { window: {} };
vm.runInNewContext(readFileSync('js/data.js', 'utf8'), sandbox);
const { site, projects, repos, timeline, skills, notes, labZone } = sandbox.window.ZC;

/* ---------- Dépôts synchronisés automatiquement ---------- */
const auto = existsSync('data/auto.json') ? JSON.parse(readFileSync('data/auto.json', 'utf8')) : [];
const curatedRepo = new Map(); // nom du dépôt GitHub → projet écrit à la main
projects.forEach(p => p.links.forEach(([, u]) => { const m = u.match(/github\.com\/Subdij\/([^/]+)/); if (m) curatedRepo.set(m[1], p); }));
// dépôts sans page écrite à la main : on leur fabrique une page (le texte écrit dans data.js reste prioritaire)
const autoPages = auto.filter(a => !curatedRepo.has(a.repo)).map(a => {
  const hand = repos.find(r => r.repo === a.repo || r.n === a.title);
  return {
    ...a, title: hand?.n || a.title, desc: hand?.d || a.description || 'Un dépôt publié sur GitHub.',
    zone: hand?.z || a.zone, stack: hand?.s?.length ? hand.s : a.stack, year: hand?.y || a.year,
    shot: a.images.find(i => /desktop|readme|repo/.test(i)) || a.images[0], shotM: a.images.find(i => /mobile/.test(i)),
  };
});
// dépôts privés listés à la main (GymBud, Magasin VR…) : pas de page, mais un sommet dans le labo
const privateRepos = repos.filter(r => !r.repo);
// le labo et le navigateur lisent ces données via js/auto.js
writeFileSync('js/auto.js', `// Généré par build.mjs à partir de data/auto.json : ne pas modifier à la main.\nwindow.ZC_AUTO = ${JSON.stringify(autoPages.map(a => ({ slug: a.slug, repo: a.repo, name: a.title, zone: a.zone, year: a.year, desc: a.desc, stack: a.stack, img: a.shot || null, live: a.live || null, stars: a.stars })))};\n`);

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const labCount = projects.length + autoPages.length + privateRepos.length;
const T = {
  index: 'Retour au point de départ', parcours: 'On remonte le temps', projets: 'Voilà ce qui en est sorti',
  competences: 'La boîte à outils', labo: 'On descend au labo', veille: 'Ce qui bouge en ce moment',
};
const NAV = [['index', 'Accueil'], ['parcours', 'Parcours'], ['projets', 'Projets', projects.length], ['competences', 'Compétences'], ['labo', 'Labo', labCount], ['veille', 'Veille']];
const firstImg = p => p.screen || p.screenM || p.cover || p.figures?.find(f => f.type === 'img')?.src || null;

/* ---------- Images des écrans 3D embarquées pour l'ouverture en double-clic ----------
   En file://, le navigateur refuse de passer une image du disque à WebGL. On fournit donc,
   seulement dans ce cas, une copie encodée des images utilisées par les modèles 3D. */
rmSync('js/tex', { recursive: true, force: true }); mkdirSync('js/tex', { recursive: true });
function texBundle(name, srcs) {
  const list = [...new Set(srcs.filter(Boolean))].filter(s => existsSync(s));
  if (!list.length) return '';
  const mime = s => (s.endsWith('.webp') ? 'image/webp' : s.endsWith('.png') ? 'image/png' : 'image/jpeg');
  writeFileSync(`js/tex/${name}.js`, `window.ZC_TEX = window.ZC_TEX || {};\n` + list.map(s => `ZC_TEX[${JSON.stringify(s)}] = 'data:${mime(s)};base64,${readFileSync(s).toString('base64')}';`).join('\n') + '\n');
  return name;
}

// Une seule entité « Ziyad Chaabi », référencée par son @id sur toutes les pages : c'est ce qui permet
// à un moteur de relier le site, la personne et ses profils (recherche sur le nom).
const ME = site.url + '#ziyad', SITE = site.url + '#site';
const PERSON = {
  '@type': 'Person', '@id': ME, name: 'Ziyad Chaabi', givenName: 'Ziyad', familyName: 'Chaabi', alternateName: ['Ziyad CHAABI', 'Subdij'],
  url: site.url, image: { '@type': 'ImageObject', url: site.url + 'img/ziyad-photo.webp', caption: 'Ziyad Chaabi' },
  jobTitle: 'Développeur web, mobile et réalité virtuelle',
  description: 'Développeur à Troyes, passé par le design avant le code : applications web et mobiles, réalité virtuelle et IA appliquée.',
  email: 'mailto:' + site.email,
  address: { '@type': 'PostalAddress', addressLocality: 'Troyes', addressRegion: 'Grand Est', addressCountry: 'FR' },
  alumniOf: [{ '@type': 'CollegeOrUniversity', name: 'INSA Hauts-de-France' }, { '@type': 'CollegeOrUniversity', name: 'Université Gustave Eiffel, IUT de Meaux' }],
  knowsAbout: ['TypeScript', 'Angular', 'Ionic', 'NestJS', 'PostgreSQL', 'React Native', 'Supabase', 'Intelligence artificielle', 'Réalité virtuelle', 'Unity', 'UX design'],
  knowsLanguage: ['fr', 'ar', 'en'],
  sameAs: [site.linkedin, site.github, 'https://github.com/ziyad-chaabi', site.instagram],
};
const WEBSITE = { '@type': 'WebSite', '@id': SITE, url: site.url, name: 'Ziyad Chaabi', alternateName: 'Portfolio de Ziyad Chaabi', inLanguage: 'fr-FR', publisher: { '@id': ME }, author: { '@id': ME } };
function graph({ title, desc, path, jsonld }) {
  const url = site.url + path, name = title.split(' | ')[0];
  const pageNode = path === ''
    ? { '@type': 'ProfilePage', '@id': url + '#page', url, name: title, description: desc, isPartOf: { '@id': SITE }, about: { '@id': ME }, mainEntity: { '@id': ME }, inLanguage: 'fr-FR', primaryImageOfPage: { '@type': 'ImageObject', url: site.url + 'img/og.jpg' } }
    : { '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, isPartOf: { '@id': SITE }, about: { '@id': ME }, author: { '@id': ME }, inLanguage: 'fr-FR',
        breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [['Accueil', ''], ...(path.startsWith('projets/') ? [['Projets', 'projets.html']] : []), [name, path]]
          .map(([n, p], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: site.url + p })) } };
  return { '@context': 'https://schema.org', '@graph': [WEBSITE, PERSON, pageNode, ...(jsonld ? [jsonld] : [])] };
}

function head({ title, desc, path, b, image = 'img/og.jpg', jsonld = '' }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Ziyad Chaabi">
<meta name="google-site-verification" content="4kWqjcimy18LhSDn4mD4XuOtKIBeuHQXVvQ8QMu2TKg">
<meta name="robots" content="${path === '404.html' ? 'noindex' : 'index, follow, max-image-preview:large'}">
<meta name="theme-color" content="#121417">
<link rel="canonical" href="${site.url}${path}">
<link rel="icon" href="${b}favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Ziyad Chaabi">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${site.url}${path}">
<meta property="og:image" content="${site.url}${image}">
<meta name="twitter:card" content="summary_large_image">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Ziyad Chaabi, développeur à Troyes">
${path === '404.html' ? '' : `<script type="application/ld+json">${JSON.stringify(graph({ title, desc, path, jsonld }))}</script>`}
<style>html.js:not(.is-ready){background:#121417}html.js .veil{position:fixed;inset:0;z-index:100;background:#121417}</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${b}css/style.css">
<script>document.documentElement.classList.add('js');setTimeout(function(){if(!document.documentElement.classList.contains('is-ready'))document.documentElement.classList.remove('js')},8000)</script>
</head>`;
}

// Scripts classiques uniquement : le site marche aussi ouvert en double-clic (file://).
// three.js n'existe qu'en module : un petit module en ligne le charge depuis le CDN puis prévient la page.
const PAGE_JS = { parcours: 'parcours', projets: 'projets', competences: 'competences', labo: 'labo', veille: 'veille' };
const THREE_PAGES = ['parcours', 'labo', 'projet'];
const THREE_LOADER = `<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.min.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
window.THREE = THREE; window.THREE_ADDONS = { MapControls, RoomEnvironment, RoundedBoxGeometry };
dispatchEvent(new Event('three:ready'));
</script>`;

function shell(page, b, main, tex) {
  const nav = NAV.map(([k, label, n]) => `<a href="${b}${k}.html" data-t="${T[k]}"${page === k ? ' aria-current="page"' : ''}>${label}${n ? `<sup>${n}</sup>` : ''}</a>`).join('');
  return `<body data-page="${page}" data-base="${b}">
<div class="veil" aria-hidden="true"><canvas></canvas><p class="veil-text"></p><p class="veil-count"></p></div>
<a class="skip" href="#main">Aller au contenu</a>
<header class="site-head">
  <a class="brand" href="${b}index.html" data-t="${T.index}">Ziyad Chaabi</a>
  <nav class="nav" aria-label="Navigation principale">${nav}</nav>
  <p class="head-meta">Troyes <span data-clock>--:--</span></p>
  <a class="head-cta" href="#contact">Me contacter</a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
</header>
<div class="menu-panel" id="menu">
  <nav aria-label="Menu">
    ${nav}
  </nav>
  <p class="menu-foot"><a href="mailto:${site.email}">${site.email}</a></p>
</div>
<main id="main">
${main}
</main>
${footer(b)}
<div class="cursor" aria-hidden="true"><span class="cursor-dot"></span><span class="cursor-ring"><em class="cursor-label"></em></span></div>
<div class="peek" aria-hidden="true"><canvas></canvas><img alt=""><p class="peek-title"></p></div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js"></script>
<script src="${b}js/data.js"></script>
<script src="${b}js/auto.js"></script>
<script src="${b}js/relief.js"></script>
${tex ? `<script>if (location.protocol === 'file:') document.write('<script src="${b}js/tex/${tex}.js"><\\/script>');</script>` : ''}
${THREE_PAGES.includes(page) ? `<script src="${b}js/devices.js"></script>` : ''}
${page === 'veille' ? `<script src="${b}js/veille-data.js"></script>` : ''}
${PAGE_JS[page] ? `<script src="${b}js/pages/${PAGE_JS[page]}.js"></script>` : ''}
<script src="${b}js/app.js"></script>
${THREE_PAGES.includes(page) ? THREE_LOADER : ''}
</body>
</html>
`;
}

function footer(b) {
  return `<footer class="site-foot" id="contact">
  <div class="wrap">
    <h2 class="foot-title" data-split>Écrivons-nous.</h2>
    <p class="foot-kicker">Un projet, une idée, une question sur la VR&nbsp;: la boîte est ouverte.</p>
    <div class="foot-main">
      <div class="foot-mail">
        <a href="mailto:${site.email}" data-cursor="Écrire">${site.email}</a>
        <button type="button" data-copy="${site.email}" data-cursor="Copier">Copier l’adresse</button>
        <span class="copy-msg" aria-live="polite"></span>
      </div>
      <div class="foot-cols">
        <div><h3>Ailleurs</h3><ul>
          <li><a href="${site.linkedin}" target="_blank" rel="noopener me">LinkedIn</a></li>
          <li><a href="${site.github}" target="_blank" rel="noopener me">GitHub</a></li>
          <li><a href="${site.instagram}" target="_blank" rel="noopener me">Instagram</a></li>
        </ul></div>
        <div><h3>Pages</h3><ul>
          ${NAV.map(([k, l]) => `<li><a href="${b}${k}.html" data-t="${T[k]}">${l}</a></li>`).join('')}
        </ul></div>
      </div>
    </div>
    <div class="foot-bottom">
      <p>© 2026 Ziyad Chaabi, Troyes</p>
      <p>48°17′ N, 4°04′ E</p>
      <a href="#main">Revenir en haut</a>
    </div>
  </div>
</footer>`;
}

const page = (file, opts, main) => {
  const b = file.includes('/') ? '../' : '';
  writeFileSync(file, head({ ...opts, b }) + '\n' + shell(opts.page, b, main, opts.tex));
};
const relief = (seed, extra = '') => `<canvas class="page-relief" data-relief data-seed="${seed}" data-peaks="4" data-rough=".75" ${extra}></canvas>`;
const device = (o, b) => `<canvas class="device-canvas" data-device="${o.device}"${o.screen ? ` data-screen="${o.screen}"` : ''}${o.screenM ? ` data-screen-m="${o.screenM}"` : ''} data-seed="${o.slug}" data-color="${o.color || '#D2602A'}" role="img" aria-label="${esc(o.label || '')}"></canvas>`;

const tag = p => ({ pro: 'Pro', perso: 'Perso', ecole: 'École' }[p.kind]);
const rows = (list, b) => list.map(p => `
    <li class="row-item" data-kind="${p.kind}">
      <a class="row" href="${b}projets/${p.slug}.html" data-peek="${p.slug}"${firstImg(p) ? ` data-img="${b}${firstImg(p)}"` : ''} data-cursor="Ouvrir" data-t="${esc(p.title)}">
        <span class="row-cover">${firstImg(p) ? `<img src="${b}${firstImg(p)}" alt="" loading="lazy">` : `<canvas data-cover="${p.slug}"></canvas>`}</span>
        <span class="row-title">${esc(p.title)}</span>
        <span class="row-meta">${esc(p.context)}</span>
        <span class="row-year">${p.year}</span>
      </a>
    </li>`).join('');

/* ================= Accueil ================= */
const pc = slug => projects.find(p => p.slug === slug).color;
const off = [
  { what: 'Manga', color: pc('pub-steel-ball-run'), text: 'JoJo’s Bizarre Adventure, surtout Steel Ball Run. Assez pour en tirer une pub animée et un labyrinthe en 3D.', links: [['Pub Steel Ball Run', 'projets/pub-steel-ball-run.html'], ['JoJo Maze', 'projets/jojo-maze.html']] },
  { what: 'League of Legends', color: pc('lolop'), text: 'Je voulais les fiches des champions dans la poche, même dans le train sans réseau. J’ai fini par écrire l’appli.', links: [['lolop', 'projets/lolop.html']] },
  { what: 'Muscu', color: pc('subforge'), text: 'J’ai repris avec un objectif de prise de masse. Noter mes repas me faisait lâcher au bout d’une semaine, alors j’ai construit l’outil qui me manquait.', links: [['SubForge', 'projets/subforge.html']] },
  { what: 'E-sport', color: '#2F5BEA', text: 'Dans l’équipe de l’INSA pendant le master, entre deux rendus.', links: [['Le parcours', 'parcours.html']] },
  { what: 'Petites frustrations', color: '#46546E', text: 'Un portail wifi qui me déconnectait sans arrêt. Un script Python s’en occupe maintenant.', links: [['Wifi auto', 'projets/wifi-connexion.html']] },
];
const featured = ['btp-360', 'subforge', 'distri-sur-france', 'funfair-vr', 'zabi'].map(s => projects.find(p => p.slug === s));
page('index.html', {
  page: 'index', path: '', tex: texBundle('index', ['img/ziyad-relief.png', 'img/ziyad-photo.webp']),
  title: 'Ziyad Chaabi | Développeur Full Stack à Troyes, web, mobile et IA',
  desc: 'Portfolio de Ziyad Chaabi, développeur full stack TypeScript basé à Troyes : applications web et mobiles (Angular, NestJS, React Native), IA appliquée et réalité virtuelle.',
}, `
<section class="hero hero-home">
  <canvas class="hero-canvas" data-relief data-img="img/ziyad-relief.png" data-photo="img/ziyad-photo.webp" data-seed="ziyad-chaabi" data-peaks="5" data-rough=".8" data-levels="16"></canvas>
  <div class="hero-grid wrap">
    <div class="hero-copy">
      <a class="status" href="projets/subforge.html" data-t="SubForge" data-hero-fade><span class="dot"></span>En ce moment : SubForge, un coach nutrition à l’IA</a>
      <h1 class="hero-title"><span class="display hero-name" data-hero>Ziyad<br>Chaabi</span></h1>
      <p class="hero-lede" data-hero-fade>Développeur à Troyes, passé par le design avant le code. Je fais des applis web et mobiles, des mondes en réalité virtuelle, et des scripts pour les petites frustrations du quotidien.</p>
      <div class="hero-cta" data-hero-fade>
        <a class="btn" href="projets.html" data-t="${T.projets}">Voir mes projets</a>
        <a class="btn btn-line" href="labo.html" data-t="${T.labo}">Explorer le labo</a>
      </div>
    </div>
    <figure class="hero-stage" data-hero-fade title="Maintenez le clic pour voir la photo">
      <img src="img/ziyad-photo.webp" alt="Portrait de Ziyad Chaabi" width="600" height="750">
    </figure>
  </div>
</section>

<section class="intro wrap">
  <p class="intro-a" data-reveal>J’aime comprendre un problème avant d’ouvrir l’éditeur.</p>
  <div class="intro-b" data-reveal>
    <p>Je pense d’abord aux gens qui vont se servir de l’outil, sur un chantier ou un casque VR sur la tête, et seulement ensuite à la stack.</p>
    <a class="arrow-link" href="parcours.html" data-t="${T.parcours}">Lire mon parcours</a>
  </div>
</section>

<section class="work wrap">
  <div class="sec-head"><h2 class="h2" data-reveal>Projets choisis</h2><a class="arrow-link" href="projets.html" data-t="${T.projets}">Voir les ${projects.length} projets</a></div>
  <ol class="rows">${rows(featured, '')}
  </ol>
</section>

<section class="off wrap">
  <div class="sec-head"><h2 class="h2" data-reveal>Hors de l’écran</h2><p class="sec-note" data-reveal>Presque tous mes projets perso sont nés d’ici.</p></div>
  <ul class="off-list">${off.map(o => `
    <li class="off-item" style="--c:${o.color}" data-reveal>
      <p class="off-what">${o.what}</p>
      <p class="off-text">${o.text}</p>
      <p class="off-links">${o.links.map(([l, h]) => `<a class="arrow-link" href="${h}" data-t="${esc(l)}">${l}</a>`).join('')}</p>
    </li>`).join('')}
  </ul>
</section>

<section class="band">
  <canvas class="band-canvas" data-relief="dark" data-seed="labo" data-peaks="6" data-rough=".9" data-accent="#E07A3E"></canvas>
  <div class="band-inner wrap">
    <h2 class="h2" data-reveal>Le labo</h2>
    <p data-reveal>${labCount} projets et dépôts, des projets d’école aux expériences du dimanche, posés sur une carte en relief que l’on parcourt en 3D. Elle se met à jour toute seule à chaque nouveau dépôt GitHub.</p>
    <a class="btn" href="labo.html" data-t="${T.labo}" data-cursor="Explorer" data-reveal>Explorer le labo</a>
  </div>
</section>

<section class="now wrap">
  <h2 class="h2" data-reveal>Ce que je lis</h2>
  <div class="now-grid">
    <p data-reveal>Les agents de code, MCP, les dépôts qui grimpent sur GitHub dans la semaine. Ma veille les rassemble, rechargée à chaque visite.</p>
    <a class="arrow-link" href="veille.html" data-t="${T.veille}" data-reveal>Ma veille, en direct</a>
  </div>
</section>`);

/* ================= Projets ================= */
page('projets.html', {
  page: 'projets', path: 'projets.html',
  title: 'Projets | Ziyad Chaabi, développeur full stack',
  desc: `${projects.length} projets de Ziyad Chaabi : BTP-360 (SaaS Angular, NestJS, AWS), SubForge (React Native et IA), réalité virtuelle, e-commerce et sites web, et ${autoPages.length} autres dépôts dans le labo.`,
}, `
<section class="page-hero wrap">
  ${relief('projets')}
  <h1 class="display" data-hero>Projets</h1>
  <p class="page-lede" data-hero-fade>${projects.length} projets, du stage de fin d’études aux exercices de BUT. Chaque fiche raconte le problème, ce que j’ai fait et ce que j’en ai retenu.</p>
</section>
<section class="wrap">
  <div class="toolbar" data-hero-fade>
    <div class="filters" role="group" aria-label="Filtrer les projets">
      <button type="button" aria-pressed="true" data-f="all">Tous <sup>${projects.length}</sup></button>
      <button type="button" aria-pressed="false" data-f="pro">Pro <sup>${projects.filter(p => p.kind === 'pro').length}</sup></button>
      <button type="button" aria-pressed="false" data-f="perso">Perso <sup>${projects.filter(p => p.kind === 'perso').length}</sup></button>
      <button type="button" aria-pressed="false" data-f="ecole">École <sup>${projects.filter(p => p.kind === 'ecole').length}</sup></button>
    </div>
    <div class="views" role="group" aria-label="Affichage">
      <button type="button" aria-pressed="true" data-v="list">Liste</button>
      <button type="button" aria-pressed="false" data-v="grid">Grille</button>
    </div>
  </div>
  <ol class="rows rows-all">${rows(projects, '')}
  </ol>
</section>
<section class="more wrap">
  <p class="statement" data-reveal>Les ${autoPages.length} autres dépôts, des exercices d’école aux scripts du dimanche, sont rangés sur la carte du labo.</p>
  <a class="btn" href="labo.html" data-t="${T.labo}" data-cursor="Explorer" data-reveal>Explorer le labo</a>
</section>`);

/* ================= Pages projet ================= */
rmSync('projets', { recursive: true, force: true });
mkdirSync('projets', { recursive: true });
const figure = (f, b) => {
  const cap = f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : '';
  if (f.type === 'img') return `<figure class="fig${f.wide ? ' fig-wide' : ''}" data-reveal><img src="${b}${f.src}" alt="${esc(f.alt)}" loading="lazy">${cap}</figure>`;
  if (f.type === 'phones') return `<figure class="fig fig-wide fig-phones" data-reveal><div class="phones">${f.srcs.map(s => `<img src="${b}${s}" alt="" loading="lazy">`).join('')}</div>${cap}</figure>`;
  if (f.type === 'video') return `<figure class="fig fig-wide" data-reveal><video src="${b}${f.src}" poster="${b}${f.poster}" ${f.sound ? 'controls' : 'autoplay muted loop'} playsinline preload="metadata"></video>${cap}</figure>`;
  if (f.type === 'diagram') return `<figure class="fig fig-wide fig-diagram" data-reveal><ol class="diagram">${f.layers.map(([t, items]) => `<li><h3>${esc(t)}</h3><ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></li>`).join('')}</ol>${cap}</figure>`;
  return '';
};
const section = s => `
<section class="p-sec wrap">
  <h2 class="p-sec-title" data-reveal>${esc(s.title)}</h2>
  <div class="p-sec-body">
    ${(s.body || []).map(t => `<p data-reveal>${esc(t)}</p>`).join('')}
    ${s.list ? `<dl class="p-list">${s.list.map(([k, v]) => `<div data-reveal><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
    ${s.quote ? `<blockquote class="p-quote" data-reveal><p>« ${esc(s.quote[0])} »</p><footer>${esc(s.quote[1])}</footer></blockquote>` : ''}
  </div>
</section>`;
const nextBlock = (next, b) => `
<a class="p-next" href="${next.slug}.html" data-t="${esc(next.title)}" data-cursor="Suivant" style="--accent:${next.color || '#D2602A'}">
  <span class="p-next-label">Projet suivant</span>
  <span class="p-next-title display${next.title.length > 12 ? ' is-long' : ''}">${esc(next.title)}</span>
  <span class="p-next-cover">${firstImg(next) ? `<img src="${b}${firstImg(next)}" alt="" loading="lazy">` : `<canvas data-cover="${next.slug}"></canvas>`}</span>
</a>`;

projects.forEach((p, i) => {
  const b = '../', n = projects.length;
  const prev = projects[(i - 1 + n) % n], next = projects[(i + 1) % n];
  const [first, ...rest] = p.figures;
  const links = p.links.map(([l, u]) => `<a class="btn btn-line" href="${u}" target="_blank" rel="noopener">${esc(l)}</a>`).join('');
  page(`projets/${p.slug}.html`, {
    page: 'projet', path: `projets/${p.slug}.html`, tex: texBundle(p.slug, [p.screen, p.screenM]),
    title: `${p.title} | Projet de Ziyad Chaabi`,
    desc: `${p.kicker} ${p.context}, ${p.period}. Stack : ${p.stack.slice(0, 6).join(', ')}.`,
    jsonld: { '@type': 'CreativeWork', '@id': `${site.url}projets/${p.slug}.html#projet`, name: p.title, description: p.kicker, dateCreated: p.year,
      author: { '@id': ME }, keywords: p.stack.join(', '), url: `${site.url}projets/${p.slug}.html`, ...(firstImg(p) ? { image: site.url + firstImg(p) } : {}) },
  }, `
<article class="p" style="--accent:${p.color}" data-slug="${p.slug}">
<section class="p-hero">
  ${relief(p.slug, `data-accent="${p.color}" data-peaks="${p.relief?.peaks || 3}" data-rough="${p.relief?.rough || .5}"`)}
  <div class="wrap p-top" data-hero-fade>
    <a class="back" href="${b}projets.html" data-t="${T.projets}">Tous les projets</a>
  </div>
  <div class="p-head wrap">
    <div class="p-head-copy">
      <p class="p-context" data-hero-fade><span class="tag">${tag(p)}</span>${esc(p.context)}, ${esc(p.year)}</p>
      <h1 class="display p-title${p.title.length > 12 ? ' is-long' : ''}" data-hero>${esc(p.title)}</h1>
      <p class="p-kicker" data-hero-fade>${esc(p.kicker)}</p>
    </div>
    <div class="p-stage" data-hero-fade>${device({ ...p, label: `${p.title} en 3D` }, b)}</div>
  </div>
</section>

<section class="p-info wrap">
  <dl class="p-meta">
    <div><dt>Contexte</dt><dd>${esc(p.org)}</dd></div>
    <div><dt>Période</dt><dd>${esc(p.period)}</dd></div>
    <div><dt>Équipe</dt><dd>${esc(p.team)}</dd></div>
    <div><dt>Mon rôle</dt><dd>${esc(p.role)}</dd></div>
    <div class="p-stack"><dt>Stack</dt><dd><ul class="chips">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul></dd></div>
  </dl>
  <div class="p-intro">
    <p data-reveal>${esc(p.intro)}</p>
    ${links || p.privateNote ? `<div class="p-links" data-reveal>${links}${p.privateNote ? `<p class="note">${esc(p.privateNote)}</p>` : ''}</div>` : ''}
  </div>
</section>
${p.stats ? `<p class="p-stats wrap" data-reveal>${p.stats.map(([v, l]) => `<span><b>${v}</b> ${esc(l)}</span>`).join('')}</p>` : ''}
${first ? `<div class="wrap p-figs">${figure(first, b)}</div>` : ''}
${p.sections.map(section).join('')}
${rest.length ? `<div class="wrap p-figs p-gallery">${rest.map(f => figure(f, b)).join('')}</div>` : ''}

<nav class="pager wrap" aria-label="Autres projets">
  <a href="${prev.slug}.html" data-t="${esc(prev.title)}"><span>Précédent</span>${esc(prev.title)}</a>
  <a href="${b}projets.html" data-t="${T.projets}">Tous les projets</a>
</nav>
${nextBlock(next, b)}
</article>`);
});

/* ---------- Pages des dépôts synchronisés ---------- */
autoPages.forEach((a, i) => {
  const b = '../', next = autoPages[(i + 1) % autoPages.length];
  page(`projets/${a.slug}.html`, {
    page: 'depot', path: `projets/${a.slug}.html`,
    title: `${a.title} | Dépôt GitHub de Ziyad Chaabi`,
    desc: `${a.desc} ${a.stack.length ? `Stack : ${a.stack.join(', ')}.` : ''}`,
  }, `
<article class="p p-auto" style="--accent:#D2602A" data-slug="${a.slug}">
<section class="p-hero">
  ${relief(a.slug)}
  <div class="wrap p-top" data-hero-fade>
    <a class="back" href="${b}labo.html" data-t="${T.labo}">Retour au labo</a>
    <p>Dépôt GitHub</p>
  </div>
  <div class="wrap">
    <p class="p-context" data-hero-fade><span class="tag">GitHub</span>${esc(a.year)}${a.stars ? `, ★ ${a.stars}` : ''}</p>
    <h1 class="h2 p-light-title" data-hero>${esc(a.title)}</h1>
  </div>
</section>
<section class="p-info wrap">
  <dl class="p-meta">
    <div><dt>Créé en</dt><dd>${esc(a.year)}</dd></div>
    ${a.stack.length ? `<div class="p-stack"><dt>Langages</dt><dd><ul class="chips">${a.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul></dd></div>` : ''}
    ${a.source ? `<div><dt>Visuels</dt><dd>${esc(a.source === 'lancé en local' ? 'Captures prises en lançant le projet' : a.source === 'site en ligne' ? 'Captures du site en ligne' : 'Images du dépôt')}</dd></div>` : ''}
  </dl>
  <div class="p-intro">
    ${(a.paras.length ? a.paras : [a.desc]).map(t => `<p data-reveal>${esc(t)}</p>`).join('')}
    ${a.bullets.length ? `<ul class="p-bullets" data-reveal>${a.bullets.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <div class="p-links" data-reveal><a class="btn btn-line" href="${a.url}" target="_blank" rel="noopener">Voir le code</a>${a.live ? `<a class="btn btn-line" href="${a.live}" target="_blank" rel="noopener">Voir en ligne</a>` : ''}</div>
  </div>
</section>
${a.images.length ? `<div class="wrap p-figs p-gallery">${a.images.map(g => /mobile/.test(g) ? `<figure class="fig fig-phone" data-reveal><img src="${b}${g}" alt="" loading="lazy"></figure>` : `<figure class="fig" data-reveal><img src="${b}${g}" alt="" loading="lazy"></figure>`).join('')}</div>` : ''}
${nextBlock(next, b)}
</article>`);
});

/* ================= Parcours ================= */
const avis = [
  { name: 'Juliana Rebelo', role: 'Assistante marketing et communication, ma tutrice chez Réseau Sûr France', img: 'img/avis/juliana-rebelo.webp',
    text: 'Ziyad a su mettre en avant ses compétences et son savoir-faire tout au long de son stage. Il s’est adapté très rapidement à l’entreprise, à sa charte graphique ainsi qu’à son fonctionnement.' },
  { name: 'Karima Ghezza', role: 'Orthoptiste chez Ophta Médical, Troyes', img: 'img/avis/karima-ghezza.webp',
    text: 'Il nous a apporté des idées pour compléter notre planning du personnel, en créant un tableau qui permet de calculer les heures de travail journalières et de visualiser les heures supplémentaires de chaque employé.' },
];
const initials = n => n.split(' ').map(w => w[0]).join('');
page('parcours.html', {
  page: 'parcours', path: 'parcours.html',
  title: 'Parcours | Ziyad Chaabi, de Troyes à Valenciennes, et retour',
  desc: "Le parcours de Ziyad Chaabi : bac STI2D à Troyes, BUT MMI à Meaux, Master Sciences et Technologies du Métavers à l'INSA Hauts-de-France, stages et alternance jusqu'à BTP-360.",
}, `
<section class="page-hero wrap">
  ${relief('parcours')}
  <h1 class="ph-title" data-hero>De Troyes à Valenciennes, et retour.</h1>
  <p class="page-lede" data-hero-fade>Un bac à Troyes, le design à Meaux, la réalité virtuelle à Valenciennes, et entre deux, des stages et une alternance dans des entreprises de l’Aube. Voici le chemin, étape par étape.</p>
</section>
<div class="ph-strip wrap" data-reveal>
  <figure><img src="img/ziyad-camera.webp" alt="Ziyad Chaabi, sourire aux lèvres, une caméra JVC à l’épaule" width="1600" height="1200"></figure>
  <figure><img src="img/ziyad-photo.webp" alt="Portrait de Ziyad Chaabi, lunettes rondes et veste à chevrons" width="600" height="750"></figure>
  <figure><img src="img/ziyad-vr.webp" alt="Ziyad présente un projet de réalité virtuelle à l’INSA, un Meta Quest 3 sur le bureau" width="1400" height="880" loading="lazy"><figcaption>Avril 2025, présentation d’un projet VR à l’INSA</figcaption></figure>
</div>

<section class="chapters wrap" aria-label="Chronologie">
  <div class="ch-rail" aria-hidden="true"><span></span></div>
  <ol>
    ${timeline.map((s, i) => `<li class="chapter${s.img ? ' has-img' : ''}">
      <div class="ch-when"><span class="ch-year">${s.year}</span><span class="ch-place">${esc(s.place)}<small>${esc(s.coords)}</small></span></div>
      <div class="ch-body">
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
        ${s.link ? `<a class="arrow-link" href="projets/${s.link}.html" data-t="${esc(projects.find(p => p.slug === s.link).title)}">Voir le projet</a>` : ''}
      </div>
      ${s.img ? (s.link ? `<a class="ch-img" href="projets/${s.link}.html" data-t="${esc(projects.find(p => p.slug === s.link).title)}" data-cursor="Ouvrir"><img src="${s.img}" alt="${esc(s.alt || '')}" loading="lazy"></a>` : `<figure class="ch-img"><img src="${s.img}" alt="${esc(s.alt || '')}" loading="lazy"></figure>`) : ''}
    </li>`).join('')}
  </ol>
</section>

<section class="quotes wrap">
  <h2 class="h2" data-reveal>Ils ont travaillé avec moi</h2>
  <div class="quotes-grid">
    ${avis.map(a => `<blockquote data-reveal><p>« ${esc(a.text)} »</p><footer>
      ${existsSync(a.img) ? `<img class="avatar" src="${a.img}" alt="${esc(a.name)}" loading="lazy">` : `<span class="avatar" aria-hidden="true">${initials(a.name)}</span>`}
      <span><b>${esc(a.name)}</b>${esc(a.role)}</span></footer></blockquote>`).join('')}
  </div>
</section>

<section class="outro wrap">
  <p class="statement" data-reveal>Assez parlé de moi. Voilà ce qui en est sorti.</p>
  <a class="btn" href="projets.html" data-t="${T.projets}" data-reveal>Voir les projets</a>
</section>`);

/* ================= Compétences ================= */
const LV = { prod: 'En production', projet: 'Sur des projets' };
page('competences.html', {
  page: 'competences', path: 'competences.html',
  title: 'Compétences | Ziyad Chaabi, TypeScript, Angular, NestJS, React Native, IA',
  desc: 'Les outils de Ziyad Chaabi, classés selon leur usage réel : ce qui tourne en production et ce qui a servi sur des projets. Chaque compétence renvoie aux projets concernés.',
}, `
<section class="page-hero wrap">
  ${relief('competences')}
  <h1 class="display is-long" data-hero>Compétences</h1>
  <p class="page-lede" data-hero-fade>Pas de jauge à 87 % ici. Chaque outil est rangé selon l’usage que j’en ai eu, et renvoie aux projets où il a servi. Survolez ou touchez-en un pour les voir.</p>
  <ul class="legend" data-hero-fade><li class="lv-prod">${LV.prod}</li><li class="lv-projet">${LV.projet}</li></ul>
</section>
<section class="skills wrap">
  <div class="skills-groups">
    ${skills.map(g => `<section class="sg" data-reveal><h2 class="sg-title">${esc(g.group)}</h2><ul>${g.items.map(([name, lv, ps]) =>
      `<li><button type="button" class="skill lv-${lv}" data-projects="${ps.join(' ')}"><span>${esc(name)}</span><em>${LV[lv]}</em></button></li>`).join('')}</ul></section>`).join('')}
  </div>
  <aside class="skills-side" aria-live="polite">
    <p class="side-label">Utilisé dans</p>
    <p class="side-skill">Choisissez une compétence</p>
    <ul class="side-list"></ul>
  </aside>
</section>
`);

/* ================= Labo ================= */
const repoItems = [
  ...autoPages.map(a => `<li><b><a href="projets/${a.slug}.html" data-t="${esc(a.title)}">${esc(a.title)}</a></b> <span>${esc(a.desc)}</span> <a href="${a.url}" target="_blank" rel="noopener">GitHub</a></li>`),
  ...privateRepos.map(r => `<li><b>${esc(r.n)}</b> <span>${esc(r.d)}</span> <em>Code privé</em></li>`),
].join('');
page('labo.html', {
  page: 'labo', path: 'labo.html',
  title: 'Le labo | Tous les projets GitHub de Ziyad Chaabi en 3D',
  desc: `Le labo de Ziyad Chaabi : ${labCount} projets et dépôts GitHub posés sur une carte en relief en 3D, mise à jour automatiquement à chaque nouveau dépôt.`,
}, `
<section class="lab">
  <div class="lab-stage" data-cursor="Glisser"></div>
  <div class="lab-ui">
    <div class="lab-intro">
      <h1 class="display" data-hero>Le labo</h1>
      <p data-hero-fade>${labCount} projets et dépôts, posés sur une carte en relief qui se met à jour seule à chaque nouveau dépôt GitHub. Glissez pour vous déplacer, pincez ou utilisez Ctrl + molette pour zoomer, cliquez sur un nom pour ouvrir le projet.</p>
    </div>
    <div class="lab-tools" data-hero-fade>
      <div class="filters lab-zones" role="group" aria-label="Zones"></div>
      <div class="filters lab-zoom"><button type="button" data-zoom="1" aria-label="Zoomer">+</button><button type="button" data-zoom="-1" aria-label="Dézoomer">−</button></div>
      <button type="button" class="lab-listbtn" aria-pressed="false">Vue liste</button>
    </div>
    <p class="lab-live" aria-live="polite"></p>
  </div>
  <aside class="lab-card" hidden data-lenis-prevent></aside>
  <div class="lab-labels"></div>
</section>
<section class="lab-list wrap" hidden>
  <h2 class="h2">Tous les projets</h2>
  <ol class="rows">${rows(projects, '')}</ol>
  <h2 class="h2">Et les autres dépôts</h2>
  <ul class="repo-list">${repoItems}</ul>
</section>`);

/* ================= Veille ================= */
page('veille.html', {
  page: 'veille', path: 'veille.html',
  title: 'Veille technologique IA et GitHub | Ziyad Chaabi',
  desc: 'La veille de Ziyad Chaabi, mise à jour en direct : dépôts qui montent sur GitHub, projets IA du mois et discussions Hacker News, avec ses notes sur les agents de code, MCP et l’IA appliquée.',
}, `
<section class="page-hero wrap">
  ${relief('veille')}
  <h1 class="display" data-hero>Veille</h1>
  <p class="page-lede" data-hero-fade>Ce qui monte sur GitHub et ce dont on parle en IA, lu en direct sur les API publiques de GitHub et de Hacker News, et rechargé tout seul tant que la page est ouverte. <span class="veille-time"></span></p>
</section>
<section class="feeds wrap">
  <div class="feed" data-reveal><h2>Tendances GitHub de la semaine</h2><ol id="feed-gh"><li class="wait">Chargement…</li></ol><p class="veille-gh-time feed-note"></p><a class="arrow-link" href="https://github.com/trending?since=weekly" target="_blank" rel="noopener">GitHub Trending</a></div>
  <div class="feed" data-reveal><h2>Dépôts IA du mois</h2><ol id="feed-ai"><li class="wait">Chargement…</li></ol><a class="arrow-link" href="https://huggingface.co/papers" target="_blank" rel="noopener">Papiers du jour sur Hugging Face</a></div>
  <div class="feed" data-reveal><h2>Discuté sur Hacker News</h2><ol id="feed-hn"><li class="wait">Chargement…</li></ol><a class="arrow-link" href="https://news.ycombinator.com/" target="_blank" rel="noopener">Hacker News</a></div>
</section>
<section class="notes wrap">
  <h2 class="h2" data-reveal>Ce que j’en retiens</h2>
  <div class="does-grid">${notes.map(([t, d]) => `<article data-reveal><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</div>
</section>`);

/* ================= 404 et plan du site ================= */
writeFileSync('404.html', head({ title: 'Page introuvable | Ziyad Chaabi', desc: 'Cette page n’existe pas.', path: '404.html', b: '/' }) + `
<body class="lost">
<main class="lost-main"><p class="display">404</p><p>Ce sommet n’est pas sur la carte.</p><a class="btn" href="/">Revenir à l’accueil</a></main>
</body></html>`);

const today = new Date().toISOString().slice(0, 10);
const urls = ['', 'parcours.html', 'projets.html', 'competences.html', 'labo.html', 'veille.html', ...projects.map(p => `projets/${p.slug}.html`), ...autoPages.map(a => `projets/${a.slug}.html`)];
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${site.url}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log(`${urls.length} pages générées (${autoPages.length} dépôts synchronisés).`);
