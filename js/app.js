// Suivi muscu : écrans et déroulé d'une séance.

import { EXERCICES, GROUPES, SEANCES, exo, seance } from './donnees.js';
import { suggestion, historiqueExo, chargeDe, tendance, seancesMemeCharge } from './progression.js';
import { importerCsv, fusionner } from './import.js';
import { charger, sauver, valider, demanderPersistance } from './stockage.js';
import { illustration } from './illustrations.js';

export const VERSION = '0.1';

let d = charger();
const ui = { ecran: 'accueil', modal: null, toast: null, exoProg: null, exoDetail: null, retour: 'exercices' };

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

function ilYa(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  const jours = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(a, m - 1, j).getTime()) / 86400000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'hier';
  if (jours < 7) return new Date(a, m - 1, j).toLocaleDateString('fr-FR', { weekday: 'long' });
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

function chargeTexte(c, def) {
  if (def?.poidsDuCorps) return 'Poids du corps';
  if (c == null) return 'À choisir';
  return `${nb(c)} kg`;
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

const ICONES = {
  retour: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4l-6 6 6 6"></path></svg>',
  suite: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--doux)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l6 6-6 6"></path></svg>',
  coche: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10l4 4 8-9"></path></svg>',
  reglages: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path></svg>',
  seances: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 11h16M5 7v8M17 7v8M2 9v4M20 9v4"></path></svg>',
  progression: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-6 4 3 7-9"></path></svg>',
  exercices: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h14M4 11h14M4 16h14"></path></svg>',
};

// ---------- Programme effectif (exclusions et remplacements) ----------

function exoEffectif(id) {
  let cur = d.remplacements[id] || id;
  if (!d.exclus.includes(cur)) return cur;
  const def = exo(id);
  return (def?.alternatives || []).find((a) => !d.exclus.includes(a)) || null;
}

function programme(seanceId) {
  const s = seance(seanceId);
  const vus = new Set();
  const res = [];
  for (const c of s.exercices) {
    const id = exoEffectif(c.exo);
    if (!id || vus.has(id)) continue;
    vus.add(id);
    res.push({ ...c, exo: id });
  }
  return res;
}

function dureeEstimee(liste) {
  return Math.round(liste.reduce((t, c) => t + c.series * (45 + c.recup), 0) / 60 / 5) * 5;
}

function prochaineSeance() {
  const ordre = SEANCES.map((s) => s.id);
  const derniere = [...d.historique].reverse().find((s) => ordre.includes(s.seance));
  if (!derniere) return ordre[0];
  return ordre[(ordre.indexOf(derniere.seance) + 1) % ordre.length];
}

function derniereFois(seanceId) {
  const s = [...d.historique].reverse().find((h) => h.seance === seanceId);
  return s ? `faite ${ilYa(s.date)}` : 'jamais faite';
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

function preparerExo(c) {
  const def = exo(c.exo);
  const sug = suggestion(def, c, d.historique);
  return {
    exo: c.exo,
    cible: { series: c.series, repsMin: c.repsMin, repsMax: c.repsMax, recup: c.recup },
    conseillee: sug.charge, charge: sug.charge, raison: sug.raison,
    reps: c.repsMin, series: [],
  };
}

function demarrer(seanceId) {
  d.enCours = {
    seance: seanceId, debut: Date.now(), index: 0, recup: null,
    exercices: programme(seanceId).map(preparerExo),
  };
  enregistrer();
  ui.ecran = 'exercice';
  garderEcranAllume();
  rendre();
  window.scrollTo(0, 0);
}

function exoCourant() {
  return d.enCours.exercices[d.enCours.index];
}

function prochainIndex(depuis) {
  const ex = d.enCours.exercices;
  for (let k = 1; k <= ex.length; k++) {
    const i = (depuis + k) % ex.length;
    if (ex[i].series.length < ex[i].cible.series) return i;
  }
  return -1;
}

function validerSerie() {
  const e = exoCourant();
  const def = exo(e.exo);
  if (!def.poidsDuCorps && e.charge == null) {
    ui.modal = { type: 'options' };
    rendre();
    return;
  }
  e.series.push({ reps: e.reps, charge: def.poidsDuCorps ? 0 : e.charge, ressenti: null });
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
  const exercices = ec.exercices.filter((e) => e.series.length).map((e) => ({ exo: e.exo, nom: nomExo(e.exo), series: e.series }));
  d.enCours = null;
  libererEcran();
  if (!exercices.length) {
    enregistrer();
    ui.ecran = 'accueil';
    rendre();
    return;
  }
  const s = {
    id: `s${ec.debut}`, date: aujourdhui(), debut: ec.debut, fin: Date.now(),
    seance: ec.seance, nom: seance(ec.seance)?.nom || ec.seance, exercices,
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
  const points = [0, 1, 2].map((i) => `<div class="point ${i < faites ? 'fait' : ''}"></div>`).join('');
  const prochaine = seance(prochaineSeance());
  const liste = programme(prochaine.id);
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

  let haut = '';
  if (d.enCours) {
    const s = seance(d.enCours.seance);
    const faitesSeries = d.enCours.exercices.reduce((t, e) => t + e.series.length, 0);
    haut = `<div class="conseillee">
      <div class="label">Séance en cours</div>
      <div class="titre">${esc(s.nom)}</div>
      <div style="font-size:14px">${faitesSeries} série${faitesSeries > 1 ? 's' : ''} validée${faitesSeries > 1 ? 's' : ''}</div>
      <button class="btn-sombre" data-action="reprendre">Reprendre la séance</button>
    </div>`;
  } else {
    haut = `<div class="conseillee">
      <div class="label">Séance conseillée</div>
      <div class="pile" style="gap:4px">
        <div class="titre">${esc(prochaine.nom)}</div>
        <div style="font-size:14px;font-weight:500">${esc(prochaine.description)}</div>
      </div>
      <div style="font-size:14px">${liste.length} exercices · environ ${dureeEstimee(liste)} min</div>
      <button class="btn-sombre" data-action="demarrer" data-id="${prochaine.id}">Démarrer la séance</button>
    </div>`;
  }

  const autres = SEANCES.filter((s) => d.enCours || s.id !== prochaine.id).map((s) => `
    <button class="choix" data-action="${d.enCours ? 'rien' : 'demarrer'}" data-id="${s.id}" ${d.enCours ? 'disabled' : ''}>
      <span><span class="nom">${esc(s.nom)}</span><span class="petit">${esc(s.description)} · ${derniereFois(s.id)}</span></span>
      ${ICONES.suite}
    </button>`).join('');

  return `<main class="ecran avec-nav">
    <div class="entete">
      <div><div class="sur-titre">Programme Push · Pull · Jambes</div><h1>Prêt pour la séance ?</h1></div>
      <button class="btn-icone" data-action="ecran" data-id="reglages" aria-label="Réglages">${ICONES.reglages}</button>
    </div>
    ${standalone ? '' : `<div class="bandeau"><strong>Installe l'appli :</strong> dans Safari, touche Partager puis « Sur l'écran d'accueil ». C'est indispensable pour que tes données restent bien sur le téléphone.</div>`}
    <div class="carte semaine">
      <div style="flex:1" class="petit">Cette semaine</div>
      <div class="points">${points}</div>
      <div style="font-size:14px;font-weight:600">${Math.min(faites, 3)} sur 3</div>
    </div>
    ${haut}
    <div class="pile">
      <div class="sur-titre">Autres séances</div>
      ${autres}
      <button class="choix pointille" disabled>
        <span><span class="nom" style="font-size:15px">Hyrox et course</span><span class="petit">Prévu pour la version 2</span></span>
      </button>
    </div>
  </main>${nav('seances')}`;
}

function ecranExercice() {
  const ec = d.enCours;
  const e = exoCourant();
  const def = exo(e.exo);
  const s = seance(ec.seance);
  const fait = e.series.length;
  const barres = ec.exercices.map((x) => `<div class="${x.series.length >= x.cible.series ? 'fait' : ''}"></div>`).join('');

  const lignes = [];
  for (let i = 0; i < e.cible.series; i++) {
    if (i < fait) {
      const sr = e.series[i];
      lignes.push(`<div class="serie faite">${ICONES.coche}<div class="titre">Série ${i + 1}</div><div class="petit" style="font-size:15px">${sr.reps} reps${def.poidsDuCorps ? '' : ` · ${nb(sr.charge)} kg`}</div></div>`);
    } else if (i === fait) {
      lignes.push(`<div class="serie active">
        <div class="titre">Série ${i + 1}</div>
        <div class="stepper">
          <button data-action="reps" data-d="-1" aria-label="Une rep de moins">−</button>
          <div class="val" aria-live="polite">${e.reps} reps</div>
          <button data-action="reps" data-d="1" aria-label="Une rep de plus">+</button>
        </div>
      </div>`);
    } else {
      lignes.push(`<div class="serie avenir"><div class="rond"></div><div class="titre">Série ${i + 1}</div><div style="font-size:15px">à venir</div></div>`);
    }
  }

  const unite = def.materiel === 'halteres' ? 'par haltère · ' : '';
  return `<main class="ecran">
    <div class="ligne">
      <button class="btn-icone" data-action="quitter" aria-label="Quitter la séance">${ICONES.retour}</button>
      <div style="flex:1" class="pile" >
        <div class="sur-titre">${esc(s.nom)} · exercice ${ec.index + 1} sur ${ec.exercices.length}</div>
        <div class="barres" style="grid-template-columns:repeat(${ec.exercices.length},minmax(0,1fr))">${barres}</div>
      </div>
    </div>
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
        <span class="chiffre" style="${e.charge == null ? 'font-size:26px' : ''}">${chargeTexte(e.charge, def)}</span>
        <span class="petit" style="font-size:12px">${def.poidsDuCorps ? esc(e.raison) : unite + esc(e.charge !== e.conseillee ? 'modifié pour cette séance' : e.raison)}</span>
      </button>
      <div class="carte case">
        <span class="petit">Objectif</span>
        <span class="chiffre">${e.cible.repsMin} à ${e.cible.repsMax}</span>
        <span class="petit" style="font-size:12px">reps · ${e.cible.series} séries</span>
      </div>
    </div>
    <div class="pile" style="gap:8px">${lignes.join('')}</div>
    <div class="pousse"></div>
    <div class="pile">
      <button class="btn-principal" data-action="valider">Valider la série ${fait + 1}</button>
      <button class="btn-lien" data-action="options">Changer le poids ou remplacer l'exercice</button>
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
  const btnR = (v, t) => `<button data-action="ressenti" data-v="${v}" class="${derSerie?.ressenti === v ? 'on' : ''}" aria-pressed="${derSerie?.ressenti === v}">${t}</button>`;
  return `<main class="ecran" style="gap:22px">
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
      <div style="font-size:15px;font-weight:600">Comment était cette série ?</div>
      <div class="grille3 choix-ressenti" style="gap:8px">${btnR('facile', 'Facile')}${btnR('correct', 'Correct')}${btnR('dur', 'Dur')}</div>
      <div class="petit">Facultatif. Sert à ajuster le poids conseillé de la prochaine séance.</div>
    </div>
    <div class="pousse"></div>
    <button class="choix" data-action="fin-recup" style="background:transparent">
      <span>
        <span class="label petit" style="color:var(--doux)">Ensuite</span>
        <span class="nom">${e === exoFait ? '' : esc(def.nom) + ' · '}Série ${e.series.length + 1} sur ${e.cible.series}${def.poidsDuCorps ? '' : ` · ${chargeTexte(e.charge, def)}`}</span>
        <span class="petit">Objectif ${e.cible.repsMin} à ${e.cible.repsMax} reps</span>
      </span>
      ${ICONES.suite}
    </button>
  </main>`;
}

function resumeSeries(series, def) {
  const reps = series.map((s) => s.reps).join(' / ');
  if (def?.poidsDuCorps || chargeDe(series) === 0) return `${series.length} × ${reps} reps`;
  return `${series.length} séries · ${reps} reps · ${nb(chargeDe(series))} kg`;
}

function ecranFin() {
  const s = d.historique.find((h) => h.id === ui.finId);
  if (!s) { ui.ecran = 'accueil'; return ecranAccueil(); }
  const minutes = Math.round((s.fin - s.debut) / 60000);
  const nbSeries = s.exercices.reduce((t, e) => t + e.series.length, 0);
  const volume = s.exercices.reduce((t, e) => t + e.series.reduce((v, x) => v + x.reps * x.charge, 0), 0);
  const derExo = s.exercices[s.exercices.length - 1];
  const der = derExo.series[derExo.series.length - 1];
  const btnR = (v, t) => `<button data-action="ressenti-fin" data-v="${v}" class="${der.ressenti === v ? 'on' : ''}" aria-pressed="${der.ressenti === v}">${t}</button>`;
  return `<main class="ecran">
    <div class="pile" style="gap:6px">
      <div class="sur-titre">${esc(s.nom)} · ${dateLongue(s.date)}</div>
      <h1>Séance terminée</h1>
    </div>
    <div class="grille3">
      <div class="carte case"><span class="petit">Durée</span><span class="chiffre" style="font-size:24px">${minutes} min</span></div>
      <div class="carte case"><span class="petit">Séries</span><span class="chiffre" style="font-size:24px">${nbSeries}</span></div>
      <div class="carte case"><span class="petit">Volume</span><span class="chiffre" style="font-size:24px">${Math.round(volume)} kg</span></div>
    </div>
    <div class="carte pile" style="gap:12px;padding:16px">
      <div style="font-size:15px;font-weight:600">Et la dernière série ?</div>
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
  for (const s of d.historique) for (const e of s.exercices) ids.set(e.exo, { nom: e.nom, date: s.date });
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
  // Exercice au poids du corps : on suit les reps de la meilleure série au lieu de la charge.
  const poidsCorps = def?.poidsDuCorps || Math.max(...passe.map((p) => chargeDe(p.series))) === 0;
  const valeurs = passe.map((p) => (poidsCorps ? Math.max(...p.series.map((s) => s.reps)) : chargeDe(p.series)));
  const vmax = Math.max(...valeurs, 1);
  const vmin = Math.min(...valeurs);
  const hautV = (v) => (vmax === vmin ? 100 : 35 + ((v - vmin) / (vmax - vmin)) * 65);
  const deltaV = valeurs[valeurs.length - 1] - valeurs[0];

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

  const seancesRecentes = [...d.historique].reverse().slice(0, 12).map((s) => `
    <button class="choix" data-action="voir-seance" data-id="${esc(s.id)}" style="min-height:56px">
      <span><span class="nom" style="font-size:15px">${esc(s.nom || s.seance)}</span><span class="petit">${dateLongue(s.date)} · ${s.exercices.length} exercices</span></span>
      ${ICONES.suite}
    </button>`).join('');

  return `<main class="ecran avec-nav">
    <div class="pile" style="gap:6px"><div class="sur-titre">Tes charges séance après séance</div><h1>Progression</h1></div>
    <div class="carte pile" style="gap:14px;padding:16px;border-radius:18px">
      <div class="ligne" style="align-items:flex-end">
        <div style="flex:1;gap:3px" class="pile"><div style="font-size:16px;font-weight:600">${esc(sel.nom)}</div><div class="petit">${poidsCorps ? 'Meilleure série (reps)' : 'Charge par séance'} · ${n} dernière${n > 1 ? 's' : ''}</div></div>
        <div class="chiffre ${deltaV > 0 ? 'hausse' : deltaV < 0 ? 'baisse' : 'stable'}" style="font-size:26px">${deltaV > 0 ? '+' : ''}${nb(deltaV)}${poidsCorps ? '' : ' kg'}</div>
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
      <button class="choix ${d.exclus.includes(e.id) ? 'exclu' : ''}" data-action="detail" data-id="${e.id}" style="min-height:60px">
        <span><span class="nom" style="font-size:15px">${esc(e.nom)}</span><span class="petit">${esc(e.muscles)}${d.exclus.includes(e.id) ? ' · exclu' : ''}</span></span>
        ${ICONES.suite}
      </button>`).join('');
    return `<div class="groupe-titre">${esc(g)}</div>${items}`;
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
  const dans = SEANCES.filter((s) => programme(s.id).some((c) => c.exo === def.id)).map((s) => s.nom);
  return `<main class="ecran">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="${ui.retour}" aria-label="Retour">${ICONES.retour}</button>
      <div class="sur-titre" style="flex:1">${esc(def.groupe)}</div>
    </div>
    <h1 style="font-size:28px">${esc(def.nom)}</h1>
    <div class="carte" style="display:flex;justify-content:center;padding:20px">${illustration(def.dessin, def.nom, 180)}</div>
    <div class="carte pile" style="gap:6px">
      <div class="label" style="color:var(--accent)">Conseil</div>
      <div style="font-size:15px;line-height:1.45">${esc(def.conseil)}</div>
      <div class="petit">${esc(def.muscles)}${dans.length ? ` · dans la séance ${dans.join(', ')}` : ''}</div>
    </div>
    <div class="carte pile" style="gap:8px">
      <div style="font-weight:600">Dernières fois</div>
      ${passe.length ? `<div class="liste-perf">${passe.map((p) => `<div><span>${dateCourte(p.date)}</span><span class="petit" style="font-size:14px">${resumeSeries(p.series, def)}</span></div>`).join('')}</div>` : '<div class="petit">Jamais fait pour l\'instant.</div>'}
    </div>
    <button class="btn-secondaire" data-action="exclure" data-id="${def.id}">${exclu ? 'Le proposer à nouveau' : 'Ne plus me le proposer'}</button>
    <div class="petit">${exclu ? "Exclu : il est remplacé dans les séances par une alternative." : "S'il est exclu, il est remplacé dans les séances par une alternative."}</div>
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
    ${Object.keys(d.remplacements).length ? `<div class="carte pile">
      <div style="font-weight:600">Remplacements permanents</div>
      ${Object.entries(d.remplacements).map(([de, par]) => `<div class="petit" style="font-size:14px">${esc(nomExo(de))} → ${esc(nomExo(par))}</div>`).join('')}
      <button class="btn-secondaire" data-action="annuler-remplacements">Revenir au programme d'origine</button>
    </div>` : ''}
    <div class="carte pile">
      <div style="font-weight:600">Tout effacer</div>
      <div class="petit">Supprime l'historique et les réglages de ce téléphone.</div>
      <button class="btn-secondaire btn-danger" data-action="effacer">Effacer toutes les données</button>
    </div>
    <div class="petit" style="text-align:center">Suivi muscu · version ${VERSION}</div>
  </main>`;
}

// ---------- Fenêtres ----------

function modalHtml() {
  const m = ui.modal;
  if (!m) return '';
  let contenu = '';
  if (m.type === 'options') {
    const e = exoCourant();
    const def = exo(e.exo);
    const alts = (def.alternatives || []).filter((a) => !d.exclus.includes(a) && !d.enCours.exercices.some((x) => x.exo === a));
    const val = e.charge ?? e.conseillee ?? 0;
    contenu = `
      <h2>${esc(def.nom)}</h2>
      ${def.poidsDuCorps ? '' : `<div class="carte pile">
        <div class="ligne"><div style="flex:1;font-weight:600">Poids${def.materiel === 'halteres' ? ' par haltère' : ''}</div>
          <div class="stepper">
            <button data-action="charge" data-d="-1" aria-label="Moins lourd">−</button>
            <div class="val">${e.charge == null ? '—' : nb(val) + ' kg'}</div>
            <button data-action="charge" data-d="1" aria-label="Plus lourd">+</button>
          </div>
        </div>
        <div class="petit">Par pas de ${nb(def.increment)} kg${e.conseillee != null ? ` · conseillé ${nb(e.conseillee)} kg` : ''}. Vaut pour la suite de cet exercice.</div>
      </div>`}
      ${e.series.length === 0 && alts.length ? `<div class="pile">
        <div class="sur-titre">Remplacer par</div>
        ${alts.map((a) => `<button class="choix" data-action="remplacer" data-id="${a}" style="min-height:56px"><span><span class="nom" style="font-size:15px">${esc(nomExo(a))}</span><span class="petit">${esc(exo(a).muscles)}</span></span>${ICONES.suite}</button>`).join('')}
        <label class="case-a-cocher"><input type="checkbox" id="remplacer-toujours"> Remplacer aussi pour les prochaines séances</label>
      </div>` : ''}
      <button class="btn-secondaire" data-action="passer-exo">Passer cet exercice</button>
      <button class="btn-principal" data-action="fermer">OK</button>`;
  } else if (m.type === 'quitter') {
    const faites = d.enCours.exercices.reduce((t, e) => t + e.series.length, 0);
    contenu = `
      <h2>Quitter la séance ?</h2>
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
      ${m.confirmer ? `<div class="petit">Supprimer définitivement cette séance ?</div>
        <button class="btn-secondaire btn-danger" data-action="supprimer-seance" data-id="${esc(s.id)}">Oui, supprimer</button>`
        : `<button class="btn-secondaire btn-danger" data-action="confirmer-suppr">Supprimer cette séance</button>`}
      <button class="btn-principal" data-action="fermer">Fermer</button>`;
  } else if (m.type === 'effacer') {
    contenu = `
      <h2>Tout effacer ?</h2>
      <div class="petit">L'historique et les réglages seront supprimés de ce téléphone. Pense à exporter une sauvegarde avant.</div>
      <button class="btn-secondaire btn-danger" data-action="effacer-ok">Oui, tout effacer</button>
      <button class="btn-principal" data-action="fermer">Annuler</button>`;
  } else if (m.type === 'import') {
    contenu = `
      <h2>Import terminé</h2>
      <div style="font-size:15px">${m.ajoutees} séance${m.ajoutees > 1 ? 's' : ''} ajoutée${m.ajoutees > 1 ? 's' : ''}${m.maj ? `, ${m.maj} mise${m.maj > 1 ? 's' : ''} à jour` : ''}.</div>
      ${m.inconnus?.length ? `<div class="petit">Gardés dans l'historique mais hors programme : ${m.inconnus.map(esc).join(', ')}.</div>` : ''}
      <button class="btn-principal" data-action="fermer">OK</button>`;
  }
  return `<div class="voile" data-action="voile"><div class="feuille" role="dialog" aria-modal="true">${contenu}</div></div>`;
}

// ---------- Rendu ----------

function rendre() {
  let html;
  if (ui.ecran === 'exercice' && d.enCours) html = ecranExercice();
  else if (ui.ecran === 'recup' && d.enCours?.recup) html = ecranRecup();
  else if (ui.ecran === 'fin') html = ecranFin();
  else if (ui.ecran === 'progression') html = ecranProgression();
  else if (ui.ecran === 'exercices') html = ecranExercices();
  else if (ui.ecran === 'detail' && exo(ui.exoDetail)) html = ecranDetail();
  else if (ui.ecran === 'reglages') html = ecranReglages();
  else { ui.ecran = 'accueil'; html = ecranAccueil(); }
  $app.innerHTML = html + modalHtml() + (ui.toast ? `<div class="toast" role="status">${esc(ui.toast)}</div>` : '') + (ui.flash ? '<div class="flash"></div>' : '');
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

const actions = {
  onglet(el) {
    ui.ecran = { seances: 'accueil', progression: 'progression', exercices: 'exercices' }[el.dataset.id] || 'accueil';
    ui.modal = null;
    window.scrollTo(0, 0);
  },
  ecran(el) { ui.ecran = el.dataset.id; window.scrollTo(0, 0); },
  demarrer(el) { demarrer(el.dataset.id); return false; },
  reprendre() {
    ui.ecran = d.enCours.recup ? 'recup' : 'exercice';
    garderEcranAllume();
    window.scrollTo(0, 0);
  },
  reps(el) {
    const e = exoCourant();
    e.reps = Math.max(0, Math.min(100, e.reps + Number(el.dataset.d)));
    enregistrer();
  },
  options() { ui.modal = { type: 'options' }; },
  charge(el) {
    const e = exoCourant();
    const def = exo(e.exo);
    const base = e.charge ?? e.conseillee ?? 0;
    const pas = def.increment || 1;
    e.charge = e.charge == null && Number(el.dataset.d) > 0 && base === 0 ? pas : Math.max(0, Math.round((base + Number(el.dataset.d) * pas) * 10) / 10);
    enregistrer();
  },
  remplacer(el) {
    const e = exoCourant();
    const ancien = e.exo;
    const toujours = document.getElementById('remplacer-toujours')?.checked;
    const nouv = preparerExo({ exo: el.dataset.id, series: e.cible.series, repsMin: e.cible.repsMin, repsMax: e.cible.repsMax, recup: e.cible.recup });
    d.enCours.exercices[d.enCours.index] = nouv;
    if (toujours) {
      const origine = Object.keys(d.remplacements).find((k) => d.remplacements[k] === ancien) || ancien;
      d.remplacements[origine] = el.dataset.id;
    }
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
  'confirmer-suppr'() { ui.modal.confirmer = true; },
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
  'annuler-remplacements'() { d.remplacements = {}; enregistrer(); toast('Programme d\'origine rétabli'); return false; },
  effacer() { ui.modal = { type: 'effacer' }; },
  'effacer-ok'() {
    d = { version: 1, historique: [], exclus: [], remplacements: {}, enCours: null };
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
      d.remplacements = { ...v.remplacements, ...d.remplacements };
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
