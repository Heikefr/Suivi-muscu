import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lireNombre, nb } from '../js/outils.js';

test('poids tapés au clavier : virgule ou point', () => {
  assert.equal(lireNombre('21,25'), 21.25);
  assert.equal(lireNombre('1.25'), 1.25);
  assert.equal(lireNombre(' 102,5 '), 102.5);
  assert.equal(lireNombre('20'), 20);
  assert.equal(lireNombre('0'), 0);
  assert.equal(lireNombre(''), null);
  assert.equal(lireNombre('abc'), null);
  assert.equal(lireNombre('-3'), null);
  assert.equal(lireNombre('1,2,5'), null);
});

test('affichage au centième (disques de 1,25 kg)', () => {
  assert.equal(nb(1.25), '1,25');
  assert.equal(nb(21.25), '21,25');
  assert.equal(nb(22.5), '22,5');
  assert.equal(nb(40), '40');
  assert.equal(nb(0.1 + 0.2), '0,3');
});
