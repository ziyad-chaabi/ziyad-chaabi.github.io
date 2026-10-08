// Source unique du contenu : lue par build.mjs (pages statiques) et par le navigateur (labo, covers).
// Script classique (pas de module ES) pour que le site marche aussi ouvert en double-clic (file://).
// Pour ajouter un projet : complète `projects`, puis lance `node build.mjs`.

const site = {
  name: 'Ziyad Chaabi',
  url: 'https://ziyad-chaabi.github.io/',
  email: 'ziyadou2011@hotmail.fr',
  github: 'https://github.com/Subdij',
  linkedin: 'https://www.linkedin.com/in/ziyad-chaabi/',
  instagram: 'https://www.instagram.com/ziyad_chb/',
};

// Couleurs des reliefs (une par projet), tirées des cartes topographiques.
const C = { orange: '#D2602A', eau: '#2F5BEA', foret: '#4F7F45', ocre: '#B8892A', prune: '#7E4A78', lagon: '#1F8A8A', brique: '#A8402E', ardoise: '#46546E' };

const projects = [
  {
    slug: 'btp-360', device: 'duo', screen: 'img/p/btp-360/1.webp', screenM: 'img/p/btp-360/m2.webp', title: 'BTP-360', color: C.orange, relief: { peaks: 4, rough: .55 },
    kicker: "L'application qui a remplacé les fichiers Excel de quatre entreprises du BTP.",
    kind: 'pro', context: 'Stage de fin d’études', org: 'Groupe Sûr France, Troyes', year: '2026', period: 'Mars à septembre 2026',
    team: 'Seul, avec la direction et les équipes terrain', role: 'Conception, développement, mise en production',
    stack: ['Ionic 8', 'Angular 20', 'NgRx', 'Capacitor', 'NestJS 11', 'Prisma 7', 'PostgreSQL 16', 'Socket.IO', 'Docker', 'Terraform', 'AWS', 'GitHub Actions', 'Playwright', 'Sentry'],
    links: [], privateNote: 'Code privé, propriété du groupe.',
    intro: "Le Groupe Sûr France réunit quatre sociétés : Iso, Climat, Réseau et Distri. Recrutement, contrats, matériel, notes de frais, planning : tout passait par des fichiers Excel envoyés par mail. J'avais sept mois pour les remplacer par un seul outil, utilisable au bureau comme sur un chantier sans réseau.",
    stats: [['4', 'sociétés dans une seule application'], ['47', 'modèles de données'], ['255', 'fichiers de tests unitaires'], ['54', 'suites de tests de bout en bout']],
    sections: [
      { title: 'Le point de départ', body: ["Les chefs d'équipe pointaient sur papier, les contrats étaient recopiés depuis un modèle Word, et personne ne savait vraiment quel outil se trouvait sur quel chantier.", "Le vrai sujet n'était pas technique. Pour être adoptée, l'application devait être plus rapide qu'Excel, et utilisable avec des gants, en plein soleil, dans une cave sans 4G."] },
      { title: 'Ce que j’ai construit', list: [
        ['RH et contrats', 'Contrats générés en PDF et DOCX à partir de modèles (convention collective, grille de classification BTP), dossiers salariés, absences validées en deux temps, habilitations avec alerte avant expiration.'],
        ['Terrain', 'Pointage géolocalisé à l’entrée et à la sortie du chantier, un QR code par outil, bons de remise signés à l’écran.'],
        ['Finance', 'Notes de frais lues par OCR directement sur le téléphone, même hors ligne, et demandes d’achat validées par la direction.'],
        ['Chantiers', 'Planning au jour, à la semaine ou au mois, et gestion documentaire rangée par société et par chantier.'],
      ] },
      { title: 'Les choix techniques', body: ["Hors ligne d'abord : chaque action faite sur le terrain est gardée dans une file NgRx, puis rejouée au retour du réseau. L'application est livrée sur Android avec Capacitor, ou installable en PWA.", "Une seule base PostgreSQL, cloisonnée par société, cinq rôles, un journal d'audit et des données sensibles (numéro de sécurité sociale, salaire) chiffrées au repos. Les validations remontent en temps réel avec Socket.IO."] },
      { title: 'La mise en production', body: ["Docker Compose sur EC2 en région Paris, infrastructure décrite en Terraform, intégration et déploiement continus avec GitHub Actions, sauvegardes PostgreSQL scriptées, erreurs suivies dans Sentry."] },
      { title: 'Coder avec des agents IA', body: ["J'ai développé avec Claude Code et Codex, encadrés par des règles projet écrites (AGENTS.md, CLAUDE.md), des serveurs MCP et une relecture de chaque changement. Les 255 fichiers de tests et les 54 suites Playwright servent de filet : l'agent propose, les tests et moi décidons."] },
      { title: 'Ce que j’en retiens', body: ["Seul sur un projet de cette taille, on est obligé de tout écrire : la documentation, les décisions, les tests. C'est ce qui m'a permis d'aller vite sans casser ce qui marchait déjà."] },
    ],
    figures: [
      { type: 'img', src: 'img/p/btp-360/2.webp', alt: 'Validation des congés et absences dans BTP-360', caption: 'Validation des absences, au bureau (données de test)', wide: true },
      { type: 'phones', srcs: ['img/p/btp-360/m1.webp', 'img/p/btp-360/m4.webp', 'img/p/btp-360/m3.webp'], caption: 'Sur le terrain : planning, fiche chantier géolocalisée, demande de congé (données de test)' },
      { type: 'diagram', caption: 'Architecture de BTP-360', layers: [
        ['Sur le terrain', ['Application Android', 'PWA au bureau', 'File hors ligne']],
        ['Client', ['Ionic 8 + Angular 20', 'NgRx', 'Capacitor', 'Tesseract.js (OCR)']],
        ['API', ['NestJS 11', 'Socket.IO', 'JWT + 5 rôles', 'Swagger']],
        ['Données', ['PostgreSQL 16', 'Prisma 7', 'Fichiers chiffrés']],
        ['Infrastructure', ['AWS EC2 + S3', 'Docker', 'Terraform', 'GitHub Actions', 'Sentry']],
      ] },
    ],
  },
  {
    slug: 'subforge', device: 'phone', screenM: 'img/p/subforge/m1.webp', title: 'SubForge', color: C.eau, relief: { peaks: 2, rough: .35 },
    kicker: "Un coach nutrition où l'on décrit son repas en une phrase. L'IA propose, la personne décide.",
    kind: 'perso', context: 'Projet personnel', org: 'Application mobile', year: '2026', period: 'Depuis août 2026',
    team: 'Seul', role: 'Produit, design, développement',
    stack: ['React Native', 'Expo', 'TypeScript', 'Supabase', 'Edge Functions', 'Gemini 2.5 Flash', 'Jest', 'Sentry', 'PostHog', 'EAS'],
    links: [], privateNote: 'Code privé, projet en cours.',
    intro: "Je reprenais la musculation avec un objectif de prise de masse, et je savais déjà où j'allais lâcher : l'alimentation. Chaque fois que j'avais essayé de suivre mes repas, j'avais abandonné au bout d'une semaine, parce que la saisie était trop lente. SubForge part de là : si noter un repas prend plus de temps que de le manger, personne ne le fera.",
    sections: [
      { title: 'L’idée', body: ["On dicte ou on tape « deux œufs, une tartine beurrée et un café ». Le modèle en extrait les aliments, les quantités et les macros dans un JSON contraint par un schéma, jamais dans du texte libre qu'il faudrait relire.", "La personne voit la proposition, corrige si besoin, puis valide. Rien n'est enregistré sans son accord."] },
      { title: 'Quand l’IA ne répond pas', body: ["Le plan de la journée est généré par l'IA : c'est lent, et ça peut échouer. Au-delà de 15 secondes, un plan de repli calculé sans IA prend le relais, à partir de repas prédéfinis filtrés selon les contraintes (halal, budget, temps de préparation). Une erreur à cet instant aurait gâché la première impression."] },
      { title: 'Sous le capot', body: ["Les besoins caloriques sont calculés sur le téléphone, sans réseau. Les appels à Gemini passent par des Edge Functions Supabase : la clé reste côté serveur, avec un cache et une limite de requêtes.", "Les contraintes strictes, comme les allergies, sont vérifiées deux fois : dans la consigne envoyée au modèle, puis sur sa réponse. Les données sont protégées par des règles RLS, et l'application continue de fonctionner hors ligne."] },
      { title: 'Où en est le projet', body: ["Le MVP se construit en APK et AAB avec EAS, testé avec Jest et suivi avec Sentry et PostHog. Je suis son premier utilisateur : s'il ne me fait pas gagner de temps, il ne mérite pas d'exister."] },
    ],
    figures: [
      { type: 'phones', srcs: ['img/p/subforge/m2.webp', 'img/p/subforge/m3.webp', 'img/p/subforge/m4.webp'], caption: 'L’accueil : objectif, morphologie, activité' },
      { type: 'phones', srcs: ['img/p/subforge/m5.webp', 'img/p/subforge/m6.webp', 'img/p/subforge/m7.webp'], caption: 'Contraintes alimentaires, préférences, historique' },
      { type: 'diagram', caption: 'Le chemin d’une phrase', layers: [
        ['Téléphone', ['Voix ou texte', 'Calcul des besoins en local', 'File hors ligne']],
        ['Edge Functions', ['Clé API protégée', 'Cache', 'Limite de requêtes']],
        ['IA', ['Gemini 2.5 Flash', 'Sortie JSON contrainte', 'Plan de repli sans IA']],
        ['Données', ['Supabase Postgres', 'Auth', 'RLS']],
      ] },
    ],
  },
  {
    slug: 'funfair-vr', device: 'quest', title: 'Funfair VR', color: C.ocre, relief: { peaks: 5, rough: .45 },
    kicker: 'Une fête foraine médiévale en réalité virtuelle, avec cinq attractions.',
    kind: 'ecole', context: 'Master Sciences et Technologies du Métavers', org: 'INSA Hauts-de-France', year: '2025', period: '2025',
    team: 'Projet de Master', role: 'Développement Unity, interactions VR',
    stack: ['Unity 2022.3', 'C#', 'URP', 'XR Interaction Toolkit', 'OpenXR', 'Meta Quest'],
    links: [['Voir le code', 'https://github.com/Subdij/Project_VR']],
    intro: "En réalité virtuelle, si la personne doit lire une consigne, c'est déjà raté. Le défi de Funfair VR : qu'on comprenne chaque jeu dès qu'on le prend en main, sans tutoriel.",
    sections: [
      { title: 'Cinq attractions', list: [
        ['Chamboule-tout', 'Renverser des piles de conserves avec des balles.'],
        ['Fruit Ninja médiéval', 'Découper des fruits au vol à l’épée, en évitant les bombes.'],
        ['Dunk tank', 'Viser la cible pour faire tomber le personnage dans l’eau.'],
        ['Stand de tir', 'Toucher des cibles mobiles pour marquer un maximum de points.'],
        ['Punching-ball', 'Frapper le plus fort possible.'],
      ] },
      { title: 'Le plus difficile', body: ["La découpe des fruits en temps réel avec EzySlice : couper un maillage à la volée, sans faire chuter la fréquence d'images du casque. Et la physique des lancers, qui doit paraître juste même quand on lance mal."] },
      { title: 'La technique', body: ["Unity 2022.3 avec l'Universal Render Pipeline pour tenir la cadence en VR, XR Interaction Toolkit et OpenXR. Un hub central relie les cinq attractions, avec une navigation pensée pour ne pas donner mal au cœur."] },
    ],
    figures: [{ type: 'img', src: 'img/ziyad-vr.webp', alt: 'Ziyad Chaabi présente un projet de réalité virtuelle, un Meta Quest 3 posé sur le bureau', caption: 'En présentation à l’INSA, avec le Meta Quest 3', wide: true }],
  },
  {
    slug: 'hotel-murder-vr', device: 'hotel', cover: 'img/p/hotel-murder-vr/cover.jpg', title: 'Hotel Murder VR', color: C.prune, relief: { peaks: 3, rough: .7 },
    kicker: "Un escape game d'enquête en VR, dans un hôtel où quelqu'un vient d'être tué.",
    kind: 'ecole', context: 'Master Sciences et Technologies du Métavers', org: 'INSA Hauts-de-France', year: '2026', period: '2026',
    team: 'Équipe de 3', role: 'Développement Unity, énigmes et interactions',
    stack: ['Unity 6', 'C#', 'XR Interaction Toolkit 3', 'Audio spatialisé'],
    links: [['Voir le code', 'https://github.com/Subdij/Hotel-Murder-Escape-game_VR']],
    intro: "On arrive dans un hôtel, quelqu'un est mort, et il faut comprendre ce qui s'est passé. Pas de flèche à l'écran : ce sont les objets, les sons et les portes qui guident l'enquête.",
    sections: [
      { title: 'Les énigmes', list: [
        ['Le levier', 'Un mécanisme physique monté sur une charnière (HingeJoint) qu’il faut vraiment tirer.'],
        ['Le digicode', 'Un code à retrouver dans la pièce pour ouvrir la suite.'],
        ['La fouille', 'Des objets à prendre, retourner, ouvrir.'],
        ['La fin', 'Une cinématique qui révèle le coupable.'],
      ] },
      { title: 'Le son comme guide', body: ["L'audio 3D oriente sans rien afficher : un bruit derrière une porte, une radio dans la pièce d'à côté. En VR, on tourne naturellement la tête vers ce qu'on entend."] },
    ],
    figures: [],
  },
  {
    slug: 'lolop', device: 'lanes', cover: 'img/p/lolop/cover.jpg', title: 'lolop', color: C.lagon, relief: { peaks: 3, rough: .4 },
    kicker: 'Le compagnon League of Legends que je voulais avoir dans la poche.',
    kind: 'perso', context: 'Projet personnel', org: 'Application Android', year: '2025', period: 'Fin 2025',
    team: 'Seul', role: 'Conception et développement',
    stack: ['Java', 'Android', 'MVVM', 'Retrofit', 'SQLite', 'WorkManager'],
    links: [['Voir le code', 'https://github.com/Subdij/lolop']],
    intro: "Champions, objets, notes de patch et favoris, dans une application qui marche aussi dans le train, sans réseau.",
    sections: [
      { title: 'Ce qu’on y trouve', list: [
        ['Champions', 'Recherche animée, statistiques, histoire, conseils pour jouer avec ou contre, sorts et passifs.'],
        ['Objets', 'Le catalogue complet, filtrable par catégorie.'],
        ['Notes de patch', 'Les dernières mises à jour, lisibles dans l’application.'],
        ['Favoris', 'Ses champions épinglés, retrouvés en un geste.'],
      ] },
      { title: 'L’architecture', body: ["MVVM avec un Repository qui choisit entre le réseau et le cache. Les données viennent de l'API de Riot via Retrofit et sont gardées dans SQLite. WorkManager rafraîchit tout en arrière-plan, et l'interface existe en français et en anglais."] },
    ],
    figures: [],
  },
  {
    slug: 'turaty-naturels', device: 'apothecary', cover: 'img/p/turaty-naturels/cover.jpg', title: 'Turaty Naturels', color: C.foret, relief: { peaks: 2, rough: .3 },
    kicker: 'Une boutique de cosmétiques bio, du catalogue jusqu’à la facture.',
    kind: 'perso', context: 'Projet personnel', org: 'E-commerce', year: '2025', period: 'Été 2025',
    team: 'Seul', role: 'Conception et développement',
    stack: ['Symfony 6', 'Doctrine', 'MySQL 8', 'Twig', 'Tailwind', 'Stripe', 'PayPal', 'Docker'],
    links: [], privateNote: 'Code privé.',
    intro: "Une boutique en ligne pour une marque de cosmétiques naturels. Sur ce genre de site, chaque clic en trop coûte une vente : j'ai travaillé le parcours d'achat avant tout le reste.",
    sections: [
      { title: 'Le parcours d’achat', body: ["Catalogue par catégories avec filtres et recherche, panier, adresses, livraison et paiement. Connexion possible avec Google, factures PDF générées automatiquement."] },
      { title: 'Côté boutique', body: ["Un espace d'administration pour gérer les produits, les catégories, les commandes et les clients, plus une inscription à la newsletter."] },
      { title: 'La technique', body: ["Symfony 6 et Doctrine sur MySQL 8, gabarits Twig et Tailwind, paiements Stripe et PayPal. L'ensemble tourne dans Docker avec PHP-FPM et Nginx."] },
    ],
    figures: [{ type: 'diagram', caption: 'Le parcours d’une commande', layers: [
      ['Découvrir', ['Catalogue', 'Filtres', 'Recherche']],
      ['Acheter', ['Panier', 'Connexion Google', 'Adresse et livraison']],
      ['Payer', ['Stripe', 'PayPal']],
      ['Après', ['Facture PDF', 'Suivi de commande', 'Newsletter']],
    ] }],
  },
  {
    slug: 'distri-sur-france', device: 'duo', screen: 'img/p/distri-sur-france/1.webp', screenM: 'img/p/distri-sur-france/m1.webp', title: 'Distri Sûr France', color: C.brique, relief: { peaks: 3, rough: .5 },
    kicker: "Dix mois d'alternance pour créer la boutique en ligne d'une entreprise.",
    kind: 'pro', context: 'Alternance', org: 'Distri Sûr France, Troyes', year: '2024', period: 'Novembre 2023 à août 2024',
    team: 'Avec les équipes commerciales', role: 'Développeur full stack e-commerce',
    stack: ['Odoo', 'Python', 'HTML', 'CSS', 'Figma', 'SEO'],
    links: [], privateNote: 'Projet d’entreprise, pas de dépôt public.',
    intro: "Pendant dix mois d'alternance, j'ai conçu et développé le site e-commerce de Distri Sûr France, des premières maquettes jusqu'à la mise en ligne.",
    sections: [
      { title: 'Ce que j’ai fait', list: [
        ['Maquettes', 'Les pages et le parcours d’achat dessinés dans Figma, validés avec les équipes métier.'],
        ['Boutique', 'Le développement front-end et back-end sur Odoo, l’intégration du catalogue et des contenus.'],
        ['Référencement', 'Le travail sur le SEO pour que les produits soient trouvés.'],
      ] },
      { title: 'Ce que j’en retiens', body: ["Concilier ce que veut le commercial, ce que comprend le client et ce que permet la technique. C'est souvent là que se joue un projet, bien avant la première ligne de code."] },
    ],
    figures: [{ type: 'img', src: 'img/p/distri-sur-france/2.webp', alt: 'Catégorie bornes de recharge de la boutique Distri Sûr France', caption: 'La boutique en ligne aujourd’hui : une catégorie', wide: true },
      { type: 'img', src: 'img/p/distri-sur-france/3.webp', alt: 'Fiche produit de la boutique Distri Sûr France', caption: 'Une fiche produit' },
      { type: 'phones', srcs: ['img/p/distri-sur-france/m1.webp'], caption: 'Sur mobile' }],
  },
  {
    slug: 'zabi', device: 'laptop', screen: 'img/p/zabi/4.webp', title: 'ZABI', color: C.orange, relief: { peaks: 4, rough: .8 },
    kicker: 'Un jeu de duel entre super-héros, façon arcade.',
    kind: 'ecole', context: 'Master Sciences et Technologies du Métavers', org: 'INSA Hauts-de-France', year: '2025', period: 'Avril 2025',
    team: 'Équipe de 4', role: 'Développement full stack',
    stack: ['Node.js', 'Express 5', 'MongoDB', 'API REST', 'JavaScript'],
    links: [['Voir le code', 'https://github.com/Subdij/ZABI']],
    intro: "Deux joueurs, deux héros tirés au sort parmi 731, et un combat au tour par tour. Le titre complet du projet : « Les super-héros qui se battent dans le jeu qu'on a développé ».",
    sections: [
      { title: 'Les règles', body: ["Chaque héros a ses statistiques : intelligence, force, vitesse, résistance, puissance, combat. Chaque type d'attaque peut exploiter une faiblesse de l'adversaire pour un coup critique (plus 20 dégâts), ou au contraire buter sur sa défense (moins 20)."] },
      { title: 'La technique', body: ["Une API REST en Express 5 sur MongoDB, alimentée par l'import des 731 héros. L'interface reprend les codes de l'arcade : barres de vie, animations de dégâts et de soin, police pixel."] },
    ],
    figures: [{ type: 'img', src: 'img/p/zabi/1.webp', alt: 'Écran d’accueil de ZABI', caption: 'L’écran d’accueil', wide: true },
      { type: 'img', src: 'img/p/zabi/2.webp', alt: 'Saisie des pseudos des deux joueurs', caption: 'Les deux joueurs choisissent leur pseudo' },
      { type: 'img', src: 'img/p/zabi/3.webp', alt: 'Analyse du combat avant le duel', caption: 'L’analyse de l’équilibre du combat' }],
  },
  {
    slug: 'subchaine', device: 'laptop', screen: 'img/p/subchaine/3.webp', title: 'SUBCHAINE', color: C.ardoise, relief: { peaks: 6, rough: .3 },
    kicker: 'Un simulateur pour comprendre une blockchain en la manipulant.',
    kind: 'ecole', context: 'Master Sciences et Technologies du Métavers', org: 'INSA Hauts-de-France', year: '2025', period: 'Mai 2025',
    team: 'Projet de Master', role: 'Développement',
    stack: ['Node.js', 'Express', 'Socket.IO', 'crypto-js', 'elliptic'],
    links: [['Voir le code', 'https://github.com/Subdij/BlockChain']],
    intro: "Créer un portefeuille, signer une transaction, miner un bloc, et voir la chaîne se construire en direct. Le but : rendre visibles des notions qu'on comprend mal en lisant.",
    sections: [
      { title: 'Ce qu’on peut faire', list: [
        ['Portefeuilles', 'Générer une paire de clés sur courbe elliptique.'],
        ['Transactions', 'Les signer, puis vérifier la signature.'],
        ['Minage', 'Preuve de travail et arbre de Merkle.'],
        ['Visualisation', 'La chaîne qui se construit en temps réel avec Socket.IO.'],
      ] },
    ],
    figures: [{ type: 'img', src: 'img/p/subchaine/1.webp', alt: 'Accueil du simulateur SUBCHAINE', caption: 'L’accueil du simulateur', wide: true },
      { type: 'img', src: 'img/p/subchaine/2.webp', alt: 'Gestionnaire de portefeuilles avec deux portefeuilles créés', caption: 'Deux portefeuilles et leurs clés' },
      { type: 'img', src: 'img/p/subchaine/4.webp', alt: 'Visualiseur de la blockchain', caption: 'La chaîne, bloc par bloc' }],
  },
  {
    slug: 'reseau-sur-france', device: 'laptop', screen: 'img/p/reseau-sur-france/1.webp', title: 'Réseau Sûr France', color: C.eau, relief: { peaks: 2, rough: .45 },
    kicker: "Le nouveau site d'une entreprise d'électricité et de domotique de l'Aube.",
    kind: 'pro', context: 'Stage', org: 'Réseau Sûr France, Saint-André-les-Vergers', year: '2023', period: 'Avril à juin 2023',
    team: 'Avec l’équipe marketing et communication', role: 'Design et développement',
    stack: ['WordPress', 'Figma', 'Photoshop', 'HTML', 'CSS', 'JavaScript', 'OVH'],
    links: [['Voir le site', 'https://reseausurfrance.fr']],
    intro: "Trois mois de stage pour livrer le site vitrine de l'entreprise, dans sa charte graphique, avec des demandes qui ont évolué jusqu'au dernier moment. Livré à temps.",
    sections: [
      { title: 'Le travail', body: ["Maquettes dans Figma, visuels dans Photoshop, intégration dans WordPress, mise en ligne chez OVH. J'ai travaillé chaque semaine avec l'équipe marketing pour ajuster les pages."] },
      { title: 'Ce qu’en dit ma tutrice', quote: ["Sa maîtrise des logiciels de conception graphique a été exceptionnelle […]. Malgré les modifications de dernière minute apportées à un projet, Ziyad a fait preuve d'une grande flexibilité.", 'Juliana Rebelo, assistante marketing et communication'] },
    ],
    figures: [
      { type: 'video', src: 'media/reseau-sur-france.mp4', poster: 'img/p/reseau-sur-france/1.webp', caption: 'Parcours du site' },
      { type: 'img', src: 'img/p/reseau-sur-france/1.webp', alt: "Page d'accueil du site Réseau Sûr France" },
      { type: 'img', src: 'img/p/reseau-sur-france/2.webp', alt: 'Section des réalisations' },
      { type: 'img', src: 'img/p/reseau-sur-france/3.webp', alt: "Page de vérification d'éligibilité" },
      { type: 'img', src: 'img/p/reseau-sur-france/4.webp', alt: 'Pied de page avec les sociétés du groupe' },
    ],
  },
  {
    slug: 'jpo-iut-meaux', device: 'laptop', screen: 'img/p/jpo-iut-meaux/1.webp', title: 'JPO IUT de Meaux', color: C.prune, relief: { peaks: 5, rough: .55 },
    kicker: 'Le site des portes ouvertes du département MMI, avec une salle modélisée en 3D.',
    kind: 'ecole', context: 'BUT Métiers du Multimédia et de l’Internet', org: 'IUT de Meaux, Université Gustave Eiffel', year: '2024', period: 'Janvier 2024',
    team: 'Équipe de 5', role: 'Modélisation et intégration 3D',
    stack: ['Blender', '3ds Max', 'Unity', 'WebGL', 'Angular', 'Sass', 'C#'],
    links: [],
    intro: "Pour les journées portes ouvertes, notre équipe a créé un site de présentation du département MMI. Ma part : modéliser une de nos salles de cours en 3D et l'intégrer pour qu'on puisse la visiter depuis le navigateur.",
    sections: [
      { title: 'Ma part', body: ["Modélisation de la salle dans Blender et 3ds Max, export vers Unity puis WebGL, et intégration dans le site Angular. Le reste de l'équipe s'occupait des contenus et de l'interface."] },
    ],
    figures: [
      { type: 'video', src: 'media/jpo-iut-meaux.mp4', poster: 'img/p/jpo-iut-meaux/1.webp', caption: 'Aperçu du site' },
      { type: 'img', src: 'img/p/jpo-iut-meaux/2.webp', alt: 'La salle de cours modélisée en 3D' },
      { type: 'img', src: 'img/p/jpo-iut-meaux/1.webp', alt: 'Accueil du site des portes ouvertes' },
      { type: 'img', src: 'img/p/jpo-iut-meaux/4.webp', alt: 'Projets étudiants présentés sur le site' },
    ],
  },
  {
    slug: 'gestion-articles', device: 'laptop', screen: 'img/p/gestion-articles/1.webp', title: 'Gestionnaire d’articles', color: C.ocre, relief: { peaks: 2, rough: .25 },
    kicker: 'Une application Symfony pour publier, modifier et supprimer des articles.',
    kind: 'ecole', context: 'BUT Métiers du Multimédia et de l’Internet', org: 'IUT de Meaux', year: '2024', period: 'Mars 2024',
    team: 'Équipe de 2', role: 'Design, intégration, développement',
    stack: ['Symfony', 'PHP', 'Twig', 'MySQL', 'HTML', 'CSS', 'JavaScript'],
    links: [['Voir le code', 'https://github.com/Subdij/Gestion_Recettes']],
    intro: "Un catalogue d'articles (ici, des paquets de chips) où seules les personnes connectées peuvent ajouter, modifier ou supprimer. Mon premier vrai projet Symfony.",
    sections: [
      { title: 'Ce qu’il fait', body: ["Inscription, connexion et déconnexion, suppression de compte. Les articles et les utilisateurs sont stockés en base MySQL, et les droits changent selon qu'on est connecté ou non."] },
    ],
    figures: [
      { type: 'video', src: 'media/gestion-articles.mp4', poster: 'img/p/gestion-articles/1.webp', caption: 'Démonstration' },
      { type: 'img', src: 'img/p/gestion-articles/1.webp', alt: 'Liste des articles' },
      { type: 'img', src: 'img/p/gestion-articles/2.webp', alt: "Formulaire d'ajout" },
      { type: 'img', src: 'img/p/gestion-articles/3.webp', alt: "Modification d'un article" },
    ],
  },
  {
    slug: 'web-doc-artisans', device: 'laptop', screen: 'img/p/web-doc-artisans/1.webp', title: 'Web-documentaire artisans', color: C.foret, relief: { peaks: 4, rough: .6 },
    kicker: 'Des artisans aux métiers rares, racontés par leurs propres mots.',
    kind: 'ecole', context: 'BUT Métiers du Multimédia et de l’Internet', org: 'IUT de Meaux', year: '2022', period: 'Novembre 2022',
    team: 'Équipe de 4', role: 'Interviews et design',
    stack: ['Figma', 'Premiere Pro', 'HTML', 'CSS', 'JavaScript'],
    links: [['Voir le site', 'https://web-documentaire-artisant.netlify.app'], ['Voir le code', 'https://github.com/Subdij/Web-documentaire-artisant']],
    intro: "Une ébéniste, une potière, un plumassier, un lapidaire. Nous sommes allés les interviewer pour comprendre des métiers qui disparaissent, puis nous avons construit un web-documentaire autour de leurs récits.",
    sections: [
      { title: 'Ma part', body: ["J'ai mené des entretiens et conçu l'interface dans Figma. Les vidéos ont été montées dans Premiere Pro, puis intégrées dans un site simple, page par métier."] },
    ],
    figures: [
      { type: 'video', src: 'media/web-doc-artisans.mp4', poster: 'img/p/web-doc-artisans/1.webp', caption: 'Parcours du web-documentaire' },
      { type: 'img', src: 'img/p/web-doc-artisans/1.webp', alt: 'Accueil du web-documentaire' },
      { type: 'img', src: 'img/p/web-doc-artisans/2.webp', alt: 'Page consacrée à la poterie' },
      { type: 'img', src: 'img/p/web-doc-artisans/3.webp', alt: 'Galerie photo' },
    ],
  },
  {
    slug: 'pub-steel-ball-run', device: 'laptop', screen: 'img/p/pub-steel-ball-run/3.webp', title: 'Pub Steel Ball Run', color: C.brique, relief: { peaks: 3, rough: .9 },
    kicker: 'Une publicité animée pour un manga que j’adore.',
    kind: 'ecole', context: 'BUT Métiers du Multimédia et de l’Internet', org: 'IUT de Meaux', year: '2022', period: 'Mars 2022',
    team: 'Seul', role: 'Scénario, animation, montage',
    stack: ['After Effects', 'Media Encoder'],
    links: [['Voir sur YouTube', 'https://youtu.be/3-xCI2ds2RQ']],
    intro: "Une annonce animée sous After Effects pour JoJo's Bizarre Adventure : Steel Ball Run, qui met en avant le manga et ses personnages. Un exercice de rythme : faire passer une ambiance en trente-cinq secondes.",
    sections: [],
    figures: [
      { type: 'video', src: 'media/pub-steel-ball-run.mp4', poster: 'img/p/pub-steel-ball-run/1.webp', caption: 'La publicité (avec le son)', sound: true },
      { type: 'img', src: 'img/p/pub-steel-ball-run/3.webp', alt: 'Plan de la publicité avec les tomes du manga' },
      { type: 'img', src: 'img/p/pub-steel-ball-run/2.webp', alt: 'Plan sur Gyro Zeppeli' },
    ],
  },
];

// Le labo affiche tout : les projets ci-dessus + les dépôts GitHub plus petits.
// zone : pro | mobile | xr | web | data | jeux
const zones = [
  { id: 'pro', name: 'Au travail', x: -0.55, y: -0.35 },
  { id: 'mobile', name: 'Mobile', x: 0.1, y: -0.55 },
  { id: 'xr', name: 'Réalité virtuelle et 3D', x: 0.62, y: -0.2 },
  { id: 'web', name: 'Web', x: -0.45, y: 0.45 },
  { id: 'data', name: 'Données et algorithmes', x: 0.2, y: 0.5 },
  { id: 'jeux', name: 'Jeux et vidéo', x: 0.7, y: 0.55 },
];

const labZone = {
  'btp-360': 'pro', 'distri-sur-france': 'pro', 'reseau-sur-france': 'pro',
  subforge: 'mobile', lolop: 'mobile',
  'funfair-vr': 'xr', 'hotel-murder-vr': 'xr', 'jpo-iut-meaux': 'xr',
  'turaty-naturels': 'web', 'gestion-articles': 'web', 'web-doc-artisans': 'web',
  subchaine: 'data', zabi: 'jeux', 'pub-steel-ball-run': 'jeux',
};

const repos = [
  { n: 'GymBud', z: 'mobile', y: '2025', d: "Une application pour trouver un partenaire d'entraînement : swipe, profils sportifs, messagerie.", s: ['React Native', 'Expo'] },
  { n: 'Facture Android', repo: 'Android_Facture', z: 'mobile', y: '2024', d: 'Mes débuts en Kotlin, autour de la facturation.', s: ['Kotlin', 'Android'] },
  { n: 'Magasin VR', z: 'xr', y: '2025', d: 'Un showroom en réalité virtuelle pour se promener entre les produits.', s: ['Unity 6', 'C#'] },
  { n: 'JoJo Maze', repo: 'JOJO_MAZE', z: 'xr', y: '2025', d: "Un labyrinthe 3D sous Unity, clin d'œil à JoJo's Bizarre Adventure.", s: ['Unity', 'C#'] },
  { n: 'FPS en three.js', repo: 'Test_FPS_three.js', z: 'xr', y: '2024', d: 'Un jeu de tir à la première personne dans le navigateur.', s: ['three.js', 'WebGL'] },
  { n: 'Bouton WebGL', repo: 'Webgl-Button', demo: 'https://subdij.github.io/Webgl-Button/', z: 'xr', y: '2024', d: 'Une scène Unity exportée en WebGL.', s: ['Unity', 'WebGL'] },
  { n: 'Scène 3D foot', repo: 'base_3D_foot_ref', z: 'xr', y: '2024', d: "Base d'une scène 3D web servie par Node.", s: ['three.js', 'Node.js'] },
  { n: 'Hôtel : gestion et paie', repo: 'Hotel-Paie', z: 'web', y: '2024', d: 'Gestion hôtelière et paie des employés, à trois.', s: ['PHP', 'MySQL', 'Tailwind'] },
  { n: 'AppScol', repo: 'app-scol', z: 'web', y: '2023', d: 'Une application scolaire en Angular 17.', s: ['Angular', 'TypeScript'] },
  { n: 'Gestion académique', repo: 'academic-management-system-ts', z: 'web', y: '2023', d: 'Étudiants, cours, notes et moyennes pondérées.', s: ['TypeScript'] },
  { n: 'API REST employés', repo: 'API_REST-Employee-Management', z: 'web', y: '2023', d: 'Une API REST en PHP.', s: ['PHP'] },
  { n: "Livre d'or", repo: 'Guest-Book', z: 'web', y: '2023', d: "Un livre d'or en PHP.", s: ['PHP'] },
  { n: 'Mini Twitter', repo: 'twitter', z: 'web', y: '2023', d: 'Un clone simplifié de Twitter.', s: ['PHP', 'MySQL'] },
  { n: 'Salaire brut en net', repo: 'Calculateur-de-salaire-brut-en-net', demo: 'https://subdij.github.io/Calculateur-de-salaire-brut-en-net/', z: 'web', y: '2023', d: 'Convertir un salaire brut en net, en direct.', s: ['JavaScript'] },
  { n: "Calculateur d'IMC", repo: 'Calculateur-d-IMC', demo: 'https://subdij.github.io/Calculateur-d-IMC/', z: 'web', y: '2023', d: "Calculer son indice de masse corporelle.", s: ['JavaScript'] },
  { n: 'Site Minecraft', repo: 'Minecraft', demo: 'https://subdij.github.io/Minecraft/', z: 'web', y: '2023', d: 'Un site de fan : constructions et redstone.', s: ['HTML', 'Bootstrap'] },
  { n: 'Portfolio V2', repo: 'Portfolio-V2', demo: 'https://subdij.github.io/Portfolio-V2/', z: 'web', y: '2023', d: 'Un ancien portfolio, pour mesurer le chemin.', s: ['HTML', 'CSS'] },
  { n: 'Portfolio Next.js', repo: 'portfolio-2.0.1', z: 'web', y: '2023', d: 'Une version de portfolio en Next.js.', s: ['Next.js', 'Tailwind'] },
  { n: 'Prénoms et Hadoop', repo: 'mini-projet-hadoop', z: 'data', y: '2025', d: 'Les prénoms les plus donnés par décennie, données INSEE, Hadoop Streaming et Pig.', s: ['Python', 'Hadoop', 'Pig'] },
  { n: 'QuizDown', repo: 'TP5_Quizz', z: 'data', y: '2024', d: "Un quiz en Pygame, à cinq. J'étais responsable de l'architecture.", s: ['Python', 'Pygame'] },
  { n: 'Wifi auto', repo: 'wifi-connexion', z: 'data', y: '2025', d: 'Un script qui se reconnecte seul au portail wifi. Né d’une vraie frustration.', s: ['Python', 'Selenium'] },
];
// Dépôts publics volontairement absents (doublons, tests vides, ce site).
const skipRepos = ['Final-Portfolio-V.X', 'ziyad-chaabi.github.io', 'subdij', 'premierprojet_git', 'test_FPS', 'video', 'Hotel-Paiee'];

const timeline = [
  { year: '2021', place: 'Troyes', coords: '48.30° N, 4.08° E', title: 'Le déclic', text: "Bac STI2D, option Systèmes d'information et numérique, au lycée Saint-Joseph La Salle. J'y écris mes premiers programmes, avec l'envie de comprendre ce qu'il y a derrière un écran." },
  { year: '2021', place: 'Meaux', coords: '48.96° N, 2.88° E', title: 'Le détour par le design', img: 'img/parcours/iut-meaux.webp', alt: "L'IUT de Meaux", text: "Je pars trois ans à Meaux pour un BUT MMI : code, UX, vidéo, graphisme. J'y ai appris qu'une interface se teste sur les gens qui l'utilisent, pas sur soi." },
  { year: '2022', place: 'Troyes', coords: '48.30° N, 4.08° E', title: 'Mon premier outil métier', text: "Un stage administratif chez Ophta Médical. En voyant le planning de l'équipe, j'ai construit un tableau qui calcule les heures et les heures supplémentaires de chacun. Je ne savais pas encore que c'était ça, mon métier." },
  { year: '2023', place: 'Saint-André-les-Vergers', coords: '48.28° N, 4.05° E', title: 'Un vrai site, une vraie entreprise', img: 'img/p/reseau-sur-france/1.webp', alt: 'Le site Réseau Sûr France', text: "Trois mois chez Réseau Sûr France pour livrer leur nouveau site, avec l'équipe marketing et des demandes qui changent jusqu'au bout.", link: 'reseau-sur-france' },
  { year: '2023', place: 'Troyes', coords: '48.30° N, 4.08° E', title: "Dix mois d'e-commerce", img: 'img/p/distri-sur-france/1.webp', alt: 'La boutique en ligne Distri Sûr France', text: "En alternance chez Distri Sûr France, j'ai conçu et développé la boutique en ligne, des maquettes Figma à la mise en ligne sur Odoo.", link: 'distri-sur-france' },
  { year: '2024', place: 'Valenciennes', coords: '50.36° N, 3.52° E', title: 'Cap sur le métavers', img: 'img/ziyad-vr.webp', alt: 'Ziyad en présentation de projet VR, un Meta Quest 3 sur le bureau', text: "Master Sciences et Technologies du Métavers à l'INSA Hauts-de-France : réalité virtuelle, IA, mobile, blockchain, big data. Et l'équipe e-sport de l'école entre deux rendus.", link: 'funfair-vr' },
  { year: '2026', place: 'Troyes', coords: '48.30° N, 4.08° E', title: 'BTP-360, seul aux commandes', img: 'img/p/btp-360/1.webp', alt: 'Écran Documents de BTP-360', text: "Sept mois pour remplacer les fichiers Excel de quatre sociétés par une seule application, web et Android, en production sur AWS.", link: 'btp-360' },
  { year: '2026', place: 'Troyes', coords: '48.30° N, 4.08° E', title: 'Et maintenant', text: "De retour à Troyes. SubForge avance, et le labo grossit à chaque nouveau dépôt GitHub.", link: 'subforge' },
];

// level : prod (utilisé en production) | projet (utilisé sur des projets)
const skills = [
  { group: 'Front et mobile', items: [
    ['Angular', 'prod', ['btp-360']], ['Ionic', 'prod', ['btp-360']], ['NgRx', 'prod', ['btp-360']], ['Capacitor', 'prod', ['btp-360']],
    ['TypeScript', 'prod', ['btp-360', 'subforge']], ['React Native', 'projet', ['subforge']], ['Expo', 'projet', ['subforge']],
    ['React', 'projet', []], ['Next.js', 'projet', []], ['Tailwind', 'projet', ['turaty-naturels']], ['Android (Java)', 'projet', ['lolop']],
  ] },
  { group: 'Back-end et données', items: [
    ['NestJS', 'prod', ['btp-360']], ['Prisma', 'prod', ['btp-360']], ['PostgreSQL', 'prod', ['btp-360', 'subforge']], ['Socket.IO', 'prod', ['btp-360', 'subchaine']],
    ['Supabase', 'projet', ['subforge']], ['Node.js', 'projet', ['zabi', 'subchaine']], ['Express', 'projet', ['zabi', 'subchaine']], ['MongoDB', 'projet', ['zabi']],
    ['Symfony', 'projet', ['turaty-naturels', 'gestion-articles']], ['MySQL', 'projet', ['turaty-naturels', 'gestion-articles']], ['Odoo', 'prod', ['distri-sur-france']],
  ] },
  { group: 'IA appliquée', items: [
    ['Intégration de LLM (Gemini)', 'projet', ['subforge']], ['Sorties structurées et repli sans IA', 'projet', ['subforge']], ['Agents de code (Claude Code, Codex)', 'prod', ['btp-360']],
    ['MCP', 'prod', ['btp-360']], ['Systèmes multi-agents', 'projet', []], ['OCR (Tesseract.js)', 'prod', ['btp-360']],
  ] },
  { group: 'Mise en production et qualité', items: [
    ['Docker', 'prod', ['btp-360', 'turaty-naturels']], ['AWS', 'prod', ['btp-360']], ['Terraform', 'prod', ['btp-360']], ['GitHub Actions', 'prod', ['btp-360']],
    ['Playwright', 'prod', ['btp-360']], ['Jest', 'projet', ['subforge']], ['Sentry', 'prod', ['btp-360', 'subforge']], ['Git', 'prod', []],
  ] },
  { group: 'Réalité virtuelle et 3D', items: [
    ['Unity', 'projet', ['funfair-vr', 'hotel-murder-vr', 'jpo-iut-meaux']], ['C#', 'projet', ['funfair-vr', 'hotel-murder-vr']], ['XR Interaction Toolkit', 'projet', ['funfair-vr', 'hotel-murder-vr']],
    ['OpenXR', 'projet', ['funfair-vr']], ['three.js et WebGL', 'projet', ['jpo-iut-meaux']], ['Blender', 'projet', ['jpo-iut-meaux']],
  ] },
  { group: 'Design et méthode', items: [
    ['UX et UI', 'prod', ['btp-360', 'subforge', 'distri-sur-france']], ['Figma', 'prod', ['distri-sur-france', 'reseau-sur-france', 'web-doc-artisans']], ['Suite Adobe', 'prod', ['reseau-sur-france', 'pub-steel-ball-run']],
    ['Accessibilité WCAG', 'projet', []], ['RGPD', 'prod', ['btp-360']], ['Agile, Scrum', 'projet', []], ['SEO', 'prod', ['distri-sur-france']],
  ] },
];

const notes = [
  ['Les agents de code, oui, mais tenus en laisse', "J'ai codé BTP-360 avec Claude Code et Codex. Ce qui a marché : des règles projet écrites, des tests partout et une relecture de chaque changement. Sans garde-fous, un agent va vite, mais pas forcément dans la bonne direction."],
  ['MCP change la façon de brancher les outils', "Un protocole commun pour donner à un modèle l'accès à une base, un navigateur ou un outil métier. Je l'utilise tous les jours et je regarde comment l'appliquer à des logiciels d'entreprise."],
  ['L’IA propose, l’humain valide', "Dans SubForge, rien n'est enregistré sans l'accord de la personne, et un plan de repli sans IA prend le relais quand le modèle échoue. Pour moi, c'est la bonne façon de mettre de l'IA dans un produit."],
];

window.ZC = { site, projects, zones, labZone, repos, skipRepos, timeline, skills, notes };
