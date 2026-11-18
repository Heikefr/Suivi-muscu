"""Vérifie que les minuteurs avancent tout seuls, avec la vraie horloge.

Le parcours (parcours.py) fige l'heure : il ne peut pas voir un minuteur bloqué.
Ce test, avec la vraie horloge :
  1. démarre une séance, valide une série, attend 2,5 s sans toucher l'écran
     et vérifie que le temps de récup affiché a diminué ;
  2. règle la récup au minimum (15 s) et vérifie qu'à la fin l'écran de l'exercice
     revient tout seul (réglage « Auto », par défaut) ;
  3. vérifie que le chrono d'une séance Hyrox défile ;
  4. lance un circuit avec un repos de 5 s et vérifie qu'il passe tout seul à l'étape suivante.

    python3 tests/e2e/minuteur.py     (serveur local sur le port 8765)
"""
import os, sys
from playwright.sync_api import sync_playwright

URL = os.environ.get('URL', 'http://localhost:8765/')
secondes = lambda t: int(t.split(':')[0]) * 60 + int(t.split(':')[1])
ok = True
with sync_playwright() as p:
    nav = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = nav.new_context(viewport={'width': 390, 'height': 844}, locale='fr-FR').new_page()
    pg.goto(URL)
    pg.wait_for_selector('h1')
    # 1. Muscu : séance Push, échauffement passé, une série validée
    pg.click('.tuile-a[data-action="composer"] >> nth=0')
    pg.click('[data-action="go-compo"]')
    pg.click('[data-action="chauffe-passer"]')
    if pg.locator('[data-action="charge"][data-d="1"]').count():
        pg.click('[data-action="charge"][data-d="1"]')
    pg.click('[data-action="valider"]')
    pg.wait_for_selector('#temps')
    avant = secondes(pg.inner_text('#temps'))
    pg.wait_for_timeout(2500)
    apres = secondes(pg.inner_text('#temps'))
    print(f'Récup : {avant} s puis {apres} s')
    ok &= apres <= avant - 2
    # 2. Retour automatique à l'exercice à la fin de la récup
    pg.click('[data-action="fin-recup"]')
    pg.click('[data-action="options"]')
    for _ in range(12):
        pg.click('.feuille [aria-label="Récup plus courte"]')
    pg.click('.feuille >> text=OK')
    pg.click('[data-action="valider"]')
    pg.wait_for_selector('#temps')
    pg.wait_for_timeout(17500)
    revenu = pg.locator('[data-action="valider"]').count() > 0
    print('Fin de récup : retour automatique à l\'exercice' if revenu else 'Fin de récup : PAS de retour automatique')
    ok &= revenu
    pg.click('[aria-label="Quitter la séance"]')
    pg.click('text=Abandonner sans enregistrer')
    # 3. Hyrox : séance libre, chrono de la première étape
    pg.click('.nav >> text=Hyrox')
    pg.click('text=Voir les séances Hyrox')
    pg.click('button.choix >> nth=0')
    pg.click('[data-action="go-hyrox"]')
    pg.wait_for_selector('#h-temps')
    pg.wait_for_timeout(500)
    t1 = secondes(pg.inner_text('#h-temps'))
    pg.wait_for_timeout(2500)
    t2 = secondes(pg.inner_text('#h-temps'))
    # Selon l'étape, le chrono monte (effort) ou descend (durée fixe) : il doit bouger.
    print(f'Chrono Hyrox : {t1} s puis {t2} s')
    ok &= abs(t2 - t1) >= 2
    pg.click('[aria-label="Quitter la séance"]')
    pg.click('text=Abandonner sans enregistrer')
    # 4. Circuit : repos de 5 s puis course ; le repos passe tout seul
    pg.click('.nav >> text=Semaine')
    pg.click('.tuile-a:has-text("Circuit libre")')
    pg.click('[data-action="etape-ajout"]')
    pg.click('[data-action="etape-type"][data-t="repos"]')
    for _ in range(11):
        pg.click('.feuille [aria-label="Moins"]')
    pg.click('[data-action="c-etape-ok"]')
    pg.click('[data-action="etape-ajout"]')
    pg.click('[data-action="etape-type"][data-t="course"]')
    pg.click('[data-action="c-etape-ok"]')
    pg.click('[data-action="circuit-go"]')
    pg.wait_for_selector('#h-temps')
    debut = pg.inner_text('.etape.active .nom')
    pg.wait_for_timeout(6500)
    suite = pg.inner_text('.etape.active .nom')
    print(f'Circuit : « {debut} » puis « {suite} »')
    ok &= debut.startswith('Repos') and 'course' in suite
    nav.close()
print('OK' if ok else 'ÉCHEC : un minuteur ne défile pas')
sys.exit(0 if ok else 1)
