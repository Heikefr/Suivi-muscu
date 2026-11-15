// =====================================================================
// Schémas des exercices
// ---------------------------------------------------------------------
// Chaque schéma est un petit dessin vectoriel (SVG) fabriqué par du code :
//   1. on décrit une POSE avec des angles (buste, cuisse, tibia, bras…) ;
//   2. le « moteur » calcule la position des articulations et dessine
//      une silhouette pleine, toujours avec les mêmes proportions ;
//   3. on ajoute le matériel, la flèche du mouvement et les muscles.
//
// Couleurs :
//   - clair            = le corps
//   - gris             = le matériel fixe (banc, machine, sol)
//   - couleur du thème = ce qui bouge (barre, haltère, poignée) et la flèche
//   - ROUGE            = le muscle travaillé (--muscle dans la feuille de style)
//
// Toile : 160 × 160, le sol est à y = 150. Angles en degrés :
// 0 = vers la droite, 90 = vers le bas, -90 = vers le haut.
// Par défaut le personnage de profil regarde vers la droite.
// =====================================================================

// ---------- Couleurs ----------
const C = 'var(--texte)'; // corps
const C2 = 'var(--doux)'; // bras et jambe du côté éloigné (un peu plus sombres)
const G = 'var(--gris)'; // matériel fixe
const A = 'var(--accent)'; // matériel mobile et flèches
const M = 'var(--muscle, #FF3B47)'; // muscle travaillé
const F = 'var(--fond-dessin, var(--carte))'; // fond, pour détourer ce qui passe devant

// ---------- Proportions du personnage ----------
const L = { torse: 40, cuisse: 30, tibia: 32, bras: 21, avant: 20, cou: 16 };
const EP = { torse: 20, jambe: 11, bras: 8.5, tete: 9.5 }; // épaisseurs
const SOL = 150;

// ---------- Petits outils de géométrie ----------
const rad = (deg) => (deg * Math.PI) / 180;
const n1 = (v) => Math.round(v * 10) / 10; // 1 décimale suffit, le fichier reste léger
const pt = ([x, y]) => `${n1(x)} ${n1(y)}`;
/** Point situé à `long` de `o` dans la direction `angle`. */
const vers = ([x, y], angle, long) => [x + Math.cos(rad(angle)) * long, y + Math.sin(rad(angle)) * long];
const moins = (a, b) => [a[0] - b[0], a[1] - b[1]];
const vectoriel = (a, b) => a[0] * b[1] - a[1] * b[0];
const scalaire = (a, b) => a[0] * b[0] + a[1] * b[1];

// ---------- Briques de dessin ----------
/** Trait arrondi passant par plusieurs points. */
const trait = (points, couleur, ep, extra = '') => `<path d="M${points.map(pt).join('L')}" stroke="${couleur}" stroke-width="${ep}"${extra}></path>`;
const rond = ([x, y], r, attrs) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${r}" ${attrs}></circle>`;
/** Élément « de détail » : retiré quand le schéma est affiché en tout petit. */
const detail = (svg) => `<g class="dt">${svg}</g>`;

/**
 * Portion de muscle : un trait rouge le long d'un segment du corps,
 * décalé sur le côté pour rester À L'INTÉRIEUR de la silhouette.
 * @param a,b    extrémités du segment (ex. épaule → hanche)
 * @param t0,t1  début et fin le long du segment (0 = a, 1 = b)
 * @param cote   +1 ou -1 : de quel côté du segment décaler
 * @param dec    décalage par rapport au centre du segment
 * @param ep     épaisseur du trait rouge
 */
function bande(a, b, t0, t1, cote, dec, ep) {
  const d = moins(b, a);
  const long = Math.hypot(d[0], d[1]) || 1;
  const nx = (-d[1] / long) * cote * dec;
  const ny = (d[0] / long) * cote * dec;
  const en = (t) => [a[0] + d[0] * t + nx, a[1] + d[1] * t + ny];
  return trait([en(t0), en(t1)], M, ep);
}

/** De quel côté (+1/-1) du segment a→b se trouve le vecteur `v`. */
function coteDe(a, b, v, defaut = 1) {
  const d = moins(b, a);
  const s = scalaire([-d[1], d[0]], v);
  return Math.abs(s) < 0.01 ? defaut : Math.sign(s);
}

// =====================================================================
// Personnage de PROFIL
// =====================================================================

/**
 * Calcule les articulations à partir d'angles.
 * @param o.h      position de la hanche [x, y] (ou o.e pour partir de l'épaule)
 * @param o.torse  direction hanche → épaule (-90 = buste droit)
 * @param o.cuisse, o.tibia   jambe proche ; o.cuisse2, o.tibia2 : jambe éloignée (facultatif)
 * @param o.bras, o.avant     bras proche ; o.bras2, o.avant2 : bras éloigné (facultatif)
 * @param o.auSol  true = on descend/monte le tout pour poser le pied le plus bas au sol
 */
function pose(o) {
  const torse = o.torse ?? -90;
  let h = o.h || vers(o.e, torse + 180, L.torse);
  const calc = () => {
    const e = vers(h, torse, L.torse);
    const g = vers(h, o.cuisse ?? 90, L.cuisse);
    const p = vers(g, o.tibia ?? 90, L.tibia);
    const c = vers(e, o.bras ?? 90, L.bras);
    const m = vers(c, o.avant ?? o.bras ?? 90, L.avant);
    const P = { h, e, g, p, c, m, t: vers(e, o.teteAngle ?? torse, L.cou) };
    if (o.cuisse2 != null) { P.g2 = vers(h, o.cuisse2, L.cuisse); P.p2 = vers(P.g2, o.tibia2 ?? 90, L.tibia); }
    if (o.bras2 != null) { P.c2 = vers(e, o.bras2, L.bras); P.m2 = vers(P.c2, o.avant2 ?? o.bras2, L.avant); }
    return P;
  };
  let P = calc();
  if (o.auSol) {
    const bas = Math.max(P.p[1], P.p2 ? P.p2[1] : -Infinity);
    h = [h[0], h[1] + (SOL - 4 - bas)];
    P = calc();
  }
  return P;
}

/**
 * Dessine le personnage de profil et ses muscles en rouge.
 * @param P             articulations (résultat de `pose`)
 * @param o.muscles     liste : pecs, pecs-haut, pecs-bas, abdos, dorsaux, lombaires, trapezes,
 *                      epaule, epaule-arriere, biceps, triceps, avant-bras,
 *                      quadriceps, ischios, fessiers, mollets, tibial
 * @param o.face        vers où regarde le ventre : [1,0] debout face à droite, [0,-1] allongé sur le dos…
 * @param o.pied        angle du pied proche (0 = à plat vers la droite), null = pas de pied
 * @param o.pied2       idem pour le pied éloigné
 */
function profil(P, o = {}) {
  const mus = new Set(o.muscles || []);
  const face = o.face || [1, 0];
  const dos = [-face[0], -face[1]];
  const s = [];

  // --- Jambe : cuisse + tibia + pied, puis ses muscles ---
  const jambe = (g, p, couleur, anglePied) => {
    s.push(trait([P.h, g, p], couleur, EP.jambe));
    if (anglePied !== null) s.push(trait([p, vers(p, anglePied ?? (face[0] < 0 ? 180 : 0), 9)], couleur, 7));
    // L'arrière de la cuisse est du côté où part le tibia (le genou plie vers l'arrière).
    const arriere = coteDe(P.h, g, moins(p, g), coteDe(P.h, g, dos));
    if (mus.has('quadriceps')) s.push(bande(P.h, g, 0.18, 0.86, -arriere, 2.4, 5.4));
    if (mus.has('ischios')) s.push(bande(P.h, g, 0.2, 0.84, arriere, 2.4, 5.4));
    // Le mollet est du côté du tibia tourné vers la cuisse quand le genou plie.
    const mollet = coteDe(g, p, moins(P.h, g), coteDe(g, p, dos));
    if (mus.has('mollets')) s.push(bande(g, p, 0.1, 0.58, mollet, 2.4, 5.4));
    if (mus.has('tibial')) s.push(bande(g, p, 0.12, 0.7, -mollet, 2.6, 4.6));
  };

  // --- Bras : bras + avant-bras, puis ses muscles ---
  const bras = (c, m, couleur, detoure) => {
    if (detoure) s.push(trait([P.e, c, m], F, EP.bras + 5)); // liseré sombre : le bras se détache du buste
    s.push(trait([P.e, c, m], couleur, EP.bras));
    // Le biceps est du côté vers lequel l'avant-bras se replie.
    const avant = coteDe(P.e, c, moins(m, c), coteDe(P.e, c, face));
    if (mus.has('biceps')) s.push(bande(P.e, c, 0.22, 0.86, avant, 1.7, 4.4));
    if (mus.has('triceps')) s.push(bande(P.e, c, 0.2, 0.88, -avant, 1.7, 4.4));
    if (mus.has('avant-bras')) s.push(bande(c, m, 0.1, 0.7, 1, 0, 4.6));
  };

  // 1. Membres du côté éloigné, derrière le buste
  if (P.g2) jambe(P.g2, P.p2, C2, o.pied2);
  if (P.c2) bras(P.c2, P.m2, C2, false);

  // 2. Buste et ses muscles
  s.push(trait([P.e, P.h], C, EP.torse));
  const devant = coteDe(P.e, P.h, face);
  const B = (t0, t1, cote, dec = 5.4, ep = 7.6) => s.push(bande(P.e, P.h, t0, t1, cote, dec, ep));
  if (mus.has('pecs')) B(0.04, 0.36, devant);
  if (mus.has('pecs-haut')) B(0.0, 0.22, devant);
  if (mus.has('pecs-bas')) B(0.2, 0.4, devant);
  if (mus.has('abdos')) B(0.5, 0.92, devant);
  if (mus.has('trapezes')) B(-0.02, 0.2, -devant);
  if (mus.has('dorsaux')) B(0.2, 0.62, -devant);
  if (mus.has('lombaires')) B(0.7, 0.96, -devant);
  if (mus.has('fessiers')) s.push(rond(vers(P.h, Math.atan2(dos[1], dos[0]) * 180 / Math.PI, 3.6), 5.6, `fill="${M}"`));

  // 3. Tête
  s.push(rond(P.t, EP.tete, `fill="${C}"`));

  // 4. Jambe puis bras du côté proche, devant le buste
  jambe(P.g, P.p, C, o.pied);
  if (!o.sansBras) bras(P.c, P.m, C, true);
  if (mus.has('epaule')) s.push(rond(P.e, 5.2, `fill="${M}"`));
  if (mus.has('epaule-arriere')) s.push(rond(vers(P.e, Math.atan2(dos[1], dos[0]) * 180 / Math.PI, 3), 4.6, `fill="${M}"`));
  return s.join('');
}

// =====================================================================
// Personnage de FACE (ou de dos : la silhouette est la même)
// =====================================================================

/**
 * @param o.cx, o.ye     centre et hauteur des épaules
 * @param o.bras, o.avant    angles du bras DROIT (à droite de l'image) ; le gauche est en miroir
 * @param o.brasG, o.avantG  pour un bras gauche différent (angles donnés comme pour le droit)
 * @param o.cuisse, o.tibia  angles de la jambe droite ; la gauche est en miroir
 * @param o.muscles      epaules, pecs, pecs-bas, trapezes, dorsaux, haut-dos, abdos, biceps, triceps,
 *                       avant-bras, quadriceps, adducteurs, moyen-fessier, mollets
 * @returns {svg, mD, mG, cD, cG, pD, pG} le dessin et la position des mains, coudes et pieds
 */
function deFace(o) {
  const { cx, ye } = o;
  const mus = new Set(o.muscles || []);
  const yh = ye + 40;
  const s = [];
  const miroir = ([x, y]) => [2 * cx - x, y];
  // Articulations du côté droit, puis miroir pour le gauche.
  const eD = [cx + 17, ye + 1];
  const cD = vers(eD, o.bras ?? 85, L.bras);
  const mD = vers(cD, o.avant ?? o.bras ?? 85, L.avant);
  const eG = miroir(eD);
  const cG = miroir(vers(eD, o.brasG ?? o.bras ?? 85, L.bras));
  const mG = miroir(vers(vers(eD, o.brasG ?? o.bras ?? 85, L.bras), o.avantG ?? o.brasG ?? o.avant ?? o.bras ?? 85, L.avant));
  const hD = [cx + 7.5, yh + 1];
  const gD = vers(hD, o.cuisse ?? 88, L.cuisse);
  const pD = vers(gD, o.tibia ?? 90, L.tibia);
  const hG = miroir(hD); const gG = miroir(gD); const pG = miroir(pD);

  // Jambes
  for (const [h, g, p, sens] of [[hD, gD, pD, 1], [hG, gG, pG, -1]]) {
    s.push(trait([h, g, p], C, EP.jambe));
    if (o.pieds !== false) s.push(trait([p, [p[0] + sens * 5, p[1] + 1]], C, 7));
    const interieur = coteDe(h, g, [-sens, 0]);
    if (mus.has('quadriceps')) s.push(bande(h, g, 0.2, 0.85, 1, 0, 5.6));
    if (mus.has('adducteurs')) s.push(bande(h, g, 0.12, 0.7, interieur, 2.4, 5.2));
    if (mus.has('mollets')) s.push(bande(g, p, 0.1, 0.58, 1, 0, 5.4));
  }
  // Buste : un trapèze plein (épaules plus larges que les hanches)
  s.push(`<path d="M${cx - 13} ${ye}H${cx + 13}L${cx + 8} ${yh}H${cx - 8}Z" fill="${C}" stroke="${C}" stroke-width="10"></path>`);
  if (mus.has('pecs')) s.push(trait([[cx - 12, ye + 7], [cx - 3.5, ye + 8]], M, 7.6), trait([[cx + 12, ye + 7], [cx + 3.5, ye + 8]], M, 7.6));
  if (mus.has('pecs-bas')) s.push(trait([[cx - 12, ye + 11], [cx - 3.5, ye + 12]], M, 5.6), trait([[cx + 12, ye + 11], [cx + 3.5, ye + 12]], M, 5.6));
  if (mus.has('trapezes')) s.push(trait([[cx - 5, ye - 2.5], [cx - 12, ye - 1]], M, 4.6), trait([[cx + 5, ye - 2.5], [cx + 12, ye - 1]], M, 4.6));
  if (mus.has('dorsaux')) s.push(trait([[cx - 12.5, ye + 9], [cx - 8, ye + 27]], M, 7), trait([[cx + 12.5, ye + 9], [cx + 8, ye + 27]], M, 7));
  if (mus.has('haut-dos')) s.push(trait([[cx - 6, ye + 4], [cx + 6, ye + 4]], M, 6));
  if (mus.has('abdos')) s.push(trait([[cx, ye + 17], [cx, ye + 37]], M, 9));
  if (mus.has('moyen-fessier')) s.push(rond([cx - 11, yh - 1], 4.6, `fill="${M}"`), rond([cx + 11, yh - 1], 4.6, `fill="${M}"`));
  // Tête
  s.push(rond([cx, ye - 18], EP.tete, `fill="${C}"`));
  // Bras
  for (const [e, c, m] of [[eD, cD, mD], [eG, cG, mG]]) {
    s.push(trait([e, c, m], F, EP.bras + 4), trait([e, c, m], C, EP.bras));
    if (mus.has('biceps') || mus.has('triceps')) s.push(bande(e, c, 0.25, 0.85, 1, 0, 4.8));
    if (mus.has('avant-bras')) s.push(bande(c, m, 0.1, 0.7, 1, 0, 4.6));
  }
  if (mus.has('epaules')) s.push(rond(eD, 5.4, `fill="${M}"`), rond(eG, 5.4, `fill="${M}"`));
  if (mus.has('epaule-d')) s.push(rond(eD, 5.4, `fill="${M}"`));
  return { svg: s.join(''), mD, mG, cD, cG, pD, pG, gD, gG };
}

// =====================================================================
// Matériel
// =====================================================================

const sol = trait([[8, SOL], [152, SOL]], G, 2, ' opacity=".6"');
/** Banc plat vu de côté : assise entre x1 et x2, dessus à la hauteur y. */
const banc = (x1, x2, y) => `<rect x="${x1}" y="${y}" width="${x2 - x1}" height="7" rx="3.5" fill="${G}"></rect>`
  + trait([[x1 + 12, y + 7], [x1 + 12, SOL]], G, 3.5) + trait([[x2 - 12, y + 7], [x2 - 12, SOL]], G, 3.5);
/** Coussin (dossier, assise, appui) : un gros trait gris. */
const coussin = (a, b, ep = 6) => trait([a, b], G, ep);
/** Montant ou bâti de machine : trait gris plus fin. */
const bati = (...points) => trait(points, G, 3.5);
/** Câble de poulie, avec sa poulie au point de départ. */
const cable = (a, b) => trait([a, b], G, 1.8) + rond(a, 3.5, `fill="${F}" stroke="${G}" stroke-width="2.5"`);
/** Barre chargée vue de côté : on voit le disque de face. */
const disque = (c, r = 13) => rond(c, r, `fill="${F}" stroke="${A}" stroke-width="4.5"`) + rond(c, 3, `fill="${A}"`);
/** Haltère vu de côté. */
const haltere = (c) => rond(c, 6, `fill="${F}" stroke="${A}" stroke-width="3.6"`) + rond(c, 1.6, `fill="${A}"`);
/** Haltère vu de face, tenu à l'horizontale (ou à la verticale). */
const haltereFace = ([x, y], vertical = false) => (vertical
  ? trait([[x, y - 7], [x, y + 7]], A, 3) + trait([[x - 4, y - 7], [x + 4, y - 7]], A, 4.5) + trait([[x - 4, y + 7], [x + 4, y + 7]], A, 4.5)
  : trait([[x - 7, y], [x + 7, y]], A, 3) + trait([[x - 7, y - 4], [x - 7, y + 4]], A, 4.5) + trait([[x + 7, y - 4], [x + 7, y + 4]], A, 4.5));
/** Barre chargée vue de face. */
const barreFace = (x1, x2, y) => trait([[x1, y], [x2, y]], A, 3.2)
  + trait([[x1 + 5, y - 9], [x1 + 5, y + 9]], A, 5) + trait([[x2 - 5, y - 9], [x2 - 5, y + 9]], A, 5);
/** Poignée ou coussin mobile : trait de la couleur du thème. */
const mobile = (a, b, ep = 4.5) => trait([a, b], A, ep);
/** Kettlebell. */
const kettlebell = ([x, y]) => `<path d="M${n1(x - 4)} ${n1(y + 3)}V${n1(y - 1)}a4 4 0 0 1 8 0V${n1(y + 3)}" stroke="${A}" stroke-width="2.6"></path>` + rond([x, y + 9], 6.5, `fill="${A}"`);

// =====================================================================
// Mouvement
// =====================================================================

/** Flèche droite de a vers b ; `double` = pointe aux deux bouts (aller-retour). */
function fleche(a, b, double = false) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  const pointe = (o, sens) => trait([vers(o, sens + 150, 7), o, vers(o, sens - 150, 7)], A, 2.8);
  return detail(trait([a, b], A, 2.8) + pointe(b, ang) + (double ? pointe(a, ang + 180) : ''));
}
/** Flèche courbe : part de a, arrive en b, bombée de `creux` (signe = côté). */
function arc(a, b, creux) {
  const milieu = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const d = moins(b, a);
  const long = Math.hypot(d[0], d[1]) || 1;
  const ctrl = [milieu[0] - (d[1] / long) * creux, milieu[1] + (d[0] / long) * creux];
  const ang = Math.atan2(b[1] - ctrl[1], b[0] - ctrl[0]) * 180 / Math.PI;
  return detail(`<path d="M${pt(a)}Q${pt(ctrl)} ${pt(b)}" stroke="${A}" stroke-width="2.8"></path>`
    + trait([vers(b, ang + 150, 7), b, vers(b, ang - 150, 7)], A, 2.8));
}
/** Autre position de la charge, en pointillés. */
const fantome = (c, r = 13) => detail(rond(c, r, `stroke="${A}" stroke-width="2.4" stroke-dasharray="2.5 6" opacity=".75"`));
/** Réduit tout le dessin en gardant les pieds au sol (pour les charges au-dessus de la tête). */
const reduit = (svg, k = 0.82) => `<g transform="translate(${n1(80 * (1 - k))} ${n1(SOL * (1 - k))}) scale(${k})">${svg}</g>`;

// =====================================================================
// Poses de base réutilisées par plusieurs exercices
// =====================================================================

/** Allongé sur le dos sur un banc plat, bras tendus vers le haut. */
function allonge(muscles, bras = -90, avant = -90) {
  const P = pose({ h: [102, 106], torse: 180, cuisse: 12, tibia: 88, bras, avant });
  return { P, svg: sol + banc(34, 122, 116) + profil(P, { muscles, face: [0, -1] }) };
}
/** Sur un banc incliné, bras tendus vers le haut. */
function incline(muscles, bras = -90, avant = -90) {
  const P = pose({ h: [92, 114], torse: -135, cuisse: 0, tibia: 90, bras, avant });
  const dossier = coussin(vers(P.h, -135, -4).map((v, i) => v + (i ? 10 : -10)), vers(P.e, -135, 14).map((v, i) => v + (i ? 10 : -10)));
  return { P, svg: sol + dossier + coussin([84, 126], [112, 126]) + bati([70, 112], [70, SOL]) + bati([100, 126], [100, SOL]) + profil(P, { muscles, face: [0.7, -0.7] }) };
}
/** Assis de profil sur un siège avec dossier. `torse` < -90 = penché en arrière. */
function assis(o, muscles, optsProfil = {}) {
  const P = pose({ h: [58, 114], cuisse: 0, tibia: 90, ...o });
  const t = o.torse ?? -90;
  const dossier = o.sansDossier ? '' : coussin(vers(vers(P.h, t, 2), t - 90, 14), vers(vers(P.e, t, 2), t - 90, 14));
  const siege = coussin([46, 126], [82, 126]) + bati([64, 126], [64, SOL]);
  return { P, svg: sol + dossier + siege + profil(P, { muscles, ...optsProfil }) };
}
/** Debout de profil. */
function debout(o, muscles, optsProfil = {}) {
  const P = pose({ h: [o.x ?? 70, 0], auSol: true, ...o });
  return { P, svg: sol + profil(P, { muscles, ...optsProfil }) };
}
/** Siège vu de face, derrière le personnage. */
const siegeFace = (cx, yh) => coussin([cx - 20, yh + 8], [cx + 20, yh + 8]) + bati([cx, yh + 8], [cx, SOL]);

// =====================================================================
// Les schémas, un par exercice
// =====================================================================

const DESSINS = {};
/** Enregistre un schéma : `fabrique` renvoie le SVG. */
const schema = (id, fabrique) => { DESSINS[id] = fabrique(); };

// ---------- Pecs ----------
schema('couche-barre', () => {
  const { P, svg } = allonge(['pecs']);
  return bati([44, SOL], [44, 62]) + svg + fantome([P.m[0], 84]) + disque([P.m[0], P.m[1] - 3]) + fleche([92, 62], [92, 88], true);
});
schema('couche', () => {
  const { P, svg } = allonge(['pecs']);
  return svg + fantome([P.m[0] + 4, 88], 7) + haltere([P.m[0], P.m[1] - 2]) + fleche([88, 62], [88, 88], true);
});
schema('smith', () => {
  const { P, svg } = allonge(['pecs']);
  return bati([P.m[0], 8], [P.m[0], SOL]) + svg + fantome([P.m[0], 84]) + disque([P.m[0], P.m[1] - 3]) + fleche([92, 62], [92, 88], true);
});
schema('incline-barre', () => {
  const { P, svg } = incline(['pecs-haut']);
  return svg + fantome([P.m[0] + 6, P.m[1] + 24]) + disque([P.m[0], P.m[1] - 3]) + fleche([92, 40], [92, 66], true);
});
schema('incline', () => {
  const { P, svg } = incline(['pecs-haut']);
  return svg + fantome([P.m[0] + 6, P.m[1] + 24], 7) + haltere([P.m[0], P.m[1] - 2]) + fleche([88, 42], [88, 66], true);
});
schema('machine-pecs', () => {
  const { P, svg } = assis({ bras: 8, avant: -4 }, ['pecs', 'triceps']);
  return bati([138, 30], [138, SOL]) + bati([138, 60], [P.m[0] + 4, P.m[1]]) + svg + mobile([P.m[0] + 3, P.m[1] - 9], [P.m[0] + 3, P.m[1] + 9])
    + fleche([88, 52], [118, 52]);
});
schema('machine-inclinee', () => {
  const { P, svg } = assis({ torse: -108, bras: -38, avant: -44 }, ['pecs-haut', 'epaule']);
  return bati([138, 30], [138, SOL]) + bati([138, 44], [P.m[0] + 4, P.m[1]]) + svg + mobile(vers(P.m, 45, 9), vers(P.m, 225, 9))
    + fleche([96, 70], [118, 50]);
});
schema('ecarte', () => {
  const f = deFace({ cx: 80, ye: 62, bras: 4, avant: -86, muscles: ['pecs'] });
  return sol + siegeFace(80, 102) + f.svg + mobile([f.cD[0] + 7, f.cD[1] + 2], [f.mD[0] + 7, f.mD[1]], 6) + mobile([f.cG[0] - 7, f.cG[1] + 2], [f.mG[0] - 7, f.mG[1]], 6)
    + arc([132, 34], [106, 30], -8) + arc([28, 34], [54, 30], 8);
});
schema('ecarte-poulie', () => {
  const f = deFace({ cx: 80, ye: 62, bras: 42, avant: 62, muscles: ['pecs'] });
  return sol + bati([12, 14], [12, SOL]) + bati([148, 14], [148, SOL]) + cable([148, 22], f.mD) + cable([12, 22], f.mG) + f.svg
    + mobile([f.mD[0] - 3, f.mD[1] - 4], [f.mD[0] + 3, f.mD[1] + 4]) + mobile([f.mG[0] + 3, f.mG[1] - 4], [f.mG[0] - 3, f.mG[1] + 4])
    + arc([128, 92], [108, 108], 8) + arc([32, 92], [52, 108], -8);
});
schema('dips', () => {
  const f = deFace({ cx: 80, ye: 44, bras: 84, avant: 96, cuisse: 90, tibia: 90, muscles: ['pecs-bas', 'triceps'] });
  return sol + bati([f.mD[0] + 2, f.mD[1] + 5], [f.mD[0] + 2, SOL]) + bati([f.mG[0] - 2, f.mG[1] + 5], [f.mG[0] - 2, SOL])
    + coussin([f.mD[0] - 6, f.mD[1] + 5], [f.mD[0] + 10, f.mD[1] + 5], 4.5) + coussin([f.mG[0] - 10, f.mG[1] + 5], [f.mG[0] + 6, f.mG[1] + 5], 4.5)
    + f.svg + fleche([132, 40], [132, 68], true);
});
schema('pompes', () => {
  const P = pose({ h: [84, 116], torse: 198, cuisse: 18, tibia: 18, bras: 90, avant: 90 });
  return sol + profil(P, { muscles: ['pecs', 'triceps'], face: [0, 1], pied: 90 }) + fleche([66, 70], [66, 92], true);
});

// ---------- Épaules ----------
schema('militaire', () => {
  const f = deFace({ cx: 80, ye: 66, bras: -40, avant: -90, muscles: ['epaules'] });
  return sol + siegeFace(80, 106) + f.svg + haltereFace([f.mD[0], f.mD[1] - 4]) + haltereFace([f.mG[0], f.mG[1] - 4]) + fleche([80, 34], [80, 10]);
});
schema('militaire-barre', () => {
  const { P, svg } = debout({ bras: -84, avant: -92 }, ['epaule', 'triceps']);
  return reduit(svg + fantome([P.e[0] + 12, P.e[1] - 2]) + disque([P.m[0], P.m[1] - 3]) + fleche([102, P.e[1] - 4], [102, P.m[1]], true));
});
schema('machine-epaules', () => {
  const f = deFace({ cx: 80, ye: 70, bras: -38, avant: -90, muscles: ['epaules'] });
  return sol + siegeFace(80, 110) + bati([f.mG[0], 14], [f.mD[0], 14]) + bati([f.mD[0], 14], [f.mD[0], f.mD[1] - 8]) + bati([f.mG[0], 14], [f.mG[0], f.mG[1] - 8])
    + f.svg + mobile([f.mD[0] - 8, f.mD[1] - 3], [f.mD[0] + 8, f.mD[1] - 3]) + mobile([f.mG[0] - 8, f.mG[1] - 3], [f.mG[0] + 8, f.mG[1] - 3]) + fleche([80, 40], [80, 20]);
});
schema('elevation', () => {
  const f = deFace({ cx: 80, ye: 60, bras: 8, avant: 4, muscles: ['epaules'] });
  return sol + f.svg + haltereFace([f.mD[0] + 2, f.mD[1]], true) + haltereFace([f.mG[0] - 2, f.mG[1]], true)
    + arc([132, 104], [142, 80], -8) + arc([28, 104], [18, 80], 8);
});
schema('elevation-poulie', () => {
  const f = deFace({ cx: 76, ye: 60, bras: 8, avant: 4, brasG: 86, avantG: 92, muscles: ['epaule-d'] });
  return sol + bati([14, 40], [14, SOL]) + cable([14, 140], f.mD) + f.svg + mobile([f.mD[0], f.mD[1] - 5], [f.mD[0], f.mD[1] + 5]) + arc([128, 104], [138, 80], -8);
});
schema('oiseau', () => {
  const f = deFace({ cx: 80, ye: 66, bras: 2, avant: -4, muscles: ['epaules', 'haut-dos'] });
  return sol + siegeFace(80, 106) + f.svg + mobile([f.mD[0] + 2, f.mD[1] - 8], [f.mD[0] + 2, f.mD[1] + 8]) + mobile([f.mG[0] - 2, f.mG[1] - 8], [f.mG[0] - 2, f.mG[1] + 8])
    + arc([112, 44], [136, 50], -6) + arc([48, 44], [24, 50], 6);
});

// ---------- Triceps ----------
const tricepsPoulie = (poignee) => {
  const { P, svg } = debout({ x: 62, bras: 84, avant: 62 }, ['triceps']);
  return bati([124, 10], [124, SOL]) + bati([124, 12], [96, 12]) + cable([96, 14], P.m) + svg + poignee(P.m)
    + fantome(vers(P.c, 5, L.avant), 5) + arc(vers(P.m, 0, 12), vers(vers(P.c, 5, L.avant), 60, 12), -6);
};
schema('triceps', () => tricepsPoulie((m) => mobile([m[0] - 2, m[1] - 5], [m[0] + 2, m[1] + 6])));
schema('triceps-barre', () => tricepsPoulie((m) => mobile([m[0] - 8, m[1]], [m[0] + 8, m[1]])));
schema('barre-front', () => {
  const { P, svg } = allonge(['triceps'], -96, 196);
  return svg + fantome([P.c[0] + 2, P.c[1] - 22], 9) + disque(P.m, 9) + arc([P.m[0] + 2, P.m[1] - 14], [P.c[0] + 16, P.c[1] - 26], -8);
});
schema('extension-nuque', () => {
  const { P, svg } = assis({ bras: -88, avant: 118 }, ['triceps']);
  return svg + fantome([P.c[0], P.c[1] - 22], 6) + haltere(P.m) + arc([P.m[0] - 10, P.m[1] - 6], [P.c[0] - 12, P.c[1] - 24], 8);
});
schema('machine-dips', () => {
  const { P, svg } = assis({ bras: 100, avant: 78 }, ['triceps', 'pecs-bas']);
  return bati([28, 60], [28, SOL]) + bati([28, 76], [P.m[0], P.m[1] + 2]) + svg + mobile([P.m[0] - 8, P.m[1] + 2], [P.m[0] + 8, P.m[1] + 2]) + fleche([P.m[0] + 16, 86], [P.m[0] + 16, 112]);
});

// ---------- Dos ----------
schema('tirage-v', () => {
  const f = deFace({ cx: 80, ye: 72, bras: -58, avant: -84, muscles: ['dorsaux', 'biceps'] });
  return sol + siegeFace(80, 112) + cable([80, 8], [80, f.mD[1] - 2]) + f.svg + mobile([f.mG[0] - 8, f.mD[1] - 2], [f.mD[0] + 8, f.mD[1] - 2]) + fleche([132, 30], [132, 58]);
});
schema('tirage-v-serre', () => {
  const f = deFace({ cx: 80, ye: 72, bras: -72, avant: -118, muscles: ['dorsaux', 'biceps'] });
  return sol + siegeFace(80, 112) + cable([80, 8], [80, f.mD[1] - 2]) + f.svg + mobile([f.mG[0] - 4, f.mD[1] - 2], [f.mD[0] + 4, f.mD[1] - 2]) + fleche([132, 30], [132, 58]);
});
schema('tractions', () => {
  const f = deFace({ cx: 80, ye: 60, bras: -56, avant: -90, muscles: ['dorsaux', 'biceps'], pieds: false });
  return sol + bati([20, 20], [20, SOL]) + bati([140, 20], [140, SOL]) + coussin([20, f.mD[1] - 3], [140, f.mD[1] - 3], 4.5) + f.svg + fleche([124, 76], [124, 46]);
});
schema('tirage-h', () => {
  const P = pose({ h: [50, 112], torse: -92, cuisse: 4, tibia: 26, bras: 118, avant: 2 });
  return sol + banc(30, 76, 122) + bati([140, 60], [140, SOL]) + coussin([P.p[0] + 6, P.p[1] - 12], [P.p[0] + 6, P.p[1] + 8], 4.5) + cable([140, P.m[1]], P.m)
    + profil(P, { muscles: ['dorsaux', 'biceps'], pied: -70 }) + mobile([P.m[0] + 2, P.m[1] - 6], [P.m[0] + 2, P.m[1] + 6]) + fleche([112, P.m[1] - 14], [86, P.m[1] - 14]);
});
schema('rowing-barre', () => {
  const P = pose({ h: [58, 0], torse: -28, cuisse: 72, tibia: 100, bras: 104, avant: 82, auSol: true });
  return sol + profil(P, { muscles: ['dorsaux', 'epaule-arriere', 'biceps'] }) + fantome([P.m[0] + 2, P.m[1] + 20]) + disque([P.m[0], P.m[1] + 2]) + fleche([P.m[0] + 24, P.m[1] + 22], [P.m[0] + 24, P.m[1] - 2]);
});
schema('rowing-haltere', () => {
  const P = pose({ h: [50, 0], torse: -14, cuisse: 80, tibia: 96, bras: 158, avant: 84, bras2: 90, avant2: 90, auSol: true });
  return sol + banc(76, 138, P.m2[1] + 4) + profil(P, { muscles: ['dorsaux', 'biceps'] }) + fantome([P.m[0] + 18, P.m[1] + 16], 6) + haltere([P.m[0], P.m[1] + 3]) + arc([P.m[0] + 22, P.m[1] + 28], [P.m[0] + 10, P.m[1] + 2], 6);
});
schema('rowing-machine', () => {
  const { P, svg } = assis({ sansDossier: true, bras: 128, avant: 2 }, ['dorsaux', 'biceps']);
  return coussin([P.e[0] + 13, P.e[1] + 2], [P.h[0] + 13, P.h[1] - 12]) + bati([P.e[0] + 13, P.e[1] + 16], [138, P.e[1] + 16]) + bati([138, 50], [138, SOL])
    + bati([138, 62], [P.m[0] + 3, P.m[1]]) + svg + mobile([P.m[0] + 2, P.m[1] - 7], [P.m[0] + 2, P.m[1] + 7]) + fleche([124, P.m[1] + 14], [98, P.m[1] + 14]);
});
schema('pull-over', () => {
  const { P, svg } = debout({ x: 56, torse: -78, bras: 28, avant: 22 }, ['dorsaux']);
  return bati([132, 10], [132, SOL]) + cable([130, 16], P.m) + svg + mobile([P.m[0] - 6, P.m[1] - 4], [P.m[0] + 6, P.m[1] + 4]) + fantome([P.e[0] + 14, P.e[1] + 38], 5) + arc([P.m[0] - 2, P.m[1] + 12], [P.e[0] + 24, P.e[1] + 38], -8);
});
schema('face-pull', () => {
  const { P, svg } = debout({ x: 56, torse: -94, bras: -8, avant: -4 }, ['epaule-arriere', 'trapezes']);
  return bati([134, 10], [134, SOL]) + cable([132, P.m[1] - 2], P.m) + svg + mobile([P.m[0], P.m[1] - 6], [P.m[0], P.m[1] + 6]) + fleche([P.m[0] - 2, P.m[1] - 16], [P.e[0] + 14, P.m[1] - 16]);
});
schema('souleve-terre', () => {
  const P = pose({ h: [56, 0], torse: -42, cuisse: 58, tibia: 102, bras: 90, avant: 90, auSol: true });
  return sol + profil(P, { muscles: ['lombaires', 'dorsaux', 'fessiers', 'ischios'] }) + disque([P.m[0], P.m[1] + 4], 15) + fleche([126, 124], [126, 86]);
});
schema('shrugs', () => {
  const f = deFace({ cx: 80, ye: 60, bras: 84, avant: 90, muscles: ['trapezes'] });
  return sol + f.svg + haltereFace([f.mD[0] + 1, f.mD[1] + 3]) + haltereFace([f.mG[0] - 1, f.mG[1] + 3]) + fleche([118, 62], [118, 44]) + fleche([42, 62], [42, 44]);
});

// ---------- Biceps ----------
const curlDebout = (charge, muscles = ['biceps'], avant = -18, brasLoin = false) => {
  const { P, svg } = debout({ x: 66, bras: 96, avant, ...(brasLoin ? { bras2: 88, avant2: 84 } : {}) }, muscles);
  return { P, svg: (brasLoin ? haltere([P.m2[0] + 1, P.m2[1] + 3]) : '') + svg + charge(P.m) + arc([P.c[0] + 30, P.c[1] + 12], [P.m[0] + 20, P.m[1] - 4], -8) };
};
schema('curl-debout', () => curlDebout((m) => disque(m, 9)).svg);
schema('curl-halteres', () => curlDebout((m) => haltere(m), ['biceps'], -18, true).svg);
schema('curl-marteau', () => curlDebout((m) => mobile([m[0] + 1, m[1] - 9], [m[0] + 1, m[1] + 7], 3) + mobile([m[0] - 3, m[1] - 9], [m[0] + 5, m[1] - 9]) + mobile([m[0] - 3, m[1] + 7], [m[0] + 5, m[1] + 7]), ['biceps', 'avant-bras'], -8).svg);
schema('curl', () => {
  const { P, svg } = assis({ sansDossier: true, torse: -78, bras: 40, avant: -64 }, ['biceps']);
  return coussin(vers(P.e, 40, 4).map((v, i) => v + (i ? 9 : -4)), vers(P.c, 40, 6).map((v, i) => v + (i ? 9 : -4))) + bati([P.c[0] + 2, P.c[1] + 12], [P.c[0] + 2, SOL])
    + svg + disque(P.m, 9) + arc([P.c[0] + 22, P.c[1] + 2], [P.m[0] + 18, P.m[1] + 2], -7);
});
schema('curl-poulie', () => {
  const { P, svg } = debout({ x: 60, bras: 96, avant: 14 }, ['biceps']);
  return bati([134, 40], [134, SOL]) + cable([132, 142], P.m) + svg + mobile([P.m[0] - 2, P.m[1] - 7], [P.m[0] + 2, P.m[1] + 7]) + arc([P.m[0] + 10, P.m[1] - 8], [P.c[0] + 18, P.c[1] - 22], -8);
});
schema('curl-incline', () => {
  const { P, svg } = incline(['biceps'], 96, 30);
  return svg + haltere([P.m[0] + 2, P.m[1] + 3]) + arc([P.m[0] + 14, P.m[1] - 4], [P.c[0] + 20, P.c[1] - 22], -8);
});

// ---------- Jambes ----------
/** Squat de profil ; `devant` = barre sur l'avant des épaules. */
const squat = (devant, muscles) => {
  const P = pose({ h: [58, 0], torse: devant ? -80 : -66, cuisse: 16, tibia: 106, auSol: true, ...(devant ? { bras: -4, avant: -168 } : { bras: 128, avant: -84 }) });
  const barre = devant ? [P.e[0] + 9, P.e[1] - 4] : vers(P.e, -170, 9);
  return { P, barre, svg: sol + profil(P, { muscles }) + disque(barre, 11) + fleche([128, 60], [128, 100], true) };
};
schema('squat', () => squat(false, ['quadriceps', 'fessiers']).svg);
schema('squat-smith', () => {
  const s = squat(false, ['quadriceps', 'fessiers']);
  return bati([s.barre[0], 8], [s.barre[0], SOL]) + s.svg;
});
schema('squat-avant', () => squat(true, ['quadriceps', 'abdos']).svg);
schema('hack-squat', () => {
  const P = pose({ h: [56, 108], torse: -118, cuisse: 14, tibia: 118, bras: 60, avant: -110 });
  return sol + coussin(vers(vers(P.h, -118, -4), 152, 13), vers(vers(P.e, -118, 12), 152, 13)) + bati([14, 40], [14, SOL]) + bati([14, SOL - 2], [96, SOL - 2])
    + coussin([P.p[0] - 12, P.p[1] + 10], [P.p[0] + 16, P.p[1] - 4], 4.5) + profil(P, { muscles: ['quadriceps'], pied: -28 }) + fleche([118, 96], [100, 62], true);
});
/** Presse à cuisses ; `tendu` = jambes tendues (travail des mollets). */
const presse = (tendu, muscles) => {
  const P = pose({ h: [74, 126], torse: -152, bras: 70, avant: 20, ...(tendu ? { cuisse: -52, tibia: -52 } : { cuisse: -78, tibia: -22 }) });
  const plateau = [vers(P.p, -52 + 90, 14), vers(P.p, -52 - 90, 22)].map((q) => vers(q, -52, 8));
  return sol + coussin(vers(vers(P.h, -152, -2), 118, 13), vers(vers(P.e, -152, 14), 118, 13)) + coussin([60, 138], [88, 138]) + bati([20, SOL], [140, SOL])
    + bati(vers(P.p, -52, 9), [150, 26]) + profil(P, { muscles, pied: tendu ? -128 : -142 }) + mobile(plateau[0], plateau[1], 5)
    + (tendu ? arc([P.p[0] + 22, P.p[1] + 6], [P.p[0] + 26, P.p[1] - 10], -5) : fleche([P.g[0] + 26, P.g[1] + 22], [P.g[0] + 44, P.g[1] - 2], true));
};
schema('presse', () => presse(false, ['fessiers', 'ischios', 'quadriceps']));
schema('mollets-presse', () => presse(true, ['mollets']));
/** Fente ; `banc` = pied arrière posé sur un banc (fente bulgare) ; `charge` dessine ce qui est porté. */
const fente = (surBanc, charge, muscles = ['quadriceps', 'fessiers']) => {
  const P = pose({ h: [72, 0], torse: -88, cuisse: 12, tibia: 92, bras: 90, avant: 90, auSol: true, ...(surBanc ? { cuisse2: 122, tibia2: 196 } : { cuisse2: 118, tibia2: 172 }) });
  return sol + (surBanc ? banc(10, 50, P.p2[1] + 6) : '') + profil(P, { muscles, pied2: surBanc ? 200 : 95 }) + charge(P) + fleche([128, 70], [128, 104], true);
};
schema('fentes', () => fente(false, (P) => haltere([P.m[0], P.m[1] + 3])));
schema('bulgare', () => fente(true, (P) => haltere([P.m[0], P.m[1] + 3])));
schema('leg-ext', () => {
  const { P, svg } = assis({ torse: -100, tibia: 14, bras: 96, avant: 60 }, ['quadriceps'], { pied: -70 });
  const bas = vers(P.g, 88, L.tibia);
  return svg + fantome(bas, 6) + mobile(vers(P.p, 284, 8), vers(P.p, 284, -2), 7) + arc([bas[0] + 12, bas[1] - 2], [P.p[0] + 4, P.p[1] + 16], -8);
});
schema('rdl', () => {
  const P = pose({ h: [52, 0], torse: -24, cuisse: 96, tibia: 88, bras: 90, avant: 90, auSol: true });
  return sol + profil(P, { muscles: ['ischios', 'fessiers'] }) + disque([P.m[0], P.m[1] + 3]) + fleche([P.m[0] + 26, P.m[1] + 4], [P.m[0] + 26, P.m[1] - 30], true);
});
schema('leg-curl', () => {
  const P = pose({ h: [88, 104], torse: 180, cuisse: 4, tibia: -62, bras: 96, avant: 150 });
  return sol + banc(30, 124, 114) + profil(P, { muscles: ['ischios'], face: [0, 1], pied: -150 }) + mobile(vers(P.p, 28, 7), vers(P.p, 28, -3), 7)
    + fantome(vers(P.g, 6, L.tibia), 6) + arc([P.g[0] + 36, P.g[1] - 8], [P.p[0] + 14, P.p[1] - 6], -8);
});
schema('leg-curl-assis', () => {
  const { P, svg } = assis({ torse: -104, tibia: 128, bras: 96, avant: 60 }, ['ischios'], { pied: 40 });
  return svg + fantome(vers(P.g, 20, L.tibia), 6) + mobile(vers(P.p, 38, 7), vers(P.p, 38, -3), 7) + arc(vers(vers(P.g, 20, L.tibia), 90, 12), [P.p[0] + 14, P.p[1] + 4], -8);
});
schema('hip-thrust', () => {
  const P = pose({ e: [50, 110], torse: 180, cuisse: 0, tibia: 90, bras: 20, avant: -10 });
  return sol + banc(14, 58, 121) + profil(P, { muscles: ['fessiers'], face: [0, -1] }) + disque([P.h[0] - 2, P.h[1] - 14], 13) + fleche([P.h[0] + 22, 126], [P.h[0] + 22, 96], true);
});
schema('abducteurs', () => {
  const f = deFace({ cx: 80, ye: 58, bras: 80, avant: 100, cuisse: 58, tibia: 90, muscles: ['moyen-fessier'] });
  return sol + siegeFace(80, 98) + f.svg + mobile([f.gD[0] + 8, f.gD[1] - 8], [f.gD[0] + 8, f.gD[1] + 8], 6) + mobile([f.gG[0] - 8, f.gG[1] - 8], [f.gG[0] - 8, f.gG[1] + 8], 6)
    + fleche([f.gD[0] + 16, f.gD[1]], [f.gD[0] + 34, f.gD[1]]) + fleche([f.gG[0] - 16, f.gG[1]], [f.gG[0] - 34, f.gG[1]]);
});
schema('adducteurs', () => {
  const f = deFace({ cx: 80, ye: 58, bras: 80, avant: 100, cuisse: 58, tibia: 90, muscles: ['adducteurs'] });
  return sol + siegeFace(80, 98) + f.svg + mobile([f.gD[0] - 8, f.gD[1] - 8], [f.gD[0] - 8, f.gD[1] + 8], 6) + mobile([f.gG[0] + 8, f.gG[1] - 8], [f.gG[0] + 8, f.gG[1] + 8], 6)
    + fleche([f.gD[0] + 34, f.gD[1]], [f.gD[0] + 16, f.gD[1]]) + fleche([f.gG[0] - 34, f.gG[1]], [f.gG[0] - 16, f.gG[1]]);
});
/** Debout sur une marche, sur la pointe des pieds. */
const surMarche = (extra) => {
  const P = pose({ h: [70, 74], bras: 92, avant: 84 });
  const marche = `<rect x="52" y="${n1(P.p[1] + 9)}" width="34" height="${n1(SOL - P.p[1] - 9)}" rx="3" fill="${G}"></rect>`;
  return sol + marche + extra(P) + profil(P, { muscles: ['mollets'], pied: 62 }) + fleche([112, 110], [112, 84], true);
};
schema('mollets-debout', () => surMarche((P) => bati([24, 20], [24, SOL]) + bati([24, P.e[1] - 13], [P.e[0] + 12, P.e[1] - 13]) + mobile([P.e[0] - 10, P.e[1] - 13], [P.e[0] + 12, P.e[1] - 13], 6)));
schema('mollets-marche', () => surMarche(() => ''));
schema('mollets', () => {
  const { P, svg } = assis({ sansDossier: true, bras: 60, avant: 10 }, ['mollets'], { pied: 50 });
  return `<rect x="${n1(P.p[0] - 2)}" y="${n1(P.p[1] + 8)}" width="22" height="${n1(SOL - P.p[1] - 8)}" rx="2.5" fill="${G}"></rect>` + svg
    + mobile([P.g[0] - 12, P.g[1] - 10], [P.g[0] + 8, P.g[1] - 10], 6) + bati([P.g[0] + 8, P.g[1] - 10], [136, 70]) + bati([136, 60], [136, SOL]) + fleche([P.g[0] + 22, 124], [P.g[0] + 22, 102], true);
});
schema('tibialis', () => {
  const { P, svg } = debout({ x: 50, torse: -96, cuisse: 80, tibia: 86, bras: 92, avant: 88 }, ['tibial'], { pied: -34 });
  return bati([30, 12], [30, SOL]) + svg + arc([P.p[0] + 22, P.p[1] + 2], [P.p[0] + 18, P.p[1] - 16], -5);
});

// ---------- Abdos ----------
schema('planche', () => {
  const P = pose({ h: [82, 126], torse: 190, cuisse: 10, tibia: 10, bras: 92, avant: 178 });
  return sol + profil(P, { muscles: ['abdos'], face: [0, 1], pied: 90 });
});
schema('releve-jambes', () => {
  const P = pose({ h: [62, 96], bras: -90, avant: -90, cuisse: -4, tibia: 4 });
  return sol + bati([24, P.m[1] - 2], [24, SOL]) + bati([24, P.m[1] - 2], [100, P.m[1] - 2]) + profil(P, { muscles: ['abdos'], pied: -80 })
    + arc([P.p[0] + 6, P.p[1] + 34], [P.p[0] + 12, P.p[1] + 12], -8);
});
schema('crunch-poulie', () => {
  const P = pose({ h: [58, 108], torse: -34, cuisse: 82, tibia: 178, bras: -30, avant: -150 });
  return sol + bati([138, 10], [138, SOL]) + cable([136, 16], P.m) + profil(P, { muscles: ['abdos'], pied: 180 }) + mobile([P.m[0] - 2, P.m[1] - 6], [P.m[0] + 3, P.m[1] + 6])
    + arc([P.e[0] + 4, P.e[1] - 22], [P.e[0] + 22, P.e[1] - 2], -8);
});

// ---------- Haltérophilie ----------
schema('arrache', () => {
  const P = pose({ h: [62, 0], torse: -82, cuisse: 4, tibia: 114, bras: -92, avant: -92, auSol: true });
  return reduit(sol + profil(P, { muscles: ['quadriceps', 'fessiers', 'epaule', 'lombaires'] }) + disque([P.m[0], P.m[1] - 3], 15) + fleche([116, 120], [116, 30]));
});
schema('arrache-hang', () => {
  const P = pose({ h: [60, 0], torse: -64, cuisse: 82, tibia: 98, bras: 96, avant: 100, auSol: true });
  return sol + profil(P, { muscles: ['fessiers', 'ischios', 'trapezes'] }) + disque([P.m[0], P.m[1] + 2], 15) + fleche([124, 100], [124, 20]);
});
schema('epaule-jete', () => {
  const P = pose({ h: [74, 0], torse: -90, cuisse: 48, tibia: 100, cuisse2: 128, tibia2: 152, bras: -90, avant: -90, auSol: true });
  return reduit(sol + profil(P, { muscles: ['epaule', 'triceps', 'quadriceps'], pied2: 60 }) + disque([P.m[0], P.m[1] - 3], 15) + fleche([124, 100], [124, 20]));
});
schema('epaule', () => {
  const P = pose({ h: [62, 0], torse: -84, cuisse: 46, tibia: 112, bras: -6, avant: -170, auSol: true });
  return sol + profil(P, { muscles: ['quadriceps', 'fessiers', 'trapezes'] }) + disque([P.e[0] + 12, P.e[1] + 3], 13) + fleche([122, 130], [122, 54]);
});
schema('tirage-olympique', () => {
  const P = pose({ h: [60, 78], torse: -96, cuisse: 88, tibia: 90, bras: 70, avant: 110 });
  return sol + profil(P, { muscles: ['trapezes', 'lombaires', 'quadriceps', 'fessiers', 'mollets'], pied: 62 }) + disque([P.m[0] + 2, P.m[1] + 2], 15) + fleche([122, 130], [122, 60]);
});
schema('push-press', () => {
  const P = pose({ h: [70, 0], torse: -90, cuisse: 80, tibia: 100, bras: -86, avant: -92, auSol: true });
  return reduit(sol + profil(P, { muscles: ['epaule', 'triceps', 'quadriceps'] }) + fantome([P.e[0] + 10, P.e[1] - 4], 15) + disque([P.m[0], P.m[1] - 3], 15) + fleche([116, P.e[1]], [116, P.m[1]]));
});

// ---------- Hyrox ----------
schema('h-course', () => {
  const P = pose({ h: [76, 0], torse: -78, cuisse: 36, tibia: 108, cuisse2: 138, tibia2: 204, bras: 128, avant: 38, bras2: 46, avant2: -44, auSol: true });
  return sol + profil(P, { muscles: [], pied2: 250 }) + detail(trait([[18, 70], [38, 70]], A, 2.8) + trait([[12, 88], [34, 88]], A, 2.8) + trait([[20, 106], [36, 106]], A, 2.8));
});
schema('h-ski', () => {
  const P = pose({ h: [54, 0], torse: -62, cuisse: 80, tibia: 98, bras: 44, avant: 78, auSol: true });
  return sol + bati([132, 8], [132, SOL]) + bati([118, SOL - 2], [146, SOL - 2]) + rond([132, 26], 11, `fill="${F}" stroke="${G}" stroke-width="3.5"`) + trait([[128, 20], P.m], G, 1.8)
    + profil(P, { muscles: ['dorsaux', 'triceps', 'abdos'] }) + mobile([P.m[0] - 2, P.m[1] - 6], [P.m[0] + 2, P.m[1] + 6]) + fleche([P.m[0] + 14, P.m[1] - 26], [P.m[0] + 14, P.m[1] + 4]);
});
schema('h-rameur', () => {
  const P = pose({ h: [50, 116], torse: -104, cuisse: -22, tibia: 44, bras: 62, avant: 4 });
  return sol + bati([22, 130], [136, 130]) + bati([30, 130], [30, SOL]) + bati([124, 130], [124, SOL]) + coussin([42, 127], [60, 127], 5)
    + rond([134, 108], 15, `fill="${F}" stroke="${G}" stroke-width="3.5"`) + trait([[122, 106], P.m], G, 1.8) + coussin([P.p[0] + 7, P.p[1] - 10], [P.p[0] + 7, P.p[1] + 10], 4.5)
    + profil(P, { muscles: ['dorsaux', 'quadriceps'], pied: -66 }) + mobile([P.m[0] + 1, P.m[1] - 6], [P.m[0] + 1, P.m[1] + 6]) + fleche([104, 84], [78, 84], true);
});
schema('h-sled-push', () => {
  const P = pose({ h: [42, 0], torse: -30, cuisse: 112, tibia: 132, cuisse2: 62, tibia2: 118, bras: 8, avant: 0, auSol: true });
  const x = P.m[0] + 3;
  return sol + mobile([x, P.m[1] - 26], [x, SOL - 6], 4.5) + mobile([x + 24, P.m[1] - 26], [x + 24, SOL - 6], 4.5) + `<rect x="${n1(x - 6)}" y="${SOL - 12}" width="38" height="9" rx="4" fill="${A}"></rect>`
    + `<rect x="${n1(x + 4)}" y="${SOL - 24}" width="16" height="12" rx="2" fill="${G}"></rect>` + profil(P, { muscles: ['quadriceps', 'fessiers', 'mollets'], pied: 60 })
    + fleche([x - 2, 60], [x + 26, 60]);
});
schema('h-sled-pull', () => {
  const P = pose({ h: [44, 0], torse: -106, cuisse: 62, tibia: 104, bras: 44, avant: 6, auSol: true });
  return sol + trait([P.m, [118, SOL - 20]], A, 2.4) + `<rect x="104" y="${SOL - 12}" width="46" height="9" rx="4" fill="${A}"></rect>` + mobile([118, SOL - 34], [118, SOL - 8], 4.5)
    + `<rect x="124" y="${SOL - 24}" width="20" height="12" rx="2" fill="${G}"></rect>` + profil(P, { muscles: ['dorsaux', 'biceps', 'ischios'] }) + fleche([112, 82], [84, 82]);
});
schema('h-bbj', () => {
  const P = pose({ h: [72, 122], torse: 196, cuisse: 16, tibia: 16, bras: 90, avant: 90 });
  return sol + profil(P, { muscles: ['pecs', 'quadriceps'], face: [0, 1], pied: 90 }) + arc([96, 92], [150, 104], -26);
});
schema('h-farmers', () => {
  const P = pose({ h: [76, 0], torse: -90, cuisse: 72, tibia: 100, cuisse2: 108, tibia2: 110, bras: 90, avant: 90, auSol: true });
  return sol + profil(P, { muscles: ['avant-bras', 'trapezes'], pied2: 20 }) + kettlebell([P.m[0], P.m[1] + 5]) + fleche([106, 60], [134, 60]);
});
schema('h-fentes', () => fente(false, (P) => `<rect x="${n1(P.e[0] - 16)}" y="${n1(P.e[1] - 13)}" width="30" height="11" rx="5.5" fill="${A}"></rect>`));
schema('h-wallball', () => {
  const P = pose({ h: [50, 0], torse: -80, cuisse: 30, tibia: 112, bras: -62, avant: -70, auSol: true });
  return sol + bati([146, 6], [146, SOL]) + coussin([138, 18], [146, 18], 4.5) + profil(P, { muscles: ['quadriceps', 'epaule'] }) + rond([P.m[0] + 6, P.m[1] - 8], 9, `fill="${A}"`)
    + arc([P.m[0] + 20, P.m[1] - 14], [130, 24], 10);
});
schema('h-velo', () => {
  const P = pose({ h: [58, 84], torse: -58, cuisse: 52, tibia: 96, cuisse2: 80, tibia2: 120, bras: 34, avant: 20 });
  const roue = (x) => rond([x, 122], 24, `stroke="${G}" stroke-width="3.5"`);
  return sol + roue(36) + roue(124) + bati([36, 122], [56, 94], [100, 94], [124, 122]) + bati([56, 94], [78, 124], [100, 94]) + bati([100, 94], [P.m[0], P.m[1] + 4])
    + profil(P, { muscles: ['quadriceps'], pied: 10, pied2: 10 });
});
schema('h-mobilite', () => {
  const f = deFace({ cx: 80, ye: 49, bras: -62, avant: -78, cuisse: 76, tibia: 90, muscles: [] });
  return sol + f.svg + arc([120, 18], [138, 40], -8) + arc([40, 18], [22, 40], 8);
});
schema('h-repos', () => rond([80, 80], 50, `stroke="${G}" stroke-width="5"`) + trait([[80, 46], [80, 80], [104, 96]], A, 6));
schema('h-emom', () => rond([80, 88], 50, `stroke="${C}" stroke-width="5"`) + trait([[68, 22], [92, 22]], G, 6) + trait([[80, 22], [80, 38]], G, 6)
  + trait([[80, 88], [80, 52]], A, 6) + `<path d="M80 88A36 36 0 0 1 116 88" stroke="${A}" stroke-width="6"></path>`);

// =====================================================================
// Ce que le reste de l'appli utilise
// =====================================================================

/**
 * Renvoie le SVG d'un schéma.
 * @param dessin  identifiant du schéma (champ `dessin` d'un exercice ou d'une étape Hyrox)
 * @param nom     nom lu par les lecteurs d'écran
 * @param taille  côté en pixels ; en dessous de 60, on retire flèches et pointillés pour rester lisible
 */
export function illustration(dessin, nom, taille = 96) {
  let contenu = DESSINS[dessin] || '';
  if (taille < 60) contenu = contenu.replace(/<g class="dt">.*?<\/g>/g, '');
  return `<svg role="img" aria-label="Schéma : ${nom}" width="${taille}" height="${taille}" viewBox="0 0 160 160" fill="none" stroke-linecap="round" stroke-linejoin="round">${contenu}</svg>`;
}

/** Vrai si un schéma existe pour cet identifiant (utilisé par les tests). */
export function dessinExiste(dessin) {
  return Boolean(DESSINS[dessin]);
}

/** Liste des identifiants de schémas (pour la planche de contrôle). */
export const LISTE_DESSINS = Object.keys(DESSINS);
