// =====================================================================
// Réglages
// ---------------------------------------------------------------------
// Sauvegarde, restauration, import de l'ancien tableur et remise à zéro.
// =====================================================================

import { ICONES, nomExo } from '../commun.js';
import { VERSION, d, enregistrer, remplacerDonnees, rendre, toast, ui } from '../etat.js';
import { fusionner, importerCsv } from '../metier/import.js';
import { valider, vide } from '../metier/stockage.js';
import { CATEGORIES_RECUP, RECUP_MAX, RECUP_MIN, RECUP_PAS, recupCategorie } from '../metier/conseils.js';
import { aujourdhui, dateLongue, esc, mmss } from '../outils.js';
import { blocSemaineType } from './planning.js';

export function ecranReglages() {
  const nbS = d.historique.length;
  return `<main class="ecran">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="seances" aria-label="Retour">${ICONES.retour}</button>
      <h1 class="u-flex-1 u-t-26">Réglages</h1>
    </div>
    <div class="carte pile">
      <div class="u-gras-600">Tes données</div>
      <div class="petit">${nbS} séance${nbS > 1 ? 's' : ''} enregistrée${nbS > 1 ? 's' : ''}, uniquement sur ce téléphone. Fais une sauvegarde de temps en temps (Fichiers ou iCloud Drive).</div>
      <button class="btn-secondaire" data-action="exporter">Exporter une sauvegarde</button>
      <label class="btn-secondaire u-aff-flex u-items-center u-justifie-center u-cursor-pointer">
        Importer un fichier
        <input type="file" class="cache" data-action="importer" accept=".csv,.json,text/csv,application/json,text/plain">
      </label>
      <div class="petit">Accepte une sauvegarde de l'appli (.json) ou ton ancien suivi Google Sheet exporté en CSV (onglet musculation).</div>
    </div>
    <div class="carte pile u-ecart-12">
      <div class="u-gras-600">Temps de récup</div>
      <div class="petit">La règle selon le type d'exercice. Tu peux aussi régler un exercice précis depuis son bouton « Options » pendant la séance.</div>
      ${CATEGORIES_RECUP.map((c) => {
    const v = recupCategorie(c.id, d.recupCat);
    return `<div class="ligne-recup">
        <span class="pile u-ecart-2 u-flex-1"><span class="u-gras-600 u-t-15">${esc(c.nom)}</span><span class="petit">${esc(c.exemple)}${v !== c.defaut ? ` · règle ${mmss(c.defaut)}` : ''}</span></span>
        <div class="stepper"><button data-action="recup-cat" data-c="${c.id}" data-d="-1" aria-label="${esc(c.nom)} : plus court">−</button><div class="val">${mmss(v)}</div><button data-action="recup-cat" data-c="${c.id}" data-d="1" aria-label="${esc(c.nom)} : plus long">+</button></div>
      </div>`;
  }).join('')}
      <div class="ligne-recup">
        <span class="pile u-ecart-2 u-flex-1"><span class="u-gras-600 u-t-15">À la fin de la récup</span><span class="petit">${d.recupAuto ? 'L\'écran de l\'exercice revient tout seul.' : 'L\'écran reste sur la récup : touche « Passer la récup ».'}</span></span>
        <div class="segment segment-court">
          <button class="${d.recupAuto ? 'on' : ''}" data-action="recup-auto" data-v="1" aria-pressed="${d.recupAuto}">Auto</button>
          <button class="${d.recupAuto ? '' : 'on'}" data-action="recup-auto" data-v="0" aria-pressed="${!d.recupAuto}">Manuel</button>
        </div>
      </div>
      ${Object.keys(d.recupCat).length || Object.keys(d.recupExo).length ? `<button class="btn-lien" data-action="recup-defaut">Revenir à la règle partout${Object.keys(d.recupExo).length ? ` (dont ${Object.keys(d.recupExo).length} exercice${Object.keys(d.recupExo).length > 1 ? 's' : ''} réglé${Object.keys(d.recupExo).length > 1 ? 's' : ''} à part)` : ''}</button>` : ''}
    </div>
    ${blocSemaineType()}
    <div class="carte pile">
      <div class="u-gras-600">Rappel de sauvegarde</div>
      <div class="puces">${[[7, 'Chaque semaine'], [30, 'Chaque mois'], [0, 'Jamais']].map(([j, t]) => `<button class="puce ${d.sauvegarde.rappel === j ? 'on' : ''}" data-action="rappel" data-j="${j}" aria-pressed="${d.sauvegarde.rappel === j}">${t}</button>`).join('')}</div>
      <div class="petit">Dernière sauvegarde : ${d.sauvegarde.derniere ? dateLongue(d.sauvegarde.derniere) : 'jamais'}. Le rappel s'affiche sur l'accueil et disparaît dès que tu sauvegardes.</div>
    </div>
    ${d.exclus.length ? `<div class="carte pile">
      <div class="u-gras-600">Exercices exclus</div>
      <div class="petit u-t-14">${d.exclus.map((id) => esc(nomExo(id))).join(', ')}</div>
      <button class="btn-secondaire" data-action="reinclure">Tout proposer à nouveau</button>
    </div>` : ''}
    <div class="carte pile">
      <div class="u-gras-600">Tout effacer</div>
      <div class="petit">Supprime l'historique, les records et les séances enregistrées de ce téléphone.</div>
      <button class="btn-secondaire btn-danger" data-action="effacer">Effacer toutes les données</button>
    </div>
    <div class="petit u-aligne-center">Suivi muscu · version ${VERSION}</div>
  </main>`;
}

/** Lit un fichier choisi par l'utilisateur : sauvegarde (.json) ou ancien tableur (.csv). */
export async function importerFichier(fichier) {
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
      const idsC = new Set(d.circuits.map((c) => c.id));
      d.circuits = [...d.circuits, ...v.circuits.filter((c) => !idsC.has(c.id))];
      if (!Object.keys(d.semaineType).length) d.semaineType = v.semaineType;
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

/** Actions des boutons de ce fichier (attribut data-action dans le HTML). */
export const actions = {
  effacer() { ui.modal = { type: 'effacer' }; },
  'effacer-ok'() {
    remplacerDonnees(vide());
    enregistrer();
    ui.modal = null;
    ui.ecran = 'accueil';
    toast('Données effacées');
    return false;
  },
  rappel(el) { d.sauvegarde.rappel = Number(el.dataset.j); enregistrer(); },
  'recup-auto'(el) { d.recupAuto = el.dataset.v === '1'; enregistrer(); },
  'recup-cat'(el) {
    const c = el.dataset.c;
    const v = recupCategorie(c, d.recupCat) + Number(el.dataset.d) * RECUP_PAS;
    d.recupCat[c] = Math.min(RECUP_MAX, Math.max(RECUP_MIN, v));
    // Revenir pile sur la règle : on efface le réglage.
    if (d.recupCat[c] === CATEGORIES_RECUP.find((x) => x.id === c).defaut) delete d.recupCat[c];
    enregistrer();
  },
  'recup-defaut'() { d.recupCat = {}; d.recupExo = {}; enregistrer(); toast('Temps de récup remis à la règle'); },
  async exporter() {
    // La sauvegarde est notée comme faite seulement si elle aboutit (pas si le partage est annulé).
    const noter = () => { d.sauvegarde.derniere = aujourdhui(); enregistrer(); rendre(); toast('Sauvegarde faite'); };
    const texte = JSON.stringify({ ...d, exporte: new Date().toISOString(), appli: 'suivi-muscu', versionAppli: VERSION }, null, 1);
    const nom = `suivi-muscu-${aujourdhui()}.json`;
    try {
      const fichier = new File([texte], nom, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
        await navigator.share({ files: [fichier], title: nom });
        noter();
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
    noter();
    return false;
  },
};
