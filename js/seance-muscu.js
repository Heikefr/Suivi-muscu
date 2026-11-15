// =====================================================================
// Déroulé d'une séance de musculation
// ---------------------------------------------------------------------
// Démarrer, valider une série, lancer la récupération, passer à l'exercice suivant,
// terminer. La séance en cours vit dans d.enCours : elle survit donc à une
// fermeture de l'appli.
// =====================================================================

import { nouveauxRecords } from './metier/bilan.js';
import { estHaltero, nomExo } from './commun.js';
import { d, enregistrer, rendre, ui } from './etat.js';
import { cibleFinale, exo, seance } from './metier/donnees.js';
import { bilanHaltero, planHaltero, suggestion } from './metier/progression.js';
import { aujourdhui, nb } from './outils.js';

let verrouEcran = null;

/** Empêche l'écran de s'éteindre pendant la séance (si le téléphone le permet). */
export async function garderEcranAllume() {
  try {
    if ('wakeLock' in navigator && (d.enCours || d.enCoursHyrox) && !verrouEcran) {
      verrouEcran = await navigator.wakeLock.request('screen');
      verrouEcran.addEventListener('release', () => { verrouEcran = null; });
    }
  } catch (e) { /* refusé : pas grave */ }
}

/** Rend la main au téléphone pour la mise en veille. */
export function libererEcran() {
  try { verrouEcran?.release(); } catch (e) { /* déjà libéré */ }
  verrouEcran = null;
}

/** Construit un exercice de séance : objectif, charge conseillée et raison affichée. */
export function preparerExo(item) {
  const def = exo(item.exo);
  const cible = cibleFinale(def, item.cible);
  const base = { exo: item.exo, cible, reps: cible.repsMin, series: [] };
  if (estHaltero(def)) {
    const record = d.records[def.id] || null;
    const dec = d.haltero[def.id] || 0;
    const plan = planHaltero(def, record, dec);
    while (plan.length < cible.series) plan.push(plan[plan.length - 1]);
    return {
      ...base, plan, charge: null, conseillee: plan[0],
      raison: record ? `Calculé sur ton record de ${nb(record)} kg` : 'Record inconnu : choisis une charge légère',
    };
  }
  const sug = suggestion(def, cible, d.historique);
  return { ...base, conseillee: sug.charge, charge: sug.charge, raison: sug.raison };
}

/** Démarre une séance avec la liste d'exercices choisie. */
export function demarrer(seanceId, nom, items) {
  if (!items.length) return;
  d.enCours = {
    seance: seanceId, nom, debut: Date.now(), index: 0, recup: null,
    // Échauffement proposé avant la toute première série : nombre de séries de chauffe faites.
    chauffe: { faites: 0, finie: false },
    exercices: items.map(preparerExo),
  };
  enregistrer();
  ui.ecran = 'exercice';
  ui.modal = null;
  garderEcranAllume();
  rendre();
  window.scrollTo(0, 0);
}

/** L'exercice affiché en ce moment. */
export function exoCourant() {
  return d.enCours.exercices[d.enCours.index];
}

/** Charge prévue pour la série n° i (en haltéro, chaque série a la sienne). */
export function chargeSerie(e, i) {
  if (e.plan) return e.plan[i] ?? e.charge;
  return e.charge;
}

/** Index du prochain exercice qui a encore des séries à faire, ou -1 si tout est fait. */
export function prochainIndex(depuis) {
  const ex = d.enCours.exercices;
  for (let k = 1; k <= ex.length; k++) {
    const i = (depuis + k) % ex.length;
    if (ex[i].series.length < ex[i].cible.series) return i;
  }
  return -1;
}

/** Enregistre la série faite, puis lance la récupération ou passe à la suite. */
export function validerSerie(reps) {
  const e = exoCourant();
  const def = exo(e.exo);
  const i = e.series.length;
  const charge = chargeSerie(e, i);
  if (!def.poidsDuCorps && charge == null) {
    ui.modal = { type: 'options' };
    rendre();
    return;
  }
  e.series.push({ reps: reps ?? e.reps, charge: def.poidsDuCorps ? 0 : charge, ressenti: null });
  if (d.enCours.chauffe) d.enCours.chauffe.finie = true; // une vraie série est faite : plus d'échauffement
  const exoIndex = d.enCours.index;
  const serieIndex = e.series.length - 1;
  if (e.series.length >= e.cible.series) {
    const suivant = prochainIndex(d.enCours.index);
    if (suivant < 0) { terminer(); return; }
    d.enCours.index = suivant;
  }
  d.enCours.recup = { fin: Date.now() + e.cible.recup * 1000, duree: e.cible.recup, exoIndex, serieIndex, flashe: false };
  enregistrer();
  ui.ecran = 'recup';
  rendre();
  window.scrollTo(0, 0);
}

/** Fin de la récupération : retour à l'écran de l'exercice. */
export function finRecup() {
  d.enCours.recup = null;
  enregistrer();
  ui.ecran = 'exercice';
  rendre();
  window.scrollTo(0, 0);
}

/** Clôt la séance : la range dans l'historique et met à jour les réglages d'haltéro. */
export function terminer() {
  const ec = d.enCours;
  const faits = ec.exercices.filter((e) => e.series.length);
  d.enCours = null;
  libererEcran();
  ui.finInfos = [];
  ui.finRecords = [];
  if (!faits.length) {
    enregistrer();
    ui.ecran = 'accueil';
    rendre();
    return;
  }
  // Haltérophilie : ajustement des % et records.
  for (const e of faits) {
    const def = exo(e.exo);
    if (!estHaltero(def)) continue;
    const b = bilanHaltero(def, e.series, e.cible.repsMin, d.records[def.id] || null, d.haltero[def.id] || 0);
    d.haltero[def.id] = b.decalage;
    if (b.record && b.record !== d.records[def.id]) {
      ui.finInfos.push(b.recordBattu ? `Nouveau record : ${def.nom} à ${nb(b.record)} kg` : `${def.nom} : record estimé à ${nb(b.record)} kg`);
      d.records[def.id] = b.record;
    }
  }
  const s = {
    id: `s${ec.debut}`, date: aujourdhui(), debut: ec.debut, fin: Date.now(),
    seance: ec.seance, nom: ec.nom || seance(ec.seance)?.nom || ec.seance,
    exercices: faits.map((e) => ({ exo: e.exo, nom: nomExo(e.exo), series: e.series })),
  };
  // Records battus (hors haltérophilie, qui a déjà son propre suivi du record).
  ui.finRecords = nouveauxRecords(d.historique, s).filter((r) => !estHaltero(exo(r.exo)));
  d.historique.push(s);
  enregistrer();
  ui.ecran = 'fin';
  ui.finId = s.id;
  rendre();
  window.scrollTo(0, 0);
}

/** Haltéro : recalcule les charges des séries restantes quand le record change. */
export function recalculerPlan(e, def) {
  const record = d.records[def.id] || null;
  const plan = planHaltero(def, record, d.haltero[def.id] || 0);
  while (plan.length < e.cible.series) plan.push(plan[plan.length - 1]);
  for (let i = e.series.length; i < plan.length; i++) e.plan[i] = plan[i];
  e.raison = record ? `Calculé sur ton record de ${nb(record)} kg` : 'Record inconnu : choisis une charge légère';
}
