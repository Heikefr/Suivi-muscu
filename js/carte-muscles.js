// =====================================================================
// Carte des muscles : deux silhouettes (face et dos)
// ---------------------------------------------------------------------
// Chaque muscle est une forme dessinée sur la MOITIÉ GAUCHE du corps ;
// la moitié droite est obtenue par symétrie (miroir autour de x = 70).
// La couleur dépend du « niveau » de travail de la semaine :
//   0 = pas travaillé (forme à peine visible), 1 = un peu, 2 = correct, 3 = beaucoup.
// Toile : 140 × 290.
// =====================================================================

const ROUGE = 'var(--muscle, #FF3B47)';
const CORPS = 'var(--corps-carte, #454B56)';
/** Opacité du rouge pour chaque niveau. */
const OPACITE = [0, 0.38, 0.68, 1];

/** Contour de la moitié gauche du corps : cou, épaule, bras, flanc, jambe, puis retour par l'axe. */
const DEMI_CORPS = 'M70 34L64 34L63 43C56 47 50 49 45 51C38 53 33 58 32 67C31 76 30 86 28 97'
  + 'C26 108 25 122 24 138C23 144 22 150 24 154C27 156 31 152 31 146L32 138C34 124 37 110 39 99'
  + 'C40 91 41 84 43 78C44 88 46 100 48 112C49 120 47 130 45 140C43 152 42 170 44 186'
  + 'C45 196 47 204 47 210C45 220 45 232 48 246C50 256 51 264 51 270C50 276 46 280 48 283L61 283'
  + 'C62 278 60 272 60 268C62 254 64 240 63 226C62 218 62 212 63 206C65 190 67 170 68 154L70 152Z';

/** Formes des muscles vus de FACE (moitié gauche). Un muscle peut avoir plusieurs formes. */
const FACE = {
  Épaules: ['M46 52C39 53 33 58 32 67C32 71 33 74 35 77C38 70 42 62 48 57Z'],
  // Éventail : large le long du sternum, pointe vers l'aisselle.
  Pecs: ['M68.6 55C62 53 55 53 50 56C46 60 44 66 46 71C50 77 60 79 68.6 76Z'],
  Biceps: ['M34 79C32 86 31 92 31 97C34 99 37 98 38 96C39 90 40 84 41 80C39 78 36 78 34 79Z'],
  'Avant-bras': ['M29 103C27 114 26 126 26 136L31 136C33 124 35 112 37 103C34 101 31 101 29 103Z'],
  // Quatre « tablettes » de chaque côté de la ligne centrale.
  Abdos: [
    'M60 83C63 82 66 82 68.6 82L68.6 91C65 91.5 62 91.5 59.5 91Z',
    'M59.3 93.5C62 94 65 94 68.6 93.5L68.6 102C65 102.5 62 102.5 59.5 102Z',
    'M59.5 104.5C62 105 65 105 68.6 104.5L68.6 113C65 113.5 62 113.5 60 113Z',
    'M60.3 115.5C63 116 66 116 68.6 115.5L68.6 134C65 132 62 126 60.3 115.5Z',
  ],
  Quadriceps: ['M46 151C44 165 44 181 46 196C50 202 57 202 60 196C62 182 62 167 62 157C57 151 51 149 46 151Z'],
  Adducteurs: ['M64 158C65.5 160 67 160 67.5 158C67 170 66 181 64 191C63 180 63 169 64 158Z'],
  Tibias: ['M50 216C48 228 49 242 51 256L56 256C58 242 59 228 59 216C56 213 53 213 50 216Z'],
};

/** Formes des muscles vus de DOS (moitié gauche). */
const DOS = {
  Trapèzes: ['M68.6 37L64 39C58 46 52 49 46 51C54 54 62 62 68.6 80Z'],
  Épaules: ['M45 53C39 54 33 58 32 67C32 71 33 74 35 77C38 71 41 64 46 58Z'],
  // Grand dorsal : de l'aisselle vers la colonne, en V.
  Dos: ['M44 68C52 70 62 78 68.6 89L68.6 108C63 112 56 114 51 113C48 100 45 84 44 68Z'],
  Lombaires: ['M62 116C64 114 67 113 68.6 113L68.6 134C65 134 62 131 61.5 126Z'],
  Triceps: ['M34 79C32 86 31 92 31 97C34 99 37 98 38 96C39 90 40 84 41 80C39 78 36 78 34 79Z'],
  'Avant-bras': ['M29 103C27 114 26 126 26 136L31 136C33 124 35 112 37 103C34 101 31 101 29 103Z'],
  Fessiers: ['M46 141C45 151 47 160 54 164C62 166 68 160 68.6 152L68.6 139C60 135 50 135 46 141Z'],
  Ischios: ['M46 169C45 182 46 194 48 202C52 206 58 206 61 200C63 190 65 179 66 169C60 173 52 173 46 169Z'],
  Mollets: ['M48 214C45 224 46 238 50 248C54 252 58 250 60 246C63 236 63 224 61 214C57 210 52 210 48 214Z'],
};

/** Tous les muscles que la carte sait montrer. */
export const MUSCLES_CARTE = [...new Set([...Object.keys(FACE), ...Object.keys(DOS)])];

/** Dessine une silhouette (face ou dos) avec ses muscles colorés selon leur niveau. */
function silhouette(formes, niveaux, titre) {
  const muscles = Object.entries(formes).map(([nom, chemins]) => {
    const niveau = niveaux[nom] || 0;
    // Pas travaillé : la forme reste devinable, pour que le corps garde son relief.
    const style = niveau ? `fill="${ROUGE}" opacity="${OPACITE[niveau]}"` : 'fill="#fff" opacity=".07"';
    return chemins.map((c) => `<path d="${c}" ${style}></path>`).join('');
  }).join('');
  const moitie = `<path d="${DEMI_CORPS}" fill="${CORPS}"></path>${muscles}`;
  return `<svg role="img" aria-label="${titre}" viewBox="0 0 140 290" width="132" height="273">
    <ellipse cx="70" cy="21" rx="11.5" ry="14" fill="${CORPS}"></ellipse>
    <g>${moitie}</g>
    <g transform="translate(140 0) scale(-1 1)">${moitie}</g>
  </svg>`;
}

/**
 * Les deux silhouettes côte à côte.
 * @param niveaux  { 'Pecs': 3, 'Dos': 2, … } : niveau 0 à 3 par muscle
 */
export function carteMuscles(niveaux) {
  return `<div class="carte-muscles">
    ${silhouette(FACE, niveaux, 'Muscles travaillés, vue de face')}
    ${silhouette(DOS, niveaux, 'Muscles travaillés, vue de dos')}
  </div>`;
}
