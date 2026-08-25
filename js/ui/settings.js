// Instellingen: intervals.icu, materiaal, programma, data

import { el, toast, cardHead, explain, sheet, ICO, DAY_NL } from './common.js';
import { get, S, update, exportData, importData, todayISO, VERSION } from '../state.js';
import { EQUIPMENT_NL } from '../data/exercises.js';
import * as icu from '../icu.js';
import { openEditor } from './editor.js';
import { SPORT_CHOICES } from '../engine.js';
import { parseStrongCsv, applyBaselines } from '../engine.js';

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
    el('div', { class: 'row wrap' },
      el('button', { class: 'btn-sm', onclick: () => {
        const blob = new Blob([exportData()], { type: 'application/json' });
        const a = el('a', { href: URL.createObjectURL(blob), download: `smrt-ftnss-backup-${todayISO()}.json` });
        a.click();
        update(s => { s.settings.lastBackupAt = todayISO(); });
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
  const box = el('div', {},
    el('h3', {}, 'Startgewichten uit Strong'),
    el('p', { class: 'tiny dim' }, `${res.sets} sets gelezen. Hieronder je zwaarste set per oefening — vink aan wat je wilt overnemen.`));
  const close = sheet(box);

  if (res.matched.length) {
    const card = el('div', { class: 'card raised' });
    for (const m of res.matched) {
      // Ziet het gewicht er onmogelijk uit, dan standaard uit laten staan.
      const cb = el('input', { type: 'checkbox', checked: !m.odd });
      checks[m.id] = { cb, m };
      card.append(el('label', { class: 'habit', style: 'cursor:pointer' }, cb,
        el('div', { class: 'grow' },
          el('div', {}, m.nameNL),
          el('div', { class: 'tiny dim' }, `${m.weight} kg × ${m.reps} — uit "${m.name}"${m.date ? ` · ${m.date}` : ''}`),
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

  if (res.matched.length) {
    box.append(el('button', { class: 'btn-primary btn-block mt', onclick: () => {
      const pick = Object.values(checks).filter(c => c.cb.checked).map(c => c.m);
      if (!pick.length) return toast('Niets aangevinkt');
      applyBaselines(pick);
      close(); toast(`${pick.length} startgewichten overgenomen`); ctx?.render?.();
    } }, '✓ Overnemen'));
  }
}
