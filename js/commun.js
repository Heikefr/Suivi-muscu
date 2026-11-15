import { d } from './etat.js';
import { exo } from './metier/donnees.js';
import { chargeDe, historiqueExo, seancesMemeCharge } from './metier/progression.js';
import { ilYa, nb } from './outils.js';

export function nomExo(id, secours) {
  return exo(id)?.nom || secours || id;
}

export const estHaltero = (def) => def?.type === 'haltero';

export function chargeTexte(c, def) {
  if (def?.poidsDuCorps) return 'Poids du corps';
  if (c == null) return 'À choisir';
  return `${nb(c)} kg`;
}

export function repsTexte(n, def) {
  return def?.unite === 's' ? `${n} s` : `${n} reps`;
}

export function cibleTexte(c, def) {
  const u = def?.unite === 's' ? ' s' : '';
  return c.repsMin === c.repsMax ? `${c.series} × ${c.repsMin}${u}` : `${c.series} × ${c.repsMin}–${c.repsMax}${u}`;
}

export function infoExo(id) {
  const def = exo(id);
  if (estHaltero(def)) {
    const r = d.records[id];
    return r ? `record ${nb(r)} kg` : 'record à définir';
  }
  const passe = historiqueExo(d.historique, id);
  if (!passe.length) return def.poidsDuCorps ? 'Poids du corps · jamais fait' : 'jamais fait';
  if (def.poidsDuCorps) return `dernière fois ${ilYa(passe[passe.length - 1].date)}`;
  const c = chargeDe(passe[passe.length - 1].series);
  const memes = seancesMemeCharge(passe);
  const suffixe = def.materiel === 'halteres' ? ' par haltère' : '';
  return memes > 1 ? `${nb(c)} kg${suffixe} depuis ${memes} séances` : `${nb(c)} kg${suffixe}`;
}

export const ICONES = {
  retour: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4l-6 6 6 6"></path></svg>',
  suite: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--doux)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l6 6-6 6"></path></svg>',
  chevron: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5l4 4 4-4"></path></svg>',
  coche: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10l4 4 8-9"></path></svg>',
  croix: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"></path></svg>',
  plus: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"><path d="M10 4v12M4 10h12"></path></svg>',
  reglages: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"></path></svg>',
  seances: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 11h16M5 7v8M17 7v8M2 9v4M20 9v4"></path></svg>',
  progression: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-6 4 3 7-9"></path></svg>',
  exercices: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h14M4 11h14M4 16h14"></path></svg>',
  hyrox: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="12" r="7"></circle><path d="M11 12V8.5M9 2.5h4M16.5 5.5l1.5-1.5"></path></svg>',
  loupe: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--doux)" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="5"></circle><path d="M12 12l4 4"></path></svg>',
};

export function nav(actif) {
  const b = (id, nom) => `<button data-action="onglet" data-id="${id}" class="${actif === id ? 'actif' : ''}" ${actif === id ? 'aria-current="page"' : ''}>${ICONES[id]}${nom}</button>`;
  return `<nav class="nav ${actif === 'hyrox' ? 'theme-hyrox' : ''}"><div>${b('seances', 'Muscu')}${b('hyrox', 'Hyrox')}${b('progression', 'Progression')}${b('exercices', 'Exercices')}</div></nav>`;
}
