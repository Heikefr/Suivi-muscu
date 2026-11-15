// Fonctionnement hors ligne (salle sans réseau).
// Changer VERSION à chaque mise en ligne pour que le téléphone récupère la nouvelle version.
const VERSION = 'suivi-muscu-0.4.0';
const FICHIERS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/app.js',
  'js/commun.js',
  'js/composition.js',
  'js/etat.js',
  'js/fenetres.js',
  'js/illustrations.js',
  'js/outils.js',
  'js/seance-muscu.js',
  'js/ecrans/accueil.js',
  'js/ecrans/composition.js',
  'js/ecrans/hyrox-seance.js',
  'js/ecrans/hyrox.js',
  'js/ecrans/progression.js',
  'js/ecrans/reglages.js',
  'js/ecrans/seance.js',
  'js/metier/donnees.js',
  'js/metier/hyrox.js',
  'js/metier/import.js',
  'js/metier/progression.js',
  'js/metier/stockage.js',
  'icons/icon-192.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'activer') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)),
  );
});
