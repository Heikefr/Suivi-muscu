export function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function nb(x) {
  return String(Math.round(x * 10) / 10).replace('.', ',');
}

export function aujourdhui() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export function dateCourte(iso) {
  const [, m, j] = iso.split('-');
  return `${j}/${m}`;
}

export function dateLongue(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return new Date(a, m - 1, j).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function joursDepuis(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return Math.round((new Date().setHours(0, 0, 0, 0) - new Date(a, m - 1, j).getTime()) / 86400000);
}

export function ilYa(iso) {
  const jours = joursDepuis(iso);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'hier';
  return `il y a ${jours} jours`;
}

export function debutSemaine() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export function mmss(s) {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
