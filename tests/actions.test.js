import { test } from 'node:test';
import assert from 'node:assert/strict';

// Chaque bouton lance l'action qui porte son nom (data-action). Deux écrans qui
// déclarent la même action s'écrasent sans bruit : on le vérifie ici.
// Les écrans ne touchent au navigateur que lorsqu'on les appelle : un import suffit.
const FICHIERS = ['composition', 'hyrox-seance', 'hyrox', 'progression', 'reglages', 'seance', 'planning', 'circuit'];
const NAVIGATION = ['onglet', 'ecran', 'fermer', 'voile'];

test('aucune action en double entre les écrans', async () => {
  const vues = new Map(NAVIGATION.map((a) => [a, 'app.js']));
  for (const f of FICHIERS) {
    const { actions } = await import(`../js/ecrans/${f}.js`);
    for (const nom of Object.keys(actions)) {
      assert.ok(!vues.has(nom), `action « ${nom} » déclarée dans ${vues.get(nom)} et dans ${f}.js`);
      vues.set(nom, `${f}.js`);
    }
  }
  assert.ok(vues.size > 100);
});
