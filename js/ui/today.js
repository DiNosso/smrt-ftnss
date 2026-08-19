// Vandaag: advies, sessie van vandaag, dagelijkse gewoontes

import { el, fmtDate, toast, sheet } from './common.js';
import { get, S, update, todayISO } from '../state.js';
import * as icu from '../icu.js';
import { advise, buildWorkout, mesoInfo, muscleStatus, proteinTarget, weekStreak, adhocSession } from '../engine.js';
import { DAILY_HABITS, SESSIONS } from '../data/program.js';
import { MUSCLE_NL, EXERCISES } from '../data/exercises.js';
import { openWorkout } from './workout.js';

export async function renderToday(app, ctx) {
  const iso = todayISO();
  const meso = mesoInfo(iso);

  app.append(el('div', { class: 'hero' },
    el('div', { class: 'date' }, fmtDate(iso)),
    el('h1', {}, 'SMRT.FTNSS'),
    el('div', { class: 'mt' },
      el('span', { class: 'pill' }, `Week ${meso.week}`),
      el('span', { class: 'pill' + (meso.isDeload ? ' warn' : '') }, meso.isDeload ? 'Deload' : `Blokweek ${meso.pos + 1}/4`),
      weekStreak() >= 1 ? el('span', { class: 'pill good' }, `🔥 ${weekStreak()} ${weekStreak() === 1 ? 'week' : 'weken'} streak`) : null,
    )));

  // Dagelijkse check-in (15 sec) — voedt advies en planner
  app.append(checkinCard(iso, ctx));

  // Advieskaart (asynchroon: eerst zonder icu, dan verversen)
  const adviceBox = el('div');
  app.append(adviceBox);
  const sessionBox = el('div');
  app.append(sessionBox);

  const draw = (cache, icuError) => {
    adviceBox.innerHTML = '';
    sessionBox.innerHTML = '';
    const adv = advise(iso, cache);

    // Advies
    const levelPill = {
      go: el('span', { class: 'pill good' }, 'Klaar om te trainen'),
      lighter: el('span', { class: 'pill warn' }, 'Iets lichter vandaag'),
      easy: el('span', { class: 'pill danger' }, 'Rustig aan'),
      rest: el('span', { class: 'pill danger' }, 'Herstel eerst'),
    }[adv.level];

    const tired = get().tired[iso];
    adviceBox.append(el('div', { class: 'card' },
      el('div', { class: `advice ${adv.level}` },
        el('div', { class: 'spread' }, el('h4', { class: 'mb0' }, 'Advies van vandaag'), levelPill),
        el('div', { class: 'mt tiny dim' }, adv.reasons.map(r => el('p', { class: 'mb0', style: 'margin-bottom:4px' }, '· ' + r))),
        adv.form != null ? el('div', { class: 'mt tiny dim' }, `intervals.icu vorm: ${adv.form > 0 ? '+' + adv.form : adv.form} (CTL−ATL)`) : null,
        icuError ? el('div', { class: 'mt tiny', style: 'color:var(--warn)' }, `⚠ intervals.icu: ${icuError}`) : null,
        !icu.isConfigured() ? el('div', { class: 'mt tiny dim' }, 'Tip: koppel intervals.icu in Instellingen, dan telt je padel/fiets-belasting automatisch mee.') : null,
      ),
      el('div', { class: 'row mt' },
        el('button', { class: 'btn-sm' + (tired === 'moe' ? ' btn-secondary' : ''), onclick: () => { update(s => { s.tired[iso] = tired === 'moe' ? undefined : 'moe'; }); ctx.render(); } }, '😮‍💨 Beetje moe'),
        el('button', { class: 'btn-sm' + (tired === 'kapot' ? ' btn-secondary' : ''), onclick: () => { update(s => { s.tired[iso] = tired === 'kapot' ? undefined : 'kapot'; }); ctx.render(); } }, '🥱 Kapot'),
      )));

    // Sessie van vandaag
    const done = get().logs.some(l => l.date === iso && l.sessionId === adv.session.id);
    const slots = buildWorkout(adv.session, adv.adjust);
    const focus = adv.session.focus.map(m => MUSCLE_NL[m] || m).join(' · ');

    sessionBox.append(el('div', { class: 'card accent' },
      el('div', { class: 'spread' },
        el('h3', { class: 'mb0' }, adv.session.name),
        adv.session.durationMin ? el('span', { class: 'pill' }, `± ${adv.session.durationMin} min`) : null),
      focus ? el('div', { class: 'tiny dim mt' }, focus) : null,
      el('p', { class: 'mt tiny dim' }, adv.session.description),
      slots.length ? el('ul', { class: 'slotlist mt' },
        slots.map(s => el('li', {},
          el('span', { class: 'grow' }, s.exercise?.nameNL || s.ex),
          el('span', { class: 'scheme' }, `${s.sets}×${s.reps[0]}-${s.reps[1]}`)))) : null,
      adv.session.id !== adv.base.id ? el('p', { class: 'mt tiny dim' }, `(Gepland stond: ${adv.base.name} — die schuift door.)`) : null,
      slots.length ? el('button', {
        class: 'btn-primary btn-block mt', onclick: () => openWorkout(adv.session, adv.adjust, ctx)
      }, done ? '✓ Al gedaan — nog een keer?' : '▶ Start workout') : null,
      done ? el('div', { class: 'center tiny mt', style: 'color:var(--accent)' }, 'Vandaag al gelogd. Lekker bezig! 💪') : null,
    ));
  };

  draw(get().icuCache);
  if (icu.isConfigured()) {
    icu.refresh().then(cache => draw(cache)).catch(e => draw(get().icuCache, e.message));
  }

  // Spierherstel
  const ms = muscleStatus(iso);
  if (get().logs.length) {
    app.append(el('div', { class: 'card' },
      el('h5', {}, 'Spierherstel'),
      el('div', { class: 'row wrap' },
        ms.map(m => el('span', { class: 'pill ' + (m.ready ? 'good' : 'warn') },
          `${MUSCLE_NL[m.muscle] || m.muscle}${m.ready ? ' ✓' : ` ${m.hoursLeft}u`}`)))));
  }

  // Maandcheck (elke ~30 dagen)
  const lastCheck = S().lastMonthCheck;
  const daysSinceCheck = lastCheck ? Math.round((new Date(iso) - new Date(lastCheck)) / 86400000) : 999;
  if (daysSinceCheck >= 30 && get().logs.length >= 4) {
    const waistIn = el('input', { type: 'number', step: '0.5', inputmode: 'decimal', placeholder: 'taille (cm)', style: 'width:130px' });
    app.append(el('div', { class: 'card', style: 'border-color:var(--warn)' },
      el('h5', {}, '📸 Maandcheck'),
      el('p', { class: 'tiny dim' }, 'Tijd voor je maandelijkse voortgangscheck: voortgangsfoto (zelfde licht/hoek), taille meten op de navel, en weeg je een paar ochtenden achter elkaar. De weegschaal alleen liegt — foto + taille vertellen het echte recomp-verhaal.'),
      el('div', { class: 'row' }, waistIn,
        el('button', { class: 'btn-sm btn-secondary', onclick: () => {
          const waist = parseFloat(waistIn.value);
          update(s => {
            s.settings.lastMonthCheck = iso;
            if (waist && waist > 40 && waist < 200) { s.measurements[iso] = { ...(s.measurements[iso] || {}), waist }; }
          });
          toast('Maandcheck opgeslagen'); ctx.render();
        } }, '✓ Gedaan'))));
  }

  // Vrije workout
  app.append(el('div', { class: 'card' },
    el('div', { class: 'spread' },
      el('div', {},
        el('h5', { class: 'mb0' }, 'Vrije workout'),
        el('div', { class: 'tiny dim' }, 'Spontaan naar het rek, of gewoon iets anders? Kies zelf je oefeningen — telt gewoon mee.')),
      el('button', { class: 'btn-sm', onclick: () => openAdhocPicker(ctx) }, '+ Start'))));

  // Andere sessie kiezen
  app.append(el('div', { class: 'card' },
    el('h5', {}, 'Iets anders doen?'),
    el('div', { class: 'row wrap mt' },
      el('button', { class: 'btn-sm', style: 'border-color:rgba(224,122,122,.4)', onclick: () => {
        update(st => { st.swaps[iso] = 'rest'; }); ctx.render();
      } }, '🚫 Kan vandaag niet'),
      Object.values(SESSIONS).filter(s => s.id !== 'rest').map(s =>
        el('button', { class: 'btn-sm', onclick: () => { update(st => { st.swaps[iso] = s.id; }); ctx.render(); } }, s.name.split('·')[1]?.trim() || s.name)),
      get().swaps[iso] ? el('button', { class: 'btn-sm btn-ghost', style: 'color:var(--accent)', onclick: () => { update(st => { delete st.swaps[iso]; }); ctx.render(); } }, '↺ Automatische planning') : null),
    el('p', { class: 'tiny dim mt mb0' }, 'Kun je niet? De gemiste sessie verdwijnt niet — de wachtrij schuift automatisch op naar de eerstvolgende dag dat het wél past.')));

  // Dagelijkse gewoontes
  const habits = get().habits[iso] || {};
  app.append(el('div', { class: 'card' },
    el('h4', {}, 'Dagelijks'),
    DAILY_HABITS.map(h => {
      if (h.requiresEquipment === 'pullUpBar' && !S().hasPullUpBar) {
        return el('div', { class: 'habit' },
          el('input', { type: 'checkbox', checked: !!habits[h.id], onchange: e => setHabit(iso, h.id, e.target.checked) }),
          el('div', {}, el('div', {}, h.name), el('div', { class: 'tiny dim' }, h.fallback)));
      }
      let detail = h.detail;
      if (h.id === 'protein') {
        const p = proteinTarget(get().icuCache);
        detail = `Doel: ±${p.grams} g eiwit vandaag (2 g/kg bij ${Math.round(p.kg)} kg), verdeeld over 3-5 momenten.`;
      }
      return el('div', { class: 'habit' },
        el('input', { type: 'checkbox', checked: !!habits[h.id], onchange: e => setHabit(iso, h.id, e.target.checked) }),
        el('div', {}, el('div', {}, h.name), el('div', { class: 'tiny dim' }, detail)));
    })));

  // Recente sport uit intervals.icu
  const actBox = el('div');
  app.append(actBox);
  const drawActs = (cache) => {
    actBox.innerHTML = '';
    const recent = (cache?.activities || []).slice(0, 5);
    if (recent.length) {
      actBox.append(el('div', { class: 'card' },
        el('h4', {}, 'Recente activiteiten (intervals.icu)'),
        recent.map(a => el('div', { class: 'spread', style: 'padding:6px 0' },
          el('span', {}, `${icu.TYPE_NL[a.type] || a.type || '?'} · ${a.name || ''}`),
          el('span', { class: 'tiny dim' }, `${(a.start_date_local || '').slice(5, 10)} · load ${Math.round(a.icu_training_load || 0)}`)))));
    }
  };
  drawActs(get().icuCache);
  if (icu.isConfigured()) icu.refresh().then(drawActs).catch(() => {});
}

/** Dagelijkse check-in: motivatie, slaap (fallback), spierpijn per spiergroep. */
function checkinCard(iso, ctx) {
  const existing = get().checkins?.[iso];
  const card = el('div', { class: 'card' });

  if (existing && !card.dataset.editing) {
    const soreList = Object.entries(existing.soreness || {}).filter(([, v]) => v)
      .map(([m, v]) => `${MUSCLE_NL[m] || m}${v === 2 ? ' 🔥' : ''}`);
    card.append(el('div', { class: 'spread' },
      el('div', {},
        el('h5', { class: 'mb0' }, '✓ Check-in gedaan'),
        el('div', { class: 'tiny dim' },
          `Motivatie ${existing.motivation ?? '–'}/5 · slaap ${existing.sleepScore ?? '–'}/5` +
          (soreList.length ? ` · spierpijn: ${soreList.join(', ')}` : ' · geen spierpijn'))),
      el('button', { class: 'btn-sm btn-ghost', onclick: () => {
        update(s => { delete s.checkins[iso]; }); ctx.render();
      } }, 'Aanpassen')));
    return card;
  }

  const state = { motivation: null, sleepScore: null, soreness: {} };
  const scaleRow = (key) => {
    const row = el('div', { class: 'seg' });
    for (let v = 1; v <= 5; v++) {
      const b = el('button', { onclick: () => {
        state[key] = v;
        row.querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
      } }, String(v));
      row.append(b);
    }
    return row;
  };

  const SORE_MUSCLES = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'core', 'quadriceps'];
  const soreRow = el('div', { class: 'row wrap' });
  for (const m of SORE_MUSCLES) {
    const pill = el('span', { class: 'pill', style: 'cursor:pointer' }, MUSCLE_NL[m]);
    pill.addEventListener('click', () => {
      const cur = state.soreness[m] || 0;
      const next = (cur + 1) % 3;
      state.soreness[m] = next;
      pill.className = 'pill ' + (next === 1 ? 'warn' : next === 2 ? 'danger' : '');
      pill.textContent = MUSCLE_NL[m] + (next === 1 ? ' 😖' : next === 2 ? ' 🔥' : '');
    });
    soreRow.append(pill);
  }

  card.append(
    el('h5', {}, '☀️ Check-in (15 sec)'),
    el('label', {}, 'Motivatie om te trainen'), scaleRow('motivation'),
    el('label', {}, 'Hoe heb je geslapen?'), scaleRow('sleepScore'),
    el('label', {}, 'Spierpijn? Tik aan (nog eens tikken = erger)'), soreRow,
    el('button', { class: 'btn-secondary btn-block mt', onclick: () => {
      update(s => { s.checkins[iso] = { motivation: state.motivation, sleepScore: state.sleepScore, soreness: state.soreness }; });
      toast('Check-in opgeslagen — advies bijgewerkt');
      ctx.render();
    } }, '✓ Klaar'));
  return card;
}

/** Kies oefeningen voor een vrije workout. */
function openAdhocPicker(ctx) {
  const myEq = new Set(S().equipment);
  if (S().hasPullUpBar) myEq.add('pullUpBar');
  const pool = EXERCISES.filter(e => e.equipment.every(q => myEq.has(q)));
  const chosen = new Set();
  let filterMuscle = null;

  const listBox = el('div', { style: 'max-height:45dvh;overflow-y:auto' });
  const startBtn = el('button', { class: 'btn-primary btn-block mt' }, 'Start (0 oefeningen)');
  const bar = el('div', { class: 'filterbar' });

  const drawList = () => {
    bar.innerHTML = '';
    const muscles = [...new Set(pool.map(e => e.muscle))];
    bar.append(el('span', { class: 'pill' + (filterMuscle === null ? ' on' : ''), onclick: () => { filterMuscle = null; drawList(); } }, 'Alles'));
    for (const m of muscles) bar.append(el('span', { class: 'pill' + (filterMuscle === m ? ' on' : ''), onclick: () => { filterMuscle = m; drawList(); } }, MUSCLE_NL[m] || m));
    listBox.innerHTML = '';
    for (const e of pool.filter(e => !filterMuscle || e.muscle === filterMuscle)) {
      listBox.append(el('div', { class: 'habit' },
        el('input', { type: 'checkbox', checked: chosen.has(e.id), onchange: ev => {
          ev.target.checked ? chosen.add(e.id) : chosen.delete(e.id);
          startBtn.textContent = `Start (${chosen.size} oefening${chosen.size === 1 ? '' : 'en'})`;
        } }),
        el('div', {}, el('div', {}, e.nameNL), el('div', { class: 'tiny dim' }, MUSCLE_NL[e.muscle] || e.muscle))));
    }
  };
  drawList();

  const close = sheet(el('div', {},
    el('h3', {}, 'Vrije workout'),
    el('p', { class: 'tiny dim' }, 'Kies je oefeningen (standaard 3 sets van 8-15, pas aan tijdens de workout).'),
    bar, listBox, startBtn));

  startBtn.addEventListener('click', () => {
    if (!chosen.size) return toast('Kies minstens één oefening');
    close();
    openWorkout(adhocSession([...chosen]), { setFactor: 1, rirBonus: 0, restBonus: 0 }, ctx);
  });
}

function setHabit(iso, id, val) {
  update(s => {
    s.habits[iso] = s.habits[iso] || {};
    s.habits[iso][id] = val;
  });
}
