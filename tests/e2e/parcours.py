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
os.makedirs(SORTIE, exist_ok=True)

# Heure figée : dimanche 15 novembre 2026, 10 h. Date.now() ne bouge plus.
HORLOGE = """(() => {
  const FIXE = new Date(2026, 10, 15, 10, 0, 0).getTime();
  const Vraie = Date;
  class Figee extends Vraie { constructor(...a) { if (a.length) super(...a); else super(FIXE); } static now() { return FIXE; } }
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
        if pg.locator('.feuille').count():
            for _ in range(4):
                pg.click('.feuille [aria-label="Plus lourd"]')
            pg.click('.feuille >> text=OK')
        elif pg.locator('#temps').count():
            pg.click('button.btn-secondaire:has-text("Passer")')
        elif pg.locator('.choix-reps').count():
            pg.click('.choix-reps button.on')
        else:
            pg.click('[data-action="valider"]')
    raise RuntimeError('séance non terminée')


with sync_playwright() as p:
    nav = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    ctx = nav.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True, locale='fr-FR')
    ctx.add_init_script(HORLOGE)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.on('console', lambda m: erreurs.append(m.text) if m.type == 'error' and 'fonts' not in m.text else None)
    pg.goto(URL)
    pg.wait_for_selector('h1')
    photo(pg, 'accueil-vide')

    # --- Réglages et import de l'historique ---
    pg.click('[aria-label="Réglages"]')
    photo(pg, 'reglages')
    if CSV and os.path.exists(CSV):
        pg.set_input_files('input[type=file]', CSV)
        pg.wait_for_selector('text=Import terminé')
        photo(pg, 'import-termine')
        pg.click('.feuille >> text=OK')
    pg.click('[aria-label="Retour"]')
    photo(pg, 'accueil')

    # --- Composition d'une séance Push ---
    pg.click('button.conseillee')
    pg.wait_for_selector('text=Composer ta séance')
    photo(pg, 'composer')
    pg.click('.case-choix >> nth=0')
    pg.wait_for_selector('.feuille')
    photo(pg, 'composer-choix')
    pg.click('.feuille button.choix >> nth=1')
    pg.click('text=Comme la dernière fois')
    pg.click('text=Suggestion')
    pg.click('[data-action="retirer"] >> nth=3')
    pg.click('text=+ Ajouter un exercice')
    pg.click('.feuille button.choix:has-text("Dips")')
    photo(pg, 'composer-modifie')

    # --- Séance : exercice, options, récupération, fin ---
    pg.click('[data-action="go-compo"]')
    pg.wait_for_selector('text=Valider la série 1')
    pg.click('text=+ Ajouter une série')
    photo(pg, 'exercice')
    # Réglages personnels et échauffement
    pg.click('[data-action="note"]')
    pg.fill('#note-texte', 'Banc n°3, prise aux anneaux')
    photo(pg, 'note-saisie')
    pg.click('[data-action="note-ok"]')
    if pg.locator('[data-action="chauffe-ok"]').count():
        pg.click('[data-action="chauffe-ok"]')
        photo(pg, 'echauffement')
        pg.click('[data-action="chauffe-passer"]')
    photo(pg, 'exercice-avec-note')
    pg.click('[data-action="options"]')
    photo(pg, 'exercice-options')
    pg.click('.feuille [aria-label="Plus lourd"]')
    pg.click('.feuille >> text=OK')
    pg.click('[data-action="valider"]')
    pg.wait_for_selector('#temps')
    photo(pg, 'recup')
    pg.click('button.btn-secondaire:has-text("Passer")')
    pg.click('[aria-label="Quitter la séance"]')
    photo(pg, 'quitter')
    pg.click('text=Continuer la séance')
    finir_seance(pg)
    photo(pg, 'fin')
    pg.click("text=Retour à l'accueil")
    photo(pg, 'accueil-apres-seance')

    # --- Séance personnalisée avec haltérophilie ---
    pg.click('text=Séance personnalisée')
    pg.wait_for_selector('#recherche')
    photo(pg, 'perso')
    pg.fill('#recherche', 'arra')
    photo(pg, 'perso-recherche')
    pg.click('.ligne-coche:has-text("Arraché") >> nth=0')
    pg.fill('#recherche', '')
    pg.click('.puce:has-text("Pull")')
    pg.click('.ligne-coche:has-text("Tirage horizontal")')
    pg.click('.puce:has-text("Haltéro")')
    photo(pg, 'perso-haltero')
    pg.click('[data-action="enregistrer"]')
    pg.fill('#nom-seance', 'Haltéro test')
    photo(pg, 'perso-nom')
    pg.click('[data-action="enregistrer-ok"]')
    pg.click('[data-action="go-perso"]')
    pg.wait_for_selector('.choix-reps')
    photo(pg, 'haltero-sans-record')
    pg.click('.choix-reps button.on')
    photo(pg, 'haltero-suite')
    finir_seance(pg)
    photo(pg, 'haltero-fin')
    pg.click("text=Retour à l'accueil")
    photo(pg, 'accueil-avec-perso')

    # --- Progression et catalogue ---
    pg.click('.nav >> text=Progression')
    photo(pg, 'progression')
    if pg.locator('[data-action="voir-seance"]').count():
        pg.click('[data-action="voir-seance"] >> nth=0')
        pg.wait_for_selector('.feuille')
        photo(pg, 'progression-seance')
        pg.click('.feuille >> text=Fermer')
    pg.click('button.choix:has-text("Mes records")')
    photo(pg, 'records')
    pg.click('[aria-label="Retour"]')
    pg.click('.nav >> text=Exercices')
    photo(pg, 'exercices')
    pg.click('button.choix:has-text("Développé couché barre")')
    photo(pg, 'detail')
    pg.click('[aria-label="Retour"]')
    pg.click('button.choix:has-text("Arraché") >> nth=0')
    photo(pg, 'detail-haltero')
    pg.click('[aria-label="Retour"]')

    # --- Hyrox : libre, séance test, profil, plan ---
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
    pg.click('.puce:has-text("Relais")')
    photo(pg, 'hyrox-profil-relais')
    pg.click('.puce:has-text("Duo")')
    photo(pg, 'hyrox-profil')
    pg.click('[data-action="hp-ok"]')
    pg.wait_for_selector('text=Semaine 1 sur')
    pg.wait_for_timeout(3200)  # le message « Plan créé » disparaît
    photo(pg, 'hyrox-plan')
    pg.click('text=Voir tout le plan')
    photo(pg, 'hyrox-tout-le-plan')
    pg.click('.feuille >> text=Fermer')
    pg.click('button.conseillee')
    photo(pg, 'hyrox-apercu-plan')
    pg.click('[aria-label="Retour"]')
    pg.click('button.choix:has-text("Muscu")')
    photo(pg, 'hyrox-vers-muscu')
    pg.click('[aria-label="Retour"]') if pg.locator('[aria-label="Retour"]').count() else None
    pg.click('.nav >> text=Progression') if pg.locator('.nav').count() else None
    photo(pg, 'progression-finale')

    # --- Rappel de sauvegarde : on fait comme si la dernière datait de 9 jours ---
    pg.evaluate("() => { const d = JSON.parse(localStorage.getItem('suivi-muscu')); d.sauvegarde = { derniere: '2026-11-06', rappel: 7 }; localStorage.setItem('suivi-muscu', JSON.stringify(d)); }")
    pg.reload()
    pg.wait_for_selector('.rappel-sauvegarde')
    photo(pg, 'accueil-rappel-sauvegarde')
    pg.click('[aria-label="Réglages"]')
    pg.click('.puce:has-text("Chaque mois")')
    photo(pg, 'reglages-rappel')
    nav.close()

json.dump(etapes, open(f'{SORTIE}/html.json', 'w'), ensure_ascii=False, indent=0)
print(len(etapes), 'étapes ·', 'ERREURS :', erreurs or 'aucune')
sys.exit(1 if erreurs else 0)
