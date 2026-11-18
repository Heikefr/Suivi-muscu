// =====================================================================
// Circuit Hyrox libre
// ---------------------------------------------------------------------
// Écran de composition : étapes au choix (stations Hyrox, course, exercice de muscu,
// étape libre, repos), nombre de tours, nom. Le circuit se déroule ensuite avec
// l'écran de séance Hyrox (hyrox-seance.js). Le circuit en cours d'écriture est dans ui.circuit.
// =====================================================================

import { ICONES } from '../commun.js';
import { d, enregistrer, toast, ui } from '../etat.js';
import { illustration } from '../illustrations.js';
import { correspond, EXERCICES, exo } from '../metier/donnees.js';
import {
  CHARGES, STATIONS, blocsCircuit, circuitValide, dureeCircuit, dureeTexte, etapeCircuit, niveauCharges, noteCharge, pasValeur,
  station, texteEtapeCircuit,
} from '../metier/hyrox.js';
import { esc, identifiant, nb } from '../outils.js';
import { lancerSeanceHyrox } from './hyrox-seance.js';

/** Ouvre l'écran de composition, sur un circuit enregistré (id) ou un nouveau circuit. */
export function ouvrirCircuit(id = null) {
  const c = id ? d.circuits.find((x) => x.id === id) : null;
  ui.circuit = c ? JSON.parse(JSON.stringify(c)) : { id: null, nom: '', tours: 3, etapes: [] };
  ui.retourCircuit = ['accueil', 'hyrox', 'hyrox-libre'].includes(ui.ecran) ? ui.ecran : 'accueil';
  ui.modal = null;
  ui.ecran = 'circuit';
  window.scrollTo(0, 0);
}

/** Lance un circuit (enregistré ou en cours d'écriture). */
export function lancerCircuit(c, plan = null) {
  if (!circuitValide(c)) { toast('Ajoute au moins une étape'); return; }
  lancerSeanceHyrox({ id: `circuit:${c.id || 'libre'}`, nom: c.nom || 'Circuit libre', blocs: blocsCircuit(c), plan });
}

/** Détail d'une étape : charge, allure… (vide pour un repos). */
function detailEtape(et) {
  if (et.type === 'repos') return 'passe tout seul à la suite';
  const e = etapeCircuit(et);
  const charge = noteCharge(e, niveauCharges(d.hyroxProfil));
  return [charge, et.unite === 's' ? 'passe tout seul à la suite' : ''].filter(Boolean).join(' · ');
}

/** Écran de composition d'un circuit. */
export function ecranCircuit() {
  const c = ui.circuit;
  const lignes = c.etapes.map((et, i) => {
    const e = etapeCircuit(et);
    const detail = detailEtape(et);
    return `<div class="etape-circuit ${et.type === 'repos' ? 'repos' : ''}">
      <button class="corps" data-action="etape-modif" data-i="${i}" aria-label="Modifier : ${esc(e.texte)}">
        <span class="num">${i + 1}</span>
        <span class="mini-dessin">${illustration(e.dessin, e.texte, 40)}</span>
        <span class="txt"><span class="nom">${esc(e.texte)}</span>${detail ? `<span class="petit">${esc(detail)}</span>` : ''}</span>
      </button>
      <button class="btn-mini" data-action="etape-monter" data-i="${i}" aria-label="Monter l'étape ${i + 1}" ${i ? '' : 'disabled'}>${ICONES.monter}</button>
    </div>`;
  }).join('');
  const valide = circuitValide(c);
  return `<main class="ecran theme-hyrox">
    <div class="ligne">
      <button class="btn-icone" data-action="ecran" data-id="${ui.retourCircuit || 'accueil'}" aria-label="Retour">${ICONES.retour}</button>
      <div class="pile u-flex-1 u-ecart-2"><div class="sur-titre">Circuit libre</div><h1 class="u-t-26">${esc(c.nom || 'Nouveau circuit')}</h1></div>
    </div>
    <div class="carte ligne">
      <span class="pile u-ecart-2 u-flex-1"><span class="u-gras-600">Nombre de tours</span><span class="petit">${valide ? `≈ ${dureeCircuit(c)} min au total` : 'Le circuit entier, répété'}</span></span>
      <div class="stepper"><button data-action="circuit-tours" data-d="-1" aria-label="Un tour de moins">−</button><div class="val">${c.tours}</div><button data-action="circuit-tours" data-d="1" aria-label="Un tour de plus">+</button></div>
    </div>
    <div class="sur-titre">Étapes d'un tour</div>
    ${c.etapes.length ? `<div class="pile u-ecart-8">${lignes}</div>` : '<div class="carte petit u-t-15">Ajoute tes étapes dans l\'ordre : course, SkiErg, wall balls, un exercice de muscu, un repos…</div>'}
    <button class="btn-ajout u-cbord-accent" data-action="etape-ajout">+ Ajouter une étape</button>
    <div class="petit">Touche une étape pour la modifier ou la supprimer. Les étapes en durée et les repos passent tout seuls à la suivante ; les autres se valident d'un geste.</div>
    ${c.id ? '<button class="btn-lien btn-danger" data-action="circuit-suppr">Supprimer ce circuit</button>' : ''}
    <div class="pousse"></div>
    <div class="barre-action">
      <div class="ligne u-ecart-10">
        <button class="btn-secondaire u-l-auto u-pad-0-16 u-h-60" data-action="circuit-enregistrer" ${valide ? '' : 'disabled'}>${c.id ? 'Mettre à jour' : 'Enregistrer'}</button>
        <button class="btn-principal" data-action="circuit-go" ${valide ? '' : 'disabled'}>Démarrer</button>
      </div>
    </div>
  </main>`;
}

// ---------- Fenêtre d'une étape ----------

const NOMS_UNITE = { m: 'Distance', reps: 'Répétitions', s: 'Durée' };
const dist = (m) => (m >= 1000 ? `${nb(m / 1000)} km` : `${m} m`);
/** Valeur lisible selon l'unité. */
const valeurTexte = (et) => (et.unite === 'm' ? dist(et.valeur) : et.unite === 's' ? dureeTexte(et.valeur) : `${et.valeur} reps`);
/** Pas de la charge, en kg. */
const pasCharge = (type) => ({ sledPush: 10, sledPull: 10, farmers: 2, fentes: 5, wallBalls: 1 }[type] || 2.5);

/** Liste des exercices de muscu (fenêtre d'étape, type « Exercice de muscu »), filtrée par la recherche. */
export function listeExosEtape(m) {
  const items = EXERCICES.filter((e) => !d.exclus.includes(e.id) && correspond(e, m.q || '')).slice(0, 40);
  if (!items.length) return '<div class="carte petit">Aucun exercice ne correspond.</div>';
  return items.map((e) => `<button class="choix ${m.e?.exo === e.id ? 'selection' : ''}" data-action="etape-exo" data-id="${e.id}" style="min-height:54px">
    <span class="mini-dessin">${illustration(e.dessin, e.nom, 40)}</span><span><span class="nom u-t-15">${esc(e.nom)}</span><span class="petit">${esc(e.muscles)}</span></span></button>`).join('');
}

/** Contenu de la fenêtre d'une étape : choix du type, puis réglages. */
export function fenetreEtape(m) {
  if (!m.e) {
    const tuiles = STATIONS.map((st) => `<button class="tuile-station" data-action="etape-type" data-t="${st.id}">
      <span class="mini-dessin">${illustration(st.dessin, st.nom, 40)}</span><span>${esc(st.nom)}</span></button>`).join('');
    return `<h2>${m.i >= 0 ? 'Changer l\'étape' : 'Ajouter une étape'}</h2>
      <div class="grille-stations">${tuiles}</div>
      <button class="btn-secondaire" data-action="fermer">Annuler</button>`;
  }
  const et = m.e;
  const st = station(et.type);
  if (et.type === 'muscu' && !et.exo) {
    return `<h2>Quel exercice&nbsp;?</h2>
      <label class="recherche">${ICONES.loupe}<input id="recherche-feuille" type="search" placeholder="Rechercher un exercice" aria-label="Rechercher un exercice" value="${esc(m.q || '')}" autocomplete="off"></label>
      <div class="pile u-ecart-8" id="liste-feuille">${listeExosEtape(m)}</div>
      <button class="btn-secondaire" data-action="etape-retype">Changer de type</button>`;
  }
  const unites = st.unites.length > 1 ? `<div class="segment" style="grid-template-columns:repeat(${st.unites.length},minmax(0,1fr))">${st.unites.map((u) => `<button class="${et.unite === u ? 'on' : ''}" data-action="etape-unite" data-u="${u}">${NOMS_UNITE[u]}</button>`).join('')}</div>` : '';
  const avecCharge = st.chargeCle || et.type === 'muscu' || et.type === 'libre';
  const chargeCompet = st.chargeCle && et.charge == null;
  const chargeVal = et.charge == null ? (chargeCompet ? 'Compét.' : '—') : `${nb(et.charge)} kg`;
  const chargeSous = chargeCompet ? noteCharge(etapeCircuit(et), niveauCharges(d.hyroxProfil)) || 'charge de compétition'
    : et.charge == null ? 'Sans charge' : 'Charge choisie';
  const nomDe = et.type === 'muscu' ? exo(et.exo)?.nom : st.nom;
  return `<div class="label petit">${esc(nomDe)}</div><h2>${esc(texteEtapeCircuit(et))}</h2>
    ${et.type === 'libre' ? `<label class="pile u-ecart-6"><span class="petit">Nom de l'étape</span><input id="etape-nom" class="champ" maxlength="40" value="${esc(et.nom || '')}" placeholder="Ex. Corde à sauter"></label>` : ''}
    ${unites}
    <div class="carte ligne">
      <span class="u-flex-1 u-gras-600">${NOMS_UNITE[et.unite]}</span>
      <div class="stepper"><button data-action="etape-val" data-d="-1" aria-label="Moins">−</button><div class="val val-large">${valeurTexte(et)}</div><button data-action="etape-val" data-d="1" aria-label="Plus">+</button></div>
    </div>
    ${avecCharge ? `<div class="carte pile u-ecart-8">
      <div class="ligne"><span class="pile u-ecart-2 u-flex-1"><span class="u-gras-600">Charge</span><span class="petit">${esc(chargeSous)}</span></span>
        <div class="stepper"><button data-action="etape-charge" data-d="-1" aria-label="Moins lourd">−</button><div class="val">${chargeVal}</div><button data-action="etape-charge" data-d="1" aria-label="Plus lourd">+</button></div></div>
      ${st.chargeCle && et.charge != null ? '<button class="btn-lien u-hmin-0 u-pad-0" data-action="etape-compet">Revenir à la charge de compétition</button>' : ''}
    </div>` : ''}
    ${et.type === 'repos' || et.unite === 's' ? '<div class="petit">Compte à rebours : passe tout seul à l\'étape suivante.</div>' : '<div class="petit">Chrono : tu valides l\'étape quand elle est finie.</div>'}
    <button class="btn-principal" data-action="c-etape-ok">${m.i >= 0 ? 'Valider' : 'Ajouter au circuit'}</button>
    ${m.i >= 0 ? '<button class="btn-secondaire btn-danger" data-action="etape-suppr">Supprimer l\'étape</button>' : ''}
    <button class="btn-lien" data-action="etape-retype">Changer de type</button>`;
}

/** Lit le nom tapé d'une étape libre avant de redessiner. */
function lireNom() {
  const champ = document.getElementById('etape-nom');
  if (champ && ui.modal?.e) ui.modal.e.nom = champ.value.trim();
}

/** Actions des boutons de ce fichier (attribut data-action dans le HTML). */
export const actions = {
  'circuit-nouveau'() { ouvrirCircuit(null); },
  'circuit-tours'(el) { ui.circuit.tours = Math.max(1, Math.min(20, ui.circuit.tours + Number(el.dataset.d))); },
  'etape-ajout'() { ui.modal = { type: 'etape', i: -1, e: null }; },
  'etape-modif'(el) {
    const i = Number(el.dataset.i);
    ui.modal = { type: 'etape', i, e: { ...ui.circuit.etapes[i] } };
  },
  'etape-monter'(el) {
    const i = Number(el.dataset.i);
    const t = ui.circuit.etapes;
    if (i > 0) [t[i - 1], t[i]] = [t[i], t[i - 1]];
  },
  'etape-type'(el) {
    const st = station(el.dataset.t);
    const unite = st.unites[0];
    ui.modal.e = { type: st.id, unite, valeur: st.defaut[unite], charge: null };
    ui.modal.q = '';
    ui.modalGardeScroll = false;
  },
  'etape-retype'() { ui.modal.e = null; },
  'etape-exo'(el) { ui.modal.e.exo = el.dataset.id; },
  'etape-unite'(el) {
    lireNom();
    const e = ui.modal.e;
    e.unite = el.dataset.u;
    e.valeur = station(e.type).defaut[e.unite];
    ui.modalGardeScroll = true;
  },
  'etape-val'(el) {
    lireNom();
    const e = ui.modal.e;
    const sens = Number(el.dataset.d);
    // Le pas dépend de la valeur : on prend celui du côté où l'on va (pas de saut en descendant).
    const pas = pasValeur(e.unite, sens > 0 ? e.valeur : e.valeur - 1);
    e.valeur = Math.max(e.unite === 'reps' ? 1 : pas, Math.min(e.unite === 's' ? 3600 : e.unite === 'm' ? 42195 : 500, e.valeur + sens * pas));
    ui.modalGardeScroll = true;
  },
  'etape-charge'(el) {
    lireNom();
    const e = ui.modal.e;
    const pas = pasCharge(e.type);
    const sens = Number(el.dataset.d);
    if (e.charge == null) {
      // Départ : la charge de compétition du profil pour une station Hyrox, sinon zéro.
      const cle = station(e.type).chargeCle;
      const base = cle ? CHARGES[niveauCharges(d.hyroxProfil) || 1][cle] : null;
      e.charge = base != null ? Math.max(0, base + sens * pas) : (sens > 0 ? pas : 0);
    } else e.charge = Math.max(0, Math.round((e.charge + sens * pas) * 10) / 10);
    if (e.charge === 0 && !station(e.type).chargeCle) e.charge = null;
    ui.modalGardeScroll = true;
  },
  'etape-compet'() { lireNom(); ui.modal.e.charge = null; ui.modalGardeScroll = true; },
  'c-etape-ok'() {
    lireNom();
    const { i, e } = ui.modal;
    if (e.type === 'libre' && !e.nom) { toast('Donne un nom à l\'étape'); return false; }
    if (i >= 0) ui.circuit.etapes[i] = e;
    else ui.circuit.etapes.push(e);
    ui.modal = null;
  },
  'etape-suppr'() { ui.circuit.etapes.splice(ui.modal.i, 1); ui.modal = null; },
  'circuit-go'() { lancerCircuit(ui.circuit); return false; },
  'circuit-enregistrer'() { ui.modal = { type: 'enregistrer', quoi: 'circuit', nom: ui.circuit.nom || '' }; },
  'enregistrer-circuit-ok'() {
    const c = ui.circuit;
    c.nom = (document.getElementById('nom-seance')?.value || '').trim() || 'Mon circuit';
    if (c.id) {
      const i = d.circuits.findIndex((x) => x.id === c.id);
      d.circuits[i] = JSON.parse(JSON.stringify(c));
    } else {
      c.id = identifiant('c');
      d.circuits.push(JSON.parse(JSON.stringify(c)));
    }
    enregistrer();
    ui.modal = null;
    toast('Circuit enregistré dans « Mes séances »');
    return false;
  },
  'circuit-suppr'() { ui.modal = { type: 'suppr-circuit' }; },
  'circuit-suppr-ok'() {
    d.circuits = d.circuits.filter((x) => x.id !== ui.circuit.id);
    enregistrer();
    ui.modal = null;
    ui.ecran = ui.retourCircuit || 'accueil';
    toast('Circuit supprimé');
    return false;
  },
};
