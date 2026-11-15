// Suivi muscu : écrans et déroulé d'une séance.

import { EXERCICES, GROUPES, FAMILLES, SEANCES, exo, seance, cibleFinale, normaliser } from './donnees.js';
import {
  suggestion, historiqueExo, chargeDe, tendance, seancesMemeCharge,
  choisirPourCase, derniereDate, planHaltero, bilanHaltero,
} from './progression.js';
import { importerCsv, fusionner } from './import.js';
import { charger, sauver, valider, vide, demanderPersistance } from './stockage.js';
import { illustration } from './illustrations.js';

export const VERSION = '0.2';

let d = charger();
const ui = {
  ecran: 'accueil', modal: null, toast: null, exoProg: null, exoDetail: null, retour: 'exercices',
  compo: null, perso: null,
};

// ---------- Outils ----------

const $app = document.getElementById('app');

function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function nb(x) {
  return String(Math.round(x * 10) / 10).replace('.', ',');
}

function aujourdhui() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function dateCourte(iso) {
  const [, m, j] = iso.split('-');
  return `${j}/${m}`;
}

function dateLongue(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return new Date(a, m - 1, j).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function joursDepuis(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return Math.round((new Date().setHours(0, 0, 0, 0) - new Date(a, m - 1, j).getTime()) / 86400000);
}

function ilYa(iso) {
  const jours = joursDepuis(iso);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'hier';
  return `il y a ${jours} jours`;
}

function debutSemaine() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function nomExo(id, secours) {
  return exo(id)?.nom || secours || id;
}

const estHaltero = (def) => def?.type === 'haltero';

function chargeTexte(c, def) {
  if (def?.poidsDuCorps) return 'Poids du corps';
  if (c == null) return 'À choisir';
  return `${nb(c)} kg`;
}

function repsTexte(n, def) {
  return def?.unite === 's' ? `${n} s` : `${n} reps`;
}

function cibleTexte(c, def) {
  const u = def?.unite === 's' ? ' s' : '';
  return c.repsMin === c.repsMax ? `${c.series} × ${c.repsMin}${u}` : `${c.series} × ${c.repsMin}–${c.repsMax}${u}`;
}

function mmss(s) {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function enregistrer() {
  if (!sauver(d)) toast("Enregistrement impossible sur ce téléphone");
}

function toast(texte) {
  ui.toast = texte;
  rendre();
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { ui.toast = null; rendre(); }, 3200);
}

// Ce qu'on sait d'un exercice pour l'afficher dans une liste.
function infoExo(id) {
  const def = exo(id);
  if (estHaltero(def)) {
    const r = d.records[id];
    return r ? `record ${nb(r)} kg` : 'record à définir';
  }
  const passe = historiqueExo(d.historique, id);
  if (!passe.length) return def.poidsDuCorps ? 'Poids du corps · jamais fait' : 'jamais fait';
  if (def.poidsDuCorps) return `dernière fois ${ilYa(passe[passe.length - 1].date)}`;
  const c = chargeDe(passe[passe.length - 1].series);
  const memes = seancesMemeCharge(passe);
  const suffixe = def.materiel === 'halteres' ? ' par haltère' : '';
  return memes > 1 ? `${nb(c)} kg${suffixe} depuis ${memes} séances` : `${nb(c)} kg${suffixe}`;
}

const ICONES = {
  retour: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4l-6 6 6 6"></path></svg>',
  suite: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--doux)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l6 6-6 6"></path></svg>',
  chevron: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5l4 4 4-4"></path></svg>',
  coche: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10l4 4 8-9"></path></svg>',
  croix: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg>',
  plus: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"><path d="M10 4v12M4 10h12"></path></svg>',
  reglages: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path></svg>',
  seances: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 11h16M5 7v8M17 7v8M2 9v4M20 9v4"></path></svg>',
  progression: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-6 4 3 7-9"></path></svg>',
  exercices: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h14M4 11h14M4 16h14"></path></svg>',
  loupe: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--doux)" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="5"></circle><path d="M12 12l4 4"></path></svg>',
};

// ---------- Composition des séances Push / Pull / Jambes ----------

function prochaineSeance() {
  const ordre = SEANCES.map((s) => s.id);
  const derniere = [...d.historique].sort((a, b) => (a.date === b.date ? (a.debut || 0) - (b.debut || 0) : a.date < b.date ? -1 : 1))
    .reverse().find((s) => ordre.includes(s.seance));
  if (!derniere) return ordre[0];
  return ordre[(ordre.indexOf(derniere.seance) + 1) % ordre.length];
}

function derniereFois(seanceId) {
  const s = d.historique.filter((h) => h.seance === seanceId).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return s ? ilYa(s.date) : 'jamais faite';
}

function composer(seanceId, mode = 'suggestion') {
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

function dureeEstimee(items) {
  return Math.max(5, Math.round(items.reduce((t, c) => t + c.cible.series * (45 + c.cible.recup), 0) / 60 / 5) * 5);
}

// ---------- Déroulé d'une séance ----------

let verrouEcran = null;

async function garderEcranAllume() {
  try {
    if ('wakeLock' in navigator && d.enCours && !verrouEcran) {
      verrouEcran = await navigator.wakeLock.request('screen');
      verrouEcran.addEventListener('release', () => { verrouEcran = null; });
    }
  } catch (e) { /* refusé : pas grave */ }
}

function libererEcran() {
  try { verrouEcran?.release(); } catch (e) { /* déjà libéré */ }
  verrouEcran = null;
}

function preparerExo(item) {
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

function demarrer(seanceId, nom, items) {
  if (!items.length) return;
  d.enCours = {
    seance: seanceId, nom, debut: Date.now(), index: 0, recup: null,
    exercices: items.map(preparerExo),
  };
  enregistrer();
  ui.ecran = 'exercice';
  ui.modal = null;
  garderEcranAllume();
  rendre();
  window.scrollTo(0, 0);
}

function exoCourant() {
  return d.enCours.exercices[d.enCours.index];
}

function chargeSerie(e, i) {
  if (e.plan) return e.plan[i] ?? e.charge;
  return e.charge;
}

function prochainIndex(depuis) {
  const ex = d.enCours.exercices;
  for (let k = 1; k <= ex.length; k++) {
    const i = (depuis + k) % ex.length;
    if (ex[i].series.length < ex[i].cible.series) return i;
  }
  return -1;
}

function validerSerie(reps) {
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

function finRecup() {
  d.enCours.recup = null;
  enregistrer();
  ui.ecran = 'exercice';
  rendre();
  window.scrollTo(0, 0);
}

function terminer() {
  const ec = d.enCours;
  const faits = ec.exercices.filter((e) => e.series.length);
  d.enCours = null;
  libererEcran();
  ui.finInfos = [];
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
  d.historique.push(s);
  enregistrer();
  ui.ecran = 'fin';
  ui.finId = s.id;
  rendre();
  window.scrollTo(0, 0);
}

// ---------- Écrans ----------

function nav(actif) {
  const b = (id, nom) => `<button data-action="onglet" data-id="${id}" class="${actif === id ? 'actif' : ''}" ${actif === id ? 'aria-current="page"' : ''}>${ICONES[id]}${nom}</button>`;
  return `<nav class="nav"><div>${b('seances', 'Séances')}${b('progression', 'Progression')}${b('exercices', 'Exercices')}</div></nav>`;
}

function ecranAccueil() {
  const deb = debutSemaine();
  const faites = d.historique.filter((s) => s.date >= deb && !s.importee).length;
  const prochaine = seance(prochaineSeance());
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

  let haut;
  if (d.enCours) {
    const faitesSeries = d.enCours.exercices.reduce((t, e) => t + e.series.length, 0);
    haut = `<div class="conseillee">
      <div class="label">Séance en cours</div>
      <div class="titre">${esc(d.enCours.nom || seance(d.enCours.seance)?.nom)}</div>
      <div style="font-size:14px">${faitesSeries} série${faitesSeries > 1 ? 's' : ''} validée${faitesSeries > 1 ? 's' : ''}</div>
      <button class="btn-sombre" data-action="reprendre">Reprendre la séance</button>
    </div>`;
  } else {
    haut = `<button class="conseillee" data-action="composer" data-id="${prochaine.id}" style="border:none;text-align:left">
      <span class="label">Conseillée aujourd'hui</span>
      <span class="titre" style="font-size:30px">${esc(prochaine.nom)}</span>
      <span style="font-size:14px;font-weight:500">${esc(prochaine.description)} · ${derniereFois(prochaine.id)}</span>
    </button>`;
  }
  const off = d.enCours ? 'disabled' : '';
  const autres = SEANCES.filter((s) => d.enCours || s.id !== prochaine.id).map((s) => `
    <button class="choix" data-action="composer" data-id="${s.id}" ${off} style="min-height:72px">
      <span><span class="nom titre-seance">${esc(s.nom)}</span><span class="petit">${esc(s.description)} · ${derniereFois(s.id)}</span></span>
      ${ICONES.suite}
    </button>`).join('');
  const enregistrees = d.seancesPerso.map((s) => `
    <button class="choix" data-action="perso" data-id="${esc(s.id)}" ${off} style="min-height:56px">
      <span><span class="nom" style="font-size:15px">${esc(s.nom)}</span><span class="petit">${s.exercices.length} exercices · ${derniereFois('perso:' + s.id)}</span></span>
      ${ICONES.suite}
    </button>`).join('');

  return `<main class="ecran avec-nav">
    <div class="entete">
      <div><div class="sur-titre">Cette semaine · ${Math.min(faites, 9)} séance${faites > 1 ? 's' : ''} sur 3</div><h1>Prêt pour la séance&nbsp;?</h1></div>
      <button class="btn-icone" data-action="ecran" data-id="reglages" aria-label="Réglages">${ICONES.reglages}</button>
    </div>
    ${standalone ? '' : `<div class="bandeau"><strong>Installe l'appli :</strong> dans Safari, touche Partager puis « Sur l'écran d'accueil ». C'est indispensable pour que tes données restent bien sur le téléphone.</div>`}
    ${haut}
    <div class="pile">
      ${autres}
      <button class="choix pointille-accent" data-action="perso" ${off} style="min-height:72px">
        <span class="carre-plus">${ICONES.plus}</span>
        <span><span class="nom titre-seance" style="font-size:20px">Séance personnalisée</span><span class="petit">Choisis parmi tous les exercices, haltéro compris</span></span>
      </button>
      ${enregistrees ? `<div class="sur-titre" style="margin-top:4px">Tes séances enregistrées</div>${enregistrees}` : ''}
    </div>
  </main>${nav('seances')}`;
}

function ecranComposer() {
  const c = ui.compo;
  const s = seance(c.seance);
  const puce = (m, t) => `<button class="puce ${c.mode === m ? 'on' : ''}" data-action="mode" data-id="${m}" aria-pressed="${c.mode === m}">${t}</button>`;
  const items = c.cases.map((k, i) => {
    const def = exo(k.exo);
    const cible = cibleFinale(def, k.cible);
    return `<div class="case-seance">
      <button class="case-choix" data-action="choix" data-i="${i}">
        <span class="label petit" style="font-size:11px">${esc(k.role)}</span>
        <span class="nom-case">${esc(def.nom)} ${ICONES.chevron}</span>
        <span class="petit">${cibleTexte(cible, def)} · ${esc(infoExo(k.exo))}</span>
        ${k.raison ? `<span class="raison">${esc(k.raison)}</span>` : ''}
      </button>
      <button class="btn-retirer" data-action="retirer" data-i="${i}" aria-label="Retirer ${esc(def.nom)}">${ICONES.croix}</button>
    </div>`;
  }).join('');
  const liste = c.cases.map((k) => ({ cible: cibleFinale(exo(k.exo), k.cible) }));
  return `<main class="ecran">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="seances" aria-label="Retour">${ICONES.retour}</button>
      <div style="flex:1;gap:2px" class="pile"><div class="sur-titre">Composer ta séance</div><h1 style="font-size:26px">${esc(s.nom)}</h1></div>
    </div>
    <div class="puces">${puce('suggestion', 'Suggestion')}${puce('derniere', 'Comme la dernière fois')}${puce('courte', 'Courte')}</div>
    <div class="petit">Touche un exercice pour le changer.</div>
    <div class="pile" style="gap:8px">
      ${items || '<div class="carte petit">Aucun exercice : ajoute-en un.</div>'}
      <button class="btn-ajout" data-action="choix" data-i="-1">+ Ajouter un exercice</button>
    </div>
    <div class="pousse"></div>
    <div class="barre-action">
      <button class="btn-principal" data-action="go-compo" ${c.cases.length ? '' : 'disabled'}>Démarrer · ${c.cases.length} exercice${c.cases.length > 1 ? 's' : ''} · ${dureeEstimee(liste)} min</button>
    </div>
  </main>`;
}

// Suggestions de la séance personnalisée : exercices fréquents récemment, pas faits ces 2 derniers jours.
function suggestionsPerso() {
  const compte = new Map();
  for (const s of d.historique) {
    if (joursDepuis(s.date) > 45) continue;
    for (const e of s.exercices) if (exo(e.exo)) compte.set(e.exo, (compte.get(e.exo) || 0) + 1);
  }
  let ids = [...compte.entries()]
    .filter(([id]) => !d.exclus.includes(id) && (!derniereDate(d.historique, id) || joursDepuis(derniereDate(d.historique, id)) > 2))
    .sort((a, b) => b[1] - a[1]).map(([id]) => id);
  if (ids.length < 4) {
    const s = seance(prochaineSeance());
    for (const c of s.cases) {
      const o = c.options.find((x) => !d.exclus.includes(x));
      if (o && !ids.includes(o)) ids.push(o);
    }
  }
  return ids.slice(0, 4);
}

function lignePerso(id) {
  const def = exo(id);
  const pos = ui.perso.sel.indexOf(id);
  const on = pos >= 0;
  return `<button class="ligne-coche ${on ? 'on' : ''} ${estHaltero(def) ? 'h' : ''}" data-action="cocher" data-id="${id}" aria-pressed="${on}">
    <span class="coche">${on ? '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l3 3 5-6"></path></svg>' : ''}</span>
    <span class="txt"><span class="nom">${esc(def.nom)}</span><span class="petit">${esc(def.muscles)} · ${esc(infoExo(id))}</span></span>
    ${on ? `<span class="ordre">${pos + 1}</span>` : ''}
  </button>`;
}

function listePerso() {
  const p = ui.perso;
  const q = normaliser(p.q);
  const garde = (e) => !d.exclus.includes(e.id) && (p.filtre === 'tous' || e.famille === p.filtre)
    && (!q || normaliser(`${e.nom} ${e.muscles} ${e.groupe}`).includes(q));
  let html = '';
  if (!q && p.filtre === 'tous') {
    const sug = suggestionsPerso();
    if (sug.length) html += `<div class="groupe-titre">Suggérés pour toi</div>${sug.map(lignePerso).join('')}`;
  }
  for (const g of GROUPES) {
    const items = EXERCICES.filter((e) => e.groupe === g && garde(e));
    if (items.length) html += `<div class="groupe-titre ${g === 'Haltérophilie' ? 'h' : ''}">${esc(g)}</div>${items.map((e) => lignePerso(e.id)).join('')}`;
  }
  return html || '<div class="carte petit">Aucun exercice ne correspond.</div>';
}

function ecranPerso() {
  const p = ui.perso;
  const filtres = FAMILLES.map(([id, t]) => `<button class="puce ${p.filtre === id ? 'on' : ''} ${id === 'haltero' ? 'h' : ''}" data-action="filtre" data-id="${id}" aria-pressed="${p.filtre === id}">${t}</button>`).join('');
  const n = p.sel.length;
  return `<main class="ecran">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="seances" aria-label="Retour">${ICONES.retour}</button>
      <h1 style="flex:1;font-size:24px">${esc(p.nom || 'Séance personnalisée')}</h1>
    </div>
    <label class="recherche">${ICONES.loupe}<input id="recherche" type="search" placeholder="Rechercher un exercice" aria-label="Rechercher un exercice" value="${esc(p.q)}" autocomplete="off"></label>
    <div class="puces defile">${filtres}</div>
    <div class="petit">Coche les exercices dans l'ordre où tu veux les faire.</div>
    <div class="pile" style="gap:8px" id="perso-liste">${listePerso()}</div>
    <div class="barre-action">
      <div class="ligne" style="gap:10px">
        <button class="btn-secondaire" style="width:auto;padding:0 16px;height:60px" data-action="enregistrer" ${n ? '' : 'disabled'}>${p.id ? 'Mettre à jour' : 'Enregistrer'}</button>
        <button class="btn-principal" data-action="go-perso" ${n ? '' : 'disabled'}>Démarrer · ${n} exercice${n > 1 ? 's' : ''}</button>
      </div>
      ${p.id ? '<button class="btn-lien btn-danger" data-action="suppr-perso" style="width:100%">Supprimer cette séance enregistrée</button>' : ''}
    </div>
  </main>`;
}

function enteteSeance(theme) {
  const ec = d.enCours;
  const barres = ec.exercices.map((x) => `<div class="${x.series.length >= x.cible.series ? 'fait' : ''}"></div>`).join('');
  return `<div class="ligne">
      <button class="btn-icone" data-action="quitter" aria-label="Quitter la séance">${ICONES.retour}</button>
      <div style="flex:1" class="pile">
        <div class="sur-titre">${esc(ec.nom || seance(ec.seance)?.nom)} · exercice ${ec.index + 1} sur ${ec.exercices.length}</div>
        <div class="barres" style="grid-template-columns:repeat(${ec.exercices.length},minmax(0,1fr))">${barres}</div>
      </div>
    </div>`;
}

function ecranExercice() {
  const e = exoCourant();
  const def = exo(e.exo);
  if (estHaltero(def)) return ecranHaltero(e, def);
  const fait = e.series.length;
  const pas = def.unite === 's' ? 5 : 1;

  const lignes = [];
  for (let i = 0; i < e.cible.series; i++) {
    if (i < fait) {
      const sr = e.series[i];
      lignes.push(`<div class="serie faite">${ICONES.coche}<div class="titre">Série ${i + 1}</div><div class="petit" style="font-size:15px">${repsTexte(sr.reps, def)}${def.poidsDuCorps ? '' : ` · ${nb(sr.charge)} kg`}</div></div>`);
    } else if (i === fait) {
      lignes.push(`<div class="serie active">
        <div class="titre">Série ${i + 1}</div>
        <div class="stepper">
          <button data-action="reps" data-d="-${pas}" aria-label="Moins">−</button>
          <div class="val" aria-live="polite">${repsTexte(e.reps, def)}</div>
          <button data-action="reps" data-d="${pas}" aria-label="Plus">+</button>
        </div>
      </div>`);
    } else {
      lignes.push(`<div class="serie avenir"><div class="rond"></div><div class="titre">Série ${i + 1}</div><div style="font-size:15px">à venir</div></div>`);
    }
  }

  const unite = def.materiel === 'halteres' ? 'par haltère · ' : '';
  return `<main class="ecran">
    ${enteteSeance()}
    <h1 style="font-size:28px">${esc(def.nom)}</h1>
    <div class="carte illu" style="padding:12px">
      <div class="dessin">${illustration(def.dessin, def.nom)}</div>
      <div class="texte">
        <div class="label" style="color:var(--accent)">Conseil</div>
        <div>${esc(def.conseil)}</div>
        <div class="petit" style="font-size:12px">${esc(def.muscles)}</div>
      </div>
    </div>
    <div class="grille2">
      <button class="case" data-action="options" ${def.poidsDuCorps ? 'disabled style="opacity:1"' : ''}>
        <span class="petit">Poids conseillé</span>
        <span class="chiffre" style="${e.charge == null || def.poidsDuCorps ? 'font-size:24px' : ''}">${chargeTexte(e.charge, def)}</span>
        <span class="petit" style="font-size:12px">${def.poidsDuCorps ? esc(e.raison) : unite + esc(e.charge !== e.conseillee ? 'modifié pour cette séance' : e.raison)}</span>
      </button>
      <div class="carte case">
        <span class="petit">Objectif</span>
        <span class="chiffre">${e.cible.repsMin} à ${e.cible.repsMax}</span>
        <span class="petit" style="font-size:12px">${def.unite === 's' ? 'secondes' : 'reps'} · ${e.cible.series} séries</span>
      </div>
    </div>
    <div class="pile" style="gap:8px">${lignes.join('')}</div>
    <div class="pousse"></div>
    <div class="pile" style="gap:6px">
      <button class="btn-principal" data-action="valider">Valider la série ${fait + 1}</button>
      <div class="ligne" style="justify-content:space-between">
        <button class="btn-lien" data-action="ajout-serie">+ Ajouter une série</button>
        <button class="btn-lien" data-action="options">Poids · remplacer</button>
      </div>
    </div>
  </main>`;
}

function ecranHaltero(e, def) {
  const fait = e.series.length;
  const total = e.cible.series;
  const reps = e.cible.repsMin;
  const charge = chargeSerie(e, fait);
  const record = d.records[def.id];
  const pcts = def.pcts.slice();
  while (pcts.length < total) pcts.push(pcts[pcts.length - 1]);
  const dec = d.haltero[def.id] || 0;
  const pct = pcts[Math.min(fait, pcts.length - 1)] + dec;
  const faites = e.series.map((sr, i) => `<div class="serie faite">${ICONES.coche}<div class="titre">Série ${i + 1} · ${nb(sr.charge)} kg</div><div class="petit" style="font-size:14px">${sr.reps} sur ${reps}</div></div>`).join('');
  const reste = total - fait - 1;
  const boutons = Array.from({ length: reps + 1 }, (_, n) => `<button class="${n === reps ? 'on' : ''}" data-action="valider-h" data-n="${n}">${n === reps && reps > 1 ? `${n} · toutes` : n}</button>`).join('');
  return `<main class="ecran theme-haltero">
    ${enteteSeance()}
    <h1>${esc(def.nom)}</h1>
    <div class="carte pile" style="gap:12px;padding:16px;border-radius:18px">
      <div class="ligne" style="align-items:flex-end">
        <div style="flex:1;gap:4px" class="pile">
          <div class="petit">Série ${fait + 1} sur ${total} · ${repsTexte(reps, def)}</div>
          <button class="chiffre lien-chiffre" data-action="options" style="font-size:${charge == null ? 30 : 52}px">${charge == null ? 'À choisir' : nb(charge) + ' kg'}</button>
        </div>
        ${record ? `<div class="pile" style="align-items:flex-end;gap:4px"><div class="chiffre" style="font-size:28px;color:var(--accent)">${nb(pct)} %</div><div class="petit" style="font-size:12px">de ton record ${nb(record)} kg</div></div>` : ''}
      </div>
      <div class="petit">${record ? `Montée en charge : ${pcts.map((x, i) => (i === fait ? `<strong style="color:var(--texte)">${nb(x + dec)} %</strong>` : `${nb(x + dec)} %`)).join(' · ')}` : esc(e.raison)}</div>
    </div>
    <div class="pile" style="gap:8px">
      ${faites}
      ${reste > 0 ? `<div class="serie avenir"><div class="rond"></div><div class="titre">${reste > 1 ? `Séries ${fait + 2} à ${total}` : `Série ${total}`}</div><div style="font-size:14px">à venir</div></div>` : ''}
    </div>
    <div class="carte illu" style="padding:12px">
      <div class="dessin" style="width:88px;height:88px">${illustration(def.dessin, def.nom, 80)}</div>
      <div class="texte"><div class="label" style="color:var(--accent)">Conseil</div><div>${esc(def.conseil)}</div></div>
    </div>
    <div class="pousse"></div>
    <div class="pile" style="gap:10px">
      <div style="font-size:14px;font-weight:600;text-align:center">Combien de reps réussies sur ${reps}&nbsp;?</div>
      <div class="choix-reps" style="grid-template-columns:repeat(${reps + 1},minmax(0,1fr))">${boutons}</div>
      <div class="ligne" style="justify-content:space-between">
        <button class="btn-lien" data-action="ajout-serie">+ Ajouter une série</button>
        <button class="btn-lien" data-action="options">Poids · record</button>
      </div>
    </div>
  </main>`;
}

function ecranRecup() {
  const ec = d.enCours;
  const r = ec.recup;
  const exoFait = ec.exercices[r.exoIndex];
  const derSerie = exoFait.series[r.serieIndex];
  const e = exoCourant();
  const def = exo(e.exo);
  const theme = estHaltero(exo(exoFait.exo)) ? 'theme-haltero' : '';
  const btnR = (v, t) => `<button data-action="ressenti" data-v="${v}" class="${derSerie?.ressenti === v ? 'on' : ''}" aria-pressed="${derSerie?.ressenti === v}">${t}</button>`;
  const prochaineCharge = chargeSerie(e, e.series.length);
  return `<main class="ecran ${theme}" style="gap:22px">
    <div class="pile" style="gap:6px;text-align:center">
      <div class="sur-titre">${esc(nomExo(exoFait.exo))} · série ${r.serieIndex + 1} validée</div>
      <h1 style="font-size:28px" id="recup-titre">Récupération</h1>
    </div>
    <div class="minuteur">
      <svg aria-hidden="true" width="240" height="240" viewBox="0 0 240 240" fill="none">
        <circle cx="120" cy="120" r="106" stroke="var(--carte2)" stroke-width="12"></circle>
        <circle id="anneau" class="anneau" cx="120" cy="120" r="106" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" stroke-dasharray="666 666" transform="rotate(-90 120 120)"></circle>
      </svg>
      <div class="centre" role="timer" aria-live="off">
        <div class="temps" id="temps">${mmss(r.duree)}</div>
        <div class="petit" id="temps-sous">sur ${mmss(r.duree)}</div>
      </div>
    </div>
    <div class="grille3">
      <button class="btn-secondaire" data-action="ajuster" data-d="-15">− 15 s</button>
      <button class="btn-secondaire" data-action="ajuster" data-d="15">+ 15 s</button>
      <button class="btn-secondaire" data-action="fin-recup">Passer</button>
    </div>
    <div class="carte pile" style="gap:12px;padding:16px">
      <div style="font-size:15px;font-weight:600">Comment était cette série&nbsp;?</div>
      <div class="grille3 choix-ressenti" style="gap:8px">${btnR('facile', 'Facile')}${btnR('correct', 'Correct')}${btnR('dur', 'Dur')}</div>
      <div class="petit">Facultatif. Sert à ajuster le poids conseillé de la prochaine séance.</div>
    </div>
    <div class="pousse"></div>
    <button class="choix" data-action="fin-recup" style="background:transparent">
      <span>
        <span class="label petit" style="color:var(--doux)">Ensuite</span>
        <span class="nom">${e === exoFait ? '' : esc(def.nom) + ' · '}Série ${e.series.length + 1} sur ${e.cible.series}${def.poidsDuCorps ? '' : ` · ${chargeTexte(prochaineCharge, def)}`}</span>
        <span class="petit">Objectif ${e.cible.repsMin === e.cible.repsMax ? e.cible.repsMin : `${e.cible.repsMin} à ${e.cible.repsMax}`} ${def.unite === 's' ? 'secondes' : 'reps'}</span>
      </span>
      ${ICONES.suite}
    </button>
  </main>`;
}

function resumeSeries(series, def) {
  if (def?.unite === 's') return `${series.length} × ${series.map((s) => s.reps).join(' / ')} s`;
  if (estHaltero(def)) return series.map((s) => `${nb(s.charge)} kg×${s.reps}`).join(' · ');
  const reps = series.map((s) => s.reps).join(' / ');
  if (def?.poidsDuCorps || chargeDe(series) === 0) return `${series.length} × ${reps} reps`;
  return `${series.length} séries · ${reps} reps · ${nb(chargeDe(series))} kg`;
}

function ecranFin() {
  const s = d.historique.find((h) => h.id === ui.finId);
  if (!s) { ui.ecran = 'accueil'; return ecranAccueil(); }
  const minutes = Math.round((s.fin - s.debut) / 60000);
  const nbSeries = s.exercices.reduce((t, e) => t + e.series.length, 0);
  const volume = s.exercices.reduce((t, e) => t + e.series.reduce((v, x) => v + (exo(e.exo)?.unite === 's' ? 0 : x.reps * x.charge), 0), 0);
  const derExo = s.exercices[s.exercices.length - 1];
  const der = derExo.series[derExo.series.length - 1];
  const btnR = (v, t) => `<button data-action="ressenti-fin" data-v="${v}" class="${der.ressenti === v ? 'on' : ''}" aria-pressed="${der.ressenti === v}">${t}</button>`;
  return `<main class="ecran">
    <div class="pile" style="gap:6px">
      <div class="sur-titre">${esc(s.nom)} · ${dateLongue(s.date)}</div>
      <h1>Séance terminée</h1>
    </div>
    ${(ui.finInfos || []).map((t) => `<div class="bandeau">${esc(t)}</div>`).join('')}
    <div class="grille3">
      <div class="carte case"><span class="petit">Durée</span><span class="chiffre" style="font-size:24px">${minutes} min</span></div>
      <div class="carte case"><span class="petit">Séries</span><span class="chiffre" style="font-size:24px">${nbSeries}</span></div>
      <div class="carte case"><span class="petit">Volume</span><span class="chiffre" style="font-size:24px">${Math.round(volume)} kg</span></div>
    </div>
    <div class="carte pile" style="gap:12px;padding:16px">
      <div style="font-size:15px;font-weight:600">Et la dernière série&nbsp;?</div>
      <div class="grille3 choix-ressenti" style="gap:8px">${btnR('facile', 'Facile')}${btnR('correct', 'Correct')}${btnR('dur', 'Dur')}</div>
    </div>
    <div class="pile">
      ${s.exercices.map((e) => `<div class="carte"><div style="font-weight:600">${esc(nomExo(e.exo, e.nom))}</div><div class="petit">${resumeSeries(e.series, exo(e.exo))}</div></div>`).join('')}
    </div>
    <button class="btn-principal" data-action="onglet" data-id="seances">Retour à l'accueil</button>
  </main>`;
}

function exosAvecHistorique() {
  const ids = new Map();
  for (const s of d.historique) for (const e of s.exercices) ids.set(e.exo, { nom: e.nom, date: s.date > (ids.get(e.exo)?.date || '') ? s.date : ids.get(e.exo).date });
  return [...ids.entries()].map(([id, v]) => ({ id, nom: nomExo(id, v.nom), date: v.date }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.nom.localeCompare(b.nom)));
}

function ecranProgression() {
  const liste = exosAvecHistorique();
  if (!liste.length) {
    return `<main class="ecran avec-nav">
      <div class="pile" style="gap:6px"><div class="sur-titre">Tes charges séance après séance</div><h1>Progression</h1></div>
      <div class="carte petit" style="font-size:15px">Aucune séance pour l'instant. Fais ta première séance, ou importe ton ancien suivi depuis les réglages.</div>
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
      <span><span class="nom" style="font-size:15px">${esc(x.nom)}</span><span class="petit">${sous}</span></span>
      <span class="${t}" style="font-size:14px;font-weight:700">${mot}</span>
    </button>`;
  }).join('');

  const seancesRecentes = [...d.historique].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12).map((s) => `
    <button class="choix" data-action="voir-seance" data-id="${esc(s.id)}" style="min-height:56px">
      <span><span class="nom" style="font-size:15px">${esc(s.nom || s.seance)}</span><span class="petit">${dateLongue(s.date)} · ${s.exercices.length} exercices</span></span>
      ${ICONES.suite}
    </button>`).join('');

  return `<main class="ecran avec-nav">
    <div class="pile" style="gap:6px"><div class="sur-titre">Tes charges séance après séance</div><h1>Progression</h1></div>
    <div class="carte pile" style="gap:14px;padding:16px;border-radius:18px">
      <div class="ligne" style="align-items:flex-end">
        <div style="flex:1;gap:3px" class="pile"><div style="font-size:16px;font-weight:600">${esc(sel.nom)}</div><div class="petit">${poidsCorps ? 'Meilleure série' : 'Charge par séance'} · ${n} dernière${n > 1 ? 's' : ''}</div></div>
        <div class="chiffre ${deltaV > 0 ? 'hausse' : deltaV < 0 ? 'baisse' : 'stable'}" style="font-size:26px">${deltaV > 0 ? '+' : ''}${nb(deltaV)}${uniteV}</div>
      </div>
      <div class="graph" style="${cols}">
        ${valeurs.map((v, i) => `<div class="col ${i === n - 1 ? 'der' : ''}"><div class="v">${nb(v)}</div><div class="barre" style="height:${Math.round(hautV(v) * 1.1)}px"></div></div>`).join('')}
      </div>
      <div class="dates" style="${cols}">${passe.map((p) => `<div>${dateCourte(p.date)}</div>`).join('')}</div>
    </div>
    <div class="pile" style="gap:8px"><div class="sur-titre">Tous les exercices</div>${lignes}</div>
    <div class="pile" style="gap:8px"><div class="sur-titre">Dernières séances</div>${seancesRecentes}</div>
  </main>${nav('progression')}`;
}

function ecranExercices() {
  const groupes = GROUPES.map((g) => {
    const items = EXERCICES.filter((e) => e.groupe === g).map((e) => `
      <button class="choix ${d.exclus.includes(e.id) ? 'exclu' : ''}" data-action="detail" data-id="${e.id}" style="min-height:64px">
        <span class="mini-dessin">${illustration(e.dessin, e.nom, 40)}</span>
        <span><span class="nom" style="font-size:15px">${esc(e.nom)}</span><span class="petit">${esc(e.muscles)}${d.exclus.includes(e.id) ? ' · exclu' : ''}</span></span>
        ${ICONES.suite}
      </button>`).join('');
    return `<div class="groupe-titre ${g === 'Haltérophilie' ? 'h' : ''}">${esc(g)}</div>${items}`;
  }).join('');
  return `<main class="ecran avec-nav">
    <div class="pile" style="gap:6px"><div class="sur-titre">${EXERCICES.length} exercices · conseils et historique</div><h1>Exercices</h1></div>
    <div class="pile" style="gap:8px">${groupes}</div>
  </main>${nav('exercices')}`;
}

function ecranDetail() {
  const def = exo(ui.exoDetail);
  const passe = historiqueExo(d.historique, def.id).slice(-6).reverse();
  const exclu = d.exclus.includes(def.id);
  const dans = SEANCES.filter((s) => s.cases.some((c) => c.options.includes(def.id))).map((s) => s.nom);
  const h = estHaltero(def);
  return `<main class="ecran ${h ? 'theme-haltero' : ''}">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="${ui.retour}" aria-label="Retour">${ICONES.retour}</button>
      <div class="sur-titre" style="flex:1">${esc(def.groupe)}</div>
    </div>
    <h1 style="font-size:28px">${esc(def.nom)}</h1>
    <div class="carte" style="display:flex;justify-content:center;padding:20px">${illustration(def.dessin, def.nom, 180)}</div>
    <div class="carte pile" style="gap:6px">
      <div class="label" style="color:var(--accent)">Conseil</div>
      <div style="font-size:15px;line-height:1.45">${esc(def.conseil)}</div>
      <div class="petit">${esc(def.muscles)} · par défaut ${cibleTexte(def.cible, def)}${dans.length ? ` · proposé en ${dans.join(', ')}` : ''}</div>
    </div>
    ${h ? `<div class="carte pile" style="gap:8px">
      <div class="ligne"><div style="flex:1;font-weight:600">Ton record (1 rep)</div><div class="chiffre" style="font-size:24px">${d.records[def.id] ? nb(d.records[def.id]) + ' kg' : '—'}</div></div>
      <div class="petit">Les charges sont calculées en % de ce record : ${def.pcts.map((x) => x + ' %').join(' · ')}.</div>
      <button class="btn-secondaire" data-action="record" data-id="${def.id}">Modifier mon record</button>
    </div>` : ''}
    <div class="carte pile" style="gap:8px">
      <div style="font-weight:600">Dernières fois</div>
      ${passe.length ? `<div class="liste-perf">${passe.map((p) => `<div><span>${dateCourte(p.date)}</span><span class="petit" style="font-size:14px">${resumeSeries(p.series, def)}</span></div>`).join('')}</div>` : '<div class="petit">Jamais fait pour l\'instant.</div>'}
    </div>
    <button class="btn-secondaire" data-action="exclure" data-id="${def.id}">${exclu ? 'Le proposer à nouveau' : 'Ne plus me le proposer'}</button>
    <div class="petit">${exclu ? "Exclu : il n'apparaît plus dans les suggestions ni dans la séance personnalisée." : "S'il est exclu, il n'apparaît plus dans les suggestions ni dans la séance personnalisée."}</div>
  </main>`;
}

function ecranReglages() {
  const nbS = d.historique.length;
  return `<main class="ecran">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="seances" aria-label="Retour">${ICONES.retour}</button>
      <h1 style="flex:1;font-size:26px">Réglages</h1>
    </div>
    <div class="carte pile">
      <div style="font-weight:600">Tes données</div>
      <div class="petit">${nbS} séance${nbS > 1 ? 's' : ''} enregistrée${nbS > 1 ? 's' : ''}, uniquement sur ce téléphone. Fais une sauvegarde de temps en temps (Fichiers ou iCloud Drive).</div>
      <button class="btn-secondaire" data-action="exporter">Exporter une sauvegarde</button>
      <label class="btn-secondaire" style="display:flex;align-items:center;justify-content:center;cursor:pointer">
        Importer un fichier
        <input type="file" class="cache" data-action="importer" accept=".csv,.json,text/csv,application/json,text/plain">
      </label>
      <div class="petit">Accepte une sauvegarde de l'appli (.json) ou ton ancien suivi Google Sheet exporté en CSV (onglet musculation).</div>
    </div>
    ${d.exclus.length ? `<div class="carte pile">
      <div style="font-weight:600">Exercices exclus</div>
      <div class="petit" style="font-size:14px">${d.exclus.map((id) => esc(nomExo(id))).join(', ')}</div>
      <button class="btn-secondaire" data-action="reinclure">Tout proposer à nouveau</button>
    </div>` : ''}
    <div class="carte pile">
      <div style="font-weight:600">Tout effacer</div>
      <div class="petit">Supprime l'historique, les records et les séances enregistrées de ce téléphone.</div>
      <button class="btn-secondaire btn-danger" data-action="effacer">Effacer toutes les données</button>
    </div>
    <div class="petit" style="text-align:center">Suivi muscu · version ${VERSION}</div>
  </main>`;
}

// ---------- Fenêtres ----------

function ligneChoix(id, actuel, indexCase) {
  const def = exo(id);
  return `<button class="choix ${id === actuel ? 'selection' : ''}" data-action="choisir" data-id="${id}" data-i="${indexCase}" style="min-height:58px">
    <span class="mini-dessin">${illustration(def.dessin, def.nom, 40)}</span>
    <span><span class="nom" style="font-size:15px">${esc(def.nom)}</span><span class="petit">${esc(infoExo(id))}</span></span>
    ${id === actuel ? ICONES.coche : ''}
  </button>`;
}

function modalHtml() {
  const m = ui.modal;
  if (!m) return '';
  let contenu = '';
  if (m.type === 'choix') {
    const c = ui.compo;
    const dejaLa = c.cases.map((k) => k.exo);
    if (m.i >= 0) {
      const cas = c.cases[m.i];
      const def = exo(cas.exo);
      const sug = cas.options.filter((o) => !d.exclus.includes(o) && (o === cas.exo || !dejaLa.includes(o)));
      const autres = EXERCICES.filter((e) => e.groupe === def.groupe && !sug.includes(e.id) && !d.exclus.includes(e.id) && !dejaLa.includes(e.id));
      contenu = `<div class="label petit">${esc(cas.role)}</div><h2>Choisis l'exercice</h2>
        ${sug.length ? `<div class="sur-titre">Suggérés</div>${sug.map((id) => ligneChoix(id, cas.exo, m.i)).join('')}` : ''}
        ${autres.length ? `<div class="sur-titre">Tous les exercices ${esc(def.groupe.toLowerCase())}</div>${autres.map((e) => ligneChoix(e.id, cas.exo, m.i)).join('')}` : ''}
        <button class="btn-principal" data-action="fermer">Fermer</button>`;
    } else {
      const s = seance(c.seance);
      const ordre = [...GROUPES].sort((a, b) => {
        const fa = EXERCICES.some((e) => e.groupe === a && e.famille === s.id) ? 0 : 1;
        const fb = EXERCICES.some((e) => e.groupe === b && e.famille === s.id) ? 0 : 1;
        return fa - fb;
      });
      contenu = `<h2>Ajouter un exercice</h2>
        ${ordre.map((g) => {
    const items = EXERCICES.filter((e) => e.groupe === g && !d.exclus.includes(e.id) && !dejaLa.includes(e.id));
    return items.length ? `<div class="groupe-titre ${g === 'Haltérophilie' ? 'h' : ''}">${esc(g)}</div>${items.map((e) => ligneChoix(e.id, null, -1)).join('')}` : '';
  }).join('')}
        <button class="btn-principal" data-action="fermer">Fermer</button>`;
    }
  } else if (m.type === 'options') {
    const e = exoCourant();
    const def = exo(e.exo);
    const dansSeance = d.enCours.exercices.map((x) => x.exo);
    const alts = EXERCICES.filter((x) => x.groupe === def.groupe && x.id !== def.id && !d.exclus.includes(x.id) && !dansSeance.includes(x.id));
    const fait = e.series.length;
    const charge = chargeSerie(e, fait);
    if (estHaltero(def)) {
      const record = d.records[def.id];
      contenu = `<h2>${esc(def.nom)}</h2>
        <div class="carte pile">
          <div class="ligne"><div style="flex:1;font-weight:600">Poids de cette série</div>
            <div class="stepper"><button data-action="charge" data-d="-1" aria-label="Moins lourd">−</button><div class="val">${charge == null ? '—' : nb(charge) + ' kg'}</div><button data-action="charge" data-d="1" aria-label="Plus lourd">+</button></div>
          </div>
          <div class="petit">Par pas de 1 kg. Ne change que la série en cours.</div>
        </div>
        <div class="carte pile">
          <div class="ligne"><div style="flex:1;font-weight:600">Record (1 rep)</div>
            <div class="stepper"><button data-action="record-pas" data-id="${def.id}" data-d="-1" aria-label="Record moins">−</button><div class="val">${record ? nb(record) + ' kg' : '—'}</div><button data-action="record-pas" data-id="${def.id}" data-d="1" aria-label="Record plus">+</button></div>
          </div>
          <div class="petit">Recalcule les séries restantes en % du record.</div>
          ${record ? `<button class="btn-lien" data-action="record-inconnu" data-id="${def.id}">Je ne connais pas mon record</button>` : ''}
        </div>
        ${fait === 0 && alts.length ? `<div class="sur-titre">Remplacer par</div>${alts.map((a) => `<button class="choix" data-action="remplacer" data-id="${a.id}" style="min-height:52px"><span><span class="nom" style="font-size:15px">${esc(a.nom)}</span><span class="petit">${esc(infoExo(a.id))}</span></span></button>`).join('')}` : ''}
        <button class="btn-secondaire" data-action="passer-exo">Passer cet exercice</button>
        <button class="btn-principal" data-action="fermer">OK</button>`;
    } else {
      contenu = `<h2>${esc(def.nom)}</h2>
        ${def.poidsDuCorps ? '' : `<div class="carte pile">
          <div class="ligne"><div style="flex:1;font-weight:600">Poids${def.materiel === 'halteres' ? ' par haltère' : ''}</div>
            <div class="stepper"><button data-action="charge" data-d="-1" aria-label="Moins lourd">−</button><div class="val">${e.charge == null ? '—' : nb(e.charge) + ' kg'}</div><button data-action="charge" data-d="1" aria-label="Plus lourd">+</button></div>
          </div>
          <div class="petit">Par pas de ${nb(def.increment)} kg${e.conseillee != null ? ` · conseillé ${nb(e.conseillee)} kg` : ''}. Vaut pour la suite de cet exercice.</div>
        </div>`}
        ${fait === 0 && alts.length ? `<div class="sur-titre">Remplacer par</div>${alts.map((a) => `<button class="choix" data-action="remplacer" data-id="${a.id}" style="min-height:52px"><span class="mini-dessin">${illustration(a.dessin, a.nom, 40)}</span><span><span class="nom" style="font-size:15px">${esc(a.nom)}</span><span class="petit">${esc(infoExo(a.id))}</span></span></button>`).join('')}` : ''}
        <button class="btn-secondaire" data-action="passer-exo">Passer cet exercice</button>
        <button class="btn-principal" data-action="fermer">OK</button>`;
    }
  } else if (m.type === 'record') {
    const def = exo(m.id);
    const r = d.records[def.id];
    contenu = `<h2>Record · ${esc(def.nom)}</h2>
      <div class="carte ligne"><div style="flex:1;font-weight:600">1 rep max</div>
        <div class="stepper"><button data-action="record-pas" data-id="${def.id}" data-d="-1" aria-label="Moins">−</button><div class="val">${r ? nb(r) + ' kg' : '—'}</div><button data-action="record-pas" data-id="${def.id}" data-d="1" aria-label="Plus">+</button></div>
      </div>
      <div class="ligne" style="gap:8px">${[-10, -5, 5, 10].map((x) => `<button class="btn-secondaire" data-action="record-pas" data-id="${def.id}" data-d="${x}">${x > 0 ? '+' : '−'}${Math.abs(x)}</button>`).join('')}</div>
      ${r ? `<button class="btn-lien" data-action="record-inconnu" data-id="${def.id}">Je ne connais pas mon record</button>` : ''}
      <button class="btn-principal" data-action="fermer">OK</button>`;
  } else if (m.type === 'enregistrer') {
    contenu = `<h2>Enregistrer la séance</h2>
      <label class="pile" style="gap:6px"><span class="petit">Nom de la séance</span>
        <input id="nom-seance" class="champ" maxlength="40" value="${esc(ui.perso.nom || '')}" placeholder="Ex. Haltéro arraché">
      </label>
      <div class="petit">Elle apparaîtra sur l'accueil, sous « Séance personnalisée ».</div>
      <button class="btn-principal" data-action="enregistrer-ok">Enregistrer</button>
      <button class="btn-secondaire" data-action="fermer">Annuler</button>`;
  } else if (m.type === 'suppr-perso') {
    contenu = `<h2>Supprimer « ${esc(ui.perso.nom)} » ?</h2>
      <div class="petit">Seule la séance enregistrée est supprimée, pas ton historique.</div>
      <button class="btn-secondaire btn-danger" data-action="suppr-perso-ok">Oui, supprimer</button>
      <button class="btn-principal" data-action="fermer">Annuler</button>`;
  } else if (m.type === 'quitter') {
    const faites = d.enCours.exercices.reduce((t, e) => t + e.series.length, 0);
    contenu = `
      <h2>Quitter la séance&nbsp;?</h2>
      <button class="btn-secondaire" data-action="pause">Revenir plus tard (garder en cours)</button>
      ${faites ? '<button class="btn-secondaire" data-action="terminer">Terminer et enregistrer</button>' : ''}
      <button class="btn-secondaire btn-danger" data-action="abandonner">Abandonner sans enregistrer</button>
      <button class="btn-principal" data-action="fermer">Continuer la séance</button>`;
  } else if (m.type === 'seance') {
    const s = d.historique.find((h) => h.id === m.id);
    contenu = `
      <h2>${esc(s.nom || s.seance)}</h2>
      <div class="petit">${dateLongue(s.date)}${s.importee ? ' · importée' : ''}</div>
      ${s.exercices.map((e) => `<div class="carte"><div style="font-weight:600">${esc(nomExo(e.exo, e.nom))}</div><div class="petit">${resumeSeries(e.series, exo(e.exo))}</div></div>`).join('')}
      ${m.confirmer ? `<div class="petit">Supprimer définitivement cette séance&nbsp;?</div>
        <button class="btn-secondaire btn-danger" data-action="supprimer-seance" data-id="${esc(s.id)}">Oui, supprimer</button>`
    : '<button class="btn-secondaire btn-danger" data-action="confirmer-suppr">Supprimer cette séance</button>'}
      <button class="btn-principal" data-action="fermer">Fermer</button>`;
  } else if (m.type === 'effacer') {
    contenu = `
      <h2>Tout effacer&nbsp;?</h2>
      <div class="petit">L'historique, les records et les séances enregistrées seront supprimés de ce téléphone. Pense à exporter une sauvegarde avant.</div>
      <button class="btn-secondaire btn-danger" data-action="effacer-ok">Oui, tout effacer</button>
      <button class="btn-principal" data-action="fermer">Annuler</button>`;
  } else if (m.type === 'import') {
    contenu = `
      <h2>Import terminé</h2>
      <div style="font-size:15px">${m.ajoutees} séance${m.ajoutees > 1 ? 's' : ''} ajoutée${m.ajoutees > 1 ? 's' : ''}${m.maj ? `, ${m.maj} mise${m.maj > 1 ? 's' : ''} à jour` : ''}.</div>
      ${m.inconnus?.length ? `<div class="petit">Gardés dans l'historique mais absents du catalogue : ${m.inconnus.map(esc).join(', ')}.</div>` : ''}
      <button class="btn-principal" data-action="fermer">OK</button>`;
  }
  const theme = m.type === 'options' && d.enCours && estHaltero(exo(exoCourant().exo)) ? 'theme-haltero' : '';
  return `<div class="voile" data-action="voile"><div class="feuille ${theme}" role="dialog" aria-modal="true">${contenu}</div></div>`;
}

// ---------- Rendu ----------

function rendre() {
  let html;
  if (ui.ecran === 'exercice' && d.enCours) html = ecranExercice();
  else if (ui.ecran === 'recup' && d.enCours?.recup) html = ecranRecup();
  else if (ui.ecran === 'composer' && ui.compo) html = ecranComposer();
  else if (ui.ecran === 'perso' && ui.perso) html = ecranPerso();
  else if (ui.ecran === 'fin') html = ecranFin();
  else if (ui.ecran === 'progression') html = ecranProgression();
  else if (ui.ecran === 'exercices') html = ecranExercices();
  else if (ui.ecran === 'detail' && exo(ui.exoDetail)) html = ecranDetail();
  else if (ui.ecran === 'reglages') html = ecranReglages();
  else { ui.ecran = 'accueil'; html = ecranAccueil(); }
  const scrollFeuille = document.querySelector('.feuille')?.scrollTop || 0;
  $app.innerHTML = html + modalHtml() + (ui.toast ? `<div class="toast" role="status">${esc(ui.toast)}</div>` : '') + (ui.flash ? '<div class="flash"></div>' : '');
  const f = document.querySelector('.feuille');
  if (f && ui.modalGardeScroll) f.scrollTop = scrollFeuille;
  ui.modalGardeScroll = false;
  if (ui.ecran === 'recup') tic();
}

// Minuteur : calculé à partir de l'heure de fin, donc juste à la seconde même après un verrouillage.
function tic() {
  const r = d.enCours?.recup;
  if (ui.ecran !== 'recup' || !r) return;
  const reste = (r.fin - Date.now()) / 1000;
  const temps = document.getElementById('temps');
  const sous = document.getElementById('temps-sous');
  const anneau = document.getElementById('anneau');
  const titre = document.getElementById('recup-titre');
  if (!temps) return;
  if (reste > 0) {
    temps.textContent = mmss(Math.ceil(reste));
    sous.textContent = `sur ${mmss(r.duree)}`;
    anneau.setAttribute('stroke-dasharray', `${(666 * reste) / r.duree} 666`);
    titre.textContent = 'Récupération';
  } else {
    temps.textContent = '0:00';
    const depuis = Math.floor(-reste);
    sous.textContent = depuis < 3 ? 'Récup terminée' : `terminée il y a ${depuis < 60 ? depuis + ' s' : mmss(depuis)}`;
    anneau.setAttribute('stroke-dasharray', '0 666');
    titre.textContent = 'Récup terminée';
    if (!r.flashe) {
      r.flashe = true;
      enregistrer();
      // Clignote seulement si la fin vient d'arriver sous tes yeux.
      if (depuis < 5 && document.visibilityState === 'visible') {
        ui.flash = true;
        rendre();
        setTimeout(() => { ui.flash = false; rendre(); }, 2500);
      }
    }
  }
}

setInterval(tic, 250);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    tic();
    garderEcranAllume();
  }
});

// ---------- Actions ----------

function recalculerPlan(e, def) {
  const record = d.records[def.id] || null;
  const plan = planHaltero(def, record, d.haltero[def.id] || 0);
  while (plan.length < e.cible.series) plan.push(plan[plan.length - 1]);
  for (let i = e.series.length; i < plan.length; i++) e.plan[i] = plan[i];
  e.raison = record ? `Calculé sur ton record de ${nb(record)} kg` : 'Record inconnu : choisis une charge légère';
}

const actions = {
  onglet(el) {
    ui.ecran = { seances: 'accueil', progression: 'progression', exercices: 'exercices' }[el.dataset.id] || 'accueil';
    ui.modal = null;
    window.scrollTo(0, 0);
  },
  ecran(el) { ui.ecran = el.dataset.id; window.scrollTo(0, 0); },
  composer(el) { composer(el.dataset.id); ui.ecran = 'composer'; window.scrollTo(0, 0); },
  mode(el) { composer(ui.compo.seance, el.dataset.id); },
  choix(el) { ui.modal = { type: 'choix', i: Number(el.dataset.i) }; },
  choisir(el) {
    const i = Number(el.dataset.i);
    const def = exo(el.dataset.id);
    if (i >= 0) Object.assign(ui.compo.cases[i], { exo: def.id, raison: '' });
    else ui.compo.cases.push({ role: def.groupe, options: [], cible: def.cible, exo: def.id, raison: '' });
    ui.modal = null;
  },
  retirer(el) { ui.compo.cases.splice(Number(el.dataset.i), 1); },
  'go-compo'() {
    const s = seance(ui.compo.seance);
    demarrer(s.id, s.nom, ui.compo.cases.map((k) => ({ exo: k.exo, cible: k.cible })));
    return false;
  },
  perso(el) {
    const s = el.dataset.id ? d.seancesPerso.find((x) => x.id === el.dataset.id) : null;
    ui.perso = { sel: s ? s.exercices.filter((id) => exo(id)) : [], filtre: 'tous', q: '', id: s?.id || null, nom: s?.nom || '' };
    ui.ecran = 'perso';
    window.scrollTo(0, 0);
  },
  cocher(el) {
    const id = el.dataset.id;
    const sel = ui.perso.sel;
    ui.perso.sel = sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id];
    majPerso();
    return false;
  },
  filtre(el) { ui.perso.filtre = el.dataset.id; },
  'go-perso'() {
    const p = ui.perso;
    const items = p.sel.map((id) => ({ exo: id, cible: exo(id).cible }));
    demarrer(p.id ? `perso:${p.id}` : 'perso', p.nom || 'Séance personnalisée', items);
    return false;
  },
  enregistrer() { ui.modal = { type: 'enregistrer' }; },
  'enregistrer-ok'() {
    const nom = (document.getElementById('nom-seance')?.value || '').trim() || 'Ma séance';
    const p = ui.perso;
    if (p.id) {
      const s = d.seancesPerso.find((x) => x.id === p.id);
      Object.assign(s, { nom, exercices: [...p.sel] });
    } else {
      p.id = `p${Date.now()}`;
      d.seancesPerso.push({ id: p.id, nom, exercices: [...p.sel] });
    }
    p.nom = nom;
    enregistrer();
    ui.modal = null;
    toast('Séance enregistrée');
    return false;
  },
  'suppr-perso'() { ui.modal = { type: 'suppr-perso' }; },
  'suppr-perso-ok'() {
    d.seancesPerso = d.seancesPerso.filter((x) => x.id !== ui.perso.id);
    enregistrer();
    ui.modal = null;
    ui.ecran = 'accueil';
    toast('Séance supprimée');
    return false;
  },
  reprendre() {
    ui.ecran = d.enCours.recup ? 'recup' : 'exercice';
    garderEcranAllume();
    window.scrollTo(0, 0);
  },
  reps(el) {
    const e = exoCourant();
    e.reps = Math.max(0, Math.min(600, e.reps + Number(el.dataset.d)));
    enregistrer();
  },
  'ajout-serie'() {
    const e = exoCourant();
    e.cible.series += 1;
    if (e.plan) e.plan.push(e.plan[e.plan.length - 1]);
    enregistrer();
    toast(`Série ${e.cible.series} ajoutée`);
    return false;
  },
  options() { ui.modal = { type: 'options' }; },
  charge(el) {
    const e = exoCourant();
    const def = exo(e.exo);
    const sens = Number(el.dataset.d);
    if (e.plan) {
      const i = e.series.length;
      const base = chargeSerie(e, i);
      const v = base == null ? (sens > 0 ? 20 : 0) : Math.max(0, base + sens);
      e.plan[i] = v;
      // Record inconnu : la charge choisie vaut aussi pour les séries suivantes.
      if (!d.records[def.id]) e.charge = v;
    } else {
      const pas = def.increment || 1;
      const base = e.charge ?? e.conseillee ?? 0;
      e.charge = e.charge == null && sens > 0 && base === 0 ? pas : Math.max(0, Math.round((base + sens * pas) * 10) / 10);
    }
    enregistrer();
    ui.modalGardeScroll = true;
  },
  record(el) { ui.modal = { type: 'record', id: el.dataset.id }; },
  'record-pas'(el) {
    const id = el.dataset.id;
    const actuel = d.records[id] || 0;
    const pas = Number(el.dataset.d);
    // Sans record, on part de 20 kg (barre olympique).
    const v = Math.max(0, actuel ? actuel + pas : (pas > 0 ? 20 : 0));
    if (v) d.records[id] = v;
    else delete d.records[id];
    if (d.enCours && exoCourant()?.exo === id) recalculerPlan(exoCourant(), exo(id));
    enregistrer();
    ui.modalGardeScroll = true;
  },
  'record-inconnu'(el) {
    delete d.records[el.dataset.id];
    if (d.enCours && exoCourant()?.exo === el.dataset.id) recalculerPlan(exoCourant(), exo(el.dataset.id));
    enregistrer();
  },
  remplacer(el) {
    const e = exoCourant();
    d.enCours.exercices[d.enCours.index] = preparerExo({ exo: el.dataset.id, cible: e.cible });
    enregistrer();
    ui.modal = null;
  },
  'passer-exo'() {
    const suivant = prochainIndex(d.enCours.index);
    ui.modal = null;
    if (suivant < 0 || suivant === d.enCours.index) { terminer(); return false; }
    d.enCours.index = suivant;
    enregistrer();
  },
  valider() { validerSerie(); return false; },
  'valider-h'(el) { validerSerie(Number(el.dataset.n)); return false; },
  ajuster(el) {
    const r = d.enCours.recup;
    const maintenant = Date.now();
    r.fin = Math.max(maintenant, r.fin) + Number(el.dataset.d) * 1000;
    if (r.fin < maintenant) r.fin = maintenant;
    if (r.fin > maintenant) r.flashe = false;
    enregistrer();
    tic();
    return false;
  },
  'fin-recup'() { finRecup(); return false; },
  ressenti(el) {
    const r = d.enCours.recup;
    const serie = d.enCours.exercices[r.exoIndex].series[r.serieIndex];
    serie.ressenti = serie.ressenti === el.dataset.v ? null : el.dataset.v;
    enregistrer();
  },
  'ressenti-fin'(el) {
    const s = d.historique.find((h) => h.id === ui.finId);
    const e = s.exercices[s.exercices.length - 1];
    const serie = e.series[e.series.length - 1];
    serie.ressenti = serie.ressenti === el.dataset.v ? null : el.dataset.v;
    enregistrer();
  },
  quitter() { ui.modal = { type: 'quitter' }; },
  pause() { ui.modal = null; ui.ecran = 'accueil'; libererEcran(); },
  terminer() { ui.modal = null; terminer(); return false; },
  abandonner() {
    d.enCours = null;
    libererEcran();
    enregistrer();
    ui.modal = null;
    ui.ecran = 'accueil';
  },
  fermer() { ui.modal = null; },
  voile(el, ev) { if (ev.target === el) ui.modal = null; else return false; },
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
  effacer() { ui.modal = { type: 'effacer' }; },
  'effacer-ok'() {
    d = vide();
    enregistrer();
    ui.modal = null;
    ui.ecran = 'accueil';
    toast('Données effacées');
    return false;
  },
  async exporter() {
    const texte = JSON.stringify({ ...d, exporte: new Date().toISOString(), appli: 'suivi-muscu', versionAppli: VERSION }, null, 1);
    const nom = `suivi-muscu-${aujourdhui()}.json`;
    try {
      const fichier = new File([texte], nom, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: nom });
        return false;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return false;
    }
    const url = URL.createObjectURL(new Blob([texte], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return false;
  },
};

// Mise à jour de la liste de la séance personnalisée sans tout redessiner (garde le clavier ouvert).
function majPerso() {
  const liste = document.getElementById('perso-liste');
  if (!liste) { rendre(); return; }
  liste.innerHTML = listePerso();
  const n = ui.perso.sel.length;
  const go = document.querySelector('[data-action="go-perso"]');
  const save = document.querySelector('[data-action="enregistrer"]');
  if (go) { go.disabled = !n; go.textContent = `Démarrer · ${n} exercice${n > 1 ? 's' : ''}`; }
  if (save) save.disabled = !n;
}

async function importerFichier(fichier) {
  const texte = await fichier.text();
  try {
    let seances;
    let inconnus = [];
    if (texte.trim().startsWith('{')) {
      const v = valider(JSON.parse(texte));
      if (!v) throw new Error("Ce fichier n'est pas une sauvegarde de l'appli.");
      seances = v.historique;
      d.exclus = [...new Set([...d.exclus, ...v.exclus])];
      d.records = { ...v.records, ...d.records };
      d.haltero = { ...v.haltero, ...d.haltero };
      const ids = new Set(d.seancesPerso.map((s) => s.id));
      d.seancesPerso = [...d.seancesPerso, ...v.seancesPerso.filter((s) => !ids.has(s.id))];
    } else {
      ({ seances, inconnus } = importerCsv(texte));
    }
    if (!seances.length) throw new Error('Aucune séance trouvée dans ce fichier.');
    const { historique, ajoutees } = fusionner(d.historique, seances);
    d.historique = historique;
    enregistrer();
    ui.modal = { type: 'import', ajoutees, maj: seances.length - ajoutees, inconnus };
  } catch (e) {
    ui.modal = null;
    toast(e.message || 'Fichier illisible');
    return;
  }
  rendre();
}

$app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el || el.tagName === 'INPUT' || el.disabled) return;
  const f = actions[el.dataset.action];
  if (!f) return;
  const res = f(el, ev);
  if (res instanceof Promise) return;
  if (res !== false) rendre();
});

$app.addEventListener('input', (ev) => {
  if (ev.target.id === 'recherche' && ui.perso) {
    ui.perso.q = ev.target.value;
    majPerso();
  }
});

$app.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset.action === 'importer' && el.files?.[0]) {
    importerFichier(el.files[0]);
    el.value = '';
  }
});

// ---------- Démarrage ----------

demanderPersistance();
if (d.enCours) {
  ui.ecran = d.enCours.recup ? 'recup' : 'exercice';
  garderEcranAllume();
}
rendre();

// Mise à jour hors ligne : bandeau quand une nouvelle version est prête.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const proposer = (w) => {
      if (!w || !navigator.serviceWorker.controller) return;
      const b = document.createElement('button');
      b.className = 'toast';
      b.style.border = 'none';
      b.textContent = 'Nouvelle version prête · toucher pour mettre à jour';
      b.onclick = () => w.postMessage('activer');
      document.body.appendChild(b);
    };
    if (reg.waiting) proposer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed') proposer(w); });
    });
  }).catch(() => {});
  let recharge = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!recharge) { recharge = true; location.reload(); }
  });
}
