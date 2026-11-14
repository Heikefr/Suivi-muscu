// Catalogue des exercices et programmes de séances.
// Aucune donnée personnelle ici : l'historique vit uniquement sur le téléphone.

export const GROUPES = ['Pecs', 'Épaules', 'Triceps', 'Dos', 'Biceps', 'Cuisses', 'Mollets et tibias'];

// increment : pas d'augmentation de charge proposé (kg).
// materiel 'halteres' : la charge affichée est par haltère.
// poidsDuCorps : pas de charge à saisir.
export const EXERCICES = [
  {
    id: 'dc-halteres', nom: 'Développé couché haltères', groupe: 'Pecs',
    muscles: 'Pecs · triceps · épaules', materiel: 'halteres', increment: 2, dessin: 'couche',
    conseil: "Omoplates serrées contre le banc. Descends les haltères à la poitrine en 2 secondes, coudes à 45°.",
    alternatives: ['machine-pecs', 'incline-halteres'], alias: ['developpe couche halteres', 'developpe couche'],
  },
  {
    id: 'incline-halteres', nom: 'Développé incliné haltères', groupe: 'Pecs',
    muscles: 'Haut des pecs · épaules', materiel: 'halteres', increment: 2, dessin: 'incline',
    conseil: "Banc à 30° maximum. Pousse vers le haut sans cogner les haltères, garde les épaules basses.",
    alternatives: ['machine-inclinee', 'dc-halteres'], alias: ['developpe incline halteres', 'developpe incline'],
  },
  {
    id: 'machine-pecs', nom: 'Machine guidée pecs', groupe: 'Pecs',
    muscles: 'Pecs · triceps', materiel: 'machine', increment: 5, dessin: 'machine-pecs',
    conseil: "Poignées à hauteur de poitrine. Pousse sans verrouiller les coudes, retour lent.",
    alternatives: ['dc-halteres', 'machine-inclinee'],
    alias: ['machine guidee pecs', 'machine guidee pectoraux', 'technogym pectoral machine'],
  },
  {
    id: 'machine-inclinee', nom: 'Machine inclinée guidée', groupe: 'Pecs',
    muscles: 'Haut des pecs · épaules', materiel: 'machine', increment: 5, dessin: 'machine-inclinee',
    conseil: "Dos plaqué au dossier. Pousse vers le haut et l'avant, contrôle la descente sur 2 secondes.",
    alternatives: ['incline-halteres'], alias: ['machine inclinee guidee', 'machine inclinee'],
  },
  {
    id: 'pec-deck', nom: 'Pec deck', groupe: 'Pecs',
    muscles: 'Pecs', materiel: 'machine', increment: 5, dessin: 'ecarte',
    conseil: "Coudes légèrement fléchis et fixes. Ramène les bras devant toi et tiens 1 seconde.",
    alternatives: ['machine-pecs'], alias: ['pec fly / pec deck', 'pec fly', 'pec deck'],
  },
  {
    id: 'developpe-militaire', nom: 'Développé militaire haltères', groupe: 'Épaules',
    muscles: 'Épaules · triceps', materiel: 'halteres', increment: 2, dessin: 'militaire',
    conseil: "Assis, dos contre le dossier. Pousse au-dessus de la tête sans cambrer, redescends aux oreilles.",
    alternatives: ['elevations-laterales'], alias: ['developpe militaire'],
  },
  {
    id: 'elevations-laterales', nom: 'Élévations latérales', groupe: 'Épaules',
    muscles: 'Épaules (côté)', materiel: 'halteres', increment: 2, dessin: 'elevation',
    conseil: "Monte les bras sur les côtés jusqu'à l'horizontale, coudes un peu fléchis. Pas d'élan.",
    alternatives: ['developpe-militaire'], alias: ['elevations laterales'],
  },
  {
    id: 'triceps-poulie', nom: 'Extension triceps poulie', groupe: 'Triceps',
    muscles: 'Triceps', materiel: 'poulie', increment: 2.5, dessin: 'triceps',
    conseil: "Coudes collés au corps et immobiles. Tends complètement les bras, remonte lentement.",
    alternatives: [], alias: ['extension triceps poulie', 'triceps poulie'],
  },
  {
    id: 'tirage-horizontal', nom: 'Tirage horizontal', groupe: 'Dos',
    muscles: 'Dos · biceps', materiel: 'poulie', increment: 5, dessin: 'tirage-h',
    conseil: "Buste droit, tire les coudes vers l'arrière et serre les omoplates 1 seconde. Pas de balancier.",
    alternatives: ['tirage-vertical'], alias: ['tirage horizontal'],
  },
  {
    id: 'tirage-vertical', nom: 'Tirage vertical', groupe: 'Dos',
    muscles: 'Grand dorsal · biceps', materiel: 'poulie', increment: 5, dessin: 'tirage-v',
    conseil: "Tire la barre vers le haut de la poitrine en sortant la poitrine. Remonte en contrôlant.",
    alternatives: ['tirage-horizontal'], alias: ['tirage vertical'],
  },
  {
    id: 'face-pull', nom: 'Face pull', groupe: 'Dos',
    muscles: "Arrière d'épaule · haut du dos", materiel: 'poulie', increment: 2.5, dessin: 'face-pull',
    conseil: "Corde à hauteur du visage. Tire vers le front en écartant les mains, coudes hauts.",
    alternatives: ['tirage-horizontal'], alias: ['face pull'],
  },
  {
    id: 'curl-pupitre', nom: 'Curl biceps au pupitre', groupe: 'Biceps',
    muscles: 'Biceps', materiel: 'machine', increment: 2.5, dessin: 'curl',
    conseil: "Bras à plat sur le pupitre. Monte sans décoller les coudes, descends presque bras tendus.",
    alternatives: ['curl-poulie'], alias: ['biceps pupitre', 'curl pupitre', 'curl biceps pupitre'],
  },
  {
    id: 'curl-poulie', nom: 'Curl biceps poulie', groupe: 'Biceps',
    muscles: 'Biceps', materiel: 'poulie', increment: 2.5, dessin: 'curl',
    conseil: "Debout, coudes fixes le long du corps. Monte en serrant les biceps, sans bouger le buste.",
    alternatives: ['curl-pupitre'], alias: ['curl biceps barre / poulie', 'curl biceps poulie', 'curl poulie'],
  },
  {
    id: 'presse', nom: 'Presse à cuisses (pieds hauts)', groupe: 'Cuisses',
    muscles: 'Fessiers · ischios · quadriceps', materiel: 'machine', increment: 10, dessin: 'presse',
    conseil: "Pieds hauts, largeur d'épaules. Descends jusqu'à 90° aux genoux sans décoller le bas du dos.",
    alternatives: ['leg-extension'], alias: ['presse a cuisses (pieds hauts)', 'presse a cuisses'],
  },
  {
    id: 'leg-extension', nom: 'Leg extension', groupe: 'Cuisses',
    muscles: 'Quadriceps', materiel: 'machine', increment: 5, dessin: 'leg-ext',
    conseil: "Genou aligné avec l'axe de la machine. Tends complètement, tiens 1 seconde, redescends lentement.",
    alternatives: ['presse'], alias: ['leg extension'],
  },
  {
    id: 'leg-curl', nom: 'Leg curl allongé', groupe: 'Cuisses',
    muscles: 'Ischio-jambiers', materiel: 'machine', increment: 5, dessin: 'leg-curl',
    conseil: "Hanches collées au banc. Ramène les talons vers les fesses, redescends en 2 secondes.",
    alternatives: [], alias: ['leg curl allonge', 'leg curl'],
  },
  {
    id: 'mollets-assis', nom: 'Mollets assis', groupe: 'Mollets et tibias',
    muscles: 'Soléaire', materiel: 'machine', increment: 5, dessin: 'mollets',
    conseil: "Monte le plus haut possible sur la pointe, tiens 1 seconde, descends talon bas pour étirer.",
    alternatives: ['mollets-marche'], alias: ['mollets assis (hammer)', 'mollets assis'],
  },
  {
    id: 'mollets-marche', nom: 'Mollets sur marche', groupe: 'Mollets et tibias',
    muscles: 'Soléaire', materiel: 'corps', poidsDuCorps: true, increment: 0, dessin: 'mollets-marche',
    conseil: "Sur une jambe, genou un peu fléchi. Monte sur la pointe et descends lentement sous la marche.",
    alternatives: ['mollets-assis'], alias: ['extensions mollets sur marche', 'mollets sur marche'],
  },
  {
    id: 'tibialis', nom: 'Tibialis raises', groupe: 'Mollets et tibias',
    muscles: 'Tibial antérieur', materiel: 'corps', poidsDuCorps: true, increment: 0, dessin: 'tibialis',
    conseil: "Dos contre le mur, pieds avancés. Relève les pointes au maximum, redescends lentement.",
    alternatives: [], alias: ['tibialis raises', 'tibialis'],
  },
];

// Programme Push / Pull / Jambes, 3 séances par semaine.
// recup en secondes.
export const SEANCES = [
  {
    id: 'push', nom: 'Push', description: 'Pecs, épaules, triceps',
    exercices: [
      { exo: 'dc-halteres', series: 3, repsMin: 8, repsMax: 10, recup: 120 },
      { exo: 'machine-pecs', series: 3, repsMin: 8, repsMax: 10, recup: 90 },
      { exo: 'incline-halteres', series: 3, repsMin: 8, repsMax: 10, recup: 90 },
      { exo: 'developpe-militaire', series: 3, repsMin: 8, repsMax: 10, recup: 90 },
      { exo: 'elevations-laterales', series: 3, repsMin: 12, repsMax: 15, recup: 60 },
      { exo: 'triceps-poulie', series: 3, repsMin: 8, repsMax: 10, recup: 60 },
    ],
  },
  {
    id: 'pull', nom: 'Pull', description: 'Dos, biceps',
    exercices: [
      { exo: 'tirage-horizontal', series: 3, repsMin: 8, repsMax: 10, recup: 120 },
      { exo: 'tirage-vertical', series: 3, repsMin: 8, repsMax: 10, recup: 120 },
      { exo: 'face-pull', series: 3, repsMin: 12, repsMax: 15, recup: 60 },
      { exo: 'curl-pupitre', series: 3, repsMin: 8, repsMax: 10, recup: 60 },
      { exo: 'curl-poulie', series: 3, repsMin: 10, repsMax: 12, recup: 60 },
    ],
  },
  {
    id: 'jambes', nom: 'Jambes', description: 'Quadriceps, ischios, mollets, tibial',
    exercices: [
      { exo: 'presse', series: 3, repsMin: 10, repsMax: 12, recup: 120 },
      { exo: 'leg-extension', series: 3, repsMin: 12, repsMax: 15, recup: 90 },
      { exo: 'leg-curl', series: 3, repsMin: 12, repsMax: 15, recup: 90 },
      { exo: 'mollets-assis', series: 3, repsMin: 15, repsMax: 20, recup: 60 },
      { exo: 'tibialis', series: 3, repsMin: 15, repsMax: 20, recup: 45 },
    ],
  },
];

const PAR_ID = new Map(EXERCICES.map((e) => [e.id, e]));

export function exo(id) {
  return PAR_ID.get(id) || null;
}

export function seance(id) {
  return SEANCES.find((s) => s.id === id) || null;
}

// Minuscules, sans accents ni espaces superflus.
export function normaliser(texte) {
  return String(texte || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Retrouve un exercice du catalogue à partir d'un nom saisi dans l'ancien Google Sheet.
export function exoDepuisNom(nom) {
  const n = normaliser(nom);
  if (!n) return null;
  for (const e of EXERCICES) {
    if (normaliser(e.nom) === n || e.alias.includes(n)) return e;
  }
  return null;
}
