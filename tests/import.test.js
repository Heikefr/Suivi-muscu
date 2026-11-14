import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importerCsv, lireCsv, fusionner } from '../js/import.js';

// Exemple inventé, au format de l'export CSV Google Sheets (virgules décimales entre guillemets).
const CSV = `Date,Type Séance,Exercice,Séries,Reps / série,Charge (kg),Volume Total (kg),RPE,Notes
03/01/2026,Push (Pecs/Tri),Développé Couché Haltères,3,8,20,"480,0",8,Exemple
03/01/2026,Push (Pecs/Tri),Pec Fly / Pec Deck,3,8,25,"600,0","8,5",
05/01/2026,Leg Day,Mollets Assis (Hammer),3,15,20,900,7,
05/01/2026,Leg Day,Tibialis raises,3,15,0,0,7,
05/01/2026,Leg Day,Exercice maison,2,12,10,240,8,
`;

test('lecture CSV avec guillemets', () => {
  const l = lireCsv('a,"b,c",d\n1,2,3');
  assert.deepEqual(l[0], ['a', 'b,c', 'd']);
});

test('import du suivi Google Sheet', () => {
  const { seances, inconnus } = importerCsv(CSV);
  assert.equal(seances.length, 2);
  assert.equal(seances[0].date, '2026-01-03');
  assert.equal(seances[0].seance, 'push');
  assert.equal(seances[1].seance, 'jambes');
  const dc = seances[0].exercices[0];
  assert.equal(dc.exo, 'dc-halteres');
  assert.equal(dc.series.length, 3);
  assert.deepEqual(dc.series[0], { reps: 8, charge: 20, ressenti: 'correct' });
  assert.equal(seances[0].exercices[1].exo, 'pec-deck');
  assert.equal(seances[0].exercices[1].series[0].ressenti, 'dur');
  assert.equal(seances[1].exercices[0].exo, 'mollets-assis');
  assert.equal(seances[1].exercices[1].exo, 'tibialis');
  assert.deepEqual(inconnus, ['Exercice maison']);
});

test('réimporter ne crée pas de doublon', () => {
  const { seances } = importerCsv(CSV);
  const a = fusionner([], seances);
  const b = fusionner(a.historique, seances);
  assert.equal(b.historique.length, 2);
  assert.equal(b.ajoutees, 0);
});
