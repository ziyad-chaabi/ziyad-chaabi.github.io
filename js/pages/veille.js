(() => {
// Veille : la vraie page GitHub Trending (relevée toutes les 3 h par .github/workflows/veille.yml dans js/veille-data.js),
// plus les API publiques GitHub (recherche) et Hacker News (Algolia), lues en direct.
// Rechargée toutes les 5 minutes tant que la page est ouverte, et au retour sur l'onglet.
// Ce qui est apparu depuis le dernier passage est marqué « Nouveau ».
// ponytail: cache local de 4 min pour rester sous la limite anonyme de GitHub (10 recherches / min) ; un vrai temps réel demanderait un serveur.
window.ZC_PAGE = function ({ $ }) {
  const EVERY = 5 * 60e3;
  const day = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const fmt = n => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + ' k' : n);
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const safe = u => (/^https?:\/\//.test(u || '') ? u : '#');
  const store = { get: k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

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
    const seen = new Set(store.get('zc-seen-' + id) || []);
    const first = !seen.size;
    $('#' + id).innerHTML = items.length
      ? items.map(i => `<li${!first && !seen.has(i.url) ? ' class="is-new"' : ''}><a href="${esc(safe(i.url))}" target="_blank" rel="noopener"><b>${esc(i.title)}</b><small>${esc(i.sub)}</small></a></li>`).join('')
      : `<li class="err">${msg}</li>`;
    if (items.length) store.set('zc-seen-' + id, [...new Set([...seen, ...items.map(i => i.url)])].slice(-200));
    ScrollTrigger.refresh();
  };
  const gh = d => (d.items || []).slice(0, 7).map(r => ({ url: r.html_url, title: r.full_name, sub: `★ ${fmt(r.stargazers_count)}${r.language ? `, ${r.language}` : ''}${r.description ? `. ${r.description.slice(0, 100)}` : ''}` }));
  const ghErr = 'GitHub limite les requêtes anonymes. La liste se recharge toute seule dans quelques minutes.';
  const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // le relevé GitHub Trending : on recharge le fichier (il change toutes les 3 h côté serveur)
  const trending = () => new Promise(ok => {
    const sc = document.createElement('script'); sc.src = `${document.body.dataset.base || ''}js/veille-data.js?t=${Date.now()}`;
    sc.onload = sc.onerror = () => { sc.remove(); ok(window.ZC_VEILLE); }; document.head.append(sc);
  });
  const showTrending = v => fill('feed-gh', (v?.trending || []).slice(0, 7).map(r => ({ url: r.url, title: r.title,
    sub: `+${fmt(r.week)} ★ cette semaine${r.lang ? `, ${r.lang}` : ''}${r.desc ? `. ${r.desc.slice(0, 100)}` : ''}` })),
    'Le relevé GitHub Trending est indisponible pour le moment.');

  let last = 0;
  function load() {
    last = Date.now();
    trending().then(v => { showTrending(v); if (v?.t) $('.veille-gh-time').textContent = `Relevé à ${time.format(new Date(v.t))}.`; });
    cached('zc-ai', `https://api.github.com/search/repositories?q=${encodeURIComponent(`llm OR agent OR mcp in:name,description,topics created:>${day(30)}`)}&sort=stars&order=desc&per_page=7`)
      .then(d => fill('feed-ai', gh(d), ghErr)).catch(() => fill('feed-ai', [], ghErr));
    cached('zc-hn', `https://hn.algolia.com/api/v1/search?query=AI&tags=story&numericFilters=created_at_i>${Math.floor(Date.now() / 1000) - 7 * 86400},points>100&hitsPerPage=7`)
      .then(d => fill('feed-hn', d.hits.map(h => ({ url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`, title: h.title, sub: `${h.points} points, ${h.num_comments} commentaires` })), 'Rien de marquant cette semaine.'))
      .catch(() => fill('feed-hn', [], "Hacker News ne répond pas pour l'instant. La liste se recharge toute seule dans quelques minutes."));
    $('.veille-time').textContent = `Mis à jour à ${time.format(new Date())}, puis toutes les 5 minutes.`;
  }
  load();
  setInterval(() => { if (!document.hidden) load(); }, EVERY);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - last > EVERY) load(); });
}
})();
