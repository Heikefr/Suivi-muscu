import { ICONES, cibleTexte, estHaltero, nav, nomExo } from '../commun.js';
import { resumeSeries } from './seance.js';
import { d, enregistrer, toast, ui } from '../etat.js';
import { illustration } from '../illustrations.js';
import { EXERCICES, GROUPES, SEANCES, exo } from '../metier/donnees.js';
import { chargeDe, historiqueExo, seancesMemeCharge, tendance } from '../metier/progression.js';
import { dateCourte, dateLongue, esc, mmss, nb } from '../outils.js';

export function exosAvecHistorique() {
  const ids = new Map();
  for (const s of d.historique) for (const e of s.exercices) ids.set(e.exo, { nom: e.nom, date: s.date > (ids.get(e.exo)?.date || '') ? s.date : ids.get(e.exo).date });
  return [...ids.entries()].map(([id, v]) => ({ id, nom: nomExo(id, v.nom), date: v.date }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.nom.localeCompare(b.nom)));
}

export function ecranProgression() {
  const liste = exosAvecHistorique();
  if (!liste.length) {
    return `<main class="ecran avec-nav">
      <div class="pile u-ecart-6"><div class="sur-titre">Tes charges séance après séance</div><h1>Progression</h1></div>
      <div class="carte petit u-t-15">Aucune séance pour l'instant. Fais ta première séance, ou importe ton ancien suivi depuis les réglages.</div>
      <button class="btn-secondaire" data-action="ecran" data-id="reglages">Ouvrir les réglages</button>
    </main>${nav('progression')}`;
  }
  const sel = liste.find((x) => x.id === ui.exoProg) || liste[0];
  const def = exo(sel.id);
  const passe = historiqueExo(d.historique, sel.id).slice(-8);
  const n = passe.length;
  const cols = `grid-template-columns:repeat(${n},minmax(0,1fr))`;
  // Exercice au poids du corps : on suit la meilleure série (reps ou secondes) au lieu de la charge.
  const poidsCorps = def?.poidsDuCorps || Math.max(...passe.map((p) => chargeDe(p.series))) === 0;
  const valeurs = passe.map((p) => (poidsCorps ? Math.max(...p.series.map((s) => s.reps)) : chargeDe(p.series)));
  const vmax = Math.max(...valeurs, 1);
  const vmin = Math.min(...valeurs);
  const hautV = (v) => (vmax === vmin ? 100 : 35 + ((v - vmin) / (vmax - vmin)) * 65);
  const deltaV = valeurs[valeurs.length - 1] - valeurs[0];
  const uniteV = poidsCorps ? (def?.unite === 's' ? ' s' : '') : ' kg';

  const lignes = liste.map((x) => {
    const p = historiqueExo(d.historique, x.id);
    const t = tendance(p);
    const c = chargeDe(p[p.length - 1].series);
    const memes = seancesMemeCharge(p);
    const sous = c === 0 ? `${p.length} séance${p.length > 1 ? 's' : ''}`
      : memes > 1 ? `${nb(c)} kg depuis ${memes} séances` : `${nb(c)} kg · ${dateCourte(p[p.length - 1].date)}`;
    const mot = { hausse: 'En hausse', stable: 'Stable', baisse: 'En baisse' }[t];
    return `<button class="choix ${x.id === sel.id ? 'selection' : ''}" data-action="prog" data-id="${esc(x.id)}" style="min-height:60px">
      <span><span class="nom u-t-15">${esc(x.nom)}</span><span class="petit">${sous}</span></span>
      <span class="${t}" style="font-size:14px;font-weight:700">${mot}</span>
    </button>`;
  }).join('');

  const seancesRecentes = [...d.historique].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12).map((s) => `
    <button class="choix" data-action="voir-seance" data-id="${esc(s.id)}" style="min-height:56px">
      <span><span class="nom u-t-15">${esc(s.nom || s.seance)}</span><span class="petit">${dateLongue(s.date)} · ${s.hyrox ? `Hyrox · ${mmss(s.hyrox.total)}` : `${s.exercices.length} exercices`}</span></span>
      ${ICONES.suite}
    </button>`).join('');

  return `<main class="ecran avec-nav">
    <div class="pile u-ecart-6"><div class="sur-titre">Tes charges séance après séance</div><h1>Progression</h1></div>
    <div class="carte pile u-ecart-14 u-pad-16 u-rayon-18">
      <div class="ligne u-items-flex-end">
        <div class="pile u-flex-1 u-ecart-3"><div class="u-t-16 u-gras-600">${esc(sel.nom)}</div><div class="petit">${poidsCorps ? 'Meilleure série' : 'Charge par séance'} · ${n} dernière${n > 1 ? 's' : ''}</div></div>
        <div class="chiffre ${deltaV > 0 ? 'hausse' : deltaV < 0 ? 'baisse' : 'stable'}" style="font-size:26px">${deltaV > 0 ? '+' : ''}${nb(deltaV)}${uniteV}</div>
      </div>
      <div class="graph" style="${cols}">
        ${valeurs.map((v, i) => `<div class="col ${i === n - 1 ? 'der' : ''}"><div class="v">${nb(v)}</div><div class="barre" style="height:${Math.round(hautV(v) * 1.1)}px"></div></div>`).join('')}
      </div>
      <div class="dates" style="${cols}">${passe.map((p) => `<div>${dateCourte(p.date)}</div>`).join('')}</div>
    </div>
    <div class="pile u-ecart-8"><div class="sur-titre">Tous les exercices</div>${lignes}</div>
    <div class="pile u-ecart-8"><div class="sur-titre">Dernières séances</div>${seancesRecentes}</div>
  </main>${nav('progression')}`;
}

export function ecranExercices() {
  const groupes = GROUPES.map((g) => {
    const items = EXERCICES.filter((e) => e.groupe === g).map((e) => `
      <button class="choix ${d.exclus.includes(e.id) ? 'exclu' : ''}" data-action="detail" data-id="${e.id}" style="min-height:64px">
        <span class="mini-dessin">${illustration(e.dessin, e.nom, 40)}</span>
        <span><span class="nom u-t-15">${esc(e.nom)}</span><span class="petit">${esc(e.muscles)}${d.exclus.includes(e.id) ? ' · exclu' : ''}</span></span>
        ${ICONES.suite}
      </button>`).join('');
    return `<div class="groupe-titre ${g === 'Haltérophilie' ? 'h' : ''}">${esc(g)}</div>${items}`;
  }).join('');
  return `<main class="ecran avec-nav">
    <div class="pile u-ecart-6"><div class="sur-titre">${EXERCICES.length} exercices · conseils et historique</div><h1>Exercices</h1></div>
    <div class="pile u-ecart-8">${groupes}</div>
  </main>${nav('exercices')}`;
}

export function ecranDetail() {
  const def = exo(ui.exoDetail);
  const passe = historiqueExo(d.historique, def.id).slice(-6).reverse();
  const exclu = d.exclus.includes(def.id);
  const dans = SEANCES.filter((s) => s.cases.some((c) => c.options.includes(def.id))).map((s) => s.nom);
  const h = estHaltero(def);
  return `<main class="ecran ${h ? 'theme-haltero' : ''}">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="${ui.retour}" aria-label="Retour">${ICONES.retour}</button>
      <div class="sur-titre u-flex-1">${esc(def.groupe)}</div>
    </div>
    <h1 class="u-t-28">${esc(def.nom)}</h1>
    <div class="carte u-aff-flex u-justifie-center u-pad-20">${illustration(def.dessin, def.nom, 180)}</div>
    <div class="carte pile u-ecart-6">
      <div class="label u-c-accent">Conseil</div>
      <div class="u-t-15 u-interligne-1-45">${esc(def.conseil)}</div>
      <div class="petit">${esc(def.muscles)} · par défaut ${cibleTexte(def.cible, def)}${dans.length ? ` · proposé en ${dans.join(', ')}` : ''}</div>
    </div>
    ${h ? `<div class="carte pile u-ecart-8">
      <div class="ligne"><div class="u-flex-1 u-gras-600">Ton record (1 rep)</div><div class="chiffre u-t-24">${d.records[def.id] ? nb(d.records[def.id]) + ' kg' : '—'}</div></div>
      <div class="petit">Les charges sont calculées en % de ce record : ${def.pcts.map((x) => x + ' %').join(' · ')}.</div>
      <button class="btn-secondaire" data-action="record" data-id="${def.id}">Modifier mon record</button>
    </div>` : ''}
    <div class="carte pile u-ecart-8">
      <div class="u-gras-600">Dernières fois</div>
      ${passe.length ? `<div class="liste-perf">${passe.map((p) => `<div><span>${dateCourte(p.date)}</span><span class="petit u-t-14">${resumeSeries(p.series, def)}</span></div>`).join('')}</div>` : '<div class="petit">Jamais fait pour l\'instant.</div>'}
    </div>
    <button class="btn-secondaire" data-action="exclure" data-id="${def.id}">${exclu ? 'Le proposer à nouveau' : 'Ne plus me le proposer'}</button>
    <div class="petit">${exclu ? "Exclu : il n'apparaît plus dans les suggestions ni dans la séance personnalisée." : "S'il est exclu, il n'apparaît plus dans les suggestions ni dans la séance personnalisée."}</div>
  </main>`;
}

/** Actions des boutons de ce fichier (attribut data-action dans le HTML). */
export const actions = {
  prog(el) { ui.exoProg = el.dataset.id; window.scrollTo({ top: 0, behavior: 'smooth' }); },
  'voir-seance'(el) { ui.modal = { type: 'seance', id: el.dataset.id }; },
  'confirmer-suppr'() { ui.modal.confirmer = true; ui.modalGardeScroll = true; },
  'supprimer-seance'(el) {
    d.historique = d.historique.filter((h) => h.id !== el.dataset.id);
    enregistrer();
    ui.modal = null;
    toast('Séance supprimée');
    return false;
  },
  detail(el) { ui.exoDetail = el.dataset.id; ui.retour = 'exercices'; ui.ecran = 'detail'; window.scrollTo(0, 0); },
  exclure(el) {
    const id = el.dataset.id;
    d.exclus = d.exclus.includes(id) ? d.exclus.filter((x) => x !== id) : [...d.exclus, id];
    enregistrer();
  },
  reinclure() { d.exclus = []; enregistrer(); toast('Tous les exercices sont à nouveau proposés'); return false; },
};
