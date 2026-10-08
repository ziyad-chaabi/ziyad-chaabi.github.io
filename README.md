# Portfolio de Ziyad Chaabi

Site statique hébergé par GitHub Pages : https://ziyad-chaabi.github.io/
Il marche aussi ouvert en double-clic sur `index.html`.

## Modifier le contenu

Le texte des projets, du parcours et des compétences vit dans `js/data.js`. Après une modification :

```bash
node build.mjs
```

## Synchronisation automatique avec GitHub

Chaque dépôt public devient un sommet du labo et une page légère reliée au labo (« Projets » ne garde que les projets racontés à la main).
Les visuels sont cherchés dans cet ordre : images du README, captures rangées dans le dépôt,
site en ligne (homepage ou GitHub Pages), puis le projet est cloné, lancé en local (site statique,
Node ou PHP) et capturé avec Playwright. Les pages d'erreur et les écrans vides sont écartés ;
sans visuel, une couverture en relief est générée.

- Automatique : la GitHub Action `.github/workflows/sync.yml` tourne chaque jour à 5 h et publie le résultat.
- À la demande : onglet Actions du dépôt, « Synchroniser les projets GitHub », Run workflow.
- En local :

```bash
npm install
node scripts/sync.mjs
node build.mjs
```

Options : `--force` (tout refaire), `--only=NomDuDepot`, `--no-run` (ne pas lancer les projets).
Pour écrire une description à la main pour un dépôt, ajoutez-le dans `repos` de `js/data.js`.

## Veille

La colonne « Tendances GitHub de la semaine » vient de la vraie page GitHub Trending, qui n'a pas d'API :
`.github/workflows/veille.yml` la relève toutes les 3 h avec `node scripts/veille.mjs` et publie `js/veille-data.js`.
Les deux autres colonnes (dépôts IA, Hacker News) sont lues en direct, et la page se recharge seule toutes les 5 minutes.

## Photos des recommandations

Déposez `img/avis/juliana-rebelo.webp` et `img/avis/karima-ghezza.webp`, puis `node build.mjs` :
les initiales sont remplacées par les photos.

## Organisation

- `js/data.js` : le contenu écrit à la main · `data/auto.json` : les dépôts synchronisés
- `build.mjs` : les gabarits HTML · `scripts/sync.mjs` : la synchronisation GitHub
- `css/style.css` : le système visuel « Relief »
- `js/relief.js` : le shader des courbes de niveau (fonds, couvertures, transitions)
- `js/devices.js` : les modèles 3D (Meta Quest 3, téléphone, ordinateur) et leur mise en scène
- `js/app.js` : défilement doux, chargement, transitions, curseur, apparitions
- `js/pages/*.js` : ce qui est propre à une page (labo 3D, chronologie, veille…)
