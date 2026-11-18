// Catalogue des exercices et programmes de séances.
// Aucune donnée personnelle ici : l'historique vit uniquement sur le téléphone.

export const GROUPES = [
  'Pecs', 'Épaules', 'Triceps', 'Dos', 'Biceps',
  'Quadriceps et fessiers', 'Ischios et fessiers', 'Mollets et tibias', 'Gainage', 'Haltérophilie',
];

export const FAMILLES = [
  ['tous', 'Tous'], ['push', 'Push'], ['pull', 'Pull'], ['jambes', 'Jambes'], ['gainage', 'Gainage'], ['haltero', 'Haltéro'],
];

// Raccourci : x(id, nom, groupe, famille, muscles, materiel, increment, dessin, cible, conseil, options)
// cible = [séries, reps min, reps max, récup en s]
// materiel 'halteres' : charge affichée par haltère ; 'corps' : poids du corps.
function x(id, nom, groupe, famille, muscles, materiel, increment, dessin, cible, conseil, opts = {}) {
  return {
    id, nom, groupe, famille, muscles, materiel, increment, dessin, conseil,
    cible: { series: cible[0], repsMin: cible[1], repsMax: cible[2], recup: cible[3] },
    poidsDuCorps: materiel === 'corps',
    alias: opts.alias || [],
    ...opts,
  };
}

const LOURD = [3, 8, 10, 120];
const MOYEN = [3, 8, 10, 90];
const ISO = [3, 10, 12, 75];
const ISO_LEGER = [3, 12, 15, 60];
const MOLLETS = [3, 15, 20, 60];

export const EXERCICES = [
  // ---------- Pecs ----------
  x('dc-barre', 'Développé couché barre', 'Pecs', 'push', 'Pecs · triceps · épaules', 'barre', 2.5, 'couche-barre', LOURD,
    "Omoplates serrées, pieds au sol. Descends la barre au bas des pecs, coudes à 45°, et pousse sans décoller les fesses."),
  x('dc-halteres', 'Développé couché haltères', 'Pecs', 'push', 'Pecs · triceps · épaules', 'halteres', 2, 'couche', LOURD,
    "Omoplates serrées contre le banc. Descends les haltères à la poitrine en 2 secondes, coudes à 45°.",
    { alias: ['developpe couche halteres', 'developpe couche'] }),
  x('dc-smith', 'Développé couché à la Smith', 'Pecs', 'push', 'Pecs · triceps', 'barre', 2.5, 'smith', LOURD,
    "Règle le banc pour que la barre arrive au bas des pecs. Trajectoire guidée : concentre-toi sur la descente lente."),
  x('incline-barre', 'Développé incliné barre', 'Pecs', 'push', 'Haut des pecs · épaules', 'barre', 2.5, 'incline-barre', MOYEN,
    "Banc à 30°. Descends la barre sous les clavicules, coudes légèrement rentrés."),
  x('incline-halteres', 'Développé incliné haltères', 'Pecs', 'push', 'Haut des pecs · épaules', 'halteres', 2, 'incline', MOYEN,
    "Banc à 30° maximum. Pousse vers le haut sans cogner les haltères, garde les épaules basses.",
    { alias: ['developpe incline halteres', 'developpe incline'] }),
  x('machine-pecs', 'Machine guidée pecs', 'Pecs', 'push', 'Pecs · triceps', 'machine', 5, 'machine-pecs', MOYEN,
    "Poignées à hauteur de poitrine. Pousse sans verrouiller les coudes, retour lent.",
    { alias: ['machine guidee pecs', 'machine guidee pectoraux', 'technogym pectoral machine'] }),
  x('machine-inclinee', 'Machine inclinée guidée', 'Pecs', 'push', 'Haut des pecs · épaules', 'machine', 5, 'machine-inclinee', MOYEN,
    "Dos plaqué au dossier. Pousse vers le haut et l'avant, contrôle la descente sur 2 secondes.",
    { alias: ['machine inclinee guidee', 'machine inclinee'] }),
  x('pec-deck', 'Pec deck', 'Pecs', 'push', 'Pecs', 'machine', 5, 'ecarte', ISO,
    "Coudes légèrement fléchis et fixes. Ramène les bras devant toi et tiens 1 seconde.",
    { alias: ['pec fly / pec deck', 'pec fly', 'pec deck'] }),
  x('ecarte-poulie', 'Écarté poulie vis-à-vis', 'Pecs', 'push', 'Pecs', 'poulie', 2.5, 'ecarte-poulie', ISO,
    "Un pas en avant, buste légèrement penché. Ramène les mains devant le bas des pecs en gardant les coudes fixes."),
  x('dips', 'Dips', 'Pecs', 'push', 'Bas des pecs · triceps', 'corps', 0, 'dips', [3, 6, 12, 90],
    "Buste penché en avant pour les pecs. Descends jusqu'à 90° aux coudes, pas plus bas si les épaules tirent."),
  x('pompes', 'Pompes', 'Pecs', 'push', 'Pecs · triceps · gainage', 'corps', 0, 'pompes', [3, 10, 20, 60],
    "Corps gainé en planche, mains un peu plus larges que les épaules. Poitrine jusqu'à 5 cm du sol."),

  // ---------- Épaules ----------
  x('developpe-militaire', 'Développé militaire haltères', 'Épaules', 'push', 'Épaules · triceps', 'halteres', 2, 'militaire', MOYEN,
    "Assis, dos contre le dossier. Pousse au-dessus de la tête sans cambrer, redescends aux oreilles.",
    { alias: ['developpe militaire'] }),
  x('militaire-barre', 'Développé militaire barre', 'Épaules', 'push', 'Épaules · triceps · gainage', 'barre', 2.5, 'militaire-barre', MOYEN,
    "Debout, fessiers et abdos serrés. Pousse la barre à la verticale en passant la tête sous la barre en haut."),
  x('machine-epaules', 'Machine épaules', 'Épaules', 'push', 'Épaules · triceps', 'machine', 5, 'machine-epaules', MOYEN,
    "Poignées à hauteur d'oreilles au départ. Pousse sans verrouiller les coudes, redescends lentement."),
  x('elevations-laterales', 'Élévations latérales haltères', 'Épaules', 'push', 'Épaules (côté)', 'halteres', 2, 'elevation', ISO_LEGER,
    "Monte les bras sur les côtés jusqu'à l'horizontale, coudes un peu fléchis. Pas d'élan.",
    { alias: ['elevations laterales'] }),
  x('elevations-poulie', 'Élévation latérale poulie', 'Épaules', 'push', 'Épaules (côté)', 'poulie', 2.5, 'elevation-poulie', ISO_LEGER,
    "Poulie basse, câble devant toi. Monte le bras sur le côté jusqu'à l'horizontale, tension constante."),
  x('oiseau', 'Oiseau (reverse pec deck)', 'Épaules', 'pull', "Arrière d'épaule · haut du dos", 'machine', 5, 'oiseau', ISO_LEGER,
    "Poitrine contre le dossier. Ouvre les bras vers l'arrière, coudes fixes, sans hausser les épaules."),

  // ---------- Triceps ----------
  x('triceps-poulie', 'Extension triceps poulie (corde)', 'Triceps', 'push', 'Triceps', 'poulie', 2.5, 'triceps', [3, 8, 12, 60],
    "Coudes collés au corps et immobiles. Tends complètement en écartant la corde, remonte lentement.",
    { alias: ['extension triceps poulie', 'triceps poulie'] }),
  x('triceps-barre-poulie', 'Extension triceps poulie (barre)', 'Triceps', 'push', 'Triceps', 'poulie', 2.5, 'triceps-barre', [3, 8, 12, 60],
    "Coudes fixes contre les côtes. Pousse la barre jusqu'aux cuisses, bras tendus, sans pencher le buste."),
  x('barre-front', 'Barre au front', 'Triceps', 'push', 'Triceps', 'barre', 2.5, 'barre-front', [3, 8, 12, 75],
    "Allongé, bras verticaux. Plie seulement les coudes pour amener la barre vers le front, puis tends."),
  x('extension-nuque', 'Extension nuque haltère', 'Triceps', 'push', 'Triceps (longue portion)', 'halteres', 2, 'extension-nuque', [3, 10, 12, 60],
    "Assis, haltère tenu à deux mains derrière la tête. Coudes pointés vers le haut, tends les bras."),
  x('machine-dips', 'Machine dips', 'Triceps', 'push', 'Triceps · bas des pecs', 'machine', 5, 'machine-dips', [3, 8, 12, 75],
    "Assis droit, pousse les poignées vers le bas jusqu'à bras tendus. Remonte jusqu'à 90°."),

  // ---------- Dos ----------
  x('tirage-vertical', 'Tirage vertical', 'Dos', 'pull', 'Grand dorsal · biceps', 'poulie', 5, 'tirage-v', LOURD,
    "Tire la barre vers le haut de la poitrine en sortant la poitrine. Remonte en contrôlant.",
    { alias: ['tirage vertical'] }),
  x('tirage-vertical-serre', 'Tirage vertical prise serrée', 'Dos', 'pull', 'Grand dorsal · biceps', 'poulie', 5, 'tirage-v-serre', MOYEN,
    "Poignée triangle. Tire vers le sternum en gardant le buste légèrement incliné, coudes le long du corps."),
  x('tractions', 'Tractions (ou assistées)', 'Dos', 'pull', 'Grand dorsal · biceps', 'corps', 0, 'tractions', [3, 5, 10, 120],
    "Pars bras tendus, épaules basses. Monte le menton au-dessus de la barre sans balancer les jambes."),
  x('tirage-horizontal', 'Tirage horizontal', 'Dos', 'pull', 'Dos · biceps', 'poulie', 5, 'tirage-h', LOURD,
    "Buste droit, tire les coudes vers l'arrière et serre les omoplates 1 seconde. Pas de balancier.",
    { alias: ['tirage horizontal'] }),
  x('rowing-barre', 'Rowing barre', 'Dos', 'pull', 'Dos · arrière d\'épaule · biceps', 'barre', 2.5, 'rowing-barre', LOURD,
    "Buste penché à 45°, dos plat. Tire la barre vers le nombril, coudes près du corps."),
  x('rowing-haltere', 'Rowing haltère un bras', 'Dos', 'pull', 'Grand dorsal · biceps', 'halteres', 2, 'rowing-haltere', MOYEN,
    "Genou et main sur le banc, dos plat. Tire l'haltère vers la hanche, pas vers l'épaule."),
  x('rowing-machine', 'Rowing machine (Hammer)', 'Dos', 'pull', 'Dos · biceps', 'machine', 5, 'rowing-machine', MOYEN,
    "Poitrine contre l'appui. Tire les poignées en serrant les omoplates, retour lent bras tendus."),
  x('pull-over', 'Pull-over poulie', 'Dos', 'pull', 'Grand dorsal', 'poulie', 2.5, 'pull-over', ISO,
    "Bras presque tendus, buste penché. Ramène la barre vers les cuisses en arc de cercle."),
  x('face-pull', 'Face pull', 'Dos', 'pull', "Arrière d'épaule · haut du dos", 'poulie', 2.5, 'face-pull', ISO_LEGER,
    "Corde à hauteur du visage. Tire vers le front en écartant les mains, coudes hauts.",
    { alias: ['face pull'] }),
  x('souleve-terre', 'Soulevé de terre', 'Dos', 'pull', 'Dos · fessiers · ischios', 'barre', 5, 'souleve-terre', [3, 5, 8, 150],
    "Barre contre les tibias, dos plat. Pousse le sol avec les jambes et garde la barre collée au corps."),
  x('shrugs', 'Shrugs haltères', 'Dos', 'pull', 'Trapèzes', 'halteres', 2, 'shrugs', ISO_LEGER,
    "Bras tendus, hausse les épaules vers les oreilles, tiens 1 seconde. Pas de rotation."),

  // ---------- Biceps ----------
  x('curl-barre', 'Curl barre EZ', 'Biceps', 'pull', 'Biceps', 'barre', 2.5, 'curl-debout', [3, 8, 12, 60],
    "Debout, coudes fixes le long du corps. Monte sans balancer le buste, descends jusqu'à bras tendus."),
  x('curl-halteres', 'Curl haltères', 'Biceps', 'pull', 'Biceps', 'halteres', 2, 'curl-halteres', [3, 8, 12, 60],
    "Tourne la paume vers le haut en montant. Alterne ou fais les deux bras, sans élan."),
  x('curl-marteau', 'Curl marteau', 'Biceps', 'pull', 'Biceps · avant-bras', 'halteres', 2, 'curl-marteau', [3, 10, 12, 60],
    "Pouces vers le haut, coudes collés. Monte jusqu'à l'épaule et redescends lentement."),
  x('curl-pupitre', 'Curl biceps au pupitre', 'Biceps', 'pull', 'Biceps', 'machine', 2.5, 'curl', [3, 8, 12, 60],
    "Bras à plat sur le pupitre. Monte sans décoller les coudes, descends presque bras tendus.",
    { alias: ['biceps pupitre', 'curl pupitre', 'curl biceps pupitre'] }),
  x('curl-poulie', 'Curl biceps poulie', 'Biceps', 'pull', 'Biceps', 'poulie', 2.5, 'curl-poulie', [3, 10, 12, 60],
    "Debout, coudes fixes le long du corps. Monte en serrant les biceps, sans bouger le buste.",
    { alias: ['curl biceps barre / poulie', 'curl biceps poulie', 'curl poulie'] }),
  x('curl-incline', 'Curl incliné haltères', 'Biceps', 'pull', 'Biceps (longue portion)', 'halteres', 2, 'curl-incline', [3, 10, 12, 60],
    "Banc à 45°, bras pendants derrière le buste. Monte sans avancer les coudes."),

  // ---------- Quadriceps et fessiers ----------
  x('squat-barre', 'Squat barre', 'Quadriceps et fessiers', 'jambes', 'Quadriceps · fessiers', 'barre', 5, 'squat', [3, 6, 10, 150],
    "Barre sur les trapèzes, pieds largeur d'épaules. Descends cuisses parallèles, genoux dans l'axe des pieds."),
  x('squat-smith', 'Squat à la Smith', 'Quadriceps et fessiers', 'jambes', 'Quadriceps · fessiers', 'barre', 5, 'squat-smith', LOURD,
    "Pieds un peu en avant de la barre. Descends en gardant le dos droit, pousse dans les talons."),
  x('hack-squat', 'Hack squat', 'Quadriceps et fessiers', 'jambes', 'Quadriceps', 'machine', 10, 'hack-squat', [3, 8, 12, 120],
    "Dos plaqué, pieds au milieu de la plateforme. Descends profond sans décoller les talons."),
  x('presse', 'Presse à cuisses', 'Quadriceps et fessiers', 'jambes', 'Fessiers · ischios · quadriceps', 'machine', 10, 'presse', [3, 10, 12, 120],
    "Pieds hauts pour les fessiers, bas pour les quadriceps. Descends à 90° sans décoller le bas du dos.",
    { alias: ['presse a cuisses (pieds hauts)', 'presse a cuisses'] }),
  x('fentes', 'Fentes haltères', 'Quadriceps et fessiers', 'jambes', 'Quadriceps · fessiers', 'halteres', 2, 'fentes', [3, 10, 12, 90],
    "Grand pas, buste droit. Le genou arrière frôle le sol, le genou avant reste au-dessus de la cheville."),
  x('bulgare', 'Fentes bulgares', 'Quadriceps et fessiers', 'jambes', 'Quadriceps · fessiers', 'halteres', 2, 'bulgare', [3, 8, 12, 90],
    "Pied arrière posé sur le banc. Descends à la verticale, poids sur la jambe avant."),
  x('leg-extension', 'Leg extension', 'Quadriceps et fessiers', 'jambes', 'Quadriceps', 'machine', 5, 'leg-ext', [3, 12, 15, 75],
    "Genou aligné avec l'axe de la machine. Tends complètement, tiens 1 seconde, redescends lentement.",
    { alias: ['leg extension'] }),

  // ---------- Ischios et fessiers ----------
  x('rdl', 'Soulevé de terre roumain', 'Ischios et fessiers', 'jambes', 'Ischios · fessiers', 'barre', 5, 'rdl', [3, 8, 10, 120],
    "Jambes presque tendues. Pousse les fesses en arrière, barre le long des cuisses, dos plat jusqu'aux genoux."),
  x('leg-curl', 'Leg curl allongé', 'Ischios et fessiers', 'jambes', 'Ischio-jambiers', 'machine', 5, 'leg-curl', [3, 12, 15, 75],
    "Hanches collées au banc. Ramène les talons vers les fesses, redescends en 2 secondes.",
    { alias: ['leg curl allonge', 'leg curl'] }),
  x('leg-curl-assis', 'Leg curl assis', 'Ischios et fessiers', 'jambes', 'Ischio-jambiers', 'machine', 5, 'leg-curl-assis', [3, 12, 15, 75],
    "Coussin bien serré sur les cuisses. Ramène les talons sous le siège, retour lent."),
  x('hip-thrust', 'Hip thrust', 'Ischios et fessiers', 'jambes', 'Fessiers', 'barre', 5, 'hip-thrust', [3, 8, 12, 90],
    "Haut du dos sur le banc, barre sur les hanches. Monte jusqu'à l'alignement épaules-genoux, serre les fessiers.",
    { alias: ['hip thrust'] }),
  x('abducteurs', 'Machine abducteurs', 'Ischios et fessiers', 'jambes', 'Moyen fessier', 'machine', 5, 'abducteurs', ISO_LEGER,
    "Dos plaqué, écarte les genoux en contrôlant. Tiens 1 seconde en position ouverte."),
  x('adducteurs', 'Machine adducteurs', 'Ischios et fessiers', 'jambes', 'Adducteurs', 'machine', 5, 'adducteurs', ISO_LEGER,
    "Resserre les cuisses sans à-coup, retour lent jusqu'à l'étirement confortable."),

  // ---------- Mollets et tibias ----------
  x('mollets-debout', 'Mollets debout machine', 'Mollets et tibias', 'jambes', 'Gastrocnémiens', 'machine', 5, 'mollets-debout', MOLLETS,
    "Jambes tendues, talons dans le vide. Monte au maximum sur la pointe, descends lentement."),
  x('mollets-assis', 'Mollets assis', 'Mollets et tibias', 'jambes', 'Soléaire', 'machine', 5, 'mollets', MOLLETS,
    "Monte le plus haut possible sur la pointe, tiens 1 seconde, descends talon bas pour étirer.",
    { alias: ['mollets assis (hammer)', 'mollets assis'] }),
  x('mollets-presse', 'Mollets à la presse', 'Mollets et tibias', 'jambes', 'Mollets', 'machine', 10, 'mollets-presse', MOLLETS,
    "Seulement l'avant du pied sur la plateforme, jambes tendues. Pousse avec les chevilles."),
  x('mollets-marche', 'Mollets sur marche', 'Mollets et tibias', 'jambes', 'Soléaire', 'corps', 0, 'mollets-marche', MOLLETS,
    "Sur une jambe, genou un peu fléchi. Monte sur la pointe et descends lentement sous la marche.",
    { alias: ['extensions mollets sur marche', 'mollets sur marche'] }),
  x('tibialis', 'Tibialis raises', 'Mollets et tibias', 'jambes', 'Tibial antérieur', 'corps', 0, 'tibialis', [3, 15, 20, 45],
    "Dos contre le mur, pieds avancés. Relève les pointes au maximum, redescends lentement.",
    { alias: ['tibialis raises', 'tibialis'] }),

  // ---------- Gainage ----------
  x('planche', 'Planche', 'Gainage', 'gainage', 'Abdos · gainage', 'corps', 0, 'planche', [3, 30, 60, 45],
    "Avant-bras au sol, corps aligné des épaules aux talons. Serre abdos et fessiers, respire.",
    { unite: 's' }),
  x('releve-jambes', 'Relevés de jambes suspendu', 'Gainage', 'gainage', 'Abdos (bas)', 'corps', 0, 'releve-jambes', [3, 8, 15, 60],
    "Suspendu à la barre, monte les jambes à l'horizontale sans balancer. Redescends lentement."),
  x('crunch-poulie', 'Crunch poulie', 'Gainage', 'gainage', 'Abdos', 'poulie', 2.5, 'crunch-poulie', [3, 12, 15, 60],
    "À genoux, corde derrière la tête. Enroule le buste vers le sol, les hanches ne bougent pas."),

  // ---------- Haltérophilie (charge en % du record) ----------
  x('arrache', 'Snatch', 'Haltérophilie', 'haltero', 'Corps entier · vitesse', 'barre', 1, 'arrache', [5, 2, 2, 150],
    "Barre près du corps, extension complète des hanches avant de passer sous la barre. Réception bras verrouillés.",
    { type: 'haltero', pcts: [50, 70, 75, 75, 75], alias: ['arrache'] }),
  x('arrache-suspension', 'Hang snatch', 'Haltérophilie', 'haltero', 'Technique · vitesse', 'barre', 1, 'arrache-hang', [4, 3, 3, 120],
    "Départ barre aux hanches, genoux fléchis. Extension explosive et passe sous la barre rapidement.",
    { type: 'haltero', pcts: [50, 60, 65, 70], alias: ['arrache depuis les hanches', 'arrache suspension'] }),
  x('epaule-jete', 'Clean & jerk', 'Haltérophilie', 'haltero', 'Corps entier · vitesse', 'barre', 1, 'epaule-jete', [5, 1, 1, 150],
    "Épaulé : coudes rapides vers l'avant. Jeté : petite flexion, poussée des jambes, fente sous la barre.",
    { type: 'haltero', pcts: [50, 70, 75, 80, 80], alias: ['epaule-jete', 'epaule jete'] }),
  x('power-clean', 'Power clean', 'Haltérophilie', 'haltero', 'Corps entier · puissance', 'barre', 1, 'epaule', [5, 2, 2, 120],
    "Tire la barre en restant collé, réception en quart de squat, coudes hauts devant.",
    { type: 'haltero', pcts: [50, 65, 70, 75, 75], alias: ['power clean (epaule)', 'epaule'] }),
  x('tirage-arrache', 'Snatch pull', 'Haltérophilie', 'haltero', 'Dos · jambes · trapèzes', 'barre', 1, 'tirage-olympique', [4, 3, 3, 120],
    "Prise large. Même départ que l'arraché, finis sur la pointe des pieds en haussant les épaules, bras tendus.",
    { type: 'haltero', pcts: [70, 80, 85, 90], alias: ['tirage d\'arrache'] }),
  x('tirage-epaule', 'Clean pull', 'Haltérophilie', 'haltero', 'Dos · jambes · trapèzes', 'barre', 1, 'tirage-olympique', [4, 3, 3, 120],
    "Prise d'épaulé. Pousse le sol, barre collée, extension complète et haussement d'épaules.",
    { type: 'haltero', pcts: [70, 80, 85, 90], alias: ['tirage d\'epaule'] }),
  x('squat-avant', 'Front squat', 'Haltérophilie', 'haltero', 'Quadriceps · gainage', 'barre', 1, 'squat-avant', [4, 4, 4, 150],
    "Barre sur l'avant des épaules, coudes hauts. Descends droit et profond, remonte sans pencher le buste.",
    { type: 'haltero', pcts: [60, 70, 75, 80], alias: ['squat avant'] }),
  x('squat-arriere', 'Back squat', 'Haltérophilie', 'haltero', 'Quadriceps · fessiers', 'barre', 1, 'squat', [4, 4, 4, 150],
    "Barre haute sur les trapèzes, buste droit, descente complète. Remontée rapide.",
    { type: 'haltero', pcts: [60, 70, 75, 80], alias: ['squat arriere (haltero)', 'squat arriere'] }),
  x('overhead-squat', 'Overhead squat', 'Haltérophilie', 'haltero', 'Stabilité · mobilité', 'barre', 1, 'arrache', [3, 3, 3, 120],
    "Barre au-dessus de la tête, prise d'arraché. Descends lentement en poussant la barre vers le plafond.",
    { type: 'haltero', pcts: [50, 55, 60], alias: ['squat bras tendus'] }),
  x('push-press', 'Push press', 'Haltérophilie', 'haltero', 'Épaules · jambes', 'barre', 1, 'push-press', [4, 3, 3, 120],
    "Petite flexion des genoux puis poussée des jambes pour lancer la barre, finis bras verrouillés.",
    { type: 'haltero', pcts: [60, 70, 75, 75] }),
];

// Séances Push / Pull / Jambes : une case par rôle, avec les exercices possibles.
// principal : exercice gardé tant qu'il progresse ; les autres varient plus souvent.
export const SEANCES = [
  {
    id: 'push', nom: 'Push', description: 'Pecs, épaules, triceps',
    cases: [
      { role: 'Pecs · principal', principal: true, options: ['dc-halteres', 'dc-barre', 'machine-pecs', 'dc-smith'], cible: LOURD },
      { role: 'Haut des pecs', options: ['incline-halteres', 'incline-barre', 'machine-inclinee'], cible: MOYEN },
      { role: 'Épaules', principal: true, options: ['developpe-militaire', 'militaire-barre', 'machine-epaules'], cible: MOYEN },
      { role: 'Pecs · isolation', options: ['pec-deck', 'ecarte-poulie', 'dips'], cible: ISO },
      { role: 'Épaules · côté', options: ['elevations-laterales', 'elevations-poulie'], cible: ISO_LEGER },
      { role: 'Triceps', options: ['triceps-poulie', 'triceps-barre-poulie', 'barre-front', 'extension-nuque', 'machine-dips'], cible: [3, 8, 12, 60] },
    ],
  },
  {
    id: 'pull', nom: 'Pull', description: 'Dos, biceps',
    cases: [
      { role: 'Dos · tirage vertical', principal: true, options: ['tirage-vertical', 'tirage-vertical-serre', 'tractions'], cible: LOURD },
      { role: 'Dos · tirage horizontal', principal: true, options: ['tirage-horizontal', 'rowing-barre', 'rowing-haltere', 'rowing-machine'], cible: LOURD },
      { role: "Arrière d'épaule", options: ['face-pull', 'oiseau'], cible: ISO_LEGER },
      { role: 'Dos · finition', options: ['pull-over', 'shrugs'], cible: ISO },
      { role: 'Biceps', options: ['curl-pupitre', 'curl-barre', 'curl-halteres', 'curl-incline'], cible: [3, 8, 12, 60] },
      { role: 'Biceps · 2', options: ['curl-poulie', 'curl-marteau'], cible: [3, 10, 12, 60] },
    ],
  },
  {
    id: 'jambes', nom: 'Jambes', description: 'Quadriceps, ischios, mollets, tibias',
    cases: [
      { role: 'Jambes · principal', principal: true, options: ['presse', 'squat-barre', 'hack-squat', 'squat-smith'], cible: [3, 10, 12, 120] },
      { role: 'Ischios', options: ['leg-curl', 'leg-curl-assis', 'rdl'], cible: [3, 12, 15, 75] },
      { role: 'Quadriceps · isolation', options: ['leg-extension', 'fentes', 'bulgare'], cible: [3, 12, 15, 75] },
      { role: 'Mollets', options: ['mollets-assis', 'mollets-debout', 'mollets-presse', 'mollets-marche'], cible: MOLLETS },
      { role: 'Tibias', options: ['tibialis'], cible: [3, 15, 20, 45] },
      { role: 'Gainage', options: ['planche', 'releve-jambes', 'crunch-poulie'], cible: [3, 30, 60, 45] },
    ],
  },
];

for (const s of SEANCES) {
  for (const c of s.cases) {
    c.cible = Array.isArray(c.cible)
      ? { series: c.cible[0], repsMin: c.cible[1], repsMax: c.cible[2], recup: c.cible[3] }
      : c.cible;
  }
}

const PAR_ID = new Map(EXERCICES.map((e) => [e.id, e]));

/** Fiche d'un exercice à partir de son identifiant. */
export function exo(id) {
  return PAR_ID.get(id) || null;
}

/** Programme d'une séance (push, pull, jambes) à partir de son identifiant. */
export function seance(id) {
  return SEANCES.find((s) => s.id === id) || null;
}

// La planche et le gainage gardent leur propre cible (secondes) même dans une case de séance.
export function cibleFinale(def, cibleCase) {
  if (!cibleCase || def.unite === 's' || def.type === 'haltero') return { ...def.cible };
  return { ...cibleCase };
}

// Minuscules, sans accents ni espaces superflus.
export function normaliser(texte) {
  return String(texte || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Retrouve un exercice du catalogue à partir d'un nom saisi dans l'ancien Google Sheet.
export function exoDepuisNom(nom) {
  const n = normaliser(nom);
  if (!n) return null;
  for (const e of EXERCICES) {
    if (normaliser(e.nom) === n || e.alias.includes(n)) return e;
  }
  return null;
}

/**
 * Vrai si l'exercice correspond à la recherche : nom, muscles, groupe et autres noms
 * (les noms français des mouvements d'haltérophilie, par exemple « arraché » pour Snatch).
 */
export function correspond(def, recherche) {
  const q = normaliser(recherche);
  if (!q) return true;
  return normaliser(`${def.nom} ${def.muscles} ${def.groupe} ${def.alias.join(' ')}`).includes(q);
}
