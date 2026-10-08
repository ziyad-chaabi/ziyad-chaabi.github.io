// Relève la vraie page GitHub Trending (semaine), qui n'a ni API ni CORS, et l'écrit dans js/veille-data.js.
// Tourne toutes les 3 h dans .github/workflows/veille.yml ; en local : node scripts/veille.mjs
// La page Veille lit ce fichier, puis complète en direct avec les API publiques (IA, Hacker News).
import { writeFileSync } from 'node:fs';

const html = await (await fetch('https://github.com/trending?since=weekly', { headers: { 'user-agent': 'Mozilla/5.0 portfolio-veille', 'accept-language': 'en' } })).text();
const strip = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const num = s => +String(s || '0').replace(/[^\d]/g, '');

const items = [...html.matchAll(/<article class="Box-row">([\s\S]*?)<\/article>/g)].map(([, a]) => {
  const path = a.match(/<h2[^>]*>\s*<a[^>]*href="\/([^"]+)"/)?.[1];
  if (!path) return null;
  return {
    title: path,
    url: 'https://github.com/' + path,
    desc: strip(a.match(/<p class="col-9[^"]*">([\s\S]*?)<\/p>/)?.[1] || ''),
    lang: strip(a.match(/itemprop="programmingLanguage">([^<]+)</)?.[1] || ''),
    stars: num(strip(a.match(/href="\/[^"]+\/stargazers"[^>]*>([\s\S]*?)<\/a>/)?.[1] || '')),
    week: num(a.match(/([\d,]+)\s+stars this week/)?.[1]),
  };
}).filter(Boolean);

if (!items.length) throw new Error('GitHub Trending : aucun dépôt lu (la page a peut-être changé de structure)');
const out = { t: new Date().toISOString(), trending: items.slice(0, 10) };
writeFileSync('js/veille-data.js', `// Généré par scripts/veille.mjs : ne pas modifier à la main.\nwindow.ZC_VEILLE = ${JSON.stringify(out)};\n`);
console.log(`${items.length} dépôts en tendance relevés, ${out.t}`);
