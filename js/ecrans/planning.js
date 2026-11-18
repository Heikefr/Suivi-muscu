// =====================================================================
// Planning de la semaine et « Mes séances »
// ---------------------------------------------------------------------
//   - fenêtre d'un jour : séances faites (résumé), séances prévues (démarrer, composer
//     à l'avance, décaler, supprimer), ajout d'une séance ;
//   - choix d'une séance à planifier (pour un jour, ou pour la semaine type des Réglages) ;
//   - menu « Mes séances » : séances de muscu et circuits Hyrox enregistrés.
// Les calculs (semaine type, semaine modifiée, fait / pas fait) sont dans metier/planning.js.
// =====================================================================

import { ICONES } from '../commun.js';
import { composer } from '../composition.js';
import { d, enregistrer, toast, ui } from '../etat.js';
import { seance } from '../metier/donnees.js';
import { dureeCircuit } from '../metier/hyrox.js';
import {
  ajouterPrevu, categorie, deplacerPrevu, etatSemaine, lundiDe, planSemaine, revenirSemaineType, semaineModifiee,
  supprimerPrevu,
} from '../metier/planning.js';
import { ajouterJours, aujourdhui, dateLongue, esc, ilYa, mmss } from '../outils.js';
import { demarrerPerso } from './composition.js';
import { lancerCircuit, ouvrirCircuit } from './circuit.js';
import { resumeHyrox } from './hyrox.js';

export const NOMS_JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** Nom lisible d'une séance prévue. */
export function nomCle(cle) {
  if (seance(cle)) return seance(cle).nom;
  if (cle === 'hyrox') return 'Hyrox';
  if (cle.startsWith('perso:')) return d.seancesPerso.find((s) => `perso:${s.id}` === cle)?.nom || 'Séance supprimée';
  if (cle.startsWith('circuit:')) return d.circuits.find((c) => `circuit:${c.id}` === cle)?.nom || 'Circuit supprimé';
  return cle;
}

/** Tout ce qu'on peut planifier, par univers. */
function optionsPlanif() {
  const r = resumeHyrox();
  const sousHyrox = r.etat === 'plan' || r.etat === 'plan-fait' ? 'La prochaine séance de ton plan' : 'La séance Hyrox suggérée ce jour-là';
  return [
    ...['push', 'pull', 'jambes'].map((id) => ({ cle: id, nom: seance(id).nom, sous: seance(id).description })),
    ...d.seancesPerso.map((s) => ({ cle: `perso:${s.id}`, nom: s.nom, sous: `${s.exercices.length} exercices · séance enregistrée` })),
    { cle: 'hyrox', nom: 'Hyrox', sous: sousHyrox },
    ...d.circuits.map((c) => ({ cle: `circuit:${c.id}`, nom: c.nom, sous: `Circuit · ${c.tours} tour${c.tours > 1 ? 's' : ''} · ≈ ${dureeCircuit(c)} min` })),
  ];
}

/** « faite il y a 3 jours » / « jamais faite » pour une séance de muscu enregistrée. */
function derniereEnregistree(id) {
  const date = d.historique.filter((h) => h.enregistree === id || h.seance === `perso:${id}`).reduce((m, h) => (h.date > m ? h.date : m), '');
  return date ? `faite ${ilYa(date)}` : 'jamais faite';
}

/** Petite étiquette de couleur : MUSCU (gris) ou HYROX (jaune). */
function etiquette(cle) {
  return categorie(cle) === 'hyrox' ? '<span class="etiquette hyrox">Hyrox</span>' : '<span class="etiquette muscu">Muscu</span>';
}

/** « Mercredi 18 novembre » (avec majuscule). */
function titreJour(date) {
  const t = dateLongue(date);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// ---------- Fenêtres ----------

/** Fenêtre d'un jour : ce qui a été fait, ce qui est prévu. */
export function fenetreJour(m) {
  const auj = aujourdhui();
  const lundi = lundiDe(m.date);
  const { faites, prevus } = etatSemaine(d, lundi, auj)[m.date];
  const lignesFaites = faites.map((s) => `<button class="choix" data-action="voir-seance" data-id="${esc(s.id)}" data-jour="${m.date}" style="min-height:58px">
      <span><span class="nom u-t-15">${esc(s.nom || s.seance)}</span><span class="petit">${s.hyrox ? `Hyrox · ${mmss(s.hyrox.total)}` : `${s.exercices.length} exercice${s.exercices.length > 1 ? 's' : ''} · ${Math.max(1, Math.round(((s.fin || 0) - (s.debut || 0)) / 60000))} min`}</span></span>
      ${ICONES.suite}</button>`).join('');
  const aVenir = prevus.filter((p) => p.statut !== 'faite');
  const lignesPrevues = aVenir.map((p) => {
    const pasFaite = p.statut === 'pas-faite';
    const peutComposer = seance(p.cle) && !pasFaite;
    const bouton = (action, texte, classe = '') => `<button class="btn-secondaire ${classe}" data-action="${action}" data-date="${m.date}" data-id="${esc(p.id)}">${texte}</button>`;
    return `<div class="carte pile u-ecart-10 prevu ${pasFaite ? 'pas-faite' : ''}">
      <div class="ligne u-ecart-10">${etiquette(p.cle)}<span class="u-flex-1 u-gras-700 u-t-16">${esc(nomCle(p.cle))}</span>
        <span class="petit">${pasFaite ? 'Pas faite' : p.compo ? 'Composée à l\'avance' : 'Prévue'}</span></div>
      ${m.date === auj && !pasFaite ? `<button class="btn-principal u-h-52" data-action="demarrer-prevu" data-date="${m.date}" data-id="${esc(p.id)}">Démarrer</button>` : ''}
      <div class="boutons-prevu">
        ${peutComposer ? bouton('composer-prevu', p.compo ? 'Modifier les exercices' : 'Choisir les exercices') : ''}
        ${bouton('decaler', 'Décaler')}
        ${bouton('suppr-prevu', 'Supprimer', 'btn-danger')}
      </div>
    </div>`;
  }).join('');
  const futur = m.date >= auj;
  const vide = !faites.length && !aVenir.length;
  return `<h2>${titreJour(m.date)}${m.date === auj ? ' · aujourd\'hui' : ''}</h2>
    ${faites.length ? `<div class="sur-titre">Fait${faites.length > 1 ? 'es' : 'e'}</div>${lignesFaites}` : ''}
    ${aVenir.length ? `<div class="sur-titre">${futur ? 'Prévu' : 'Prévu, pas fait'}</div>${lignesPrevues}` : ''}
    ${vide ? `<div class="petit u-t-15">${futur ? 'Rien de prévu ce jour-là.' : 'Aucune séance ce jour-là.'}</div>` : ''}
    ${futur ? `<button class="btn-ajout" data-action="planifier" data-date="${m.date}">+ Planifier une séance</button>` : ''}
    ${semaineModifiee(d, lundi) && Object.values(d.semaineType).some((x) => x?.length)
    ? `<button class="btn-lien" data-action="semaine-type" data-lundi="${lundi}">Semaine modifiée · revenir à la semaine type</button>` : ''}
    <button class="btn-principal" data-action="fermer">Fermer</button>`;
}

/** Choix d'une séance à planifier : pour une date (m.date) ou un jour de la semaine type (m.jourType). */
export function fenetrePlanifier(m) {
  const titre = m.date ? titreJour(m.date) : `${NOMS_JOURS[m.jourType]}s`;
  const ligne = (o) => `<button class="choix" data-action="planifier-ok" data-cle="${esc(o.cle)}" style="min-height:58px">
      ${etiquette(o.cle)}<span><span class="nom u-t-15">${esc(o.nom)}</span><span class="petit">${esc(o.sous)}</span></span>${ICONES.plus}</button>`;
  const opts = optionsPlanif();
  return `<div class="label petit">${esc(titre)}</div><h2>Planifier une séance</h2>
    <div class="sur-titre">Musculation</div>${opts.filter((o) => categorie(o.cle) === 'muscu').map(ligne).join('')}
    <div class="sur-titre">Hyrox</div>${opts.filter((o) => categorie(o.cle) === 'hyrox').map(ligne).join('')}
    <button class="btn-secondaire" data-action="${m.date ? 'retour-jour' : 'fermer'}" data-date="${m.date || ''}">Annuler</button>`;
}

/** Choix du nouveau jour d'une séance prévue : aujourd'hui et les 7 jours suivants. */
export function fenetreDecaler(m) {
  const auj = aujourdhui();
  const jours = Array.from({ length: 8 }, (_, i) => ajouterJours(auj, i)).filter((x) => x !== m.date);
  const nom = (x) => (x === auj ? "Aujourd'hui" : x === ajouterJours(auj, 1) ? 'Demain' : titreJour(x).replace(/ \d{4}$/, ''));
  const plan = {};
  for (const x of jours) Object.assign(plan, planSemaine(d, lundiDe(x)));
  return `<div class="label petit">${esc(nomCle(m.cle))}</div><h2>Décaler à quel jour&nbsp;?</h2>
    ${jours.map((x) => `<button class="choix" data-action="decaler-ok" data-vers="${x}" style="min-height:54px">
      <span><span class="nom u-t-15">${nom(x)}</span><span class="petit">${plan[x]?.length ? `Déjà prévu : ${plan[x].map((p) => esc(nomCle(p.cle))).join(', ')}` : 'Rien de prévu'}</span></span>${ICONES.suite}</button>`).join('')}
    <button class="btn-secondaire" data-action="retour-jour" data-date="${m.date}">Annuler</button>`;
}

/** Menu « Mes séances » : séances de muscu et circuits enregistrés, à lancer ou à modifier. */
export function fenetreMesSeances(m) {
  const f = m.f || 'tout';
  const puce = (id, t) => `<button class="puce ${f === id ? 'on' : ''}" data-action="mes-seances-filtre" data-id="${id}" aria-pressed="${f === id}">${t}</button>`;
  const off = (cat) => (cat === 'muscu' ? d.enCours : d.enCoursHyrox) ? 'disabled' : '';
  const ligne = (cle, nom, sous, actionModif, id) => `<div class="ligne-seance">
      ${etiquette(cle)}
      <button class="u-flex-1 lien-seance" data-action="${actionModif}" data-id="${esc(id)}" aria-label="Modifier ${esc(nom)}">
        <span class="nom">${esc(nom)}</span><span class="petit">${esc(sous)}</span></button>
      <button class="btn-lancer ${categorie(cle)}" data-action="lancer-enregistree" data-cle="${esc(cle)}" aria-label="Lancer ${esc(nom)}" ${off(categorie(cle))}>${ICONES.lecture}</button>
    </div>`;
  const muscu = f === 'hyrox' ? [] : d.seancesPerso.map((s) => ligne(`perso:${s.id}`, s.nom,
    `${s.exercices.length} exercice${s.exercices.length > 1 ? 's' : ''}${s.base ? ` · ${seance(s.base)?.nom}` : ''} · ${derniereEnregistree(s.id)}`,
    'perso', s.id));
  const hyrox = f === 'muscu' ? [] : d.circuits.map((c) => ligne(`circuit:${c.id}`, c.nom,
    `${c.etapes.length} étape${c.etapes.length > 1 ? 's' : ''} · ${c.tours} tour${c.tours > 1 ? 's' : ''} · ≈ ${dureeCircuit(c)} min`, 'circuit-ouvrir', c.id));
  const toutes = [...muscu, ...hyrox];
  return `<h2>Mes séances enregistrées</h2>
    <div class="puces">${puce('tout', 'Toutes')}${puce('muscu', 'Muscu')}${puce('hyrox', 'Hyrox')}</div>
    ${toutes.length ? toutes.join('') : `<div class="petit u-t-15">Aucune séance enregistrée${f === 'tout' ? '' : ' ici'} pour l'instant. Compose une séance puis touche « Enregistrer ».</div>`}
    <div class="petit">Touche le nom pour modifier, ▶ pour lancer.</div>
    <div class="grille2">
      <button class="btn-secondaire" data-action="perso">+ Séance muscu</button>
      <button class="btn-secondaire" data-action="circuit-nouveau">+ Circuit Hyrox</button>
    </div>
    <button class="btn-principal" data-action="fermer">Fermer</button>`;
}

// ---------- Semaine type (écran Réglages) ----------

/** Carte « Ma semaine type » des Réglages. */
export function blocSemaineType() {
  const lignes = NOMS_JOURS.map((nom, i) => {
    const items = (d.semaineType[i] || []);
    const puces = items.map((cle, k) => `<span class="puce-prevue ${categorie(cle)}">${esc(nomCle(cle))}<button data-action="type-suppr" data-j="${i}" data-k="${k}" aria-label="Retirer ${esc(nomCle(cle))} du ${nom.toLowerCase()}">${ICONES.croix}</button></span>`).join('');
    return `<div class="ligne-type">
      <span class="jour">${nom.slice(0, 3)}.</span>
      <span class="u-flex-1 puces-type">${puces || '<span class="petit">Repos</span>'}</span>
      <button class="btn-icone petit-plus" data-action="planifier-type" data-j="${i}" aria-label="Ajouter une séance le ${nom.toLowerCase()}">${ICONES.ajout}</button>
    </div>`;
  }).join('');
  return `<div class="carte pile u-ecart-8">
    <div class="u-gras-600">Ma semaine type</div>
    <div class="petit">Elle remplit chaque semaine toute seule. Pour changer une semaine précise, touche un jour sur l'accueil : la semaine type ne bouge pas.</div>
    ${lignes}
  </div>`;
}

// ---------- Démarrer une séance prévue ----------

/** Lance une séance prévue aujourd'hui (la séance faite sera rattachée au planning). */
export function demarrerPrevu(date, id) {
  const p = planSemaine(d, lundiDe(date))[date].find((x) => x.id === id);
  if (!p) return;
  ui.modal = null;
  const plan = id;
  if (seance(p.cle)) {
    composer(p.cle);
    if (p.compo?.length) {
      ui.compo.cases = p.compo.map((k) => ({ role: k.role || '', options: [], cible: k.cible, exo: k.exo, raison: '' }));
      ui.compo.mode = 'prevue';
    }
    ui.compo.plan = plan;
    ui.ecran = 'composer';
    window.scrollTo(0, 0);
  } else if (p.cle.startsWith('perso:')) {
    demarrerPerso(d.seancesPerso.find((s) => `perso:${s.id}` === p.cle), plan);
  } else if (p.cle.startsWith('circuit:')) {
    lancerCircuit(d.circuits.find((c) => `circuit:${c.id}` === p.cle), plan);
  } else {
    const r = resumeHyrox();
    if (r.etat === 'encours') { ui.ecran = 'hyrox-seance'; return; }
    if (!r.id) { ui.ecran = r.etat === 'sans-profil' ? 'hyrox-libre' : 'hyrox'; return; }
    ui.hyroxApercu = r.id;
    ui.planHyrox = plan;
    ui.ecran = 'hyrox-apercu';
    window.scrollTo(0, 0);
  }
}

/** Actions des boutons de ce fichier (attribut data-action dans le HTML). */
export const actions = {
  jour(el) {
    const date = el.dataset.date;
    const { faites, prevus } = etatSemaine(d, lundiDe(date), aujourdhui())[date];
    // Un jour passé avec une seule séance et rien d'autre : le résumé directement.
    if (faites.length === 1 && date < aujourdhui() && prevus.every((p) => p.statut === 'faite')) {
      ui.modal = { type: 'seance', id: faites[0].id, jour: date };
    } else ui.modal = { type: 'jour', date };
  },
  'retour-jour'(el) { ui.modal = { type: 'jour', date: el.dataset.date }; },
  semaine(el) { ui.semaine = Math.max(-8, Math.min(4, (ui.semaine || 0) + Number(el.dataset.d))); },
  planifier(el) { ui.modal = { type: 'planifier', date: el.dataset.date }; },
  'planifier-type'(el) { ui.modal = { type: 'planifier', jourType: Number(el.dataset.j) }; },
  'planifier-ok'(el) {
    const m = ui.modal;
    const cle = el.dataset.cle;
    if (m.date) {
      ajouterPrevu(d, m.date, cle);
      ui.modal = { type: 'jour', date: m.date };
    } else {
      d.semaineType[m.jourType] = [...(d.semaineType[m.jourType] || []), cle];
      ui.modal = null;
    }
    enregistrer();
    toast(`${nomCle(cle)} planifiée`);
    return false;
  },
  'type-suppr'(el) {
    const j = Number(el.dataset.j);
    d.semaineType[j] = (d.semaineType[j] || []).filter((_, k) => k !== Number(el.dataset.k));
    if (!d.semaineType[j].length) delete d.semaineType[j];
    enregistrer();
  },
  'demarrer-prevu'(el) { demarrerPrevu(el.dataset.date, el.dataset.id); },
  'suppr-prevu'(el) {
    supprimerPrevu(d, el.dataset.date, el.dataset.id);
    enregistrer();
    ui.modalGardeScroll = true;
    toast('Séance retirée du planning');
    return false;
  },
  decaler(el) {
    const p = planSemaine(d, lundiDe(el.dataset.date))[el.dataset.date].find((x) => x.id === el.dataset.id);
    ui.modal = { type: 'decaler', date: el.dataset.date, id: el.dataset.id, cle: p?.cle || '' };
  },
  'decaler-ok'(el) {
    const m = ui.modal;
    deplacerPrevu(d, m.date, m.id, el.dataset.vers);
    enregistrer();
    ui.modal = { type: 'jour', date: el.dataset.vers };
    toast(`${nomCle(m.cle)} décalée`);
    return false;
  },
  'composer-prevu'(el) {
    const date = el.dataset.date;
    const p = planSemaine(d, lundiDe(date))[date].find((x) => x.id === el.dataset.id);
    composer(p.cle);
    if (p.compo?.length) ui.compo.cases = p.compo.map((k) => ({ role: k.role || '', options: [], cible: k.cible, exo: k.exo, raison: '' }));
    // Mode « à l'avance » : le bouton du bas enregistre au lieu de démarrer.
    ui.compo.avance = { date, id: p.id };
    ui.modal = null;
    ui.ecran = 'composer';
    window.scrollTo(0, 0);
  },
  'semaine-type'(el) {
    revenirSemaineType(d, el.dataset.lundi);
    enregistrer();
    toast('La semaine reprend ta semaine type');
  },
  'mes-seances'() { ui.modal = { type: 'mes-seances', f: 'tout' }; },
  'mes-seances-filtre'(el) { ui.modal.f = el.dataset.id; ui.modalGardeScroll = true; },
  'lancer-enregistree'(el) {
    const cle = el.dataset.cle;
    ui.modal = null;
    if (cle.startsWith('perso:')) demarrerPerso(d.seancesPerso.find((s) => `perso:${s.id}` === cle));
    else lancerCircuit(d.circuits.find((c) => `circuit:${c.id}` === cle));
    return false;
  },
  'circuit-ouvrir'(el) { ui.modal = null; ouvrirCircuit(el.dataset.id); },
};
