import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEANCES_HYROX, genererPlan, semainesRestantes, phaseSemaine, allureTexte, lireTemps, ecrireTemps,
  reperesDepuisTest, suggestionLibre, ajustement, repartitionConseillee,
} from '../js/hyrox.js';
import { dessinExiste } from '../js/illustrations.js';

test('toutes les étapes ont un schéma', () => {
  for (const s of SEANCES_HYROX) {
    for (const b of s.blocs(0)) for (const e of b.etapes) assert.ok(dessinExiste(e.dessin), `${s.id} : ${e.dessin}`);
  }
});

test('compétition du 20/12 vue le dimanche 15/11 : 5 semaines, construction puis pic puis compétition', () => {
  assert.equal(semainesRestantes('2026-12-20', '2026-11-15'), 5);
  assert.equal(semainesRestantes('2026-12-20', '2026-11-18'), 5);
  const plan = genererPlan({ date: '2026-12-20', hyroxParSemaine: 2 }, '2026-11-15');
  assert.deepEqual(plan.map((w) => w.phase), ['Construction', 'Construction', 'Construction', 'Pic', 'Compétition']);
  assert.equal(plan[0].debut, '2026-11-16');
  assert.equal(plan[4].fin, '2026-12-20');
  for (const w of plan.slice(0, 4)) assert.equal(w.items.length, 3);
  assert.equal(plan[0].items.filter((x) => x.type === 'hyrox').length, 2);
  assert.equal(plan[3].items[0].id, 'demi-simulation');
  assert.deepEqual(plan[4].items.map((x) => x.id || x.type), ['activation', 'competition']);
});

test('date passée : pas de plan', () => {
  assert.equal(genererPlan({ date: '2026-10-01', hyroxParSemaine: 2 }, '2026-11-15').length, 0);
});

test('phases et répartition conseillée', () => {
  assert.equal(phaseSemaine(12), 'Base');
  assert.equal(phaseSemaine(5), 'Construction');
  assert.equal(repartitionConseillee(12), 1);
  assert.equal(repartitionConseillee(5), 2);
});

test('allures calculées depuis les repères', () => {
  const r = { course10k: 3300, rameur1k: 250, ski1k: 270 };
  assert.equal(allureTexte({ allure: { type: 'course', mode: '10k' } }, r), '5:30 /km');
  assert.equal(allureTexte({ allure: { type: 'course', mode: 'compromis' } }, r), '5:45 /km');
  assert.equal(allureTexte({ allure: { type: 'rameur', delta: 3 } }, r), '2:08 /500 m');
  assert.equal(allureTexte({ allure: { type: 'ski', delta: 3 } }, {}), 'soutenu et régulier');
});

test('saisie des temps', () => {
  assert.equal(lireTemps('55:00'), 3300);
  assert.equal(lireTemps('1:02:30'), 3750);
  assert.equal(lireTemps('abc'), null);
  assert.equal(ecrireTemps(3750), '1:02:30');
  assert.equal(ecrireTemps(500), '8:20');
});

test('repères mesurés par la séance test', () => {
  assert.deepEqual(reperesDepuisTest({ course1k: 300, ski1k: 270 }), { course10k: 3360, ski1k: 270 });
});

test('suggestion libre et ajustement', () => {
  const h = [{ seance: 'hyrox:course-ateliers', date: '2026-11-10' }, { seance: 'hyrox:ergo', date: '2026-11-12' }];
  assert.equal(suggestionLibre(h), 'intervalles-course');
  assert.equal(ajustement(0, 'dur'), -1);
  assert.equal(ajustement(2, 'facile'), 2);
});
