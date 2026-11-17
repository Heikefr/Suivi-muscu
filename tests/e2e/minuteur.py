"""Vérifie que les minuteurs avancent tout seuls, avec la vraie horloge.

Le parcours (parcours.py) fige l'heure : il ne peut pas voir un minuteur bloqué.
Ce test démarre une séance, valide une série, attend 2,5 s sans toucher l'écran
et vérifie que le temps affiché a diminué. Même chose pour le chrono Hyrox.

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
    # Muscu : séance Push, échauffement passé, une série validée
    pg.click('.carte-seance [data-action="composer"] >> nth=0')
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
    pg.click('[data-action="quitter"]') if pg.locator('[data-action="quitter"]').count() else None
    # Hyrox : séance libre, chrono de la première étape
    pg.evaluate("localStorage.clear()")
    pg.reload()
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
    nav.close()
print('OK' if ok else 'ÉCHEC : un minuteur ne défile pas')
sys.exit(0 if ok else 1)
