(() => {
// Veille : la vraie page GitHub Trending (relevée chaque jour par .github/workflows/veille.yml dans js/veille-data.js),
// plus les API publiques GitHub (recherche) et Hacker News (Algolia), lues en direct.
// Rechargée toutes les 5 minutes tant que la page est ouverte, et au retour sur l'onglet.
// Ce qui est apparu depuis le dernier passage est marqué d'un point.
// ponytail: cache local de 4 min pour rester sous la limite anonyme de GitHub (10 recherches / min) ; un vrai temps réel demanderait un serveur.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const en = document.documentElement.lang === 'en';
const S = en ? {
  ghErr: 'GitHub limits anonymous requests. The list reloads by itself in a few minutes.', trendErr: 'The GitHub Trending snapshot is unavailable right now.',
  week: 'this week', pts: 'points', com: 'comments', quiet: 'Nothing notable this week.', hnErr: 'Hacker News is not responding right now. The list reloads by itself in a few minutes.',
  taken: t => `Snapshot taken at ${t}.`, live: t => `Live, updated at ${t}`, next: (m, s) => `next check in ${m}:${s}`, fresh: n => `${n} new since your last visit`,
  search: 'Searching…', noHN: 'Nothing on Hacker News for this topic.', downHN: 'Hacker News is not responding right now.', noGH: 'No repository for this topic.',
} : {
  ghErr: 'GitHub limite les requêtes anonymes. La liste se recharge toute seule dans quelques minutes.', trendErr: 'Le relevé GitHub Trending est indisponible pour le moment.',
  week: 'cette semaine', pts: 'points', com: 'commentaires', quiet: 'Rien de marquant cette semaine.', hnErr: "Hacker News ne répond pas pour l'instant. La liste se recharge toute seule dans quelques minutes.",
  taken: t => `Relevé à ${t}.`, live: t => `En direct, mis à jour à ${t}`, next: (m, s) => `prochain relevé dans ${m}:${s}`, fresh: n => `${n} nouveau${n > 1 ? 'x' : ''} depuis votre dernier passage`,
  search: 'Recherche…', noHN: 'Rien sur Hacker News pour ce sujet.', downHN: 'Hacker News ne répond pas pour l’instant.', noGH: 'Aucun dépôt pour ce sujet.',
};
const EVERY = 5 * 60e3;
const day = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const fmt = n => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + ' k' : n);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const safe = u => (/^https?:\/\//.test(u || '') ? u : '#');
const store = { get: k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const item = i => `<a href="${esc(safe(i.url))}" target="_blank" rel="noopener"><b>${esc(i.title)}</b><small>${esc(i.sub)}</small></a>`;

async function cached(key, url) {
  const c = store.get(key);
  if (c && Date.now() - c.t < 24e4) return c.d;
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  const d = await r.json();
  store.set(key, { t: Date.now(), d });
  return d;
}
const fill = (id, items, msg) => {
  const seen = new Set(store.get('zc-seen-' + id) || []), first = !seen.size;
  $('#' + id).innerHTML = items.length ? items.map(i => `<li${!first && !seen.has(i.url) ? ' class="is-new"' : ''}>${item(i)}</li>`).join('') : `<li class="err">${msg}</li>`;
  if (items.length) store.set('zc-seen-' + id, [...new Set([...seen, ...items.map(i => i.url)])].slice(-200));
  const n = $$('.vs-panels li.is-new').length;
  $('.vs-new').textContent = n ? S.fresh(n) : '';
};
const gh = d => (d.items || []).slice(0, 7).map(r => ({ url: r.html_url, title: r.full_name, sub: `★ ${fmt(r.stargazers_count)}${r.language ? `, ${r.language}` : ''}${r.description ? `. ${r.description.slice(0, 100)}` : ''}` }));
const time = new Intl.DateTimeFormat(en ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });

// le relevé GitHub Trending : on recharge le fichier (il change une fois par jour côté serveur)
const base = new URL('.', document.currentScript?.src || location.href);
const trending = () => new Promise(ok => {
  const sc = document.createElement('script'); sc.src = new URL(`veille-data.js?t=${Date.now()}`, base).href;
  sc.onload = sc.onerror = () => { sc.remove(); ok(window.ZC_VEILLE); }; document.head.append(sc);
});
const showTrending = v => fill('feed-gh', (v?.trending || []).slice(0, 7).map(r => ({ url: r.url, title: r.title, sub: `+${fmt(r.week)} ★ ${S.week}${r.lang ? `, ${r.lang}` : ''}${r.desc ? `. ${r.desc.slice(0, 100)}` : ''}` })), S.trendErr);

let last = 0;
function load() {
  last = Date.now();
  trending().then(v => { showTrending(v); if (v?.t) $('.veille-gh-time').textContent = S.taken(time.format(new Date(v.t))); });
  cached('zc-ai', `https://api.github.com/search/repositories?q=${encodeURIComponent(`llm OR agent OR mcp in:name,description,topics created:>${day(30)}`)}&sort=stars&order=desc&per_page=7`)
    .then(d => fill('feed-ai', gh(d), S.ghErr)).catch(() => fill('feed-ai', [], S.ghErr));
  cached('zc-hn', `https://hn.algolia.com/api/v1/search?query=AI&tags=story&numericFilters=created_at_i>${Math.floor(Date.now() / 1000) - 7 * 86400},points>100&hitsPerPage=7`)
    .then(d => fill('feed-hn', d.hits.map(h => ({ url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`, title: h.title, sub: `${h.points} ${S.pts}, ${h.num_comments} ${S.com}` })), S.quiet))
    .catch(() => fill('feed-hn', [], S.hnErr));
  $('.veille-time').textContent = S.live(time.format(new Date()));
}
load();
setInterval(() => { if (!document.hidden) load(); }, EVERY);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - last > EVERY) load(); });

// le vrai compte à rebours jusqu'au prochain rechargement
const next = $('.vs-next');
const tick = () => { const s = Math.max(0, Math.round((last + EVERY - Date.now()) / 1000)); next.textContent = S.next(Math.floor(s / 60), String(s % 60).padStart(2, '0')); };
tick(); setInterval(tick, 1000);

// afficher un seul flux (plus large) ou tous
const shows = $$('.vs-show button'), panels = $$('.vs-panels [data-feed]');
shows.forEach(b => b.addEventListener('click', () => {
  shows.forEach(x => x.setAttribute('aria-pressed', x === b));
  panels.forEach(p => (p.hidden = b.dataset.show !== 'all' && p.dataset.feed !== b.dataset.show));
  $('.vs-panels').classList.toggle('is-one', b.dataset.show !== 'all');
}));

// votre propre veille, en direct sur les mêmes sources
const form = $('.vs-ask'), out = $('.vs-results');
form.addEventListener('submit', e => {
  e.preventDefault();
  const q = $('#vs-q').value.trim();
  if (!q) return;
  out.hidden = false;
  $('#ask-hn').innerHTML = $('#ask-gh').innerHTML = `<li class="wait">${S.search}</li>`;
  const list = (id, items, msg) => { $('#' + id).innerHTML = items.length ? items.map(i => `<li>${item(i)}</li>`).join('') : `<li class="err">${msg}</li>`; };
  fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=6`).then(r => r.json())
    .then(d => list('ask-hn', d.hits.map(h => ({ url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`, title: h.title, sub: `${h.points} ${S.pts}, ${h.num_comments} ${S.com}, ${new Date(h.created_at).getFullYear()}` })), S.noHN))
    .catch(() => list('ask-hn', [], S.downHN));
  fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=6`).then(r => (r.ok ? r.json() : Promise.reject()))
    .then(d => list('ask-gh', gh(d), S.noGH))
    .catch(() => list('ask-gh', [], S.ghErr));
});
})();
