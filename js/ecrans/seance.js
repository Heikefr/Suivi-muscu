// =====================================================================
// Écrans d'une séance de musculation en cours
// ---------------------------------------------------------------------
// Exercice (musculation ou haltérophilie), récupération avec minuteur, écran de fin.
// =====================================================================

import { ICONES, chargeTexte, cibleTexte, estHaltero, nomExo, repsTexte } from '../commun.js';
import { ecranAccueil } from './accueil.js';
import { d, enregistrer, rendre, toast, ui } from '../etat.js';
import { illustration } from '../illustrations.js';
import { EXERCICES, exo, seance } from '../metier/donnees.js';
import { ECHAUFFEMENTS, RECUP_MAX, RECUP_MIN, RECUP_PAS, dureeRecup, erreurAEviter } from '../metier/conseils.js';
import { chargeDe } from '../metier/progression.js';
import { aujourdhui, dateLongue, esc, ilYa, mmss, nb } from '../outils.js';
import {
  ajouterExo, allerExo, chargeSerie, exoCourant, finRecup, garderEcranAllume, libererEcran, preparerExo, prochainIndex,
  recalculerPlan, terminer, validerSerie,
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
      <button class="btn-icone" data-action="ma-seance" aria-label="Ma séance : tous les exercices">${ICONES.tuiles}</button>
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

/** Rappel d'une douleur ou gêne signalée la dernière fois sur cet exercice (« prévenir seulement »). */
function blocAlerte(def) {
  const a = d.alertes[def.id];
  if (!a) return '';
  return `<div class="alerte">
    <div class="u-flex-1 pile u-ecart-2">
      <strong>Gêne ${a.zone ? `${esc(LIBELLES_ZONE[a.zone] || a.zone)} ` : ''}signalée ${ilYa(a.date)}</strong>
      ${a.note ? `<span>${esc(a.note)}</span>` : ''}
      <span class="petit">Écoute ton corps : allège ou remplace l'exercice si ça revient.</span>
    </div>
    <button class="btn-lien" data-action="alerte-ok" data-id="${def.id}">C'est passé</button>
  </div>`;
}

/** Zones proposées quand on signale une gêne, et leur libellé dans le rappel (« gêne au coude »). */
export const ZONES = [['epaule', 'Épaule'], ['coude', 'Coude'], ['poignet', 'Poignet'], ['dos', 'Dos'], ['hanche', 'Hanche'], ['genou', 'Genou'], ['cheville', 'Cheville'], ['autre', 'Autre']];
const LIBELLES_ZONE = {
  epaule: "à l'épaule", coude: 'au coude', poignet: 'au poignet', dos: 'au dos', hanche: 'à la hanche', genou: 'au genou', cheville: 'à la cheville', autre: '',
};

/** Vrai tant que l'échauffement de la séance n'est ni fait ni passé (seulement avant la toute première série). */
function chauffeAFaire() {
  const ec = d.enCours;
  const c = ec.chauffe;
  // Une séance commencée avant la version 0.7 n'a pas de type d'échauffement.
  return Boolean(c && c.type && !c.finie && ec.exercices.every((x) => !x.series.length));
}

/** Écran d'échauffement : un exercice léger à part, 2 séries faciles, non enregistrées. */
function ecranEchauffement() {
  const ec = d.enCours;
  const ch = ECHAUFFEMENTS[ec.chauffe.type];
  const n = ec.chauffe.faites;
  const premier = exo(exoCourant().exo);
  const cases = Array.from({ length: ch.series }, (_, i) => (i < n
    ? `<div class="faite"><span>Série ${i + 1}</span><strong>faite</strong></div>`
    : `<div class="${i === n ? 'encours' : ''}"><span>Série ${i + 1}</span><strong>${i === n ? 'en cours' : 'à venir'}</strong></div>`)).join('');
  return `<main class="ecran">
    ${enteteSeance()}
    <div class="sur-titre u-c-accent">Échauffement · facultatif</div>
    <div class="exo-tete">
      <div class="dessin">${illustration(ch.dessin, ch.nom, 78)}</div>
      <div class="texte"><h1>${esc(ch.nom)}</h1><div class="petit">${esc(ch.pourquoi)}. Ne compte pas dans ta progression.</div></div>
    </div>
    <div class="carte saisie">
      <div class="u-gras-700">Série ${Math.min(n + 1, ch.series)} sur ${ch.series}</div>
      <div class="u-t-20 u-gras-600">${esc(ch.consigne)}</div>
      <div class="petit">Sans forcer : tu dois finir en ayant chaud, pas fatigué.</div>
    </div>
    <div class="cases-series" style="grid-template-columns:repeat(${ch.series},minmax(0,1fr))">${cases}</div>
    <div class="pousse"></div>
    <div class="carte ligne u-ecart-12"><span class="mini-dessin">${illustration(premier.dessin, premier.nom, 40)}</span>
      <span class="pile u-ecart-2 u-flex-1"><span class="petit">Ensuite</span><span class="u-gras-600">${esc(premier.nom)}</span></span></div>
    <div class="pile u-ecart-6">
      <button class="btn-principal" data-action="chauffe-ok">Série ${n + 1} faite</button>
      <button class="btn-lien" data-action="chauffe-passer">Passer l'échauffement</button>
    </div>
  </main>`;
}

/**
 * Écran d'un exercice de musculation (délègue à ecranHaltero pour l'haltérophilie).
 * Disposition compacte : le poids et les répétitions se règlent directement ici,
 * les séries tiennent sur une ligne, et le bouton « Valider » reste visible.
 */
export function ecranExercice() {
  const e = exoCourant();
  const def = exo(e.exo);
  if (chauffeAFaire()) return ecranEchauffement();
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
    ${blocAlerte(def)}
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
        <button class="btn-lien" data-action="options">Options</button>
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
    ${blocAlerte(def)}
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

/** Résumé d'une série prévue : « Série 2 sur 4 · 60 kg · 8 à 10 reps ». */
function texteSerieSuivante(e, def) {
  const charge = chargeSerie(e, e.series.length);
  const obj = e.cible.repsMin === e.cible.repsMax ? e.cible.repsMin : `${e.cible.repsMin} à ${e.cible.repsMax}`;
  return `Série ${e.series.length + 1} sur ${e.cible.series}${def.poidsDuCorps ? '' : ` · ${chargeTexte(charge, def)}`} · ${obj} ${def.unite === 's' ? 's' : 'reps'}`;
}

/**
 * Exercices à proposer quand tout est fait : même famille que la séance, pas encore faits,
 * et de préférence d'un groupe musculaire qui n'a pas encore travaillé.
 */
function suggestionsFin() {
  const ec = d.enCours;
  const dans = ec.exercices.map((x) => x.exo);
  const groupes = new Set(dans.map((id) => exo(id)?.groupe));
  const familles = new Set(dans.map((id) => exo(id)?.famille));
  return EXERCICES
    .filter((x) => familles.has(x.famille) && !dans.includes(x.id) && !d.exclus.includes(x.id) && x.type !== 'haltero')
    .sort((a, b) => (groupes.has(a.groupe) ? 1 : 0) - (groupes.has(b.groupe) ? 1 : 0))
    .slice(0, 3);
}

/** Écran de récupération : minuteur, ressenti, conseils, et la suite de la séance. */
export function ecranRecup() {
  const ec = d.enCours;
  const r = ec.recup;
  const exoFait = ec.exercices[r.exoIndex];
  const defFait = exo(exoFait.exo);
  const derSerie = exoFait.series[r.serieIndex];
  const e = exoCourant();
  const def = exo(e.exo);
  const theme = estHaltero(defFait) ? 'theme-haltero' : '';
  const btnR = (v, t) => `<button data-action="ressenti" data-v="${v}" class="${derSerie?.ressenti === v ? 'on' : ''}" aria-pressed="${derSerie?.ressenti === v}">${t}</button>`;
  const exoTermine = exoFait.series.length >= exoFait.cible.series;
  const alerte = d.alertes[defFait.id];
  const geneDuJour = alerte && alerte.date === aujourdhui();

  // Conseils : ceux de l'exercice de la prochaine série (le même, sauf après sa dernière série).
  const defConseil = r.finSeance ? defFait : def;
  const conseils = `<div class="carte pile u-ecart-8">
    <div class="sur-titre">Conseils · ${esc(defConseil.nom)}</div>
    <div class="u-t-15 u-interligne-1-45">${esc(defConseil.conseil)}</div>
    ${erreurAEviter(defConseil.id) ? `<div class="a-eviter"><strong>À éviter :</strong> ${esc(erreurAEviter(defConseil.id))}</div>` : ''}
  </div>`;

  // La suite : aperçu de la prochaine série, ou choix du prochain exercice, ou fin de séance.
  let suite;
  if (r.finSeance) {
    const sug = suggestionsFin();
    suite = `<div class="carte pile u-ecart-10">
      <div class="u-gras-700 u-t-16">Tous les exercices prévus sont faits</div>
      ${sug.length ? `<div class="petit">Tu as encore de l'énergie ? Enchaîne avec :</div>
      ${sug.map((x) => `<button class="choix" data-action="ajouter-seance" data-id="${x.id}" style="min-height:56px">
        <span class="mini-dessin">${illustration(x.dessin, x.nom, 40)}</span>
        <span><span class="nom u-t-15">${esc(x.nom)}</span><span class="petit">${esc(x.muscles)}</span></span>${ICONES.plus}</button>`).join('')}` : ''}
      <button class="btn-lien" data-action="ajout-seance">Choisir dans tous les exercices</button>
    </div>
    <button class="btn-principal" data-action="terminer-seance">Terminer la séance</button>`;
  } else {
    suite = `<div class="carte ligne u-ecart-12 suite">
      <span class="mini-dessin">${illustration(def.dessin, def.nom, 40)}</span>
      <span class="pile u-ecart-2 u-flex-1">
        <span class="petit">${exoTermine ? 'Exercice suivant' : 'Ensuite'}</span>
        <span class="u-gras-600">${e === exoFait ? '' : `${esc(def.nom)} · `}${esc(texteSerieSuivante(e, def))}</span>
      </span>
    </div>
    ${exoTermine ? '<button class="btn-secondaire" data-action="ma-seance">Choisir un autre exercice</button>' : ''}`;
  }

  return `<main class="ecran ${theme}" style="gap:18px">
    <div class="ligne">
      <div class="pile u-ecart-6 u-flex-1">
        <div class="sur-titre">${esc(nomExo(exoFait.exo))} · série ${r.serieIndex + 1} validée</div>
        <h1 class="u-t-28" id="recup-titre">Récupération</h1>
      </div>
      <button class="btn-icone" data-action="ma-seance" aria-label="Ma séance : tous les exercices">${ICONES.tuiles}</button>
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
      ${r.finSeance ? '<span></span>' : '<button class="btn-secondaire" data-action="fin-recup">Passer la récup</button>'}
    </div>
    <div class="carte pile u-ecart-12 u-pad-16">
      <div class="u-t-15 u-gras-600">Comment était cette série&nbsp;?</div>
      <div class="grille3 choix-ressenti u-ecart-8">${btnR('facile', 'Facile')}${btnR('correct', 'Correct')}${btnR('dur', 'Dur')}</div>
      <div class="petit">Facultatif. Sert à ajuster le poids conseillé de la prochaine séance.</div>
      <button class="btn-lien lien-gene ${geneDuJour ? 'notee' : ''}" data-action="gene" data-id="${defFait.id}">${geneDuJour ? `Gêne notée ${esc(LIBELLES_ZONE[alerte.zone] || '')} · modifier` : 'Signaler une douleur ou une gêne'}</button>
    </div>
    ${suite}
    ${conseils}
  </main>`;
}

/** Écran « Ma séance » : une tuile par exercice prévu, pour voir toute la séance et choisir le suivant. */
export function ecranMaSeance() {
  const ec = d.enCours;
  const faits = ec.exercices.filter((x) => x.series.length >= x.cible.series).length;
  const tuiles = ec.exercices.map((x, i) => {
    const def = exo(x.exo);
    const n = x.series.length;
    const total = x.cible.series;
    const etat = n >= total ? 'faite' : i === ec.index ? 'encours' : n ? 'entamee' : '';
    const badge = n >= total ? `${ICONES.coche} Fait` : i === ec.index ? 'En cours' : n ? `${n}/${total} séries` : 'À faire';
    const detail = n >= total ? resumeSeries(x.series, def) : `${cibleTexte(x.cible, def)}${def.poidsDuCorps || x.charge == null ? '' : ` · ${chargeTexte(chargeSerie(x, n), def)}`}`;
    return `<button class="tuile ${etat}" data-action="aller-exo" data-i="${i}" ${n >= total ? 'disabled' : ''}>
      <span class="badge">${badge}</span>
      <span class="dessin-tuile">${illustration(def.dessin, def.nom, 72)}</span>
      <span class="nom">${esc(def.nom)}</span>
      <span class="petit">${esc(detail)}</span>
      ${d.alertes[def.id] ? '<span class="gene-tuile">Gêne signalée</span>' : ''}
    </button>`;
  }).join('');
  return `<main class="ecran">
    <div class="ligne">
      <button class="btn-icone" data-action="retour-seance" aria-label="Retour">${ICONES.retour}</button>
      <div class="pile u-flex-1 u-ecart-2"><div class="sur-titre">${faits} exercice${faits > 1 ? 's' : ''} fait${faits > 1 ? 's' : ''} sur ${ec.exercices.length}</div><h1 class="u-t-26">Ma séance</h1></div>
    </div>
    <div class="petit">Touche un exercice pour le faire maintenant (machine prise, envie de changer l'ordre…).</div>
    <div class="tuiles">
      ${tuiles}
      <button class="tuile ajout" data-action="ajout-seance"><span class="carre-plus">${ICONES.plus}</span><span class="nom">Ajouter un exercice</span></button>
    </div>
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
  'chauffe-ok'() {
    const c = d.enCours.chauffe;
    c.faites++;
    if (c.faites >= ECHAUFFEMENTS[c.type].series) c.finie = true;
    enregistrer();
    window.scrollTo(0, 0);
  },
  'chauffe-passer'() { d.enCours.chauffe.finie = true; enregistrer(); },
  // --- Ma séance (tuiles) ---
  'ma-seance'() { ui.ecran = 'ma-seance'; window.scrollTo(0, 0); },
  'retour-seance'() { ui.ecran = d.enCours.recup ? 'recup' : 'exercice'; window.scrollTo(0, 0); },
  'aller-exo'(el) {
    allerExo(Number(el.dataset.i));
    ui.ecran = d.enCours.recup ? 'recup' : 'exercice';
    window.scrollTo(0, 0);
  },
  'ajout-seance'() { ui.modal = { type: 'ajout-seance' }; },
  'ajouter-seance'(el) {
    ajouterExo(el.dataset.id);
    ui.modal = null;
    ui.ecran = d.enCours.recup ? 'recup' : 'exercice';
    toast(`${nomExo(el.dataset.id)} ajouté`);
    window.scrollTo(0, 0);
    return false;
  },
  'terminer-seance'() { terminer(); return false; },
  // --- Douleur ou gêne (prévenir seulement : rien d'autre ne change) ---
  gene(el) {
    const a = d.alertes[el.dataset.id];
    ui.modal = { type: 'gene', exo: el.dataset.id, zone: a?.date === aujourdhui() ? a.zone : null };
  },
  'gene-zone'(el) {
    ui.modal.zone = ui.modal.zone === el.dataset.z ? null : el.dataset.z;
    ui.modalGardeScroll = true;
  },
  'gene-ok'() {
    const note = (document.getElementById('gene-note')?.value || '').trim();
    if (!ui.modal.zone && !note) { toast('Choisis une zone ou écris une note'); return false; }
    d.alertes[ui.modal.exo] = { date: aujourdhui(), zone: ui.modal.zone, note };
    enregistrer();
    ui.modal = null;
    toast('Noté : tu seras prévenu la prochaine fois');
  },
  'gene-effacer'() { delete d.alertes[ui.modal.exo]; enregistrer(); ui.modal = null; },
  'alerte-ok'(el) { delete d.alertes[el.dataset.id]; enregistrer(); toast('Alerte effacée'); },
  // --- Temps de récup propre à un exercice (fenêtre Options) ---
  'recup-exo'(el) {
    const def = exo(exoCourant().exo);
    const actuel = dureeRecup(def, d);
    d.recupExo[def.id] = Math.min(RECUP_MAX, Math.max(RECUP_MIN, actuel + Number(el.dataset.d) * RECUP_PAS));
    enregistrer();
    ui.modalGardeScroll = true;
  },
  'recup-exo-regle'() { delete d.recupExo[exoCourant().exo]; enregistrer(); ui.modalGardeScroll = true; },
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
