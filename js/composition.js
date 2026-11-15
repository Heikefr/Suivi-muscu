// =====================================================================
// Composition d'une séance Push / Pull / Jambes
// ---------------------------------------------------------------------
// Quelle séance proposer, et quels exercices mettre dedans (suggestion intelligente
// ou reprise de la dernière fois).
// =====================================================================

import { nomExo } from './commun.js';
import { d, ui } from './etat.js';
import { SEANCES, seance } from './metier/donnees.js';
import { choisirPourCase } from './metier/progression.js';
import { ilYa } from './outils.js';

/** Séance à conseiller : celle faite il y a le plus longtemps parmi Push, Pull, Jambes. */
export function prochaineSeance() {
  const ordre = SEANCES.map((s) => s.id);
  const derniere = [...d.historique].sort((a, b) => (a.date === b.date ? (a.debut || 0) - (b.debut || 0) : a.date < b.date ? -1 : 1))
    .reverse().find((s) => ordre.includes(s.seance));
  if (!derniere) return ordre[0];
  return ordre[(ordre.indexOf(derniere.seance) + 1) % ordre.length];
}

/** « il y a 3 jours », « hier »… pour une séance donnée. */
export function derniereFois(seanceId) {
  const s = d.historique.filter((h) => h.seance === seanceId).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return s ? ilYa(s.date) : 'jamais faite';
}

/** Prépare ui.compo : les exercices d'une séance, en mode « suggestion » ou « derniere ». */
export function composer(seanceId, mode = 'suggestion') {
  const s = seance(seanceId);
  const cases = [];
  for (const c of s.cases) {
    let choix;
    if (mode === 'derniere') {
      const opts = c.options.filter((o) => !d.exclus.includes(o));
      const recent = [...d.historique].sort((a, b) => (a.date < b.date ? 1 : -1)).filter((h) => h.seance === seanceId);
      const fait = recent.map((h) => opts.find((o) => h.exercices.some((e) => e.exo === o))).find(Boolean);
      choix = opts.length ? { exo: fait || opts[0], raison: '' } : null;
    } else {
      choix = choisirPourCase(c, d.historique, d.exclus, seanceId, (id) => nomExo(id));
    }
    if (choix) cases.push({ role: c.role, options: c.options, principal: c.principal, cible: c.cible, ...choix });
  }
  ui.compo = { seance: seanceId, mode, cases: mode === 'courte' ? cases.slice(0, 4) : cases };
}

/** Durée estimée en minutes, arrondie à 5 (45 s d'effort + la récupération, par série). */
export function dureeEstimee(items) {
  return Math.max(5, Math.round(items.reduce((t, c) => t + c.cible.series * (45 + c.cible.recup), 0) / 60 / 5) * 5);
}
