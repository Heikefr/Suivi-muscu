// Schémas des exercices (traits simples, à retravailler plus tard).
// Clair = corps, gris = machine ou banc, couleur d'accent = ce qui bouge.

const C = 'var(--texte)';
const G = 'var(--gris)';
const A = 'var(--accent)';

const tete = (x, y) => `<circle cx="${x}" cy="${y}" r="6" stroke="${C}"></circle>`;
const p = (d, couleur = C) => `<path d="${d}" stroke="${couleur}"></path>`;
const sol = p('M8 88H88', G);
// Personnage debout de profil (tête 48,14 ; hanches 48,50).
const debout = (jambes = 'M48 50L44 86M48 50L52 86') => tete(48, 14) + p('M48 22V50') + p(jambes);
// Personnage assis sur un siège avec dossier.
const assis = (x = 34, y = 22) => p(`M${x - 10} ${y - 4}V${y + 40}`, G) + tete(x, y)
  + p(`M${x} ${y + 8}V${y + 36}`) + p(`M${x} ${y + 36}H${x + 20}`) + p(`M${x + 20} ${y + 36}V${y + 54}`);
// Personnage allongé sur un banc plat.
const allonge = p('M14 64H70', G) + p('M20 64V84M64 64V84', G) + tete(18, 56) + p('M24 58H54') + p('M54 58L62 66V84');
const halteres = (x, y) => p(`M${x - 6} ${y}H${x + 6}`, A);
const barre = (x1, x2, y) => p(`M${x1} ${y}H${x2}`, A) + p(`M${x1 + 2} ${y - 5}V${y + 5}M${x2 - 2} ${y - 5}V${y + 5}`, A);
const fleche = (x, y1, y2) => p(`M${x} ${y1}V${y2}M${x - 3} ${y2 + (y1 > y2 ? 3 : -3)}L${x} ${y2}L${x + 3} ${y2 + (y1 > y2 ? 3 : -3)}`, G);

const DESSINS = {
  // Pecs
  couche: allonge + p('M36 58V34', A) + halteres(36, 32),
  'couche-barre': allonge + p('M36 58V34', A) + barre(18, 56, 32),
  smith: p('M24 6V84M50 6V84', G) + allonge + p('M36 58V34', A) + barre(16, 58, 32),
  incline: p('M26 58L54 74', G) + p('M54 74V86', G) + tete(26, 44) + p('M31 50L52 64')
    + p('M52 64H64V86') + p('M37 54L40 28', A) + halteres(40, 26),
  'incline-barre': p('M26 58L54 74', G) + p('M54 74V86', G) + tete(26, 44) + p('M31 50L52 64')
    + p('M52 64H64V86') + p('M37 54L40 28', A) + barre(24, 58, 26),
  'machine-pecs': assis() + p('M34 38H64', A) + p('M64 31V45', A) + p('M74 10V80', G),
  'machine-inclinee': assis() + p('M34 38L60 22', A) + p('M56 18L64 26', A) + p('M74 10V80', G),
  ecarte: assis() + p('M34 38Q56 40 62 22', A) + p('M58 18L66 26', A),
  'ecarte-poulie': p('M8 6V88M88 6V88', G) + p('M8 18L42 46M88 18L54 46', G) + debout()
    + p('M48 30L42 46M48 30L54 46', A) + sol,
  dips: p('M20 44H76M28 44V88M68 44V88', G) + tete(48, 18) + p('M48 26V52')
    + p('M48 30L40 38V44', A) + p('M48 52L44 66L52 76'),
  pompes: p('M8 78H88', G) + tete(18, 52) + p('M24 55L80 72') + p('M32 57V76', A) + p('M80 72V77'),

  // Épaules
  militaire: assis(34, 24) + p('M34 38L24 32V14M34 38L44 32V14', A) + halteres(24, 12) + halteres(44, 12),
  'militaire-barre': debout() + p('M48 28L38 22V8M48 28L58 22V8', A) + barre(28, 68, 6) + sol,
  'machine-epaules': p('M70 6V80', G) + assis(34, 24) + p('M34 38L24 32V16M34 38L44 32V16', A) + p('M18 16H50', A),
  elevation: debout() + p('M48 30L22 34M48 30L74 34', A) + p('M22 29V39M74 29V39', A) + sol,
  'elevation-poulie': p('M86 40V88', G) + p('M86 84L74 36', G) + debout() + p('M48 30L74 34', A) + sol,
  oiseau: p('M66 30V64', G) + p('M40 66H70', G) + tete(58, 22) + p('M56 30L52 64') + p('M52 64H38V86')
    + p('M56 36L36 30M56 36L76 30', A),

  // Triceps
  triceps: p('M80 8V88', G) + p('M80 12L56 50', G) + debout('M40 50L34 86M40 50L46 86').replace(/48/g, '40')
    + p('M40 30L48 40') + p('M48 40L54 56', A) + sol,
  'triceps-barre': p('M80 8V88', G) + p('M80 12L56 52', G) + debout('M40 50L34 86M40 50L46 86').replace(/48/g, '40')
    + p('M40 30L48 40') + p('M48 40L52 56', A) + p('M46 56H62', A) + sol,
  'barre-front': allonge + p('M36 58V38') + p('M36 38L24 44', A) + barre(16, 30, 44),
  'extension-nuque': assis() + p('M34 34V12') + p('M34 12L22 24', A) + p('M18 22H26', A),
  'machine-dips': assis() + p('M34 34L40 44') + p('M40 44L50 54', A) + p('M46 56H58', A) + p('M70 10V80', G),

  // Dos
  'tirage-v': p('M44 4V18', G) + tete(44, 30) + p('M44 38V62H64V82') + p('M58 56H70', G)
    + p('M44 44L30 22M44 44L58 22', A) + p('M22 18H66', A),
  'tirage-v-serre': p('M44 4V18', G) + tete(44, 30) + p('M44 38V62H64V82') + p('M58 56H70', G)
    + p('M44 44L38 22M44 44L50 22', A) + p('M38 20L44 16L50 20', A),
  tractions: p('M18 8H78', G) + p('M40 8L44 34M56 8L52 34', A) + tete(48, 26) + p('M48 34V60')
    + p('M48 60L44 80M48 60L54 78'),
  'tirage-h': tete(40, 26) + p('M40 34L37 62') + p('M37 62H59L71 68') + p('M39 42L59 46', A)
    + p('M59 46H87', G) + p('M22 66H56', G) + p('M74 60V78', G),
  'rowing-barre': tete(68, 28) + p('M62 34L32 48') + p('M32 48L28 86M32 48L40 86') + p('M56 38L52 56', A)
    + barre(38, 66, 58) + sol,
  'rowing-haltere': p('M36 62H86M40 62V88M82 62V88', G) + tete(78, 34) + p('M72 38L42 48') + p('M70 40L74 62')
    + p('M42 48L46 62') + p('M42 48L28 88') + p('M58 44L56 58', A) + halteres(56, 60),
  'rowing-machine': p('M64 26V60', G) + p('M30 64H58', G) + tete(54, 24) + p('M52 32L46 62')
    + p('M46 62L40 84') + p('M52 40L36 46', A) + p('M36 40V52', A),
  'pull-over': p('M86 6V88', G) + p('M86 12L70 44', G) + tete(56, 20) + p('M52 28L40 52')
    + p('M40 52L36 86M40 52L46 86') + p('M52 30L68 46', A) + p('M64 46H74', A) + sol,
  'face-pull': p('M84 10V88', G) + p('M84 24L52 26', G) + tete(36, 24) + p('M36 32V56')
    + p('M36 56L30 86M36 56L42 86') + p('M36 38L52 30L46 24', A) + sol,
  'souleve-terre': tete(66, 24) + p('M60 30L38 48') + p('M38 48L52 62L46 86') + p('M58 32L56 70', A)
    + `<circle cx="56" cy="76" r="10" stroke="${G}"></circle>` + barre(40, 72, 76) + sol,
  shrugs: debout() + p('M48 28L44 54M48 28L52 54', A) + halteres(44, 56) + fleche(36, 22, 12) + fleche(60, 22, 12) + sol,

  // Biceps
  'curl-debout': debout() + p('M48 30L50 50') + p('M50 50L62 38', A) + barre(56, 70, 38) + sol,
  'curl-halteres': debout() + p('M48 30L50 50') + p('M50 50L60 36', A) + halteres(60, 34) + sol,
  'curl-marteau': debout() + p('M48 30L50 50') + p('M50 50L58 34', A) + p('M58 29V39', A) + sol,
  curl: tete(24, 22) + p('M24 30V60') + p('M24 60L20 86M24 60L32 86') + p('M38 56L58 46', G)
    + p('M24 36L46 50') + p('M46 50L50 30', A) + p('M43 28H57', A) + sol,
  'curl-poulie': p('M86 50V88', G) + p('M86 84L62 40', G) + debout() + p('M48 30L50 50') + p('M50 50L62 40', A) + sol,
  'curl-incline': p('M22 46L54 70', G) + p('M54 70V88', G) + tete(24, 40) + p('M30 46L52 64') + p('M52 64H64V88')
    + p('M34 50L36 70') + p('M36 70L46 60', A) + halteres(46, 58),

  // Quadriceps et fessiers
  squat: tete(46, 18) + p('M46 26L42 50') + p('M42 50L60 56L56 86') + barre(32, 60, 28) + sol,
  'squat-smith': p('M28 6V88M64 6V88', G) + tete(46, 18) + p('M46 26L42 50') + p('M42 50L60 56L56 86')
    + barre(24, 68, 28) + sol,
  'hack-squat': p('M18 18L48 82', G) + tete(30, 22) + p('M32 30L42 54') + p('M42 54L62 52L62 82')
    + p('M26 32H42', A) + p('M50 86L78 80', G),
  presse: p('M10 70L36 46', G) + tete(20, 50) + p('M25 55L44 66') + p('M44 66L58 50', A)
    + p('M58 50L70 60', A) + p('M64 40L82 64', G),
  fentes: debout('M48 50L64 58L64 86M48 50L38 68L26 86') + p('M48 28L44 50', A) + halteres(44, 52) + sol,
  bulgare: p('M8 58H32V88', G) + debout('M48 50L62 60L62 86M48 50L38 70L22 58') + p('M48 28L46 50', A)
    + halteres(46, 52) + sol,
  'leg-ext': p('M24 20V64H60', G) + tete(32, 24) + p('M32 32V60H56') + p('M56 60L82 54', A),

  // Ischios et fessiers
  rdl: tete(70, 34) + p('M64 38L36 44') + p('M36 44L38 86M36 44L44 86') + p('M60 40L60 64', A)
    + barre(50, 70, 66) + sol,
  'leg-curl': p('M10 62H70', G) + p('M16 62V84M64 62V84', G) + tete(14, 52) + p('M20 54H64')
    + p('M64 54L72 32', A),
  'leg-curl-assis': p('M22 18V64H56', G) + tete(30, 22) + p('M30 30V58H56') + p('M44 52H62', G)
    + p('M56 58L48 80', A),
  'hip-thrust': p('M8 52H30V88', G) + tete(16, 42) + p('M24 48L56 44') + p('M56 44L68 54V86')
    + barre(46, 64, 38) + fleche(76, 54, 40) + sol,
  abducteurs: tete(48, 14) + p('M48 22V52') + p('M24 56V70M72 56V70', G)
    + p('M48 52L28 62M48 52L68 62', A) + p('M28 62L26 84M68 62L70 84'),
  adducteurs: tete(48, 14) + p('M48 22V52') + p('M38 56V70M58 56V70', G)
    + p('M48 52L34 62M48 52L62 62', A) + p('M34 62L30 84M62 62L66 84'),

  // Mollets et tibias
  'mollets-debout': p('M32 22H64', G) + tete(48, 12) + p('M48 20V50') + p('M48 50V78')
    + p('M48 78L58 82', A) + p('M40 86H72', G) + fleche(70, 66, 54),
  mollets: p('M18 62H46', G) + tete(26, 24) + p('M26 32V58H54') + p('M44 52H66', G)
    + p('M54 58V76') + p('M54 76L66 70', A) + p('M46 82H74', G),
  'mollets-presse': p('M10 70L36 46', G) + tete(20, 50) + p('M25 55L44 66') + p('M44 66L74 44')
    + p('M74 44L82 36', A) + p('M70 28L88 52', G),
  'mollets-marche': tete(44, 14) + p('M44 22V50') + p('M44 50V76') + p('M44 76L56 72', A)
    + p('M34 80H64V90', G),
  tibialis: p('M18 6V88', G) + tete(27, 18) + p('M26 26L30 54') + p('M30 54L44 80')
    + p('M44 80L56 70', A) + p('M30 86H70', G),

  // Gainage
  planche: p('M8 74H88', G) + tete(18, 50) + p('M24 54L80 68') + p('M28 56L28 72H40', A) + p('M80 68V73'),
  'releve-jambes': p('M28 6H68', G) + p('M42 6L44 30M54 6L52 30') + tete(48, 30) + p('M48 38V60')
    + p('M48 60H76', A),
  'crunch-poulie': p('M76 4V88', G) + p('M76 10L50 34', G) + p('M30 86H48', G) + p('M36 86V62')
    + p('M36 62Q40 46 52 40', A) + tete(56, 40) + fleche(64, 56, 70),

  // Haltérophilie
  arrache: tete(46, 20) + p('M46 28L42 50') + p('M42 50L60 56L56 86') + p('M44 30L34 8M46 30L58 8', A)
    + barre(22, 70, 6) + sol,
  'arrache-hang': debout('M48 50L54 66L48 86M48 50L42 66L42 86') + p('M48 28V52', A) + barre(30, 66, 54) + sol,
  'epaule-jete': debout('M48 50L62 66L64 86M48 50L36 68L26 86') + p('M48 28L40 8M48 28L56 8', A)
    + barre(26, 70, 6) + sol,
  epaule: tete(46, 18) + p('M46 26L44 50') + p('M44 50L58 60L54 86') + p('M46 30L56 34', A)
    + barre(36, 64, 28) + sol,
  'tirage-olympique': tete(48, 12) + p('M48 20L46 48') + p('M46 48L44 76L50 84') + p('M48 26L50 52', A)
    + barre(34, 66, 54) + fleche(64, 24, 12) + sol,
  'squat-avant': tete(46, 18) + p('M46 26L44 50') + p('M44 50L62 56L58 86') + p('M46 30L58 32', A)
    + barre(38, 64, 26) + sol,
  'push-press': debout('M48 50L54 66L48 86M48 50L42 66L42 86') + p('M48 28L38 10M48 28L58 10', A)
    + barre(26, 70, 8) + sol,
};

export function illustration(dessin, nom, taille = 96) {
  const contenu = DESSINS[dessin] || '';
  return `<svg role="img" aria-label="Schéma : ${nom}" width="${taille}" height="${taille}" viewBox="0 0 96 96" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${contenu}</svg>`;
}

export function dessinExiste(dessin) {
  return Boolean(DESSINS[dessin]);
}
