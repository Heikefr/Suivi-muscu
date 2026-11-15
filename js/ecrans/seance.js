// =====================================================================
// Écrans d'une séance de musculation en cours
// ---------------------------------------------------------------------
// Exercice (musculation ou haltérophilie), récupération avec minuteur, écran de fin.
// =====================================================================

import { ICONES, chargeTexte, estHaltero, nomExo, repsTexte } from '../commun.js';
import { ecranAccueil } from './accueil.js';
import { d, enregistrer, rendre, toast, ui } from '../etat.js';
import { illustration } from '../illustrations.js';
import { exo, seance } from '../metier/donnees.js';
import { echauffement } from '../metier/bilan.js';
import { chargeDe } from '../metier/progression.js';
import { dateLongue, esc, mmss, nb } from '../outils.js';
import {
  chargeSerie, exoCourant, finRecup, garderEcranAllume, libererEcran, preparerExo, prochainIndex, recalculerPlan,
  terminer, validerSerie,
} from '../seance-muscu.js';

/** Haut de l'écran : bouton quitter, nom de la séance, avancement. */
function enteteSeance(theme) {
  const ec = d.enCours;
  const barres = ec.exercices.map((x) => `<div class="${x.series.length >= x.cible.series ? 'fait' : ''}"></div>`).join('');
  return `<div class="ligne">
      <button class="btn-icone" data-action="quitter" aria-label="Quitter la séance">${ICONES.retour}</button>
      <div class="pile u-flex-1">
        <div class="sur-titre">${esc(ec.nom || seance(ec.seance)?.nom)} · exercice ${ec.index + 1} sur ${ec.exercices.length}</div>
        <div class="barres" style="grid-template-columns:repeat(${ec.exercices.length},minmax(0,1fr))">${barres}</div>
      </div>
    </div>`;
}

/** Texte d'une série record : « 62,5 kg × 8 » ou « 12 reps » au poids du corps. */
export function texteRecord(r, def) {
  return r.charge > 0 ? `${nb(r.charge)} kg × ${r.reps}` : repsTexte(r.reps, def || {});
}

/** Lien « Mes réglages » d'un exercice (hauteur du siège, prise…), ou le lien pour en ajouter. */
function blocNote(def) {
  const note = d.notes[def.id];
  return `<button class="btn-lien lien-note ${note ? 'remplie' : ''}" data-action="note" data-id="${def.id}">${note ? `Mes réglages : ${esc(note)}` : '+ Ajouter mes réglages (siège, prise…)'}</button>`;
}

/**
 * Carte d'échauffement : seulement avant la toute première série de la séance.
 * Les séries de chauffe ne sont pas enregistrées dans l'historique.
 */
function blocChauffe(e, def) {
  const ec = d.enCours;
  if (!ec.chauffe || ec.chauffe.finie || ec.index !== 0 || e.series.length) return '';
  const series = echauffement(e.charge, def);
  const n = ec.chauffe.faites;
  if (!series.length || n >= series.length) return '';
  return `<div class="carte chauffe pile u-ecart-10">
    <div class="ligne"><div class="u-flex-1 u-gras-600">Échauffement <span class="petit">· avant ${nb(e.charge)} kg</span></div>
      <button class="btn-lien passer" data-action="chauffe-passer">Passer</button></div>
    <div class="paliers" style="grid-template-columns:repeat(${series.length},minmax(0,1fr))">
      ${series.map((x, i) => `<div class="${i < n ? 'fait' : i === n ? 'encours' : ''}"><strong>${i < n ? '✓ ' : ''}${nb(x.charge)} kg</strong><span class="petit">${x.reps} reps</span></div>`).join('')}
    </div>
    <button class="btn-secondaire" data-action="chauffe-ok">Chauffe ${n + 1} faite</button>
  </div>`;
}

/**
 * Écran d'un exercice de musculation (délègue à ecranHaltero pour l'haltérophilie).
 * Disposition compacte : le poids et les répétitions se règlent directement ici,
 * les séries tiennent sur une ligne, et le bouton « Valider » reste visible.
 */
export function ecranExercice() {
  const e = exoCourant();
  const def = exo(e.exo);
  if (estHaltero(def)) return ecranHaltero(e, def);
  const fait = e.series.length;
  const total = e.cible.series;
  const pas = def.unite === 's' ? 5 : 1;

  // Réglage du poids : absent au poids du corps.
  const unite = def.materiel === 'halteres' ? 'par haltère · ' : '';
  const sousPoids = unite + (e.charge !== e.conseillee ? 'modifié pour cette séance' : e.raison);
  const poids = def.poidsDuCorps
    ? `<div class="reglage"><div class="centre"><div class="valeur petit-texte">Poids du corps</div><div class="petit">${esc(e.raison)}</div></div></div>`
    : `<div class="reglage">
        <button data-action="charge" data-d="-1" aria-label="Moins lourd">−</button>
        <div class="centre"><div class="valeur ${e.charge == null ? 'petit-texte' : ''}" aria-live="polite">${chargeTexte(e.charge, def)}</div><div class="petit">${esc(sousPoids)}</div></div>
        <button data-action="charge" data-d="1" aria-label="Plus lourd">+</button>
      </div>`;

  // Une case par série : faite (avec son résultat), en cours, à venir.
  const cases = Array.from({ length: total }, (_, i) => {
    if (i < fait) {
      const sr = e.series[i];
      return `<div class="faite"><span>Série ${i + 1}</span><strong>${def.poidsDuCorps ? repsTexte(sr.reps, def) : `${nb(sr.charge)} × ${sr.reps}`}</strong></div>`;
    }
    return i === fait ? `<div class="encours"><span>Série ${i + 1}</span><strong>en cours</strong></div>`
      : `<div><span>Série ${i + 1}</span><strong>à venir</strong></div>`;
  }).join('');

  return `<main class="ecran">
    ${enteteSeance()}
    <div class="exo-tete">
      <div class="dessin">${illustration(def.dessin, def.nom, 78)}</div>
      <div class="texte">
        <h1>${esc(def.nom)}</h1>
        <div class="petit">${esc(def.conseil)}</div>
        ${blocNote(def)}
      </div>
    </div>
    ${blocChauffe(e, def)}
    <div class="carte saisie">
      <div class="ligne"><div class="u-flex-1 u-gras-700">Série ${fait + 1} sur ${total}</div>
        <div class="petit">Objectif ${e.cible.repsMin} à ${e.cible.repsMax} ${def.unite === 's' ? 's' : 'reps'}</div></div>
      ${poids}
      <div class="trait"></div>
      <div class="reglage">
        <button data-action="reps" data-d="-${pas}" aria-label="Moins">−</button>
        <div class="centre"><div class="valeur" aria-live="polite">${repsTexte(e.reps, def)}</div><div class="petit">${def.unite === 's' ? 'secondes tenues' : 'répétitions faites'}</div></div>
        <button data-action="reps" data-d="${pas}" aria-label="Plus">+</button>
      </div>
    </div>
    <div class="cases-series" style="grid-template-columns:repeat(${Math.min(total, 6)},minmax(0,1fr))">${cases}</div>
    <div class="pousse"></div>
    <div class="pile u-ecart-6">
      <button class="btn-principal" data-action="valider">Valider la série ${fait + 1}</button>
      <div class="ligne liens-series">
        <button class="btn-lien" data-action="retrait-serie" aria-label="Retirer une série" ${total > Math.max(1, fait + 1) ? '' : 'disabled'}>− Série</button>
        <button class="btn-lien" data-action="ajout-serie" aria-label="Ajouter une série">+ Série</button>
        <span class="u-flex-1"></span>
        <button class="btn-lien" data-action="options">Remplacer · passer</button>
      </div>
    </div>
  </main>`;
}

/** Écran d'un mouvement d'haltérophilie : charges en % du record, réussi / raté. */
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
  const faites = e.series.map((sr, i) => `<div class="serie faite">${ICONES.coche}<div class="titre">Série ${i + 1} · ${nb(sr.charge)} kg</div><div class="petit u-t-14">${sr.reps} sur ${reps}</div></div>`).join('');
  const reste = total - fait - 1;
  const boutons = Array.from({ length: reps + 1 }, (_, n) => `<button class="${n === reps ? 'on' : ''}" data-action="valider-h" data-n="${n}">${n === reps && reps > 1 ? `${n} · toutes` : n}</button>`).join('');
  return `<main class="ecran theme-haltero">
    ${enteteSeance()}
    <h1>${esc(def.nom)}</h1>
    ${blocNote(def)}
    <div class="carte pile u-ecart-12 u-pad-16 u-rayon-18">
      <div class="ligne u-items-flex-end">
        <div class="pile u-flex-1 u-ecart-4">
          <div class="petit">Série ${fait + 1} sur ${total} · ${repsTexte(reps, def)}</div>
          <button class="chiffre lien-chiffre" data-action="options" style="font-size:${charge == null ? 30 : 52}px">${charge == null ? 'À choisir' : nb(charge) + ' kg'}</button>
        </div>
        ${record ? `<div class="pile u-items-flex-end u-ecart-4"><div class="chiffre u-t-28 u-c-accent">${nb(pct)} %</div><div class="petit u-t-12">de ton record ${nb(record)} kg</div></div>` : ''}
      </div>
      <div class="petit">${record ? `Montée en charge : ${pcts.map((x, i) => (i === fait ? `<strong class="u-c-texte">${nb(x + dec)} %</strong>` : `${nb(x + dec)} %`)).join(' · ')}` : esc(e.raison)}</div>
    </div>
    <div class="pile u-ecart-8">
      ${faites}
      ${reste > 0 ? `<div class="serie avenir"><div class="rond"></div><div class="titre">${reste > 1 ? `Séries ${fait + 2} à ${total}` : `Série ${total}`}</div><div class="u-t-14">à venir</div></div>` : ''}
    </div>
    <div class="carte illu u-pad-12">
      <div class="dessin u-l-88 u-h-88">${illustration(def.dessin, def.nom, 80)}</div>
      <div class="texte"><div class="label u-c-accent">Conseil</div><div>${esc(def.conseil)}</div></div>
    </div>
    <div class="pousse"></div>
    <div class="pile u-ecart-10">
      <div class="u-t-14 u-gras-600 u-aligne-center">Combien de reps réussies sur ${reps}&nbsp;?</div>
      <div class="choix-reps" style="grid-template-columns:repeat(${reps + 1},minmax(0,1fr))">${boutons}</div>
      <div class="ligne u-justifie-space-between">
        <button class="btn-lien" data-action="ajout-serie">+ Ajouter une série</button>
        <button class="btn-lien" data-action="options">Poids · record</button>
      </div>
    </div>
  </main>`;
}

/** Écran de récupération : minuteur, ressenti de la série, aperçu de la suite. */
export function ecranRecup() {
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
    <div class="pile u-ecart-6 u-aligne-center">
      <div class="sur-titre">${esc(nomExo(exoFait.exo))} · série ${r.serieIndex + 1} validée</div>
      <h1 class="u-t-28" id="recup-titre">Récupération</h1>
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
    <div class="carte pile u-ecart-12 u-pad-16">
      <div class="u-t-15 u-gras-600">Comment était cette série&nbsp;?</div>
      <div class="grille3 choix-ressenti u-ecart-8">${btnR('facile', 'Facile')}${btnR('correct', 'Correct')}${btnR('dur', 'Dur')}</div>
      <div class="petit">Facultatif. Sert à ajuster le poids conseillé de la prochaine séance.</div>
    </div>
    <div class="pousse"></div>
    <button class="choix u-fond-transparent" data-action="fin-recup">
      <span>
        <span class="label petit u-c-doux">Ensuite</span>
        <span class="nom">${e === exoFait ? '' : esc(def.nom) + ' · '}Série ${e.series.length + 1} sur ${e.cible.series}${def.poidsDuCorps ? '' : ` · ${chargeTexte(prochaineCharge, def)}`}</span>
        <span class="petit">Objectif ${e.cible.repsMin === e.cible.repsMax ? e.cible.repsMin : `${e.cible.repsMin} à ${e.cible.repsMax}`} ${def.unite === 's' ? 'secondes' : 'reps'}</span>
      </span>
      ${ICONES.suite}
    </button>
  </main>`;
}

/** Résumé d'un exercice fait : « 3 × 10 à 40 kg ». */
export function resumeSeries(series, def) {
  if (def?.unite === 's') return `${series.length} × ${series.map((s) => s.reps).join(' / ')} s`;
  if (estHaltero(def)) return series.map((s) => `${nb(s.charge)} kg×${s.reps}`).join(' · ');
  const reps = series.map((s) => s.reps).join(' / ');
  if (def?.poidsDuCorps || chargeDe(series) === 0) return `${series.length} × ${reps} reps`;
  return `${series.length} série${series.length > 1 ? 's' : ''} · ${reps} reps · ${nb(chargeDe(series))} kg`;
}

/** Écran de fin de séance : résumé et ressenti global. */
export function ecranFin() {
  const s = d.historique.find((h) => h.id === ui.finId);
  if (!s) { ui.ecran = 'accueil'; return ecranAccueil(); }
  const minutes = Math.round((s.fin - s.debut) / 60000);
  const nbSeries = s.exercices.reduce((t, e) => t + e.series.length, 0);
  const volume = s.exercices.reduce((t, e) => t + e.series.reduce((v, x) => v + (exo(e.exo)?.unite === 's' ? 0 : x.reps * x.charge), 0), 0);
  const derExo = s.exercices[s.exercices.length - 1];
  const der = derExo.series[derExo.series.length - 1];
  const btnR = (v, t) => `<button data-action="ressenti-fin" data-v="${v}" class="${der.ressenti === v ? 'on' : ''}" aria-pressed="${der.ressenti === v}">${t}</button>`;
  return `<main class="ecran">
    <div class="pile u-ecart-6">
      <div class="sur-titre">${esc(s.nom)} · ${dateLongue(s.date)}</div>
      <h1>Séance terminée</h1>
    </div>
    ${(ui.finInfos || []).map((t) => `<div class="bandeau">${esc(t)}</div>`).join('')}
    ${ui.finRecords?.length ? `<div class="conseillee">
      <div class="label">${ui.finRecords.length > 1 ? `${ui.finRecords.length} nouveaux records` : 'Nouveau record'}</div>
      ${ui.finRecords.map((r) => `<div class="u-t-15 u-gras-600">${esc(nomExo(r.exo, r.nom))} : ${texteRecord(r, exo(r.exo))} <span class="u-gras-500">(avant ${texteRecord(r.avant, exo(r.exo))})</span></div>`).join('')}
    </div>` : ''}
    <div class="grille3">
      <div class="carte case"><span class="petit">Durée</span><span class="chiffre u-t-24">${minutes} min</span></div>
      <div class="carte case"><span class="petit">Séries</span><span class="chiffre u-t-24">${nbSeries}</span></div>
      <div class="carte case"><span class="petit">Volume</span><span class="chiffre u-t-24">${Math.round(volume)} kg</span></div>
    </div>
    <div class="carte pile u-ecart-12 u-pad-16">
      <div class="u-t-15 u-gras-600">Et la dernière série&nbsp;?</div>
      <div class="grille3 choix-ressenti u-ecart-8">${btnR('facile', 'Facile')}${btnR('correct', 'Correct')}${btnR('dur', 'Dur')}</div>
    </div>
    <div class="pile">
      ${s.exercices.map((e) => `<div class="carte"><div class="u-gras-600">${esc(nomExo(e.exo, e.nom))}</div><div class="petit">${resumeSeries(e.series, exo(e.exo))}</div></div>`).join('')}
    </div>
    <button class="btn-principal" data-action="onglet" data-id="seances">Retour à l'accueil</button>
  </main>`;
}

// Minuteur : calculé à partir de l'heure de fin, donc juste à la seconde même après un verrouillage.
export function tic() {
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

/** Actions des boutons de ce fichier (attribut data-action dans le HTML). */
export const actions = {
  // --- Réglages personnels d'un exercice ---
  note(el) { ui.modal = { type: 'note', exo: el.dataset.id }; },
  'note-ok'() {
    const texte = (document.getElementById('note-texte')?.value || '').trim();
    if (texte) d.notes[ui.modal.exo] = texte; else delete d.notes[ui.modal.exo];
    enregistrer();
    ui.modal = null;
  },
  // --- Échauffement ---
  'chauffe-ok'() { d.enCours.chauffe.faites++; enregistrer(); },
  'chauffe-passer'() { d.enCours.chauffe.finie = true; enregistrer(); },
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
  'retrait-serie'() {
    const e = exoCourant();
    // On ne descend pas sous la série en cours (pour arrêter l'exercice : « Remplacer · passer »).
    if (e.cible.series <= Math.max(1, e.series.length + 1)) return false;
    e.cible.series -= 1;
    enregistrer();
    toast(`${e.cible.series} série${e.cible.series > 1 ? 's' : ''} prévue${e.cible.series > 1 ? 's' : ''}`);
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
};
