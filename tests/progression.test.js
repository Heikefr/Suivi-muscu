import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestion, tendance, historiqueExo } from '../js/progression.js';
import { exo } from '../js/donnees.js';

const cible = { series: 3, repsMin: 8, repsMax: 10, recup: 90 };
const s = (date, exoId, reps, charge, ressenti = null) => ({
  id: date, date, debut: 0, seance: 'pull',
  exercices: [{ exo: exoId, series: reps.map((r) => ({ reps: r, charge, ressenti })) }],
});

test('premier essai : charge à choisir', () => {
  const r = suggestion(exo('tirage-horizontal'), cible, []);
  assert.equal(r.charge, null);
});

test('10 reps partout : on monte du pas de la machine', () => {
  const r = suggestion(exo('tirage-horizontal'), cible, [s('2026-11-01', 'tirage-horizontal', [10, 10, 10], 60)]);
  assert.equal(r.charge, 65);
});

test('haltères : +2 kg', () => {
  const r = suggestion(exo('dc-halteres'), cible, [s('2026-11-01', 'dc-halteres', [10, 10, 10], 22)]);
  assert.equal(r.charge, 24);
});

test('objectif atteint mais dur : même charge', () => {
  const r = suggestion(exo('tirage-horizontal'), cible, [s('2026-11-01', 'tirage-horizontal', [10, 10, 10], 60, 'dur')]);
  assert.equal(r.charge, 60);
});

test('8 reps : même charge', () => {
  const r = suggestion(exo('tirage-horizontal'), cible, [s('2026-11-01', 'tirage-horizontal', [8, 8, 8], 60)]);
  assert.equal(r.charge, 60);
});

test('deux séances sous l\'objectif : on allège', () => {
  const h = [s('2026-11-01', 'tirage-horizontal', [8, 7, 6], 60), s('2026-11-04', 'tirage-horizontal', [8, 7, 7], 60)];
  assert.equal(suggestion(exo('tirage-horizontal'), cible, h).charge, 55);
});

test('poids du corps : charge 0', () => {
  const r = suggestion(exo('tibialis'), { series: 3, repsMin: 15, repsMax: 20 }, []);
  assert.equal(r.charge, 0);
});

test('la dernière séance par date fait foi', () => {
  const h = [s('2026-11-08', 'tirage-horizontal', [10, 10, 10], 60), s('2026-11-01', 'tirage-horizontal', [8, 8, 8], 55)];
  assert.equal(historiqueExo(h, 'tirage-horizontal')[1].date, '2026-11-08');
  assert.equal(suggestion(exo('tirage-horizontal'), cible, h).charge, 65);
});

test('tendance', () => {
  const p = (c) => ({ series: [{ reps: 8, charge: c }] });
  assert.equal(tendance([p(55), p(55), p(60)]), 'hausse');
  assert.equal(tendance([p(22), p(22), p(22), p(22)]), 'stable');
  assert.equal(tendance([p(60), p(55)]), 'baisse');
});
