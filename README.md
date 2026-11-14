# Suivi muscu

Appli web pour suivre mes séances de musculation sur iPhone.

- Programme Push · Pull · Jambes, 3 séances par semaine
- Poids conseillé par double progression : quand toutes les séries atteignent le haut de la fourchette de reps, la charge suivante augmente
- Validation série par série, minuteur de récup automatique (calé sur l'heure de fin, juste à la seconde même après un verrouillage), léger clignotement à la fin
- Progression par exercice, catalogue avec conseils d'exécution
- Fonctionne hors ligne une fois installée

## Installation sur iPhone

Ouvrir l'adresse GitHub Pages dans Safari, puis Partager → « Sur l'écran d'accueil ».

## Données

Tout reste sur le téléphone (aucune donnée personnelle dans ce dépôt).
Réglages → « Exporter une sauvegarde » pour garder une copie ; « Importer un fichier » accepte
une sauvegarde de l'appli ou l'ancien suivi Google Sheet exporté en CSV.

## Développement

Aucun outil de compilation : HTML, CSS et JavaScript modules.
Tests : `npm test` (Node 22). Penser à changer `VERSION` dans `sw.js` à chaque mise en ligne.

Prévu pour la version 2 : course et entraînements Hyrox.
