# Portfolio de Ziyad Chaabi

Site statique hébergé par GitHub Pages : https://ziyad-chaabi.github.io/ (français) et https://ziyad-chaabi.github.io/en/ (anglais).
Aucun framework, aucune dépendance au build.

## Modifier le contenu

Tout le texte vit dans `js/data.js`. Un texte bilingue s'écrit `L('français', 'english')`. Après une modification :

```bash
node build.mjs
node scripts/check.mjs
```

`check.mjs` vérifie les liens, les ancres, les dimensions des images et la paire FR/EN de chaque page.

## Ce que génère build.mjs

| Page | FR | EN |
|---|---|---|
| Accueil | `index.html` | `en/index.html` |
| Études de cas (4) | `projets/<slug>.html` | `en/projects/<slug>.html` |
| À propos | `a-propos.html` | `en/about.html` |
| Archive | `archive.html` | `en/archive.html` |
| Veille | `veille.html` | `en/tech-watch.html` |

Plus `404.html`, `sitemap.xml` (avec `hreflang`), `llms.txt`, et une page de redirection pour chaque ancienne adresse
(`parcours.html`, `labo.html`, `competences.html`, `projets.html`, anciennes fiches de projets) : aucun lien extérieur ne casse.

## Images

- Captures des projets : `img/p/<slug>/`, dépôts synchronisés : `img/auto/<dépôt>/`.
- Œuvres libres de droits (CC0, Cleveland Museum of Art) : `img/art/`, décrites dans `data/art.json`. Les crédits de chaque page sont générés en pied de page.
- Les dimensions sont lues dans les fichiers au build (`scripts/img-size.mjs`) : rien à saisir à la main.

## Synchronisation automatique avec GitHub

Chaque dépôt public rejoint l'archive, avec ses captures (images du README, captures du dépôt, site en ligne, ou projet lancé en local et capturé avec Playwright).
Pour écrire sa description à la main, ajoutez-le dans `repos` de `js/data.js` (texte prioritaire sur le README).

- Automatique : `.github/workflows/sync.yml` tourne chaque jour à 5 h, régénère, vérifie et publie.
- En local :

```bash
npm install
node scripts/sync.mjs
node build.mjs
```

Options : `--force` (tout refaire), `--only=NomDuDepot`, `--no-run` (ne pas lancer les projets).

## Veille

La colonne « Tendances GitHub » vient de la vraie page GitHub Trending, relevée une fois par jour par `.github/workflows/veille.yml`
(`node scripts/veille.mjs` écrit `js/veille-data.js`). Les deux autres colonnes sont lues en direct par `js/veille.js`.

## Organisation

- `js/data.js` : le contenu écrit à la main, FR et EN · `data/auto.json` : les dépôts synchronisés · `data/art.json` : les œuvres
- `build.mjs` : les gabarits HTML · `scripts/check.mjs` : la vérification · `scripts/sync.mjs` : la synchronisation GitHub
- `css/style.css` : jetons, mise en page, mouvement (mode sombre et mouvement réduit compris)
- `js/relief.js` : le shader des courbes de niveau (hero, section des projets, études de cas) et la révélation du portrait
- `js/app.js` : défilement (Lenis), apparitions, fond papier → nuit, portrait, aperçus, boutons
- `js/vendor/lenis.min.js` : Lenis 1.3.26, hébergé avec le site (pas de CDN)
