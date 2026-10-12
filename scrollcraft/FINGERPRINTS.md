# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| portfolio / accueil | Typographic poster | Barre fixe partagée du site (marque, 6 liens, « Me contacter ») | `pin` 2,3vh, plans pilotés par `--sc-p` : terrain / « Ziyad » / visage WebGL / « Chaabi » / texte | pin (2,3) > flow ×5 (rows, wipe, bande sombre), ~7vh | La plus petite typo de la page, deux liens soulignés dans une phrase | Le visage sort du relief puis y retourne sous la molette (loupe photo au clic maintenu) | Carte topo papier, shader Relief | 5174 |
| portfolio / parcours | Continuous world (worldflight sans vidéo) | Carte : rail d'étapes cliquable + coordonnées de la caméra en direct | Position d'établissement au-dessus de Troyes, titre dans le calque fixe | 8 jambes, 11,4vh + 1, la jambe Valenciennes (2,2) est le pic | Arrivée à Troyes, bouton posé dans le dernier bloc | La route se trace sur le relief, lat/long de la caméra défilent | Relief WebGL survolé (uCam, uZoom) | 5174 |
| portfolio / projets | Gallery / catalog | Index d'objets groupé Pro/Perso/École, saute à l'objet | Objet un déjà dans le champ, étiqueté, pas de titre | `pan` unique 9vh, 14 objets + plaque | Plaque typographiée comme une étiquette (« Les 19 autres dépôts ») | Le sol du musée : relief à 60 % de la vitesse du rail qui prend la couleur de l'objet au centre | Papier + relief au sol | 5174 |
| portfolio / fiche projet | Chaptered editorial | Pas de barre fixe : folio dans la marge (chapitre n sur N) | Page de titre typographique, aucune image | flow : titre > 5 à 8 chapitres sur fonds alternés (coupes franches) > colophon | Colophon en petite typo, liens écrits dans la phrase | La vignette relief du folio gagne des courbes à chaque chapitre lu | Papier / papier foncé alternés | 5174 |
| portfolio / compétences | Split stage | Le séparateur porte les deux libellés (outils / projets) | 50/50, deux titres lisibles d'emblée, papier / nuit | flow (split) > `pin` 1,9vh (effondrement) | L'effondrement : le séparateur part au bord, la nuit prend toute la largeur avec le bouton | Fils tirés de l'outil choisi vers chacun de ses projets | Papier contre nuit | 5174 |
| portfolio / veille | Live surface | Barre d'état collante (relevé, compte à rebours réel, nouveautés) + sélecteur de flux | La surface déjà chargée, aucun titre display | flow uniquement, panneaux | Un vrai champ de recherche (Hacker News + GitHub en direct) | La page finit en tendant son propre outil de veille | Panneaux sur papier | 5174 |
| portfolio / labo (coupe) | Coupe stratigraphique (nouvelle) | Carotte de forage fixe : se remplit des couches traversées, cliquable | Surface en relief tranchée par une ligne de coupe | flow : 5 couches (une par année) + socle, coupes franches | Le socle sombre (2021) qui rejoint le pied de page, liens dans la phrase | Galets en courbes de niveau qui respirent + carotte qui se remplit | Coupe géologique sur papier | 5174 |

Ce que les six partagent, à dessein : la barre du site (sauf la fiche) et le
pied de page « Écrivons-nous. ». Les six lignes diffèrent deux à deux sur au
moins quatre dimensions (grammaire, héros, séquence, fin, signature).

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

- Grammaires prises : affiche typographique, monde continu, galerie, éditorial en chapitres, scène partagée, surface vivante.
- Le monde continu **sans vidéo** (un shader survolé par une caméra) est pris.
- Le pic « survol d'une carte entre de vraies coordonnées » est pris.
- La coupe stratigraphique (une couche par année) et la carotte de forage sont prises.
- Les fins : liens dans une phrase, arrivée sur place, plaque-étiquette, colophon, effondrement, champ de recherche.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
