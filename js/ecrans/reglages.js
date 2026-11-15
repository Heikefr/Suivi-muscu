import { ICONES, nomExo } from '../commun.js';
import { VERSION, d, enregistrer, remplacerDonnees, rendre, toast, ui } from '../etat.js';
import { fusionner, importerCsv } from '../metier/import.js';
import { valider, vide } from '../metier/stockage.js';
import { aujourdhui, esc } from '../outils.js';

export function ecranReglages() {
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
    ${d.exclus.length ? `<div class="carte pile">
      <div style="font-weight:600">Exercices exclus</div>
      <div class="petit" style="font-size:14px">${d.exclus.map((id) => esc(nomExo(id))).join(', ')}</div>
      <button class="btn-secondaire" data-action="reinclure">Tout proposer à nouveau</button>
    </div>` : ''}
    <div class="carte pile">
      <div style="font-weight:600">Tout effacer</div>
      <div class="petit">Supprime l'historique, les records et les séances enregistrées de ce téléphone.</div>
      <button class="btn-secondaire btn-danger" data-action="effacer">Effacer toutes les données</button>
    </div>
    <div class="petit" style="text-align:center">Suivi muscu · version ${VERSION}</div>
  </main>`;
}

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
