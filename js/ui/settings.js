// Instellingen: intervals.icu, materiaal, programma, data

import { el, toast, cardHead, explain, ICO, DAY_NL } from './common.js';
import { get, S, update, exportData, importData, todayISO, VERSION } from '../state.js';
import { EQUIPMENT_NL } from '../data/exercises.js';
import * as icu from '../icu.js';
import { openEditor } from './editor.js';

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

  app.append(el('p', { class: 'center tiny dim' }, `SMRT.FTNSS v${VERSION} · persoonlijke trainingsapp · gebouwd op je eigen trainingsrapport`));
}

function backupHint() {
  const last = S().lastBackupAt;
  if (!last) return 'Alles staat lokaal op dit toestel. Nog nooit een backup gemaakt — doe dat af en toe.';
  const days = Math.round((new Date(todayISO()) - new Date(last)) / 86400000);
  return days > 21
    ? `Alles staat lokaal op dit toestel. Laatste backup ${days} dagen geleden — tijd voor een nieuwe.`
    : `Alles staat lokaal op dit toestel. Laatste backup: ${days === 0 ? 'vandaag' : days + ' dagen geleden'}.`;
}
