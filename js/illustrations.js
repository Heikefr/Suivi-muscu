// Schémas simples des exercices (à retravailler plus tard).
// Traits clairs = corps, gris = machine, jaune = partie qui bouge.

const C = 'var(--texte)';
const G = 'var(--gris)';
const A = 'var(--accent)';

const tete = (x, y) => `<circle cx="${x}" cy="${y}" r="6" stroke="${C}"></circle>`;
const p = (d, couleur = C) => `<path d="${d}" stroke="${couleur}"></path>`;
const assis = (x = 34, y = 22) =>
  tete(x, y) + p(`M${x} ${y + 8}V${y + 36}`) + p(`M${x} ${y + 36}H${x + 20}`) + p(`M${x + 20} ${y + 36}V${y + 54}`);

const DESSINS = {
  couche: p('M14 64H70', G) + p('M20 64V80M64 64V80', G) + tete(18, 56) + p('M24 58H54')
    + p('M54 58L62 66V80') + p('M36 58V34', A) + p('M29 34H43', A),
  incline: p('M26 58L54 74', G) + p('M54 74V84', G) + tete(26, 44) + p('M31 50L52 64')
    + p('M52 64H64V80') + p('M37 54L40 28', A) + p('M33 28H47', A),
  'machine-pecs': p('M24 18V62', G) + assis() + p('M34 38H64', A) + p('M64 31V45', A),
  'machine-inclinee': p('M24 18V62', G) + assis() + p('M34 38L60 22', A) + p('M56 18L64 26', A),
  ecarte: p('M24 18V62', G) + assis() + p('M34 38Q56 40 62 22', A) + p('M58 18L66 26', A),
  militaire: p('M24 18V62', G) + tete(34, 24) + p('M34 32V58H54V76')
    + p('M34 38L24 32V14M34 38L44 32V14', A) + p('M18 14H30M38 14H50', A),
  elevation: tete(48, 16) + p('M48 24V52') + p('M48 52L40 78M48 52L56 78')
    + p('M48 30L22 34M48 30L74 34', A) + p('M22 29V39M74 29V39', A),
  triceps: p('M80 8V86', G) + p('M80 12L56 50', G) + tete(40, 16) + p('M40 24V52')
    + p('M40 52L34 78M40 52L46 78') + p('M40 30L48 40') + p('M48 40L54 56', A),
  'tirage-h': tete(40, 26) + p('M40 34L37 62') + p('M37 62H59L71 68') + p('M39 42L59 46', A)
    + p('M59 46H87', A) + p('M22 66H56', G) + p('M74 60V76', G),
  'tirage-v': p('M44 4V18', G) + tete(44, 30) + p('M44 38V62H64V80') + p('M58 56H70', G)
    + p('M44 44L30 22M44 44L58 22', A) + p('M22 18H66', A),
  curl: tete(24, 22) + p('M24 30V60') + p('M24 60L20 80M24 60L32 80') + p('M38 56L58 46', G)
    + p('M24 36L46 50') + p('M46 50L50 30', A) + p('M43 28H57', A),
  'face-pull': p('M84 10V86', G) + p('M84 24L52 26', G) + tete(36, 24) + p('M36 32V56')
    + p('M36 56L30 80M36 56L42 80') + p('M36 38L52 30L46 24', A),
  presse: p('M10 70L36 46', G) + tete(20, 50) + p('M25 55L44 66') + p('M44 66L58 50', A)
    + p('M58 50L70 60', A) + p('M64 40L82 64', G),
  'leg-ext': p('M24 20V64H60', G) + tete(32, 24) + p('M32 32V60H56') + p('M56 60L82 54', A),
  'leg-curl': p('M10 62H70', G) + p('M16 62V78M64 62V78', G) + tete(14, 52) + p('M20 54H64')
    + p('M64 54L72 32', A),
  mollets: p('M18 62H46', G) + tete(26, 24) + p('M26 32V58H54') + p('M44 52H66', G)
    + p('M54 58V76') + p('M54 76L66 70', A) + p('M46 82H74', G),
  'mollets-marche': tete(44, 14) + p('M44 22V50') + p('M44 50V76') + p('M44 76L56 72', A)
    + p('M34 80H64V90', G),
  tibialis: p('M18 6V88', G) + tete(27, 18) + p('M26 26L30 54') + p('M30 54L44 80')
    + p('M44 80L56 70', A) + p('M30 86H70', G),
};

export function illustration(dessin, nom, taille = 96) {
  const contenu = DESSINS[dessin] || '';
  return `<svg role="img" aria-label="Schéma : ${nom}" width="${taille}" height="${taille}" viewBox="0 0 96 96" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${contenu}</svg>`;
}
