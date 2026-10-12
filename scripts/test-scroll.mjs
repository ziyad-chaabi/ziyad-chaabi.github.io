// Vérifie les mécaniques de défilement que le harnais Scrollcraft ne voit pas :
// la caméra du Parcours avance avec le scroll et les coordonnées suivent, le clavier ramène un objet de la galerie
// dans le champ, et le visage de l'accueil reste à part de son nom et de son texte sur téléphone.
// Usage : node scripts/test-scroll.mjs   (site servi depuis les fichiers locaux, aucun serveur à lancer)
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert';

const ROOT = process.cwd() + '/', HOST = 'http://portfolio.test/';
const types = { html: 'text/html', js: 'application/javascript', css: 'text/css', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml' };
const b = await chromium.launch();
async function open(path, viewport = { width: 1440, height: 900 }) {
  const ctx = await b.newContext({ viewport });
  await ctx.addInitScript(() => sessionStorage.setItem('zc-seen', '1')); // pas de voile d'arrivée
  await ctx.route(HOST + '**', r => {
    const p = new URL(r.request().url()).pathname.slice(1) || 'index.html';
    r.fulfill(existsSync(ROOT + p) ? { body: readFileSync(ROOT + p), contentType: types[p.split('.').pop()] || 'application/octet-stream' } : { status: 404, body: '' });
  });
  const page = await ctx.newPage();
  await page.goto(HOST + path);
  await page.waitForSelector('html.sc-ready');
  await page.waitForTimeout(800);
  return page;
}

// Parcours : à mi-piste la caméra a quitté Troyes, la route est en partie tracée, les coordonnées ont changé
let page = await open('parcours.html');
const at = async f => { await page.evaluate(f => scrollTo(0, (document.querySelector('[data-sc-spacer]').offsetHeight - innerHeight) * f), f); await page.waitForTimeout(500);
  return page.evaluate(() => ({ cam: document.querySelector('.pc-world').dataset.scVerifyState, ll: document.querySelector('.pc-latlon').textContent, dash: document.querySelector('.pc-route-done').style.strokeDasharray })); };
const start = await at(0), mid = await at(.6);
assert.notEqual(start.cam, mid.cam, 'la caméra ne bouge pas');
assert.notEqual(start.ll, mid.ll, 'les coordonnées ne suivent pas');
assert.ok(parseFloat(mid.dash) > 0 && parseFloat(mid.dash) < 1, 'la route ne se trace pas : ' + mid.dash);

// Projets : un objet hors champ reçoit le focus clavier, il revient dans l'écran
page = await open('projets.html');
const box = await page.evaluate(async () => { const a = document.querySelectorAll('.gal-pic')[10]; a.focus(); await new Promise(r => setTimeout(r, 400)); const r = a.getBoundingClientRect(); return [r.left, r.right, innerWidth]; });
assert.ok(box[0] >= 0 && box[1] <= box[2], `objet focalisé hors champ : ${box}`);

// Accueil, téléphone : le nom ne passe pas sous le bloc de texte
page = await open('index.html', { width: 390, height: 844 });
const [name, copy] = await page.evaluate(() => ['.hh-name', '.hero-lede'].map(s => document.querySelector(s).getBoundingClientRect().toJSON()));
assert.ok(name.bottom <= copy.top, `le nom recouvre le texte : ${name.bottom} > ${copy.top}`);

// Labo : un galet ouvre sa fiche, Échap la ferme et rend le focus, le filtre éteint les autres domaines,
// la carotte apparaît dans la coupe et se remplit en descendant
page = await open('labo.html');
await page.click('.sp-btn[data-zone="xr"]');
const fiche = await page.evaluate(() => ({ open: !document.querySelector('.sample').hidden, title: document.querySelector('#sample-h')?.textContent }));
assert.ok(fiche.open && fiche.title, 'la fiche ne s’ouvre pas');
await page.keyboard.press('Escape');
assert.ok(await page.evaluate(() => document.querySelector('.sample').hidden && document.activeElement.classList.contains('sp-btn')), 'Échap ne ferme pas la fiche ou perd le focus');
await page.click('.lab-cols [data-z="web"]'); await page.waitForTimeout(800); // fin des fondus
await page.evaluate(() => document.querySelector('.sp[data-zone="web"]').scrollIntoView({ block: 'center' })); await page.waitForTimeout(900);
const dim = await page.evaluate(() => ['xr', 'web'].map(z => getComputedStyle(document.querySelector(`.sp[data-zone="${z}"]`)).opacity));
assert.ok(+dim[0] < .5 && +dim[1] === 1, `le filtre n’agit pas : ${dim}`);
const p0 = await page.evaluate(() => +getComputedStyle(document.querySelector('.core')).getPropertyValue('--p'));
await page.evaluate(() => scrollTo(0, document.querySelector('.st-rock').offsetTop - innerHeight / 2)); await page.waitForTimeout(400);
const core = await page.evaluate(() => ({ on: document.querySelector('.core').classList.contains('is-on'), p: +getComputedStyle(document.querySelector('.core')).getPropertyValue('--p'), seg: document.querySelectorAll('.core-fill > span').length }));
assert.ok(core.on && core.p > p0 + .5 && core.seg >= 5, `la carotte ne suit pas : ${JSON.stringify(core)}`);

await b.close();
console.log('ok : caméra du parcours, clavier dans la galerie, héros mobile, coupe du labo');
