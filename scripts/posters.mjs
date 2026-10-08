// Génère l'affiche d'un projet (relief + modèle 3D + titre) dans img/p/<slug>/cover.jpg.
// Usage : serveur local sur le port 5173 (python -m http.server 5173), puis
//   node scripts/posters.mjs hotel-murder-vr:dark lolop:dark turaty-naturels
// Ensuite, ajouter cover: 'img/p/<slug>/cover.jpg' au projet dans js/data.js et lancer node build.mjs.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' });
for (const arg of process.argv.slice(2)) {
  const [slug, dark] = arg.split(':');
  await p.goto(`http://localhost:5173/scripts/poster.html?slug=${slug}&dark=${dark === 'dark' ? 1 : 0}`);
  await p.waitForTimeout(6000);
  mkdirSync(`img/p/${slug}`, { recursive: true });
  await p.screenshot({ path: `img/p/${slug}/cover.jpg`, type: 'jpeg', quality: 82 });
  console.log('affiche :', slug);
}
await b.close();
