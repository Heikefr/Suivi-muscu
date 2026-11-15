// =====================================================================
// Point d'entrée de l'appli
// ---------------------------------------------------------------------
// Ce fichier fait le lien entre tout le reste :
//   1. rendre()  : choisit l'écran à afficher et redessine la page ;
//   2. les écouteurs : un clic sur un bouton [data-action="x"] lance actions.x ;
//   3. le démarrage : reprise d'une séance en cours, mise à jour hors ligne.
//
// Principe d'affichage : chaque écran est une fonction qui renvoie du HTML.
// Après chaque action, on redessine tout l'écran à partir des données (d)
// et de l'état d'affichage (ui). Simple, et suffisant pour une appli de cette taille.
// =====================================================================

import { ecranAccueil } from './ecrans/accueil.js';
import { actions as actionsComposition, ecranComposer, ecranPerso, majPerso } from './ecrans/composition.js';
import { actions as actionsHyroxSeance, ecranHyroxFin, ecranHyroxSeance, ticHyrox } from './ecrans/hyrox-seance.js';
import {
  actions as actionsHyrox, ecranHyrox, ecranHyroxApercu, ecranHyroxLibre, ecranHyroxProfil,
} from './ecrans/hyrox.js';
import {
  actions as actionsProgression, ecranDetail, ecranExercices, ecranProgression,
} from './ecrans/progression.js';
import { actions as actionsReglages, ecranReglages, importerFichier } from './ecrans/reglages.js';
import { actions as actionsSeance, ecranExercice, ecranFin, ecranRecup, tic } from './ecrans/seance.js';
import { d, definirRendu, ui } from './etat.js';
import { modalHtml } from './fenetres.js';
import { exo } from './metier/donnees.js';
import { lireTemps, seanceHyrox } from './metier/hyrox.js';
import { demanderPersistance } from './metier/stockage.js';
import { esc, mmss } from './outils.js';
import { garderEcranAllume } from './seance-muscu.js';

const $app = document.getElementById('app');

/** Redessine la page : l'écran courant, puis la fenêtre ouverte, le message et le flash éventuels. */
function rendre() {
  let html;
  if (ui.ecran === 'exercice' && d.enCours) html = ecranExercice();
  else if (ui.ecran === 'recup' && d.enCours?.recup) html = ecranRecup();
  else if (ui.ecran === 'composer' && ui.compo) html = ecranComposer();
  else if (ui.ecran === 'perso' && ui.perso) html = ecranPerso();
  else if (ui.ecran === 'fin') html = ecranFin();
  else if (ui.ecran === 'progression') html = ecranProgression();
  else if (ui.ecran === 'exercices') html = ecranExercices();
  else if (ui.ecran === 'detail' && exo(ui.exoDetail)) html = ecranDetail();
  else if (ui.ecran === 'reglages') html = ecranReglages();
  else if (ui.ecran === 'hyrox-seance' && d.enCoursHyrox) html = ecranHyroxSeance();
  else if (ui.ecran === 'hyrox-fin') html = ecranHyroxFin();
  else if (ui.ecran === 'hyrox-profil') html = ecranHyroxProfil();
  else if (ui.ecran === 'hyrox-apercu' && seanceHyrox(ui.hyroxApercu)) html = ecranHyroxApercu();
  else if (ui.ecran === 'hyrox-libre') html = ecranHyroxLibre(true);
  else if (ui.ecran === 'hyrox' || ui.ecran === 'hyrox-seance') { ui.ecran = 'hyrox'; html = ecranHyrox(); }
  else { ui.ecran = 'accueil'; html = ecranAccueil(); }
  const scrollFeuille = document.querySelector('.feuille')?.scrollTop || 0;
  $app.innerHTML = html + modalHtml() + (ui.toast ? `<div class="toast" role="status">${esc(ui.toast)}</div>` : '') + (ui.flash ? '<div class="flash"></div>' : '');
  const f = document.querySelector('.feuille');
  if (f && ui.modalGardeScroll) f.scrollTop = scrollFeuille;
  ui.modalGardeScroll = false;
  if (ui.ecran === 'recup') tic();
  if (ui.ecran === 'hyrox-seance') ticHyrox();
}
definirRendu(rendre);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    tic();
    ticHyrox();
    garderEcranAllume();
  }
});

// ---------- Actions ----------

const actionsNavigation = {
  onglet(el) {
    ui.ecran = { seances: 'accueil', hyrox: 'hyrox', progression: 'progression', exercices: 'exercices' }[el.dataset.id] || 'accueil';
    ui.modal = null;
    window.scrollTo(0, 0);
  },
  ecran(el) { ui.ecran = el.dataset.id; window.scrollTo(0, 0); },
  fermer() { ui.modal = null; },
  voile(el, ev) { if (ev.target === el) ui.modal = null; else return false; },
};

const actions = {
  ...actionsNavigation, ...actionsComposition, ...actionsSeance, ...actionsProgression,
  ...actionsReglages, ...actionsHyrox, ...actionsHyroxSeance,
};

$app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el || el.tagName === 'INPUT' || el.disabled) return;
  const f = actions[el.dataset.action];
  if (!f) return;
  const res = f(el, ev);
  if (res instanceof Promise) return;
  if (res !== false) rendre();
});

$app.addEventListener('input', (ev) => {
  const el = ev.target;
  if (ui.hp && el.dataset.repere) {
    ui.hp.reperes[el.dataset.repere] = el.value;
    const s = lireTemps(el.value);
    const span = document.getElementById(`al-${el.dataset.repere}`);
    if (span) span.textContent = s ? `${mmss(s / (el.dataset.repere === 'course10k' ? 10 : 2))} ${el.dataset.repere === 'course10k' ? '/km' : '/500 m'}` : (el.value ? 'mm:ss' : 'Je ne sais pas');
    return;
  }
  if (ui.hp && el.id === 'hp-date') { ui.hp.date = el.value; return; }
  if (ev.target.id === 'recherche' && ui.perso) {
    ui.perso.q = ev.target.value;
    majPerso();
  }
});

$app.addEventListener('change', (ev) => {
  const el = ev.target;
  if (ui.hp && el.id === 'hp-date') { ui.hp.date = el.value; rendre(); return; }
  if (el.dataset.action === 'importer' && el.files?.[0]) {
    importerFichier(el.files[0]);
    el.value = '';
  }
});

// ---------- Démarrage ----------

demanderPersistance();
if (d.enCours) {
  ui.ecran = d.enCours.recup ? 'recup' : 'exercice';
  garderEcranAllume();
} else if (d.enCoursHyrox) {
  ui.ecran = 'hyrox-seance';
  garderEcranAllume();
}
rendre();

// Mise à jour hors ligne : bandeau quand une nouvelle version est prête.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const proposer = (w) => {
      if (!w || !navigator.serviceWorker.controller) return;
      const b = document.createElement('button');
      b.className = 'toast';
      b.style.border = 'none';
      b.textContent = 'Nouvelle version prête · toucher pour mettre à jour';
      b.onclick = () => w.postMessage('activer');
      document.body.appendChild(b);
    };
    // Hors séance, la nouvelle version s'installe toute seule ; pendant une séance, on propose.
    const appliquer = (w) => {
      if (!w || !navigator.serviceWorker.controller) return;
      if (!d.enCours && !d.enCoursHyrox) w.postMessage('activer');
      else proposer(w);
    };
    if (reg.waiting) appliquer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed') appliquer(w); });
    });
    // Vérifie s'il y a une mise à jour à chaque retour dans l'appli.
    reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {});
    });
  }).catch(() => {});
  let recharge = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!recharge) { recharge = true; location.reload(); }
  });
}