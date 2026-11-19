// Source unique du contenu, lue par build.mjs (pages FR et EN) et par scripts/sync.mjs (skipRepos).
// Script classique qui pose window.ZC : les deux scripts Node l'exécutent dans un bac à sable.
// Un texte bilingue s'écrit L('français', 'english') ; build.mjs choisit la langue de chaque page.
// Les dimensions des images sont lues dans les fichiers par build.mjs. Après une modification : node build.mjs

const L = (fr, en) => ({ fr, en });

const site = {
  name: 'Ziyad Chaabi',
  url: 'https://ziyad-chaabi.github.io/',
  email: 'ziyadou2011@hotmail.fr',
  github: 'https://github.com/Subdij',
  linkedin: 'https://www.linkedin.com/in/ziyad-chaabi/',
  instagram: 'https://www.instagram.com/ziyad_chb/',
  cv: 'CV-Ziyad-Chaabi.pdf',
};

// Ce qu'un recruteur doit lire en dix secondes (faits du CV).
const profile = {
  manifesto: L('Je pense d’abord aux gens qui vont se servir de l’outil, *sur un chantier* ou *un casque VR sur la tête*, et seulement ensuite à la stack.', 'I think first about the people who will use the tool, *on a building site* or *with a VR headset on*, and only then about the stack.'),
  xp: L('21 mois d’expérience en stages et alternance', '21 months of experience in internships and work-study'),
  role: L('Ingénieur développeur Full Stack', 'Full Stack Software Engineer'),
  status: L('Disponible immédiatement, en CDI', 'Available now for a permanent role'),
  place: L('Basé à Troyes, prêt à déménager, hybride ou télétravail', 'Based in Troyes, open to relocating, hybrid or remote'),
  pitch: L(
    "J'ai livré seul une application métier en production (Angular, NestJS, AWS) pour quatre entreprises du BTP, et je viens du design.",
    'On my own, I built and shipped a business application now in production (Angular, NestJS, AWS) for four construction companies. I came to code from design.'),
  coords: '48°18′ N, 4°05′ E',
};

/* ---------- Les quatre études de cas ----------
   emblem : l'œuvre (data/art.json) qui donne l'idée du projet ; shots : les vraies captures, la preuve.
   story : contexte → problème → ce que j'ai construit (un écran par étape) → décisions → résultat → ce que j'en retiens. */
const cases = [
  {
    slug: 'btp-360', title: 'BTP-360', emblem: 'iss', shots: ['img/p/btp-360/1.webp', 'img/p/btp-360/m4.webp'], year: '2026', kind: 'pro',
    kicker: L("L'application qui a remplacé les fichiers Excel de quatre sociétés du bâtiment.", 'The app that replaced the Excel files of four building companies.'),
    outcome: L('En production sur AWS, sur le web et sur Android.', 'In production on AWS, on the web and on Android.'),
    brief: [
      [L('Le problème', 'The problem'), L('Quatre sociétés géraient RH, chantiers et finance dans des fichiers Excel envoyés par mail.', 'Four companies ran HR, sites and finance on Excel files sent by email.')],
      [L('Ma part', 'My part'), L('Tout, seul : conception, application web et Android qui marche hors ligne, API, base de données, mise en production.', 'All of it, solo: design, a web and Android app that works offline, API, database, deployment.')],
      [L('Le résultat', 'The result'), L('En production sur AWS. 380 commits, 255 fichiers de tests unitaires, 54 suites de bout en bout.', 'In production on AWS. 380 commits, 255 unit test files, 54 end-to-end suites.')],
    ],
    setting: L('Stage de fin d’études, développeur principal', 'Final-year internship, lead developer'), org: 'Iso Sûr France, Troyes',
    period: L('Mars à octobre 2026', 'March to October 2026'),
    team: L('Seul, avec la direction et les équipes terrain', 'Solo, with management and field teams'),
    role: L('Conception, développement, mise en production', 'Design, development, deployment'),
    stack: ['Ionic 8', 'Angular 20', 'NgRx', 'Capacitor', 'NestJS 11', 'Prisma 7', 'PostgreSQL 16', 'Socket.IO', 'Docker', 'Terraform', 'AWS', 'GitHub Actions', 'Playwright', 'Sentry'],
    links: [], private: L('Code privé, propriété de l’entreprise. Démonstration sur demande.', 'Private code, owned by the company. Demo on request.'),
    cover: { src: 'img/p/btp-360/1.webp', alt: L('L’écran Documents de BTP-360 (données de test)', 'The Documents screen of BTP-360 (test data)') },
    story: {
      context: [
        L("Iso Sûr France et ses trois sociétés sœurs (Climat, Réseau et Distri Sûr France) travaillent dans le bâtiment. RH, contrats, logistique, finance, chantiers, planning, pointage : tout passait par des fichiers Excel envoyés par mail.",
          'Iso Sûr France and its three sister companies (Climat, Réseau and Distri Sûr France) work in construction. HR, contracts, logistics, finance, sites, scheduling, time tracking: everything went through Excel files sent by email.'),
        L("Les chefs d'équipe pointaient sur papier, les contrats étaient recopiés depuis un modèle Word, et personne ne savait vraiment quel outil se trouvait sur quel chantier.",
          'Team leads clocked in on paper, contracts were copied from a Word template, and nobody really knew which tool was on which site.'),
      ],
      problem: [
        L("Le cahier des charges demandait une seule application, ouverte par un simple lien sur PC comme sur téléphone, et qui marche hors ligne : en sous-sol, sur un chantier, il n'y a souvent pas de réseau.",
          'The brief asked for one app, opened from a plain link on a PC or a phone, that works offline: in a basement or on a building site there is often no signal.'),
        L("La stack était imposée : Angular, NestJS, Prisma et PostgreSQL, que je n'avais jamais utilisés. Je les ai appris pendant le stage.",
          'The stack was set by the company: Angular, NestJS, Prisma and PostgreSQL, none of which I had used before. I learned them during the internship.'),
      ],
      built: [
        { title: L('RH et contrats', 'HR and contracts'), shot: { src: 'img/p/btp-360/2.webp', alt: L('Validation des absences dans BTP-360 (données de test)', 'Approving leave requests in BTP-360 (test data)') },
          text: L('Contrats générés en PDF et DOCX à partir de modèles (grille de classification BTP, convention collective), dossiers salariés, absences validées en deux temps, habilitations avec alerte avant expiration.',
            'Contracts generated as PDF and DOCX from templates (construction pay grid, collective agreement), employee files, two-step leave approval, certifications with an alert before they expire.') },
        { title: L('Sur le terrain', 'On site'), shot: { src: 'img/p/btp-360/m4.webp', phone: true, alt: L('Fiche d’un chantier géolocalisé sur téléphone (données de test)', 'A geolocated site record on a phone (test data)') },
          text: L('Pointage géolocalisé à l’entrée et à la sortie du chantier, un QR code par outil, remise d’outils signée à l’écran par le salarié, notes de frais lues par OCR sur le téléphone, même hors ligne.',
            'Geolocated clock-in and clock-out on site, one QR code per tool, tool hand-overs signed on screen by the employee, receipts read by OCR on the phone, even offline.') },
        { title: L('Absences et planning', 'Leave and scheduling'), shot: { src: 'img/p/btp-360/m1.webp', phone: true, alt: L('Le planning des absences sur téléphone (données de test)', 'The leave calendar on a phone (test data)') },
          text: L('Planning au jour, à la semaine ou au mois, demandes de congé envoyées depuis le téléphone, notifications en temps réel.',
            'Daily, weekly or monthly calendar, leave requests sent from the phone, real-time notifications.') },
        { title: L('Documents et achats', 'Documents and purchasing'), shot: { src: 'img/p/btp-360/1.webp', alt: L('La gestion documentaire de BTP-360 (données de test)', 'Document management in BTP-360 (test data)') },
          text: L('Documents rangés par société et par chantier, pièces à renouveler signalées, et demandes d’achat validées par la direction.',
            'Documents filed by company and by site, files to renew flagged, and purchase requests approved by management.') },
      ],
      decisions: [
        [L('Une file pour le hors ligne', 'A queue for offline work'), L("Toute écriture faite sans réseau est captée par un intercepteur HTTP, gardée sur l'appareil et affichée tout de suite. Au retour du réseau, la file est rejouée dans l'ordre, avec une clé d'idempotence pour ne jamais compter deux fois la même action. Après six échecs, l'action passe « à vérifier ». Les conflits sont rares par conception : chaque action est rattachée au salarié qui la fait.",
          'Any write made without a network is caught by an HTTP interceptor, kept on the device and shown straight away. When the network comes back, the queue is replayed in order, with an idempotency key so the same action never counts twice. After six failures, the action is marked “to check”. Conflicts are rare by design: each action belongs to the employee who makes it.')],
        [L('Un OCR qui ne sort pas de l’appareil', 'OCR that never leaves the device'), L("Les tickets sont lus sans service en ligne : Google ML Kit sur Android, PaddleOCR dans le navigateur, Tesseract.js sur le serveur. Seuls les champs sûrs sont préremplis, et une passe vérifie que HT + TVA = TTC. La CI échoue si un OCR distant réapparaît dans le code.",
          'Receipts are read with no online service: Google ML Kit on Android, PaddleOCR in the browser, Tesseract.js on the server. Only confident fields are prefilled, and a check makes sure net + VAT = gross. CI fails if a remote OCR service ever comes back into the code.')],
        [L('Cinq rôles, des données chiffrées', 'Five roles, encrypted data'), L("Admin, bureau, chargé d'affaires, magasinier, terrain : chacun ne voit que son périmètre. Le numéro de sécurité sociale et le salaire sont chiffrés en AES-256-GCM, et l'API refuse de démarrer sans vraie clé. Un départ archive le dossier au lieu de le supprimer.",
          'Admin, office, project manager, storekeeper, field: each role only sees its own scope. Social security numbers and salaries are encrypted with AES-256-GCM, and the API refuses to start without a real key. When someone leaves, their file is archived instead of deleted.')],
        [L('Le plus simple qui tient', 'The simplest thing that holds'), L("Une instance EC2 en région Paris avec Docker Compose, à l'échelle d'un MVP, plutôt qu'ECS ou Kubernetes. Terraform pour tout reconstruire, GitHub Actions pour déployer, Sentry pour les erreurs, et chaque nuit une sauvegarde chiffrée de PostgreSQL envoyée sur S3, à part du serveur. J'ai restauré cette sauvegarde pour vérifier qu'elle marche.",
          'One EC2 instance in the Paris region with Docker Compose, sized for an MVP, rather than ECS or Kubernetes. Terraform to rebuild everything, GitHub Actions to deploy, Sentry for errors, and every night an encrypted PostgreSQL backup sent to S3, away from the server. I restored that backup to make sure it works.')],
        [L('Des agents IA tenus en laisse', 'AI agents on a leash'), L("Pour chaque tâche, une spécification écrite. Un agent l'implémente, un second relit le diff contre la spécification, et les tests doivent passer avant toute fusion. Claude Code tenait le front et la logique métier, Codex le back-end et la sécurité. Règle posée dès le début : si l'agent ne sait pas m'expliquer sa logique, la fonctionnalité n'est pas validée.",
          'Every task starts with a written spec. One agent implements it, a second reviews the diff against the spec, and the tests must pass before any merge. Claude Code handled the front end and business logic, Codex the back end and security. A rule from day one: if the agent cannot explain its logic to me, the feature is not accepted.')],
      ],
      diagram: { caption: L('Architecture de BTP-360', 'BTP-360 architecture'), layers: [
        [L('Sur le terrain', 'On site'), [L('Application Android', 'Android app'), L('PWA au bureau', 'PWA in the office'), L('File hors ligne', 'Offline queue')]],
        [L('Client', 'Client'), ['Ionic 8 + Angular 20', 'NgRx', 'Capacitor', L('OCR local', 'Local OCR')]],
        ['API', ['NestJS 11', 'Socket.IO', L('JWT + 5 rôles', 'JWT + 5 roles'), 'Swagger']],
        [L('Données', 'Data'), ['PostgreSQL 16', 'Prisma 7', 'AES-256-GCM']],
        [L('Infrastructure', 'Infrastructure'), ['AWS EC2 (Paris) + S3', 'Docker Compose', 'Terraform', 'GitHub Actions', 'Sentry']],
      ] },
      result: {
        stats: [['4', L('sociétés dans une seule application', 'companies in a single app')], ['380', L('commits', 'commits')], ['47', L('modèles de données', 'data models')], ['255', L('fichiers de tests unitaires', 'unit test files')], ['54', L('suites de tests de bout en bout', 'end-to-end test suites')]],
        text: [L("L'application est en production sur AWS, sur le web et sur Android. L'OCR des notes de frais, la partie la plus dure, a été livré complet dans les délais, pas en version bêta.",
          'The app is in production on AWS, on the web and on Android. Receipt OCR, the hardest part, shipped complete and on time, not as a beta.')],
      },
      lessons: [
        L("Un jour, un agent a ajouté une fonctionnalité que je n'avais pas demandée : une signature électronique pour chaque document déposé dans le dossier d'un salarié. Je l'ai vue en relisant le diff. Trop lourde, et contraire à la logique : une notification suffisait. Je l'ai retirée (30 fichiers, environ 3 800 lignes en moins) et j'ai gardé la signature là où elle a un sens, quand le magasinier remet des outils.",
          'One day an agent added a feature I had not asked for: an e-signature for every document added to an employee’s file. I caught it while reviewing the diff. Too heavy, and against the logic: a notification was enough. I removed it (30 files, about 3,800 lines gone) and kept signatures where they make sense, when the storekeeper hands over tools.'),
        L("Seul sur un projet de cette taille, on est obligé de tout écrire : la documentation, les décisions, les tests. C'est ce qui m'a permis d'aller vite sans casser ce qui marchait déjà.",
          'Alone on a project this size, you have to write everything down: the documentation, the decisions, the tests. That is what let me move fast without breaking what already worked.'),
      ],
    },
  },
  {
    slug: 'subforge', title: 'SubForge', emblem: 'jupiter', shots: ['img/p/subforge/m1.webp', 'img/p/subforge/m3.webp', 'img/p/subforge/m5.webp'], year: '2026', kind: 'perso',
    kicker: L("Un prototype de coach nutrition : on décrit un repas en une phrase, l'IA propose les macros, on valide.", 'A nutrition coach prototype: describe a meal in one sentence, the AI suggests the macros, you confirm.'),
    outcome: L('Un prototype Android, construit pour apprendre.', 'An Android prototype, built to learn.'),
    brief: [
      [L('Le problème', 'The problem'), L('Noter ses repas prend trop de temps, alors on abandonne au bout d’une semaine.', 'Logging meals takes too long, so you give up after a week.')],
      [L('Ma part', 'My part'), L('Tout, seul : un prototype mobile où l’on décrit un repas en une phrase et où l’IA propose les macros.', 'All of it, solo: a mobile prototype where you describe a meal in one sentence and the AI suggests the macros.')],
      [L('Le résultat', 'The result'), L('Un prototype qui tourne sur Android, et une vraie première expérience de Supabase et d’un LLM.', 'A prototype running on Android, and real first-hand experience of Supabase and an LLM.')],
    ],
    setting: L('Projet personnel, prototype', 'Personal project, prototype'), org: L('Application mobile', 'Mobile app'),
    period: L('Août 2026', 'August 2026'),
    team: L('Seul', 'Solo'), role: L('Produit, design, développement', 'Product, design, development'),
    stack: ['React Native', 'Expo', 'TypeScript', 'Supabase', 'Edge Functions', 'Gemini 2.5 Flash', 'Jest', 'Sentry', 'PostHog', 'EAS'],
    links: [], private: L('Code privé. Captures de l’application telle qu’elle tourne.', 'Private code. Screenshots of the app as it runs.'),
    cover: { src: 'img/p/subforge/m1.webp', phone: true, alt: L('L’écran d’accueil de SubForge', 'The SubForge welcome screen') },
    story: {
      context: [L("Je reprenais la musculation avec un objectif de prise de masse, et je savais déjà où j'allais lâcher : l'alimentation. Chaque fois que j'avais essayé de suivre mes repas, j'avais abandonné au bout d'une semaine, parce que la saisie était trop lente.",
        'I was getting back into weight training to bulk up, and I already knew where I would give up: food. Every time I had tried to track my meals, I quit after a week because logging was too slow.')],
      problem: [
        L('Noter un repas devait prendre moins de temps que de le manger.', 'Logging a meal had to take less time than eating it.'),
        L("Et je voulais découvrir Supabase et l'intégration d'un LLM sur un vrai cas, pas sur un tutoriel.", 'And I wanted to try Supabase and LLM integration on a real use case, not a tutorial.'),
      ],
      built: [
        { title: L('Une phrase, des macros', 'One sentence, the macros'), shot: { src: 'img/p/subforge/m1.webp', phone: true, alt: L('Un repas décrit en une phrase et ses macros', 'A meal described in one sentence, with its macros') },
          text: L("On décrit son repas à la voix ou au texte. L'IA propose les aliments et les macros, la personne corrige si besoin, et rien n'est enregistré sans sa validation.",
            'You describe your meal by voice or text. The AI suggests the foods and macros, you fix them if needed, and nothing is saved until you confirm.') },
        { title: L('Cinq questions pour commencer', 'Five questions to start'), shot: { src: 'img/p/subforge/m3.webp', phone: true, alt: L('L’accueil : sexe, date de naissance, taille, poids', 'Onboarding: sex, date of birth, height, weight') },
          text: L('Objectif, morphologie, activité : l’accueil tient en cinq questions.', 'Goal, body, activity: onboarding takes five questions.') },
        { title: L('Ce qui ne se négocie pas', 'What is non-negotiable'), shot: { src: 'img/p/subforge/m5.webp', phone: true, alt: L('Les contraintes strictes : halal, végétarien, allergies', 'Hard constraints: halal, vegetarian, allergies') },
          text: L('Halal, végétarien, allergies : des contraintes qu’on règle une fois, à part des simples préférences.', 'Halal, vegetarian, allergies: constraints you set once, kept apart from simple preferences.') },
        { title: L('L’historique', 'History'), shot: { src: 'img/p/subforge/m7.webp', phone: true, alt: L('L’historique par jour et par semaine', 'History by day and by week') },
          text: L('Les repas de la journée et de la semaine.', 'Meals for the day and the week.') },
      ],
      decisions: [
        [L('Le back-end le plus simple', 'The simplest back end'), L('Supabase et ses Edge Functions, pour tester l’idée vite et voir comment les deux se branchent.', 'Supabase and its Edge Functions, to test the idea fast and see how the two fit together.')],
        [L('Gemini 2.5 Flash', 'Gemini 2.5 Flash'), L("Choisi parce que son API était gratuite à ce moment-là. Les appels passent par une Edge Function, pour que la clé reste côté serveur.", 'Chosen because its API was free at the time. Calls go through an Edge Function so the key stays on the server.')],
        [L("L'IA propose, la personne valide", 'The AI suggests, the person decides'), L("Le modèle ne fait que proposer. C'est la personne qui valide ce qui est enregistré.", 'The model only suggests. The person confirms what gets saved.')],
      ],
      diagram: { caption: L('Le chemin d’une phrase', 'The path of a sentence'), layers: [
        [L('Téléphone', 'Phone'), ['React Native + Expo', L('Voix ou texte', 'Voice or text'), L('Validation par la personne', 'Confirmed by the person')]],
        ['Edge Functions', ['Supabase', L('Appel au modèle', 'Model call')]],
        [L('IA', 'AI'), ['Gemini 2.5 Flash', L('Propose les macros', 'Suggests the macros')]],
        [L('Données', 'Data'), ['Supabase Postgres', 'Auth']],
      ] },
      result: {
        stats: [],
        text: [L("Un prototype qui tourne : builds APK et AAB avec EAS, tests Jest, suivi avec Sentry et PostHog. Je l'ai construit pour apprendre, et je le teste sur mes propres repas.",
          'A working prototype: APK and AAB builds with EAS, Jest tests, monitoring with Sentry and PostHog. I built it to learn, and I test it on my own meals.')],
      },
      lessons: [L("Un projet perso me sert à apprendre une stack : je prends l'outil qui me permet de tester l'idée vite et à moindre coût.", 'A side project is how I learn a stack: I pick the tool that lets me test the idea fast and cheaply.')],
    },
  },
  {
    slug: 'distri-sur-france', title: 'Distri Sûr France', emblem: 'sun', shots: ['img/p/distri-sur-france/2.webp', 'img/p/distri-sur-france/m1.webp'], year: '2024', kind: 'pro',
    kicker: L("Dix mois d'alternance pour créer la boutique en ligne d'une entreprise.", 'Ten months of work-study to build a company’s online shop.'),
    outcome: L('Le site e-commerce officiel de l’entreprise, en ligne.', 'The company’s official e-commerce site, live.'),
    brief: [
      [L('Le problème', 'The problem'), L('Une entreprise de l’Aube sans boutique en ligne.', 'A company in the Aube with no online shop.')],
      [L('Ma part', 'My part'), L('En alternance : les maquettes Figma, le front-end et le back-end sur Odoo, le référencement.', 'As a work-study student: the Figma mockups, front end and back end on Odoo, SEO.')],
      [L('Le résultat', 'The result'), L('La boutique est en ligne après dix mois, des maquettes à la mise en production.', 'The shop went live after ten months, from mockups to production.')],
    ],
    setting: L('Alternance', 'Work-study'), org: 'Distri Sûr France, Troyes',
    period: L('Novembre 2023 à août 2024', 'November 2023 to August 2024'),
    team: L('Avec les équipes commerciales', 'With the sales teams'), role: L('Développeur Web Full Stack E-commerce', 'Full Stack E-commerce Web Developer'),
    stack: ['Odoo', 'Python', 'HTML', 'CSS', 'Figma', 'SEO'],
    links: [], private: L('Projet d’entreprise, pas de dépôt public.', 'Company project, no public repository.'),
    cover: { src: 'img/p/distri-sur-france/1.webp', alt: L('Le catalogue de la boutique Distri Sûr France', 'The Distri Sûr France shop catalogue') },
    story: {
      context: [L("Distri Sûr France vend du matériel de chauffage, de plomberie et d'électricité dans l'Aube. Pendant dix mois d'alternance, j'ai conçu et développé son site e-commerce, des premières maquettes jusqu'à la mise en ligne.",
        'Distri Sûr France sells heating, plumbing and electrical equipment in the Aube region. Over ten months of work-study, I designed and built its e-commerce site, from the first mockups to launch.')],
      problem: [L("L'entreprise n'avait pas de boutique en ligne : il fallait la concevoir, la développer et la mettre en production pendant l'alternance.",
        'The company had no online shop: it had to be designed, built and put into production during the work-study year.')],
      built: [
        { title: L('Le catalogue', 'The catalogue'), shot: { src: 'img/p/distri-sur-france/2.webp', alt: L('La catégorie bornes de recharge', 'The EV chargers category') },
          text: L('Le catalogue et les contenus intégrés dans Odoo, rangés par famille de produits.', 'The catalogue and content integrated in Odoo, sorted by product family.') },
        { title: L('La fiche produit', 'The product page'), shot: { src: 'img/p/distri-sur-france/3.webp', alt: L('Une fiche produit', 'A product page') },
          text: L('Les pages et le parcours d’achat dessinés dans Figma, validés avec les équipes métier.', 'The pages and checkout flow designed in Figma and approved with the business teams.') },
        { title: L('Sur mobile', 'On mobile'), shot: { src: 'img/p/distri-sur-france/m1.webp', phone: true, alt: L('La boutique sur téléphone', 'The shop on a phone') },
          text: L('La même boutique, pensée aussi pour le téléphone.', 'The same shop, designed for phones as well.') },
      ],
      decisions: [
        [L('Les maquettes d’abord', 'Mockups first'), L('Chaque page était dessinée dans Figma et validée par les équipes métier avant d’être développée.', 'Every page was designed in Figma and approved by the business teams before being built.')],
        [L('Odoo de bout en bout', 'Odoo end to end'), L('Le front-end et le back-end de la boutique sont développés sur Odoo, avec une intégration e-commerce complète.', 'The shop’s front end and back end are built on Odoo, with a full e-commerce integration.')],
        [L('Le référencement', 'Search'), L('Le travail sur le SEO pour que les produits soient trouvés.', 'SEO work so that the products can be found.')],
      ],
      result: {
        stats: [['10', L('mois, des maquettes à la mise en ligne', 'months, from mockups to launch')]],
        text: [L("La boutique est en ligne : c'est le site e-commerce officiel de l'entreprise.", 'The shop is live: it is the company’s official e-commerce site.')],
      },
      lessons: [L("Une bonne partie du travail a consisté à accorder les demandes des commerciaux avec ce qu'Odoo permettait, puis à vérifier que les clients s'y retrouvaient.",
        'Much of the work was reconciling what the sales team wanted with what Odoo allowed, then checking that customers could find their way.')],
    },
  },
  {
    slug: 'realite-virtuelle', title: L('Réalité virtuelle', 'Virtual reality'), emblem: 'saturne', shots: ['img/ziyad-vr.webp'], year: '2026', kind: 'ecole',
    kicker: L('Funfair VR et Hotel Murder VR, deux projets du Master. Ma part : des attractions, un menu à portails, le son, et une scène d’enquête.', 'Funfair VR and Hotel Murder VR, two Master’s projects. My part: attractions, a portal menu, the sound, and an investigation scene.'),
    outcome: L('Deux projets d’équipe, code public sur GitHub.', 'Two team projects, code public on GitHub.'),
    brief: [
      [L('Le problème', 'The problem'), L('En VR, tout doit se comprendre sans notice, en prenant les objets en main.', 'In VR, everything has to make sense without a manual, just by picking things up.')],
      [L('Ma part', 'My part'), L('Deux attractions, un menu à portails et le son de Funfair VR, la salle de sécurité de Hotel Murder VR.', 'Two attractions, a portal menu and the sound of Funfair VR, the security room of Hotel Murder VR.')],
      [L('Le résultat', 'The result'), L('Deux projets menés au bout, en Unity et C#, code public sur GitHub.', 'Two projects seen through, in Unity and C#, code public on GitHub.')],
    ],
    setting: L('Master Sciences et Technologies du Métavers', 'Master’s in Metaverse Science and Technology'), org: 'INSA Hauts-de-France',
    period: L('2025 à 2026', '2025 to 2026'),
    team: L('Projets de Master en équipe', 'Master’s team projects'), role: L('Développement Unity et C#, interactions VR, son', 'Unity and C# development, VR interactions, sound'),
    stack: ['Unity 2022.3', 'Unity 6', 'C#', 'URP', 'XR Interaction Toolkit', 'OpenXR', 'Meta Quest'],
    links: [[L('Code de Funfair VR', 'Funfair VR code'), 'https://github.com/Subdij/Project_VR'], [L('Code de Hotel Murder VR', 'Hotel Murder VR code'), 'https://github.com/Subdij/Hotel-Murder-Escape-game_VR']],
    cover: { src: 'img/ziyad-vr.webp', alt: L('Ziyad Chaabi présente un projet de réalité virtuelle, un Meta Quest 3 posé sur le bureau', 'Ziyad Chaabi presenting a virtual reality project, a Meta Quest 3 on the desk') },
    story: {
      context: [L("Deux projets du Master Sciences et Technologies du Métavers. Funfair VR : une fête foraine médiévale en cinq mini-jeux. Hotel Murder VR : un escape game d'enquête dans un hôtel, où chaque membre de l'équipe crée sa propre scène.",
        'Two projects from the Master’s in Metaverse Science and Technology. Funfair VR: a medieval fair with five mini-games. Hotel Murder VR: a detective escape game in a hotel, where each team member builds their own scene.')],
      problem: [L("En VR, il n'y a pas de place pour une notice. Tout doit se comprendre en prenant les objets en main, sans consigne à lire.",
        'In VR there is no room for a manual. Everything has to make sense once you pick things up, with nothing to read.')],
      built: [
        { title: L('Funfair VR, ma part', 'Funfair VR, my part'), shot: { src: 'img/ziyad-vr.webp', alt: L('En présentation à l’INSA, avec le Meta Quest 3', 'Presenting at INSA with the Meta Quest 3') },
          text: L('La piscine (dunk tank), le punching-ball, le menu VR à portails qui relie les scènes, la musique et les effets sonores.', 'The dunk tank, the punching bag, the VR portal menu linking the scenes, the music and the sound effects.') },
        { title: L('Hotel Murder VR, la salle de sécurité', 'Hotel Murder VR, the security room'), shot: { src: 'img/auto/hotel-murder-escape-game-vr/repo-1.png', alt: L('La configuration OpenXR du projet dans Unity', 'The project’s OpenXR setup in Unity') },
          text: L("Dans l'escape game à trois, ma scène est la salle de sécurité : des PNJ, une enquête et des énigmes variées.", 'In the three-person escape game, my scene is the security room: NPCs, an investigation and a mix of puzzles.') },
      ],
      decisions: [
        [L('Un menu qu’on traverse', 'A menu you walk through'), L('Le menu de Funfair VR est fait de portails : on passe d’une attraction à l’autre sans quitter le monde.', 'The Funfair VR menu is made of portals: you go from one attraction to the next without leaving the world.')],
        [L('La physique comme règle du jeu', 'Physics as the rules'), L('La piscine et le punching-ball reposent sur la physique de Unity : on vise, on lance, on frappe.', 'The dunk tank and the punching bag rely on Unity physics: you aim, you throw, you hit.')],
        [L('Deux versions de Unity', 'Two Unity versions'), L("Unity 2022.3 avec l'Universal Render Pipeline, XR Interaction Toolkit et OpenXR pour Funfair VR ; Unity 6 et XR Interaction Toolkit 3 pour Hotel Murder VR.", 'Unity 2022.3 with the Universal Render Pipeline, XR Interaction Toolkit and OpenXR for Funfair VR; Unity 6 and XR Interaction Toolkit 3 for Hotel Murder VR.')],
      ],
      result: {
        stats: [['5', L('mini-jeux dans Funfair VR', 'mini-games in Funfair VR')], ['6', L('scènes', 'scenes')]],
        text: [L('Le code des deux projets est public sur GitHub.', 'The code of both projects is public on GitHub.')],
      },
      lessons: [],
    },
  },
];

/* ---------- L'archive : les autres projets racontés à la main ---------- */
const others = [
  { slug: 'lolop', title: 'lolop', year: '2025', kind: 'perso', zone: 'mobile', stack: ['Java', 'Android', 'MVVM', 'Retrofit', 'SQLite'], links: [['GitHub', 'https://github.com/Subdij/lolop']],
    kicker: L('Un compagnon League of Legends pour Android. Ma partie : l’écran principal, le catalogue d’objets avec recherche, les notes de patch, la traduction FR/EN et les favoris.', 'A League of Legends companion for Android. My part: the main screen, the item catalogue with search, patch notes, the FR/EN translation and favourites.') },
  { slug: 'turaty-naturels', title: 'Turaty Naturels', year: '2025', kind: 'perso', zone: 'web', stack: ['Symfony 6', 'MySQL 8', 'Twig', 'Tailwind', 'Stripe', 'Docker'], links: [], private: true,
    kicker: L('Une boutique de cosmétiques bio construite et mise en ligne pour un proche au Canada : front, back et base de données, Stripe, PayPal, connexion Google, factures PDF.', 'An organic cosmetics shop built and launched for a relative in Canada: front end, back end and database, Stripe, PayPal, Google sign-in, PDF invoices.') },
  { slug: 'zabi', title: 'ZABI', year: '2025', kind: 'ecole', zone: 'jeux', stack: ['Node.js', 'Express 5', 'MongoDB'], links: [['GitHub', 'https://github.com/Subdij/ZABI']], img: { src: 'img/p/zabi/1.webp' },
    kicker: L('Un jeu de duel entre deux héros tirés parmi 731, en équipe de 4. Ma partie : tout le back-end, de l’import des héros aux statistiques, bonus et événements.', 'A duel game between two heroes drawn from 731, in a team of 4. My part: the whole back end, from importing the heroes to stats, bonuses and events.') },
  { slug: 'subchaine', title: 'SUBCHAINE', year: '2025', kind: 'ecole', zone: 'data', stack: ['Node.js', 'Socket.IO', 'crypto-js', 'elliptic'], links: [['GitHub', 'https://github.com/Subdij/BlockChain']], img: { src: 'img/p/subchaine/3.webp' },
    kicker: L('Un simulateur pour comprendre une blockchain en la manipulant : portefeuilles, signatures, minage.', 'A simulator to understand a blockchain by using it: wallets, signatures, mining.') },
  { slug: 'jpo-iut-meaux', title: L('JPO IUT de Meaux', 'IUT Meaux open day'), year: '2024', kind: 'ecole', zone: 'xr', stack: ['Blender', 'Unity', 'WebGL', 'Angular'], links: [], img: { src: 'img/p/jpo-iut-meaux/1.webp' },
    kicker: L('Le site des portes ouvertes du département MMI. Ma part : une salle de cours modélisée en 3D, visitable dans le navigateur.', 'The MMI department’s open-day site. My part: a classroom modelled in 3D, explorable in the browser.') },
  { slug: 'gestion-articles', title: L('Gestionnaire d’articles', 'Article manager'), year: '2024', kind: 'ecole', zone: 'web', stack: ['Symfony', 'PHP', 'Twig', 'MySQL'], links: [['GitHub', 'https://github.com/Subdij/Gestion_Recettes']], img: { src: 'img/p/gestion-articles/1.webp' },
    kicker: L('Mon premier vrai projet Symfony : un catalogue où seules les personnes connectées peuvent publier.', 'My first real Symfony project: a catalogue where only signed-in users can publish.') },
  { slug: 'reseau-sur-france', title: 'Réseau Sûr France', year: '2023', kind: 'pro', zone: 'pro', stack: ['WordPress', 'Figma', 'Photoshop', 'JavaScript'], links: [[L('Le site', 'Website'), 'https://reseausurfrance.fr']], img: { src: 'img/p/reseau-sur-france/1.webp' },
    kicker: L('Trois mois de stage pour livrer le site vitrine d’une entreprise d’électricité de l’Aube, dans sa charte.', 'A three-month internship to ship the website of an electrical company in the Aube, on brand.') },
  { slug: 'web-doc-artisans', title: L('Web-documentaire artisans', 'Craftspeople web documentary'), year: '2022', kind: 'ecole', zone: 'web', stack: ['Figma', 'Premiere Pro', 'HTML', 'CSS'], links: [[L('Le site', 'Website'), 'https://web-documentaire-artisant.netlify.app'], ['GitHub', 'https://github.com/Subdij/Web-documentaire-artisant']], img: { src: 'img/p/web-doc-artisans/1.webp' },
    kicker: L('Une ébéniste, une potière, un plumassier, un lapidaire : des métiers rares, racontés avec leurs mots.', 'A cabinetmaker, a potter, a featherworker, a gem cutter: rare crafts, told in their own words.') },
  { slug: 'pub-steel-ball-run', title: 'Pub Steel Ball Run', year: '2022', kind: 'ecole', zone: 'jeux', stack: ['After Effects'], links: [['YouTube', 'https://youtu.be/3-xCI2ds2RQ']], img: { src: 'img/p/pub-steel-ball-run/3.webp' },
    kicker: L('Une publicité animée de trente-cinq secondes pour un manga que j’adore.', 'A thirty-five-second animated ad for a manga I love.') },
];

// zone d'un projet ou d'un dépôt, pour l'archive
const zones = {
  pro: L('Au travail', 'At work'), mobile: 'Mobile', xr: L('Réalité virtuelle et 3D', 'VR and 3D'),
  web: 'Web', data: L('Données et algorithmes', 'Data and algorithms'), jeux: L('Jeux et vidéo', 'Games and video'),
};

// Descriptions écrites à la main pour les dépôts GitHub (prioritaires sur le README). Sans `repo` : dépôt privé.
const repos = [
  { n: 'GymBud', z: 'mobile', y: '2025', d: L("Une application pour trouver un partenaire d'entraînement : swipe, profils sportifs, messagerie.", 'An app to find a workout partner: swipe, sports profiles, messaging.'), s: ['React Native', 'Expo'] },
  { n: 'Facture Android', repo: 'Android_Facture', z: 'mobile', y: '2024', d: L('Mes débuts en Kotlin, autour de la facturation.', 'My first steps in Kotlin, around invoicing.'), s: ['Kotlin', 'Android'] },
  { n: 'Magasin VR', z: 'xr', y: '2025', d: L('Un showroom en réalité virtuelle pour se promener entre les produits.', 'A virtual reality showroom to walk among the products.'), s: ['Unity 6', 'C#'] },
  { n: 'JoJo Maze', repo: 'JOJO_MAZE', z: 'xr', y: '2025', d: L("Un labyrinthe 3D sous Unity, clin d'œil à JoJo's Bizarre Adventure.", "A 3D maze in Unity, a nod to JoJo's Bizarre Adventure."), s: ['Unity', 'C#'] },
  { n: 'FPS en three.js', repo: 'Test_FPS_three.js', z: 'xr', y: '2024', d: L('Un jeu de tir à la première personne dans le navigateur.', 'A first-person shooter in the browser.'), s: ['three.js', 'WebGL'] },
  { n: 'Bouton WebGL', repo: 'Webgl-Button', z: 'xr', y: '2024', d: L('Une scène Unity exportée en WebGL.', 'A Unity scene exported to WebGL.'), s: ['Unity', 'WebGL'] },
  { n: 'Scène 3D foot', repo: 'base_3D_foot_ref', z: 'xr', y: '2024', d: L("Base d'une scène 3D web servie par Node.", 'The base of a web 3D scene served by Node.'), s: ['three.js', 'Node.js'] },
  { n: 'Hôtel : gestion et paie', repo: 'Hotel-Paie', z: 'web', y: '2024', d: L('Gestion hôtelière et paie, à trois. Ma partie : l’API REST et le déploiement sur Azure.', 'Hotel management and payroll, as a team of three. My part: the REST API and the Azure deployment.'), s: ['PHP', 'MySQL', 'Tailwind'] },
  { n: 'AppScol', repo: 'app-scol', z: 'web', y: '2023', d: L('Une application scolaire en Angular 17.', 'A school app in Angular 17.'), s: ['Angular', 'TypeScript'] },
  { n: 'Gestion académique', repo: 'academic-management-system-ts', z: 'web', y: '2023', d: L('Étudiants, cours, notes et moyennes pondérées.', 'Students, courses, grades and weighted averages.'), s: ['TypeScript'] },
  { n: 'API REST employés', repo: 'API_REST-Employee-Management', z: 'web', y: '2023', d: L('Une API REST en PHP.', 'A REST API in PHP.'), s: ['PHP'] },
  { n: "Livre d'or", repo: 'Guest-Book', z: 'web', y: '2023', d: L("Un livre d'or en PHP.", 'A guest book in PHP.'), s: ['PHP'] },
  { n: 'Mini Twitter', repo: 'twitter', z: 'web', y: '2023', d: L('Un clone simplifié de Twitter.', 'A simplified Twitter clone.'), s: ['PHP', 'MySQL'] },
  { n: 'Salaire brut en net', repo: 'Calculateur-de-salaire-brut-en-net', z: 'web', y: '2023', d: L('Convertir un salaire brut en net, en direct.', 'Convert a gross salary to net, live.'), s: ['JavaScript'] },
  { n: "Calculateur d'IMC", repo: 'Calculateur-d-IMC', z: 'web', y: '2023', d: L('Calculer son indice de masse corporelle.', 'Work out your body mass index.'), s: ['JavaScript'] },
  { n: 'Site Minecraft', repo: 'Minecraft', z: 'web', y: '2023', d: L('Un site de fan : constructions et redstone.', 'A fan site: builds and redstone.'), s: ['HTML', 'Bootstrap'] },
  { n: 'Portfolio V2', repo: 'Portfolio-V2', z: 'web', y: '2023', d: L('Mon portfolio précédent, toujours en ligne.', 'My previous portfolio, still online.'), s: ['HTML', 'CSS'] },
  { n: 'Portfolio Next.js', repo: 'portfolio-2.0.1', z: 'web', y: '2023', d: L('Une version de portfolio en Next.js.', 'A portfolio version in Next.js.'), s: ['Next.js', 'Tailwind'] },
  { n: 'Prénoms et Hadoop', repo: 'mini-projet-hadoop', z: 'data', y: '2025', d: L('Les prénoms les plus donnés par décennie, données INSEE, Hadoop Streaming et Pig.', 'The most given first names by decade, INSEE data, Hadoop Streaming and Pig.'), s: ['Python', 'Hadoop', 'Pig'] },
  { n: 'QuizDown', repo: 'TP5_Quizz', z: 'data', y: '2024', d: L("Un quiz en Pygame, à cinq. J'étais responsable de l'architecture.", 'A quiz game in Pygame, as a team of five. I was in charge of the architecture.'), s: ['Python', 'Pygame'] },
  { n: 'Wifi auto', repo: 'wifi-connexion', z: 'data', y: '2025', d: L('Un script Selenium qui se reconnecte au portail wifi toutes les 3 h 30, parce qu’il me déconnectait sans arrêt.', 'A Selenium script that logs back into the wifi portal every 3.5 hours, because it kept kicking me out.'), s: ['Python', 'Selenium'] },
];
// Dépôts publics volontairement absents (doublons, tests vides, ce site). Lu par scripts/sync.mjs.
const skipRepos = ['Final-Portfolio-V.X', 'ziyad-chaabi.github.io', 'subdij', 'premierprojet_git', 'test_FPS', 'video', 'Hotel-Paiee'];

/* ---------- Accueil : expérience et formation (CV) ---------- */
const experience = [
  { period: L('Mars à oct. 2026', 'Mar. to Oct. 2026'), org: 'Iso Sûr France', role: 'Full Stack AI Engineer', where: L('Troyes, stage de fin d’études, développeur principal', 'Troyes, final-year internship, lead developer'), proof: 'btp-360',
    impact: L('Conçu, développé et mis en production seul BTP-360, qui remplace les fichiers Excel d’Iso Sûr France et de ses trois sociétés sœurs.', 'Designed, built and shipped BTP-360 on my own; it replaces the Excel files of Iso Sûr France and its three sister companies.'),
    stack: ['Angular', 'Ionic', 'NestJS', 'Prisma', 'PostgreSQL', 'AWS'] },
  { period: L('Nov. 2023 à août 2024', 'Nov. 2023 to Aug. 2024'), org: 'Distri Sûr France', role: L('Développeur Web Full Stack E-commerce', 'Full Stack E-commerce Web Developer'), where: L('Troyes, alternance de 10 mois', 'Troyes, 10-month work-study'), proof: 'distri-sur-france',
    impact: L('Créé le site e-commerce officiel de l’entreprise, des maquettes Figma à la mise en production sur Odoo.', 'Built the company’s official e-commerce site, from Figma mockups to production on Odoo.'),
    stack: ['Odoo', 'Python', 'Figma', 'SEO'] },
  { period: L('Avr. à juin 2023', 'Apr. to Jun. 2023'), org: 'Réseau Sûr France', role: L('Développeur Web Front-End', 'Front-End Web Developer'), where: L('Saint-André-les-Vergers, stage de 3 mois', 'Saint-André-les-Vergers, 3-month internship'), proof: 'reseau-sur-france',
    impact: L('Livré le nouveau site officiel de l’entreprise dans les délais du stage, dans sa charte graphique.', 'Shipped the company’s new official website within the internship, on brand.'),
    stack: ['WordPress', 'JavaScript', 'Figma', L('Suite Adobe', 'Adobe suite')] },
];
const education = [
  { period: '2024 à 2026', degree: L('Master Informatique, Sciences et Technologies du Métavers', 'Master’s in Computer Science, Metaverse Science and Technology'), school: 'INSA Hauts-de-France, Valenciennes' },
  { period: '2021 à 2024', degree: L('BUT Métiers du Multimédia et de l’Internet, parcours Développement web et dispositifs interactifs', 'Bachelor’s in Multimedia and Internet (BUT MMI), web development and interactive media'), school: 'IUT de Meaux, Université Gustave Eiffel' },
  { period: '2021', degree: L('Bac STI2D, option Systèmes d’information et numérique', 'Technology baccalaureate (STI2D), digital systems'), school: L('Lycée Saint-Joseph La Salle, Troyes', 'Saint-Joseph La Salle, Troyes') },
];

/* ---------- Stack : chaque outil relié aux projets qui le prouvent (étude de cas ou archive) ---------- */
// [nom, level, preuves, logo] : level prod (utilisé en production) | projet (sur des projets) ; logo = nom Simple Icons (scripts/icons.mjs)
const skills = [
  { group: L('Front et mobile', 'Front end and mobile'), items: [
    ['Angular', 'prod', ['btp-360'], 'angular'], ['Ionic', 'prod', ['btp-360'], 'ionic'], ['NgRx', 'prod', ['btp-360'], 'ngrx'], ['Capacitor', 'prod', ['btp-360'], 'capacitor'],
    ['TypeScript', 'prod', ['btp-360', 'subforge'], 'typescript'], ['RxJS', 'prod', ['btp-360'], 'reactivex'], ['React Native', 'projet', ['subforge'], 'react'], ['Expo', 'projet', ['subforge'], 'expo'],
    ['Tailwind', 'projet', ['turaty-naturels'], 'tailwindcss'], [L('Android (Java)', 'Android (Java)'), 'projet', ['lolop'], 'android'], ['Kotlin', 'projet', ['android-facture'], 'kotlin'],
  ] },
  { group: L('Back-end et données', 'Back end and data'), items: [
    ['NestJS', 'prod', ['btp-360'], 'nestjs'], ['Prisma', 'prod', ['btp-360'], 'prisma'], ['PostgreSQL', 'prod', ['btp-360', 'subforge'], 'postgresql'], ['Socket.IO', 'prod', ['btp-360', 'subchaine'], 'socketdotio'],
    ['Supabase', 'projet', ['subforge'], 'supabase'], ['Node.js', 'projet', ['zabi', 'subchaine'], 'nodedotjs'], ['MongoDB', 'projet', ['zabi'], 'mongodb'],
    ['Symfony', 'projet', ['turaty-naturels', 'gestion-articles'], 'symfony'], ['MySQL', 'projet', ['turaty-naturels', 'gestion-articles'], 'mysql'], ['Odoo', 'prod', ['distri-sur-france'], 'odoo'], ['Python', 'projet', ['mini-projet-hadoop', 'wifi-connexion'], 'python'],
  ] },
  { group: L('IA appliquée', 'Applied AI'), items: [
    [L('Agents de code (Claude Code, Codex)', 'Coding agents (Claude Code, Codex)'), 'prod', ['btp-360'], 'claude'], [L('Revue du code généré par IA', 'Reviewing AI-generated code'), 'prod', ['btp-360']],
    [L('Workflow multi-agents', 'Multi-agent workflow'), 'prod', ['btp-360']], ['MCP', 'prod', ['btp-360']], [L('OCR local (ML Kit, PaddleOCR, Tesseract.js)', 'Local OCR (ML Kit, PaddleOCR, Tesseract.js)'), 'prod', ['btp-360']],
    [L('Intégration de LLM (Gemini)', 'LLM integration (Gemini)'), 'projet', ['subforge'], 'googlegemini'],
  ] },
  { group: L('Mise en production et qualité', 'Shipping and quality'), items: [
    ['Docker', 'prod', ['btp-360', 'turaty-naturels'], 'docker'], ['AWS', 'prod', ['btp-360'], 'amazonwebservices'], ['Terraform', 'prod', ['btp-360'], 'terraform'], ['GitHub Actions', 'prod', ['btp-360'], 'githubactions'],
    ['Playwright', 'prod', ['btp-360']], ['Jest', 'projet', ['subforge'], 'jest'], ['Sentry', 'prod', ['btp-360', 'subforge'], 'sentry'], ['Azure', 'projet', ['hotel-paie']],
  ] },
  { group: L('Réalité virtuelle et 3D', 'VR and 3D'), items: [
    ['Unity', 'projet', ['realite-virtuelle', 'jpo-iut-meaux'], 'unity'], ['C#', 'projet', ['realite-virtuelle']], ['XR Interaction Toolkit', 'projet', ['realite-virtuelle']],
    ['OpenXR', 'projet', ['realite-virtuelle']], ['Blender', 'projet', ['jpo-iut-meaux'], 'blender'],
  ] },
  { group: L('Design et méthode', 'Design and method'), items: [
    [L('UX et UI', 'UX and UI'), 'prod', ['btp-360', 'subforge', 'distri-sur-france']], ['Figma', 'prod', ['distri-sur-france', 'reseau-sur-france'], 'figma'],
    [L('Suite Adobe', 'Adobe suite'), 'prod', ['reseau-sur-france', 'pub-steel-ball-run'], 'adobe'], [L('RGPD', 'GDPR'), 'prod', ['btp-360']], ['SEO', 'prod', ['distri-sur-france']],
  ] },
];

/* ---------- À propos ---------- */
/* ---------- À propos : trois paragraphes (qui, ce que je cherche, d'où je viens) ---------- */
const about = [
  L("Je suis ingénieur développeur full stack, diplômé du Master Informatique de l'INSA Hauts-de-France. J'écris surtout du TypeScript : Angular et Ionic côté client, NestJS et PostgreSQL côté serveur, et du React Native pour le mobile.",
    'I am a full stack software engineer with a Master’s in Computer Science from INSA Hauts-de-France. I mostly write TypeScript: Angular and Ionic on the client, NestJS and PostgreSQL on the server, and React Native for mobile.'),
  L("Avant le code, il y a eu le design : trois ans de BUT MMI à Meaux. J'y ai pris l'habitude de tester une interface avec les gens qui vont s'en servir. Puis BTP-360 : pendant mon stage de fin d'études, seul, une application en production pour quatre sociétés.",
    'Before code, there was design: three years of a multimedia degree in Meaux. That is where I got used to testing an interface with the people who will use it. Then BTP-360: during my final-year internship, on my own, an app in production for four companies.'),
  L("Aujourd'hui, je cherche mon premier CDI. Je suis à Troyes, prêt à déménager, et ouvert à l'hybride comme au télétravail.",
    'Now I am looking for my first permanent role. I am based in Troyes, ready to relocate, and open to hybrid or remote work.'),
];

const method = [
  [L('Partir des gens', 'Start with people'), L("Je pense d'abord à ceux qui vont se servir de l'outil, sur un chantier ou un casque VR sur la tête, et seulement ensuite à la stack. Le BUT MMI m'a appris à tester une interface avec les personnes qui vont s'en servir.",
    'I think first about the people who will use the tool, on a building site or with a VR headset on, and only then about the stack. My design degree taught me to test an interface with the people who will use it.')],
  [L('Tout écrire', 'Write everything down'), L('La documentation, les décisions, les tests. Seul sur BTP-360, c’est ce qui m’a permis d’aller vite sans casser ce qui marchait déjà.',
    'Documentation, decisions, tests. Alone on BTP-360, that is what let me move fast without breaking what already worked.')],
  [L('L’IA écrit vite, je décide', 'The AI writes fast, I decide'), L("Je code avec des agents (Claude Code, Codex). Je cadre le besoin, j'écris la spécification, je relis chaque diff comme celui d'un collègue et je décide de ce qui part en production.",
    'I code with agents (Claude Code, Codex). I frame the need, write the spec, review every diff like a colleague’s, and decide what goes to production.')],
];

const timeline = [
  { year: '2021', place: 'Troyes', title: L('Le déclic', 'The spark'), text: L("Bac STI2D, option Systèmes d'information et numérique, au lycée Saint-Joseph La Salle. J'y écris mes premiers programmes.", 'A technology baccalaureate (STI2D, digital systems option) at Saint-Joseph La Salle. I write my first programs there.') },
  { year: '2021', place: 'Meaux', title: L('Le détour par le design', 'The design detour'), text: L("Trois ans à Meaux pour un BUT MMI : code, UX, vidéo, graphisme.", 'Three years in Meaux for a multimedia degree: code, UX, video, graphic design.') },
  { year: '2022', place: 'Troyes', title: L('Mon premier outil métier', 'My first business tool'), avis: 'karima', text: L("Deux mois d'assistant administratif chez Ophta Médical. En voyant le planning de l'équipe, j'ai construit un tableau qui calcule les heures et les heures supplémentaires de chacun.", 'Two months as an admin assistant at Ophta Médical. Looking at the team’s schedule, I built a sheet that works out everyone’s hours and overtime.') },
  { year: '2023', place: 'Saint-André-les-Vergers', title: L('Premier site livré en entreprise', 'First website shipped at a company'), avis: 'juliana', link: 'reseau-sur-france', text: L("Trois mois chez Réseau Sûr France pour livrer leur nouveau site, avec l'équipe marketing et des demandes qui changent jusqu'au bout.", 'Three months at Réseau Sûr France to ship their new website, with the marketing team and requests that changed until the very end.') },
  { year: '2023', place: 'Troyes', title: L("Dix mois d'e-commerce", 'Ten months of e-commerce'), link: 'distri-sur-france', text: L("En alternance chez Distri Sûr France, j'ai conçu et développé la boutique en ligne, des maquettes Figma à la mise en ligne sur Odoo.", 'As a work-study student at Distri Sûr France, I designed and built the online shop, from Figma mockups to launch on Odoo.') },
  { year: '2024', place: 'Valenciennes', title: L('Cap sur le métavers', 'Heading for the metaverse'), link: 'realite-virtuelle', text: L("Master Sciences et Technologies du Métavers à l'INSA Hauts-de-France : réalité virtuelle, IA, mobile, blockchain, big data. Et l'équipe e-sport de l'école entre deux rendus.", 'A Master’s in Metaverse Science and Technology at INSA Hauts-de-France: VR, AI, mobile, blockchain, big data. And the school’s esports team between deadlines.') },
  { year: '2026', place: 'Troyes', title: L('BTP-360, seul aux commandes', 'BTP-360, on my own'), link: 'btp-360', text: L("Stage de fin d'études chez Iso Sûr France : remplacer les fichiers Excel de quatre sociétés par une seule application, web et Android, en production sur AWS.", 'Final-year internship at Iso Sûr France: replacing the Excel files of four companies with a single app, web and Android, in production on AWS.') },
  { year: '2026', place: 'Troyes', title: L('Et maintenant', 'And now'), link: 'subforge', text: L("Diplômé, de retour à Troyes, je cherche mon premier CDI de développeur full stack. SubForge avance en parallèle.", 'Graduated and back in Troyes, I am looking for my first permanent full stack role. SubForge keeps moving on the side.') },
];

const avis = {
  juliana: { name: 'Juliana Rebelo', role: L('Assistante marketing et communication, ma tutrice chez Réseau Sûr France', 'Marketing and communications assistant, my supervisor at Réseau Sûr France'),
    text: L('Ziyad a su mettre en avant ses compétences et son savoir-faire tout au long de son stage. Il s’est adapté très rapidement à l’entreprise, à sa charte graphique ainsi qu’à son fonctionnement.',
      'Ziyad showed his skills and know-how throughout his internship. He adapted very quickly to the company, its brand guidelines and the way it works.') },
  karima: { name: 'Karima Ghezza', role: L('Orthoptiste chez Ophta Médical, Troyes', 'Orthoptist at Ophta Médical, Troyes'),
    text: L('Il nous a apporté des idées pour compléter notre planning du personnel, en créant un tableau qui permet de calculer les heures de travail journalières et de visualiser les heures supplémentaires de chaque employé.',
      'He brought us ideas to complete our staff schedule, creating a sheet that calculates daily working hours and shows each employee’s overtime.') },
};

const offscreen = L(
  'Hors de l’écran : l’e-sport en semi-pro avec l’équipe de l’INSA, la guitare et le chant, la photo, la musculation (d’où SubForge) et les mangas, JoJo’s Bizarre Adventure en tête (assez pour en tirer une pub animée).',
  'Away from the screen: semi-pro esports with the INSA team, guitar and singing, photography, weight training (hence SubForge) and manga, JoJo’s Bizarre Adventure first (enough to make an animated ad).');

const languages = [[L('Français', 'French'), L('bilingue', 'bilingual')], [L('Arabe', 'Arabic'), L('langue maternelle', 'native')], [L('Anglais', 'English'), 'C1'], [L('Espagnol', 'Spanish'), L('notions', 'basic')]];

/* ---------- Veille ---------- */
const notes = [
  [L('Les agents de code, oui, mais tenus en laisse', 'Coding agents, yes, but on a leash'), L("J'ai codé BTP-360 avec Claude Code et Codex. Ce qui a marché : des règles projet écrites, des tests partout et une relecture de chaque changement.", 'I built BTP-360 with Claude Code and Codex. What worked: written project rules, tests everywhere and a review of every change.')],
  [L('MCP pour brancher des outils à un modèle', 'MCP to plug tools into a model'), L("Un protocole commun pour donner à un modèle l'accès à une base, un navigateur ou un outil métier. Je l'utilise tous les jours et je regarde comment l'appliquer à des logiciels d'entreprise.", 'A common protocol to give a model access to a database, a browser or a business tool. I use it every day and I am looking at how to apply it to business software.')],
  [L('L’IA propose, l’humain valide', 'The AI proposes, the human decides'), L("Dans BTP-360, si un agent ne sait pas m'expliquer sa logique, le changement n'est pas gardé. Dans SubForge, rien n'est enregistré sans l'accord de la personne.", 'In BTP-360, if an agent cannot explain its logic to me, the change is not kept. In SubForge, nothing is saved without the person’s consent.')],
];

window.ZC = { site, profile, cases, others, zones, repos, skipRepos, experience, education, skills, about, method, timeline, avis, offscreen, languages, notes };
