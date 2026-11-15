"""Compare deux passages de parcours.py : HTML puis pixels de chaque étape.

    python3 tests/e2e/comparer.py /tmp/avant /tmp/apres [--pixels]

Sans --pixels on compare le HTML (utile quand on ne fait que déplacer du code).
Avec --pixels on compare les captures (utile quand le HTML change mais que
l'affichage doit rester le même).
"""
import json, sys
from PIL import Image, ImageChops

a, b = sys.argv[1], sys.argv[2]
pixels = '--pixels' in sys.argv
ha, hb = json.load(open(f'{a}/html.json')), json.load(open(f'{b}/html.json'))
ecarts = 0
for nom in sorted(set(ha) | set(hb)):
    if nom not in ha or nom not in hb:
        print('ABSENT', nom); ecarts += 1; continue
    if pixels:
        ia, ib = Image.open(f'{a}/{nom}.png').convert('RGB'), Image.open(f'{b}/{nom}.png').convert('RGB')
        if ia.size != ib.size:
            print('TAILLE', nom, ia.size, ib.size); ecarts += 1; continue
        boite = ImageChops.difference(ia, ib).getbbox()
        if boite:
            print('PIXELS', nom, boite); ecarts += 1
    elif ha[nom] != hb[nom]:
        i = next((k for k in range(min(len(ha[nom]), len(hb[nom]))) if ha[nom][k] != hb[nom][k]), 0)
        print('HTML', nom, '…', ha[nom][max(0, i - 60):i + 80].replace('\n', ' '), '|||', hb[nom][max(0, i - 60):i + 80].replace('\n', ' '))
        ecarts += 1
print('identique' if not ecarts else f'{ecarts} écart(s)', f'sur {len(ha)} étapes')
sys.exit(1 if ecarts else 0)
