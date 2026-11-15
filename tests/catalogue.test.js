import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCICES, SEANCES, GROUPES, exo } from '../js/donnees.js';
import { dessinExiste } from '../js/illustrations.js';
import { choisirPourCase, planHaltero, bilanHaltero } from '../js/progression.js';

test('catalogue cohérent', () => {
  const ids = new Set();
  for (const e of EXERCICES) {
    assert.ok(!ids.has(e.id), `id en double : ${e.id}`);
    ids.add(e.id);
    assert.ok(dessinExiste(e.dessin), `schéma manquant : ${e.id}`);
    assert.ok(GROUPES.includes(e.groupe), `groupe inconnu : ${e.id}`);
    assert.ok(e.conseil.length > 20, `conseil manquant : ${e.id}`);
    if (e.type === 'haltero') assert.equal(e.pcts.length, e.cible.series, `pcts/séries : ${e.id}`);
  }
  assert.ok(EXERCICES.length >= 60);
  for (const s of SEANCES) for (const c of s.cases) for (const o of c.options) assert.ok(exo(o), `option inconnue ${o}`);
});

const s = (date, seance, exoId, charge, reps = [8, 8, 8]) => ({
  id: date, date, debut: 0, seance, exercices: [{ exo: exoId, series: reps.map((r) => ({ reps: r, charge })) }],
});
const cas = { role: 'Pecs', principal: true, options: ['dc-halteres', 'dc-barre', 'machine-pecs'] };

test('suggestion : jamais fait → premier choix', () => {
  assert.equal(choisirPourCase(cas, [], [], 'push').exo, 'dc-halteres');
});

test('suggestion : progresse → on garde', () => {
  const h = [s('2026-11-01', 'push', 'dc-halteres', 20), s('2026-11-05', 'push', 'dc-halteres', 22)];
  assert.equal(choisirPourCase(cas, h, [], 'push').exo, 'dc-halteres');
});

test('suggestion : 3 séances au même poids → variante jamais faite', () => {
  const h = ['2026-11-01', '2026-11-05', '2026-11-09'].map((dt) => s(dt, 'push', 'dc-halteres', 22));
  const r = choisirPourCase(cas, h, [], 'push');
  assert.equal(r.exo, 'dc-barre');
  assert.match(r.raison, /même poids depuis 3 séances/);
});

test('suggestion : exercice exclu jamais proposé', () => {
  const h = ['2026-11-01', '2026-11-05', '2026-11-09'].map((dt) => s(dt, 'push', 'dc-halteres', 22));
  assert.equal(choisirPourCase(cas, h, ['dc-barre'], 'push').exo, 'machine-pecs');
});

test('suggestion : secondaire fait 2 fois de suite → on varie', () => {
  const sec = { role: 'Biceps', options: ['curl-poulie', 'curl-marteau'] };
  const h = [s('2026-11-01', 'pull', 'curl-poulie', 20, [10, 10, 9]), s('2026-11-05', 'pull', 'curl-poulie', 22, [10, 9, 9])];
  assert.equal(choisirPourCase(sec, h, [], 'pull').exo, 'curl-marteau');
});

test('haltéro : plan en % du record', () => {
  assert.deepEqual(planHaltero(exo('arrache'), 60), [30, 42, 45, 45, 45]);
  assert.deepEqual(planHaltero(exo('arrache'), null), [null, null, null, null, null]);
});

test('haltéro : tout réussi → +2,5 %, record battu', () => {
  const series = [{ reps: 2, charge: 40 }, { reps: 2, charge: 62 }];
  const b = bilanHaltero(exo('arrache'), series, 2, 60, 0);
  assert.equal(b.decalage, 2.5);
  assert.equal(b.record, 62);
  assert.ok(b.recordBattu);
});

test('haltéro : reps ratées → on baisse ; record inconnu → estimé', () => {
  const b = bilanHaltero(exo('arrache'), [{ reps: 1, charge: 40 }, { reps: 1, charge: 40 }], 2, 60, 0);
  assert.equal(b.decalage, -2.5);
  const e = bilanHaltero(exo('arrache'), [{ reps: 2, charge: 40 }], 2, null, 0);
  assert.equal(e.record, 50);
  assert.equal(e.recordBattu, false);
});
