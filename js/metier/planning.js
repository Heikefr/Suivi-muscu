// =====================================================================
// Planning de la semaine
// ---------------------------------------------------------------------
// Une séance prévue a une « clé » qui dit quoi faire :
//   'push' | 'pull' | 'jambes'   séance de musculation composée le jour même (ou à l'avance : compo)
//   'perso:<id>'                 séance de musculation enregistrée
//   'hyrox'                      prochaine séance du plan Hyrox (ou séance libre suggérée)
//   'circuit:<id>'               circuit Hyrox enregistré
//
// Deux sources :
//   d.semaineType  { 0..6: ['push', …] }   la semaine type (0 = lundi), répétée chaque semaine ;
//   d.semaines     { lundi: { date: [{ id, cle, compo }] } }   une semaine modifiée à la main.
// Une semaine modifiée garde sa propre liste : changer la semaine type ne la touche plus.
//
// Fonctions pures (les données d sont passées en paramètre) : testées par tests/planning.test.js.
// =====================================================================

/** Date AAAA-MM-JJ décalée de n jours (calcul en UTC : pas de souci d'heure d'été). */
function decaler(iso, n) {
  const t = new Date(`${iso}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/** Lundi de la semaine d'une date. */
export function lundiDe(iso) {
  const jour = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
  return decaler(iso, -jour);
}

/** Les 7 dates d'une semaine, du lundi au dimanche. */
export function joursDe(lundi) {
  return Array.from({ length: 7 }, (_, i) => decaler(lundi, i));
}

/** Numéro du jour dans la semaine : 0 = lundi … 6 = dimanche. */
export function indexJour(iso) {
  return (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** Musculation ou Hyrox. */
export function categorie(cle) {
  return cle === 'hyrox' || String(cle).startsWith('circuit:') ? 'hyrox' : 'muscu';
}

/** Vrai si la clé désigne encore quelque chose (une séance enregistrée a pu être supprimée). */
export function cleValide(d, cle) {
  if (['push', 'pull', 'jambes', 'hyrox'].includes(cle)) return true;
  if (String(cle).startsWith('perso:')) return d.seancesPerso.some((s) => `perso:${s.id}` === cle);
  if (String(cle).startsWith('circuit:')) return d.circuits.some((c) => `circuit:${c.id}` === cle);
  return false;
}

let compteur = 0;
/** Identifiant d'une séance prévue ajoutée à la main. */
function nouvelId() {
  compteur = (compteur + 1) % 1000;
  return `p${Date.now().toString(36)}${compteur}`;
}

/**
 * Les séances prévues d'une semaine : { date: [{ id, cle, compo }] }.
 * Semaine modifiée à la main → sa liste ; sinon → la semaine type.
 */
export function planSemaine(d, lundi) {
  const plan = {};
  const propre = d.semaines?.[lundi];
  joursDe(lundi).forEach((date, i) => {
    const items = propre
      ? (propre[date] || [])
      : (d.semaineType?.[i] || []).map((cle, k) => ({ id: `t${date}-${k}`, cle }));
    plan[date] = items.filter((it) => cleValide(d, it.cle));
  });
  return plan;
}

/** Vrai si la semaine a été modifiée à la main. */
export function semaineModifiee(d, lundi) {
  return Boolean(d.semaines?.[lundi]);
}

/** Fige une semaine (copie de la semaine type) pour la modifier sans toucher la semaine type. */
export function figer(d, lundi) {
  if (!d.semaines[lundi]) {
    const plan = planSemaine(d, lundi);
    d.semaines[lundi] = Object.fromEntries(Object.entries(plan).map(([date, items]) => [date, items.map((it) => ({ ...it }))]));
  }
  return d.semaines[lundi];
}

/** La semaine reprend la semaine type (annule les modifications à la main). */
export function revenirSemaineType(d, lundi) {
  delete d.semaines[lundi];
}

/** Ajoute une séance prévue à une date ; renvoie la séance prévue. */
export function ajouterPrevu(d, date, cle) {
  const sem = figer(d, lundiDe(date));
  const item = { id: nouvelId(), cle };
  (sem[date] = sem[date] || []).push(item);
  return item;
}

/** Retrouve une séance prévue (et sa liste) dans une semaine figée. */
function trouver(d, date, id) {
  const sem = figer(d, lundiDe(date));
  const liste = sem[date] || [];
  return { liste, item: liste.find((x) => x.id === id) };
}

/** Supprime une séance prévue. */
export function supprimerPrevu(d, date, id) {
  const { liste, item } = trouver(d, date, id);
  if (item) liste.splice(liste.indexOf(item), 1);
}

/** Décale une séance prévue à une autre date (même dans une autre semaine). */
export function deplacerPrevu(d, date, id, nouvelleDate) {
  if (date === nouvelleDate) return;
  const { liste, item } = trouver(d, date, id);
  if (!item) return;
  liste.splice(liste.indexOf(item), 1);
  const sem = figer(d, lundiDe(nouvelleDate));
  (sem[nouvelleDate] = sem[nouvelleDate] || []).push(item);
}

/** Enregistre les exercices choisis à l'avance pour une séance prévue (null pour effacer). */
export function definirCompo(d, date, id, compo) {
  const { item } = trouver(d, date, id);
  if (!item) return;
  if (compo?.length) item.compo = compo;
  else delete item.compo;
}

/** Clé correspondant à une séance faite (pour la rapprocher d'une séance prévue). */
export function cleDeSeance(s) {
  const id = s.seance || '';
  if (id.startsWith('hyrox:circuit:')) return `circuit:${id.slice(14)}`;
  if (id.startsWith('hyrox:')) return 'hyrox';
  return id; // push, pull, jambes, perso:<id>, perso
}

/**
 * État de chaque jour d'une semaine.
 * Renvoie { date: { faites: [séances faites], prevus: [{ id, cle, compo, statut, seance }] } }
 * statut : 'faite' (rapprochée d'une séance faite ce jour-là), 'prevue' (aujourd'hui ou plus tard)
 * ou 'pas-faite' (jour passé). Rapprochement : d'abord la séance lancée depuis le planning,
 * puis la même séance, puis le même univers (une séance Pull faite à la place d'un Push compte).
 */
export function etatSemaine(d, lundi, aujourdHui) {
  const plan = planSemaine(d, lundi);
  const etat = {};
  for (const date of joursDe(lundi)) {
    const faites = d.historique.filter((s) => s.date === date)
      .sort((a, b) => (a.debut || 0) - (b.debut || 0));
    const libres = new Set(faites);
    const prevus = plan[date].map((it) => ({ ...it, statut: null, seance: null }));
    const rapprocher = (test) => {
      for (const p of prevus) {
        if (p.seance) continue;
        const s = [...libres].find((x) => test(p, x));
        if (s) { p.seance = s; libres.delete(s); }
      }
    };
    rapprocher((p, s) => s.plan === p.id);
    rapprocher((p, s) => cleDeSeance(s) === p.cle);
    rapprocher((p, s) => categorie(cleDeSeance(s)) === categorie(p.cle));
    for (const p of prevus) p.statut = p.seance ? 'faite' : date < aujourdHui ? 'pas-faite' : 'prevue';
    etat[date] = { faites, prevus };
  }
  return etat;
}

/** Oublie les semaines modifiées de plus de 8 semaines (elles ne servent plus). */
export function nettoyer(d, aujourdHui) {
  const limite = decaler(lundiDe(aujourdHui), -56);
  for (const lundi of Object.keys(d.semaines)) if (lundi < limite) delete d.semaines[lundi];
}
