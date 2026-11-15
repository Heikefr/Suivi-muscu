// Import de l'ancien suivi Google Sheet (CSV) et des sauvegardes de l'appli (JSON).
// Fonctions pures : testées par tests/import.test.js.

import { exoDepuisNom, normaliser } from './donnees.js';

// Découpe un CSV (virgule ou point-virgule, champs entre guillemets).
export function lireCsv(texte) {
  const t = String(texte).replace(/^﻿/, '');
  const premiere = t.split(/\r?\n/, 1)[0] || '';
  const sep = (premiere.match(/;/g) || []).length > (premiere.match(/,/g) || []).length ? ';' : ',';
  const lignes = [];
  let ligne = [];
  let champ = '';
  let guillemets = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (guillemets) {
      if (c === '"' && t[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === sep) { ligne.push(champ); champ = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      ligne.push(champ); lignes.push(ligne); ligne = []; champ = '';
    } else champ += c;
  }
  if (champ !== '' || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes.filter((l) => l.some((c) => c.trim() !== ''));
}

function nombre(v) {
  const n = parseFloat(String(v || '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function dateIso(v) {
  const m = String(v || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const iso = String(v || '').trim().match(/^\d{4}-\d{2}-\d{2}$/);
  return iso ? iso[0] : null;
}

export function typeSeance(texte) {
  const n = normaliser(texte);
  if (n.includes('push')) return 'push';
  if (n.includes('pull')) return 'pull';
  if (n.includes('leg') || n.includes('jambe')) return 'jambes';
  return 'libre';
}

function ressentiDepuisRpe(rpe) {
  if (rpe == null) return null;
  if (rpe >= 8.5) return 'dur';
  if (rpe <= 7) return 'facile';
  return 'correct';
}

function slug(texte) {
  return normaliser(texte).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Transforme le CSV de l'onglet musculation en séances de l'appli.
// Renvoie { seances, inconnus } ; inconnus = noms d'exercices hors catalogue (gardés quand même).
export function importerCsv(texte) {
  const lignes = lireCsv(texte);
  const iEntete = lignes.findIndex((l) => l.some((c) => normaliser(c) === 'exercice'));
  if (iEntete < 0) throw new Error("Colonne « Exercice » introuvable dans le fichier.");
  const entete = lignes[iEntete].map(normaliser);
  const col = (...noms) => entete.findIndex((h) => noms.some((n) => h.startsWith(n)));
  const c = {
    date: col('date'), type: col('type'), exo: col('exercice'), series: col('serie'),
    reps: col('reps', 'rep'), charge: col('charge', 'poids'), rpe: col('rpe'),
  };
  if (c.date < 0 || c.series < 0 || c.reps < 0) throw new Error('Colonnes Date, Séries ou Reps introuvables.');

  const parDate = new Map();
  const inconnus = new Set();
  for (const l of lignes.slice(iEntete + 1)) {
    const date = dateIso(l[c.date]);
    const nom = (l[c.exo] || '').trim();
    const nb = nombre(l[c.series]);
    const reps = nombre(l[c.reps]);
    if (!date || !nom || !nb || !reps) continue;
    const def = exoDepuisNom(nom);
    if (!def) inconnus.add(nom);
    const charge = c.charge >= 0 ? nombre(l[c.charge]) || 0 : 0;
    const ressenti = ressentiDepuisRpe(c.rpe >= 0 ? nombre(l[c.rpe]) : null);
    const series = Array.from({ length: Math.round(nb) }, () => ({ reps: Math.round(reps), charge, ressenti }));
    const type = c.type >= 0 ? typeSeance(l[c.type]) : 'libre';
    if (!parDate.has(date)) {
      parDate.set(date, {
        id: `import-${date}`, date, debut: 0, fin: 0, seance: type,
        nom: c.type >= 0 ? (l[c.type] || '').trim() : 'Séance', importee: true, exercices: [],
      });
    }
    const s = parDate.get(date);
    if (s.seance === 'libre' && type !== 'libre') s.seance = type;
    s.exercices.push({ exo: def ? def.id : `x-${slug(nom)}`, nom: def ? def.nom : nom, series });
  }
  return { seances: [...parDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1)), inconnus: [...inconnus] };
}

// Fusionne des séances dans l'historique (une séance de même id est remplacée).
export function fusionner(historique, seances) {
  const parId = new Map(historique.map((s) => [s.id, s]));
  let ajoutees = 0;
  for (const s of seances) {
    if (!parId.has(s.id)) ajoutees++;
    parId.set(s.id, s);
  }
  const res = [...parId.values()].sort((a, b) => (a.date === b.date ? (a.debut || 0) - (b.debut || 0) : a.date < b.date ? -1 : 1));
  return { historique: res, ajoutees };
}
