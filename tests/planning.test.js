import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vide } from '../js/metier/stockage.js';
import {
  ajouterPrevu, categorie, cleDeSeance, definirCompo, deplacerPrevu, etatSemaine, figer, joursDe, lundiDe,
  nettoyer, planSemaine, revenirSemaineType, semaineModifiee, supprimerPrevu,
} from '../js/metier/planning.js';

// Semaine du lundi 16 novembre 2026 ; « aujourd'hui » = mercredi 18.
const LUNDI = '2026-11-16';
const AUJ = '2026-11-18';
const donnees = () => {
  const d = vide();
  d.semaineType = { 0: ['push'], 2: ['pull'], 4: ['jambes', 'hyrox'] };
  return d;
};
const seance = (date, id, extra = {}) => ({ id: `s${date}${id}`, date, debut: 1, seance: id, nom: id, exercices: [], ...extra });

test('dates de la semaine', () => {
  assert.equal(lundiDe('2026-11-18'), LUNDI);
  assert.equal(lundiDe('2026-11-22'), LUNDI); // dimanche
  assert.equal(lundiDe('2026-11-16'), LUNDI);
  assert.deepEqual(joursDe(LUNDI), ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
  assert.equal(lundiDe('2026-03-31'), '2026-03-30'); // changement d'heure
});

test('la semaine type remplit chaque semaine', () => {
  const d = donnees();
  const plan = planSemaine(d, LUNDI);
  assert.deepEqual(plan['2026-11-16'].map((x) => x.cle), ['push']);
  assert.deepEqual(plan['2026-11-20'].map((x) => x.cle), ['jambes', 'hyrox']);
  assert.deepEqual(plan['2026-11-17'], []);
  assert.deepEqual(planSemaine(d, '2026-11-23')['2026-11-25'].map((x) => x.cle), ['pull']);
  assert.equal(semaineModifiee(d, LUNDI), false);
});

test('modifier une semaine ne touche ni la semaine type ni les autres semaines', () => {
  const d = donnees();
  const p = planSemaine(d, LUNDI)['2026-11-18'][0];
  deplacerPrevu(d, '2026-11-18', p.id, '2026-11-19');
  ajouterPrevu(d, '2026-11-21', 'hyrox');
  const plan = planSemaine(d, LUNDI);
  assert.deepEqual(plan['2026-11-18'], []);
  assert.deepEqual(plan['2026-11-19'].map((x) => x.cle), ['pull']);
  assert.equal(plan['2026-11-19'][0].id, p.id); // même identifiant après le décalage
  assert.deepEqual(plan['2026-11-21'].map((x) => x.cle), ['hyrox']);
  assert.deepEqual(d.semaineType[2], ['pull']);
  // La semaine type change : la semaine modifiée ne bouge plus, la suivante suit.
  d.semaineType[0] = ['jambes'];
  assert.deepEqual(planSemaine(d, LUNDI)['2026-11-16'].map((x) => x.cle), ['push']);
  assert.deepEqual(planSemaine(d, '2026-11-23')['2026-11-23'].map((x) => x.cle), ['jambes']);
  revenirSemaineType(d, LUNDI);
  assert.deepEqual(planSemaine(d, LUNDI)['2026-11-16'].map((x) => x.cle), ['jambes']);
});

test('décaler vers la semaine suivante, supprimer, composer à l\'avance', () => {
  const d = donnees();
  const j = planSemaine(d, LUNDI)['2026-11-20'][0];
  deplacerPrevu(d, '2026-11-20', j.id, '2026-11-23');
  assert.deepEqual(planSemaine(d, LUNDI)['2026-11-20'].map((x) => x.cle), ['hyrox']);
  assert.deepEqual(planSemaine(d, '2026-11-23')['2026-11-23'].map((x) => x.cle), ['push', 'jambes']);
  const h = planSemaine(d, LUNDI)['2026-11-20'][0];
  supprimerPrevu(d, '2026-11-20', h.id);
  assert.deepEqual(planSemaine(d, LUNDI)['2026-11-20'], []);
  const compo = [{ exo: 'presse', cible: { series: 3, repsMin: 10, repsMax: 12 } }];
  definirCompo(d, '2026-11-23', j.id, compo);
  assert.deepEqual(planSemaine(d, '2026-11-23')['2026-11-23'][1].compo, compo);
  definirCompo(d, '2026-11-23', j.id, null);
  assert.equal(planSemaine(d, '2026-11-23')['2026-11-23'][1].compo, undefined);
});

test('séances enregistrées supprimées : la séance prévue disparaît', () => {
  const d = donnees();
  d.seancesPerso = [{ id: 'a', nom: 'Haut du corps', exercices: ['pompes'] }];
  d.circuits = [{ id: 'c', nom: 'Stations', tours: 2, etapes: [{ type: 'course', unite: 'm', valeur: 500 }] }];
  ajouterPrevu(d, '2026-11-17', 'perso:a');
  ajouterPrevu(d, '2026-11-17', 'circuit:c');
  assert.equal(planSemaine(d, LUNDI)['2026-11-17'].length, 2);
  d.seancesPerso = [];
  assert.deepEqual(planSemaine(d, LUNDI)['2026-11-17'].map((x) => x.cle), ['circuit:c']);
});

test('fait, prévu, pas fait', () => {
  const d = donnees();
  d.historique = [
    seance('2026-11-16', 'pull'), // Pull fait à la place du Push prévu : compte comme fait
    seance('2026-11-18', 'hyrox:ergo'), // pas de Pull aujourd'hui pour l'instant : Hyrox ne le remplace pas
  ];
  const e = etatSemaine(d, LUNDI, AUJ);
  assert.equal(e['2026-11-16'].prevus[0].statut, 'faite');
  assert.equal(e['2026-11-16'].prevus[0].seance.seance, 'pull');
  assert.equal(e['2026-11-18'].prevus[0].statut, 'prevue');
  assert.equal(e['2026-11-18'].faites.length, 1);
  assert.equal(e['2026-11-20'].prevus[1].statut, 'prevue');
  // Le lendemain, le Pull du mercredi est « pas fait ».
  assert.equal(etatSemaine(d, LUNDI, '2026-11-19')['2026-11-18'].prevus[0].statut, 'pas-faite');
});

test('rapprochement : séance lancée depuis le planning d\'abord, puis la même séance', () => {
  const d = donnees();
  d.semaineType = { 4: ['jambes', 'push'] };
  const [j, p] = planSemaine(d, LUNDI)['2026-11-20'];
  d.historique = [seance('2026-11-20', 'push', { plan: j.id }), seance('2026-11-20', 'jambes')];
  const e = etatSemaine(d, LUNDI, '2026-11-21')['2026-11-20'].prevus;
  assert.equal(e[0].seance.plan, j.id);
  assert.equal(e[1].seance.seance, 'jambes');
  assert.ok(p);
});

test('clés et univers', () => {
  assert.equal(cleDeSeance({ seance: 'hyrox:circuit:abc' }), 'circuit:abc');
  assert.equal(cleDeSeance({ seance: 'hyrox:ergo' }), 'hyrox');
  assert.equal(cleDeSeance({ seance: 'perso:p1' }), 'perso:p1');
  assert.equal(categorie('circuit:abc'), 'hyrox');
  assert.equal(categorie('perso:p1'), 'muscu');
});

test('les vieilles semaines modifiées sont oubliées', () => {
  const d = donnees();
  figer(d, '2026-08-03');
  figer(d, LUNDI);
  nettoyer(d, AUJ);
  assert.deepEqual(Object.keys(d.semaines), [LUNDI]);
});
