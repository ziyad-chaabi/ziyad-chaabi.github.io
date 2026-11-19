// Génère le site statique : français à la racine, anglais dans /en/.
// Sources : js/data.js (contenu écrit à la main), data/space.json (images NASA, domaine public), data/icons.json (logos de la stack),
// data/auto.json (dépôts GitHub synchronisés).
// Usage : node build.mjs   (aucune dépendance)
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { posix } from 'node:path';
import vm from 'node:vm';
import { imgSize } from './scripts/img-size.mjs';

const sb = { window: {} };
vm.runInNewContext(readFileSync('js/data.js', 'utf8'), sb);
const Z = sb.window.ZC, { site } = Z;
const ART = Object.fromEntries(JSON.parse(readFileSync('data/space.json', 'utf8')).map(a => [a.slug, a]));
const ICONS = JSON.parse(readFileSync('data/icons.json', 'utf8'));
// les logos en un seul fichier, mis en cache une fois pour tout le site
writeFileSync('img/icons.svg', `<svg xmlns="http://www.w3.org/2000/svg">${Object.entries(ICONS).map(([k, d]) => `<symbol id="${k}" viewBox="0 0 24 24"><path d="${d}"/></symbol>`).join('')}</svg>\n`);
const auto = existsSync('data/auto.json') ? JSON.parse(readFileSync('data/auto.json', 'utf8')) : [];
const LANGS = ['fr', 'en'];

/* ---------- Outils ---------- */
// un texte L(fr, en) devient la chaîne de la langue voulue, partout dans l'objet
const loc = (v, l) => Array.isArray(v) ? v.map(x => loc(x, l))
  : v && typeof v === 'object' ? (Object.keys(v).length === 2 && 'fr' in v && 'en' in v ? v[l] : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, loc(x, l)])))
  : v;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- Libellés de l'interface ---------- */
const T = {
  fr: {
    skip: 'Aller au contenu', navLabel: 'Navigation principale', menu: 'Menu', close: 'Fermer',
    nav: { projects: 'Projets', about: 'À propos', archive: 'Archive', veille: 'Veille' },
    cv: 'CV', cvLong: 'Télécharger le CV', cvFull: 'Le CV complet (PDF)', contact: 'Me contacter',
    other: 'English', otherShort: 'EN', otherLabel: 'Read this page in English',
    portrait: 'Portrait de Ziyad Chaabi', hintFine: 'Passez sur le visage', hintTouch: 'Touchez le visage',
    lines: [['Ingénieur Full Stack', 'Web', 'Mobile', 'IA appliquée'], ['TypeScript', 'Angular', 'NestJS', 'React Native', 'PostgreSQL', 'AWS']],
    selected: 'Projets choisis', selectedNote: 'Quatre projets racontés en détail : le problème, ma part, les décisions, le résultat.',
    kinds: { pro: 'Pro', perso: 'Perso', ecole: 'École' },
    xp: 'Expérience', edu: 'Formation',
    stack: 'Stack', stackNote: 'Chaque outil mène au projet qui le prouve. Plein : utilisé en production. Contour : utilisé sur des projets.', lvl: { prod: 'en production', projet: 'sur des projets' }, provenBy: 'prouvé par',
    others: 'Autres projets', toArchive: n => `Toute l’archive, ${n} projets`, view: 'Affichage', list: 'Liste', grid: 'Grille', privateCode: 'Code privé',
    contactTitle: 'Écrivons-nous.', contactNote: 'Pour un poste en CDI ou une question sur un projet, écrivez-moi.',
    copy: 'Copier l’adresse', copied: 'Adresse copiée', readCase: 'Lire l’étude de cas',
    rights: '© 2026 Ziyad Chaabi, Troyes', top: 'Revenir en haut',
    cs: { crumb: 'Projets', brief: 'En bref', context: 'Le contexte', problem: 'Le problème', built: 'Ce que j’ai construit', decisions: 'Les décisions techniques',
      result: 'Le résultat', lessons: 'Ce que j’en retiens', next: 'Projet suivant', setting: 'Cadre', org: 'Où', period: 'Période', team: 'Équipe', role: 'Mon rôle', code: 'Code' },
    about: { title: 'À propos', method: 'Ma façon de travailler', path: 'Parcours', said: 'Ils ont travaillé avec moi', langs: 'Langues', photo: 'Ziyad Chaabi, sourire aux lèvres, une caméra JVC à l’épaule' },
    archive: { title: 'Archive', lede: n => `Les ${n} autres projets : école, perso, dépôts GitHub, du plus récent au plus ancien. La liste se met à jour à chaque nouveau dépôt.`, main: 'Les quatre principaux sont racontés sur', mainLink: 'l’accueil', cols: ['Projet', 'Domaine', 'Année'] },
    veille: { title: 'Veille', lede: 'Ce que je lis en ce moment : les dépôts qui montent sur GitHub, les projets IA du mois et les discussions de Hacker News, relevés en direct.', notes: 'Mes notes',
      gh: 'Tendances GitHub de la semaine', ai: 'Dépôts IA du mois', hn: 'Discuté sur Hacker News', source: 'Source', loading: 'Chargement…', all: 'Tout', show: 'Afficher',
      ask: 'À vous : votre propre veille', askPh: 'Un sujet : rust, agents, webgpu…', askBtn: 'Chercher', askHint: 'Les résultats viennent en direct de Hacker News et de GitHub.', onHN: 'Sur Hacker News', onGH: 'Sur GitHub' },
    lost: 'Ce sommet n’est pas sur la carte.', home: 'Revenir à l’accueil',
  },
  en: {
    skip: 'Skip to content', navLabel: 'Main navigation', menu: 'Menu', close: 'Close',
    nav: { projects: 'Work', about: 'About', archive: 'Archive', veille: 'Tech watch' },
    cv: 'CV', cvLong: 'Download CV', cvFull: 'Full CV (PDF, in French)', contact: 'Get in touch',
    other: 'Français', otherShort: 'FR', otherLabel: 'Lire cette page en français',
    portrait: 'Portrait of Ziyad Chaabi', hintFine: 'Hover over the face', hintTouch: 'Tap the face',
    lines: [['Full Stack Engineer', 'Web', 'Mobile', 'Applied AI'], ['TypeScript', 'Angular', 'NestJS', 'React Native', 'PostgreSQL', 'AWS']],
    selected: 'Selected work', selectedNote: 'Four projects told in detail: the problem, my part, the decisions, the result.',
    kinds: { pro: 'Work', perso: 'Personal', ecole: 'School' },
    xp: 'Experience', edu: 'Education',
    stack: 'Stack', stackNote: 'Each tool leads to the project that proves it. Filled: used in production. Outlined: used in projects.', lvl: { prod: 'in production', projet: 'in projects' }, provenBy: 'proven by',
    others: 'Other projects', toArchive: n => `The whole archive, ${n} projects`, view: 'View', list: 'List', grid: 'Grid', privateCode: 'Private code',
    contactTitle: 'Let’s talk.', contactNote: 'For a permanent role or a question about a project, write to me.',
    copy: 'Copy address', copied: 'Address copied', readCase: 'Read the case study',
    rights: '© 2026 Ziyad Chaabi, Troyes, France', top: 'Back to top',
    cs: { crumb: 'Work', brief: 'In short', context: 'Context', problem: 'The problem', built: 'What I built', decisions: 'Technical decisions',
      result: 'The result', lessons: 'What I took away', next: 'Next project', setting: 'Setting', org: 'Where', period: 'Period', team: 'Team', role: 'My role', code: 'Code' },
    about: { title: 'About', method: 'How I work', path: 'Path', said: 'People I worked with', langs: 'Languages', photo: 'Ziyad Chaabi smiling, a JVC camera on his shoulder' },
    archive: { title: 'Archive', lede: n => `The ${n} other projects: school, personal, GitHub repositories, newest first. The list updates with every new repository.`, main: 'The four main ones are told on', mainLink: 'the home page', cols: ['Project', 'Field', 'Year'] },
    veille: { title: 'Tech watch', lede: 'What I am reading right now: repositories climbing on GitHub, this month’s AI projects and Hacker News discussions, fetched live.', notes: 'My notes',
      gh: 'GitHub trending this week', ai: 'AI repositories this month', hn: 'Discussed on Hacker News', source: 'Source', loading: 'Loading…', all: 'All', show: 'Show',
      ask: 'Your turn: your own watch', askPh: 'A topic: rust, agents, webgpu…', askBtn: 'Search', askHint: 'Results come live from Hacker News and GitHub.', onHN: 'On Hacker News', onGH: 'On GitHub' },
    lost: 'This peak is not on the map.', home: 'Back to the home page',
  },
};

/* ---------- Archive : projets écrits à la main + dépôts synchronisés + dépôts privés ---------- */
const ghName = u => u.match(/github\.com\/Subdij\/([^/]+)/)?.[1];
const handled = new Set([...Z.cases, ...Z.others].flatMap(p => (p.links || []).map(([, u]) => ghName(u)).filter(Boolean)));
const firstSentence = s => { const t = String(s || '').replace(/\s+/g, ' ').trim(); const m = t.match(/^.{20,160}?[.!?](\s|$)/); return m ? m[0].trim() : t.slice(0, 140); };
const repoItems = auto.filter(a => !handled.has(a.repo)).map(a => {
  const h = Z.repos.find(r => r.repo === a.repo);
  const img = a.images.find(i => /desktop|readme|repo/.test(i)) || a.images.find(i => !/mobile/.test(i));
  return { slug: a.slug, title: h?.n || a.title, year: h?.y || a.year, zone: h?.z || a.zone, stack: h?.s?.length ? h.s : a.stack,
    kicker: h?.d || (a.description ? firstSentence(a.description) : { fr: 'Un dépôt publié sur GitHub.', en: 'A repository published on GitHub.' }),
    links: [['GitHub', a.url], ...(a.live ? [[{ fr: 'Démo', en: 'Demo' }, a.live]] : [])], img: img ? { src: img } : null, kind: 'ecole' };
});
const privateItems = Z.repos.filter(r => !r.repo).map(r => ({ slug: slugify(r.n), title: r.n, year: r.y, zone: r.z, stack: r.s, kicker: r.d, links: [], private: true }));
const archiveItems = l => [...Z.others, ...repoItems, ...privateItems].map(x => loc(x, l))
  .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title, l));
const ARCHIVE_N = Z.others.length + repoItems.length + privateItems.length;

/* ---------- Routes : une page, deux langues ---------- */
const ROUTES = { home: ['index.html', 'en/index.html'], about: ['a-propos.html', 'en/about.html'], archive: ['archive.html', 'en/archive.html'], veille: ['veille.html', 'en/tech-watch.html'] };
Z.cases.forEach(c => (ROUTES['case:' + c.slug] = [`projets/${c.slug}.html`, `en/projects/${c.slug}.html`]));
const fileOf = (key, l) => ROUTES[key][LANGS.indexOf(l)];
const canon = f => site.url + f.replace(/(^|\/)index\.html$/, '$1');
const rel = (from, to) => posix.relative(posix.dirname(from), to) || posix.basename(to);

const caseBy = Object.fromEntries(Z.cases.map(c => [c.slug, c]));
const proofName = (slug, l) => loc((caseBy[slug] || Z.others.find(o => o.slug === slug) || repoItems.find(r => r.slug === slug))?.title, l) || slug;
const proofHref = (slug, P) => (caseBy[slug] ? P.url('case:' + slug) : P.url('archive') + '#' + slug);

/* ---------- Fragments ---------- */
// une ligne de titre masquée : le texte est lisible tel quel si le JS ne tourne pas
const lines = arr => arr.map((t, i) => `<span class="ln" style="--i:${i}"><span>${esc(t)}</span></span>`).join('');
const words = s => s.split(/(\*[^*]+\*)/).filter(Boolean).flatMap(part => {
  const em = part.startsWith('*');
  return part.replace(/\*/g, '').trim().split(/\s+/).filter(Boolean).map(w => (em ? `<em>${esc(w)}</em>` : esc(w)));
}).reduce((a, w) => (/^[,.;:!?]/.test(w) && a.length ? (a[a.length - 1] += w, a) : [...a, w]), []) // la ponctuation reste collée au mot d'avant
  .map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(' ');

// une image de la série spatiale (NASA, domaine public) : astre détouré (is-obj) ou photo fondue sur ses bords (is-photo)
function art(slug, P, { cls = '', sizes = '(max-width: 760px) 60vw, 28vw', eager = false, vt = '', relief = false } = {}) {
  const a = ART[slug];
  const src = (n, ext) => P.a(`img/space/${a.file}-${n}.${ext}`);
  const set = ext => a.sizes.map(([n, w]) => `${src(n, ext)} ${w}w`).join(', ');
  const [, w, h] = a.sizes[1];
  const gl = relief && a.height ? ` data-height="${P.a('img/space/' + a.height)}" data-photo="${src(1200, 'webp')}"` : '';
  return `<picture class="art ${a.kind === 'object' ? 'is-obj' : 'is-photo'}${cls ? ' ' + cls : ''}"><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${src(1200, 'webp')}" srcset="${set('webp')}" sizes="${sizes}" width="${w}" height="${h}" alt=""${vt ? ` style="view-transition-name:${vt}"` : ''}${gl} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
const isPhone = s => { const [w, h] = imgSize(s.src); return s.phone || h > w; };
function shot(s, P, { cls = '', eager = false, alt = true, style = '' } = {}) {
  const [w, h] = imgSize(s.src);
  return `<img class="shot${isPhone(s) ? ' is-phone' : ''}${cls ? ' ' + cls : ''}" src="${P.a(s.src)}" width="${w}" height="${h}" alt="${alt ? esc(s.alt) : ''}"${style ? ` style="${style}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}
const chips = (list, label) => `<ul class="chips"${label ? ` aria-label="${esc(label)}"` : ''}>${list.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
const ext = (label, url) => `<a class="arrow-link" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;

function stackBlock(P, id = 'stack') {
  const { t } = P, skills = loc(Z.skills, P.l);
  return `
<section class="stack wrap" id="${id}" aria-labelledby="${id}-h">
  <header class="sec-head"><h2 class="h2" id="${id}-h" data-lines>${lines([t.stack])}</h2><p class="sec-note">${t.stackNote}</p></header>
  <div class="stack-rows">${skills.map(g => `
    <section class="sg"><h3>${esc(g.group)}</h3><ul class="tools">${g.items.map(([n, lv, ps, ico]) => {
      const proofs = ps.map(s => proofName(s, P.l)).join(', ');
      return `<li><a class="tool lv-${lv}" href="${proofHref(ps[0], P)}">${ico ? `<svg class="tool-ico" aria-hidden="true"><use href="${P.a('img/icons.svg')}#${ico}"/></svg>` : '<span class="tool-dot" aria-hidden="true"></span>'}<span class="tool-name">${esc(n)}</span><span class="tool-proof">${t.provenBy} ${esc(proofs)}</span><span class="sr">, ${t.lvl[lv]}</span></a></li>`;
    }).join('')}</ul></section>`).join('')}
  </div>
</section>`;
}

// une ligne de l'index (accueil et archive), qui devient une carte en mode grille
function indexItem(x, P, { anchors }) {
  const { t } = P, zone = loc(Z.zones[x.zone], P.l) || '';
  const pic = x.img ? shot({ ...x.img, alt: '' }, P, { cls: 'idx-shot', alt: false }) : `<span class="idx-blank" aria-hidden="true">${esc(x.title)}</span>`;
  const title = anchors ? esc(x.title) : `<a href="${P.url('archive')}#${x.slug}">${esc(x.title)}</a>`;
  const links = anchors ? [...x.links.map(([l, u]) => ext(l, u)), ...(x.private ? [`<span class="note">${t.privateCode}</span>`] : [])].join('') : '';
  return `<li class="idx-item"${anchors ? ` id="${x.slug}"` : ''}${x.img ? ` data-peek="${P.a(x.img.src)}"` : ''}>
      <span class="idx-pic">${pic}</span>
      <h3 class="idx-title">${title}</h3>
      <p class="idx-desc">${esc(x.kicker)}</p>
      <p class="idx-zone">${esc(zone)}</p>
      <p class="idx-year">${esc(x.year)}</p>
      ${links ? `<p class="idx-links">${links}</p>` : ''}
    </li>`;
}
const viewToggle = P => `<div class="view-toggle" role="group" aria-label="${P.t.view}"><button type="button" aria-pressed="true" data-view="list">${P.t.list}</button><button type="button" aria-pressed="false" data-view="grid">${P.t.grid}</button></div>`;

/* ---------- Coquille commune ---------- */
const ME = site.url + '#ziyad', SITE = site.url + '#site';
const DISAMBIG = {
  fr: 'Ingénieur développeur basé à Troyes. Aucun lien avec la musique chaâbi ni avec le chanteur Ziyad Lmaghribi : ce sont deux personnes différentes.',
  en: 'Software engineer based in Troyes, France. Not related to chaâbi music or to the singer Ziyad Lmaghribi: they are different people.',
};
const person = l => ({
  '@type': 'Person', '@id': ME, name: 'Ziyad Chaabi', givenName: 'Ziyad', familyName: 'Chaabi', alternateName: ['Ziyad CHAABI', 'Ziyad Chaâbi', 'Subdij'],
  url: site.url, image: { '@type': 'ImageObject', url: site.url + 'img/ziyad-photo.webp', caption: 'Ziyad Chaabi' },
  jobTitle: loc(Z.profile.role, l), description: loc(Z.profile.pitch, l), disambiguatingDescription: DISAMBIG[l],
  email: 'mailto:' + site.email, address: { '@type': 'PostalAddress', addressLocality: 'Troyes', addressRegion: 'Grand Est', addressCountry: 'FR' },
  alumniOf: [{ '@type': 'CollegeOrUniversity', name: 'INSA Hauts-de-France' }, { '@type': 'CollegeOrUniversity', name: 'Université Gustave Eiffel, IUT de Meaux' }],
  knowsAbout: ['TypeScript', 'Angular', 'Ionic', 'NestJS', 'PostgreSQL', 'React Native', 'AWS', 'Docker', 'Supabase', 'Unity', 'UX design'],
  knowsLanguage: ['fr', 'ar', 'en', 'es'], sameAs: [site.linkedin, site.github, 'https://github.com/ziyad-chaabi', site.instagram],
});

function page(key, l, { title, desc, type = 'WebPage', image, jsonld, lcp, crumbs = [] }, body) {
  const file = fileOf(key, l), other = LANGS.find(x => x !== l), t = T[l];
  const P = { l, t, file, key, a: p => rel(file, p), url: (k, hash = '') => rel(file, fileOf(k, l)) + hash };
  const main = body(P);
  const url = canon(file), img = image ? site.url + image : site.url + 'img/og.jpg';
  const [ow, oh] = imgSize(image || 'img/og.jpg');
  const pageNode = { '@type': type, '@id': url + '#page', url, name: title, description: desc, isPartOf: { '@id': SITE }, about: { '@id': ME }, inLanguage: l === 'fr' ? 'fr-FR' : 'en',
    ...(key === 'home' ? { mainEntity: { '@id': ME } } : { breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [[l === 'fr' ? 'Accueil' : 'Home', 'home'], ...crumbs].map(([n, k], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: canon(fileOf(k, l)) })) } }) };
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', '@id': SITE, url: site.url, name: 'Ziyad Chaabi', inLanguage: ['fr-FR', 'en'], publisher: { '@id': ME } }, person(l), pageNode, ...(jsonld ? [jsonld] : [])] };
  const nav = [['projects', 'home', '#projets'], ['about', 'about'], ['archive', 'archive'], ['veille', 'veille']]
    .map(([n, k, h = '']) => `<a href="${P.url(k, h)}"${(k === key && !h) || (n === 'projects' && key.startsWith('case:')) ? ' aria-current="page"' : ''}>${t.nav[n]}</a>`).join('');
  const html = `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="Ziyad Chaabi">
<meta name="google-site-verification" content="4kWqjcimy18LhSDn4mD4XuOtKIBeuHQXVvQ8QMu2TKg">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#EEF0EB" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0D1016" media="(prefers-color-scheme: dark)">
<link rel="canonical" href="${url}">
${LANGS.map(x => `<link rel="alternate" hreflang="${x}" href="${canon(fileOf(key, x))}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${canon(fileOf(key, 'fr'))}">
<link rel="icon" href="${P.a('favicon.svg')}" type="image/svg+xml">
<meta property="og:type" content="${key.startsWith('case:') ? 'article' : key === 'home' ? 'profile' : 'website'}">
<meta property="og:locale" content="${l === 'fr' ? 'fr_FR' : 'en_GB'}">
<meta property="og:locale:alternate" content="${l === 'fr' ? 'en_GB' : 'fr_FR'}">
<meta property="og:site_name" content="Ziyad Chaabi">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="${ow}"><meta property="og:image:height" content="${oh}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Instrument+Serif:ital@1&display=swap">
<link rel="stylesheet" href="${P.a('css/style.css')}">
${lcp ? `<link rel="preload" as="image" href="${P.a(lcp)}" fetchpriority="high">` : ''}
<script>(function(d){d.classList.add('js');${key === 'home' ? "try{if(!sessionStorage.getItem('zc-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('intro')}catch(e){}" : ''}setTimeout(function(){if(!d.classList.contains('booted'))d.classList.remove('js','intro')},2500)})(document.documentElement)</script>
</head>
<body data-page="${key.split(':')[0]}">
<a class="skip" href="#main">${t.skip}</a>
<header class="bar">
  <a class="bar-name" href="${P.url('home')}">Ziyad Chaabi</a>
  <nav class="bar-nav" aria-label="${t.navLabel}">${nav}</nav>
  <div class="bar-end">
    <a class="bar-link" href="${P.a(site.cv)}" download>${t.cv}</a>
    <a class="bar-link" href="#contact">${t.contact}</a>
    <a class="bar-lang" href="${rel(file, fileOf(key, other))}" hreflang="${other}" lang="${other}">${t.otherShort}<span class="sr"> (${t.other})</span></a>
    <button class="bar-menu" type="button" popovertarget="menu">${t.menu}</button>
  </div>
</header>
<nav class="menu" id="menu" popover aria-label="${t.menu}">
  <button class="menu-close" type="button" popovertarget="menu" popovertargetaction="hide">${t.close}</button>
  ${nav}
  <a href="${P.a(site.cv)}" download>${t.cvLong}</a>
  <a href="#contact">${t.contact}</a>
</nav>
<main id="main">
${main}
</main>
<footer class="foot" id="contact" aria-labelledby="foot-h" data-stars="18">
  ${art('terre', P, { cls: 'foot-earth', sizes: '(max-width: 760px) 90vw, 50vw' })}
  <div class="foot-in wrap">
    <h2 class="foot-title" id="foot-h" data-lines>${lines([t.contactTitle])}</h2>
    <div class="foot-grid">
      <div>
        <p class="foot-note">${t.contactNote}</p>
        <div class="foot-mail">
          <a class="foot-addr" href="mailto:${site.email}">${site.email}</a>
          <button class="btn btn-line" type="button" data-copy="${site.email}" data-done="${t.copied}">${t.copy}</button>
          <span class="copy-msg" role="status"></span>
        </div>
      </div>
      <ul class="foot-links">
        <li><a class="arrow-link" href="${site.linkedin}" target="_blank" rel="me noopener">LinkedIn</a></li>
        <li><a class="arrow-link" href="${site.github}" target="_blank" rel="me noopener">GitHub</a></li>
        <li><a class="arrow-link" href="${P.a(site.cv)}" download>${t.cv}</a></li>
      </ul>
      <p class="foot-status"><span class="live" aria-hidden="true"></span>${esc(loc(Z.profile.status, l))}<span>${esc(loc(Z.profile.place, l))}</span></p>
    </div>
  </div>
  <div class="foot-bottom wrap"><p>${t.rights}</p><a href="#main">${t.top}</a></div>
</footer>
<div class="peek" aria-hidden="true"><img alt=""><p class="peek-card"><b class="peek-title"></b><span class="peek-sub"></span></p></div>
<script src="${P.a('js/vendor/lenis.min.js')}" defer></script>
<script src="${P.a('js/relief.js')}" defer></script>
${key === 'veille' ? `<script src="${P.a('js/veille-data.js')}" defer></script>\n<script src="${P.a('js/veille.js')}" defer></script>` : ''}
<script src="${P.a('js/app.js')}" defer></script>
<script data-goatcounter="https://ziyad-chaabi.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>
</body>
</html>
`;
  mkdirSync(posix.dirname(file), { recursive: true });
  writeFileSync(file, html);
}

/* ================= Accueil ================= */
const BAND = ['terre', 'lune', 'mars', 'neptune', 'uranus', 'venus', 'mercure', 'pluton', 'io', 'saturne-dessus'];
const home = P => {
  const { t, l } = P, pr = loc(Z.profile, l), cases = loc(Z.cases, l), band = BAND.map(s => art(s, P, { cls: 'band-item', sizes: '180px' })).join('');
  const others = loc(Z.others, l).sort((a, b) => b.year - a.year);
  const xp = loc(Z.experience, l), edu = loc(Z.education, l);
  return `
<section class="hero" aria-labelledby="hero-name" data-stars="14">
  <canvas class="hero-map" aria-hidden="true"></canvas>
  <div class="hero-band" aria-hidden="true"><div class="band-track">${band}${band.replace(/class="art /g, 'class="art is-dup ')}</div></div>
  <figure class="hero-face" data-height="${P.a('img/ziyad-relief.png')}">
    <img src="${P.a('img/ziyad-photo.webp')}" width="600" height="750" alt="${t.portrait}" fetchpriority="high">
    <figcaption class="hero-hint" aria-hidden="true"><span class="on-fine">${t.hintFine}</span><span class="on-touch">${t.hintTouch}</span></figcaption>
  </figure>
  <h1 class="hero-name" id="hero-name" data-lines>${lines(['Ziyad', 'Chaabi'])}</h1>
  <div class="hero-copy">
    <p class="hero-role">${esc(pr.role)}</p>
    <p class="hero-pitch">${esc(pr.pitch)}</p>
    <p class="hero-cta"><a class="btn" href="${P.a(site.cv)}" download>${t.cvLong}</a><a class="btn btn-line" href="#contact">${t.contact}</a></p>
  </div>
  <p class="corner corner-bl"><span class="live" aria-hidden="true"></span>${esc(pr.status)}<span class="corner-sub">${esc(pr.xp)}</span></p>
  <p class="corner corner-br">${esc(pr.place)}<span class="corner-sub" aria-hidden="true">${pr.coords}</span></p>
</section>
<div class="intro" aria-hidden="true"><svg class="intro-mark" viewBox="0 0 160 100"><ellipse pathLength="1" cx="80" cy="50" rx="74" ry="44"/><ellipse pathLength="1" cx="80" cy="50" rx="56" ry="32"/><path pathLength="1" d="M48 34h30L48 66h30"/><path pathLength="1" d="M118 38a16 16 0 1 0 0 24"/></svg><div class="intro-stack"></div></div>

<section class="statement" aria-label="${esc(pr.role)}">
  <div class="marquee" aria-hidden="true">
    ${t.lines.map((row, i) => `<p class="mq" data-dir="${i ? 1 : -1}"><span>${row.map(esc).join(' · ')} · </span><span>${row.map(esc).join(' · ')} · </span><span>${row.map(esc).join(' · ')} · </span></p>`).join('\n    <svg class="trace" viewBox="0 0 1200 140" preserveAspectRatio="none"><path pathLength="1" d="M0 96C120 96 170 40 300 44s170 62 300 58 160-70 300-74 190 52 300 46"/></svg>\n    ')}
  </div>
  <p class="manifesto wrap">${words(pr.manifesto)}</p>
</section>

<section class="work" id="projets" data-night aria-labelledby="work-h" data-stars="22">
  <canvas class="work-map" aria-hidden="true"></canvas>
  <div class="wrap">
    <header class="sec-head"><h2 class="h2" id="work-h" data-lines>${lines([t.selected])}</h2><p class="sec-note">${t.selectedNote}</p></header>
    <ol class="cases">${cases.map((c, i) => {
      const shots = c.shots.map(src => ({ src })), desk = shots.filter(x => !isPhone(x)), phones = shots.filter(isPhone);
      return `
      <li class="case${i % 2 ? ' is-flip' : ''}">
        <div class="case-media${desk.length ? '' : ' is-phones'}" data-wipe>
          ${art(c.emblem, P, { cls: 'case-emblem', vt: 'em-' + c.slug, sizes: '(max-width: 760px) 60vw, 30vw' })}
          ${desk.map(x => shot(x, P, { cls: 'case-shot', alt: false })).join('')}
          ${phones.map((x, j) => shot(x, P, { cls: 'case-phone', alt: false, style: `--j:${j}` })).join('')}
        </div>
        <div class="case-body">
          <p class="case-meta">${esc(c.setting)}, ${c.year}</p>
          <h3 class="case-title"><a class="case-link" href="${P.url('case:' + c.slug)}">${esc(c.title)}</a></h3>
          <p class="case-kicker">${esc(c.kicker)}</p>
          <p class="case-outcome">${esc(c.outcome)}</p>
          ${chips(c.stack.slice(0, 5))}
          <p class="case-cta" aria-hidden="true">${t.readCase}</p>
        </div>
      </li>`; }).join('')}
    </ol>
  </div>
</section>

<section class="xp wrap" aria-labelledby="xp-h">
  <header class="sec-head"><h2 class="h2" id="xp-h" data-lines>${lines([t.xp])}</h2></header>
  <ol class="xp-list">${xp.map(x => `
    <li class="xp-item" data-reveal>
      <p class="xp-when">${esc(x.period)}</p>
      <div class="xp-body">
        <h3 class="xp-role">${esc(x.role)} · <a href="${proofHref(x.proof, P)}">${esc(x.org)}</a></h3>
        <p class="xp-where">${esc(x.where)}</p>
        <p class="xp-impact">${esc(x.impact)}</p>
        ${chips(x.stack)}
      </div>
    </li>`).join('')}
  </ol>
  <h3 class="xp-sub" data-reveal>${t.edu}</h3>
  <ul class="edu">${edu.map(e => `<li data-reveal><span class="xp-when">${esc(e.period)}</span><span><b>${esc(e.degree)}</b>, ${esc(e.school)}</span></li>`).join('')}</ul>
  <p class="xp-cv"><a class="arrow-link" href="${P.a(site.cv)}" download>${t.cvFull}</a></p>
</section>
${stackBlock(P)}
<section class="index wrap" aria-labelledby="idx-h">
  <header class="sec-head"><h2 class="h2" id="idx-h" data-lines>${lines([t.others])}</h2>${viewToggle(P)}</header>
  <ul class="idx" data-view="list">${others.map(o => indexItem(o, P, { anchors: false })).join('')}
  </ul>
  <p class="idx-more"><a class="arrow-link" href="${P.url('archive')}">${t.toArchive(ARCHIVE_N)}</a></p>
</section>`;
};

/* ================= Études de cas ================= */
const caseBody = (c, next) => P => {
  const { t } = P, cs = t.cs, s = c.story;
  const facts = [[cs.setting, c.setting], [cs.org, c.org], [cs.period, c.period], [cs.team, c.team], [cs.role, c.role]];
  const sec = (title, inner, cls = '') => `<section class="cs-sec wrap${cls}" data-reveal><h2 class="cs-h">${title}</h2><div class="cs-text">${inner}</div></section>`;
  const paras = list => list.map(p => `<p>${esc(p)}</p>`).join('');
  return `
<article class="cs">
  <header class="cs-hero" data-stars="10">
    <canvas class="cs-map" aria-hidden="true"></canvas>
    <div class="cs-hero-in wrap">
      <p class="cs-crumb"><a href="${P.url('home', '#projets')}">${cs.crumb}</a><span aria-hidden="true"> / </span>${esc(c.year)}</p>
      <h1 class="cs-title${Math.max(...c.title.split(' ').map(w => w.length)) > 8 ? ' is-long' : ''}" data-lines>${lines([c.title])}</h1>
      <p class="cs-kicker">${esc(c.kicker)}</p>
      <dl class="cs-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <p class="cs-links">${c.links.map(([lb, u]) => ext(lb, u)).join('')}${c.private ? `<span class="note">${esc(c.private)}</span>` : ''}</p>
    </div>
    <div class="cs-emblem">${art(c.emblem, P, { vt: 'em-' + c.slug, eager: true, relief: true, sizes: '(max-width: 760px) 70vw, 36vw' })}</div>
  </header>
  <figure class="cs-cover wrap" data-wipe>${shot(c.cover, P)}<figcaption>${esc(c.cover.alt)}</figcaption></figure>
  <section class="cs-brief wrap" aria-labelledby="brief-h"><h2 class="cs-h" id="brief-h">${cs.brief}</h2>
    <dl>${c.brief.map(([k, v]) => `<div data-reveal><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>
  ${sec(cs.context, paras(s.context))}
  ${sec(cs.problem, paras(s.problem))}
  <section class="cs-built wrap" aria-labelledby="built-h"><h2 class="cs-h" id="built-h">${cs.built}</h2>
    <div class="built">
      <div class="built-frame">${s.built.map((b, i) => `<figure class="built-shot${i ? '' : ' is-on'}" data-step="${i}">${shot(b.shot, P)}<figcaption>${esc(b.shot.alt)}</figcaption></figure>`).join('')}</div>
      <ol class="built-steps">${s.built.map((b, i) => `<li class="built-step" data-step="${i}"><h3>${esc(b.title)}</h3><p>${esc(b.text)}</p></li>`).join('')}</ol>
    </div>
  </section>
  ${sec(cs.decisions, `<dl class="decisions">${s.decisions.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${s.diagram ? `
    <figure class="diagram"><ol>${s.diagram.layers.map(([n, items]) => `<li><h3>${esc(n)}</h3><ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></li>`).join('')}</ol><figcaption>${esc(s.diagram.caption)}</figcaption></figure>` : ''}`)}
  ${sec(cs.result, `${s.result.stats.length ? `<ul class="stats">${s.result.stats.map(([v, lb]) => `<li><b>${v}</b><span>${esc(lb)}</span></li>`).join('')}</ul>` : ''}${paras(s.result.text)}`, ' cs-result')}
  ${s.lessons.length ? sec(cs.lessons, paras(s.lessons)) : ''}
  <section class="cs-sec wrap" data-reveal><h2 class="cs-h">${t.stack}</h2><div class="cs-text">${chips(c.stack)}</div></section>
  <nav class="cs-next wrap" aria-label="${cs.next}">
    <a href="${P.url('case:' + next.slug)}"><span class="cs-next-label">${cs.next}</span><span class="cs-next-title">${esc(next.title)}</span>${art(next.emblem, P, { cls: 'cs-next-art', sizes: '200px' })}</a>
  </nav>
</article>`;
};

/* ================= À propos ================= */
const METHOD_ART = ['terre', 'empreinte', 'mccandless'];
const PATH_ART = { 1: 'earthrise', 3: 'sourire' };
const aboutBody = P => {
  const { t, l } = P, a = t.about, avis = loc(Z.avis, l);
  return `
<section class="page-head ab-head wrap" aria-labelledby="ab-h">
  <h1 class="display" id="ab-h" data-lines>${lines([a.title])}</h1>
  <div class="ab-intro">
    <div class="ab-text">${loc(Z.about, l).map(p => `<p>${esc(p)}</p>`).join('')}</div>
    <figure class="ab-photo" data-wipe><img src="${P.a('img/ziyad-camera.webp')}" width="1600" height="1200" alt="${a.photo}" fetchpriority="high"></figure>
  </div>
</section>
<section class="method wrap" aria-labelledby="m-h">
  <header class="sec-head"><h2 class="h2" id="m-h" data-lines>${lines([a.method])}</h2></header>
  <ol class="method-list">${loc(Z.method, l).map(([k, v], i) => `<li data-reveal>${art(METHOD_ART[i], P, { cls: 'method-art', sizes: '(max-width: 760px) 40vw, 18vw' })}<h3>${esc(k)}</h3><p>${esc(v)}</p></li>`).join('')}</ol>
</section>
<section class="path wrap" aria-labelledby="p-h">
  <header class="sec-head"><h2 class="h2" id="p-h" data-lines>${lines([a.path])}</h2></header>
  <ol class="path-list">${loc(Z.timeline, l).map((s, i) => `
    <li class="path-step" data-reveal>
      <p class="path-when"><span>${s.year}</span>${esc(s.place)}</p>
      <div class="path-body"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>
      ${s.avis ? `<blockquote class="quote"><p>« ${esc(avis[s.avis].text)} »</p><footer><b>${esc(avis[s.avis].name)}</b>, ${esc(avis[s.avis].role)}</footer></blockquote>` : ''}
      ${s.link ? `<a class="arrow-link" href="${proofHref(s.link, P)}">${esc(proofName(s.link, l))}</a>` : ''}</div>
    </li>${PATH_ART[i] ? `<li class="path-art" aria-hidden="true" data-wipe>${art(PATH_ART[i], P, { sizes: '(max-width: 760px) 92vw, 60vw' })}</li>` : ''}`).join('')}
  </ol>
</section>
<section class="ab-more wrap" aria-labelledby="lg-h">
  <div><h2 class="h3" id="lg-h">${a.langs}</h2><ul class="langs">${loc(Z.languages, l).map(([n, v]) => `<li><b>${esc(n)}</b> ${esc(v)}</li>`).join('')}</ul></div>
  <p class="offscreen">${esc(loc(Z.offscreen, l))}</p>
</section>
${stackBlock(P, 'stack')}`;
};

/* ================= Archive ================= */
const archiveBody = P => {
  const { t, l } = P, a = t.archive, items = archiveItems(l);
  return `
<section class="page-head wrap" aria-labelledby="ar-h">
  <h1 class="display" id="ar-h" data-lines>${lines([a.title])}</h1>
  <p class="lede">${a.lede(items.length)} ${a.main} <a href="${P.url('home', '#projets')}">${a.mainLink}</a>.</p>
  <div class="plate" aria-hidden="true" data-wipe>${['pluton', 'io', 'mercure'].map(s => art(s, P, { sizes: '(max-width: 760px) 30vw, 16vw', eager: s === 'io' })).join('')}</div>
</section>
<section class="index wrap" aria-label="${a.title}">
  <header class="sec-head idx-head"><p class="idx-cols" aria-hidden="true">${a.cols.map(c => `<span>${c}</span>`).join('')}</p>${viewToggle(P)}</header>
  <ul class="idx is-archive" data-view="list">${items.map(x => indexItem(x, P, { anchors: true })).join('')}
  </ul>
</section>`;
};

/* ================= Veille ================= */
const veilleBody = P => {
  const v = P.t.veille, notes = loc(Z.notes, P.l);
  const panel = (id, title, src) => `<section class="vs-panel" data-feed="${id}" aria-labelledby="vs-${id}"><header><h2 id="vs-${id}">${title}</h2><a href="${src}" target="_blank" rel="noopener">${v.source}</a></header><ol id="feed-${id}"><li class="wait">${v.loading}</li></ol>${id === 'gh' ? '<p class="veille-gh-time feed-note"></p>' : ''}</section>`;
  return `
<section class="page-head vs-head wrap" aria-labelledby="vs-h">
  <div><h1 class="display" id="vs-h" data-lines>${lines([v.title])}</h1>
  <p class="lede">${v.lede}</p>
  <p class="vs-status" aria-live="polite"><span class="live" aria-hidden="true"></span><span class="veille-time">${v.loading}</span> <span class="vs-next"></span> <span class="vs-new"></span></p></div>
  ${art('lune', P, { cls: 'vs-art', sizes: '(max-width: 760px) 40vw, 22vw', eager: true })}
</section>
<section class="vs wrap">
  <div class="vs-show" role="group" aria-label="${v.show}">${[['all', v.all], ['gh', 'GitHub'], ['ai', P.l === 'fr' ? 'IA' : 'AI'], ['hn', 'Hacker News']].map(([k, lb], i) => `<button type="button" aria-pressed="${!i}" data-show="${k}">${lb}</button>`).join('')}</div>
  <div class="vs-panels">
    ${panel('gh', v.gh, 'https://github.com/trending?since=weekly')}
    ${panel('ai', v.ai, 'https://github.com/search?q=llm+OR+agent+OR+mcp&type=repositories&s=stars')}
    ${panel('hn', v.hn, 'https://news.ycombinator.com/')}
    <aside class="vs-notes" aria-labelledby="vs-notes-h">${art('neptune', P, { cls: 'vs-notes-art', sizes: '140px' })}<h2 id="vs-notes-h">${v.notes}</h2>${notes.map(([k, d]) => `<article><h3>${esc(k)}</h3><p>${esc(d)}</p></article>`).join('')}</aside>
  </div>
  <figure class="vs-wide" aria-hidden="true">${art('bennu', P, { sizes: '92vw' })}</figure>
  <form class="vs-ask" role="search" action="https://hn.algolia.com/" method="get" target="_blank">
    <label class="vs-ask-label h3" for="vs-q">${v.ask}</label>
    <div class="vs-ask-row"><input id="vs-q" name="query" type="search" placeholder="${v.askPh}" autocomplete="off" required><button class="btn" type="submit">${v.askBtn}</button></div>
    <p class="vs-ask-hint">${v.askHint}</p>
    <div class="vs-results" aria-live="polite" hidden>
      <section class="vs-panel"><header><h2>${v.onHN}</h2></header><ol id="ask-hn"></ol></section>
      <section class="vs-panel"><header><h2>${v.onGH}</h2></header><ol id="ask-gh"></ol></section>
    </div>
  </form>
</section>`;
};

/* ================= Écriture ================= */
rmSync('projets', { recursive: true, force: true });
rmSync('en', { recursive: true, force: true });
for (const l of LANGS) {
  const t = T[l], pr = loc(Z.profile, l);
  page('home', l, {
    type: 'ProfilePage', lcp: 'img/ziyad-photo.webp',
    title: l === 'fr' ? 'Ziyad Chaabi | Ingénieur développeur Full Stack, Troyes' : 'Ziyad Chaabi | Full Stack Software Engineer, France',
    desc: l === 'fr' ? `${pr.role}, ${pr.status.toLowerCase()}. TypeScript, Angular, NestJS, React Native. BTP-360 : une application métier livrée seul, en production sur AWS.`
      : `${pr.role}, ${pr.status.toLowerCase()}. TypeScript, Angular, NestJS, React Native. BTP-360: a business app I built alone, in production on AWS.`,
  }, home);
  page('about', l, {
    type: 'AboutPage', image: 'img/ziyad-camera.webp', crumbs: [[t.about.title, 'about']],
    title: l === 'fr' ? 'À propos | Ziyad Chaabi, du design au code' : 'About | Ziyad Chaabi, from design to code',
    desc: l === 'fr' ? 'Le parcours de Ziyad Chaabi : bac STI2D à Troyes, BUT MMI à Meaux, Master Informatique à l’INSA Hauts-de-France, stages et alternance jusqu’à BTP-360. Sa façon de travailler, sa stack.'
      : 'The path of Ziyad Chaabi: technology baccalaureate in Troyes, multimedia degree in Meaux, Master’s in Computer Science at INSA Hauts-de-France, internships and work-study up to BTP-360. How he works, his stack.',
  }, aboutBody);
  page('archive', l, {
    type: 'CollectionPage', crumbs: [[t.archive.title, 'archive']],
    title: l === 'fr' ? 'Archive des projets | Ziyad Chaabi' : 'Project archive | Ziyad Chaabi',
    desc: l === 'fr' ? `Les ${ARCHIVE_N} autres projets de Ziyad Chaabi : applications Android, sites, jeux, réalité virtuelle et dépôts GitHub, mis à jour à chaque nouveau dépôt.`
      : `The ${ARCHIVE_N} other projects of Ziyad Chaabi: Android apps, websites, games, virtual reality and GitHub repositories, updated with every new repository.`,
  }, archiveBody);
  page('veille', l, {
    crumbs: [[t.veille.title, 'veille']],
    title: l === 'fr' ? 'Veille technologique IA et GitHub | Ziyad Chaabi' : 'AI and GitHub tech watch | Ziyad Chaabi',
    desc: l === 'fr' ? 'La veille de Ziyad Chaabi, en direct : dépôts qui montent sur GitHub, projets IA du mois, discussions Hacker News, et ses notes sur les agents de code et MCP.'
      : 'Ziyad Chaabi’s tech watch, live: repositories climbing on GitHub, this month’s AI projects, Hacker News discussions, and his notes on coding agents and MCP.',
  }, veilleBody);
  const cases = loc(Z.cases, l);
  cases.forEach((c, i) => {
    const next = cases[(i + 1) % cases.length], url = canon(fileOf('case:' + c.slug, l));
    page('case:' + c.slug, l, {
      image: c.cover.src, crumbs: [[c.title, 'case:' + c.slug]],
      title: l === 'fr' ? `${c.title} | Étude de cas de Ziyad Chaabi` : `${c.title} | Case study by Ziyad Chaabi`,
      desc: `${c.kicker} ${c.outcome} ${c.stack.slice(0, 5).join(', ')}.`,
      jsonld: { '@type': 'CreativeWork', '@id': url + '#projet', name: c.title, description: c.kicker, dateCreated: c.year, author: { '@id': ME }, inLanguage: l === 'fr' ? 'fr-FR' : 'en', keywords: c.stack.join(', '), url, image: site.url + c.cover.src },
    }, caseBody(c, next));
  });
}

/* ---------- 404 (servie à n'importe quelle profondeur : chemins absolus) ---------- */
writeFileSync('404.html', `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta name="color-scheme" content="light dark">
<title>Page introuvable | Ziyad Chaabi</title><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap"><link rel="stylesheet" href="/css/style.css"></head>
<body class="lost"><main class="lost-main wrap"><p class="display">404</p><p>${T.fr.lost}</p><p lang="en">${T.en.lost}</p><p class="hero-cta"><a class="btn" href="/">${T.fr.home}</a><a class="btn btn-line" href="/en/" lang="en">${T.en.home}</a></p></main></body>
</html>
`);

/* ---------- Redirections des anciennes adresses (aucun lien cassé) ---------- */
function redirect(file, to) {
  const href = rel(file, to);
  mkdirSync(posix.dirname(file), { recursive: true });
  writeFileSync(file, `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Page déplacée | Ziyad Chaabi</title><meta name="robots" content="noindex">
<link rel="canonical" href="${canon(to.split('#')[0])}"><meta http-equiv="refresh" content="0; url=${href}"></head>
<body><p><a href="${href}">Cette page a déménagé.</a></p></body></html>
`);
}
const REDIRECTS = { 'parcours.html': 'a-propos.html', 'competences.html': 'index.html#stack', 'labo.html': 'archive.html', 'projets.html': 'index.html#projets',
  'projets/funfair-vr.html': 'projets/realite-virtuelle.html', 'projets/hotel-murder-vr.html': 'projets/realite-virtuelle.html',
  ...Object.fromEntries([...Z.others, ...repoItems].map(x => [`projets/${x.slug}.html`, `archive.html#${x.slug}`])) };
Object.entries(REDIRECTS).forEach(([f, to]) => redirect(f, to));

/* ---------- llms.txt : le résumé que lisent les assistants IA (llmstxt.org) ---------- */
const fr = k => loc(k, 'fr'), P0 = k => canon(fileOf(k, 'fr'));
writeFileSync('llms.txt', `# Ziyad Chaabi

> ${fr(Z.profile.role)}, basé à Troyes (France). ${fr(Z.profile.pitch)} ${fr(Z.profile.status)}. ${fr(Z.profile.place)}. Ce fichier résume son portfolio, ${site.url} (version anglaise : ${site.url}en/).

- Homonymie : ${DISAMBIG.fr}
- Expérience : ${fr(Z.profile.xp)}
- Formation : ${fr(Z.education).map(e => `${e.degree}, ${e.school} (${e.period})`).join(' ; ')}
- Langues : ${fr(Z.languages).map(([n, v]) => `${n} ${v}`).join(', ')}
- Contact : ${site.email} ; LinkedIn ${site.linkedin} ; GitHub ${site.github} ; CV ${site.url}${site.cv}

## Expérience

${fr(Z.experience).map(x => `- ${x.period}, ${x.org} (${x.where}) : ${x.role}. ${x.impact}`).join('\n')}

## Études de cas

${fr(Z.cases).map(c => `- [${c.title}](${P0('case:' + c.slug)}) : ${c.kicker} ${c.brief.map(([k, v]) => `${k} : ${v}`).join(' ')} Stack : ${c.stack.join(', ')}.`).join('\n')}

## Autres projets

${archiveItems('fr').map(x => `- ${x.title} (${x.year}) : ${x.kicker}${x.links[0] ? ` ${x.links[0][1]}` : ''}`).join('\n')}

## Pages

- [Accueil](${site.url}) : rôle, disponibilité, projets choisis, expérience, stack, contact
- [À propos](${P0('about')}) : parcours, façon de travailler, langues
- [Archive](${P0('archive')}) : tous les autres projets et dépôts GitHub
- [Veille](${P0('veille')}) : tendances GitHub et IA, en direct
`);

/* ---------- Plan du site, avec les versions de chaque langue ---------- */
const today = new Date().toISOString().slice(0, 10);
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${Object.keys(ROUTES).flatMap(k => LANGS.map(l => `  <url><loc>${canon(fileOf(k, l))}</loc><lastmod>${today}</lastmod>${LANGS.map(x => `<xhtml:link rel="alternate" hreflang="${x}" href="${canon(fileOf(k, x))}"/>`).join('')}</url>`)).join('\n')}
</urlset>
`);
console.log(`${Object.keys(ROUTES).length * LANGS.length} pages, ${Object.keys(REDIRECTS).length} redirections, ${ARCHIVE_N} projets dans l'archive.`);
