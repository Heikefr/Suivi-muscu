// =====================================================================
// Écran d'accueil : « Ma semaine »
// ---------------------------------------------------------------------
// De haut en bas :
//   1. les 7 jours de la semaine : rond plein = séance faite (gris = muscu, jaune = Hyrox),
//      cercle = séance prévue, pointillé = prévue mais pas faite. Toucher un jour l'ouvre
//      (résumé, planning). Les flèches passent aux semaines voisines ;
//   2. la séance en cours, ou ce qui est prévu aujourd'hui ;
//   3. la grille : Push, Pull, Jambes, Perso, Hyrox, Circuit libre ;
//   4. « Mes séances enregistrées », puis les rappels (installation, sauvegarde).
// =====================================================================

import { rappelSauvegarde } from '../metier/bilan.js';
import { ICONES, nav, pastille } from '../commun.js';
import { derniereFois, prochaineSeance } from '../composition.js';
import { d, ui } from '../etat.js';
import { SEANCES, seance } from '../metier/donnees.js';
import { joursRestants } from '../metier/hyrox.js';
import { categorie, cleDeSeance, etatSemaine, joursDe, lundiDe } from '../metier/planning.js';
import { ajouterJours, aujourdhui, dateCourte, esc } from '../outils.js';
import { resumeHyrox } from './hyrox.js';
import { nomCle } from './planning.js';

const INITIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/** Libellé de la semaine affichée : « Cette semaine », « Semaine prochaine »… */
function nomSemaine(decalage, lundi) {
  if (decalage === 0) return 'Cette semaine';
  if (decalage === 1) return 'Semaine prochaine';
  if (decalage === -1) return 'Semaine dernière';
  return `Semaine du ${dateCourte(lundi)}`;
}

/** Bandeau des 7 jours, avec les séances faites et prévues. */
function bandeauSemaine(lundi, etat) {
  const auj = aujourdhui();
  const decalage = ui.semaine || 0;
  const jours = joursDe(lundi).map((date, i) => {
    const { faites, prevus } = etat[date];
    const fait = new Set(faites.map((s) => categorie(cleDeSeance(s))));
    const aFaire = prevus.filter((p) => p.statut === 'prevue');
    const prevu = new Set(aFaire.map((p) => categorie(p.cle)));
    const pasFaite = prevus.some((p) => p.statut === 'pas-faite');
    let classe = '';
    if (fait.size) classe = fait.size === 2 ? 'mixte' : [...fait][0];
    else if (prevu.size) classe = prevu.size === 2 ? 'prevu-mixte' : `prevu-${[...prevu][0]}`;
    else if (pasFaite) classe = 'pas-faite';
    const dit = [
      ...faites.map((s) => `${s.nom || s.seance} faite`),
      ...prevus.filter((p) => p.statut !== 'faite').map((p) => `${nomCle(p.cle)} ${p.statut === 'pas-faite' ? 'pas faite' : 'prévue'}`),
    ].join(', ') || 'rien';
    return `<button class="jour ${date === auj ? 'auj' : ''}" data-action="jour" data-date="${date}" aria-label="${JOURS[i]} ${Number(date.slice(8))} : ${esc(dit)}">
      <span class="initiale">${INITIALES[i]}</span><span class="rond-jour ${classe}">${Number(date.slice(8))}</span><span class="point-auj"></span></button>`;
  }).join('');
  return `<div class="pile u-ecart-8">
    <div class="ligne nav-semaine">
      <button class="btn-mini" data-action="semaine" data-d="-1" aria-label="Semaine précédente">${ICONES.gauche}</button>
      <span class="u-flex-1 u-aligne-center u-gras-600 u-t-14">${nomSemaine(decalage, lundi)}</span>
      <button class="btn-mini" data-action="semaine" data-d="1" aria-label="Semaine suivante" ${decalage >= 4 ? 'disabled' : ''}>${ICONES.droite}</button>
    </div>
    <div class="semaine">${jours}</div>
    <div class="legende-semaine petit">
      <span>Touche un jour : résumé, planning</span>
      <span class="u-aff-flex u-ecart-10"><span><i class="muscu"></i>Muscu</span><span><i class="hyrox"></i>Hyrox</span></span>
    </div>
  </div>`;
}

/** Séance en cours (muscu ou Hyrox) : la reprendre passe avant tout. */
function cartesEnCours() {
  let html = '';
  if (d.enCours) {
    const n = d.enCours.exercices.reduce((t, e) => t + e.series.length, 0);
    html += `<div class="en-cours muscu">
      <span class="pile u-ecart-2 u-flex-1"><span class="label">Muscu · séance en cours</span><span class="titre">${esc(d.enCours.nom || seance(d.enCours.seance)?.nom)}</span><span class="petit">${n} série${n > 1 ? 's' : ''} validée${n > 1 ? 's' : ''}</span></span>
      <button data-action="reprendre">Reprendre</button></div>`;
  }
  if (d.enCoursHyrox) {
    html += `<div class="en-cours hyrox">
      <span class="pile u-ecart-2 u-flex-1"><span class="label">Hyrox · séance en cours</span><span class="titre">${esc(d.enCoursHyrox.nom)}</span></span>
      <button data-action="reprendre-h">Reprendre</button></div>`;
  }
  return html;
}

/** Ce qui est prévu aujourd'hui et pas encore fait. */
function blocAujourdhui(etat) {
  const auj = aujourdhui();
  const prevus = (etat[auj]?.prevus || []).filter((p) => p.statut === 'prevue');
  if (!prevus.length) return '';
  return `<div class="carte pile u-ecart-8 aujourdhui">
    <div class="label u-t-11">Prévu aujourd'hui</div>
    ${prevus.map((p) => {
    const occupe = categorie(p.cle) === 'muscu' ? d.enCours : d.enCoursHyrox;
    return `<div class="ligne u-ecart-10">
      <span class="etiquette ${categorie(p.cle)}">${categorie(p.cle) === 'hyrox' ? 'Hyrox' : 'Muscu'}</span>
      <span class="pile u-ecart-2 u-flex-1"><span class="u-gras-700 u-t-16">${esc(nomCle(p.cle))}</span>${p.compo ? '<span class="petit">Exercices choisis à l\'avance</span>' : ''}</span>
      <button class="btn-demarrer ${categorie(p.cle)}" data-action="demarrer-prevu" data-date="${auj}" data-id="${esc(p.id)}" ${occupe ? 'disabled' : ''}>Démarrer</button>
    </div>`;
  }).join('')}
  </div>`;
}

/** Tuile de la grille. */
function tuile({ action, id = '', titre, sous, sous2 = '', classe, icone, badge = '', off = false }) {
  return `<button class="tuile-a ${classe}" data-action="${action}" ${id ? `data-id="${esc(id)}"` : ''} ${off ? 'disabled' : ''}>
    <span class="haut">${icone}${badge ? `<span class="badge-a">${badge}</span>` : ''}</span>
    <span class="bas"><span class="titre">${esc(titre)}</span><span class="sous">${esc(sous)}</span>${sous2 ? `<span class="sous">${esc(sous2)}</span>` : ''}</span>
  </button>`;
}

/** La tuile Hyrox : selon le profil, la prochaine séance du plan ou la séance libre suggérée. */
function tuileHyrox() {
  const r = resumeHyrox();
  const p = d.hyroxProfil;
  const j = p?.mode === 'competition' && p.date ? joursRestants(p.date, aujourdhui()) : null;
  const jText = j == null ? '' : j <= 0 ? "C'est aujourd'hui" : `J-${j}`;
  const base = { classe: 'hyrox', icone: ICONES.calendrier, off: Boolean(d.enCoursHyrox) };
  switch (r.etat) {
    case 'sans-profil': return tuile({ ...base, action: 'hyrox-profil', titre: 'Hyrox', sous: 'Crée ton profil' });
    case 'plan': return tuile({ ...base, action: 'hyrox-apercu', id: r.id, titre: 'Plan Hyrox', sous: jText, sous2: r.titre });
    case 'plan-fait': return tuile({ ...base, action: 'onglet', id: 'hyrox', titre: 'Plan Hyrox', sous: jText, sous2: 'Semaine faite' });
    case 'encours': return tuile({ ...base, action: 'reprendre-h', titre: 'Hyrox', sous: 'Séance en cours', off: false });
    default: return tuile({ ...base, action: 'hyrox-apercu', id: r.id, titre: 'Hyrox libre', sous: r.titre });
  }
}

export function ecranAccueil() {
  const auj = aujourdhui();
  const decalage = ui.semaine || 0;
  const lundi = ajouterJours(lundiDe(auj), decalage * 7);
  const etat = etatSemaine(d, lundi, auj);
  const etatCourant = decalage === 0 ? etat : etatSemaine(d, lundiDe(auj), auj);

  // Résumé de la semaine en cours : faites, et prévues restantes.
  const faites = Object.values(etatCourant).reduce((t, j) => t + j.faites.length, 0);
  const restent = Object.values(etatCourant).reduce((t, j) => t + j.prevus.filter((p) => p.statut === 'prevue').length, 0);
  const resume = faites || restent
    ? [faites ? `${faites} séance${faites > 1 ? 's' : ''} faite${faites > 1 ? 's' : ''}` : '', restent ? `${restent} prévue${restent > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')
    : 'Aucune séance pour l\'instant';

  // Séance de muscu mise en avant : celle prévue aujourd'hui, sinon la rotation Push → Pull → Jambes.
  const prevueAuj = (etatCourant[auj]?.prevus || []).find((p) => p.statut === 'prevue' && seance(p.cle));
  const enAvant = prevueAuj?.cle || prochaineSeance();
  const muscu = SEANCES.map((s) => tuile({
    action: 'composer', id: s.id, titre: s.nom, sous: s.description, sous2: derniereFois(s.id),
    classe: `muscu ${s.id === enAvant ? 'plein' : ''}`, icone: ICONES.haltere,
    badge: s.id === enAvant ? (prevueAuj ? 'Prévue' : 'Conseillée') : '', off: Boolean(d.enCours),
  })).join('');
  const nbEnreg = d.seancesPerso.length + d.circuits.length;

  // Rappel de sauvegarde : jamais pendant une séance, pour ne pas gêner.
  const rappel = d.enCours || d.enCoursHyrox ? null : rappelSauvegarde(d.sauvegarde, d.historique, auj);
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

  return `<main class="ecran avec-nav accueil">
    <div class="entete">
      ${pastille('appli')}
      <div><div class="sur-titre">${resume}</div><h1>Ma semaine</h1></div>
      <button class="btn-icone" data-action="ecran" data-id="reglages" aria-label="Réglages">${ICONES.reglages}</button>
    </div>
    ${bandeauSemaine(lundi, etat)}
    ${cartesEnCours()}
    ${blocAujourdhui(etatCourant)}
    <div class="grille-accueil">
      ${muscu}
      ${tuile({ action: 'perso', titre: 'Perso', sous: 'Choisis tes exercices', classe: 'muscu', icone: ICONES.ajout, off: Boolean(d.enCours) })}
      ${tuileHyrox()}
      ${tuile({ action: 'circuit-nouveau', titre: 'Circuit libre', sous: 'Tes étapes, tes tours', classe: 'hyrox-contour', icone: ICONES.boucle, off: Boolean(d.enCoursHyrox) })}
    </div>
    <button class="ligne-mes-seances" data-action="mes-seances">
      ${ICONES.signet}<span class="u-flex-1">Mes séances enregistrées</span><span class="petit">${nbEnreg}</span>${ICONES.bas}
    </button>
    ${rappel ? `<div class="bandeau rappel-sauvegarde">
      <span><strong>${rappel.jours == null ? 'Tu n\'as pas encore fait de sauvegarde.' : `Dernière sauvegarde il y a ${rappel.jours} jours.`}</strong><br>Mets tes données à l'abri dans Fichiers ou iCloud.</span>
      <button class="btn-secondaire" data-action="exporter">Sauvegarder</button>
    </div>` : ''}
    ${standalone ? '' : `<div class="bandeau"><strong>Installe l'appli :</strong> dans Safari, touche Partager puis « Sur l'écran d'accueil ». C'est indispensable pour que tes données restent bien sur le téléphone.</div>`}
  </main>${nav('seances')}`;
}
