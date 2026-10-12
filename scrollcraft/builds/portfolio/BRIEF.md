# BRIEF : portfolio de Ziyad Chaabi, passe Scrollcraft

Brief établi le 12 octobre 2026. Quatre décisions viennent de Ziyad (réponses
recueillies en début de session, citées telles quelles). Le reste est
**rédigé par Claude à partir du site existant**, de son contenu (`js/data.js`)
et de la critique précédente (`.impeccable/critique/`), et marqué comme tel.

Le site existe déjà : c'est une refonte, pas une création. Les huit questions
sont donc couvertes en partant de ce qu'il est.

## Les huit sujets

1. **Ambiance.** Réponse de Ziyad : « Garder Relief, ajouter la profondeur ».
   Papier de carte, encre, courbes de niveau, Archivo de 62 à 125 % de largeur,
   accent orange `#D2602A`. Références (rédigées) : une carte IGN au 1:25 000,
   un carnet de relevés de terrain, les génériques de Saul Bass pour
   l'échelle de la typo.
2. **Le parcours de lecture, section par section.** Réponse de Ziyad :
   « Une grammaire par page ». Chaque page a sa propre logique (voir le plan
   plus bas), le site entier forme le parcours : accueil, parcours, projets,
   fiche, compétences, veille, labo.
3. **La courbe d'énergie.** Rédigé : calme sur l'accueil (une carte qui
   respire), monte sur le parcours jusqu'au vol vers Valenciennes, retombe
   en régime de lecture sur les fiches et les compétences, vif sur la veille
   (ça bouge, ça se recharge).
4. **Ce qu'on doit ressentir, et le moment unique.** Réponse de Ziyad :
   « Le voyage du parcours ». Le moment : *la caméra survole la carte en
   relief, de Troyes à Valenciennes, et les étapes de sa vie apparaissent sur
   le terrain.*
5. **Ce que ce site fait et qu'aucun autre ne fait.** Rédigé : la carte est
   le site. Le visage sort du relief, la vie se parcourt en survolant la
   carte, chaque projet a sa propre carte, et lire une fiche y ajoute des
   courbes de niveau.
6. **Distance au premium-minimal.** Réponse de Ziyad : « Garder Relief,
   ajouter la profondeur ». On reste dans la famille actuelle (papier, encre,
   une couleur), on change la structure, le mouvement et la profondeur.
7. **Un seul monde ou des scènes distinctes ?** Réponse de Ziyad : « Une
   grammaire par page ». Des scènes distinctes à l'échelle du site, et un
   monde continu sur la page Parcours seulement, parce que c'est la seule
   page qui raconte un vrai déplacement géographique.
8. **Les visuels disponibles.** Les photos de Ziyad (`img/`), les captures de
   chaque projet (`img/p/`), cinq vidéos de projets (`media/`), le shader
   Relief et les modèles 3D procéduraux (`js/devices.js`). Pas de clé KIE :
   **aucun visuel généré**, tout vient de ce qui existe. C'est le bon choix
   pour un portfolio : un visuel inventé y serait un mensonge.

Éléments retirés à la demande de Ziyad (refusés par le skill) : le curseur
personnalisé, l'horloge « Troyes 23:08 » de l'en-tête, le voile d'encre à
chaque changement de page (gardé au premier chargement seulement).

## Ce que le visiteur doit croire en partant

*Ce développeur comprend un problème avant de coder, et il le montre dans
la façon même dont son site est construit.* (rédigé)

L'action suivante : **lui écrire** (pied de page, « Écrivons-nous. »),
libellé unique « Me contacter » dans la barre.

## La courbe de ressenti (site)

| Page | Ressenti | Ce qui le provoque à l'écran |
|---|---|---|
| Accueil | Curiosité | des courbes de niveau qui se plient en visage, son nom pris entre les plans |
| Parcours | Émerveillement (le pic) | le vol au-dessus du relief, la route qui se trace, les coordonnées qui défilent |
| Projets | Appétit | une galerie qu'on longe, chaque objet étiqueté comme au musée |
| Fiche projet | Confiance | un article en chapitres, des chiffres vrais, la carte du projet qui se complète |
| Compétences | Clarté | chaque outil relié par un fil aux projets où il a servi, puis la preuve prend toute la place |
| Veille | Vivacité | une surface qui se recharge seule, et qui finit en vous tendant son outil |

## Le pic

> « Tu scrolles et la caméra survole une carte en relief, de Troyes à Meaux
> puis jusqu'à Valenciennes, la route se dessine et les coordonnées défilent. »

Il vit sur la page Parcours, dans l'étape « Cap sur le métavers » : la plus
longue jambe de la page (2,2 hauteurs d'écran), précédée des trois petites
étapes troyennes, plus calmes et presque immobiles, qui servent de silence.

## La phrase à raconter

« C'est le site où tu survoles sa vie sur une carte en relief, de Troyes à
Valenciennes et retour. »

## Plan par page

### Accueil : affiche typographique, héros en couches

Courbe : curiosité (le visage sort du relief) → intimité (le visage retourne
dans la carte, une phrase à grande échelle) → appétit (les projets en lettres
capitales) → chaleur (hors de l'écran) → invitation (le labo, bande sombre) →
calme (la fin en petite typo).

Couches du héros : terrain (loin, le plus lent) / nom (derrière le visage) /
visage en courbes de niveau (sujet) / texte et boutons (devant, stables).

| Temps | Dispositif | Pourquoi |
|---|---|---|
| Héros | `pin` + couches pilotées par `--sc-p` | la profondeur vient du décalage entre plans |
| Bascule | `kinetic` (lignes) | une seule phrase, qui s'assemble pendant que le visage s'efface |
| Projets choisis | `flow` + `in` | des noms à l'échelle de l'affiche, rien d'autre |
| Hors de l'écran | `reveal` sur chaque mot | un mot qui se dévoile est un changement d'état |
| Le labo | `drift` vers la nuit | le fond passe au sombre, on change de lieu |
| Fin | `flow` | la plus petite typo du site, des liens soulignés |

Signature : **le visage émerge du relief puis y retourne sous la molette**,
et la loupe (clic maintenu) montre la vraie photo à travers les courbes.

### Parcours : monde continu (worldflight)

Une seule toile fixe : le relief WebGL, dont la caméra se déplace au scroll
entre les vraies coordonnées de chaque étape. Rien d'autre dans le flux que
l'espaceur. La navigation est une carte : la liste des étapes, cliquable.

Courbe : établissement (Troyes, vue large) → départ (Meaux, premier vol) →
retour au calme (trois étapes à Troyes, petites distances, zoom serré) →
**pic** (le grand vol vers Valenciennes) → retour (BTP-360) → arrivée
(« Et maintenant », le bouton est posé sur Troyes).

Silence volontaire : les étapes troyennes de 2022 et 2023 bougent peu. Ce
n'est pas du scroll mort, c'est l'avant du pic.

Signature : **la route se trace sur le relief et les coordonnées de la caméra
défilent en direct** (latitude et longitude calculées depuis sa position).

### Projets : galerie / catalogue

La collection commence en haut de la page. Un rail horizontal qu'on longe en
scrollant, quatorze objets avec la même étiquette (titre, année, cadre,
rôle, outils), un index qui saute à l'objet. La fin est une plaque
typographiée comme une étiquette : « Les autres dépôts, rangés au labo ».

Signature : **le sol du musée** : une bande de relief sous le rail défile
avec lui et prend la couleur de l'objet devant lequel on se trouve.

### Fiche projet : éditorial en chapitres

Pas de barre fixe : l'en-tête part avec la page, un folio dans la marge
indique le chapitre en cours. Page de titre sans image, l'objet 3D ouvre le
chapitre un, les médias ont leur colonne et leur légende, les vrais chiffres
comptent dans le texte. Fin : un colophon, les liens écrits dans la phrase.

Signature : **la carte du projet se complète pendant la lecture** : la
vignette en relief du folio gagne des courbes de niveau à chaque chapitre lu.

### Compétences : scène partagée

Deux colonnes en tension : les outils, et là où ils ont servi. Le séparateur
est le décor : il porte les deux libellés. Fin : l'effondrement, le
séparateur part sur le bord et la colonne des projets prend toute la largeur.

Signature : **des fils tirés de l'outil vers chaque projet** où il a servi.

### Veille : surface vivante

Pas de titre géant : une barre d'état (relevé, prochain rechargement avec
compte à rebours réel, nombre de nouveautés), des panneaux, des onglets.
Fin : un vrai champ de saisie qui interroge Hacker News et GitHub en direct.

Signature : **la page finit en vous tendant son propre outil de veille.**

### Labo

Déjà une surface vivante (carte 3D manipulable). Inchangé hors corrections
communes.

## Ce qui est volontairement hors du skill

- L'en-tête du site reste partagé (sauf sur les fiches, où il n'est plus
  fixe). Les grammaires « surface vivante » et « scène partagée » demandent
  normalement d'autres chromes ; on garde la navigation commune du site
  parce qu'un portfolio multipage a besoin d'un repère stable.
- Le pied de page commun suit l'espaceur du Parcours : c'est la seule chose
  qui glisse sur le monde, une fois l'arrivée atteinte.

## Vérification (12 octobre 2026)

Harnais Scrollcraft (`shoot.mjs`, Chrome installé, copie qui pose `zc-seen`
pour passer le voile d'arrivée) sur accueil, parcours, projets, compétences,
veille et BTP-360, en bureau 1440×900, téléphone 390×844 et mouvement réduit.

- Premier passage : défauts trouvés et corrigés. Accueil mobile (le texte
  recouvrait « Chaabi »), parcours (caméra immobile pendant la lecture, bloc
  final mesuré sous le pied de page), compétences (texte arrivé avant que la
  nuit ne couvre sa zone, contraste 1,05:1).
- Second passage : contraste au vert partout, aucun scroll mort sur
  l'accueil, la galerie et les compétences.
- Parcours : le harnais en mode worldflight ne lit que des vidéos et signale
  donc du scroll mort partout. Recalculé sur l'état réel de la caméra
  (`data-sc-verify-state` dans `report.json`) : aucun scroll mort.
- `scripts/test-scroll.mjs` : caméra et route du parcours, focus clavier dans
  la galerie, héros mobile sans recouvrement. `scripts/test-visiteurs.mjs`
  toujours vert.
- Non vérifié : un vrai téléphone (iOS, Low Power Mode), et le site sans WebGL
  au-delà du repli prévu en CSS.

## Écart de ressenti (passe à froid)

| Page | Prévu | Ressenti | Suite |
|---|---|---|---|
| Accueil | curiosité | curiosité, puis une attente sur la phrase | visage plus rapide (1,8 s), la phrase reste comme respiration |
| Parcours | émerveillement | émerveillement au grand vol, calme avant | conforme, le pic est bien la plus grande jambe |
| Projets | appétit | balade | conforme |
| Fiche | confiance | lecture posée | sur-titres « Chapitre n » retirés, le folio suffit |
| Compétences | clarté | clarté, puis satisfaction à l'effondrement | conforme |
| Veille | vivacité | vivacité | conforme |

## Refonte du Labo (13 octobre 2026)

*Brief rédigé sous délégation créative explicite* (« sois créatif, fais autre
chose de créatif mais en restant sur le même type de design du site »).

L'ancienne carte 3D sombre ne plaisait pas. Le Labo devient **une coupe de
terrain** : au lieu de survoler la carte (c'est déjà le Parcours), on la
tranche. Une couche par année, du plus récent en surface au plus ancien au
fond, une colonne par domaine, un galet en courbes de niveau par projet.
Même famille que le reste : papier, encre, une couleur par projet, Archivo.

- Grammaire (nouvelle) : **coupe stratigraphique**. Navigation = la carotte ;
  séquence = des couches en flux, coupes franches, motifs de carte géologique ;
  fin = le socle sombre qui rejoint le pied de page. Interdits : épinglage,
  vidéo, fond qui glisse d'une couleur à l'autre.
- Ressenti : curiosité (la surface et sa ligne de coupe) → découverte (les
  galets qui se posent couche après couche) → densité (2023, onze
  prélèvements dans le web) → ancrage (le socle, le bac à Troyes).
- Signature : **la carotte de forage**, qui se remplit des couches traversées,
  un point par galet, et sur laquelle on clique pour descendre.
- Vérifié : rendu bureau et téléphone en pleine page, fiche, Échap, filtre et
  carotte dans `scripts/test-scroll.mjs`.
