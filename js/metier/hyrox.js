// Hyrox : séances types, calcul des allures et plan de préparation vers une compétition.
// Fonctions pures : testées par tests/hyrox.test.js.
// Séances écrites pour l'appli (inspirées des principes classiques d'entraînement Hyrox).

import { exo } from './donnees.js';
import { mmss, nb } from '../outils.js';

// ---------- Étapes ----------

/** Distance lisible : 800 → « 800 m », 1500 → « 1,5 km ». */
const dist = (m) => (m >= 1000 ? `${String(m / 1000).replace('.', ',')} km` : `${m} m`);

/** Étapes : chaque fonction fabrique une étape de séance (texte, schéma, allure ou charge). */
const course = (m, mode = 'compromis') => ({
  texte: `${dist(m)} course`, dessin: 'h-course', allure: { type: 'course', mode },
  conseil: 'Foulée courte et relâchée. Ne pars pas trop vite après un atelier.',
});
const courseMin = (min, mode = 'facile') => ({
  texte: `${min} min de course`, dessin: 'h-course', duree: min * 60, allure: { type: 'course', mode },
  conseil: 'Tu dois pouvoir parler en courant. Si tu es essoufflée, ralentis.',
});
const ski = (m, delta = 3) => ({
  texte: `${dist(m)} SkiErg`, dessin: 'h-ski', allure: { type: 'ski', delta },
  conseil: 'Bras tendus en haut, tire avec le dos et les abdos, plie légèrement les genoux.',
});
const rameur = (m, delta = 3) => ({
  texte: `${dist(m)} rameur`, dessin: 'h-rameur', allure: { type: 'rameur', delta },
  conseil: 'Jambes, puis buste, puis bras. Retour dans l\'ordre inverse, sans te précipiter.',
});
const sledPush = (m = 50, intensite = 'compet') => ({
  texte: `${m} m sled push`, dessin: 'h-sled-push', charge: 'sledPush', intensite,
  conseil: 'Bras tendus ou fléchis, corps penché, petits pas rapides. Ne t\'arrête pas au milieu.',
});
const sledPull = (m = 50, intensite = 'compet') => ({
  texte: `${m} m sled pull`, dessin: 'h-sled-pull', charge: 'sledPull', intensite,
  conseil: 'Recule en tirant la corde main sur main, jambes fléchies, dos droit.',
});
const bbj = (m = 80) => ({
  texte: `${m} m burpees sauts en longueur`, dessin: 'h-bbj',
  conseil: 'Burpee, puis saut pieds joints vers l\'avant. Trouve un rythme régulier, pas de sprint.',
});
const farmers = (m = 200, intensite = 'compet') => ({
  texte: `${m} m farmers carry`, dessin: 'h-farmers', charge: 'farmers', intensite,
  conseil: 'Épaules basses, gainage serré, pas rapides. Pose les kettlebells avant de lâcher.',
});
const fentes = (m = 100) => ({
  texte: `${m} m fentes sac de sable`, dessin: 'h-fentes', charge: 'fentes', intensite: 'compet',
  conseil: 'Sac sur les épaules, genou arrière qui touche le sol à chaque pas, buste droit.',
});
const wallBalls = (n) => ({
  texte: `${n} wall balls`, dessin: 'h-wallball', charge: 'wallball', intensite: 'compet',
  conseil: 'Squat complet, lance avec les jambes. Fais des séries courtes avant d\'être à bout.',
});
const velo = (min) => ({ texte: `${min} min vélo facile`, dessin: 'h-velo', duree: min * 60, conseil: 'Pour chauffer : tu dois pouvoir parler.' });
const mobilite = (min) => ({
  texte: `${min} min mobilité`, dessin: 'h-mobilite', duree: min * 60,
  conseil: 'Hanches, chevilles, épaules : mouvements amples et lents.',
});
const repos = (s) => ({ texte: `Repos ${s >= 60 && s % 60 === 0 ? `${s / 60} min` : `${s} s`}`, dessin: 'h-repos', repos: s });
const emom = (min, texte) => ({
  texte: `EMOM ${min} min`, dessin: 'h-emom', emom: min, detail: texte,
  conseil: 'Au début de chaque minute, fais le travail, puis récupère jusqu\'à la minute suivante.',
});

// ---------- Charges de compétition ----------
// Poids des sleds : total, traîneau compris.

export const CHARGES = {
  1: { sledPush: 102, sledPull: 78, farmers: 16, fentes: 10, wallball: 4 },
  2: { sledPush: 152, sledPull: 103, farmers: 24, fentes: 20, wallball: 6 },
  3: { sledPush: 202, sledPull: 153, farmers: 32, fentes: 30, wallball: 9 },
};

// Niveau 1 : femme Open (solo, duo, relais) · niveau 2 : homme Open, femme Pro, duo mixte, relais hommes
// niveau 3 : homme Pro (solo, duo). Relais : charges du sexe de la personne.
export function niveauCharges(profil) {
  if (!profil) return null;
  const { niveau = 'open', format = 'solo', genre = 'femme' } = profil;
  if (format === 'relais') return genre === 'homme' ? 2 : 1;
  if (format === 'duo' && genre === 'mixte') return 2;
  if (genre === 'homme') return niveau === 'pro' ? 3 : 2;
  return niveau === 'pro' ? 2 : 1;
}

/** Arrondit au multiple de 5 le plus proche. */
const arrondi5 = (x) => Math.round(x / 5) * 5;

// Texte de la charge d'une étape selon le niveau ('' si l'étape n'a pas de charge).
export function noteCharge(etape, niveau) {
  if (!etape.charge) return etape.note || '';
  const c = niveau ? CHARGES[niveau] : null;
  const i = etape.intensite || 'compet';
  if (!c) {
    return { compet: 'charge de compétition', plus: 'un peu plus lourd que la compétition', legere: 'charge légère' }[i];
  }
  const v = c[etape.charge];
  switch (etape.charge) {
    case 'sledPush':
    case 'sledPull':
      if (i === 'plus') return `≈ ${arrondi5(v * 1.15)} kg, traîneau compris (compétition : ${v} kg)`;
      if (i === 'legere') return `≈ ${arrondi5(v * 0.6)} kg, traîneau compris`;
      return `${v} kg, traîneau compris`;
    case 'farmers':
      return i === 'plus' ? `2 × ${v + 8} kg (compétition : 2 × ${v} kg)` : `2 × ${v} kg`;
    case 'fentes':
      return `sac de ${v} kg`;
    case 'wallball':
      return `balle de ${v} kg`;
    default:
      return '';
  }
}

// ---------- Séances types ----------
// a = ajustement selon le ressenti (−2 à +2 tours sur la partie principale).

/** Nombre de tours ajusté par le ressenti (jamais moins de 1). */
const tours = (base, a) => Math.max(1, base + a);
const echauffementCourse = { nom: 'Échauffement', tours: 1, etapes: [courseMin(10, 'footing'), mobilite(5)] };
const echauffementErgo = { nom: 'Échauffement', tours: 1, etapes: [velo(8), ski(250, 10), rameur(250, 10)] };
const retourCalme = { nom: 'Retour au calme', tours: 1, etapes: [velo(5), mobilite(5)] };

export const SEANCES_HYROX = [
  {
    id: 'course-ateliers', nom: 'Course + ateliers', duree: 50,
    description: 'Courir fatigué, comme en compétition : course et ateliers enchaînés.',
    blocs: (a) => [
      echauffementErgo,
      { nom: 'Principal', tours: tours(3, a), etapes: [course(1000), sledPush(), course(1000), wallBalls(20), repos(120)] },
      retourCalme,
    ],
  },
  {
    id: 'ergo', nom: 'Intervalles ergo', duree: 45,
    description: 'SkiErg et rameur en fractionné, à ton allure de référence.',
    blocs: (a) => [
      echauffementErgo,
      { nom: 'Principal', tours: tours(4, a), etapes: [ski(800), repos(90), rameur(800), repos(90)] },
      retourCalme,
    ],
  },
  {
    id: 'intervalles-course', nom: 'Intervalles course', duree: 50,
    description: 'Fractionné à ton allure 10 km pour courir plus vite entre les ateliers.',
    blocs: (a) => [
      echauffementCourse,
      { nom: 'Principal', tours: tours(6, a), etapes: [course(1000, '10k'), repos(90)] },
      { nom: 'Retour au calme', tours: 1, etapes: [courseMin(8, 'footing'), mobilite(5)] },
    ],
  },
  {
    id: 'force-hyrox', nom: 'Force Hyrox', duree: 50,
    description: 'Sled, fentes, farmers carry et wall balls : la force spécifique des ateliers.',
    blocs: (a) => [
      echauffementErgo,
      { nom: 'Sled', tours: tours(4, a), etapes: [sledPush(25, 'plus'), repos(60), sledPull(25, 'plus'), repos(90)] },
      { nom: 'EMOM', tours: 1, etapes: [emom(10, 'Minutes impaires : 15 wall balls · minutes paires : 20 m fentes sac de sable')] },
      { nom: 'Portés', tours: tours(3, a), etapes: [farmers(100, 'plus'), repos(60)] },
      retourCalme,
    ],
  },
  {
    id: 'course-facile', nom: 'Course facile', duree: 45,
    description: 'Endurance fondamentale : la base pour tenir les 8 km.',
    blocs: (a) => [
      { nom: 'Principal', tours: 1, etapes: [courseMin(Math.max(20, 40 + a * 5), 'facile')] },
      { nom: 'Retour au calme', tours: 1, etapes: [mobilite(5)] },
    ],
  },
  {
    id: 'demi-simulation', nom: 'Demi-simulation', duree: 45,
    description: 'Les 4 premiers ateliers dans l\'ordre de la course. En duo : courez ensemble et partagez les ateliers comme le jour J.',
    blocs: () => [
      echauffementErgo,
      { nom: 'Principal', tours: 1, etapes: [course(1000), ski(1000, 0), course(1000), sledPush(), course(1000), sledPull(), course(1000), bbj(80)] },
      retourCalme,
    ],
  },
  {
    id: 'simulation', nom: 'Simulation complète', duree: 90,
    description: '8 × 1 km de course + les 8 ateliers dans l\'ordre. En duo : partagez le travail aux ateliers, courez ensemble.',
    blocs: () => [
      echauffementErgo,
      {
        nom: 'Principal', tours: 1,
        etapes: [course(1000), ski(1000, 0), course(1000), sledPush(), course(1000), sledPull(), course(1000), bbj(80),
          course(1000), rameur(1000, 0), course(1000), farmers(200), course(1000), fentes(100), course(1000), wallBalls(100)],
      },
      retourCalme,
    ],
  },
  {
    id: 'activation', nom: 'Activation avant compétition', duree: 30,
    description: 'Semaine de compétition : garder du rythme sans se fatiguer.',
    blocs: () => [
      { nom: 'Principal', tours: 1, etapes: [courseMin(15, 'facile'), rameur(500, 0), repos(120), sledPush(25, 'legere'), repos(120), course(500, 'compromis')] },
      { nom: 'Retour au calme', tours: 1, etapes: [mobilite(8)] },
    ],
  },
  {
    id: 'test', nom: 'Séance test', duree: 45,
    description: 'Mesure tes repères : 1 km de course, 1 km de SkiErg et 1 km de rameur, à fond mais réguliers.',
    blocs: () => [
      echauffementErgo,
      {
        nom: 'Tests', tours: 1,
        etapes: [{ ...course(1000, 'test'), mesure: 'course1k' }, repos(300), { ...ski(1000, 0), mesure: 'ski1k' }, repos(300), { ...rameur(1000, 0), mesure: 'rameur1k' }],
      },
      retourCalme,
    ],
  },
];

export const LIBRES = ['course-ateliers', 'ergo', 'intervalles-course', 'force-hyrox', 'course-facile', 'demi-simulation', 'simulation'];

/** Séance type à partir de son identifiant. */
export function seanceHyrox(id) {
  return SEANCES_HYROX.find((s) => s.id === id) || null;
}

// ---------- Allures ----------

// "52:30" ou "1:02:30" → secondes ; texte vide ou illisible → null.
export function lireTemps(texte) {
  const m = String(texte || '').trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const s = (Number(m[1] || 0) * 3600) + Number(m[2]) * 60 + Number(m[3]);
  return s > 0 ? s : null;
}

/** Secondes → « 55:00 » ou « 1:02:30 ». */
export function ecrireTemps(s) {
  if (!s) return '';
  const h = Math.floor(s / 3600);
  return h ? `${h}:${mmss(s - h * 3600).padStart(5, '0')}` : mmss(s);
}

const ECART_COURSE = { '10k': 0, compromis: 15, facile: 75, footing: 90 };

// Texte de l'allure visée pour une étape, selon les repères de la personne.
export function allureTexte(etape, reperes = {}) {
  const a = etape.allure;
  if (!a) return '';
  if (a.type === 'course') {
    if (a.mode === 'test') return 'à fond mais régulier';
    if (!reperes.course10k) {
      return { '10k': 'allure soutenue, tenable 10 km', compromis: 'allure de compétition, soutenue', facile: 'en aisance, tu peux parler', footing: 'très facile' }[a.mode];
    }
    return `${mmss(reperes.course10k / 10 + ECART_COURSE[a.mode])} /km`;
  }
  const ref = a.type === 'ski' ? reperes.ski1k : reperes.rameur1k;
  if (!ref) return a.delta >= 10 ? 'facile' : 'soutenu et régulier';
  return `${mmss(ref / 2 + a.delta)} /500 m`;
}

// Repères mesurés par la séance test (estimation du 10 km : 1 km × 10 × 1,12).
export function reperesDepuisTest(mesures) {
  const r = {};
  if (mesures.course1k) r.course10k = Math.round(mesures.course1k * 10 * 1.12);
  if (mesures.ski1k) r.ski1k = Math.round(mesures.ski1k);
  if (mesures.rameur1k) r.rameur1k = Math.round(mesures.rameur1k);
  return r;
}

// ---------- Plan vers une compétition ----------

/** Lundi (objet Date, en UTC) de la semaine d'une date AAAA-MM-JJ. */
function lundi(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

/** Objet Date → AAAA-MM-JJ. */
function iso(d) {
  return d.toISOString().slice(0, 10);
}

// Le plan démarre à la semaine qui contient demain (un dimanche, on prépare la semaine suivante).
function lundiDepart(aujourdHui) {
  const d = new Date(`${aujourdHui}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return lundi(iso(d));
}

// Nombre de semaines du lundi de cette semaine jusqu'à la semaine de la compétition incluse.
export function semainesRestantes(dateCompet, aujourdHui) {
  if (!dateCompet || dateCompet < aujourdHui) return 0;
  return Math.max(1, Math.round((lundi(dateCompet) - lundiDepart(aujourdHui)) / (7 * 86400000)) + 1);
}

/** Nombre de jours jusqu'à la compétition. */
export function joursRestants(dateCompet, aujourdHui) {
  return Math.round((new Date(`${dateCompet}T00:00:00Z`) - new Date(`${aujourdHui}T00:00:00Z`)) / 86400000);
}

/** Phase du plan selon le nombre de semaines restantes. */
export function phaseSemaine(restantes) {
  if (restantes <= 1) return 'Compétition';
  if (restantes === 2) return 'Pic';
  if (restantes > 8) return 'Base';
  return 'Construction';
}

// Répartition conseillée sur 3 séances : plus d'Hyrox quand la compétition approche.
export function repartitionConseillee(restantes) {
  if (!restantes || restantes > 8) return 1;
  return 2;
}

const ROTATION = {
  Base: ['course-facile', 'ergo', 'force-hyrox', 'intervalles-course'],
  Construction: ['course-ateliers', 'ergo', 'intervalles-course', 'force-hyrox'],
  Pic: ['demi-simulation', 'intervalles-course', 'ergo'],
};

// Plan complet : une entrée par semaine, de la semaine en cours à celle de la compétition.
export function genererPlan(profil, aujourdHui) {
  const total = semainesRestantes(profil.date, aujourdHui);
  const h = Math.min(3, Math.max(1, profil.hyroxParSemaine || 2));
  const plan = [];
  const debut = lundiDepart(aujourdHui);
  for (let i = 0; i < total; i++) {
    const restantes = total - i;
    const phase = phaseSemaine(restantes);
    const deb = new Date(debut.getTime() + i * 7 * 86400000);
    const fin = new Date(deb.getTime() + 6 * 86400000);
    let items;
    if (phase === 'Compétition') {
      items = [{ type: 'hyrox', id: 'activation' }, { type: 'competition' }];
    } else {
      const rot = ROTATION[phase];
      const hy = Array.from({ length: h }, (_, k) => ({ type: 'hyrox', id: rot[(i * h + k) % rot.length] }));
      const mu = Array.from({ length: 3 - h }, () => ({ type: 'muscu' }));
      items = phase === 'Pic' ? [...hy, ...mu] : [hy[0], ...mu.slice(0, 1), ...hy.slice(1), ...mu.slice(1)];
    }
    plan.push({ index: i, debut: iso(deb), fin: iso(fin), phase, items, restantes });
  }
  return plan;
}

// Séance libre suggérée : celle pas faite depuis le plus longtemps.
export function suggestionLibre(historique) {
  const derniere = (id) => historique.filter((s) => s.seance === `hyrox:${id}`).reduce((m, s) => (s.date > m ? s.date : m), '');
  return ['course-ateliers', 'ergo', 'intervalles-course', 'force-hyrox', 'course-facile']
    .sort((a, b) => (derniere(a) < derniere(b) ? -1 : derniere(a) > derniere(b) ? 1 : 0))[0];
}

// Nouvel ajustement après le ressenti : dur → un tour de moins la prochaine fois, facile → un de plus.
export function ajustement(avant, ressenti) {
  const d = ressenti === 'dur' ? -1 : ressenti === 'facile' ? 1 : 0;
  return Math.max(-2, Math.min(2, (avant || 0) + d));
}

// ---------- Circuits libres (composés par l'utilisateur) ----------
// Un circuit enregistré : { id, nom, tours, etapes: [etape] }.
// Une étape : { type, unite: 'm' | 'reps' | 's', valeur, charge (kg, ou null = charge de compétition),
//               exo (type 'muscu'), nom (type 'libre') }.

/**
 * Ce qu'on peut mettre dans un circuit. `unites` : réglages possibles (le premier est proposé par défaut),
 * `chargeCle` : charge de compétition correspondante (voir CHARGES), `pas` : pas du réglage par unité.
 */
export const STATIONS = [
  { id: 'course', nom: 'Course', libelle: 'course', dessin: 'h-course', unites: ['m', 's'], defaut: { m: 1000, s: 600 }, conseil: course(0).conseil },
  { id: 'ski', nom: 'SkiErg', libelle: 'SkiErg', dessin: 'h-ski', unites: ['m', 's'], defaut: { m: 1000, s: 300 }, conseil: ski(0).conseil },
  { id: 'rameur', nom: 'Rameur', libelle: 'rameur', dessin: 'h-rameur', unites: ['m', 's'], defaut: { m: 1000, s: 300 }, conseil: rameur(0).conseil },
  { id: 'sledPush', nom: 'Sled push', libelle: 'sled push', dessin: 'h-sled-push', unites: ['m'], defaut: { m: 50 }, chargeCle: 'sledPush', conseil: sledPush().conseil },
  { id: 'sledPull', nom: 'Sled pull', libelle: 'sled pull', dessin: 'h-sled-pull', unites: ['m'], defaut: { m: 50 }, chargeCle: 'sledPull', conseil: sledPull().conseil },
  { id: 'bbj', nom: 'Burpees sauts en longueur', libelle: 'burpees sauts en longueur', dessin: 'h-bbj', unites: ['m', 'reps'], defaut: { m: 80, reps: 20 }, conseil: bbj().conseil },
  { id: 'farmers', nom: 'Farmers carry', libelle: 'farmers carry', dessin: 'h-farmers', unites: ['m'], defaut: { m: 200 }, chargeCle: 'farmers', conseil: farmers().conseil },
  { id: 'fentes', nom: 'Fentes sac de sable', libelle: 'fentes sac de sable', dessin: 'h-fentes', unites: ['m', 'reps'], defaut: { m: 100, reps: 20 }, chargeCle: 'fentes', conseil: fentes().conseil },
  { id: 'wallBalls', nom: 'Wall balls', libelle: 'wall balls', dessin: 'h-wallball', unites: ['reps'], defaut: { reps: 100 }, chargeCle: 'wallball', conseil: wallBalls(0).conseil },
  { id: 'velo', nom: 'Vélo', libelle: 'vélo', dessin: 'h-velo', unites: ['s', 'm'], defaut: { s: 300, m: 2000 }, conseil: velo(0).conseil },
  { id: 'muscu', nom: 'Exercice de muscu', dessin: 'curl-halteres', unites: ['reps', 's'], defaut: { reps: 10, s: 45 } },
  { id: 'libre', nom: 'Étape libre', libelle: '', dessin: 'h-mobilite', unites: ['reps', 'm', 's'], defaut: { reps: 10, m: 200, s: 60 } },
  { id: 'repos', nom: 'Repos', libelle: 'repos', dessin: 'h-repos', unites: ['s'], defaut: { s: 60 } },
];

/** Pas des réglages selon l'unité et la valeur (plus fin pour les petites valeurs). */
export function pasValeur(unite, valeur) {
  if (unite === 'reps') return valeur < 20 ? 1 : 5;
  if (unite === 's') return valeur < 60 ? 5 : 15;
  return valeur < 100 ? 10 : valeur < 1000 ? 50 : 250;
}

/** Station d'une étape de circuit. */
export function station(id) {
  return STATIONS.find((x) => x.id === id) || null;
}

/** Durée lisible : 45 → « 45 s », 300 → « 5 min », 90 → « 1 min 30 ». */
export function dureeTexte(s) {
  if (s < 60) return `${s} s`;
  const r = s % 60;
  return r ? `${Math.floor(s / 60)} min ${String(r).padStart(2, '0')}` : `${s / 60} min`;
}

/** Nom affiché d'une étape : « 1 km course », « 100 wall balls », « 45 s Planche », « Repos 1 min ». */
export function texteEtapeCircuit(et) {
  const st = station(et.type);
  if (!st) return 'Étape';
  const def = et.type === 'muscu' ? exo(et.exo) : null;
  const quoi = et.type === 'muscu' ? (def?.nom || 'Exercice') : et.type === 'libre' ? (et.nom || 'Étape libre') : st.libelle;
  if (et.type === 'repos') return `Repos ${dureeTexte(et.valeur)}`;
  if (et.unite === 's') return `${dureeTexte(et.valeur)} ${quoi}`;
  if (et.unite === 'm') return `${dist(et.valeur)} ${quoi}`;
  return `${et.valeur} ${quoi}`;
}

/** Charge choisie, en texte (« sac de 10 kg »…) ; '' si l'étape n'en a pas. */
function texteChargeCircuit(et) {
  if (et.charge == null) return '';
  const c = nb(et.charge);
  switch (et.type) {
    case 'sledPush': case 'sledPull': return `${c} kg, traîneau compris`;
    case 'farmers': return `2 × ${c} kg`;
    case 'fentes': return `sac de ${c} kg`;
    case 'wallBalls': return `balle de ${c} kg`;
    default: return `${c} kg`;
  }
}

/**
 * Étape de circuit → étape de séance, comprise par l'écran de séance Hyrox.
 * Les étapes en durée (et les repos) passent toutes seules à la suivante (auto).
 */
export function etapeCircuit(et) {
  const st = station(et.type) || station('libre');
  const def = et.type === 'muscu' ? exo(et.exo) : null;
  const e = { texte: texteEtapeCircuit(et), dessin: def?.dessin || st.dessin, conseil: def?.conseil || st.conseil || '', auto: true };
  if (et.type === 'repos') return { ...e, repos: et.valeur };
  if (et.unite === 's') e.duree = et.valeur;
  if (et.type === 'course') e.allure = { type: 'course', mode: et.unite === 's' ? 'facile' : 'compromis' };
  if ((et.type === 'ski' || et.type === 'rameur') && et.unite === 'm') e.allure = { type: et.type, delta: 3 };
  if (et.charge != null) e.note = texteChargeCircuit(et);
  else if (st.chargeCle) Object.assign(e, { charge: st.chargeCle, intensite: 'compet' });
  return e;
}

/** Blocs de séance d'un circuit : un seul bloc, répété `tours` fois. */
export function blocsCircuit(c) {
  return [{ nom: 'Circuit', tours: Math.max(1, c.tours || 1), etapes: c.etapes.map(etapeCircuit) }];
}

/** Vrai si le circuit peut se lancer : au moins une étape qui n'est pas un repos. */
export function circuitValide(c) {
  return Boolean(c?.etapes?.some((et) => et.type !== 'repos'));
}

// Durée estimée d'une étape, en secondes (allures moyennes, pour donner un ordre d'idée).
const SECONDES_PAR_M = { course: 0.33, ski: 0.27, rameur: 0.26, sledPush: 1.8, sledPull: 2, bbj: 3.5, farmers: 0.6, fentes: 2.5, velo: 0.12, libre: 0.5 };
function dureeEtape(et) {
  if (et.unite === 's') return et.valeur;
  if (et.unite === 'reps') return et.valeur * (et.type === 'bbj' ? 6 : 3.5);
  return et.valeur * (SECONDES_PAR_M[et.type] ?? 0.5);
}

/** Durée estimée d'un circuit, en minutes arrondies à 5 (au moins 5). */
export function dureeCircuit(c) {
  const tour = c.etapes.reduce((t, et) => t + dureeEtape(et), 0);
  return Math.max(5, Math.round((tour * Math.max(1, c.tours || 1)) / 60 / 5) * 5);
}
