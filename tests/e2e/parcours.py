"""Parcours complet de l'appli dans un iPhone simulé.

À chaque étape on enregistre une capture d'écran et le HTML affiché, dans le
dossier donné en argument. On peut ainsi comparer deux versions du code :

    python3 tests/e2e/parcours.py /tmp/avant     (avec l'ancien code)
    python3 tests/e2e/parcours.py /tmp/apres     (avec le nouveau)
    python3 tests/e2e/comparer.py /tmp/avant /tmp/apres

L'heure est figée pour que les deux passages donnent exactement le même résultat.
Prérequis : un serveur local (python3 -m http.server 8765 à la racine du dépôt),
Playwright pour Python et Google Chrome. Le fichier d'historique est facultatif.
"""
import json, os, sys
from playwright.sync_api import sync_playwright

URL = os.environ.get('URL', 'http://localhost:8765/')
CSV = os.environ.get('CSV', '')  # export de l'ancien tableur, s'il existe
SORTIE = sys.argv[1] if len(sys.argv) > 1 else '/tmp/parcours'
ECHELLE = float(os.environ.get('ECHELLE', '1'))  # 2 = captures nettes, à montrer
SANS_MESSAGES = os.environ.get('SANS_MESSAGES') == '1'  # masque les messages éphémères sur les captures
os.makedirs(SORTIE, exist_ok=True)

# Heure figée : mercredi 18 novembre 2026, 10 h. Date.now() n'avance que d'une milliseconde
# à chaque appel (deux séances lancées dans le parcours ont ainsi des identifiants différents).
HORLOGE = """(() => {
  const FIXE = new Date(2026, 10, 18, 10, 0, 0).getTime();
  const Vraie = Date;
  let n = 0;
  class Figee extends Vraie { constructor(...a) { if (a.length) super(...a); else super(FIXE); } static now() { return FIXE + (n++); } }
  window.Date = Figee;
})();"""

erreurs, etapes = [], {}


def photo(pg, nom):
    """Enregistre la capture et le HTML de l'écran courant."""
    n = f'{len(etapes) + 1:02d}-{nom}'
    pg.wait_for_timeout(350)  # laisse passer les animations
    etapes[n] = pg.inner_html('#app')
    pg.screenshot(path=f'{SORTIE}/{n}.png', full_page=True)


def finir_seance(pg):
    """Valide toutes les séries jusqu'à l'écran de fin."""
    for _ in range(120):
        if pg.locator('text=Séance terminée').count():
            return
        if pg.locator('[data-action="terminer-seance"]').count():
            pg.click('[data-action="terminer-seance"]')
            continue
        if pg.locator('[data-action="chauffe-passer"]').count():
            pg.click('[data-action="chauffe-passer"]')
            continue
        if pg.locator('.feuille').count():
            for _ in range(4):
                pg.click('.feuille [aria-label="Plus lourd"]')
            pg.click('.feuille >> text=OK')
        elif pg.locator('#temps').count():
            pg.click('[data-action="fin-recup"]')
        elif pg.locator('.choix-reps').count():
            pg.click('.choix-reps button.on')
        else:
            pg.click('[data-action="valider"]')
    raise RuntimeError('séance non terminée')


with sync_playwright() as p:
    nav = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=ECHELLE, is_mobile=True, has_touch=True, locale='fr-FR')
    ctx.add_init_script(HORLOGE)
    if SANS_MESSAGES:
        ctx.add_init_script("document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '.toast{display:none!important}'; document.head.appendChild(s); });")
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.on('console', lambda m: erreurs.append(m.text) if m.type == 'error' and 'fonts' not in m.text else None)
    pg.goto(URL)
    pg.wait_for_selector('h1')
    photo(pg, 'accueil-vide')

    # --- Réglages : import de l'historique, semaine type ---
    pg.click('[aria-label="Réglages"]')
    if CSV and os.path.exists(CSV):
        pg.set_input_files('input[type=file]', CSV)
        pg.wait_for_selector('text=Import terminé')
        photo(pg, 'import-termine')
        pg.click('.feuille >> text=OK')
    for jour, cle in [(0, 'Push'), (2, 'Pull'), (4, 'Jambes'), (4, 'Hyrox')]:
        pg.click(f'[data-action="planifier-type"][data-j="{jour}"]')
        pg.click(f'.feuille [data-action="planifier-ok"]:has-text("{cle}") >> nth=0')
    photo(pg, 'reglages-semaine-type')
    pg.click('[aria-label="Retour"]')
    photo(pg, 'accueil')

    # --- Planning : un jour passé pas fait, décaler, semaine prochaine ---
    pg.click('.jour[data-date="2026-11-16"]')
    photo(pg, 'jour-pas-fait')
    pg.click('.feuille [data-action="decaler"]')
    photo(pg, 'decaler')
    pg.click('.feuille [data-action="decaler-ok"] >> nth=1')  # demain
    photo(pg, 'jour-apres-decalage')
    pg.click('.feuille >> text=Fermer')
    pg.click('[aria-label="Semaine suivante"]')
    photo(pg, 'semaine-prochaine')
    pg.click('.jour[data-date="2026-11-25"]')
    pg.click('.feuille [data-action="composer-prevu"]')
    photo(pg, 'composer-a-l-avance')
    pg.click('[data-action="compo-avance-ok"]')
    photo(pg, 'jour-compose')
    pg.click('.feuille >> text=Fermer')
    pg.click('[aria-label="Semaine précédente"]')

    # --- Composition d'une séance Pull (prévue aujourd'hui) ---
    pg.click('.aujourdhui [data-action="demarrer-prevu"]')
    pg.wait_for_selector('text=Composer ta séance')
    photo(pg, 'composer')
    pg.click('.tuile-compo .tuile >> nth=0')
    pg.wait_for_selector('.feuille')
    photo(pg, 'composer-choix')
    pg.fill('#recherche-feuille', 'rowing')
    photo(pg, 'composer-choix-recherche')
    pg.click('.feuille button.choix >> nth=1')
    pg.click('text=Comme la dernière fois')
    pg.click('text=Suggestion')
    pg.click('[data-action="retirer"] >> nth=3')
    pg.click('.tuile.ajout')
    pg.fill('#recherche-feuille', 'dips')
    pg.click('.feuille button.choix:has-text("Dips") >> nth=0')
    photo(pg, 'composer-modifie')
    pg.click('[data-action="enregistrer-compo"]')
    pg.fill('#nom-seance', 'Dos du mercredi')
    photo(pg, 'composer-enregistrer')
    pg.click('[data-action="enregistrer-compo-ok"]')

    # --- Séance : exercice, options, récupération, fin ---
    pg.click('[data-action="go-compo"]')
    pg.wait_for_selector('[data-action="chauffe-ok"]')
    photo(pg, 'echauffement')
    pg.click('[data-action="chauffe-ok"]')
    pg.click('[data-action="chauffe-ok"]')
    pg.wait_for_selector('text=Valider la série 1')
    pg.click('[data-action="ajout-serie"]')
    photo(pg, 'exercice')
    pg.click('[data-action="note"]')
    pg.fill('#note-texte', 'Siège cran 4')
    pg.click('[data-action="note-ok"]')
    pg.click('[data-action="options"]')
    photo(pg, 'exercice-options')
    pg.click('.feuille [aria-label="Plus lourd"]')
    pg.click('.feuille [aria-label="Récup plus longue"]')
    pg.click('.feuille >> text=OK')
    pg.click('[data-action="valider"]')
    pg.wait_for_selector('#temps')
    photo(pg, 'recup')
    pg.click('[data-action="gene"]')
    pg.click('.feuille .puce:has-text("Épaule")')
    pg.fill('#gene-note', 'Pincement en bas du mouvement')
    photo(pg, 'gene')
    pg.click('[data-action="gene-ok"]')
    pg.click('[data-action="ma-seance"]')
    photo(pg, 'ma-seance')
    pg.click('.tuile[data-i="2"]')
    pg.click('[data-action="fin-recup"]')
    photo(pg, 'exercice-choisi')
    pg.click('[aria-label="Quitter la séance"]')
    photo(pg, 'quitter')
    pg.click('text=Continuer la séance')
    pg.click('[data-action="valider"]')
    if pg.locator('.feuille').count():  # charge à choisir (exercice jamais fait)
        for _ in range(4):
            pg.click('.feuille [aria-label="Plus lourd"]')
        pg.click('.feuille >> text=OK')
        pg.click('[data-action="valider"]')
    pg.click('[data-action="fin-recup"]')
    # Partir de la salle avant la fin : « Terminer »
    pg.click('.btn-terminer')
    photo(pg, 'terminer-avant-la-fin')
    pg.click('.feuille >> text=Terminer et enregistrer')
    pg.wait_for_selector('text=Séance terminée')
    photo(pg, 'fin')
    pg.click("text=Retour à l'accueil")
    photo(pg, 'accueil-apres-seance')
    pg.click('.jour[data-date="2026-11-18"]')
    photo(pg, 'jour-resume')
    pg.click('.feuille [data-action="voir-seance"]')
    photo(pg, 'resume-seance')
    pg.click('.feuille >> text=Fermer')

    # --- Séance personnalisée avec haltérophilie ---
    pg.click('.tuile-a:has-text("Perso")')
    pg.wait_for_selector('#recherche')
    pg.fill('#recherche', 'arra')
    photo(pg, 'perso-recherche')
    pg.click('.ligne-coche:has-text("Snatch") >> nth=0')
    pg.fill('#recherche', '')
    pg.click('.puce:has-text("Pull")')
    pg.click('.ligne-coche:has-text("Tirage horizontal")')
    pg.click('.puce:has-text("Haltéro")')
    photo(pg, 'perso-haltero')
    pg.click('[data-action="enregistrer"]')
    pg.fill('#nom-seance', 'Haltéro test')
    pg.click('[data-action="enregistrer-ok"]')
    pg.click('[data-action="go-perso"]')
    pg.click('[data-action="chauffe-passer"]')
    pg.wait_for_selector('.choix-reps')
    photo(pg, 'haltero-sans-record')
    pg.click('.choix-reps button.on')
    finir_seance(pg)
    photo(pg, 'haltero-fin')
    pg.click("text=Retour à l'accueil")

    # --- Circuit Hyrox libre ---
    pg.click('.tuile-a:has-text("Circuit libre")')
    photo(pg, 'circuit-vide')
    pg.click('[data-action="etape-ajout"]')
    photo(pg, 'circuit-type')
    pg.click('[data-action="etape-type"][data-t="ski"]')
    pg.click('.feuille [aria-label="Moins"]')
    pg.click('.feuille [aria-label="Moins"]')
    photo(pg, 'circuit-etape')
    pg.click('[data-action="c-etape-ok"]')
    pg.click('[data-action="etape-ajout"]')
    pg.click('[data-action="etape-type"][data-t="wallBalls"]')
    pg.click('.feuille [aria-label="Plus lourd"]')
    pg.click('[data-action="c-etape-ok"]')
    pg.click('[data-action="etape-ajout"]')
    pg.click('[data-action="etape-type"][data-t="muscu"]')
    pg.fill('#recherche-feuille', 'pompes')
    photo(pg, 'circuit-muscu')
    pg.click('.feuille [data-action="etape-exo"] >> nth=0')
    pg.click('[data-action="c-etape-ok"]')
    pg.click('[data-action="etape-ajout"]')
    pg.click('[data-action="etape-type"][data-t="repos"]')
    pg.click('[data-action="c-etape-ok"]')
    pg.click('[aria-label="Un tour de plus"]')
    photo(pg, 'circuit')
    pg.click('[data-action="circuit-enregistrer"]')
    pg.fill('#nom-seance', 'Stations ×4')
    pg.click('[data-action="enregistrer-circuit-ok"]')
    pg.click('[data-action="circuit-go"]')
    pg.wait_for_selector('#h-temps')
    photo(pg, 'circuit-seance')
    pg.click('[data-action="etape-ok"]')
    pg.click('.btn-terminer')
    photo(pg, 'circuit-terminer')
    pg.click('.feuille >> text=Terminer et enregistrer')
    pg.wait_for_selector('text=Séance terminée')
    photo(pg, 'circuit-fin')
    pg.click("text=Retour à l'accueil")

    # --- Mes séances ---
    pg.click('[data-action="mes-seances"]')
    photo(pg, 'mes-seances')
    pg.click('.feuille .puce:has-text("Hyrox")')
    photo(pg, 'mes-seances-hyrox')
    pg.click('.feuille >> text=Fermer')

    # --- Progression et catalogue ---
    pg.click('.nav >> text=Progression')
    photo(pg, 'progression')
    pg.click('button.choix:has-text("Mes records")')
    photo(pg, 'records')
    pg.click('[aria-label="Retour"]')
    pg.click('.nav >> text=Exercices')
    photo(pg, 'exercices')
    pg.evaluate('window.scrollTo(0, 1800)')
    pg.click('button.choix:has-text("Leg extension")')
    photo(pg, 'detail')
    pg.click('[aria-label="Retour"]')
    pg.wait_for_timeout(200)
    position = pg.evaluate('window.scrollY')
    if position < 1000:
        erreurs.append(f'retour à la liste : position perdue ({position})')
    pg.fill('#recherche-exos', 'squat')
    photo(pg, 'exercices-recherche')
    pg.click('button.choix:has-text("Front squat")')
    photo(pg, 'detail-haltero')
    pg.click('[aria-label="Retour"]')

    # --- Hyrox : libre, profil, plan ---
    pg.click('.nav >> text=Hyrox')
    photo(pg, 'hyrox-intro')
    pg.click('text=Voir les séances Hyrox')
    photo(pg, 'hyrox-libre')
    pg.click('button.choix:has-text("Force Hyrox")')
    photo(pg, 'hyrox-apercu')
    pg.click('[data-action="go-hyrox"]')
    pg.wait_for_selector('#h-temps')
    photo(pg, 'hyrox-seance')
    pg.click('[data-action="etape-ok"]')
    pg.click('[data-action="pause-toggle"]')
    photo(pg, 'hyrox-pause')
    pg.click('.btn-principal[data-action="pause-toggle"]')
    pg.click('[aria-label="Quitter la séance"]')
    photo(pg, 'hyrox-quitter')
    pg.click('text=Terminer et enregistrer')
    pg.wait_for_selector('text=Séance terminée')
    pg.click('.choix-ressenti >> text=Dur')
    photo(pg, 'hyrox-fin')
    pg.click('[data-action="onglet"][data-id="hyrox"].btn-principal')
    pg.click('text=Créer mon profil Hyrox')
    pg.wait_for_selector('text=Ton profil Hyrox')
    pg.fill('#hp-date', '2026-12-20')
    pg.dispatch_event('#hp-date', 'change')
    pg.fill('[data-repere="course10k"]', '55:00')
    pg.click('.puce:has-text("Duo")')
    photo(pg, 'hyrox-profil')
    pg.click('[data-action="hp-ok"]')
    pg.wait_for_selector('text=Semaine 1 sur')
    pg.wait_for_timeout(3200)  # le message « Plan créé » disparaît
    photo(pg, 'hyrox-plan')
    pg.click('text=Voir tout le plan')
    photo(pg, 'hyrox-tout-le-plan')
    pg.click('.feuille >> text=Fermer')
    pg.click('.nav >> text=Semaine')
    photo(pg, 'accueil-final')

    # --- Rappel de sauvegarde : on fait comme si la dernière datait de 9 jours ---
    pg.evaluate("() => { const d = JSON.parse(localStorage.getItem('suivi-muscu')); d.sauvegarde = { derniere: '2026-11-09', rappel: 7 }; localStorage.setItem('suivi-muscu', JSON.stringify(d)); }")
    pg.reload()
    pg.wait_for_selector('.rappel-sauvegarde')
    photo(pg, 'accueil-rappel-sauvegarde')
    pg.click('[aria-label="Réglages"]')
    pg.click('[data-action="recup-auto"][data-v="0"]')
    photo(pg, 'reglages')
    nav.close()

json.dump(etapes, open(f'{SORTIE}/html.json', 'w'), ensure_ascii=False, indent=0)
print(len(etapes), 'étapes ·', 'ERREURS :', erreurs or 'aucune')
sys.exit(1 if erreurs else 0)
