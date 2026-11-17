import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCICES, exo } from '../js/metier/donnees.js';
import { dessinExiste } from '../js/illustrations.js';
import {
  CATEGORIES_RECUP, categorieRecup, dureeRecup, recupCategorie, ERREURS, ECHAUFFEMENTS, echauffementPour,
} from '../js/metier/conseils.js';

test('chaque exercice a une catégorie de récup et une erreur à éviter', () => {
  const ids = CATEGORIES_RECUP.map((c) => c.id);
  for (const e of EXERCICES) {
    assert.ok(ids.includes(categorieRecup(e)), e.id);
    assert.ok(ERREURS[e.id], `erreur manquante : ${e.id}`);
  }
  // Pas d'erreur pour un exercice qui n'existe pas (faute de frappe).
  for (const id of Object.keys(ERREURS)) assert.ok(exo(id), `exercice inconnu : ${id}`);
});

test('règle de récup', () => {
  assert.equal(dureeRecup(exo('squat-barre')), 150);
  assert.equal(dureeRecup(exo('dc-halteres')), 120);
  assert.equal(dureeRecup(exo('curl-barre')), 75);
  assert.equal(dureeRecup(exo('planche')), 45);
  assert.equal(dureeRecup(exo('arrache')), 150);
});

test('réglages : exercice, puis catégorie, puis règle', () => {
  const r = { recupCat: { isolation: 60 }, recupExo: { 'curl-marteau': 90 } };
  assert.equal(dureeRecup(exo('curl-barre'), r), 60);
  assert.equal(dureeRecup(exo('curl-marteau'), r), 90);
  assert.equal(dureeRecup(exo('squat-barre'), r), 150);
  assert.equal(recupCategorie('base', {}), 120);
});

test('échauffement selon la séance', () => {
  for (const e of Object.values(ECHAUFFEMENTS)) assert.ok(dessinExiste(e.dessin), e.dessin);
  assert.equal(echauffementPour('pull', []), 'pull');
  assert.equal(echauffementPour('perso:x', ['push', 'push', 'pull']), 'push');
  assert.equal(echauffementPour('perso', ['haltero', 'haltero', 'push']), 'jambes');
  assert.equal(echauffementPour('perso', []), 'jambes');
});
