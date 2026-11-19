// Extrait les logos de la stack (Simple Icons, CC0) dans data/icons.json, lu par build.mjs.
// À relancer seulement quand on ajoute un outil avec un logo dans js/data.js :
//   npm i --no-save simple-icons && node scripts/icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import * as si from 'simple-icons';

const sb = { window: {} };
vm.runInNewContext(readFileSync('js/data.js', 'utf8'), sb);
const slugs = [...new Set(sb.window.ZC.skills.flatMap(g => g.items.map(i => i[3]).filter(Boolean)))].sort();
const out = {};
for (const s of slugs) {
  const icon = si['si' + s[0].toUpperCase() + s.slice(1)];
  if (!icon) throw new Error(`logo introuvable dans Simple Icons : ${s}`);
  out[s] = icon.path;
}
writeFileSync('data/icons.json', JSON.stringify(out, null, 1) + '\n');
console.log(`${slugs.length} logos écrits dans data/icons.json`);
