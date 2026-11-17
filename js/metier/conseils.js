// =====================================================================
// Règles et conseils : temps de récupération, erreurs à éviter, échauffement
// ---------------------------------------------------------------------
// Fonctions pures, testées par tests/conseils.test.js.
// Ce sont des repères courants en salle, pas l'avis d'un coach.
// =====================================================================

// ---------- Temps de récupération ----------

/**
 * Catégories d'effort et leur temps de repos par défaut (en secondes).
 * L'utilisateur peut changer chaque catégorie (Réglages) et chaque exercice (ses options).
 */
export const CATEGORIES_RECUP = [
  { id: 'lourd', nom: 'Gros exercice à la barre', exemple: 'squat, soulevé de terre, développé couché barre', defaut: 150 },
  { id: 'base', nom: 'Autre exercice de base', exemple: 'haltères, machines, tractions, dips, presse', defaut: 120 },
  { id: 'isolation', nom: 'Isolation', exemple: 'curl, extensions, élévations, leg extension', defaut: 75 },
  { id: 'court', nom: 'Mollets, abdos, gainage', exemple: 'mollets, relevés de jambes, planche', defaut: 45 },
  { id: 'haltero', nom: 'Haltérophilie', exemple: 'arraché, épaulé-jeté et leurs éducatifs', defaut: 150 },
];

const LOURD = new Set(['dc-barre', 'squat-barre', 'souleve-terre']);
const COURT = new Set(['mollets-debout', 'mollets-assis', 'mollets-presse', 'mollets-marche', 'tibialis', 'planche', 'releve-jambes', 'crunch-poulie']);
const ISOLATION = new Set([
  'pec-deck', 'ecarte-poulie', 'elevations-laterales', 'elevations-poulie', 'oiseau', 'triceps-poulie', 'triceps-barre-poulie',
  'barre-front', 'extension-nuque', 'pull-over', 'face-pull', 'shrugs', 'curl-barre', 'curl-halteres', 'curl-marteau',
  'curl-pupitre', 'curl-poulie', 'curl-incline', 'leg-extension', 'leg-curl', 'leg-curl-assis', 'abducteurs', 'adducteurs',
]);

/** Catégorie de récup d'un exercice (voir CATEGORIES_RECUP). */
export function categorieRecup(def) {
  if (def.type === 'haltero') return 'haltero';
  if (LOURD.has(def.id)) return 'lourd';
  if (COURT.has(def.id) || def.famille === 'gainage') return 'court';
  if (ISOLATION.has(def.id)) return 'isolation';
  return 'base';
}

/** Temps de la règle pour une catégorie, en tenant compte du réglage de l'utilisateur. */
export function recupCategorie(cat, recupCat = {}) {
  return recupCat[cat] ?? CATEGORIES_RECUP.find((c) => c.id === cat).defaut;
}

/**
 * Temps de repos après une série de cet exercice, en secondes.
 * Ordre de priorité : réglage propre à l'exercice, puis réglage de la catégorie, puis la règle.
 * @param reglages  { recupExo: { id: s }, recupCat: { categorie: s } } (les données enregistrées conviennent)
 */
export function dureeRecup(def, reglages = {}) {
  return reglages.recupExo?.[def.id] ?? recupCategorie(categorieRecup(def), reglages.recupCat);
}

/** Bornes et pas des réglages de récup, en secondes. */
export const RECUP_MIN = 15;
export const RECUP_MAX = 600;
export const RECUP_PAS = 15;

// ---------- Erreurs à éviter (affichées pendant la récup) ----------

export const ERREURS = {
  'dc-barre': 'Décoller les fesses du banc ou faire rebondir la barre sur la poitrine.',
  'dc-halteres': 'Laisser les haltères partir trop bas et trop écartés : garde les coudes sous les poignets.',
  'dc-smith': 'Descendre la barre sur le cou : place le banc pour qu’elle arrive au bas des pecs.',
  'incline-barre': 'Un banc trop incliné (plus de 45°) : ce sont alors surtout les épaules qui travaillent.',
  'incline-halteres': 'Écarter les coudes à 90° du buste : garde-les vers 45° pour protéger les épaules.',
  'machine-pecs': 'Laisser les épaules remonter vers les oreilles en poussant.',
  'machine-inclinee': 'Un siège trop bas : les poignées doivent arriver à hauteur du haut des pecs.',
  'pec-deck': 'Plier puis tendre les bras pendant le mouvement : garde le même angle de coude.',
  'ecarte-poulie': 'Transformer l’écarté en développé en pliant les bras de plus en plus.',
  dips: 'Descendre trop bas en fin de série : arrête-toi quand les épaules passent sous les coudes.',
  pompes: 'Laisser le bassin s’affaisser : gaine les abdos et les fessiers.',
  'developpe-militaire': 'Cambrer fortement le bas du dos pour finir la répétition.',
  'militaire-barre': 'Pousser la barre vers l’avant : elle doit monter à la verticale, la tête passe sous la barre.',
  'machine-epaules': 'Descendre les poignées trop bas derrière la tête.',
  'elevations-laterales': 'Prendre de l’élan avec le buste : monte lentement, jusqu’à l’horizontale seulement.',
  'elevations-poulie': 'Hausser l’épaule en tirant : garde-la basse, loin de l’oreille.',
  oiseau: 'Serrer les omoplates à fond : le travail vient de l’arrière d’épaule, pas du milieu du dos.',
  'triceps-poulie': 'Laisser les coudes avancer : ils restent collés au corps, seul l’avant-bras bouge.',
  'triceps-barre-poulie': 'Se pencher sur la barre pour pousser avec le poids du corps.',
  'barre-front': 'Écarter les coudes : garde-les parallèles et descends la barre vers le front lentement.',
  'extension-nuque': 'Écarter les coudes et cambrer le dos : serre les abdos.',
  'machine-dips': 'Hausser les épaules en poussant : garde-les basses.',
  'tirage-vertical': 'Tirer la barre derrière la nuque ou se balancer en arrière pour la descendre.',
  'tirage-vertical-serre': 'Tirer avec les bras : pense à descendre les coudes vers les hanches.',
  tractions: 'Faire des demi-répétitions : descends bras presque tendus à chaque fois.',
  'tirage-horizontal': 'Se balancer d’avant en arrière : le buste reste fixe, ce sont les bras et le dos qui tirent.',
  'rowing-barre': 'Arrondir le bas du dos : garde le dos plat et la barre près des cuisses.',
  'rowing-haltere': 'Tourner le buste pour monter l’haltère : les épaules restent parallèles au banc.',
  'rowing-machine': 'Décoller la poitrine de l’appui pour tricher.',
  'pull-over': 'Plier les coudes pour tirer avec les triceps : bras presque tendus du début à la fin.',
  'face-pull': 'Une charge trop lourde qui fait reculer le buste : c’est un exercice de précision.',
  'souleve-terre': 'Arrondir le dos ou éloigner la barre des jambes : elle frôle les tibias tout du long.',
  shrugs: 'Faire rouler les épaules : monte et descends simplement, à la verticale.',
  'curl-barre': 'Balancer le buste pour monter la barre : les coudes restent fixes le long du corps.',
  'curl-halteres': 'Laisser les coudes avancer en montant.',
  'curl-marteau': 'Monter trop vite et redescendre sans contrôle.',
  'curl-pupitre': 'Tendre complètement et brusquement le bras en bas : contrôle la descente.',
  'curl-poulie': 'Reculer les coudes pour finir le mouvement.',
  'curl-incline': 'Avancer les épaules pour aider : la tête et le dos restent collés au dossier.',
  'squat-barre': 'Laisser les genoux rentrer vers l’intérieur ou décoller les talons.',
  'squat-smith': 'Mettre les pieds sous la barre : avance-les un peu pour garder le dos droit.',
  'hack-squat': 'Décoller les talons ou le bas du dos de la machine en bas du mouvement.',
  presse: 'Descendre si bas que le bas du dos se décolle du dossier, ou verrouiller les genoux en haut.',
  fentes: 'Un pas trop court qui fait passer le genou loin devant le pied.',
  bulgare: 'Pousser avec la jambe arrière : elle sert seulement d’appui.',
  'leg-extension': 'Donner un coup de pied pour monter : monte en contrôle et marque une pause en haut.',
  rdl: 'Plier les genoux comme un squat : c’est le bassin qui recule, les genoux restent presque fixes.',
  'leg-curl': 'Décoller le bassin du banc pour aider.',
  'leg-curl-assis': 'Remonter trop vite et laisser la charge retomber.',
  'hip-thrust': 'Cambrer le bas du dos en haut : finis avec les fessiers serrés, le menton rentré.',
  abducteurs: 'Pencher le buste en avant pour pousser plus lourd.',
  adducteurs: 'Lâcher la charge au retour : contrôle l’ouverture.',
  'mollets-debout': 'Faire des petits rebonds : descends talons bas, monte au maximum, marque une pause.',
  'mollets-assis': 'Une amplitude trop courte : descends complètement à chaque répétition.',
  'mollets-presse': 'Plier les genoux pour pousser : les jambes restent tendues, seules les chevilles bougent.',
  'mollets-marche': 'Aller trop vite : 1 seconde en haut, descente lente.',
  tibialis: 'Balancer les jambes : seules les pointes de pied montent.',
  planche: 'Fesses trop hautes ou bassin qui s’affaisse : corps aligné de la tête aux talons.',
  'releve-jambes': 'Se balancer pour monter les jambes : enroule le bassin, lentement.',
  'crunch-poulie': 'Tirer avec les bras : ce sont les abdos qui enroulent le buste vers le bas.',
  arrache: 'Tirer avec les bras trop tôt : les bras restent tendus jusqu’à l’extension des hanches.',
  'arrache-suspension': 'Démarrer en pliant les bras : la poussée vient des hanches.',
  'epaule-jete': 'Recevoir la barre sur les mains au lieu des épaules : coudes hauts et vite devant.',
  'power-clean': 'Tirer en arrière avec le dos : la barre monte près du corps, coudes hauts.',
  'tirage-arrache': 'Plier les bras avant d’avoir fini la poussée des jambes.',
  'tirage-epaule': 'Sauter vers l’arrière : la poussée est verticale.',
  'squat-avant': 'Laisser tomber les coudes : la barre glisse et le buste penche en avant.',
  'squat-arriere': 'Descendre vite et sans contrôle en bas : garde le dos gainé.',
  'overhead-squat': 'Laisser la barre partir vers l’avant : elle reste au-dessus du milieu du pied.',
  'push-press': 'Plier les jambes trop bas : c’est une impulsion courte, pas un squat.',
};

/** Erreur fréquente pour un exercice ('' si non renseignée). */
export function erreurAEviter(id) {
  return ERREURS[id] || '';
}

// ---------- Échauffement : un exercice à part, léger, adapté à la séance ----------

export const ECHAUFFEMENTS = {
  push: { nom: 'Pompes', dessin: 'pompes', series: 2, consigne: '10 pompes faciles, sur les genoux si besoin', pourquoi: 'Prépare épaules, coudes et poignets' },
  pull: { nom: 'Tirage horizontal léger', dessin: 'tirage-h', series: 2, consigne: '15 répétitions avec une charge très légère', pourquoi: 'Réveille le dos et les épaules' },
  jambes: { nom: 'Squat au poids du corps', dessin: 'squat-pdc', series: 2, consigne: '15 squats lents, bras devant', pourquoi: 'Prépare hanches, genoux et chevilles' },
};

/**
 * Échauffement adapté à la séance : selon son type (push, pull, jambes),
 * ou, pour une séance personnalisée, selon la famille la plus présente.
 * @param familles  familles des exercices de la séance ('push', 'pull', 'jambes', 'gainage', 'haltero')
 * @returns la clé de ECHAUFFEMENTS
 */
export function echauffementPour(seanceId, familles) {
  if (ECHAUFFEMENTS[seanceId]) return seanceId;
  const compte = {};
  for (const f of familles) {
    // Haltérophilie et gainage sollicitent surtout le bas du corps et le tronc.
    const k = f === 'haltero' || f === 'gainage' ? 'jambes' : f;
    if (ECHAUFFEMENTS[k]) compte[k] = (compte[k] || 0) + 1;
  }
  const tri = Object.entries(compte).sort((a, b) => b[1] - a[1]);
  return tri.length ? tri[0][0] : 'jambes';
}
