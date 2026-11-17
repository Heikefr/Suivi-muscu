import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCICES, exo } from '../js/metier/donnees.js';
import {
  musclePrincipal, seriesParMuscle, niveauMuscle, musclesOublies, meilleureSerie, records, nouveauxRecords,
  rappelSauvegarde, CORPS_ENTIER,
} from '../js/metier/bilan.js';
import { MUSCLES_CARTE } from '../js/carte-muscles.js';

const serie = (charge, reps) => ({ charge, reps, ressenti: null });
const seance = (date, exos, extra = {}) => ({ id: date, date, seance: 'push', exercices: exos.map(([id, series]) => ({ exo: id, nom: id, series })), ...extra });

test('chaque exercice a un muscle principal que la carte sait montrer', () => {
  for (const e of EXERCICES) {
    const m = musclePrincipal(e);
    assert.ok(m === CORPS_ENTIER || MUSCLES_CARTE.includes(m), `${e.nom} → ${m}`);
  }
  assert.equal(musclePrincipal(exo('dc-barre')), 'Pecs');
});

test('séries par muscle sur la semaine', () => {
  const h = [
    seance('2026-11-09', [['dc-barre', [serie(60, 8), serie(60, 8), serie(60, 7)]]]),
    seance('2026-11-11', [['dc-halteres', [serie(20, 10)]]]),
    seance('2026-11-01', [['dc-barre', [serie(60, 8)]]]),
    seance('2026-11-10', [['dc-barre', [serie(60, 8)]]], { importee: true }),
  ];
  const r = seriesParMuscle(h, '2026-11-09', '2026-11-15', exo);
  assert.deepEqual(r, { compte: { Pecs: 4 }, seances: 2, series: 4 });
  assert.deepEqual([0, 5, 6, 11, 12].map(niveauMuscle), [0, 1, 2, 2, 3]);
  const o = musclesOublies(r.compte);
  assert.ok(!o.muscles.includes('Pecs') && o.muscles.includes('Dos'));
  assert.deepEqual(o.seances, ['Push', 'Pull', 'Jambes']);
});

test('records : la plus lourde, puis le plus de répétitions', () => {
  assert.deepEqual(meilleureSerie([serie(60, 8), serie(62.5, 5), serie(62.5, 6), serie(70, 0)]), { charge: 62.5, reps: 6 });
  const avant = [seance('2026-11-01', [['dc-barre', [serie(60, 8)]], ['dips', [serie(0, 10)]]])];
  const s = seance('2026-11-08', [['dc-barre', [serie(60, 9)]], ['dips', [serie(0, 10)]], ['squat', [serie(80, 5)]]]);
  const n = nouveauxRecords(avant, s);
  assert.equal(n.length, 1);
  assert.deepEqual([n[0].exo, n[0].reps, n[0].avant.reps], ['dc-barre', 9, 8]);
  assert.equal(records([...avant, s])['dc-barre'].date, '2026-11-08');
});

test('rappel de sauvegarde', () => {
  const h = (dates) => dates.map((d) => seance(d, []));
  assert.equal(rappelSauvegarde({ derniere: null, rappel: 7 }, h(['2026-11-01']), '2026-11-15'), null);
  assert.deepEqual(rappelSauvegarde(undefined, h(['2026-11-01', '2026-11-03', '2026-11-05']), '2026-11-15'), { jours: null });
  assert.deepEqual(rappelSauvegarde({ derniere: '2026-11-06', rappel: 7 }, h(['2026-11-10']), '2026-11-15'), { jours: 9 });
  assert.equal(rappelSauvegarde({ derniere: '2026-11-10', rappel: 7 }, h(['2026-11-12']), '2026-11-15'), null);
  assert.equal(rappelSauvegarde({ derniere: '2026-11-06', rappel: 7 }, h(['2026-11-01']), '2026-11-15'), null);
  assert.equal(rappelSauvegarde({ derniere: '2026-11-01', rappel: 0 }, h(['2026-11-10']), '2026-11-15'), null);
});
