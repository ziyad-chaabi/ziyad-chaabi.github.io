// Vérifie le compteur de visiteurs sans toucher aux vrais compteurs : le site est servi depuis les fichiers locaux
// comme s'il était sur ziyad-chaabi.github.io ; Abacus et le service d'IP sont remplacés par des faux en mémoire.
// Usage : node scripts/test-visiteurs.mjs
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert';

const ROOT = process.cwd() + '/';
const types = { html: 'text/html', js: 'application/javascript', css: 'text/css', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml' };
const store = {};
const b = await chromium.launch();

// un « navigateur » : son propre stockage, une connexion (IP), éventuellement une autre date
async function browser(ip, { daysLater = 0 } = {}) {
  const ctx = await b.newContext();
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); sessionStorage.setItem('zc-seen', '1'); });
  await ctx.route('https://ziyad-chaabi.github.io/**', r => {
    const p = new URL(r.request().url()).pathname.slice(1) || 'index.html';
    if (!existsSync(ROOT + p)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ body: readFileSync(ROOT + p), contentType: types[p.split('.').pop()] || 'application/octet-stream' });
  });
  await ctx.route('https://api.ipify.org/**', r => (ip ? r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ip }) }) : r.abort()));
  await ctx.route('https://abacus.jasoncameron.dev/**', r => {
    const [, op, , key] = new URL(r.request().url()).pathname.split('/');
    if (op === 'hit') store[key] = (store[key] || 0) + 1;
    r.fulfill({ status: store[key] ? 200 : 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(store[key] ? { value: store[key] } : { error: 'Key not found' }) });
  });
  const page = await ctx.newPage();
  if (daysLater) await page.clock.setSystemTime(new Date(Date.now() + daysLater * 864e5));
  return page;
}
const read = async p => {
  await p.waitForFunction(() => [...document.querySelectorAll('[data-stat]')].every(e => e.textContent !== '–'), null, { timeout: 15000 });
  return p.$$eval('[data-stat]', es => Object.fromEntries(es.map(e => [e.dataset.stat, +e.textContent.replace(/\s/g, '')])));
};
const visit = async (p, path = '') => { await p.goto('https://ziyad-chaabi.github.io/' + path); return read(p); };
const check = async (label, got, want) => { assert.deepEqual(got, want, label); console.log(label.padEnd(34), JSON.stringify(got)); };

const opera = await browser('37.67.47.58');
await check('Opera, 1re visite', await visit(opera), { total: 1, month: 1, day: 1 });
await check('Opera, rafraîchissement', await visit(opera), { total: 1, month: 1, day: 1 });
await check('Opera, autre page', await visit(opera, 'parcours.html'), { total: 1, month: 1, day: 1 });
await check('Chrome, même connexion', await visit(await browser('37.67.47.58')), { total: 1, month: 1, day: 1 });
await check('Autre personne, autre connexion', await visit(await browser('81.250.1.2')), { total: 2, month: 2, day: 2 });
// le lendemain, même connexion : nouveau jour, même total (et même mois, sauf si on change de mois)
const tomorrow = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date(Date.now() + 864e5));
const sameMonth = tomorrow.slice(0, 7) === new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date()).slice(0, 7);
await check('Chrome, le lendemain', await visit(await browser('37.67.47.58', { daysLater: 1 })), { total: 2, month: sameMonth ? 2 : 1, day: 1 });
await check('Service d’IP en panne (repli)', await visit(await browser(null)), { total: 3, month: 3, day: 3 });

await b.close();
console.log('OK : une connexion n’est comptée qu’une fois par période, quel que soit le navigateur');
