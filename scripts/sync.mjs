// Synchronise le portfolio avec GitHub : chaque dépôt public devient un sommet du labo et une page projet,
// avec des visuels trouvés automatiquement. Résultat : data/auto.json + img/auto/<dépôt>/*.jpg
//
//   node scripts/sync.mjs            synchronise tout ce qui a changé depuis la dernière fois
//   node scripts/sync.mjs --force    refait tout
//   node scripts/sync.mjs --no-run   ne lance pas les projets en local (plus rapide)
//
// Ordre de recherche des visuels, on s'arrête dès qu'on en a :
//   1. images du README   2. captures rangées dans le dépôt   3. site en ligne (homepage ou GitHub Pages)
//   4. projet lancé en local (site statique, Node ou PHP) puis capturé avec Playwright
// Sans visuel, le site dessine une couverture en relief générée à partir du nom du dépôt.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync, createReadStream } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { spawn, execSync } from 'node:child_process';
import http from 'node:http';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const USER = 'Subdij';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force'), RUN = !args.has('--no-run');
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const MAX_IMG = 4;
const headers = { 'User-Agent': 'portfolio-sync', Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
const log = (...a) => console.log('·', ...a);

const sandbox = { window: {} };
vm.runInNewContext(readFileSync(join(ROOT, 'js/data.js'), 'utf8'), sandbox);
const { skipRepos } = sandbox.window.ZC;
const autoFile = join(ROOT, 'data/auto.json');
const previous = existsSync(autoFile) ? JSON.parse(readFileSync(autoFile, 'utf8')) : [];

const gh = async (path, raw = false) => {
  const r = await fetch(`https://api.github.com${path}`, { headers: raw ? { ...headers, Accept: 'application/vnd.github.raw' } : headers });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return raw ? r.text() : r.json();
};
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- visuels ----------
const BADGE = /shields\.io|badge|badgen|github-readme-stats|komarev|visitor|skillicons|readme-typing|\.svg(\?|$)|user-images\.githubusercontent\.com\/73097560/i;
function readmeImages(md, repo, branch) {
  const urls = [...md.matchAll(/!\[[^\]]*]\(([^)\s]+)/g), ...md.matchAll(/<img[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
  return [...new Set(urls)].filter(u => !BADGE.test(u)).map(u => (/^https?:/.test(u) ? u : `https://raw.githubusercontent.com/${USER}/${repo}/${branch}/${u.replace(/^\.?\//, '')}`));
}
async function download(url, file) {
  try {
    const r = await fetch(url, { redirect: 'follow' });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !/image\/(png|jpe?g|webp|gif)/.test(type)) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 15e3 || buf.length > 6e6) return false; // trop petit = icône, trop gros = inutile
    writeFileSync(file, buf);
    return true;
  } catch { return false; }
}

let browser;
// pages qu'on ne veut pas montrer : erreurs serveur, var_dump PHP, pages 404 de serveurs de dev
const ERROR_PAGE = /Fatal error|Uncaught|Warning: |Parse error|Cannot GET|ECONNREFUSED|Internal Server Error|404 Not Found|Application error|Error: |Exception Object|SQLSTATE|\[message:protected\]|(?:array|string|object)\(\d+\)/;
const LOADING = /^(chargement|loading)|en cours\W*$/i;
// écran presque d'une seule couleur (noir, blanc…) : on mesure l'écart-type dans un canvas
async function isFlat(buf, min = 14) {
  const page = await browser.newPage();
  const sd = await page.evaluate(async src => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = 96; c.height = 60;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, 96, 60);
    const d = x.getImageData(0, 0, 96, 60).data; let s = 0, s2 = 0, n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; s += l; s2 += l * l; }
    return Math.sqrt(s2 / n - (s / n) ** 2);
  }, 'data:image/jpeg;base64,' + buf.toString('base64'));
  await page.close();
  return sd < min;
}
async function shoot(url, dir, prefix) {
  if (!browser) {
    const pw = await import('playwright').catch(() => null);
    if (!pw) { log('playwright absent : pas de captures (npm i playwright)'); return []; }
    browser = await pw.chromium.launch();
  }
  const out = [];
  for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: tag === 'mobile' ? 2 : 1 });
    try {
      const r = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      if (!r || r.status() >= 400) { await page.close(); return out; }
      await page.waitForTimeout(1500);
      let text = (await page.evaluate(() => document.body?.innerText || '')).trim();
      // écran de chargement : on laisse le temps à l'appli de démarrer
      for (let i = 0; i < 6 && (LOADING.test(text) || text.length < 40); i++) { await page.waitForTimeout(2000); text = (await page.evaluate(() => document.body?.innerText || '')).trim(); }
      if (LOADING.test(text)) { log('toujours en chargement, ignoré', url); await page.close(); return out; }
      if (text.length < 20 && !(await page.$('canvas, img'))) { await page.close(); return out; } // page vide
      if (ERROR_PAGE.test(text)) { log('page d’erreur ignorée', url); await page.close(); return out; }
      const file = join(dir, `${prefix}-${tag}.jpg`);
      const buf = await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
      // peu de texte : il faut un vrai visuel, pas un écran d'attente
      if (await isFlat(buf, text.length < 40 ? 30 : 14)) { rmSync(file, { force: true }); log('écran uniforme ignoré', url, tag); }
      else out.push(file);
    } catch (e) { log('capture impossible', url, e.message.split('\n')[0]); }
    await page.close();
  }
  return out;
}

// petit serveur statique pour les projets HTML/CSS/JS
function serveStatic(dir, port) {
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4', '.wasm': 'application/wasm', '.data': 'application/octet-stream', '.gz': 'application/gzip', '.br': 'application/octet-stream' };
  const srv = http.createServer((req, res) => {
    let p = join(dir, decodeURIComponent(req.url.split('?')[0]));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[extname(p).toLowerCase()] || 'application/octet-stream' });
    createReadStream(p).pipe(res);
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r(srv)));
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const portOpen = async p => { try { await fetch(`http://127.0.0.1:${p}/`, { signal: AbortSignal.timeout(1500) }); return true; } catch { return false; } };
async function waitForPort(ports, ms, busy = new Set()) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    for (const p of [...ports]) { if (busy.has(p)) continue; try { const r = await fetch(`http://127.0.0.1:${p}/`); if (r.status < 500) return p; } catch {} }
    await wait(1500);
  }
  return null;
}
const killTree = child => { try { process.platform === 'win32' ? execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' }) : process.kill(-child.pid, 'SIGKILL'); } catch {} };

async function runLocally(repo, dir, cloneUrl) {
  const work = join(ROOT, '.cache/repos', repo);
  rmSync(work, { recursive: true, force: true }); mkdirSync(dirname(work), { recursive: true });
  try { execSync(`git clone --depth 1 ${cloneUrl} "${work}"`, { stdio: 'ignore', timeout: 120000 }); } catch { return []; }
  const has = f => existsSync(join(work, f));
  const pkg = has('package.json') ? JSON.parse(readFileSync(join(work, 'package.json'), 'utf8')) : null;
  const script = pkg?.scripts && (pkg.scripts.dev ? 'dev' : pkg.scripts.start ? 'start' : null);
  // 1. projet Node avec un script de lancement
  if (script) {
    log(repo, ': npm install puis npm run', script);
    try { execSync('npm install --no-audit --no-fund --loglevel=error', { cwd: work, stdio: 'ignore', timeout: 360000 }); } catch { log(repo, ': npm install a échoué'); }
    const COMMON = [3000, 5173, 8080, 4200, 8000, 5000];
    const busy = new Set(); for (const p of COMMON) if (await portOpen(p)) busy.add(p); // déjà pris par autre chose
    const ports = new Set([4321]);
    const child = spawn(`npm run ${script}`, { cwd: work, env: { ...process.env, PORT: '4321', BROWSER: 'none', CI: '1' }, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'], shell: true });
    const sniff = d => { for (const m of String(d).matchAll(/(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{2,5})/g)) ports.add(+m[1]); };
    child.stdout.on('data', sniff); child.stderr.on('data', sniff);
    const port = await waitForPort(ports, 120000, busy);
    const shots = port ? await shoot(`http://127.0.0.1:${port}/`, dir, 'local') : [];
    killTree(child);
    return shots;
  }
  // 2. site statique
  const root = ['', 'public', 'dist', 'docs', 'site', 'build'].find(d => has(join(d, 'index.html')));
  if (root !== undefined) {
    const srv = await serveStatic(join(work, root), 4323);
    const shots = await shoot('http://127.0.0.1:4323/', dir, 'local');
    srv.close();
    return shots;
  }
  // 3. PHP
  const phpRoot = ['', 'public', 'site', 'public_html'].find(d => has(join(d, 'index.php')));
  if (phpRoot !== undefined) {
    try { execSync('php -v', { stdio: 'ignore' }); } catch { return []; }
    const child = spawn('php', ['-S', '127.0.0.1:4324', '-t', join(work, phpRoot)], { detached: process.platform !== 'win32', stdio: 'ignore' });
    const shots = (await waitForPort([4324], 15000)) ? await shoot('http://127.0.0.1:4324/', dir, 'local') : [];
    killTree(child);
    return shots;
  }
  return []; // Unity, Android… : pas lançable sans leurs outils, on garde la couverture générée
}

// ---------- texte ----------
const stripMd = s => s.replace(/<[^>]+>/g, ' ').replace(/!\[[^\]]*]\([^)]*\)/g, '').replace(/\[([^\]]+)]\([^)]*\)/g, '$1').replace(/[*_`>#]/g, '').replace(/\s+/g, ' ').trim();
function readmeText(md) {
  const blocks = md.replace(/```[\s\S]*?```/g, '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  const paras = blocks.filter(b => !/^(#|\||!\[|<|[-*] |\d+\. )/.test(b)).map(stripMd).filter(t => t.length > 40);
  const bullets = blocks.filter(b => /^[-*] /.test(b)).flatMap(b => b.split('\n').filter(l => /^\s*[-*] /.test(l)).map(stripMd)).filter(t => t.length > 3 && t.length < 160);
  return { paras: paras.slice(0, 3), bullets: bullets.slice(0, 8) };
}
const zoneOf = (lang, topics) => {
  if (topics.some(t => /game|jeu/.test(t))) return 'jeux';
  return { 'C#': 'xr', ShaderLab: 'xr', HLSL: 'xr', Java: 'mobile', Kotlin: 'mobile', Swift: 'mobile', Dart: 'mobile', Python: 'data', 'Jupyter Notebook': 'data', R: 'data' }[lang] || 'web';
};

// ---------- boucle principale ----------
const repos = (await gh(`/users/${USER}/repos?per_page=100&sort=pushed`)).filter(r => !r.fork && !r.private && !skipRepos.includes(r.name));
log(repos.length, 'dépôts publics');
const result = [];
for (const r of repos) {
  const prev = previous.find(p => p.repo === r.name);
  const redo = FORCE || ONLY.includes(r.name);
  if (prev && ((prev.pushed === r.pushed_at && !redo) || (ONLY.length && !ONLY.includes(r.name)))) { result.push({ ...prev, stars: r.stargazers_count }); continue; }
  log('→', r.name);
  const slug = slugify(r.name);
  const dir = join(ROOT, 'img/auto', slug);
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const md = await gh(`/repos/${USER}/${r.name}/readme`, true).catch(() => '');
  const langs = await gh(`/repos/${USER}/${r.name}/languages`).catch(() => ({}));
  const images = [];
  let source = '';
  // 1. README
  for (const url of readmeImages(md, r.name, r.default_branch)) {
    if (images.length >= MAX_IMG) break;
    const file = join(dir, `readme-${images.length + 1}${(extname(url.split('?')[0]) || '.png').toLowerCase()}`);
    if (await download(url, file)) images.push(file);
  }
  if (images.length) source = 'README';
  // 2. captures rangées dans le dépôt
  if (!images.length) {
    const tree = await gh(`/repos/${USER}/${r.name}/git/trees/${r.default_branch}?recursive=1`).catch(() => ({ tree: [] }));
    const shots = (tree.tree || []).map(t => t.path).filter(p => /(screen|capture|preview|demo|mockup|apercu)[^/]*\.(png|jpe?g|webp|gif)$/i.test(p) && !/node_modules|Library\/|Packages\/|examples?\/|vendor\/|uploads\/|three\.js\/|lib\/|third.?party/i.test(p));
    for (const p of shots.slice(0, MAX_IMG)) {
      const file = join(dir, `repo-${images.length + 1}${extname(p).toLowerCase()}`);
      if (await download(`https://raw.githubusercontent.com/${USER}/${r.name}/${r.default_branch}/${p}`, file)) images.push(file);
    }
    if (images.length) source = 'dépôt';
  }
  // 3. site en ligne
  const live = r.homepage || (r.has_pages ? `https://${USER.toLowerCase()}.github.io/${r.name}/` : '');
  if (!images.length && live) { images.push(...await shoot(live, dir, 'live')); if (images.length) source = 'site en ligne'; }
  // 4. lancé en local
  if (!images.length && RUN) { images.push(...await runLocally(r.name, dir, r.clone_url)); if (images.length) source = 'lancé en local'; }
  log('  ', images.length ? `${images.length} visuel(s), source : ${source}` : 'aucun visuel, couverture générée');
  const lang = Object.keys(langs)[0] || r.language || '';
  const { paras, bullets } = readmeText(md);
  result.push({
    repo: r.name, slug, title: r.name.replace(/[-_]+/g, ' '), description: r.description || paras[0] || '',
    paras, bullets, stack: Object.keys(langs).slice(0, 6), topics: r.topics || [], zone: zoneOf(lang, r.topics || []),
    stars: r.stargazers_count, created: r.created_at, pushed: r.pushed_at, year: r.created_at.slice(0, 4),
    url: r.html_url, live, source, images: images.map(f => f.slice(ROOT.length).replace(/\\/g, '/').replace(/^\//, '')),
  });
}
await browser?.close();
mkdirSync(join(ROOT, 'data'), { recursive: true });
writeFileSync(autoFile, JSON.stringify(result, null, 2) + '\n');
log('data/auto.json écrit :', result.length, 'dépôts. Lancez maintenant : node build.mjs');
