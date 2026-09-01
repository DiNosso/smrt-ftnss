// Instellingen: intervals.icu, materiaal, programma, data

import { el, toast, cardHead, explain, sheet, ICO, DAY_NL } from './common.js';
import { get, S, update, exportData, importData, todayISO, VERSION } from '../state.js';
import { EQUIPMENT_NL } from '../data/exercises.js';
import * as icu from '../icu.js';
import { openEditor } from './editor.js';
import { doeBackup } from './today.js';
import { storageInfo } from '../backup.js';
import { STORAGE_KEY } from '../state.js';
import { SPORT_CHOICES } from '../engine.js';
import { newPairCode } from '../tvsync.js';
import { parseStrongCsv, applyBaselines, scaleBaselines } from '../engine.js';

const HOME_EQUIPMENT = ['dumbbells', 'bench', 'inclineBench', 'kettlebell', 'resistanceBands', 'abWheel', 'bodyweight'];

export function renderSettings(app, ctx) {
  app.append(el('div', { class: 'hero' }, el('h2', { class: 'mb0' }, 'Instellingen')));

  // --- intervals.icu ---
  const keyInput = el('input', { type: 'password', placeholder: 'API-key van intervals.icu', value: S().icuApiKey || '', autocomplete: 'off' });
  const status = el('div', { class: 'tiny mt' });
  const testBtn = el('button', { class: 'btn-secondary btn-sm mt', onclick: async () => {
    update(s => { s.settings.icuApiKey = keyInput.value.trim(); s.icuCache = null; });
    if (!keyInput.value.trim()) { status.textContent = 'Key gewist.'; return; }
    status.textContent = 'Testen…';
    try {
      const cache = await icu.refresh(true);
      const n = cache?.activities?.length ?? 0;
      const form = icu.form(cache);
      status.innerHTML = `✅ Verbonden! ${n} activiteiten (laatste 10 dagen)${form != null ? `, vorm ${form > 0 ? '+' + form : form}` : ''}.`;
      status.style.color = 'var(--accent)';
    } catch (e) {
      status.textContent = '❌ ' + e.message;
      status.style.color = 'var(--danger)';
    }
  } }, 'Opslaan & testen');

  app.append(el('div', { class: 'card accent' },
    el('h4', {}, 'intervals.icu'),
    el('p', { class: 'tiny dim' }, 'Maak een API-key aan op intervals.icu → Settings → Developer Settings. De key blijft alleen op dit toestel en gaat rechtstreeks naar intervals.icu.'),
    el('label', {}, 'API-key'), keyInput,
    testBtn, status,
    el('div', { class: 'habit mt' },
      el('input', { type: 'checkbox', checked: S().pushToIcu, onchange: e => update(s => { s.settings.pushToIcu = e.target.checked; }) }),
      el('div', {}, el('span', {}, 'Workouts terugsturen naar intervals.icu'),
        el('div', { class: 'tiny dim' }, 'Afgeronde sessies worden als WeightTraining-activiteit gepost, zodat je vorm (CTL/ATL) ook je krachttraining meetelt.')))));

  // --- Beschikbaarheid ---
  const OPTS = [0, 15, 30, 45, 60, 75];
  const availCard = el('div', { class: 'card' });
  const drawAvail = () => {
    availCard.innerHTML = '';
    const av = [...(S().availability || [60, 15, 60, 15, 60, 30, 0])];
    const longDays = av.filter(m => m >= 40).length;
    availCard.append(cardHead(ICO.cal, 'Wanneer heb je tijd?',
      el('span', { class: 'pill' + (longDays >= (S().heavyPerWeek ?? 3) ? ' good' : ' warn') }, `${longDays} lange dag${longDays === 1 ? '' : 'en'}`)));
    availCard.append(el('p', { class: 'tiny dim' }, 'Zet per dag hoeveel minuten je kwijt kunt. 40+ minuten = ruimte voor een zware sessie; korter wordt automatisch een snack; 0 is een rustdag.'));
    for (let d = 0; d < 7; d++) {
      const opts = el('div', { class: 'opts' }, OPTS.map(m => el('button', {
        class: (av[d] === m ? 'on' : ''),
        onclick: () => { update(st => { const a = [...(st.settings.availability || av)]; a[d] = m; st.settings.availability = a; }); drawAvail(); },
      }, m === 0 ? '–' : m)));
      availCard.append(el('div', { class: 'availrow' }, el('span', { class: 'dn' }, DAY_NL[d]), opts));
    }
    const hpw = el('div', { class: 'seg mt' }, [2, 3, 4, 5].map(n => el('button', {
      class: (S().heavyPerWeek === n ? 'on' : ''),
      onclick: () => { update(st => { st.settings.heavyPerWeek = n; }); drawAvail(); },
    }, String(n))));
    availCard.append(el('label', {}, 'Zware sessies per week (streven)'), hpw);
    availCard.append(explain('Hoe gebruikt de app dit?', el('p', { class: 'mb0' },
      'De wachtrij plant zware sessies alleen op dagen met 40+ minuten en houdt zich aan je streefaantal. Heb je op een dag minder tijd dan de sessie kost, dan kort de app hem automatisch in: eerst sets eraf (hoofdlift houdt er minimaal 3), daarna de laatste oefeningen. Zo blijft de belangrijkste prikkel altijd staan.')));
  };
  drawAvail();
  app.append(availCard);

  // --- Materiaal ---
  const eqCard = el('div', { class: 'card' }, el('h4', {}, 'Mijn materiaal'));
  for (const q of HOME_EQUIPMENT) {
    const has = S().equipment.includes(q);
    eqCard.append(el('div', { class: 'habit' },
      el('input', { type: 'checkbox', checked: has, onchange: e => {
        update(s => {
          const set = new Set(s.settings.equipment);
          e.target.checked ? set.add(q) : set.delete(q);
          s.settings.equipment = [...set];
        });
      } }),
      el('span', {}, EQUIPMENT_NL[q] || q)));
  }
  eqCard.append(el('div', { class: 'habit' },
    el('input', { type: 'checkbox', checked: S().hasPullUpBar, onchange: e => { update(s => { s.settings.hasPullUpBar = e.target.checked; }); ctx.render(); } }),
    el('div', {}, el('span', {}, 'Optrekstang'), el('div', { class: 'tiny dim' }, 'Zet aan zodra je er een hebt — dan verschijnt dagelijks hangen weer in je dagelijkse lijstje.'))));
  eqCard.append(el('div', { class: 'habit' },
    el('input', { type: 'checkbox', checked: S().dailyHang, onchange: e => { update(s => { s.settings.dailyHang = e.target.checked; }); ctx.render(); } }),
    el('div', {}, el('span', {}, 'Dagelijks hangen tonen'), el('div', { class: 'tiny dim' }, 'Optioneel: leuk voor grip en schouders, maar geen voorwaarde voor spiergroei. Staat uit zolang je geen stang hebt.'))));
  app.append(eqCard);

  // --- Programma ---
  const stepIn = el('input', { type: 'number', step: '0.5', value: S().weightStepKg, style: 'width:90px' });
  stepIn.addEventListener('change', () => update(s => { s.settings.weightStepKg = parseFloat(stepIn.value) || 2; }));
  const weightIn = el('input', { type: 'number', value: S().weightKg, style: 'width:90px' });
  weightIn.addEventListener('change', () => update(s => { s.settings.weightKg = parseFloat(weightIn.value) || 80; }));

  const dbIn = el('input', { placeholder: 'bijv. 4, 6, 8, 10, 12, 16, 20', value: S().dumbbellWeights || '' });
  dbIn.addEventListener('change', () => update(s => { s.settings.dumbbellWeights = dbIn.value.trim(); }));
  const goalSel = el('select', {},
    el('option', { value: 'recomp', selected: S().goalMode === 'recomp' }, 'Recompositie (spier erbij, vet eraf)'),
    el('option', { value: 'cut', selected: S().goalMode === 'cut' }, 'Cut (vet eraf, spier behouden)'),
    el('option', { value: 'maintain', selected: S().goalMode === 'maintain' }, 'Onderhouden'));
  goalSel.addEventListener('change', () => update(s => { s.settings.goalMode = goalSel.value; }));

  app.append(el('div', { class: 'card' },
    el('h4', {}, 'Programma'),
    el('button', { class: 'btn-secondary btn-block', onclick: () => openEditor(ctx) }, '✏️ Programma bewerken (sessies & oefeningen)'),
    el('label', {}, 'Doel'), goalSel,
    el('label', {}, 'Beschikbare dumbbell-gewichten (kg, komma-gescheiden)'), dbIn,
    el('div', { class: 'tiny dim mt' }, 'Ingevuld? Dan stellen gewichtssuggesties altijd een dumbbell voor die je écht hebt. Leeg = vaste stap hieronder.'),
    el('div', { class: 'spread mt' }, el('span', { class: 'tiny' }, 'Gewichtsstap bij progressie (kg)'), stepIn),
    el('div', { class: 'spread mt' }, el('span', { class: 'tiny' }, 'Lichaamsgewicht (kg, terugval voor eiwitdoel)'), weightIn),
    el('div', { class: 'tiny dim mt' }, 'Eiwitdoel volgt automatisch je laatst gemeten gewicht (2 g/kg uit je rapport).'),
    el('button', { class: 'btn-sm mt', onclick: () => {
      if (confirm('Programma-teller terugzetten naar week 1 (vandaag)?')) { update(s => { s.settings.programStart = todayISO(); }); toast('Week 1 gestart'); ctx.render(); }
    } }, 'Herstart programma op week 1')));

  // --- Data ---
  app.append(el('div', { class: 'card' },
    el('h4', {}, 'Data'),
    el('p', { class: 'tiny dim' }, backupHint()),
    (() => { const o = storageInfo(STORAGE_KEY);
      return el('p', { class: 'tiny dim' }, `Opslag in gebruik: ${(o.bytes / 1024).toFixed(0)} kB (${o.pct}% van wat een website mag bewaren). Er staat automatisch een reservekopie op je toestel.`); })(),
    el('div', { class: 'row wrap' },
      el('button', { class: 'btn-sm', onclick: () => {
        doeBackup(ctx);
      } }, '⬇ Backup exporteren'),
      el('button', { class: 'btn-sm', onclick: () => {
        const inp = el('input', { type: 'file', accept: '.json' });
        inp.addEventListener('change', () => {
          const f = inp.files[0]; if (!f) return;
          f.text().then(t => { importData(t); toast('Backup teruggezet'); ctx.render(); }).catch(() => toast('Import mislukt'));
        });
        inp.click();
      } }, '⬆ Backup terugzetten'),
      el('button', { class: 'btn-danger btn-sm', onclick: () => {
        if (confirm('Alle logs en instellingen wissen?')) { localStorage.clear(); location.reload(); }
      } }, 'Alles wissen'))));

  // --- Baselines uit Strong ---
  app.append(el('div', { class: 'card' },
    cardHead(ICO.trophy, 'Startgewichten importeren'),
    el('p', { class: 'tiny dim' }, 'Heb je een Strong-export? Dan haalt de app daar je zwaarste set per oefening uit, zodat je niet vanaf nul begint.'),
    el('button', { class: 'btn-block', onclick: () => {
      const f = el('input', { type: 'file', accept: '.csv,text/csv', style: 'display:none' });
      f.addEventListener('change', () => {
        const file = f.files?.[0]; if (!file) return;
        file.text().then(t => openStrongImport(t, ctx)).catch(() => toast('Bestand niet leesbaar'));
      });
      document.body.append(f); f.click(); setTimeout(() => f.remove(), 1000);
    } }, '📄 Strong-export (CSV) kiezen'),
    explain('Waar vind ik die?', el('p', { class: 'mb0' },
      'In Strong: Instellingen → Export Data (Strong Pro). Je krijgt een CSV per mail. '
      + 'Lukt dat niet, dan is er niets aan de hand — bij elke nieuwe oefening kun je in de player '
      + 'met één testset je startgewicht laten uitrekenen.'))));

  // --- TV-scherm ---
  app.append(tvCard(ctx));

  // --- Vaste sportdagen ---
  app.append(el('div', { class: 'card' },
    cardHead(ICO.cal, 'Vaste sportdagen'),
    el('p', { class: 'tiny dim' }, 'Sport je elke week op vaste dagen? Zet ze hier aan. Op die dagen plant de app geen krachtsessie — die schuift door naar je eerstvolgende vrije dag.'),
    fixedSportsEditor(ctx),
    explain('En als het een keer niet doorgaat?', el('p', { class: 'mb0' },
      'Tik op die dag in het weekoverzicht. Je kunt hem dan overslaan voor die week, of verzetten naar een andere dag. De planning past zich meteen aan.'))));

  // Noodknop: gooit alleen de app-cache weg, je logs en instellingen blijven staan.
  app.append(el('div', { class: 'card' },
    cardHead(ICO.bolt, 'Versie'),
    el('div', { class: 'spread' },
      el('span', {}, `SMRT.FTNSS v${VERSION}`),
      el('button', { class: 'btn-sm', onclick: () => forceUpdate() }, '↻ Update ophalen')),
    explain('Werkt de app niet bij?',
      'Deze knop gooit alleen de opgeslagen app-bestanden weg en haalt de nieuwste versie op. '
      + 'Je trainingslogs, instellingen en koppelingen blijven gewoon staan — die zitten los van de cache.')));

  app.append(el('p', { class: 'center tiny dim' }, `SMRT.FTNSS v${VERSION} · persoonlijke trainingsapp · gebouwd op je eigen trainingsrapport`));
}

/** Cache en service worker opruimen en opnieuw laden. Raakt je data niet aan. */
async function forceUpdate() {
  toast('Nieuwste versie ophalen…');
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  } catch (e) {
    console.warn('cache opruimen mislukt', e);
  }
  // Cache-buster zodat ook de browser zelf een verse kopie pakt.
  location.replace(location.pathname + '?u=' + Date.now());
}

function backupHint() {
  const last = S().lastBackupAt;
  if (!last) return 'Alles staat lokaal op dit toestel. Nog nooit een backup gemaakt — doe dat af en toe.';
  const days = Math.round((new Date(todayISO()) - new Date(last)) / 86400000);
  return days > 21
    ? `Alles staat lokaal op dit toestel. Laatste backup ${days} dagen geleden — tijd voor een nieuwe.`
    : `Alles staat lokaal op dit toestel. Laatste backup: ${days === 0 ? 'vandaag' : days + ' dagen geleden'}.`;
}

/** Per weekdag aanvinken welke vaste sport je doet. */
function fixedFor(dow) { return (S().fixedSports || []).filter(f => f.dow === dow); }

function fixedSportsEditor(ctx) {
  const box = el('div');
  const draw = () => {
    box.innerHTML = '';
    for (let d = 0; d < 7; d++) {
      const on = new Set(fixedFor(d).map(f => f.type));
      box.append(el('div', { class: 'fixedrow' },
        el('span', { class: 'dn' }, DAY_NL[d]),
        el('div', { class: 'sports' }, SPORT_CHOICES.filter(c => c.type !== 'Workout').map(c =>
          el('button', { class: 'btn-sm' + (on.has(c.type) ? ' on' : ''), onclick: () => {
            update(st => {
              const arr = st.settings.fixedSports || (st.settings.fixedSports = []);
              const i = arr.findIndex(f => f.dow === d && f.type === c.type);
              if (i >= 0) arr.splice(i, 1); else arr.push({ dow: d, type: c.type });
            });
            draw();
            ctx?.render?.();
          } }, c.label.split(' ')[0])))));
    }
  };
  draw();
  return box;
}

/** Toon wat er in de Strong-export zit en laat kiezen wat je overneemt. */
function openStrongImport(text, ctx) {
  const res = parseStrongCsv(text);
  if (res.error) return toast(res.error);
  if (!res.matched.length && !res.unmatched.length) return toast('Geen sets gevonden in dit bestand');

  const checks = {};
  let factor = res.factor ?? 1;
  const box = el('div', {},
    el('h3', {}, 'Startgewichten uit Strong'),
    el('p', { class: 'tiny dim' }, `${res.sets} sets gelezen. Hieronder je zwaarste set per oefening — vink aan wat je wilt overnemen.`));
  const close = sheet(box);

  // Lang niet getraind? Dan zijn je oude gewichten geen startgewichten.
  let redraw = () => {};
  if (res.note) {
    const pct = el('span', { style: 'color:var(--accent);font-weight:700' });
    const opts = el('div', { class: 'row wrap mt' }, [1, 0.85, 0.75, 0.6, 0.5].map(f =>
      el('button', { class: 'btn-sm', 'data-f': String(f), onclick: () => { factor = f; redraw(); } },
        f === 1 ? '100% (ongewijzigd)' : Math.round(f * 100) + '%')));
    box.append(el('div', { class: 'card', style: 'border-color:var(--warn)' },
      el('h5', { class: 'mb0' }, '⚠ Deze data is oud'),
      el('p', { class: 'tiny dim mt' }, res.note),
      el('div', { class: 'spread mt' }, el('span', { class: 'tiny dim' }, 'Overnemen op'), pct),
      opts,
      explain('Waarom lichter beginnen?', el('p', { class: 'mb0' },
        'Je spieren onthouden meer dan je pezen en gewrichten. Direct terug naar je oude gewichten is de snelste route naar een blessure. '
        + 'Begin lichter: zodra je RIR laat zien dat het te makkelijk is, zet de app het gewicht vanzelf in stappen omhoog — en dat gaat een stuk sneller dan de eerste keer opbouwen.'))));
    redraw = () => {
      pct.textContent = Math.round(factor * 100) + '%';
      opts.querySelectorAll('button').forEach(b =>
        b.classList.toggle('btn-secondary', Number(b.dataset.f) === factor));
      for (const { row, m } of Object.values(checks)) {
        if (row) row.textContent = `${Math.round(m.weight * factor * 2) / 2} kg × ${m.reps}`
          + (factor !== 1 ? `  (was ${m.weight} kg)` : '') + ` — uit "${m.name}"${m.date ? ` · ${m.date}` : ''}`;
      }
    };
  }

  if (res.matched.length) {
    const card = el('div', { class: 'card raised' });
    for (const m of res.matched) {
      // Ziet het gewicht er onmogelijk uit, dan standaard uit laten staan.
      const cb = el('input', { type: 'checkbox', checked: !m.odd });
      const row = el('div', { class: 'tiny dim' }, `${m.weight} kg × ${m.reps} — uit "${m.name}"${m.date ? ` · ${m.date}` : ''}`);
      checks[m.id] = { cb, m, row };
      card.append(el('label', { class: 'habit', style: 'cursor:pointer' }, cb,
        el('div', { class: 'grow' },
          el('div', {}, m.nameNL),
          row,
          m.odd ? el('div', { class: 'tiny', style: 'color:var(--warn)' }, '⚠ ' + m.odd) : null)));
    }
    box.append(card);
  } else {
    box.append(el('p', { class: 'dim' }, 'Geen enkele oefening kon gekoppeld worden aan je schema.'));
  }

  if (res.unmatched.length) {
    box.append(explain(`${res.unmatched.length} oefeningen niet herkend`, el('p', { class: 'tiny mb0' },
      res.unmatched.map(u => u.name).join(', ') + '. Deze staan niet in je schema of heten net anders. Je kunt ze handmatig invullen bij de eerste set.')));
  }

  redraw();

  if (res.matched.length) {
    box.append(el('button', { class: 'btn-primary btn-block mt', onclick: () => {
      const pick = Object.values(checks).filter(c => c.cb.checked).map(c => c.m);
      if (!pick.length) return toast('Niets aangevinkt');
      applyBaselines(factor === 1 ? pick : scaleBaselines(pick, factor));
      close();
      toast(`${pick.length} startgewichten overgenomen${factor !== 1 ? ` op ${Math.round(factor * 100)}%` : ''}`);
      ctx?.render?.();
    } }, '✓ Overnemen'));
  }
}

/** Koppelcode voor het losse tv-scherm, plus uitleg hoe je het op de tv krijgt. */
function tvCard(ctx) {
  const card = el('div', { class: 'card' });
  const teken = () => {
    card.innerHTML = '';
    const code = S().tvPairCode;
    const aan = !!S().tvEnabled;
    const tvUrl = new URL('tv.html', location.href).toString();

    card.append(
      cardHead(ICO.tv, 'TV-scherm'),
      el('p', { class: 'tiny dim' }, 'Zet je huidige oefening, demo, reps en rusttimer op de tv, terwijl je telefoon vrij blijft om sets af te vinken.'),
      el('label', { class: 'habit', style: 'cursor:pointer' },
        el('input', { type: 'checkbox', checked: aan, onchange: e => {
          update(st => {
            st.settings.tvEnabled = e.target.checked;
            if (e.target.checked && !st.settings.tvPairCode) st.settings.tvPairCode = newPairCode();
          });
          teken();
        } }),
        el('div', { class: 'grow' },
          el('div', {}, 'Tv-scherm meesturen'),
          el('div', { class: 'tiny dim' }, 'Alleen actief tijdens een workout.'))));

    if (!aan) return;

    card.append(
      el('div', { class: 'card raised' },
        el('div', { class: 'tiny dim' }, 'Koppelcode'),
        el('div', { style: 'font-family:var(--font-display);font-size:2rem;letter-spacing:.22em;color:var(--accent);text-align:center;padding:6px 0' }, code),
        el('div', { class: 'row' },
          el('button', { class: 'btn-sm grow', onclick: () => {
            navigator.clipboard?.writeText(code).then(() => toast('Code gekopieerd')).catch(() => toast(code));
          } }, 'Kopieer code'),
          el('button', { class: 'btn-sm grow', onclick: () => {
            if (!confirm('Nieuwe code aanmaken? Je moet je tv dan opnieuw koppelen.')) return;
            update(st => { st.settings.tvPairCode = newPairCode(); }); teken();
          } }, 'Nieuwe code'))),
      el('div', { class: 'row mt' },
        el('button', { class: 'btn-sm grow', onclick: () => {
          const u = tvUrl + '?code=' + code;
          navigator.clipboard?.writeText(u).then(() => toast('Tv-link gekopieerd')).catch(() => toast(u));
        } }, 'Kopieer tv-link'),
        el('button', { class: 'btn-sm grow', onclick: () => {
          const u = new URL('cast.html', location.href).toString() + '?code=' + code;
          navigator.clipboard?.writeText(u).then(() => toast('Laptop-link gekopieerd — bookmark hem daar')).catch(() => toast(u));
        } }, 'Kopieer laptop-link')),
      explain('Hoe krijg ik dit op mijn tv?', el('div', {},
        el('p', {}, el('b', {}, '1. Chromecast met Google TV of Google TV Streamer'), ' — de beste manier. Installeer daar een browser (TV Bro of Fully Kiosk) en open de tv-link. Eén keer de code invoeren en klaar; geen castsessie die kan verlopen.'),
        el('p', {}, el('b', {}, '2. Vanaf je iPhone met URLCast'), ' — een gratis app die precies dit doet: een webpagina naar je Chromecast sturen, waarna je de app mag afsluiten. Let op: URLCast staat sinds 2025 niet meer in de Nederlandse App Store (de maker heeft de EU-handelaarsregistratie nooit gedaan). Met een gratis Amerikaans of Brits Apple-account is hij wel te installeren.'),
        el('p', {}, el('b', {}, '3. Vanaf een laptop'), ' — open in Chrome:'),
        el('p', { style: 'word-break:break-all;color:var(--primary)' }, new URL('cast.html', location.href).toString()),
        el('p', {}, 'Vul de code in en cast één keer. Daarna mag de laptop dicht — je telefoon stuurt de tv rechtstreeks aan.'),
        el('p', { class: 'mb0' }, el('b', {}, '4. Iets anders?'), ' Elke oude tablet, laptop of Raspberry Pi met een browser werkt ook. Zelfde tv-link, zelfde code.'))),
      el('p', { class: 'tiny dim mb0' }, 'Casten vanuit een browser op je iPhone kan niet — Apple staat browsers geen toegang tot Chromecast-apparaten toe. Een native app zoals URLCast kan het wel.'));
  };
  teken();
  return card;
}
