// =====================================================================
// Écran d'accueil : « Ma semaine »
// ---------------------------------------------------------------------
// De haut en bas :
//   1. les 7 jours de la semaine, avec un rond de couleur les jours d'activité
//      (jaune = musculation, bleu = Hyrox) ;
//   2. la carte jaune Muscu : séance conseillée et accès aux autres ;
//   3. la carte bleue Hyrox : prochaine séance du plan, plan complet, mode libre ;
//   4. les séances personnalisées enregistrées.
// =====================================================================

import { rappelSauvegarde } from '../metier/bilan.js';
import { ICONES, nav, pastille } from '../commun.js';
import { derniereFois, prochaineSeance } from '../composition.js';
import { d } from '../etat.js';
import { SEANCES, seance } from '../metier/donnees.js';
import { ajouterJours, aujourdhui, debutSemaine, esc } from '../outils.js';
import { resumeHyrox } from './hyrox.js';

const INITIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/** Bandeau des 7 jours : un rond plein les jours où une séance a été faite. */
function bandeauSemaine(debut) {
  const auj = aujourdhui();
  // Pour chaque date : quels types de séance ont été faits.
  const types = {};
  for (const s of d.historique) {
    if (s.date < debut) continue;
    (types[s.date] = types[s.date] || new Set()).add(s.seance?.startsWith('hyrox:') ? 'hyrox' : 'muscu');
  }
  const jours = INITIALES.map((initiale, i) => {
    const date = ajouterJours(debut, i);
    const t = types[date] || new Set();
    const classe = t.size === 2 ? 'mixte' : t.has('muscu') ? 'muscu' : t.has('hyrox') ? 'hyrox' : '';
    const dit = t.size ? [...t].map((x) => (x === 'hyrox' ? 'Hyrox' : 'musculation')).join(' et ') : 'pas de séance';
    return `<div class="${date === auj ? 'auj' : ''}" role="img" aria-label="${JOURS[i]} ${Number(date.slice(8))} : ${dit}">
      <span class="initiale">${initiale}</span><span class="rond-jour ${classe}">${Number(date.slice(8))}</span></div>`;
  }).join('');
  return `<div class="semaine">${jours}</div>
    <div class="legende-semaine petit"><span><i class="muscu"></i>Muscu</span><span><i class="hyrox"></i>Hyrox</span></div>`;
}

/** Carte jaune : la séance de musculation conseillée, ou la séance en cours. */
function carteMuscu() {
  if (d.enCours) {
    const n = d.enCours.exercices.reduce((t, e) => t + e.series.length, 0);
    return `<div class="conseillee carte-seance">
      <div class="label">Muscu · séance en cours</div>
      <div class="titre">${esc(d.enCours.nom || seance(d.enCours.seance)?.nom)}</div>
      <div class="sous">${n} série${n > 1 ? 's' : ''} validée${n > 1 ? 's' : ''}</div>
      <div class="boutons"><button class="plein" data-action="reprendre">Reprendre la séance</button></div>
    </div>`;
  }
  const prochaine = seance(prochaineSeance());
  const autres = SEANCES.filter((s) => s.id !== prochaine.id)
    .map((s) => `<button data-action="composer" data-id="${s.id}">${esc(s.nom)}</button>`).join('');
  return `<div class="conseillee carte-seance">
    <div class="label">Muscu · conseillée</div>
    <div class="titre">${esc(prochaine.nom)}</div>
    <div class="sous">${esc(prochaine.description)} · ${derniereFois(prochaine.id)}</div>
    <div class="boutons">
      <button class="plein" data-action="composer" data-id="${prochaine.id}">Démarrer</button>
      ${autres}
      <button data-action="perso">Perso</button>
    </div>
  </div>`;
}

/** Carte bleue : la prochaine séance Hyrox, selon le profil (voir resumeHyrox). */
function carteHyrox() {
  const r = resumeHyrox();
  const carte = (label, titre, sous, boutons) => `<div class="conseillee carte-seance carte-hyrox">
    <div class="label">${esc(label)}</div>
    <div class="titre">${esc(titre)}</div>
    ${sous ? `<div class="sous">${esc(sous)}</div>` : ''}
    <div class="boutons">${boutons}</div>
  </div>`;
  const plan = '<button data-action="onglet" data-id="hyrox">Mon plan</button>';
  const libre = '<button data-action="hyrox-libre">Libre</button>';
  const demarrer = (id) => `<button class="plein" data-action="hyrox-apercu" data-id="${id}">Démarrer</button>`;
  switch (r.etat) {
    case 'encours':
      return carte('Hyrox · séance en cours', r.titre, '', '<button class="plein" data-action="reprendre-h">Reprendre la séance</button>');
    case 'sans-profil':
      return carte('Hyrox', 'Prépare ta compétition', 'Un plan semaine par semaine jusqu\'au jour J, ou des séances libres.',
        `<button class="plein" data-action="hyrox-profil">Créer mon profil</button>${libre}`);
    case 'plan':
      return carte(r.label, r.titre, r.sous, demarrer(r.id) + plan + libre);
    case 'plan-fait':
      return carte(r.label, r.titre, r.sous, plan + libre);
    default:
      return carte('Hyrox libre', r.titre, r.sous, `${demarrer(r.id)}<button data-action="onglet" data-id="hyrox">Toutes les séances</button>`);
  }
}

export function ecranAccueil() {
  const deb = debutSemaine();
  const faites = d.historique.filter((s) => s.date >= deb && !s.importee).length;
  // Rappel de sauvegarde : jamais pendant une séance, pour ne pas gêner.
  const rappel = d.enCours ? null : rappelSauvegarde(d.sauvegarde, d.historique, aujourdhui());
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  const off = d.enCours ? 'disabled' : '';
  const enregistrees = d.seancesPerso.map((s) => `
    <button class="choix" data-action="perso" data-id="${esc(s.id)}" ${off} style="min-height:56px">
      <span><span class="nom u-t-15">${esc(s.nom)}</span><span class="petit">${s.exercices.length} exercices · ${derniereFois('perso:' + s.id)}</span></span>
      ${ICONES.suite}
    </button>`).join('');

  return `<main class="ecran avec-nav">
    <div class="entete">
      ${pastille('muscu')}
      <div><div class="sur-titre">${Math.min(faites, 9)} séance${faites > 1 ? 's' : ''} sur 3 cette semaine</div><h1>Ma semaine</h1></div>
      <button class="btn-icone" data-action="ecran" data-id="reglages" aria-label="Réglages">${ICONES.reglages}</button>
    </div>
    ${bandeauSemaine(deb)}
    ${standalone ? '' : `<div class="bandeau"><strong>Installe l'appli :</strong> dans Safari, touche Partager puis « Sur l'écran d'accueil ». C'est indispensable pour que tes données restent bien sur le téléphone.</div>`}
    ${rappel ? `<div class="bandeau rappel-sauvegarde">
      <span><strong>${rappel.jours == null ? 'Tu n\'as pas encore fait de sauvegarde.' : `Dernière sauvegarde il y a ${rappel.jours} jours.`}</strong><br>Mets tes données à l'abri dans Fichiers ou iCloud.</span>
      <button class="btn-secondaire" data-action="exporter">Sauvegarder</button>
    </div>` : ''}
    ${carteMuscu()}
    ${carteHyrox()}
    ${enregistrees ? `<div class="pile u-ecart-8"><div class="sur-titre">Tes séances enregistrées</div>${enregistrees}</div>` : ''}
  </main>${nav('seances')}`;
}
