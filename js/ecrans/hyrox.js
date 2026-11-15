// =====================================================================
// Onglet Hyrox : profil, plan et choix d'une séance
// ---------------------------------------------------------------------
// Sans profil : présentation. Avec une compétition à venir : le plan de la semaine.
// Sinon : le mode libre. La séance elle-même est dans hyrox-seance.js.
// =====================================================================

import { ICONES, nav } from '../commun.js';
import { prochaineSeance } from '../composition.js';
import { d, enregistrer, toast, ui } from '../etat.js';
import { illustration } from '../illustrations.js';
import { seance } from '../metier/donnees.js';
import {
  CHARGES, LIBRES, allureTexte, ecrireTemps, genererPlan, joursRestants, lireTemps, niveauCharges, noteCharge,
  repartitionConseillee, seanceHyrox, semainesRestantes, suggestionLibre,
} from '../metier/hyrox.js';
import { aujourdhui, dateCourte, dateLongue, esc, ilYa, mmss } from '../outils.js';

/** Nom d'un élément du plan (séance Hyrox, muscu ou jour J). */
export function nomItem(it) {
  if (it.type === 'hyrox') return seanceHyrox(it.id).nom;
  if (it.type === 'muscu') return 'Muscu';
  return 'Jour J';
}

/** Durée indicative d'une séance. */
function dureeSeanceHyrox(s) {
  return `${s.duree} min`;
}

/** Résumé en une ligne du bloc principal d'une séance. */
function resumeEtapes(s) {
  const p = s.blocs(d.hyroxAjust[s.id] || 0).find((b) => b.nom !== 'Échauffement' && b.nom !== 'Retour au calme') || s.blocs(0)[0];
  const etapes = p.etapes.filter((e) => !e.repos).map((e) => e.texte);
  const liste = etapes.length > 4 ? `${etapes.slice(0, 4).join(', ')}…` : etapes.join(', ');
  return p.tours > 1 ? `${p.tours} tours : ${liste}` : liste;
}

/** Présentation, tant qu'aucun profil n'existe. */
function ecranHyroxIntro() {
  return `<main class="ecran avec-nav theme-hyrox">
    <div class="pile u-ecart-6"><div class="sur-titre">Hyrox</div><h1>Prépare ton Hyrox</h1></div>
    <div class="carte pile u-ecart-8 u-t-15 u-interligne-1-45">
      <div>Indique une date de compétition et l'appli construit ton plan semaine par semaine. Ou entraîne-toi librement, sans date.</div>
      <div class="petit">Tes repères (10 km, rameur, SkiErg) servent à calculer tes allures. Si tu ne les connais pas, la séance test les mesure.</div>
    </div>
    <button class="btn-principal" data-action="hyrox-profil">Créer mon profil Hyrox</button>
    <button class="btn-secondaire" data-action="hyrox-libre">Voir les séances Hyrox</button>
  </main>${nav('hyrox')}`;
}

/** Carte « Séance en cours », s'il y en a une. */
function carteReprise() {
  if (!d.enCoursHyrox) return '';
  return `<div class="conseillee">
    <div class="label">Séance en cours</div>
    <div class="titre">${esc(d.enCoursHyrox.nom)}</div>
    <button class="btn-sombre" data-action="reprendre-h">Reprendre la séance</button>
  </div>`;
}

/** Ce qui a déjà été fait dans la semaine `w` du plan. */
function faitesSemaine(w) {
  const dans = d.historique.filter((s) => s.date >= w.debut && s.date <= w.fin && !s.importee);
  const hy = {};
  let mu = 0;
  for (const s of dans) {
    if (s.seance?.startsWith('hyrox:')) {
      const id = s.seance.slice(6);
      (hy[id] = hy[id] || []).push(s);
    } else mu++;
  }
  return { hy, mu };
}

/** Écran principal de l'onglet : le plan de la semaine. */
export function ecranHyrox() {
  const p = d.hyroxProfil;
  if (!p) return ecranHyroxIntro();
  const auj = aujourdhui();
  if (p.mode !== 'competition' || semainesRestantes(p.date, auj) === 0) return ecranHyroxLibre(false);

  const plan = genererPlan(p, auj);
  const w = plan[0];
  const j = joursRestants(p.date, auj);
  const { hy, mu } = faitesSemaine(w);
  let muRestant = mu;
  let prochaineMarquee = false;
  const lignes = w.items.map((it) => {
    if (it.type === 'competition') {
      return `<div class="carte ligne u-hmin-64"><span class="rond-h"></span><span class="pile u-ecart-3 u-flex-1"><span class="u-gras-700 u-t-16">Jour J</span><span class="petit">${dateLongue(p.date)} · bonne compétition&nbsp;!</span></span></div>`;
    }
    let faite = null;
    if (it.type === 'hyrox' && hy[it.id]?.length) faite = hy[it.id].shift();
    if (it.type === 'muscu' && muRestant > 0) { muRestant--; faite = true; }
    const titre = it.type === 'hyrox' ? seanceHyrox(it.id).nom : `Muscu · ${seance(prochaineSeance()).nom}`;
    if (faite) {
      const info = faite === true ? 'Faite cette semaine' : `Faite ${ilYa(faite.date)}${faite.hyrox?.ressenti ? ` · ${faite.hyrox.ressenti}` : ''}`;
      return `<div class="carte ligne u-hmin-64"><span class="rond-h fait">${ICONES.coche.replace('var(--accent)', 'var(--fond)')}</span><span class="pile u-ecart-3 u-flex-1"><span class="u-gras-600 u-t-16">${esc(titre)}</span><span class="petit">${info}</span></span></div>`;
    }
    const action = it.type === 'hyrox' ? `data-action="hyrox-apercu" data-id="${it.id}"` : `data-action="composer" data-id="${prochaineSeance()}"`;
    const sous = it.type === 'hyrox' ? `${esc(resumeEtapes(seanceHyrox(it.id)))} · ${dureeSeanceHyrox(seanceHyrox(it.id))}` : 'Ouvre ta séance de muscu habituelle';
    if (!prochaineMarquee) {
      prochaineMarquee = true;
      return `<button class="conseillee" ${action} style="border:none;text-align:left">
        <span class="label">Prochaine</span><span class="titre u-t-22">${esc(titre)}</span><span class="u-t-13 u-gras-500">${sous}</span></button>`;
    }
    return `<button class="choix" ${action} style="min-height:72px"><span><span class="nom">${esc(titre)}</span><span class="petit">${sous}</span></span>${ICONES.suite}</button>`;
  }).join('');
  const nbHy = w.items.filter((x) => x.type === 'hyrox').length;
  const nbMu = w.items.filter((x) => x.type === 'muscu').length;
  const segments = plan.map((x, i) => `<div class="${i === 0 ? 'on' : ''}" title="${x.phase}"></div>`).join('');
  const suite = plan.slice(1).map((x) => x.phase).filter((x, i, a) => a.indexOf(x) === i && x !== w.phase);
  return `<main class="ecran avec-nav theme-hyrox">
    <div class="entete">
      <div><div class="sur-titre">Hyrox · compétition du ${dateLongue(p.date).replace(/^\S+ /, '')}</div><h1>${j <= 0 ? "C'est aujourd'hui" : `J-${j}`}</h1></div>
      <button class="btn-icone" data-action="hyrox-profil" aria-label="Profil Hyrox">${ICONES.reglages}</button>
    </div>
    ${carteReprise()}
    <div class="carte pile u-ecart-10">
      <div class="ligne"><div class="u-flex-1 u-gras-600">Semaine 1 sur ${plan.length}</div><div class="label u-c-accent u-t-12">${w.phase}</div></div>
      <div class="segments" style="grid-template-columns:repeat(${plan.length},minmax(0,1fr))">${segments}</div>
      <div class="petit">${suite.length ? `Ensuite : ${suite.join(', puis ')}` : 'Dernière ligne droite'} · <button class="btn-lien u-hmin-0 u-pad-0 u-t-13 u-c-accent" data-action="voir-plan">Voir tout le plan</button></div>
    </div>
    <div class="sur-titre">Cette semaine · ${nbHy} Hyrox${nbMu ? ` + ${nbMu} muscu` : ''}</div>
    <div class="pile u-ecart-8">${lignes}</div>
    <button class="btn-ajout u-cbord-accent" data-action="hyrox-libre">Faire une autre séance Hyrox (libre)</button>
  </main>${nav('hyrox')}`;
}

/** Liste des séances libres ; `avecRetour` = ouverte depuis le plan. */
export function ecranHyroxLibre(avecRetour) {
  const p = d.hyroxProfil;
  const sug = suggestionLibre(d.historique);
  const derniere = (id) => d.historique.filter((s) => s.seance === `hyrox:${id}`).reduce((m, s) => (s.date > m ? s.date : m), '');
  const carte = (id) => {
    const s = seanceHyrox(id);
    const der = derniere(id);
    return `<button class="choix" data-action="hyrox-apercu" data-id="${id}" style="min-height:72px">
      <span><span class="nom">${esc(s.nom)}</span><span class="petit">${esc(resumeEtapes(s))} · ${dureeSeanceHyrox(s)}${der ? ` · ${ilYa(der)}` : ''}</span></span>${ICONES.suite}</button>`;
  };
  const passee = p?.mode === 'competition' && semainesRestantes(p.date, aujourdhui()) === 0;
  const s = seanceHyrox(sug);
  const der = derniere(sug);
  return `<main class="ecran ${avecRetour ? '' : 'avec-nav'} theme-hyrox">
    <div class="entete">
      ${avecRetour ? `<button class="btn-icone" data-action="onglet" data-id="hyrox" aria-label="Retour">${ICONES.retour}</button>` : ''}
      <div><div class="sur-titre">Hyrox libre</div><h1>Choisis ta séance</h1></div>
      ${avecRetour ? '' : `<button class="btn-icone" data-action="hyrox-profil" aria-label="Profil Hyrox">${ICONES.reglages}</button>`}
    </div>
    ${avecRetour ? '' : carteReprise()}
    ${passee ? `<div class="bandeau">Ta compétition du ${dateCourte(p.date)} est passée. Entre une nouvelle date dans ton profil pour un nouveau plan.</div>` : ''}
    <button class="conseillee" data-action="hyrox-apercu" data-id="${sug}" style="border:none;text-align:left">
      <span class="label">Suggérée${der ? ` · faite ${ilYa(der)}` : ' · jamais faite'}</span>
      <span class="titre u-t-22">${esc(s.nom)}</span>
      <span class="u-t-13 u-gras-500">${esc(resumeEtapes(s))} · ${dureeSeanceHyrox(s)}</span>
    </button>
    <div class="pile u-ecart-8">${LIBRES.filter((x) => x !== sug).map(carte).join('')}
      <button class="choix pointille u-hmin-64" data-action="hyrox-apercu" data-id="test">
        <span><span class="nom u-t-15">Séance test</span><span class="petit">Mesure tes repères : 1 km course, SkiErg et rameur</span></span>${ICONES.suite}</button>
    </div>
  </main>${avecRetour ? '' : nav('hyrox')}`;
}

/** Ligne d'une étape (schéma, allure, charge) ; `etat` : faite, avenir… */
export function ligneEtape(e, reperes, etat = '', duree = null) {
  const al = allureTexte(e, reperes);
  const allure = al && /\d/.test(al) ? `à ${al}` : al;
  const info = e.repos ? '' : [allure, noteCharge(e, niveauCharges(d.hyroxProfil)), e.detail].filter(Boolean).join(' · ');
  return `<div class="etape ${etat}">
    <span class="mini-dessin">${illustration(e.dessin, e.texte, 40)}</span>
    <span class="txt"><span class="nom">${esc(e.texte)}</span>${info ? `<span class="petit">${esc(info)}</span>` : ''}</span>
    ${duree != null ? `<span class="petit u-t-14">${duree}</span>` : ''}
  </div>`;
}

/** Aperçu d'une séance avant de la démarrer. */
export function ecranHyroxApercu() {
  const s = seanceHyrox(ui.hyroxApercu);
  const blocs = s.blocs(d.hyroxAjust[s.id] || 0);
  const reperes = d.hyroxProfil?.reperes || {};
  const ajust = d.hyroxAjust[s.id] || 0;
  return `<main class="ecran theme-hyrox">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="hyrox" aria-label="Retour">${ICONES.retour}</button>
      <div class="sur-titre u-flex-1">${dureeSeanceHyrox(s)}${ajust ? ` · adaptée à ton ressenti (${ajust > 0 ? '+' : ''}${ajust} tour${Math.abs(ajust) > 1 ? 's' : ''})` : ''}</div>
    </div>
    <h1 class="u-t-28">${esc(s.nom)}</h1>
    <div class="petit u-t-15">${esc(s.description)}</div>
    ${blocs.map((b) => `<div class="pile u-ecart-8">
      <div class="ligne"><div class="sur-titre u-flex-1 u-gras-700 u-c-texte">${esc(b.nom)}</div>${b.tours > 1 ? `<div class="label u-c-accent u-t-12">${b.tours} tours</div>` : ''}</div>
      ${b.etapes.map((e) => ligneEtape(e, reperes)).join('')}
    </div>`).join('')}
    ${!d.hyroxProfil?.reperes || !Object.keys(d.hyroxProfil.reperes).length ? '<div class="petit">Sans repères, les allures sont données en sensations. Renseigne-les dans ton profil ou fais la séance test.</div>' : ''}
    <div class="barre-action theme-hyrox-fond"><button class="btn-principal" data-action="go-hyrox" data-id="${s.id}">Démarrer</button></div>
  </main>`;
}

/** Formulaire du profil Hyrox (le brouillon est dans ui.hp). */
export function ecranHyroxProfil() {
  const f = ui.hp;
  const auj = aujourdhui();
  const restantes = f.mode === 'competition' ? semainesRestantes(f.date, auj) : 0;
  const conseil = repartitionConseillee(restantes);
  const puce = (champ, v, t) => `<button class="puce ${f[champ] === v ? 'on' : ''}" data-action="hp" data-champ="${champ}" data-v="${v}" aria-pressed="${f[champ] === v}">${t}</button>`;
  const repere = (cle, label, unite, diviseur) => {
    const s = lireTemps(f.reperes[cle]);
    return `<label class="repere"><span class="lib">${label}</span>
      <input data-repere="${cle}" inputmode="numeric" placeholder="mm:ss" value="${esc(f.reperes[cle] || '')}" aria-label="${label}, temps">
      <span class="petit al" id="al-${cle}">${s ? `${mmss(s / diviseur)} ${unite}` : 'Je ne sais pas'}</span></label>`;
  };
  return `<main class="ecran theme-hyrox">
    <div class="ligne">
      <button class="btn-icone" data-action="onglet" data-id="hyrox" aria-label="Retour">${ICONES.retour}</button>
      <h1 class="u-flex-1 u-t-26">Ton profil Hyrox</h1>
    </div>
    <div class="segment">
      <button class="${f.mode === 'competition' ? 'on' : ''}" data-action="hp" data-champ="mode" data-v="competition">Préparer une compétition</button>
      <button class="${f.mode === 'libre' ? 'on' : ''}" data-action="hp" data-champ="mode" data-v="libre">Hyrox libre</button>
    </div>
    ${f.mode === 'competition' ? `<label class="carte ligne u-hmin-64">
      <span class="pile u-ecart-2 u-flex-1"><span class="petit">Date de la compétition</span>
      <input type="date" id="hp-date" class="champ-date" min="${auj}" value="${esc(f.date || '')}"></span>
      <span class="label u-c-accent u-t-12">${restantes ? `${restantes} semaine${restantes > 1 ? 's' : ''}` : ''}</span>
    </label>` : ''}
    <div class="pile u-ecart-8">
      <div class="sur-titre">Catégorie</div>
      <div class="puces">${puce('niveau', 'open', 'Open')}${puce('niveau', 'pro', 'Pro')}</div>
      <div class="puces">${puce('format', 'solo', 'Solo')}${puce('format', 'duo', 'Duo')}${puce('format', 'relais', 'Relais')}</div>
      <div class="puces">${puce('genre', 'femme', 'Femme')}${puce('genre', 'homme', 'Homme')}${f.format === 'duo' ? puce('genre', 'mixte', 'Mixte') : ''}</div>
      ${f.format === 'relais' ? '<div class="petit">En relais, chacun prend les charges de son sexe : choisis le tien.</div>' : ''}
      <div class="carte petit u-t-13 u-interligne-1-5">${(() => {
    const n = niveauCharges(f);
    const c = CHARGES[n];
    return `<strong class="u-c-accent">Charges niveau ${n}</strong> · sled push ${c.sledPush} kg · sled pull ${c.sledPull} kg (traîneau compris) · farmers 2 × ${c.farmers} kg · sac ${c.fentes} kg · wall ball ${c.wallball} kg`;
  })()}</div>
    </div>
    <div class="pile u-ecart-8">
      <div class="sur-titre">Tes 3 séances par semaine</div>
      <div class="carte pile u-ecart-10">
        <div class="ligne"><span class="u-flex-1 u-gras-600">Hyrox</span>
          <div class="stepper"><button data-action="hp-h" data-d="-1" aria-label="Moins d'Hyrox">−</button><div class="val u-lmin-40">${f.hyroxParSemaine}</div><button data-action="hp-h" data-d="1" aria-label="Plus d'Hyrox">+</button></div></div>
        <div class="ligne"><span class="u-flex-1 u-gras-600">Muscu</span><div class="val chiffre u-t-20 u-lmin-40 u-aligne-center u-md-48">${3 - f.hyroxParSemaine}</div></div>
        <div class="petit u-c-accent">${f.mode === 'competition' && restantes ? `Conseillé à ${restantes} semaine${restantes > 1 ? 's' : ''} de la compétition : ${conseil} Hyrox + ${3 - conseil} muscu` : `Conseillé : ${conseil} Hyrox + ${3 - conseil} muscu`}</div>
      </div>
    </div>
    <div class="pile u-ecart-8">
      <div class="sur-titre">Tes repères (pour calculer tes allures)</div>
      <div class="carte pile u-ecart-0 u-pad-4-14">
        ${repere('course10k', '10 km course', '/km', 10)}
        ${repere('rameur1k', '1 000 m rameur', '/500 m', 2)}
        ${repere('ski1k', '1 000 m SkiErg', '/500 m', 2)}
      </div>
      <div class="petit">Laisse vide si tu ne sais pas : la séance test les mesure pour toi.</div>
    </div>
    <div class="barre-action theme-hyrox-fond">
      <button class="btn-principal" data-action="hp-ok">${f.mode === 'competition' ? (d.hyroxProfil ? 'Enregistrer et mettre à jour le plan' : 'Créer mon plan') : 'Enregistrer'}</button>
    </div>
  </main>`;
}

/** Actions des boutons de ce fichier (attribut data-action dans le HTML). */
export const actions = {
  'hyrox-profil'() {
    const p = d.hyroxProfil;
    const r = p?.reperes || {};
    ui.hp = {
      mode: p?.mode || 'competition', date: p?.date || '', niveau: p?.niveau || 'open', format: p?.format || 'duo',
      genre: p?.genre || 'femme', hyroxParSemaine: p?.hyroxParSemaine || 2,
      reperes: { course10k: ecrireTemps(r.course10k), rameur1k: ecrireTemps(r.rameur1k), ski1k: ecrireTemps(r.ski1k) },
    };
    ui.ecran = 'hyrox-profil';
    window.scrollTo(0, 0);
  },
  hp(el) {
    ui.hp[el.dataset.champ] = el.dataset.v;
    // Mixte n'existe qu'en duo.
    if (ui.hp.format !== 'duo' && ui.hp.genre === 'mixte') ui.hp.genre = 'femme';
  },
  'hp-h'(el) { ui.hp.hyroxParSemaine = Math.min(3, Math.max(1, ui.hp.hyroxParSemaine + Number(el.dataset.d))); },
  'hp-ok'() {
    const f = ui.hp;
    if (f.mode === 'competition' && (!f.date || f.date < aujourdhui())) { toast('Choisis une date de compétition à venir'); return false; }
    const reperes = {};
    for (const [k, v] of Object.entries(f.reperes)) {
      const s = lireTemps(v);
      if (v && !s) { toast('Temps à écrire sous la forme mm:ss (ex. 55:00)'); return false; }
      if (s) reperes[k] = s;
    }
    d.hyroxProfil = { mode: f.mode, date: f.mode === 'competition' ? f.date : (d.hyroxProfil?.date || ''), niveau: f.niveau, format: f.format, genre: f.genre, hyroxParSemaine: f.hyroxParSemaine, reperes };
    enregistrer();
    ui.ecran = 'hyrox';
    toast(f.mode === 'competition' ? 'Plan créé' : 'Profil enregistré');
    return false;
  },
  'hyrox-libre'() { ui.ecran = 'hyrox-libre'; window.scrollTo(0, 0); },
  'hyrox-apercu'(el) { ui.hyroxApercu = el.dataset.id; ui.ecran = 'hyrox-apercu'; window.scrollTo(0, 0); },
  'voir-plan'() { ui.modal = { type: 'plan' }; },
};
