# Suivi muscu

Appli web pour suivre mes séances de musculation sur iPhone.

- Programme Push · Pull · Jambes, 3 séances par semaine
- Poids conseillé par double progression : quand toutes les séries atteignent le haut de la fourchette de reps, la charge suivante augmente
- Validation série par série, minuteur de récup automatique (calé sur l'heure de fin, juste à la seconde même après un verrouillage), léger clignotement à la fin
- Progression par exercice, catalogue avec conseils d'exécution (avec recherche)
- Planning de la semaine : semaine type (Réglages), semaine modifiable, séances faites / prévues / pas faites
- Séances enregistrées (« Mes séances ») et circuits Hyrox libres composés étape par étape
- Poids tapé au clavier (virgule acceptée : disques de 1,25 kg) ; choix du prochain exercice pendant la récup (machine prise)
- Fonctionne hors ligne une fois installée

## Installation sur iPhone

Ouvrir l'adresse GitHub Pages dans Safari, puis Partager → « Sur l'écran d'accueil ».

## Données

Tout reste sur le téléphone (aucune donnée personnelle dans ce dépôt).
Réglages → « Exporter une sauvegarde » pour garder une copie ; « Importer un fichier » accepte
une sauvegarde de l'appli ou l'ancien suivi Google Sheet exporté en CSV.

## Développement

Aucun outil de compilation : HTML, CSS et JavaScript modules.
Tests : `npm test` (Node 22). Penser à changer `VERSION` dans `js/etat.js` et `sw.js` à chaque mise en ligne,
et à lister tout nouveau fichier JS dans `sw.js`.

Couleurs : musculation en gris argent, Hyrox en jaune, haltérophilie en orange (variables en tête de `css/style.css`).

Hyrox (0.3) : profil (compétition à date ou libre), plan semaine par semaine jusqu'à la compétition, séances types guidées avec chronos (étapes, repos, EMOM), allures calculées depuis les repères, séance test.

## Organisation du code

Pas d'outil de construction : du HTML, du CSS et du JavaScript en modules, lus tels quels par le navigateur.

| Dossier / fichier | Rôle |
| --- | --- |
| `js/app.js` | Point d'entrée : choix de l'écran, clics, démarrage, mise à jour |
| `js/etat.js` | Données enregistrées (`d`) et état de l'affichage (`ui`) |
| `js/outils.js`, `js/commun.js` | Outils (dates, nombres) et éléments d'interface partagés |
| `js/composition.js`, `js/seance-muscu.js` | Composer une séance, dérouler une séance de musculation |
| `js/fenetres.js` | Fenêtres qui s'ouvrent par-dessus l'écran |
| `js/carte-muscles.js` | Silhouettes face et dos de la carte des muscles travaillés |
| `js/illustrations.js` | Schémas des exercices, dessinés par du code (muscle travaillé en rouge) |
| `js/ecrans/` | Un fichier par écran (l'accueil « Ma semaine » est dans `accueil.js`) ou groupe d'écrans, avec les actions de ses boutons. `planning.js` : fenêtre d'un jour, semaine type, « Mes séances » ; `circuit.js` : circuit Hyrox libre |
| `js/metier/` | Calculs sans affichage, couverts par les tests : catalogue, progression, bilans (muscles, records, sauvegarde), règles de récup, erreurs à éviter et échauffements (`conseils.js`), Hyrox et circuits libres, planning de la semaine (`planning.js`), import, stockage |
| `css/style.css` | Thèmes, composants, puis classes utilitaires (`u-…`) |
| `tests/*.test.js` | Tests des calculs : `npm test` |
| `tests/e2e/` | Parcours complet dans un iPhone simulé (`parcours.py`, pour comparer deux versions) et test des minuteurs avec la vraie horloge (`minuteur.py` : récup, retour automatique à l'exercice, chrono Hyrox, étapes automatiques d'un circuit) |
