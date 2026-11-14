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

// Nombre de séances consécutives (les plus récentes) à la même charge.
export function seancesMemeCharge(passe) {
  if (!passe.length) return 0;
  const c = chargeDe(passe[passe.length - 1].series);
  let n = 0;
  for (let i = passe.length - 1; i >= 0 && chargeDe(passe[i].series) === c; i--) n++;
  return n;
}
