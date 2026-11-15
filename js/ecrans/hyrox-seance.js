import { ICONES } from '../commun.js';
import { ecranHyrox, ligneEtape } from './hyrox.js';
import { d, enregistrer, rendre, ui } from '../etat.js';
import { illustration } from '../illustrations.js';
import {
  ajustement, allureTexte, ecrireTemps, niveauCharges, noteCharge, reperesDepuisTest, seanceHyrox,
} from '../metier/hyrox.js';
import { aujourdhui, dateLongue, esc, mmss } from '../outils.js';
import { garderEcranAllume, libererEcran } from '../seance-muscu.js';

export function etapeCourante() {
  const h = d.enCoursHyrox;
  return h.blocs[h.b].etapes[h.e];
}

export function ecranHyroxSeance() {
  const h = d.enCoursHyrox;
  const bloc = h.blocs[h.b];
  const reperes = d.hyroxProfil?.reperes || {};
  const barres = h.blocs.map((b, i) => `<div class="${i < h.b ? 'fait' : i === h.b ? 'encours' : ''}" style="flex:${b.nom === 'Échauffement' || b.nom === 'Retour au calme' ? 1 : 3}"></div>`).join('');
  const et = etapeCourante();
  const lignes = bloc.etapes.map((e, i) => {
    if (i < h.e) {
      const sp = h.splits.find((x) => x.b === h.b && x.t === h.t && x.e === i);
      return ligneEtape(e, reperes, 'faite', sp ? (sp.passe ? 'passé' : mmss(sp.duree)) : '');
    }
    if (i === h.e) {
      return `<div class="etape active">
        <span class="mini-dessin">${illustration(e.dessin, e.texte, 40)}</span>
        <span class="txt"><span class="nom" style="font-size:17px">${esc(e.texte)}</span>
        ${[allureTexte(e, reperes), noteCharge(e, niveauCharges(d.hyroxProfil)), e.detail].filter(Boolean).map((x) => `<span class="petit">${esc(x)}</span>`).join('')}
        ${e.conseil ? `<span class="petit" style="color:var(--texte);opacity:.85">${esc(e.conseil)}</span>` : ''}</span>
      </div>`;
    }
    return ligneEtape(e, reperes, 'avenir');
  }).join('');
  const toursFaits = [];
  for (let t = 0; t < h.t; t++) {
    const tot = h.splits.filter((x) => x.b === h.b && x.t === t).reduce((s, x) => s + x.duree, 0);
    toursFaits.push(`tour ${t + 1} en ${mmss(tot)}`);
  }
  const libelle = et.repos ? (h.pause ? 'Reprendre' : 'Repos terminé') : 'Étape terminée';
  return `<main class="ecran theme-hyrox">
    <div class="ligne">
      <button class="btn-icone" data-action="quitter-h" aria-label="Quitter la séance">${ICONES.retour}</button>
      <div style="flex:1" class="pile">
        <div class="sur-titre">${esc(h.nom)} · bloc ${h.b + 1} sur ${h.blocs.length}</div>
        <div class="barres-h">${barres}</div>
      </div>
    </div>
    <div class="ligne" style="align-items:baseline">
      <h1 style="flex:1;font-size:26px">${esc(bloc.nom)}</h1>
      ${bloc.tours > 1 ? `<span style="font-size:15px;font-weight:700;color:var(--accent)">Tour ${h.t + 1} sur ${bloc.tours}</span>` : ''}
    </div>
    <div class="pile" style="align-items:center;gap:2px;padding:4px 0">
      <div class="temps-h" id="h-temps" role="timer">0:00</div>
      <div class="petit" id="h-sous">&nbsp;</div>
      ${toursFaits.length ? `<div class="petit">${toursFaits.join(' · ')}</div>` : ''}
    </div>
    <div class="pile" style="gap:8px">${lignes}</div>
    <div class="pousse"></div>
    ${h.pause ? '<div class="bandeau" style="text-align:center">En pause</div>' : ''}
    <button class="btn-principal" style="height:64px" data-action="${h.pause ? 'pause-toggle' : 'etape-ok'}">${h.pause ? 'Reprendre' : libelle}</button>
    <div class="ligne" style="justify-content:space-between">
      <button class="btn-lien" data-action="pause-toggle">${h.pause ? 'Reprendre' : 'Pause'}</button>
      <button class="btn-lien" data-action="etape-passer">Passer l'étape</button>
    </div>
  </main>`;
}

// Chronos Hyrox : étape (chrono), repos et durées (compte à rebours), EMOM (minute par minute).
export function ticHyrox() {
  const h = d.enCoursHyrox;
  if (ui.ecran !== 'hyrox-seance' || !h) return;
  const temps = document.getElementById('h-temps');
  const sous = document.getElementById('h-sous');
  if (!temps) return;
  const maintenant = h.pause || Date.now();
  const el = (maintenant - h.debutEtape) / 1000;
  const total = (maintenant - h.debut) / 1000;
  const et = etapeCourante();
  const signal = (cle) => {
    if (h.signal === cle || h.pause) return;
    h.signal = cle;
    enregistrer();
    if (document.visibilityState === 'visible') {
      ui.flash = true;
      rendre();
      setTimeout(() => { ui.flash = false; rendre(); }, 2500);
    }
  };
  if (et.repos || et.duree) {
    const reste = (et.repos || et.duree) - el;
    if (reste > 0) {
      temps.textContent = mmss(Math.ceil(reste));
      sous.textContent = `${et.repos ? 'de repos' : 'restantes'} · total ${mmss(total)}`;
    } else {
      temps.textContent = '0:00';
      sous.textContent = `Terminé · touche le bouton pour continuer · total ${mmss(total)}`;
      signal(`fin-${h.b}-${h.t}-${h.e}`);
    }
  } else if (et.emom) {
    const minute = Math.floor(el / 60) + 1;
    if (minute > et.emom) {
      temps.textContent = '0:00';
      sous.textContent = `EMOM terminé · total ${mmss(total)}`;
      signal(`fin-${h.b}-${h.t}-${h.e}`);
    } else {
      temps.textContent = mmss(60 - (el % 60));
      sous.textContent = `Minute ${minute} sur ${et.emom} · total ${mmss(total)}`;
      if (minute > 1) signal(`emom-${h.b}-${h.t}-${h.e}-${minute}`);
    }
  } else {
    temps.textContent = mmss(el);
    sous.textContent = `total ${mmss(total)}`;
  }
}

export function demarrerHyrox(id) {
  const s = seanceHyrox(id);
  const maintenant = Date.now();
  d.enCoursHyrox = {
    id, nom: s.nom, debut: maintenant, blocs: JSON.parse(JSON.stringify(s.blocs(d.hyroxAjust[id] || 0))),
    b: 0, t: 0, e: 0, debutEtape: maintenant, splits: [], pause: null, signal: null,
  };
  enregistrer();
  ui.ecran = 'hyrox-seance';
  garderEcranAllume();
  rendre();
  window.scrollTo(0, 0);
}

export function avancerHyrox(passe) {
  const h = d.enCoursHyrox;
  const et = etapeCourante();
  const maintenant = Date.now();
  h.splits.push({ b: h.b, t: h.t, e: h.e, texte: et.texte, duree: Math.round((maintenant - h.debutEtape) / 1000), passe: Boolean(passe), repos: Boolean(et.repos), mesure: et.mesure || null });
  h.e++;
  const bloc = h.blocs[h.b];
  if (h.e >= bloc.etapes.length) { h.e = 0; h.t++; }
  if (h.t >= bloc.tours) { h.t = 0; h.b++; }
  h.debutEtape = maintenant;
  h.signal = null;
  if (h.b >= h.blocs.length) { finirHyrox(); return; }
  enregistrer();
  rendre();
  window.scrollTo(0, 0);
}

export function finirHyrox() {
  const h = d.enCoursHyrox;
  const fin = h.pause || Date.now();
  ui.finInfos = [];
  // Séance test : les temps mesurés deviennent les repères.
  const mesures = {};
  for (const x of h.splits) if (x.mesure && !x.passe) mesures[x.mesure] = x.duree;
  if (Object.keys(mesures).length) {
    const r = reperesDepuisTest(mesures);
    d.hyroxProfil = d.hyroxProfil || { mode: 'libre', reperes: {}, hyroxParSemaine: 2 };
    d.hyroxProfil.reperes = { ...(d.hyroxProfil.reperes || {}), ...r };
    if (r.course10k) ui.finInfos.push(`10 km estimé à ${ecrireTemps(r.course10k)} (${mmss(r.course10k / 10)} /km)`);
    if (r.ski1k) ui.finInfos.push(`SkiErg : ${mmss(r.ski1k / 2)} /500 m`);
    if (r.rameur1k) ui.finInfos.push(`Rameur : ${mmss(r.rameur1k / 2)} /500 m`);
  }
  const s = {
    id: `h${h.debut}`, date: aujourdhui(), debut: h.debut, fin, seance: `hyrox:${h.id}`, nom: h.nom, exercices: [],
    hyrox: { total: Math.round((fin - h.debut) / 1000), splits: h.splits, ressenti: null, ajustAvant: d.hyroxAjust[h.id] || 0 },
  };
  d.historique.push(s);
  d.enCoursHyrox = null;
  libererEcran();
  enregistrer();
  ui.ecran = 'hyrox-fin';
  ui.finId = s.id;
  rendre();
  window.scrollTo(0, 0);
}

export function ecranHyroxFin() {
  const s = d.historique.find((x) => x.id === ui.finId);
  if (!s?.hyrox) { ui.ecran = 'hyrox'; return ecranHyrox(); }
  const sp = s.hyrox.splits;
  const btnR = (v, t) => `<button data-action="ressenti-h" data-v="${v}" class="${s.hyrox.ressenti === v ? 'on' : ''}" aria-pressed="${s.hyrox.ressenti === v}">${t}</button>`;
  // Temps par tour des blocs à plusieurs tours, détail par étape sinon.
  const blocs = [...new Set(sp.map((x) => x.b))];
  const detail = blocs.map((b) => {
    const de = sp.filter((x) => x.b === b);
    const nbTours = Math.max(...de.map((x) => x.t)) + 1;
    if (nbTours > 1) {
      return Array.from({ length: nbTours }, (_, t) => `<div><span>Tour ${t + 1}</span><span class="petit" style="font-size:14px">${mmss(de.filter((x) => x.t === t).reduce((a, x) => a + x.duree, 0))}</span></div>`).join('');
    }
    return de.filter((x) => !x.repos).map((x) => `<div><span>${esc(x.texte)}</span><span class="petit" style="font-size:14px">${x.passe ? 'passé' : mmss(x.duree)}</span></div>`).join('');
  }).join('');
  return `<main class="ecran theme-hyrox">
    <div class="pile" style="gap:6px"><div class="sur-titre">${esc(s.nom)} · ${dateLongue(s.date)}</div><h1>Séance terminée</h1></div>
    ${(ui.finInfos || []).map((t) => `<div class="bandeau">${esc(t)}</div>`).join('')}
    <div class="carte pile" style="align-items:center;gap:2px;padding:18px">
      <div class="petit">Temps total</div><div class="temps-h">${mmss(s.hyrox.total)}</div>
    </div>
    <div class="carte pile" style="gap:12px;padding:16px">
      <div style="font-size:15px;font-weight:600">Comment était cette séance&nbsp;?</div>
      <div class="grille3 choix-ressenti" style="gap:8px">${btnR('facile', 'Facile')}${btnR('correct', 'Correct')}${btnR('dur', 'Dur')}</div>
      <div class="petit">Facile : un tour de plus la prochaine fois. Dur : un tour de moins.</div>
    </div>
    <div class="carte liste-perf">${detail}</div>
    <button class="btn-principal" data-action="onglet" data-id="hyrox">Retour</button>
  </main>`;
}

/** Actions des boutons de ce fichier (attribut data-action dans le HTML). */
export const actions = {
  'go-hyrox'(el) { demarrerHyrox(el.dataset.id); return false; },
  'reprendre-h'() { ui.ecran = 'hyrox-seance'; garderEcranAllume(); window.scrollTo(0, 0); },
  'etape-ok'() { avancerHyrox(false); return false; },
  'etape-passer'() { if (d.enCoursHyrox.pause) actions['pause-toggle'](); avancerHyrox(true); return false; },
  'pause-toggle'() {
    const h = d.enCoursHyrox;
    if (h.pause) {
      const decalage = Date.now() - h.pause;
      h.debut += decalage;
      h.debutEtape += decalage;
      h.pause = null;
    } else h.pause = Date.now();
    enregistrer();
  },
  'quitter-h'() { ui.modal = { type: 'quitter-h' }; },
  'pause-h'() { ui.modal = null; ui.ecran = 'hyrox'; libererEcran(); },
  'terminer-h'() { ui.modal = null; finirHyrox(); return false; },
  'abandonner-h'() {
    d.enCoursHyrox = null;
    libererEcran();
    enregistrer();
    ui.modal = null;
    ui.ecran = 'hyrox';
  },
  'ressenti-h'(el) {
    const s = d.historique.find((x) => x.id === ui.finId);
    s.hyrox.ressenti = s.hyrox.ressenti === el.dataset.v ? null : el.dataset.v;
    const id = s.seance.slice(6);
    d.hyroxAjust[id] = s.hyrox.ressenti ? ajustement(s.hyrox.ajustAvant, s.hyrox.ressenti) : s.hyrox.ajustAvant;
    enregistrer();
  },
};
