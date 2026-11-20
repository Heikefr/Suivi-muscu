// =====================================================================
// État de l'appli, partagé par tous les fichiers
// ---------------------------------------------------------------------
//   d   : les DONNÉES enregistrées sur le téléphone (historique, records, profil Hyrox…)
//   ui  : l'état de l'AFFICHAGE (écran courant, fenêtre ouverte…), jamais enregistré
//
// Les écrans appellent rendre() sans connaître app.js : app.js branche la vraie
// fonction au démarrage avec definirRendu(). Cela évite que tous les fichiers
// dépendent du point d'entrée.
// =====================================================================

import { charger, sauver } from './metier/stockage.js';

export const VERSION = '0.9';

/** Les données enregistrées. `let` exporté : les autres fichiers voient toujours la valeur à jour. */
export let d = charger();
/** Remplace toutes les données (restauration d'une sauvegarde, remise à zéro). */
export function remplacerDonnees(nouvelles) { d = nouvelles; }

/**
 * État de l'affichage. Les champs principaux :
 *   ecran      nom de l'écran courant (voir rendre() dans app.js)
 *   modal      fenêtre ouverte : { type, … } ou null
 *   toast      court message affiché en haut, ou null
 *   compo      composition en cours d'une séance Push / Pull / Jambes
 *   perso      séance personnalisée en cours de création
 *   exoProg, exoDetail, retour   exercice affiché dans Progression / Exercices
 *   hp         brouillon du profil Hyrox pendant sa saisie
 *   circuit    circuit Hyrox libre en cours d'écriture (voir ecrans/circuit.js)
 *   semaine    semaine affichée sur l'accueil (0 = cette semaine, 1 = la suivante, -1 = la précédente)
 *   hyroxApercu, finId, finInfos, flash, planHyrox, qExos…   ajoutés au fil de l'eau par les écrans
 */
export const ui = {
  ecran: 'accueil', modal: null, toast: null, exoProg: null, exoDetail: null, retour: 'exercices',
  compo: null, perso: null, circuit: null, semaine: 0,
};

let rendu = () => {};
/** Appelé une fois par app.js pour brancher la fonction qui redessine. */
export function definirRendu(fonction) { rendu = fonction; }
/** Redessine la page. */
export function rendre() { rendu(); }

/** Écrit les données sur le téléphone ; prévient si c'est impossible. */
export function enregistrer() {
  if (!sauver(d)) toast("Enregistrement impossible sur ce téléphone");
}

/** Affiche un court message en haut de l'écran pendant 3 secondes. */
export function toast(texte) {
  ui.toast = texte;
  rendre();
  clearTimeout(toast.t);
  // À la fin, on retire juste le message : redessiner effacerait ce qui est en cours de saisie.
  toast.t = setTimeout(() => { ui.toast = null; document.querySelector('.toast[role="status"]')?.remove(); }, 3200);
}

/** Fait clignoter doucement l'écran (fin de récup, fin d'étape) pendant 2,5 secondes. */
export function clignoter() {
  ui.flash = true;
  // Ajouté sans redessiner : une saisie en cours (gêne, note) n'est pas perdue.
  if (!document.querySelector('.flash')) document.getElementById('app')?.insertAdjacentHTML('beforeend', '<div class="flash"></div>');
  setTimeout(() => { ui.flash = false; document.querySelector('.flash')?.remove(); }, 2500);
}
