import { charger, sauver } from './metier/stockage.js';

export const VERSION = '0.4';

export let d = charger();
export function remplacerDonnees(nouvelles) { d = nouvelles; }

export const ui = {
  ecran: 'accueil', modal: null, toast: null, exoProg: null, exoDetail: null, retour: 'exercices',
  compo: null, perso: null,
};

let rendu = () => {};
export function definirRendu(fonction) { rendu = fonction; }
export function rendre() { rendu(); }

export function enregistrer() {
  if (!sauver(d)) toast("Enregistrement impossible sur ce téléphone");
}

export function toast(texte) {
  ui.toast = texte;
  rendre();
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { ui.toast = null; rendre(); }, 3200);
}
