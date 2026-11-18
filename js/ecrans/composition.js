// =====================================================================
// Écrans de composition
// ---------------------------------------------------------------------
//   - « Composer ta séance » : les exercices proposés pour Push / Pull / Jambes ;
//   - « Séance personnalisée » : choix libre dans tout le catalogue.
// =====================================================================

import { ICONES, cibleTexte, estHaltero, infoExo } from '../commun.js';
import { composer, dureeEstimee, prochaineSeance } from '../composition.js';
import { d, enregistrer, rendre, toast, ui } from '../etat.js';
import { illustration } from '../illustrations.js';
import { EXERCICES, FAMILLES, GROUPES, cibleFinale, correspond, exo, seance } from '../metier/donnees.js';
import { definirCompo } from '../metier/planning.js';
import { derniereDate } from '../metier/progression.js';
import { dateLongue, esc, identifiant, joursDepuis } from '../outils.js';
import { demarrer } from '../seance-muscu.js';

/**
 * Lance une séance de muscu enregistrée. Une séance composée à partir de Push / Pull / Jambes
 * (champ base) compte comme cette séance pour la rotation conseillée.
 * @param plan  identifiant de la séance prévue au planning, si elle est lancée depuis le planning
 */
export function demarrerPerso(s, plan = null) {
  if (!s) return;
  const items = s.exercices.filter((id) => exo(id)).map((id) => ({ exo: id, cible: s.cibles?.[id] || exo(id).cible }));
  demarrer(s.base || `perso:${s.id}`, s.nom, items, { plan, enregistree: s.id });
}

/** Écran « Composer ta séance ». */
export function ecranComposer() {
  const c = ui.compo;
  const s = seance(c.seance);
  const puce = (m, t) => `<button class="puce ${c.mode === m ? 'on' : ''}" data-action="mode" data-id="${m}" aria-pressed="${c.mode === m}">${t}</button>`;
  // Une tuile par exercice prévu : on voit toute la séance d'un coup.
  const items = c.cases.map((k, i) => {
    const def = exo(k.exo);
    const cible = cibleFinale(def, k.cible);
    return `<div class="tuile-compo">
      <button class="tuile" data-action="choix" data-i="${i}" aria-label="${esc(k.role)} : ${esc(def.nom)}, toucher pour changer">
        <span class="badge">${esc(k.role)}</span>
        <span class="dessin-tuile">${illustration(def.dessin, def.nom, 72)}</span>
        <span class="nom">${esc(def.nom)}</span>
        <span class="petit">${cibleTexte(cible, def)} · ${esc(infoExo(k.exo))}</span>
        ${k.raison ? `<span class="raison">${esc(k.raison)}</span>` : ''}
        ${d.alertes[def.id] ? '<span class="gene-tuile">Gêne signalée</span>' : ''}
      </button>
      <button class="btn-retirer" data-action="retirer" data-i="${i}" aria-label="Retirer ${esc(def.nom)}">${ICONES.croix}</button>
    </div>`;
  }).join('');
  const liste = c.cases.map((k) => ({ exo: k.exo, cible: cibleFinale(exo(k.exo), k.cible) }));
  const n = c.cases.length;
  const bas = c.avance
    ? `<button class="btn-principal" data-action="compo-avance-ok" ${n ? '' : 'disabled'}>Enregistrer pour ${esc(dateLongue(c.avance.date).split(' ').slice(0, 2).join(' '))}</button>`
    : `<div class="ligne u-ecart-10">
        <button class="btn-secondaire u-l-auto u-pad-0-16 u-h-60" data-action="enregistrer-compo" ${n ? '' : 'disabled'}>Enregistrer</button>
        <button class="btn-principal" data-action="go-compo" ${n ? '' : 'disabled'}>Démarrer · ${dureeEstimee(liste)} min</button>
      </div>`;
  return `<main class="ecran">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="seances" aria-label="Retour">${ICONES.retour}</button>
      <div class="pile u-flex-1 u-ecart-2"><div class="sur-titre">${c.avance ? 'Prévoir les exercices' : 'Composer ta séance'}</div><h1 class="u-t-26">${esc(s.nom)}</h1></div>
    </div>
    <div class="puces">${c.mode === 'prevue' ? puce('prevue', 'Prévue à l\'avance') : ''}${puce('suggestion', 'Suggestion')}${puce('derniere', 'Comme la dernière fois')}${puce('courte', 'Courte')}</div>
    <div class="petit">${c.avance ? 'Choisis tes exercices maintenant : le poids conseillé sera calculé le jour de la séance.' : 'Touche une tuile pour changer l\'exercice. Tu pourras revenir à cette vue pendant la séance.'}</div>
    <div class="tuiles">
      ${items}
      <button class="tuile ajout" data-action="choix" data-i="-1"><span class="carre-plus">${ICONES.plus}</span><span class="nom">Ajouter un exercice</span></button>
    </div>
    <div class="pousse"></div>
    <div class="barre-action">${bas}</div>
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

/** Ligne à cocher d'un exercice. */
function lignePerso(id) {
  const def = exo(id);
  const pos = ui.perso.sel.indexOf(id);
  const on = pos >= 0;
  return `<button class="ligne-coche ${on ? 'on' : ''} ${estHaltero(def) ? 'h' : ''}" data-action="cocher" data-id="${id}" aria-pressed="${on}">
    <span class="coche">${on ? '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l3 3 5-6"></path></svg>' : ''}</span>
    <span class="mini-dessin">${illustration(def.dessin, def.nom, 40)}</span>
    <span class="txt"><span class="nom">${esc(def.nom)}</span><span class="petit">${esc(def.muscles)} · ${esc(infoExo(id))}</span></span>
    ${on ? `<span class="ordre">${pos + 1}</span>` : ''}
  </button>`;
}

/** Liste filtrée par la recherche et le groupe choisi. */
function listePerso() {
  const p = ui.perso;
  const q = (p.q || '').trim();
  const garde = (e) => !d.exclus.includes(e.id) && (p.filtre === 'tous' || e.famille === p.filtre) && correspond(e, q);
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

/** Écran « Séance personnalisée ». */
export function ecranPerso() {
  const p = ui.perso;
  const filtres = FAMILLES.map(([id, t]) => `<button class="puce ${p.filtre === id ? 'on' : ''} ${id === 'haltero' ? 'h' : ''}" data-action="filtre" data-id="${id}" aria-pressed="${p.filtre === id}">${t}</button>`).join('');
  const n = p.sel.length;
  return `<main class="ecran">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="seances" aria-label="Retour">${ICONES.retour}</button>
      <h1 class="u-flex-1 u-t-24">${esc(p.nom || 'Séance personnalisée')}</h1>
    </div>
    <label class="recherche">${ICONES.loupe}<input id="recherche" type="search" placeholder="Rechercher un exercice" aria-label="Rechercher un exercice" value="${esc(p.q)}" autocomplete="off"></label>
    <div class="puces defile">${filtres}</div>
    <div class="petit">Coche les exercices dans l'ordre où tu veux les faire.</div>
    <div class="pile u-ecart-8" id="perso-liste">${listePerso()}</div>
    <div class="barre-action">
      <div class="ligne u-ecart-10">
        <button class="btn-secondaire u-l-auto u-pad-0-16 u-h-60" data-action="enregistrer" ${n ? '' : 'disabled'}>${p.id ? 'Mettre à jour' : 'Enregistrer'}</button>
        <button class="btn-principal" data-action="go-perso" ${n ? '' : 'disabled'}>Démarrer · ${n} exercice${n > 1 ? 's' : ''}</button>
      </div>
      ${p.id ? '<button class="btn-lien btn-danger u-l-100" data-action="suppr-perso">Supprimer cette séance enregistrée</button>' : ''}
    </div>
  </main>`;
}

// Mise à jour de la liste de la séance personnalisée sans tout redessiner (garde le clavier ouvert).
export function majPerso() {
  const liste = document.getElementById('perso-liste');
  if (!liste) { rendre(); return; }
  liste.innerHTML = listePerso();
  const n = ui.perso.sel.length;
  const go = document.querySelector('[data-action="go-perso"]');
  const save = document.querySelector('[data-action="enregistrer"]');
  if (go) { go.disabled = !n; go.textContent = `Démarrer · ${n} exercice${n > 1 ? 's' : ''}`; }
  if (save) save.disabled = !n;
}

/** Actions des boutons de ce fichier (attribut data-action dans le HTML). */
export const actions = {
  composer(el) { composer(el.dataset.id); ui.modal = null; ui.ecran = 'composer'; window.scrollTo(0, 0); },
  mode(el) {
    if (el.dataset.id === 'prevue') return false;
    // Garde le lien avec le planning (séance prévue, ou exercices choisis à l'avance).
    const { plan, avance } = ui.compo;
    composer(ui.compo.seance, el.dataset.id);
    Object.assign(ui.compo, { plan, avance });
  },
  choix(el) { ui.modal = { type: 'choix', i: Number(el.dataset.i), q: '' }; },
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
    demarrer(s.id, s.nom, ui.compo.cases.map((k) => ({ exo: k.exo, cible: k.cible })), { plan: ui.compo.plan });
    return false;
  },
  // Exercices choisis à l'avance pour une séance du planning.
  'compo-avance-ok'() {
    const { date, id } = ui.compo.avance;
    definirCompo(d, date, id, ui.compo.cases.map((k) => ({ exo: k.exo, cible: k.cible, role: k.role })));
    enregistrer();
    ui.compo = null;
    ui.ecran = 'accueil';
    ui.modal = { type: 'jour', date };
    toast('Exercices enregistrés pour ce jour-là');
    return false;
  },
  // Enregistre la séance composée (Push, Pull, Jambes) pour la refaire plus tard.
  'enregistrer-compo'() { ui.modal = { type: 'enregistrer', quoi: 'compo', nom: `${seance(ui.compo.seance).nom} perso` }; },
  'enregistrer-compo-ok'() {
    const c = ui.compo;
    const nom = (document.getElementById('nom-seance')?.value || '').trim() || `${seance(c.seance).nom} perso`;
    d.seancesPerso.push({
      id: identifiant('p'), nom, base: c.seance,
      exercices: c.cases.map((k) => k.exo),
      cibles: Object.fromEntries(c.cases.map((k) => [k.exo, cibleFinale(exo(k.exo), k.cible)])),
    });
    enregistrer();
    ui.modal = null;
    toast('Séance enregistrée dans « Mes séances »');
    return false;
  },
  perso(el) {
    const s = el.dataset.id ? d.seancesPerso.find((x) => x.id === el.dataset.id) : null;
    ui.perso = { sel: s ? s.exercices.filter((id) => exo(id)) : [], filtre: 'tous', q: '', id: s?.id || null, nom: s?.nom || '' };
    ui.modal = null;
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
    const s = p.id ? d.seancesPerso.find((x) => x.id === p.id) : null;
    const items = p.sel.map((id) => ({ exo: id, cible: s?.cibles?.[id] || exo(id).cible }));
    demarrer(s?.base || (p.id ? `perso:${p.id}` : 'perso'), p.nom || 'Séance personnalisée', items, { enregistree: p.id });
    return false;
  },
  enregistrer() { ui.modal = { type: 'enregistrer', quoi: 'perso', nom: ui.perso.nom || '' }; },
  'enregistrer-ok'() {
    const nom = (document.getElementById('nom-seance')?.value || '').trim() || 'Ma séance';
    const p = ui.perso;
    if (p.id) {
      const s = d.seancesPerso.find((x) => x.id === p.id);
      Object.assign(s, { nom, exercices: [...p.sel] });
    } else {
      p.id = identifiant('p');
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
};
