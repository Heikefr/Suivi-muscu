// Données enregistrées sur le téléphone (localStorage).

const CLE = 'suivi-muscu';

export function vide() {
  return {
    version: 1, historique: [], exclus: [], remplacements: {}, enCours: null,
    records: {}, haltero: {}, seancesPerso: [],
  };
}

const objet = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

export function valider(d) {
  if (!d || typeof d !== 'object' || d.version !== 1 || !Array.isArray(d.historique)) return null;
  return {
    ...vide(),
    ...d,
    exclus: Array.isArray(d.exclus) ? d.exclus : [],
    remplacements: objet(d.remplacements),
    records: objet(d.records),
    haltero: objet(d.haltero),
    seancesPerso: Array.isArray(d.seancesPerso) ? d.seancesPerso : [],
  };
}

export function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return vide();
    const d = valider(JSON.parse(brut));
    if (d) return d;
    // Données présentes mais illisibles : on les garde de côté plutôt que de les écraser.
    localStorage.setItem(`${CLE}-illisible-${Date.now()}`, brut);
  } catch (e) {
    // localStorage indisponible : l'appli marche, mais sans mémoire.
  }
  return vide();
}

export function sauver(d) {
  try {
    localStorage.setItem(CLE, JSON.stringify(d));
    return true;
  } catch (e) {
    return false;
  }
}

// Demande à iOS de ne pas effacer les données.
export function demanderPersistance() {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  } catch (e) { /* sans effet */ }
}
