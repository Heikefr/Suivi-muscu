// Données enregistrées sur le téléphone (localStorage).

const CLE = 'suivi-muscu';

/** Données d'un téléphone neuf. */
export function vide() {
  return {
    version: 1, historique: [], exclus: [], enCours: null,
    records: {}, haltero: {}, seancesPerso: [],
    hyroxProfil: null, hyroxAjust: {}, enCoursHyrox: null,
    // notes : réglages personnels par exercice ; sauvegarde : date de la dernière et fréquence du rappel (jours, 0 = jamais)
    notes: {}, sauvegarde: { derniere: null, rappel: 7 },
    // alertes : douleur ou gêne signalée par exercice { date, zone, note } ;
    // recupCat / recupExo : temps de récup choisis par catégorie / par exercice (secondes).
    alertes: {}, recupCat: {}, recupExo: {},
    // recupAuto : à la fin de la récup, retour automatique à l'exercice (réglable).
    // circuits : circuits Hyrox libres enregistrés { id, nom, tours, etapes } (voir metier/hyrox.js).
    // semaineType : séances prévues par jour (0 = lundi … 6 = dimanche), répétées chaque semaine ;
    // semaines : semaines modifiées à la main, par lundi { date: [{ id, cle, compo }] } (voir metier/planning.js).
    recupAuto: true, circuits: [], semaineType: {}, semaines: {},
  };
}

/** Renvoie v si c'est un objet simple, sinon un objet vide. */
const objet = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

/** Remet d'aplomb des données lues (sauvegarde ancienne ou abîmée) : chaque champ a une valeur sûre. */
export function valider(d) {
  if (!d || typeof d !== 'object' || d.version !== 1 || !Array.isArray(d.historique)) return null;
  return {
    ...vide(),
    ...d,
    exclus: Array.isArray(d.exclus) ? d.exclus : [],
    records: objet(d.records),
    haltero: objet(d.haltero),
    seancesPerso: Array.isArray(d.seancesPerso) ? d.seancesPerso : [],
    hyroxProfil: d.hyroxProfil && typeof d.hyroxProfil === 'object' ? d.hyroxProfil : null,
    hyroxAjust: objet(d.hyroxAjust),
    notes: objet(d.notes),
    alertes: objet(d.alertes),
    recupCat: objet(d.recupCat),
    recupExo: objet(d.recupExo),
    sauvegarde: { derniere: null, rappel: 7, ...objet(d.sauvegarde) },
    recupAuto: d.recupAuto !== false,
    circuits: Array.isArray(d.circuits) ? d.circuits.filter((c) => c && Array.isArray(c.etapes)) : [],
    semaineType: objet(d.semaineType),
    semaines: objet(d.semaines),
  };
}

/** Lit les données du téléphone (ou repart de zéro). */
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

/** Écrit les données ; renvoie false si le téléphone refuse (stockage plein, navigation privée). */
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
