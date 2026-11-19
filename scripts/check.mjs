// Vérifie le site généré, sans navigateur : node build.mjs && node scripts/check.mjs
// - chaque lien et chaque ressource locale existe (ancres comprises)
// - chaque image a width et height, au bon ratio
// - chaque page a sa langue, sa jumelle FR/EN et un seul h1 ; les redirections mènent quelque part
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { posix } from 'node:path';
import assert from 'node:assert/strict';
import { imgSize } from './img-size.mjs';

// le lecteur de dimensions, sur un fichier de chaque format
assert.deepEqual(imgSize('img/p/btp-360/1.webp'), [1440, 900]);
assert.deepEqual(imgSize('img/ziyad-relief.png'), [420, 525]);
assert.deepEqual(imgSize('img/og.jpg'), [1200, 630]);

const walk = d => readdirSync(d).flatMap(f => { const p = posix.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const pages = ['index.html', 'a-propos.html', 'archive.html', 'veille.html', '404.html', ...walk('projets'), ...walk('en')].filter(f => f.endsWith('.html'));
const html = Object.fromEntries(pages.map(f => [f, readFileSync(f, 'utf8')]));
const ids = f => new Set([...(html[f] ?? readFileSync(f, 'utf8')).matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
const errors = [];
const fail = (f, m) => errors.push(`${f} : ${m}`);

for (const [f, src] of Object.entries(html)) {
  const redirect = src.includes('http-equiv="refresh"');
  if (!/<html lang="(fr|en)"/.test(src)) fail(f, 'pas de lang');
  if (!redirect && f !== '404.html') {
    if ((src.match(/<h1[\s>]/g) || []).length !== 1) fail(f, 'il faut un seul h1');
    if (!src.includes('hreflang="en"') || !src.includes('hreflang="fr"')) fail(f, 'jumelle FR/EN manquante');
  }
  for (const [, tag] of src.matchAll(/<img\b([^>]*)>/g)) {
    const w = +tag.match(/\swidth="(\d+)"/)?.[1], h = +tag.match(/\sheight="(\d+)"/)?.[1], s = tag.match(/\ssrc="([^"]+)"/)?.[1];
    if (!s) continue;
    if (!w || !h) { fail(f, `image sans dimensions : ${s}`); continue; }
    const file = posix.join(posix.dirname(f), s);
    if (existsSync(file)) { const [rw, rh] = imgSize(file); if (Math.abs(rw / rh - w / h) > .02) fail(f, `ratio faux : ${s}`); }
  }
  const refs = [...src.matchAll(/\s(?:href|src|srcset)="([^"]+)"|content="0; url=([^"]+)"/g)].map(m => [, m[1] || m[2]]).flatMap(([, v]) => v.split(/,\s+/).map(x => x.trim().split(' ')[0]));
  for (const raw of refs) {
    let r = raw;
    if (!r || /^(https?:|mailto:|data:|#$)/.test(r) || r.startsWith('//') || !/[./#]/.test(r) || /^[\d.]+$/.test(r)) continue;
    if (r.startsWith('/')) r = r.slice(1) || 'index.html';
    const [path, hash] = r.split('#');
    const target = path ? posix.normalize(posix.join(posix.dirname(f), path)).replace(/\/$/, '/index.html') : f;
    if (raw.startsWith('/')) { if (!existsSync(path || 'index.html') && !existsSync(posix.join(path, 'index.html'))) fail(f, `introuvable : ${raw}`); continue; }
    if (!existsSync(target)) { if (!/\.(html|css|js|svg|webp|avif|png|jpe?g|pdf)$/.test(path)) continue; fail(f, `introuvable : ${raw}`); continue; }
    if (hash && target.endsWith('.html') && !ids(target).has(decodeURIComponent(hash))) fail(f, `ancre absente : ${raw}`);
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`${pages.length} pages vérifiées : liens, ancres, images, langues.`);
