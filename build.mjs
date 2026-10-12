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
<style>html.js:not(.is-ready):not(.seen){background:#121417}html.js .veil{position:fixed;inset:0;z-index:100;background:#121417}html.seen .veil{display:none}html.js.seen:not(.is-ready) :is([data-hero],[data-hero-fade]){visibility:hidden}</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${b}css/scrollcraft.css">
<link rel="stylesheet" href="${b}css/style.css">
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('zc-seen'))document.documentElement.classList.add('seen')}catch(e){}setTimeout(function(){if(!document.documentElement.classList.contains('is-ready'))document.documentElement.classList.remove('js')},8000)</script>
</head>`;
}

// Scripts classiques uniquement : le site marche aussi ouvert en double-clic (file://).
// three.js n'existe qu'en module : un petit module en ligne le charge depuis le CDN puis prévient la page.
const PAGE_JS = { index: 'index', projet: 'projet', depot: 'projet', parcours: 'parcours', projets: 'projets', competences: 'competences', labo: 'labo', veille: 'veille' };
const THREE_PAGES = ['labo', 'projet'];
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
  const nav = NAV.map(([k, label, n]) => `<a href="${b}${k}.html"${page === k ? ' aria-current="page"' : ''}>${label}${n ? `<sup>${n}</sup>` : ''}</a>`).join('');
  return `<body data-page="${page}" data-base="${b}">
<div class="veil" aria-hidden="true"><canvas></canvas><p class="veil-text"></p><p class="veil-count"></p></div>
<a class="skip" href="#main">Aller au contenu</a>
<header class="site-head">
  <a class="brand" href="${b}index.html">Ziyad Chaabi</a>
  <nav class="nav" aria-label="Navigation principale">${nav}</nav>
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
<script src="${b}js/scrollcraft.js"></script>
<script src="${b}js/app.js"></script>
<script data-goatcounter="https://ziyad-chaabi.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
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
        <a href="mailto:${site.email}">${site.email}</a>
        <button type="button" data-copy="${site.email}">Copier l’adresse</button>
        <span class="copy-msg" aria-live="polite"></span>
      </div>
      <div class="foot-cols">
        <div><h3>Ailleurs</h3><ul>
          <li><a href="${site.linkedin}" target="_blank" rel="noopener me">LinkedIn</a></li>
          <li><a href="${site.github}" target="_blank" rel="noopener me">GitHub</a></li>
          <li><a href="${site.instagram}" target="_blank" rel="noopener me">Instagram</a></li>
        </ul></div>
        <div><h3>Pages</h3><ul>
          ${NAV.map(([k, l]) => `<li><a href="${b}${k}.html">${l}</a></li>`).join('')}
        </ul></div>
      </div>
    </div>
    <div class="foot-bottom">
      <p>© 2026 Ziyad Chaabi, Troyes</p>
      <p class="foot-stats" aria-live="polite"><b data-stat="total">–</b> visiteurs au total <span>·</span> <b data-stat="month">–</b> ce mois-ci <span>·</span> <b data-stat="day">–</b> aujourd’hui</p>
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
      <a class="row" href="${b}projets/${p.slug}.html" data-peek="${p.slug}"${firstImg(p) ? ` data-img="${b}${firstImg(p)}"` : ''}>
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
<!-- Héros en couches : terrain (loin) / « Ziyad » (derrière le visage) / visage en courbes de niveau / « Chaabi » (devant) / texte.
     Chaque plan suit --sc-p à sa vitesse (css), le visage retourne dans la carte pendant que la phrase s'assemble. -->
<section class="hero hero-home" data-sc-act="pin" data-sc-span="2.3">
  <div class="hh-stage" data-sc-stage>
    <canvas class="hero-canvas hh-terrain" data-relief data-layer="1" data-seed="ziyad-chaabi" data-peaks="5" data-rough=".8" data-levels="16"></canvas>
    <h1 class="hh-name display"><span class="hh-back"><span data-hero>Ziyad</span></span> <span class="hh-front"><span data-hero>Chaabi</span></span></h1>
    <figure class="hh-face" data-hero-fade title="Maintenez le clic pour voir la photo">
      <canvas data-face="img/ziyad-relief.png" data-photo="img/ziyad-photo.webp" aria-hidden="true"></canvas>
      <img src="img/ziyad-photo.webp" alt="Portrait de Ziyad Chaabi" width="600" height="750">
    </figure>
    <div class="hh-copy" data-sc-cue="0 0.4 0">
      <p class="hero-lede" data-hero-fade>Développeur à Troyes, passé par le design avant le code. Je fais des applis web et mobiles, des mondes en réalité virtuelle, et des scripts pour les petites frustrations du quotidien.</p>
      <div class="hero-cta" data-hero-fade>
        <a class="btn" href="projets.html">Voir mes projets</a>
        <a class="btn btn-line" href="labo.html">Explorer le labo</a>
      </div>
    </div>
    <p class="hh-turn" data-sc-cue="0.48" data-sc-kinetic="lines">J’aime comprendre un problème avant d’ouvrir l’éditeur.</p>
  </div>
</section>

<section class="intro wrap">
  <div class="intro-b" data-reveal>
    <p>Je pense d’abord aux gens qui vont se servir de l’outil, sur un chantier ou un casque VR sur la tête, et seulement ensuite à la stack.</p>
    <a class="arrow-link" href="parcours.html">Lire mon parcours</a>
  </div>
</section>

<section class="work wrap">
  <div class="sec-head"><h2 class="h2" data-reveal>Projets choisis</h2><a class="arrow-link" href="projets.html">Voir les ${projects.length} projets</a></div>
  <ol class="rows">${rows(featured, '')}
  </ol>
</section>

<section class="off wrap">
  <div class="sec-head"><h2 class="h2" data-reveal>Hors de l’écran</h2><p class="sec-note" data-reveal>Presque tous mes projets perso sont nés d’ici.</p></div>
  <ul class="off-list">${off.map(o => `
    <li class="off-item" style="--c:${o.color}">
      <p class="off-what"><span data-wipe>${o.what}</span></p>
      <p class="off-text" data-reveal>${o.text}</p>
      <p class="off-links" data-reveal>${o.links.map(([l, h]) => `<a class="arrow-link" href="${h}">${l}</a>`).join('')}</p>
    </li>`).join('')}
  </ul>
</section>

<section class="band">
  <canvas class="band-canvas" data-relief="dark" data-seed="labo" data-peaks="6" data-rough=".9" data-accent="#E07A3E"></canvas>
  <div class="band-inner wrap">
    <h2 class="h2" data-reveal>Le labo</h2>
    <p data-reveal>${labCount} projets et dépôts, des projets d’école aux expériences du dimanche, posés sur une carte en relief que l’on parcourt en 3D. Elle se met à jour toute seule à chaque nouveau dépôt GitHub.</p>
    <a class="btn" href="labo.html" data-reveal>Explorer le labo</a>
  </div>
</section>

<section class="now wrap">
  <p class="now-line" data-reveal>En ce moment : <a href="projets/subforge.html">SubForge, un coach nutrition à l’IA</a>. Ce que je lis : les agents de code, MCP et les dépôts qui grimpent sur GitHub dans la semaine, rassemblés dans <a href="veille.html">ma veille, en direct</a>.</p>
</section>`);

/* ================= Projets ================= */
page('projets.html', {
  page: 'projets', path: 'projets.html',
  title: 'Projets | Ziyad Chaabi, développeur full stack',
  desc: `${projects.length} projets de Ziyad Chaabi : BTP-360 (SaaS Angular, NestJS, AWS), SubForge (React Native et IA), réalité virtuelle, e-commerce et sites web, et ${autoPages.length} autres dépôts dans le labo.`,
}, `
<!-- Galerie : la collection commence en haut de la page. Un rail qu'on longe en scrollant (Scrollcraft pan),
     chaque objet porte la même étiquette, l'index saute à l'objet. Sous le rail, le sol du musée (relief) défile
     moins vite et prend la couleur de l'objet devant lequel on se trouve. -->
<section class="gal" data-sc-act="pan" data-sc-span="9">
  <div class="gal-stage" data-sc-stage>
    <canvas class="gal-floor" aria-hidden="true"></canvas>
    <nav class="gal-index" aria-labelledby="gal-h">
      <h1 id="gal-h" class="gal-h">Projets <span>${projects.length} objets, 2021 à 2026</span></h1>
      ${[['pro', 'Pro'], ['perso', 'Perso'], ['ecole', 'École']].map(([k, l]) => `<h2>${l}</h2><ul>${projects.filter(p => p.kind === k).map(p => `<li><a href="projets/${p.slug}.html" data-go="${p.slug}">${esc(p.title)}</a></li>`).join('')}</ul>`).join('')}
    </nav>
    <ol class="gal-rail" data-sc-pan="0.02">
      ${['pro', 'perso', 'ecole'].flatMap(k => projects.filter(p => p.kind === k)).map(p => { const im = firstImg(p); return `<li class="gal-obj" data-slug="${p.slug}" data-color="${p.color}" style="--c:${p.color}">
        <a class="gal-pic${!p.screen && p.screenM ? ' is-phone' : ''}" href="projets/${p.slug}.html" data-sc-tilt="5" aria-label="${esc(p.title)}, la fiche">${im ? `<img src="${im}" alt="" loading="lazy">` : `<canvas data-cover="${p.slug}"></canvas>`}</a>
        <h2 class="gal-title">${esc(p.title)}</h2>
        <p class="gal-meta">${esc(p.year)}. ${esc(p.context)}. ${esc(p.org)}.</p>
        <p class="gal-meta">${esc(p.role)}.</p>
        <p class="gal-tools">${esc(p.stack.slice(0, 4).join(', '))}</p>
      </li>`; }).join('\n      ')}
      <li class="gal-obj gal-end">
        <h2 class="gal-title">Les ${autoPages.length} autres dépôts</h2>
        <p class="gal-meta">2021 à 2026. Exercices d’école, scripts du dimanche, essais.</p>
        <p class="gal-meta">Rangés sur la carte en relief du labo, mise à jour à chaque nouveau dépôt.</p>
        <p class="gal-tools"><a class="arrow-link" href="labo.html">Explorer le labo</a></p>
      </li>
    </ol>
  </div>
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
// Fiches : grammaire éditoriale. Page de titre sans image, des chapitres sur leur propre fond (coupes franches),
// les médias dans leur colonne avec légende, les vrais chiffres dans le texte, un colophon pour finir.
// Le folio (marge) suit le chapitre en cours ; sa vignette en relief gagne des courbes à chaque chapitre lu.
const chapter = (n, title, body) => `
<section class="ed-ch${n % 2 ? '' : ' is-alt'}" data-ch="${esc(title)}" aria-labelledby="ch-${n}">
  <header class="ed-inter wrap" data-wipe><h2 class="ed-ch-title" id="ch-${n}">${esc(title)}</h2></header>
  ${body}
</section>`;
const sectionBody = s => `<div class="ed-spread wrap"><div class="ed-text">${(s.body || []).map(t => `<p data-reveal>${esc(t)}</p>`).join('')}${s.list ? `<dl class="p-list">${s.list.map(([k, v]) => `<div data-reveal><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}</div>${s.quote ? `<aside class="ed-side"><blockquote class="p-quote" data-reveal><p>« ${esc(s.quote[0])} »</p><footer>${esc(s.quote[1])}</footer></blockquote></aside>` : ''}</div>`;
const folio = (slug, color, relief) => `<aside class="folio" aria-hidden="true" data-seed="${slug}" data-color="${color}" data-peaks="${relief?.peaks || 3}" data-rough="${relief?.rough || .5}"><canvas class="folio-map"></canvas><p><span class="folio-n"></span><span class="folio-t"></span></p></aside>`;
const colophon = (lines, prev, next, back) => `
<footer class="ed-colophon wrap">
  <p class="ed-colo-mark">Colophon</p>
  ${lines.map(l => `<p>${l}</p>`).join('')}
  <p>Projet précédent : <a href="${prev.slug}.html">${esc(prev.title)}</a>. Projet suivant : <a href="${next.slug}.html">${esc(next.title)}</a>. Ou ${back}.</p>
</footer>`;
const lower = s => s.charAt(0).toLowerCase() + s.slice(1);

projects.forEach((p, i) => {
  const b = '../', n = projects.length;
  const prev = projects[(i - 1 + n) % n], next = projects[(i + 1) % n];
  const [first, ...rest] = p.figures;
  const links = p.links.map(([l, u]) => `<a class="btn btn-line" href="${u}" target="_blank" rel="noopener">${esc(l)}</a>`).join('');
  // les chiffres vrais, écrits dans une phrase, et qui comptent quand on arrive dessus (Scrollcraft count)
  const stats = p.stats ? `<p class="ed-figures" data-reveal>En chiffres : ${p.stats.map(([v, l]) => `<b data-sc-count="0 ${v}">${v}</b> ${esc(l)}`).join(', ')}.</p>` : '';
  let ch = 1;
  page(`projets/${p.slug}.html`, {
    page: 'projet', path: `projets/${p.slug}.html`, tex: texBundle(p.slug, [p.screen, p.screenM]),
    title: `${p.title} | Projet de Ziyad Chaabi`,
    desc: `${p.kicker} ${p.context}, ${p.period}. Stack : ${p.stack.slice(0, 6).join(', ')}.`,
    jsonld: { '@type': 'CreativeWork', '@id': `${site.url}projets/${p.slug}.html#projet`, name: p.title, description: p.kicker, dateCreated: p.year,
      author: { '@id': ME }, keywords: p.stack.join(', '), url: `${site.url}projets/${p.slug}.html`, ...(firstImg(p) ? { image: site.url + firstImg(p) } : {}) },
  }, `
<article class="p ed" style="--accent:${p.color}" data-slug="${p.slug}">
<header class="ed-title">
  ${relief(p.slug, `data-accent="${p.color}" data-peaks="${p.relief?.peaks || 3}" data-rough="${p.relief?.rough || .5}"`)}
  <p class="p-context wrap" data-hero-fade><a class="back" href="${b}projets.html">Projets</a><span class="tag">${tag(p)}</span>${esc(p.context)}, ${esc(p.year)}</p>
  <div class="wrap">
    <h1 class="display p-title${p.title.length > 12 ? ' is-long' : ''}" data-hero>${esc(p.title)}</h1>
    <p class="p-kicker" data-hero-fade>${esc(p.kicker)}</p>
  </div>
  <dl class="ed-meta wrap" data-hero-fade>
    <div><dt>Cadre</dt><dd>${esc(p.org)}</dd></div>
    <div><dt>Période</dt><dd>${esc(p.period)}</dd></div>
    <div><dt>Équipe</dt><dd>${esc(p.team)}</dd></div>
    <div><dt>Mon rôle</dt><dd>${esc(p.role)}</dd></div>
  </dl>
</header>
${chapter(ch++, 'Le projet', `<div class="ed-spread wrap">
    <div class="ed-text ed-lead">
      <p data-reveal>${esc(p.intro)}</p>
      ${stats}
      ${links || p.privateNote ? `<div class="p-links" data-reveal>${links}${p.privateNote ? `<p class="note">${esc(p.privateNote)}</p>` : ''}</div>` : ''}
      <ul class="chips" data-reveal aria-label="Outils">${p.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    </div>
    <figure class="ed-plate" data-reveal>${device({ ...p, label: `${p.title} en 3D` }, b)}<figcaption>${esc(p.title)}, en maquette 3D</figcaption></figure>
  </div>
  ${first ? `<div class="wrap p-figs">${figure(first, b)}</div>` : ''}`)}
${p.sections.map(s => chapter(ch++, s.title, sectionBody(s))).join('')}
${rest.length ? chapter(ch++, 'En images', `<div class="wrap p-figs p-gallery">${rest.map(f => figure(f, b)).join('')}</div>`) : ''}
${colophon([`${esc(p.title)}. ${esc(p.context)}, ${esc(p.org)}, ${esc(lower(p.period))}. ${esc(p.team)}. Rôle : ${esc(lower(p.role))}.`, `Outils : ${esc(p.stack.join(', '))}.`], prev, next, `<a href="${b}projets.html">toute la collection</a>`)}
</article>
${folio(p.slug, p.color, p.relief)}`);
});

/* ---------- Pages des dépôts synchronisés : même grammaire, plus courte ---------- */
autoPages.forEach((a, i) => {
  const b = '../', n = autoPages.length, prev = autoPages[(i - 1 + n) % n], next = autoPages[(i + 1) % n];
  const src = a.source ? (a.source === 'lancé en local' ? 'captures prises en lançant le projet' : a.source === 'site en ligne' ? 'captures du site en ligne' : 'images du dépôt') : '';
  page(`projets/${a.slug}.html`, {
    page: 'depot', path: `projets/${a.slug}.html`,
    title: `${a.title} | Dépôt GitHub de Ziyad Chaabi`,
    desc: `${a.desc} ${a.stack.length ? `Stack : ${a.stack.join(', ')}.` : ''}`,
  }, `
<article class="p ed p-auto" style="--accent:#D2602A" data-slug="${a.slug}">
<header class="ed-title">
  ${relief(a.slug)}
  <p class="p-context wrap" data-hero-fade><a class="back" href="${b}labo.html">Labo</a><span class="tag">GitHub</span>${esc(a.year)}${a.stars ? `, ★ ${a.stars}` : ''}</p>
  <div class="wrap"><h1 class="h2 p-light-title" data-hero>${esc(a.title)}</h1></div>
</header>
${chapter(1, 'Le dépôt', `<div class="ed-spread wrap"><div class="ed-text ed-lead">
    ${(a.paras.length ? a.paras : [a.desc]).map(t => `<p data-reveal>${esc(t)}</p>`).join('')}
    ${a.bullets.length ? `<ul class="p-bullets" data-reveal>${a.bullets.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
    <div class="p-links" data-reveal><a class="btn btn-line" href="${a.url}" target="_blank" rel="noopener">Voir le code</a>${a.live ? `<a class="btn btn-line" href="${a.live}" target="_blank" rel="noopener">Voir en ligne</a>` : ''}</div>
    ${a.stack.length ? `<ul class="chips" data-reveal aria-label="Langages">${a.stack.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
  </div></div>`)}
${a.images.length ? chapter(2, 'En images', `<div class="wrap p-figs p-gallery">${a.images.map(g => `<figure class="fig${/mobile/.test(g) ? ' fig-phone' : ''}" data-reveal><img src="${b}${g}" alt="" loading="lazy"></figure>`).join('')}</div>`) : ''}
${colophon([`${esc(a.title)}. Dépôt GitHub créé en ${esc(a.year)}${a.stack.length ? `, écrit en ${esc(a.stack.join(', '))}` : ''}.${src ? ` Visuels : ${src}.` : ''}`], prev, next, `<a href="${b}labo.html">retour au labo</a>`)}
</article>
${folio(a.slug, '#D2602A')}`);
});

/* ================= Parcours ================= */
const avis = [
  { name: 'Juliana Rebelo', role: 'Assistante marketing et communication, ma tutrice chez Réseau Sûr France', img: 'img/avis/juliana-rebelo.webp',
    text: 'Ziyad a su mettre en avant ses compétences et son savoir-faire tout au long de son stage. Il s’est adapté très rapidement à l’entreprise, à sa charte graphique ainsi qu’à son fonctionnement.' },
  { name: 'Karima Ghezza', role: 'Orthoptiste chez Ophta Médical, Troyes', img: 'img/avis/karima-ghezza.webp',
    text: 'Il nous a apporté des idées pour compléter notre planning du personnel, en créant un tableau qui permet de calculer les heures de travail journalières et de visualiser les heures supplémentaires de chaque employé.' },
];
const initials = n => n.split(' ').map(w => w[0]).join('');
// Une jambe de vol par étape. Les étapes troyennes de 2022-2023 sont courtes et calmes : c'est le silence avant le pic,
// le grand vol vers Valenciennes, la plus longue jambe de la page. Les fenêtres de texte sont des fractions de toute la piste.
const legW = timeline.map((t, i) => (i === 0 ? 1.8 : t.place === 'Valenciennes' ? 2.2 : i === timeline.length - 1 ? 1.6 : t.place === 'Meaux' || t.title.startsWith('BTP') ? 1.3 : 1.1));
const legT = legW.reduce((a, b) => a + b, 0);
const f3 = x => (+x.toFixed(4)).toString();
const legs = timeline.map((s, i) => {
  const c0 = legW.slice(0, i).reduce((a, b) => a + b, 0), w = legW[i], c1 = c0 + w, wn = legW[i + 1] || 0;
  const [lat, lon] = s.coords.match(/[\d.]+/g).map(Number);
  const win = i === timeline.length - 1 ? 'finale' : `${f3((c0 + (i ? .42 : .5) * w) / legT)} ${f3(Math.min(1, (c1 + .1 * wn) / legT))} .22 .2`;
  return { s, w, lat, lon, win };
});
const heroWin = `0 ${f3(.56 * legW[0] / legT)} 0 .4`;
const quoteAt = { 2: avis[1], 3: avis[0] }; // Ophta Médical (2022), Réseau Sûr France (2023)
page('parcours.html', {
  page: 'parcours', path: 'parcours.html',
  title: 'Parcours | Ziyad Chaabi, de Troyes à Valenciennes, et retour',
  desc: "Le parcours de Ziyad Chaabi : bac STI2D à Troyes, BUT MMI à Meaux, Master Sciences et Technologies du Métavers à l'INSA Hauts-de-France, stages et alternance jusqu'à BTP-360.",
}, `
<!-- Monde continu (Scrollcraft worldflight) : une seule toile fixe, le relief, que la caméra survole d'une étape à l'autre
     entre les vraies coordonnées. Rien d'autre dans le flux que l'espaceur ; le texte vit dans le calque fixe, par fenêtres. -->
<div class="pc" data-sc-mode="worldflight" data-sc-seam="0.16" data-sc-lerp="0.12">
  <div class="pc-world" data-sc-world data-sc-verify-state="">
    <canvas class="pc-map" aria-hidden="true"></canvas>
    <svg class="pc-route" aria-hidden="true"><path class="pc-route-all"></path><path class="pc-route-done" pathLength="1"></path></svg>
    <div class="pc-pins" aria-hidden="true">${[...new Set(timeline.map(t => t.place))].map(pl => `<span class="pc-pin" data-place="${esc(pl)}"><i></i>${esc(pl)}</span>`).join('')}</div>
    ${legs.map(l => `<div data-sc-segment data-sc-w="${l.w}" data-sc-waypoint="${esc(l.s.year + ' ' + l.s.place)}" data-lat="${l.lat}" data-lon="${l.lon}" data-place="${esc(l.s.place)}"></div>`).join('\n    ')}
  </div>
  <div data-sc-world-copy>
    <div class="sc-world__scrim pc-scrim"></div>
    <div class="pc-copy pc-hero" data-sc-copy data-sc-window="${heroWin}">
      <h1 class="ph-title" data-hero>De Troyes à Valenciennes, et retour.</h1>
      <p class="page-lede" data-hero-fade>Un bac à Troyes, le design à Meaux, la réalité virtuelle à Valenciennes, et entre deux, des stages et une alternance dans des entreprises de l’Aube. Voici le chemin, étape par étape, sur la carte.</p>
    </div>
    ${legs.map((l, i) => { const s = l.s, q = quoteAt[i], last = i === legs.length - 1; return `<article class="pc-copy pc-step${last ? ' pc-finale' : ''}" data-sc-copy data-sc-window="${l.win}" data-leg="${i}">
      <p class="pc-when"><span class="ch-year">${s.year}</span><span class="ch-place">${esc(s.place)}<small>${esc(s.coords)}</small></span></p>
      <h2>${esc(s.title)}</h2>
      <p>${esc(s.text)}</p>
      ${q ? `<blockquote class="pc-quote"><p>« ${esc(q.text)} »</p><footer>${existsSync(q.img) ? `<img class="avatar" src="${q.img}" alt="${esc(q.name)}" loading="lazy">` : `<span class="avatar" aria-hidden="true">${initials(q.name)}</span>`}<span><b>${esc(q.name)}</b>${esc(q.role)}</span></footer></blockquote>` : ''}
      ${last ? `<figure class="pc-img"><img src="img/ziyad-camera.webp" alt="Ziyad Chaabi, sourire aux lèvres, une caméra JVC à l’épaule" width="1600" height="1200" loading="lazy"></figure>
      <p class="statement">Assez parlé de moi. Voilà ce qui en est sorti.</p>
      <p class="pc-actions"><a class="btn" href="projets.html">Voir les projets</a>${s.link ? `<a class="arrow-link" href="projets/${s.link}.html">${esc(projects.find(p => p.slug === s.link).title)}</a>` : ''}</p>`
      : `${s.img ? `<figure class="pc-img"><img src="${s.img}" alt="${esc(s.alt || '')}" loading="lazy"></figure>` : ''}
      ${s.link ? `<a class="arrow-link" href="projets/${s.link}.html">Voir le projet</a>` : ''}`}
    </article>`; }).join('\n    ')}
  </div>
  <nav class="pc-rail" aria-label="Étapes du parcours"><ol>${legs.map((l, i) => `<li><button type="button" data-go="${i}"><b>${l.s.year}</b> ${esc(l.s.place.replace('Saint-André-les-Vergers', 'St-André'))}</button></li>`).join('')}</ol></nav>
  <p class="pc-coords" aria-hidden="true"><span class="pc-latlon">48.30° N, 4.08° E</span></p>
  <div data-sc-spacer aria-hidden="true"></div>
</div>`);

/* ================= Compétences ================= */
const LV = { prod: 'En production', projet: 'Sur des projets' };
page('competences.html', {
  page: 'competences', path: 'competences.html',
  title: 'Compétences | Ziyad Chaabi, TypeScript, Angular, NestJS, React Native, IA',
  desc: 'Les outils de Ziyad Chaabi, classés selon leur usage réel : ce qui tourne en production et ce qui a servi sur des projets. Chaque compétence renvoie aux projets concernés.',
}, `
<!-- Scène partagée : deux colonnes en tension pendant toute la page, les outils et là où ils ont servi.
     Le séparateur porte les deux libellés. Des fils relient l'outil choisi à ses projets. À la fin, l'effondrement :
     le séparateur part sur le bord et la colonne des projets prend toute la largeur (Scrollcraft pin, --sc-p). -->
<section class="split">
  <div class="split-l wrap">
    <header class="split-head">
      <h1 class="display is-long" data-hero>Compétences</h1>
      <p class="page-lede" data-hero-fade>Pas de jauge à 87 % ici. Chaque outil est rangé selon l’usage que j’en ai eu. Choisissez-en un : un fil le relie aux projets où il a servi.</p>
      <ul class="legend" data-hero-fade><li class="lv-prod">${LV.prod}</li><li class="lv-projet">${LV.projet}</li></ul>
    </header>
    ${skills.map(g => `<section class="sg"><h2 class="sg-title">${esc(g.group)}</h2><ul>${g.items.map(([name, lv, ps]) =>
      `<li><button type="button" class="skill lv-${lv}" data-projects="${ps.join(' ')}" aria-controls="sk-side"><span>${esc(name)}</span><em>${LV[lv]}</em></button></li>`).join('')}</ul></section>`).join('')}
  </div>
  <div class="split-r">
    <div class="split-r-in">
      <p class="split-r-h" data-hero-fade>Là où ils ont servi</p>
      <div id="sk-side" class="skills-side" aria-live="polite">
        <p class="side-skill">Choisissez une compétence</p>
        <ul class="side-list"></ul>
      </div>
    </div>
  </div>
  <p class="split-div" aria-hidden="true"><span>Les outils</span><span>Les projets</span></p>
  <svg class="threads" aria-hidden="true"></svg>
</section>
<section class="collapse" data-sc-act="pin" data-sc-span="1.9">
  <div class="cl-stage" data-sc-stage>
    <p class="cl-left">Des outils, il en reste toujours à apprendre.</p>
    <div class="cl-right">
      <div class="cl-in wrap">
        <h2 class="cl-title" data-sc-cue="0.72">Ce qui compte, c’est ce qu’ils ont produit.</h2>
        <ul class="cl-wall" data-sc-cue="0.78">${projects.map(p => `<li style="--c:${p.color}"><a href="projets/${p.slug}.html">${esc(p.title)}</a></li>`).join('')}</ul>
        <p class="cl-cta" data-sc-cue="0.84"><a class="btn" href="projets.html">Voir les projets</a></p>
      </div>
    </div>
    <span class="cl-divider" aria-hidden="true"></span>
  </div>
</section>
`);

/* ================= Labo ================= */
const repoItems = [
  ...autoPages.map(a => `<li><b><a href="projets/${a.slug}.html">${esc(a.title)}</a></b> <span>${esc(a.desc)}</span> <a href="${a.url}" target="_blank" rel="noopener">GitHub</a></li>`),
  ...privateRepos.map(r => `<li><b>${esc(r.n)}</b> <span>${esc(r.d)}</span> <em>Code privé</em></li>`),
].join('');
page('labo.html', {
  page: 'labo', path: 'labo.html',
  title: 'Le labo | Tous les projets GitHub de Ziyad Chaabi en 3D',
  desc: `Le labo de Ziyad Chaabi : ${labCount} projets et dépôts GitHub posés sur une carte en relief en 3D, mise à jour automatiquement à chaque nouveau dépôt.`,
}, `
<section class="lab">
  <div class="lab-stage"></div>
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
<!-- Surface vivante : la page se comporte comme l'outil. Une barre d'état (relevé, prochain rechargement, nouveautés),
     un sélecteur de flux, des panneaux. Elle finit sur un vrai champ qui interroge Hacker News et GitHub en direct. -->
<section class="vs">
  <header class="vs-bar wrap">
    <h1 class="vs-h">Veille</h1>
    <p class="vs-status" aria-live="polite"><span class="vs-dot" aria-hidden="true"></span><span class="veille-time">Chargement des flux…</span><span class="vs-next"></span><span class="vs-new"></span></p>
    <div class="vs-show" role="group" aria-label="Afficher">
      <button type="button" aria-pressed="true" data-show="all">Tout</button>
      <button type="button" aria-pressed="false" data-show="gh">GitHub</button>
      <button type="button" aria-pressed="false" data-show="ai">IA</button>
      <button type="button" aria-pressed="false" data-show="hn">Hacker News</button>
    </div>
  </header>
  <div class="vs-panels wrap">
    <section class="vs-panel" data-feed="gh" aria-labelledby="vs-gh"><header><h2 id="vs-gh">Tendances GitHub de la semaine</h2><a href="https://github.com/trending?since=weekly" target="_blank" rel="noopener">Source</a></header><ol id="feed-gh"><li class="wait">Chargement…</li></ol><p class="veille-gh-time feed-note"></p></section>
    <section class="vs-panel" data-feed="ai" aria-labelledby="vs-ai"><header><h2 id="vs-ai">Dépôts IA du mois</h2><a href="https://github.com/search?q=llm+OR+agent+OR+mcp&type=repositories&s=stars" target="_blank" rel="noopener">Source</a></header><ol id="feed-ai"><li class="wait">Chargement…</li></ol></section>
    <section class="vs-panel" data-feed="hn" aria-labelledby="vs-hn"><header><h2 id="vs-hn">Discuté sur Hacker News</h2><a href="https://news.ycombinator.com/" target="_blank" rel="noopener">Source</a></header><ol id="feed-hn"><li class="wait">Chargement…</li></ol></section>
    <aside class="vs-notes" aria-labelledby="vs-notes-h"><h2 id="vs-notes-h">Mes notes</h2>${notes.map(([t, d]) => `<article><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</aside>
  </div>
  <form class="vs-ask wrap" role="search" action="https://hn.algolia.com/" method="get" target="_blank" rel="noopener">
    <label class="vs-ask-label" for="vs-q">À vous : votre propre veille</label>
    <div class="vs-ask-row"><input id="vs-q" name="query" type="search" placeholder="Un sujet : rust, agents, webgpu…" autocomplete="off" required><button class="btn" type="submit">Chercher</button></div>
    <p class="vs-ask-hint">Les résultats viennent en direct de Hacker News et de GitHub, comme les flux au-dessus.</p>
    <div class="vs-results" aria-live="polite" hidden>
      <section class="vs-panel"><header><h2>Sur Hacker News</h2></header><ol id="ask-hn"></ol></section>
      <section class="vs-panel"><header><h2>Sur GitHub</h2></header><ol id="ask-gh"></ol></section>
    </div>
  </form>
</section>`);


/* ================= 404 et plan du site ================= */
writeFileSync('404.html', head({ title: 'Page introuvable | Ziyad Chaabi', desc: 'Cette page n’existe pas.', path: '404.html', b: '/' }) + `
<body class="lost">
<main class="lost-main"><p class="display">404</p><p>Ce sommet n’est pas sur la carte.</p><a class="btn" href="/">Revenir à l’accueil</a></main>
</body></html>`);

/* ---------- llms.txt : le résumé que lisent les assistants IA (convention llmstxt.org) ---------- */
// Généré depuis le même contenu que le site : une phrase citable, les faits, le parcours, les projets, les contacts.
const P = p => `${site.url}projets/${p}.html`;
writeFileSync('llms.txt', `# Ziyad Chaabi

> Ziyad Chaabi est un développeur basé à Troyes (France), passé par le design avant le code. Il conçoit des applications web et mobiles, des expériences en réalité virtuelle et des outils d'IA appliquée. Ce fichier résume son portfolio, ${site.url}

- Lieu : Troyes, Grand Est, France
- Formation : Master Informatique, Sciences et Technologies du Métavers, INSA Hauts-de-France, Valenciennes (2024 à 2026) ; BUT Métiers du Multimédia et de l'Internet, IUT de Meaux, Université Gustave Eiffel (2021 à 2024) ; Bac STI2D option SIN, lycée Saint-Joseph La Salle, Troyes (2021)
- Projet en cours : SubForge. ${projects.find(p => p.slug === 'subforge').kicker} (${P('subforge')})
- Hors de l'écran : manga (JoJo's Bizarre Adventure), League of Legends, musculation, e-sport
- Contact : ${site.email} ; LinkedIn ${site.linkedin} ; GitHub ${site.github} ; Instagram ${site.instagram}

## Parcours

${timeline.map(t => `- ${t.year}, ${t.place} : ${t.title}. ${t.text}`).join('\n')}

## Projets

${projects.map(p => `- [${p.title}](${P(p.slug)}) : ${p.kicker} ${p.context}, ${p.period}. Rôle : ${p.role}. Stack : ${p.stack.join(', ')}.`).join('\n')}

## Autres dépôts GitHub

${autoPages.map(a => `- [${a.title}](${P(a.slug)}) : ${a.desc}${a.stack.length ? ` (${a.stack.join(', ')})` : ''}`).join('\n')}

## Pages

- [Accueil](${site.url}) : présentation et projets choisis
- [Parcours](${site.url}parcours.html) : le chemin de Troyes à Valenciennes, étape par étape
- [Projets](${site.url}projets.html) : les ${projects.length} projets racontés en détail
- [Compétences](${site.url}competences.html) : chaque outil relié aux projets où il a servi
- [Labo](${site.url}labo.html) : carte en 3D de tous les projets et dépôts
- [Veille](${site.url}veille.html) : tendances GitHub et IA, mises à jour en continu
`);

const today = new Date().toISOString().slice(0, 10);
const urls = ['', 'parcours.html', 'projets.html', 'competences.html', 'labo.html', 'veille.html', ...projects.map(p => `projets/${p.slug}.html`), ...autoPages.map(a => `projets/${a.slug}.html`)];
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${site.url}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
console.log(`${urls.length} pages générées (${autoPages.length} dépôts synchronisés).`);
