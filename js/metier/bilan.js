// =====================================================================
// Bilans tirés de l'historique : muscles de la semaine, records,
// séries d'échauffement et rappel de sauvegarde.
// ---------------------------------------------------------------------
// Fonctions pures (aucun affichage) : testées par tests/bilan.test.js.
// =====================================================================

import { normaliser } from './donnees.js';

// ---------- Muscles travaillés ----------

/** Début du libellé « muscles » d'un exercice → muscle de la carte. L'ordre compte : le premier qui correspond gagne. */
const CORRESPONDANCES = [
  ['pecs', 'Pecs'], ['haut des pecs', 'Pecs'], ['bas des pecs', 'Pecs'],
  ['epaules', 'Épaules'], ["arriere d'epaule", 'Épaules'],
  ['triceps', 'Triceps'], ['biceps', 'Biceps'],
  ['grand dorsal', 'Dos'], ['dos', 'Dos'], ['trapezes', 'Trapèzes'],
  ['quadriceps', 'Quadriceps'], ['ischio', 'Ischios'],
  ['fessiers', 'Fessiers'], ['moyen fessier', 'Fessiers'], ['adducteurs', 'Adducteurs'],
  ['gastrocnemiens', 'Mollets'], ['soleaire', 'Mollets'], ['mollets', 'Mollets'], ['tibial', 'Tibias'],
  ['abdos', 'Abdos'],
];

/** Mouvements globaux (haltérophilie) : comptés à part, pas dessinés sur la carte. */
export const CORPS_ENTIER = 'Corps entier';

/**
 * Muscle PRINCIPAL d'un exercice : le premier cité dans sa fiche.
 * (Choix validé : un développé couché compte pour les pecs, pas pour les triceps.)
 */
export function musclePrincipal(def) {
  if (!def) return null;
  const premier = normaliser(String(def.muscles || '').split('·')[0]);
  const trouve = CORRESPONDANCES.find(([debut]) => premier.startsWith(debut));
  return trouve ? trouve[1] : CORPS_ENTIER;
}

/**
 * Nombre de séries par muscle entre deux dates (incluses).
 * @param exoDe  fonction identifiant → fiche d'exercice
 * @returns { compte: { Pecs: 14, … }, seances, series }
 */
export function seriesParMuscle(historique, debut, fin, exoDe) {
  const compte = {};
  let seances = 0;
  let series = 0;
  for (const s of historique) {
    if (s.date < debut || s.date > fin || s.importee || !s.exercices.length) continue;
    seances++;
    for (const e of s.exercices) {
      const muscle = musclePrincipal(exoDe(e.exo));
      if (!muscle) continue;
      compte[muscle] = (compte[muscle] || 0) + e.series.length;
      series += e.series.length;
    }
  }
  return { compte, seances, series };
}

/** Niveau de travail d'un muscle sur la semaine : 0 rien, 1 un peu, 2 correct, 3 beaucoup. */
export function niveauMuscle(series) {
  if (!series) return 0;
  if (series < 6) return 1;
  return series < 12 ? 2 : 3;
}

/** Quelle séance couvre chaque grand muscle. */
const SEANCE_DE = {
  Pecs: 'Push', 'Épaules': 'Push', Triceps: 'Push', Dos: 'Pull', Biceps: 'Pull',
  Quadriceps: 'Jambes', Ischios: 'Jambes', Fessiers: 'Jambes', Mollets: 'Jambes',
};

/** Grands muscles pas encore travaillés, et les séances qui les couvrent. */
export function musclesOublies(compte) {
  const muscles = Object.keys(SEANCE_DE).filter((m) => !compte[m]);
  return { muscles, seances: [...new Set(muscles.map((m) => SEANCE_DE[m]))] };
}

// ---------- Records ----------

/**
 * Meilleure série d'un exercice dans une séance : la plus lourde, puis le plus de répétitions.
 * Au poids du corps (charge 0), c'est donc le nombre de répétitions qui compte.
 * Les séries ratées (0 répétition) sont ignorées.
 */
export function meilleureSerie(series) {
  let top = null;
  for (const s of series) {
    if (!(s.reps > 0)) continue;
    if (!top || s.charge > top.charge || (s.charge === top.charge && s.reps > top.reps)) top = { charge: s.charge || 0, reps: s.reps };
  }
  return top;
}

/** Vrai si la série `a` est meilleure que `b`. */
const bat = (a, b) => a.charge > b.charge || (a.charge === b.charge && a.reps > b.reps);

/** Record de chaque exercice : { idExercice: { charge, reps, date, nom } }. */
export function records(historique) {
  const r = {};
  for (const s of [...historique].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.debut || 0) - (b.debut || 0)))) {
    for (const e of s.exercices) {
      const top = meilleureSerie(e.series);
      if (top && (!r[e.exo] || bat(top, r[e.exo]))) r[e.exo] = { ...top, date: s.date, nom: e.nom };
    }
  }
  return r;
}

/**
 * Records battus par une séance, par rapport à l'historique d'AVANT.
 * Un exercice fait pour la première fois n'est pas un « nouveau record ».
 */
export function nouveauxRecords(historiqueAvant, seance) {
  const avant = records(historiqueAvant);
  const liste = [];
  for (const e of seance.exercices) {
    const top = meilleureSerie(e.series);
    if (top && avant[e.exo] && bat(top, avant[e.exo])) liste.push({ exo: e.exo, nom: e.nom, ...top, avant: avant[e.exo] });
  }
  return liste;
}

// ---------- Échauffement ----------

/** Les séries de chauffe : part de la charge du jour, et répétitions. */
const CHAUFFE = [[0.4, 10], [0.6, 6], [0.8, 3]];

/**
 * Séries d'échauffement avant la première série lourde.
 * Arrondies au pas de l'exercice ; à la barre, jamais moins que la barre vide (20 kg).
 * Renvoie [] quand il n'y a rien d'utile à proposer (poids du corps, charge inconnue ou trop légère).
 */
export function echauffement(charge, def) {
  if (!def || def.poidsDuCorps || def.type === 'haltero' || !(charge > 0)) return [];
  const pas = def.increment || 2.5;
  const mini = def.materiel === 'barre' ? 20 : pas;
  const series = [];
  for (const [part, reps] of CHAUFFE) {
    const kg = Math.max(mini, Math.round((charge * part) / pas) * pas);
    // On garde seulement des paliers qui montent et restent sous la charge de travail.
    if (kg < charge && (!series.length || kg > series[series.length - 1].charge)) series.push({ charge: kg, reps });
  }
  return series;
}

// ---------- Rappel de sauvegarde ----------

/** Nombre de jours entre deux dates AAAA-MM-JJ. */
export function joursEntre(debut, fin) {
  return Math.round((Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${debut}T00:00:00Z`)) / 86400000);
}

/**
 * Faut-il rappeler de sauvegarder ?
 * @param sauvegarde  { derniere: 'AAAA-MM-JJ' ou null, rappel: nombre de jours (0 = jamais) }
 * @returns null (rien à dire) ou { jours } — jours = null si aucune sauvegarde n'a jamais été faite
 */
export function rappelSauvegarde(sauvegarde, historique, aujourdHui) {
  const { derniere = null, rappel = 7 } = sauvegarde || {};
  if (!rappel) return null;
  const aMoi = historique.filter((s) => !s.importee);
  if (!derniere) return aMoi.length >= 3 ? { jours: null } : null;
  // Rien de nouveau depuis la dernière sauvegarde : inutile d'insister.
  if (!aMoi.some((s) => s.date >= derniere)) return null;
  const jours = joursEntre(derniere, aujourdHui);
  return jours >= rappel ? { jours } : null;
}
