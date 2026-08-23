// Vandaag: hero + readiness-ring, weekstrip, advies, sessie, spierkaart, gewoontes

import { el, fmtDate, toast, sheet, DAY_NL, ring, statRow, cardHead, explain, weekStrip, bodyMap, ICO } from './common.js';
import { get, S, update, todayISO, addDays } from '../state.js';
import * as icu from '../icu.js';
import {
  advise, buildWorkout, mesoInfo, muscleStatus, proteinTarget, weekStreak, adhocSession,
  mondayOf, minutesOn, heavyTargetForWeek, weeklyVolume, VOLUME_TARGETS, plannedOn, readinessSignals, plannedSplitOn,
} from '../engine.js';
import { DAILY_HABITS, SESSIONS } from '../data/program.js';
import { openDayPicker } from './week.js';
import { MUSCLE_NL, EXERCISES } from '../data/exercises.js';
import { openWorkout } from './workout.js';

export async function renderToday(app, ctx) {
  const iso = todayISO();
  const meso = mesoInfo(iso);
  const logs = get().logs;

  // ---------- Hero: groet + readiness-ring ----------
  const hour = new Date().getHours();
  const greet = hour < 6 ? 'Goedenacht' : hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
  const heroRing = el('div');
  app.append(el('div', { class: 'herowrap' },
    el('div', { class: 'heroinfo' },
      el('div', { class: 'date', style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis' }, `${greet} · ${fmtDate(iso).replace(/ \d{4}$/, '')}`),
      el('h1', {}, 'SMRT.FTNSS'),
      el('div', {},
        el('span', { class: 'pill' }, `Week ${meso.week}`),
        el('span', { class: 'pill' + (meso.isDeload ? ' warn' : '') }, meso.isDeload ? 'Deload' : `Blok ${meso.pos + 1}/4`),
        weekStreak() >= 1 ? el('span', { class: 'pill good' }, `🔥 ${weekStreak()}`) : null)),
    heroRing));

  // ---------- Weekstrip + statrij ----------
  const mon = mondayOf(iso);
  const heavyDone = [];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(mon, i);
    const dayLogs = logs.filter(l => l.date === d);
    const sets = dayLogs.reduce((t, l) => t + l.sets.filter(s => s.done).length, 0);
    const isHeavy = dayLogs.some(l => SESSIONS[l.sessionId]?.type === 'heavy');
    if (isHeavy) heavyDone.push(d);
    const mins = minutesOn(d);
    // Sporten van die dag: gedaan (uit intervals.icu) + wat er nog gepland staat.
    const done = icu.doneSportsOn(get().icuCache, d);
    const stillPlanned = (d >= iso ? plannedSplitOn(d, get().icuCache).remaining : [])
      .map(p => ({ nl: icu.TYPE_NL[p.type] || p.type, icon: icu.TYPE_ICON[p.type] || icu.TYPE_ICON._, hard: p.hard, load: 0, planned: true }));
    // Krachttraining uit je eigen logs telt ook mee als sport op die dag.
    const strength = isHeavy || sets
      ? [{ nl: 'Krachttraining', icon: icu.TYPE_ICON.WeightTraining, hard: isHeavy, load: 0 }]
      : [];
    return {
      label: DAY_NL[i],
      pct: sets ? Math.min(100, 25 + sets * 5) : (mins >= 40 ? 22 : mins > 0 ? 12 : 6),
      state: sets ? 'done' : (d >= iso && mins > 0 ? 'planned' : ''),
      today: d === iso,
      sports: [...strength, ...done, ...stillPlanned],
      onClick: () => openDaySheet(d, ctx),
    };
  });

  const weekSets = logs.filter(l => l.date >= mon).reduce((t, l) => t + l.sets.filter(s => s.done).length, 0);
  const weekVol = Math.round(logs.filter(l => l.date >= mon)
    .reduce((t, l) => t + l.sets.reduce((x, s) => x + (s.done ? (s.weight || 0) * (s.reps || 0) : 0), 0), 0));
  const target = heavyTargetForWeek(iso);

  app.append(el('div', { class: 'card' },
    weekStrip(days),
    statRow([
      { n: `${heavyDone.length}/${target}`, l: 'sessies', accent: heavyDone.length >= target },
      { n: weekSets, l: 'sets' },
      { n: weekVol >= 1000 ? (weekVol / 1000).toFixed(1) + 'k' : weekVol, l: 'kg volume' },
    ])));

  // ---------- Check-in ----------
  app.append(checkinCard(iso, ctx));

  // ---------- Advies + sessie ----------
  const adviceBox = el('div');
  const sessionBox = el('div');
  app.append(adviceBox, sessionBox);

  const draw = (cache, icuError) => {
    adviceBox.innerHTML = '';
    sessionBox.innerHTML = '';
    const adv = advise(iso, cache);
    const mins = minutesOn(iso);

    // readiness-score voor de ring (100 = fris)
    const score = { go: 100, lighter: 66, easy: 40, rest: 20 }[adv.level];
    heroRing.innerHTML = '';
    const r = ring(score, { go: 'Top', lighter: 'Oké', easy: 'Laag', rest: 'Rust' }[adv.level], 'readiness');
    r.style.cursor = 'pointer';
    r.setAttribute('role', 'button');
    r.addEventListener('click', () => openReadinessSheet(iso, cache, adv));
    heroRing.append(r);

    const levelPill = {
      go: el('span', { class: 'pill good' }, 'Klaar om te trainen'),
      lighter: el('span', { class: 'pill warn' }, 'Iets lichter'),
      easy: el('span', { class: 'pill danger' }, 'Rustig aan'),
      rest: el('span', { class: 'pill danger' }, 'Herstel eerst'),
    }[adv.level];

    const tired = get().tired[iso];
    const [head, ...rest] = adv.reasons;
    adviceBox.append(el('div', { class: 'card' },
      el('div', { class: `advice ${adv.level}` },
        el('div', { class: 'spread' }, el('h4', { class: 'mb0' }, 'Advies van vandaag'), levelPill),
        el('p', { class: 'mt mb0', style: 'font-size:.92rem' }, head || ''),
        rest.length ? explain(`Waarom (${rest.length})`, rest.map(r => el('p', { class: 'mb0', style: 'margin-bottom:6px' }, '· ' + r))) : null,
        icuError ? el('div', { class: 'mt tiny', style: 'color:var(--warn)' }, `⚠ intervals.icu: ${icuError}`) : null,
        !icu.isConfigured() ? el('div', { class: 'mt tiny dim' }, 'Tip: koppel intervals.icu in Instellingen, dan telt je padel/fiets-belasting automatisch mee.') : null),
      el('div', { class: 'row mt' },
        el('button', { class: 'btn-sm' + (tired === 'moe' ? ' btn-secondary' : ''), onclick: () => { update(s => { s.tired[iso] = tired === 'moe' ? undefined : 'moe'; }); ctx.render(); } }, '😮‍💨 Beetje moe'),
        el('button', { class: 'btn-sm' + (tired === 'kapot' ? ' btn-secondary' : ''), onclick: () => { update(s => { s.tired[iso] = tired === 'kapot' ? undefined : 'kapot'; }); ctx.render(); } }, '🥱 Kapot'))));

    // sessie van vandaag
    const done = logs.some(l => l.date === iso && l.sessionId === adv.session.id);
    const cap = adv.session.type === 'heavy' && mins ? mins : null;
    const slots = buildWorkout(adv.session, adv.adjust, cap);
    const focus = adv.session.focus.map(m => MUSCLE_NL[m] || m).join(' · ');

    sessionBox.append(el('div', { class: 'card cta' },
      el('div', { class: 'spread' },
        el('div', {},
          el('div', { class: 'tiny', style: 'color:var(--accent);font-weight:700;letter-spacing:.09em;text-transform:uppercase' },
            adv.session.type === 'heavy' ? 'Krachtsessie' : adv.session.type === 'snack' ? 'Korte sessie' : 'Rust'),
          el('h3', { class: 'mb0', style: 'margin-top:4px' }, adv.session.name.replace(/^.*·\s*/, ''))),
        adv.session.durationMin ? el('span', { class: 'pill' }, `${cap ? Math.min(cap, adv.session.durationMin) : adv.session.durationMin} min`) : null),
      focus ? el('div', { class: 'tiny dim mt' }, focus) : null,
      slots.trimmedNote ? el('div', { class: 'tiny mt', style: 'color:var(--warn)' }, '⏱ ' + slots.trimmedNote) : null,
      slots.length ? el('ul', { class: 'slotlist mt' },
        slots.map(s => el('li', {},
          el('span', { class: 'grow' }, s.exercise?.nameNL || s.ex),
          el('span', { class: 'scheme' }, `${s.sets}×${s.reps[0]}-${s.reps[1]}`)))) : null,
      slots.length ? el('button', {
        class: 'btn-primary btn-block mt', onclick: () => openWorkout(adv.session, adv.adjust, ctx, cap)
      }, done ? '✓ Al gedaan — nog een keer?' : '▶ Start workout') : null,
      done ? el('div', { class: 'center tiny mt', style: 'color:var(--accent)' }, 'Vandaag al gelogd. Lekker bezig! 💪') : null,
      explain('Over deze sessie',
        el('p', { class: 'mb0' }, adv.session.description),
        adv.session.id !== adv.base.id ? el('p', { class: 'mt mb0' }, `Gepland stond: ${adv.base.name} — die schuift automatisch door.`) : null)));
  };

  draw(get().icuCache);
  if (icu.isConfigured()) {
    icu.refresh().then(cache => draw(cache)).catch(e => draw(get().icuCache, e.message));
  }

  // ---------- Spierkaart ----------
  const vol = weeklyVolume(iso);
  const ms = muscleStatus(iso);
  const notReady = ms.filter(m => !m.ready);
  const levels = {};
  for (const [m, [lo, hi]] of Object.entries(VOLUME_TARGETS)) {
    const v = vol[m] || 0;
    levels[m] = v === 0 ? 0 : v < lo ? 1 : v <= hi ? 2 : 3;
  }
  const bodyCard = el('div', { class: 'card' + (logs.length ? '' : ' ') },
    cardHead(ICO.body, 'Deze week getraind',
      notReady.length ? el('span', { class: 'pill warn' }, `${notReady.length} in herstel`) : el('span', { class: 'pill good' }, 'Alles hersteld')),
    el('div', { class: logs.length ? '' : 'ghost' }, bodyMap(levels)),
    el('div', { class: 'bodylegend' },
      el('span', {}, el('i', { style: 'background:rgba(255,255,255,.05)' }), 'niet'),
      el('span', {}, el('i', { style: 'background:rgba(25,135,117,.45)' }), 'weinig'),
      el('span', {}, el('i', { style: 'background:rgba(56,237,208,.55)' }), 'op doel'),
      el('span', {}, el('i', { style: 'background:rgba(56,237,208,.95)' }), 'veel')),
    !logs.length ? el('div', { class: 'emptyhint mt' }, 'Na je eerste sessie kleurt je lichaam hier in.') : null,
    notReady.length ? explain('Spierherstel',
      el('div', { class: 'row wrap' }, ms.map(m => el('span', { class: 'pill ' + (m.ready ? 'good' : 'warn') },
        `${MUSCLE_NL[m.muscle] || m.muscle}${m.ready ? ' ✓' : ` ${m.hoursLeft}u`}`)))) : null);
  app.append(bodyCard);

  // ---------- Maandcheck ----------
  const lastCheck = S().lastMonthCheck;
  const daysSinceCheck = lastCheck ? Math.round((new Date(iso) - new Date(lastCheck)) / 86400000) : 999;
  if (daysSinceCheck >= 30 && logs.length >= 4) {
    const waistIn = el('input', { type: 'number', step: '0.5', inputmode: 'decimal', placeholder: 'taille (cm)', style: 'width:130px' });
    app.append(el('div', { class: 'card', style: 'border-color:rgba(224,195,122,.35)' },
      cardHead(ICO.scale, 'Maandcheck'),
      el('p', { class: 'tiny dim' }, 'Voortgangsfoto (zelfde licht/hoek), taille op de navel, en een paar ochtenden wegen. De weegschaal alleen liegt.'),
      el('div', { class: 'row' }, waistIn,
        el('button', { class: 'btn-sm btn-secondary', onclick: () => {
          const waist = parseFloat(waistIn.value);
          update(s => {
            s.settings.lastMonthCheck = iso;
            if (waist && waist > 40 && waist < 200) s.measurements[iso] = { ...(s.measurements[iso] || {}), waist };
          });
          toast('Maandcheck opgeslagen'); ctx.render();
        } }, '✓ Gedaan'))));
  }

  // ---------- Snel iets anders ----------
  app.append(el('div', { class: 'card' },
    cardHead(ICO.bolt, 'Iets anders doen?',
      el('button', { class: 'btn-sm', onclick: () => openAdhocPicker(ctx) }, '+ Vrij')),
    el('div', { class: 'row wrap' },
      el('button', { class: 'btn-sm', style: 'border-color:rgba(224,122,122,.4)', onclick: () => {
        update(st => { st.swaps[iso] = 'rest'; }); ctx.render();
      } }, '🚫 Kan niet'),
      Object.values(SESSIONS).filter(s => s.id !== 'rest').map(s =>
        el('button', { class: 'btn-sm', onclick: () => { update(st => { st.swaps[iso] = s.id; }); ctx.render(); } }, s.name.split('·')[1]?.trim() || s.name)),
      get().swaps[iso] ? el('button', { class: 'btn-sm btn-ghost', style: 'color:var(--accent)', onclick: () => { update(st => { delete st.swaps[iso]; }); ctx.render(); } }, '↺ Automatisch') : null),
    explain('Hoe werkt dit?', el('p', { class: 'mb0' },
      'Sla je een zware sessie over, dan verdwijnt die niet: de wachtrij schuift op naar de eerstvolgende dag waarop je genoeg tijd hebt én je spieren hersteld zijn. Een vrije workout telt gewoon mee in je volume en herstel.'))));

  // ---------- Dagelijks ----------
  const habits = get().habits[iso] || {};
  const activeHabits = DAILY_HABITS.filter(h => h.id !== 'hang' || S().dailyHang || S().hasPullUpBar);
  app.append(el('div', { class: 'card' },
    cardHead(ICO.check, 'Dagelijks'),
    activeHabits.map(h => {
      let detail = h.detail;
      if (h.id === 'protein') {
        const p = proteinTarget(get().icuCache);
        detail = `Doel: ±${p.grams} g eiwit vandaag (2 g/kg bij ${Math.round(p.kg)} kg), verdeeld over 3-5 momenten.`;
      }
      return el('div', { class: 'habit' },
        el('input', { type: 'checkbox', checked: !!habits[h.id], onchange: e => setHabit(iso, h.id, e.target.checked) }),
        el('div', {}, el('div', {}, h.name), el('div', { class: 'tiny dim' }, detail)));
    })));

  // ---------- Recente activiteiten ----------
  const actBox = el('div');
  app.append(actBox);
  const drawActs = (cache) => {
    actBox.innerHTML = '';
    const recent = (cache?.activities || []).slice(0, 5);
    if (!recent.length) return;
    actBox.append(el('div', { class: 'card' },
      cardHead(ICO.heart, 'Recente activiteiten',
        el('span', { class: 'pill' }, 'intervals.icu')),
      recent.map(a => el('div', { class: 'exrow', onclick: () => openDaySheet((a.start_date_local || '').slice(0, 10), ctx) },
        el('div', { class: 'grow' },
          el('div', { style: 'font-size:.9rem' }, `${icu.TYPE_NL[a.type] || a.type || '?'} · ${a.name || ''}`.slice(0, 40)),
          el('div', { class: 'mus' }, `${(a.start_date_local || '').slice(5, 10)} · ${Math.round((a.moving_time || 0) / 60)} min · load ${Math.round(a.icu_training_load || 0)}`)),
        el('span', { class: 'dim' }, '›')))));
  };
  drawActs(get().icuCache);
  if (icu.isConfigured()) icu.refresh().then(drawActs).catch(() => {});
}

/** "Waar is dit op gebaseerd?" — alle signalen achter de readiness-score. */
function openReadinessSheet(iso, cache, adv) {
  const sig = readinessSignals(iso, cache);
  const LEVEL = {
    go: ['Klaar om te trainen', 'Alle signalen staan op groen — pak je sessie voluit.'],
    lighter: ['Iets lichter vandaag', 'Er zijn signalen die om ontzien vragen. De app haalt sets weg en houdt je verder van spierfalen.'],
    easy: ['Rustig aan', 'Te veel belasting of te weinig herstel: vandaag alleen een korte sessie, de zware schuift op.'],
    rest: ['Herstel eerst', 'Je lichaam vraagt om rust. Bewegen mag, prikkelen niet.'],
  }[adv.level];

  const box = el('div', {},
    el('h3', {}, 'Readiness'),
    el('div', { class: 'spread', style: 'margin-bottom:10px' },
      el('span', { style: 'font-weight:600' }, LEVEL[0]),
      el('span', { class: 'pill ' + ({ go: 'good', lighter: 'warn', easy: 'danger', rest: 'danger' })[adv.level] }, { go: 'Top', lighter: 'Oké', easy: 'Laag', rest: 'Rust' }[adv.level])),
    el('p', { class: 'tiny dim' }, LEVEL[1]),
    el('h5', { class: 'mt' }, 'Waar dit op gebaseerd is'));

  const DOT = { good: 'var(--accent)', warn: 'var(--warn)', bad: 'var(--danger)', none: 'var(--text-faint)' };
  for (const s of sig) {
    box.append(el('div', { style: 'padding:10px 0;border-bottom:1px solid var(--border)' },
      el('div', { class: 'spread' },
        el('span', { class: 'row', style: 'gap:8px' },
          el('i', { style: `width:8px;height:8px;border-radius:3px;background:${DOT[s.state]};display:inline-block;flex:none` }),
          el('span', { style: 'font-size:.9rem;font-weight:550' }, s.label)),
        el('span', { class: 'tiny', style: `color:${s.state === 'none' ? 'var(--text-faint)' : 'var(--text)'};text-align:right` }, s.value)),
      s.note ? el('div', { class: 'tiny dim', style: 'margin-top:3px;padding-left:16px' }, s.note) : null));
  }

  box.append(el('h5', { class: 'mt' }, 'Wat de app hiermee doet'));
  box.append(el('div', { class: 'tiny dim' }, adv.reasons.map(r => el('p', { class: 'mb0', style: 'margin-bottom:6px' }, '· ' + r))));
  sheet(box);
}

/** Dagdetail: wat is er gebeurd (verleden) of wat staat er gepland (toekomst). */
function openDaySheet(iso, ctx) {
  const today = todayISO();
  if (iso >= today) return openDayPicker(iso, () => ctx.render());

  const logs = get().logs.filter(l => l.date === iso);
  const acts = icu.activitiesOn(get().icuCache, iso);
  const ci = get().checkins?.[iso];
  const box = el('div', {}, el('h3', {}, fmtDate(iso)));

  if (!logs.length && !acts.length) {
    box.append(el('p', { class: 'dim' }, 'Deze dag is niets gelogd. Geen ramp — de wachtrij heeft je sessies vanzelf doorgeschoven.'));
  }
  for (const l of logs) {
    const doneSets = l.sets.filter(s => s.done);
    const tonnage = Math.round(doneSets.reduce((t, s) => t + (s.weight || 0) * (s.reps || 0), 0));
    const rirs = doneSets.map(s => s.rir).filter(r => r != null);
    box.append(el('div', { class: 'card raised' },
      el('h4', {}, SESSIONS[l.sessionId]?.name || 'Workout'),
      statRow([
        { n: doneSets.length, l: 'sets' },
        { n: Math.round(l.durationSec / 60), l: 'minuten' },
        { n: tonnage ? (tonnage >= 1000 ? (tonnage / 1000).toFixed(1) + 'k' : tonnage) : '—', l: 'kg volume' },
      ]),
      rirs.length ? el('div', { class: 'tiny dim mt' }, `Gemiddelde RIR: ${(rirs.reduce((t, r) => t + r, 0) / rirs.length).toFixed(1)}${l.feel ? ` · gevoel ${l.feel}/5` : ''}`) : null,
      l.note ? el('p', { class: 'tiny mt mb0', style: 'color:var(--primary)' }, '📝 ' + l.note) : null,
      el('div', { class: 'mt' }, [...new Set(doneSets.map(s => s.ex))].map(exId => {
        const ss = doneSets.filter(s => s.ex === exId);
        return el('div', { class: 'spread', style: 'padding:5px 0;border-bottom:1px solid var(--border)' },
          el('span', { style: 'font-size:.88rem' }, byIdName(exId)),
          el('span', { class: 'tiny', style: 'color:var(--primary)' }, ss.map(s => `${s.reps}${s.weight ? '×' + s.weight : ''}`).join(' · ')));
      }))));
  }
  if (acts.length) {
    box.append(el('h5', { class: 'mt' }, 'Andere sport (intervals.icu)'));
    for (const a of acts) {
      const load = Math.round(a.icu_training_load || 0);
      const min = Math.round((a.moving_time || a.elapsed_time || 0) / 60);
      const hard = load >= 70 || min >= 90;
      box.append(el('div', { class: 'spread', style: 'padding:7px 0;border-bottom:1px solid var(--border)' },
        el('span', {},
          el('span', { style: 'margin-right:6px' }, icu.TYPE_ICON[a.type] || icu.TYPE_ICON._),
          `${icu.TYPE_NL[a.type] || a.type} · ${a.name || ''}`.slice(0, 34)),
        el('span', { class: 'tiny' },
          el('span', { class: 'dim' }, `${min} min · load ${load} · `),
          el('span', { style: `color:${hard ? 'var(--accent)' : 'var(--text-faint)'}` }, hard ? 'stevig' : 'licht'))));
    }
  }
  if (ci) {
    box.append(el('div', { class: 'tiny dim mt' },
      `Check-in die dag: motivatie ${ci.motivation ?? '–'}/5, slaap ${ci.sleepScore ?? '–'}/5`));
  }
  sheet(box);
}

function byIdName(exId) {
  return (EXERCISES.find(e => e.id === exId) || {}).nameNL || exId;
}

/** Dagelijkse check-in: motivatie, slaap (fallback), spierpijn per spiergroep. */
function checkinCard(iso, ctx) {
  const existing = get().checkins?.[iso];
  const card = el('div', { class: 'card' });

  if (existing) {
    const soreList = Object.entries(existing.soreness || {}).filter(([, v]) => v)
      .map(([m, v]) => `${MUSCLE_NL[m] || m}${v === 2 ? ' 🔥' : ''}`);
    card.append(el('div', { class: 'spread' },
      el('div', { class: 'row', style: 'gap:10px' },
        (() => { const b = el('span', { class: 'badge-ico', style: 'color:var(--accent)' }); b.innerHTML = ICO.check; return b; })(),
        el('div', {},
          el('div', { style: 'font-weight:600' }, 'Check-in gedaan'),
          el('div', { class: 'tiny dim' },
            `Motivatie ${existing.motivation ?? '–'}/5 · slaap ${existing.sleepScore ?? '–'}/5` +
            (soreList.length ? ` · ${soreList.join(', ')}` : ' · geen spierpijn')))),
      el('button', { class: 'btn-sm btn-ghost', onclick: () => { update(s => { delete s.checkins[iso]; }); ctx.render(); } }, 'Aanpassen')));
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
      const next = ((state.soreness[m] || 0) + 1) % 3;
      state.soreness[m] = next;
      pill.className = 'pill ' + (next === 1 ? 'warn' : next === 2 ? 'danger' : '');
      pill.textContent = MUSCLE_NL[m] + (next === 1 ? ' 😖' : next === 2 ? ' 🔥' : '');
    });
    soreRow.append(pill);
  }

  card.append(
    cardHead(ICO.sun, 'Check-in', el('span', { class: 'pill' }, '15 sec')),
    el('label', {}, 'Motivatie om te trainen'), scaleRow('motivation'),
    el('label', {}, 'Hoe heb je geslapen?'), scaleRow('sleepScore'),
    el('label', {}, 'Spierpijn? Tik aan (nog eens = erger)'), soreRow,
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
