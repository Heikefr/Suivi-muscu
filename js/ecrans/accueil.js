import { ICONES, nav } from '../commun.js';
import { derniereFois, prochaineSeance } from '../composition.js';
import { d } from '../etat.js';
import { SEANCES, seance } from '../metier/donnees.js';
import { debutSemaine, esc } from '../outils.js';

export function ecranAccueil() {
  const deb = debutSemaine();
  const faites = d.historique.filter((s) => s.date >= deb && !s.importee).length;
  const prochaine = seance(prochaineSeance());
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

  let haut;
  if (d.enCours) {
    const faitesSeries = d.enCours.exercices.reduce((t, e) => t + e.series.length, 0);
    haut = `<div class="conseillee">
      <div class="label">Séance en cours</div>
      <div class="titre">${esc(d.enCours.nom || seance(d.enCours.seance)?.nom)}</div>
      <div style="font-size:14px">${faitesSeries} série${faitesSeries > 1 ? 's' : ''} validée${faitesSeries > 1 ? 's' : ''}</div>
      <button class="btn-sombre" data-action="reprendre">Reprendre la séance</button>
    </div>`;
  } else {
    haut = `<button class="conseillee" data-action="composer" data-id="${prochaine.id}" style="border:none;text-align:left">
      <span class="label">Conseillée aujourd'hui</span>
      <span class="titre" style="font-size:30px">${esc(prochaine.nom)}</span>
      <span style="font-size:14px;font-weight:500">${esc(prochaine.description)} · ${derniereFois(prochaine.id)}</span>
    </button>`;
  }
  const off = d.enCours ? 'disabled' : '';
  const autres = SEANCES.filter((s) => d.enCours || s.id !== prochaine.id).map((s) => `
    <button class="choix" data-action="composer" data-id="${s.id}" ${off} style="min-height:72px">
      <span><span class="nom titre-seance">${esc(s.nom)}</span><span class="petit">${esc(s.description)} · ${derniereFois(s.id)}</span></span>
      ${ICONES.suite}
    </button>`).join('');
  const enregistrees = d.seancesPerso.map((s) => `
    <button class="choix" data-action="perso" data-id="${esc(s.id)}" ${off} style="min-height:56px">
      <span><span class="nom" style="font-size:15px">${esc(s.nom)}</span><span class="petit">${s.exercices.length} exercices · ${derniereFois('perso:' + s.id)}</span></span>
      ${ICONES.suite}
    </button>`).join('');

  return `<main class="ecran avec-nav">
    <div class="entete">
      <div><div class="sur-titre">Cette semaine · ${Math.min(faites, 9)} séance${faites > 1 ? 's' : ''} sur 3</div><h1>Prêt pour la séance&nbsp;?</h1></div>
      <button class="btn-icone" data-action="ecran" data-id="reglages" aria-label="Réglages">${ICONES.reglages}</button>
    </div>
    ${standalone ? '' : `<div class="bandeau"><strong>Installe l'appli :</strong> dans Safari, touche Partager puis « Sur l'écran d'accueil ». C'est indispensable pour que tes données restent bien sur le téléphone.</div>`}
    ${haut}
    <div class="pile">
      ${autres}
      <button class="choix pointille-accent" data-action="perso" ${off} style="min-height:72px">
        <span class="carre-plus">${ICONES.plus}</span>
        <span><span class="nom titre-seance" style="font-size:20px">Séance personnalisée</span><span class="petit">Choisis parmi tous les exercices, haltéro compris</span></span>
      </button>
      ${enregistrees ? `<div class="sur-titre" style="margin-top:4px">Tes séances enregistrées</div>${enregistrees}` : ''}
    </div>
  </main>${nav('seances')}`;
}
