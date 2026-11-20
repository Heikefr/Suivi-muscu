// =====================================================================
// Fenêtres qui s'ouvrent par-dessus l'écran (feuilles du bas)
// ---------------------------------------------------------------------
// Une seule fonction, modalHtml(), qui dessine la fenêtre décrite par ui.modal.
// ui.modal.type dit laquelle : choix d'exercice, options de charge, record,
// confirmation, détail d'une séance, plan Hyrox…
// =====================================================================

import { ICONES, estHaltero, infoExo, nomExo } from './commun.js';
import { CATEGORIES_RECUP, categorieRecup, dureeRecup, recupCategorie } from './metier/conseils.js';
import { fenetreEtape, listeExosEtape } from './ecrans/circuit.js';
import { nomItem } from './ecrans/hyrox.js';
import { fenetreDecaler, fenetreJour, fenetreMesSeances, fenetrePlanifier } from './ecrans/planning.js';
import { ZONES, fenetreChangerExo, resumeSeries } from './ecrans/seance.js';
import { d, ui } from './etat.js';
import { illustration } from './illustrations.js';
import { EXERCICES, GROUPES, correspond, exo, seance } from './metier/donnees.js';
import { genererPlan } from './metier/hyrox.js';
import { aujourdhui, dateCourte, dateLongue, esc, mmss, nb } from './outils.js';
import { chargeSerie, exoCourant } from './seance-muscu.js';

/** Ligne d'un exercice dans la fenêtre de choix. */
function ligneChoix(id, actuel, indexCase) {
  const def = exo(id);
  return `<button class="choix ${id === actuel ? 'selection' : ''}" data-action="choisir" data-id="${id}" data-i="${indexCase}" style="min-height:58px">
    <span class="mini-dessin">${illustration(def.dessin, def.nom, 40)}</span>
    <span><span class="nom u-t-15">${esc(def.nom)}</span><span class="petit">${esc(infoExo(id))}</span></span>
    ${id === actuel ? ICONES.coche : ''}
  </button>`;
}

/** Exercices du catalogue regroupés par groupe musculaire, dans l'ordre donné. */
function parGroupe(ordre, garde, ligne) {
  return ordre.map((g) => {
    const items = EXERCICES.filter((e) => e.groupe === g && garde(e));
    return items.length ? `<div class="groupe-titre ${g === 'Haltérophilie' ? 'h' : ''}">${esc(g)}</div>${items.map(ligne).join('')}` : '';
  }).join('') || '<div class="carte petit">Aucun exercice ne correspond.</div>';
}

/** Groupes musculaires, ceux des familles données d'abord. */
function groupesDabord(familles) {
  return [...GROUPES].sort((a, b) => {
    const fa = EXERCICES.some((e) => e.groupe === a && familles.has(e.famille)) ? 0 : 1;
    const fb = EXERCICES.some((e) => e.groupe === b && familles.has(e.famille)) ? 0 : 1;
    return fa - fb;
  });
}

/** Champ de recherche d'une fenêtre (la liste en dessous se met à jour sans fermer le clavier). */
function champRecherche(m) {
  return `<label class="recherche">${ICONES.loupe}<input id="recherche-feuille" type="search" placeholder="Rechercher un exercice" aria-label="Rechercher un exercice" value="${esc(m.q || '')}" autocomplete="off"></label>`;
}

/**
 * La liste filtrable d'une fenêtre (choix d'exercice, ajout pendant la séance, étape de circuit).
 * Appelée aussi à chaque lettre tapée dans la recherche (voir app.js).
 */
export function listeFeuille(m) {
  const q = (m.q || '').trim();
  if (m.type === 'etape') return listeExosEtape(m);
  if (m.type === 'ajout-seance') {
    const dans = d.enCours.exercices.map((x) => x.exo);
    const familles = new Set(dans.map((id) => exo(id)?.famille));
    return parGroupe(groupesDabord(familles), (e) => !d.exclus.includes(e.id) && !dans.includes(e.id) && correspond(e, q),
      (e) => `<button class="choix" data-action="ajouter-seance" data-id="${e.id}" style="min-height:52px">
        <span class="mini-dessin">${illustration(e.dessin, e.nom, 40)}</span><span><span class="nom u-t-15">${esc(e.nom)}</span><span class="petit">${esc(e.muscles)}</span></span></button>`);
  }
  // Choix d'exercice dans « Composer ta séance » (m.i = case à changer, -1 = ajout).
  const c = ui.compo;
  const dejaLa = c.cases.map((k) => k.exo);
  const actuel = m.i >= 0 ? c.cases[m.i].exo : null;
  const libre = (e) => !d.exclus.includes(e.id) && (e.id === actuel || !dejaLa.includes(e.id));
  if (q) return parGroupe(GROUPES, (e) => libre(e) && correspond(e, q), (e) => ligneChoix(e.id, actuel, m.i));
  if (m.i >= 0) {
    const cas = c.cases[m.i];
    const def = exo(cas.exo);
    const sug = cas.options.filter((o) => !d.exclus.includes(o) && (o === cas.exo || !dejaLa.includes(o)));
    const autres = EXERCICES.filter((e) => e.groupe === def.groupe && !sug.includes(e.id) && libre(e));
    return `${sug.length ? `<div class="sur-titre">Suggérés</div>${sug.map((id) => ligneChoix(id, cas.exo, m.i)).join('')}` : ''}
      ${autres.length ? `<div class="sur-titre">Tous les exercices ${esc(def.groupe.toLowerCase())}</div>${autres.map((e) => ligneChoix(e.id, cas.exo, m.i)).join('')}` : ''}
      <div class="petit">Un autre muscle ? Utilise la recherche.</div>`;
  }
  return parGroupe(groupesDabord(new Set([seance(c.seance)?.id])), libre, (e) => ligneChoix(e.id, null, -1));
}

/** Réglage du temps de récup propre à un exercice (fenêtre Options). */
function blocRecupExo(def) {
  const perso = d.recupExo[def.id] != null;
  const cat = CATEGORIES_RECUP.find((c) => c.id === categorieRecup(def));
  return `<div class="carte pile">
    <div class="ligne"><div class="u-flex-1 u-gras-600">Récup après chaque série</div>
      <div class="stepper"><button data-action="recup-exo" data-d="-1" aria-label="Récup plus courte">−</button><div class="val">${mmss(dureeRecup(def, d))}</div><button data-action="recup-exo" data-d="1" aria-label="Récup plus longue">+</button></div>
    </div>
    <div class="petit">${perso ? `Réglage propre à cet exercice. Règle « ${esc(cat.nom.toLowerCase())} » : ${mmss(recupCategorie(cat.id, d.recupCat))}.` : `Règle « ${esc(cat.nom.toLowerCase())} ». Modifiable pour toutes les catégories dans les Réglages.`}</div>
    ${perso ? '<button class="btn-lien" data-action="recup-exo-regle">Revenir à la règle</button>' : ''}
  </div>`;
}

/** HTML de la fenêtre ouverte (chaîne vide s'il n'y en a pas). */
export function modalHtml() {
  const m = ui.modal;
  if (!m) return '';
  let contenu = '';
  if (m.type === 'choix') {
    const cas = m.i >= 0 ? ui.compo.cases[m.i] : null;
    contenu = `${cas ? `<div class="label petit">${esc(cas.role || exo(cas.exo).groupe)}</div><h2>Choisis l'exercice</h2>` : '<h2>Ajouter un exercice</h2>'}
      ${champRecherche(m)}
      <div class="pile u-ecart-8" id="liste-feuille">${listeFeuille(m)}</div>
      <button class="btn-principal" data-action="fermer">Fermer</button>`;
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
          <div class="ligne"><div class="u-flex-1 u-gras-600">Poids de cette série</div>
            <div class="stepper"><button data-action="charge" data-d="-1" aria-label="Moins lourd">−</button><button class="val val-saisie" data-action="saisie" data-quoi="charge" aria-label="Taper le poids">${charge == null ? '—' : nb(charge) + ' kg'}</button><button data-action="charge" data-d="1" aria-label="Plus lourd">+</button></div>
          </div>
          <div class="petit">Par pas de 1 kg, ou touche le poids pour le taper. Ne change que la série en cours.</div>
        </div>
        <div class="carte pile">
          <div class="ligne"><div class="u-flex-1 u-gras-600">Record (1 rep)</div>
            <div class="stepper"><button data-action="record-pas" data-id="${def.id}" data-d="-1" aria-label="Record moins">−</button><button class="val val-saisie" data-action="saisie" data-quoi="record" data-id="${def.id}" aria-label="Taper le record">${record ? nb(record) + ' kg' : '—'}</button><button data-action="record-pas" data-id="${def.id}" data-d="1" aria-label="Record plus">+</button></div>
          </div>
          <div class="petit">Recalcule les séries restantes en % du record.</div>
          ${record ? `<button class="btn-lien" data-action="record-inconnu" data-id="${def.id}">Je ne connais pas mon record</button>` : ''}
        </div>
        ${fait === 0 && alts.length ? `<div class="sur-titre">Remplacer par</div>${alts.map((a) => `<button class="choix" data-action="remplacer" data-id="${a.id}" style="min-height:52px"><span><span class="nom u-t-15">${esc(a.nom)}</span><span class="petit">${esc(infoExo(a.id))}</span></span></button>`).join('')}` : ''}
        ${blocRecupExo(def)}
        <button class="btn-secondaire" data-action="passer-exo">Passer cet exercice</button>
        <button class="btn-principal" data-action="fermer">OK</button>`;
    } else {
      contenu = `<h2>${esc(def.nom)}</h2>
        ${def.poidsDuCorps ? '' : `<div class="carte pile">
          <div class="ligne"><div class="u-flex-1 u-gras-600">Poids${def.materiel === 'halteres' ? ' par haltère' : ''}</div>
            <div class="stepper"><button data-action="charge" data-d="-1" aria-label="Moins lourd">−</button><button class="val val-saisie" data-action="saisie" data-quoi="charge" aria-label="Taper le poids">${e.charge == null ? '—' : nb(e.charge) + ' kg'}</button><button data-action="charge" data-d="1" aria-label="Plus lourd">+</button></div>
          </div>
          <div class="petit">Par pas de ${nb(def.increment)} kg, ou touche le poids pour le taper${e.conseillee != null ? ` · conseillé ${nb(e.conseillee)} kg` : ''}. Vaut pour la suite de cet exercice.</div>
        </div>`}
        ${fait === 0 && alts.length ? `<div class="sur-titre">Remplacer par</div>${alts.map((a) => `<button class="choix" data-action="remplacer" data-id="${a.id}" style="min-height:52px"><span class="mini-dessin">${illustration(a.dessin, a.nom, 40)}</span><span><span class="nom u-t-15">${esc(a.nom)}</span><span class="petit">${esc(infoExo(a.id))}</span></span></button>`).join('')}` : ''}
        ${blocRecupExo(def)}
        <button class="btn-secondaire" data-action="passer-exo">Passer cet exercice</button>
        <button class="btn-principal" data-action="fermer">OK</button>`;
    }
  } else if (m.type === 'ajout-seance') {
    // Ajout d'un exercice pendant la séance : la famille de la séance d'abord.
    contenu = `<h2>Ajouter un exercice</h2>
      ${champRecherche(m)}
      <div class="pile u-ecart-8" id="liste-feuille">${listeFeuille(m)}</div>
      <button class="btn-principal" data-action="fermer">Fermer</button>`;
  } else if (m.type === 'gene') {
    const a = d.alertes[m.exo];
    contenu = `<h2>Douleur ou gêne</h2>
      <div class="petit">${esc(nomExo(m.exo))} · tu seras prévenu la prochaine fois que tu feras cet exercice.</div>
      <div class="sur-titre">Où&nbsp;?</div>
      <div class="puces">${ZONES.map(([z, t]) => `<button class="puce ${m.zone === z ? 'on' : ''}" data-action="gene-zone" data-z="${z}" aria-pressed="${m.zone === z}">${t}</button>`).join('')}</div>
      <label class="pile u-ecart-6"><span class="petit">Ce que tu as ressenti (facultatif)</span>
        <textarea id="gene-note" class="champ zone-texte" maxlength="140" rows="3" placeholder="Ex. pincement en haut du mouvement">${esc(a?.date === aujourdhui() ? a.note : '')}</textarea>
      </label>
      <div class="petit">Si une douleur revient ou persiste, parles-en à un professionnel de santé.</div>
      <button class="btn-principal" data-action="gene-ok">Enregistrer</button>
      ${a ? '<button class="btn-secondaire btn-danger" data-action="gene-effacer">Effacer l\'alerte</button>' : ''}
      <button class="btn-secondaire" data-action="fermer">Annuler</button>`;
  } else if (m.type === 'record') {
    const def = exo(m.id);
    const r = d.records[def.id];
    contenu = `<h2>Record · ${esc(def.nom)}</h2>
      <div class="carte ligne"><div class="u-flex-1 u-gras-600">1 rep max</div>
        <div class="stepper"><button data-action="record-pas" data-id="${def.id}" data-d="-1" aria-label="Moins">−</button><button class="val val-saisie" data-action="saisie" data-quoi="record" data-id="${def.id}" aria-label="Taper le record">${r ? nb(r) + ' kg' : '—'}</button><button data-action="record-pas" data-id="${def.id}" data-d="1" aria-label="Plus">+</button></div>
      </div>
      <div class="ligne u-ecart-8">${[-10, -5, 5, 10].map((x) => `<button class="btn-secondaire" data-action="record-pas" data-id="${def.id}" data-d="${x}">${x > 0 ? '+' : '−'}${Math.abs(x)}</button>`).join('')}</div>
      ${r ? `<button class="btn-lien" data-action="record-inconnu" data-id="${def.id}">Je ne connais pas mon record</button>` : ''}
      <button class="btn-principal" data-action="fermer">OK</button>`;
  } else if (m.type === 'note') {
    contenu = `<h2>Mes réglages</h2>
      <div class="petit">${esc(nomExo(m.exo))}</div>
      <label class="pile u-ecart-6"><span class="petit">Hauteur du siège, cran, prise… tout ce que tu veux retrouver la prochaine fois.</span>
        <textarea id="note-texte" class="champ zone-texte" maxlength="140" rows="3" placeholder="Ex. siège cran 4, prise large">${esc(d.notes[m.exo] || '')}</textarea>
      </label>
      <button class="btn-principal" data-action="note-ok">Enregistrer</button>
      <button class="btn-secondaire" data-action="fermer">Annuler</button>`;
  } else if (m.type === 'enregistrer') {
    // quoi : 'perso' (séance personnalisée), 'compo' (Push / Pull / Jambes composée), 'circuit' (Hyrox).
    const circuit = m.quoi === 'circuit';
    const action = { perso: 'enregistrer-ok', compo: 'enregistrer-compo-ok', circuit: 'enregistrer-circuit-ok' }[m.quoi];
    contenu = `<h2>${circuit ? 'Enregistrer le circuit' : 'Enregistrer la séance'}</h2>
      <label class="pile u-ecart-6"><span class="petit">Nom</span>
        <input id="nom-seance" class="champ" maxlength="40" value="${esc(m.nom || '')}" placeholder="${circuit ? 'Ex. Stations ×4' : 'Ex. Haut du corps express'}">
      </label>
      <div class="petit">Tu la retrouveras dans « Mes séances » sur l'accueil, et tu pourras la planifier.</div>
      <button class="btn-principal" data-action="${action}">Enregistrer</button>
      <button class="btn-secondaire" data-action="fermer">Annuler</button>`;
  } else if (m.type === 'suppr-circuit') {
    contenu = `<h2>Supprimer « ${esc(ui.circuit.nom)} » ?</h2>
      <div class="petit">Seul le circuit enregistré est supprimé, pas ton historique.</div>
      <button class="btn-secondaire btn-danger" data-action="circuit-suppr-ok">Oui, supprimer</button>
      <button class="btn-principal" data-action="fermer">Annuler</button>`;
  } else if (m.type === 'fin-anticipee') {
    const ec = d.enCours;
    const series = ec.exercices.reduce((t, e) => t + e.series.length, 0);
    const faits = ec.exercices.filter((e) => e.series.length).length;
    const restants = ec.exercices.filter((e) => e.series.length < e.cible.series).length;
    contenu = series ? `<h2>Terminer la séance&nbsp;?</h2>
      <div class="u-t-15">${faits} exercice${faits > 1 ? 's' : ''} commencé${faits > 1 ? 's' : ''} · ${series} série${series > 1 ? 's' : ''} validée${series > 1 ? 's' : ''}.</div>
      <div class="petit">${restants ? 'Ce qui n\'est pas fait n\'est pas enregistré et ne compte pas dans ta progression.' : 'Tout est fait.'}</div>
      <button class="btn-principal" data-action="terminer">Terminer et enregistrer</button>
      <button class="btn-secondaire" data-action="fermer">Continuer la séance</button>`
    : `<h2>Aucune série validée</h2>
      <div class="petit">Il n'y a rien à enregistrer pour l'instant.</div>
      <button class="btn-secondaire btn-danger" data-action="abandonner">Arrêter sans enregistrer</button>
      <button class="btn-principal" data-action="fermer">Continuer la séance</button>`;
  } else if (m.type === 'fin-h') {
    const faites = d.enCoursHyrox.splits.filter((x) => !x.repos && !x.passe).length;
    contenu = faites ? `<h2>Terminer la séance&nbsp;?</h2>
      <div class="u-t-15">${faites} étape${faites > 1 ? 's' : ''} faite${faites > 1 ? 's' : ''}. Le reste n'est pas enregistré.</div>
      <button class="btn-principal" data-action="terminer-h">Terminer et enregistrer</button>
      <button class="btn-secondaire" data-action="fermer">Continuer la séance</button>`
    : `<h2>Aucune étape faite</h2>
      <div class="petit">Il n'y a rien à enregistrer pour l'instant.</div>
      <button class="btn-secondaire btn-danger" data-action="abandonner-h">Arrêter sans enregistrer</button>
      <button class="btn-principal" data-action="fermer">Continuer la séance</button>`;
  } else if (m.type === 'saisie') {
    // Nombre tapé au clavier : la virgule est acceptée (disques de 1,25 kg).
    const titre = m.quoi === 'record' ? 'Record (1 rep)' : 'Charge';
    contenu = `<div class="label petit">${esc(m.sous)}</div><h2>${titre}</h2>
      <label class="saisie-nombre">
        <input id="saisie-valeur" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" value="${m.valeur == null ? '' : nb(m.valeur)}" placeholder="0" aria-label="${titre} en kilos">
        <span>kg</span>
      </label>
      <div class="petit">Virgule acceptée : 1,25 · 21,25 · 102,5…${m.quoi === 'etape' ? ' Laisse vide pour la charge de compétition.' : ''}</div>
      <div class="grille2">
        <button class="btn-secondaire" data-action="saisie-annuler">Annuler</button>
        <button class="btn-principal" data-action="saisie-ok">OK</button>
      </div>`;
  } else if (m.type === 'changer-exo') {
    contenu = fenetreChangerExo();
  } else if (m.type === 'jour') {
    contenu = fenetreJour(m);
  } else if (m.type === 'planifier') {
    contenu = fenetrePlanifier(m);
  } else if (m.type === 'decaler') {
    contenu = fenetreDecaler(m);
  } else if (m.type === 'mes-seances') {
    contenu = fenetreMesSeances(m);
  } else if (m.type === 'etape') {
    contenu = fenetreEtape(m);
  } else if (m.type === 'suppr-perso') {
    contenu = `<h2>Supprimer « ${esc(ui.perso.nom)} » ?</h2>
      <div class="petit">Seule la séance enregistrée est supprimée, pas ton historique.</div>
      <button class="btn-secondaire btn-danger" data-action="suppr-perso-ok">Oui, supprimer</button>
      <button class="btn-principal" data-action="fermer">Annuler</button>`;
  } else if (m.type === 'quitter-h') {
    contenu = `
      <h2>Quitter la séance&nbsp;?</h2>
      <button class="btn-secondaire" data-action="pause-h">Revenir plus tard (garder en cours)</button>
      ${d.enCoursHyrox.splits.length ? '<button class="btn-secondaire" data-action="terminer-h">Terminer et enregistrer</button>' : ''}
      <button class="btn-secondaire btn-danger" data-action="abandonner-h">Abandonner sans enregistrer</button>
      <button class="btn-principal" data-action="fermer">Continuer la séance</button>`;
  } else if (m.type === 'plan') {
    const plan = genererPlan(d.hyroxProfil, aujourdhui());
    contenu = `<h2>Tout le plan</h2>
      ${plan.map((w) => `<div class="carte pile u-ecart-6">
        <div class="ligne"><div class="u-flex-1 u-gras-600">Semaine ${w.index + 1} · du ${dateCourte(w.debut)} au ${dateCourte(w.fin)}</div><div class="label u-c-accent u-t-11">${w.phase}</div></div>
        <div class="petit">${w.items.map(nomItem).join(' · ')}</div>
      </div>`).join('')}
      <button class="btn-principal" data-action="fermer">Fermer</button>`;
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
      <div class="petit">${dateLongue(s.date)}${s.importee ? ' · importée' : ''}${s.hyrox ? ` · ${mmss(s.hyrox.total)}${s.hyrox.ressenti ? ` · ${s.hyrox.ressenti}` : ''}` : ''}</div>
      ${s.hyrox ? `<div class="carte liste-perf">${s.hyrox.splits.filter((x) => !x.repos).map((x) => `<div><span>${esc(x.texte)}</span><span class="petit u-t-14">${x.passe ? 'passé' : mmss(x.duree)}</span></div>`).join('')}</div>` : ''}
      ${s.exercices.map((e) => `<div class="carte"><div class="u-gras-600">${esc(nomExo(e.exo, e.nom))}</div><div class="petit">${resumeSeries(e.series, exo(e.exo))}</div></div>`).join('')}
      ${m.confirmer ? `<div class="petit">Supprimer définitivement cette séance&nbsp;?</div>
        <button class="btn-secondaire btn-danger" data-action="supprimer-seance" data-id="${esc(s.id)}">Oui, supprimer</button>`
    : '<button class="btn-secondaire btn-danger" data-action="confirmer-suppr">Supprimer cette séance</button>'}
      ${m.jour ? `<button class="btn-secondaire" data-action="retour-jour" data-date="${m.jour}">Voir toute la journée</button>` : ''}
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
      <div class="u-t-15">${m.ajoutees} séance${m.ajoutees > 1 ? 's' : ''} ajoutée${m.ajoutees > 1 ? 's' : ''}${m.maj ? `, ${m.maj} mise${m.maj > 1 ? 's' : ''} à jour` : ''}.</div>
      ${m.inconnus?.length ? `<div class="petit">Gardés dans l'historique mais absents du catalogue : ${m.inconnus.map(esc).join(', ')}.</div>` : ''}
      <button class="btn-principal" data-action="fermer">OK</button>`;
  }
  const haltero = (m.type === 'options' || (m.type === 'saisie' && m.quoi !== 'etape')) && d.enCours && estHaltero(exo(exoCourant().exo));
  const theme = haltero ? 'theme-haltero'
    : ['quitter-h', 'plan', 'fin-h', 'etape', 'suppr-circuit'].includes(m.type) || (m.type === 'saisie' && m.quoi === 'etape')
      || (m.type === 'enregistrer' && m.quoi === 'circuit') ? 'theme-hyrox' : '';
  return `<div class="voile" data-action="voile"><div class="feuille ${theme}" role="dialog" aria-modal="true">${contenu}</div></div>`;
}
