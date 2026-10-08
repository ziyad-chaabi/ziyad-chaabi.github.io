// Vérifie le compteur de visiteurs sans toucher aux vrais compteurs : le site est servi depuis les fichiers
// locaux comme s'il était sur ziyad-chaabi.github.io, et Abacus est remplacé par un faux en mémoire.
// Usage : node scripts/test-visiteurs.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert';
const ROOT = process.cwd() + '/';
const store = {}, hits = [];
const types = { html: 'text/html', js: 'application/javascript', css: 'text/css', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', json: 'application/json' };
const b = await chromium.launch();
async function device() {
  const ctx = await b.newContext();
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); sessionStorage.setItem('zc-seen', '1'); });
  await ctx.route('https://ziyad-chaabi.github.io/**', r => { // le site, servi depuis les fichiers locaux
    let p = new URL(r.request().url()).pathname.slice(1) || 'index.html'; if (!existsSync(ROOT + p)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ body: readFileSync(ROOT + p), contentType: types[p.split('.').pop()] || 'application/octet-stream' });
  });
  await ctx.route('https://abacus.jasoncameron.dev/**', r => { // faux Abacus en mémoire
    const [, op, , key] = new URL(r.request().url()).pathname.split('/');
    if (op === 'hit') { store[key] = (store[key] || 0) + 1; hits.push(key); }
    r.fulfill({ status: store[key] ? 200 : 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(store[key] ? { value: store[key] } : { error: 'Key not found' }) });
  });
  return ctx;
}
const read = async p => { await p.waitForFunction(() => [...document.querySelectorAll('[data-stat]')].every(e => e.textContent !== '–'), null, { timeout: 15000 }); return p.$$eval('[data-stat]', es => ['total', 'day', 'month'].map(k => +es.find(e => e.dataset.stat === k).textContent.replace(/\s/g, ''))); };
const A = await device(), pa = await A.newPage();
await pa.goto('https://ziyad-chaabi.github.io/'); assert.deepEqual(await read(pa), [1, 1, 1]); console.log('1re visite        : total, jour, mois =', await read(pa));
await pa.reload(); await pa.waitForTimeout(800); assert.deepEqual(await read(pa), [1, 1, 1]); console.log('rafraîchissement  :', await read(pa));
await pa.goto('https://ziyad-chaabi.github.io/parcours.html'); assert.deepEqual(await read(pa), [1, 1, 1]); console.log('autre page        :', await read(pa));
const B = await device(), pb = await B.newPage();
await pb.goto('https://ziyad-chaabi.github.io/projets.html'); assert.deepEqual(await read(pb), [2, 2, 2]); console.log('2e appareil       :', await read(pb));
await pa.evaluate(() => { const s = JSON.parse(localStorage.getItem('zc-vu')); s.day = '2000-01-01'; localStorage.setItem('zc-vu', JSON.stringify(s)); }); // A revient « le lendemain »
await pa.goto('https://ziyad-chaabi.github.io/'); assert.deepEqual(await read(pa), [2, 3, 2]); console.log('A, le lendemain   :', await read(pa));
console.log('incrémentations   :', hits.length, '(attendu : 7)'); assert.equal(hits.length, 7);
await b.close(); console.log('OK : chaque personne n’est comptée qu’une fois par période');
