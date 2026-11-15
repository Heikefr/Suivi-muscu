// =====================================================================
// Petits outils sans lien avec l'affichage
// ---------------------------------------------------------------------
// Texte, nombres, dates et durées. Aucune dépendance : utilisable partout, tests compris.
// =====================================================================

/** Rend un texte sûr à insérer dans du HTML. */
export function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Nombre à la française, 1 décimale au plus : 42.5 → « 42,5 ». */
export function nb(x) {
  return String(Math.round(x * 10) / 10).replace('.', ',');
}

/** Date du jour au format AAAA-MM-JJ (heure du téléphone). */
export function aujourdhui() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** « 15/11 ». */
export function dateCourte(iso) {
  const [, m, j] = iso.split('-');
  return `${j}/${m}`;
}

/** « dimanche 15 novembre ». */
export function dateLongue(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return new Date(a, m - 1, j).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Nombre de jours écoulés depuis une date AAAA-MM-JJ. */
export function joursDepuis(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return Math.round((new Date().setHours(0, 0, 0, 0) - new Date(a, m - 1, j).getTime()) / 86400000);
}

/** « aujourd'hui », « hier », « il y a 4 jours ». */
export function ilYa(iso) {
  const jours = joursDepuis(iso);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'hier';
  return `il y a ${jours} jours`;
}

/** Lundi de la semaine en cours, au format AAAA-MM-JJ. */
export function debutSemaine() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** Durée en secondes → « 4:05 ». */
export function mmss(s) {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** Date AAAA-MM-JJ décalée de `n` jours. */
export function ajouterJours(iso, n) {
  const [a, m, j] = iso.split('-').map(Number);
  const t = new Date(a, m - 1, j + n);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}
