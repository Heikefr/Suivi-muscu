// Calcul du poids conseillé (double progression) et des tendances.
// Fonctions pures : testées par tests/progression.test.js.

// Toutes les séances où l'exercice a été fait, de la plus ancienne à la plus récente.
export function historiqueExo(historique, exoId) {
  const res = [];
  for (const s of historique) {
    for (const e of s.exercices) {
      if (e.exo === exoId && e.series.length) {
        res.push({ date: s.date, debut: s.debut || 0, series: e.series });
      }
    }
  }
  res.sort((a, b) => (a.date === b.date ? a.debut - b.debut : a.date < b.date ? -1 : 1));
  return res;
}

// Charge de travail d'une séance : la plus lourde utilisée.
export function chargeDe(series) {
  return series.reduce((m, s) => Math.max(m, Number(s.charge) || 0), 0);
}

function arrondir(x) {
  return Math.round(x * 10) / 10;
}

// Renvoie { charge, raison } pour la prochaine séance.
// charge vaut null quand l'exercice n'a jamais été fait (à choisir sur place).
export function suggestion(def, cible, historique) {
  const passe = historiqueExo(historique, def.id);
  if (def.poidsDuCorps) {
    if (!passe.length) return { charge: 0, raison: 'Poids du corps' };
    const der = passe[passe.length - 1].series;
    const max = Math.max(...der.map((s) => s.reps));
    return { charge: 0, raison: `Poids du corps · dernière fois ${max} reps max` };
  }
  if (!passe.length) {
    return { charge: null, raison: 'Premier essai : choisis une charge confortable' };
  }

  const der = passe[passe.length - 1];
  const charge = chargeDe(der.series);
  const aCharge = der.series.filter((s) => (Number(s.charge) || 0) === charge);
  const toutAuMax = der.series.length >= cible.series && aCharge.length >= cible.series
    && aCharge.every((s) => s.reps >= cible.repsMax);
  const dur = der.series.some((s) => s.ressenti === 'dur');
  const sousObjectif = (seriesListe) => seriesListe.some((s) => s.reps < cible.repsMin);

  if (toutAuMax && !dur) {
    return {
      charge: arrondir(charge + def.increment),
      raison: `${cible.repsMax} reps partout la dernière fois : +${String(def.increment).replace('.', ',')} kg`,
    };
  }
  if (toutAuMax && dur) {
    return { charge, raison: 'Objectif atteint mais jugé dur : on confirme avant de monter' };
  }
  if (sousObjectif(der.series)) {
    // Deux séances d'affilée sous l'objectif à la même charge : on allège.
    const avant = passe[passe.length - 2];
    if (avant && chargeDe(avant.series) === charge && sousObjectif(avant.series) && charge - def.increment > 0) {
      return { charge: arrondir(charge - def.increment), raison: "Deux séances sous l'objectif : on allège un peu" };
    }
    return { charge, raison: `Même charge : vise ${cible.repsMin} reps sur chaque série` };
  }
  return { charge, raison: `Même charge : vise ${cible.repsMax} reps sur chaque série` };
}

// 'hausse' | 'stable' | 'baisse' en comparant la dernière charge à celle d'il y a 3 séances.
export function tendance(passe) {
  if (passe.length < 2) return 'stable';
  const der = chargeDe(passe[passe.length - 1].series);
  const ref = chargeDe(passe[Math.max(0, passe.length - 4)].series);
  if (der > ref) return 'hausse';
  if (der < ref) return 'baisse';
  return 'stable';
}

// ---------- Suggestion intelligente d'exercice pour une case de séance ----------

function trierRecentes(historique) {
  return [...historique].sort((a, b) => (a.date === b.date ? (b.debut || 0) - (a.debut || 0) : a.date < b.date ? 1 : -1));
}

function fait(s, id) {
  return s.exercices.some((e) => e.exo === id && e.series.length);
}

// Date de la dernière fois où l'exercice a été fait ('' si jamais).
export function derniereDate(historique, id) {
  let d = '';
  for (const s of historique) if (fait(s, id) && s.date > d) d = s.date;
  return d;
}

// Choisit l'exercice d'une case : garde ce qui progresse, change ce qui stagne,
// fait tourner les exercices secondaires une fois sur deux.
// Renvoie { exo, raison } ; nomDe sert à écrire la raison.
export function choisirPourCase(cas, historique, exclus, seanceId, nomDe = (id) => id) {
  const options = cas.options.filter((o) => !exclus.includes(o));
  if (!options.length) return null;
  const recentes = trierRecentes(historique);
  const duType = recentes.filter((s) => s.seance === seanceId);

  let dernier = null;
  for (const s of duType) {
    dernier = options.find((o) => fait(s, o));
    if (dernier) break;
  }
  if (!dernier) {
    // Jamais fait dans ce type de séance : on prend celui déjà pratiqué ailleurs, sinon le premier.
    dernier = options.find((o) => derniereDate(historique, o)) || options[0];
    return { exo: dernier, raison: '' };
  }

  const autre = () => options
    .filter((o) => o !== dernier)
    .sort((a, b) => (derniereDate(historique, a) < derniereDate(historique, b) ? -1 : 1))[0];

  const passe = historiqueExo(historique, dernier);
  const memes = seancesMemeCharge(passe);
  const charge = passe.length ? chargeDe(passe[passe.length - 1].series) : 0;
  if (options.length > 1 && charge > 0 && memes >= 3) {
    const alt = autre();
    return { exo: alt, raison: `${nomDe(dernier)} au même poids depuis ${memes} séances : on change de variante` };
  }

  if (!cas.principal && options.length > 1) {
    let suite = 0;
    for (const s of duType) {
      if (fait(s, dernier)) suite++;
      else break;
    }
    if (suite >= 2) return { exo: autre(), raison: 'Pour varier' };
  }
  return { exo: dernier, raison: '' };
}

// ---------- Haltérophilie : charges en % du record ----------

export function arrondiBarre(kg) {
  return Math.max(0, Math.round(kg));
}

// Plan de charges pour chaque série. Record inconnu : null partout (charge à choisir).
export function planHaltero(def, record, decalage = 0) {
  return def.pcts.map((pct) => (record ? arrondiBarre((record * (pct + decalage)) / 100) : null));
}

// Après une séance : nouvel ajustement (en points de %) et nouveau record éventuel.
export function bilanHaltero(def, series, cibleReps, record, decalage = 0) {
  const ratees = series.reduce((t, s) => t + Math.max(0, cibleReps - s.reps), 0);
  const dur = series.some((s) => s.ressenti === 'dur');
  let nouveauDecalage = decalage;
  if (series.length && ratees === 0 && !dur) nouveauDecalage = Math.min(15, decalage + 2.5);
  else if (ratees >= 2) nouveauDecalage = Math.max(-15, decalage - 2.5);

  const reussies = series.filter((s) => s.reps >= cibleReps).map((s) => Number(s.charge) || 0);
  const meilleure = reussies.length ? Math.max(...reussies) : 0;
  let nouveauRecord = record;
  if (!record && meilleure) nouveauRecord = arrondiBarre(meilleure / 0.8);
  else if (record && meilleure > record) nouveauRecord = meilleure;
  return { decalage: nouveauDecalage, record: nouveauRecord, recordBattu: Boolean(record && meilleure > record) };
}

// Nombre de séances consécutives (les plus récentes) à la même charge.
export function seancesMemeCharge(passe) {
  if (!passe.length) return 0;
  const c = chargeDe(passe[passe.length - 1].series);
  let n = 0;
  for (let i = passe.length - 1; i >= 0 && chargeDe(passe[i].series) === c; i--) n++;
  return n;
}
