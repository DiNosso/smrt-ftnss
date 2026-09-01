// Vandaag: hero + readiness-ring, weekstrip, advies, sessie, spierkaart, gewoontes

import { el, fmtDate, toast, sheet, DAY_NL, ring, statRow, cardHead, explain, weekStrip, bodyMap, ICO } from './common.js';
import { get, S, update, todayISO, addDays, exportData, STORAGE_KEY } from '../state.js';
import { daysSince, storageInfo, backupName } from '../backup.js';
import * as icu from '../icu.js';
import {
  advise, buildWorkout, mesoInfo, muscleStatus, weekStreak, adhocSession,
  mondayOf, minutesOn, heavyTargetForWeek, weeklyVolume, VOLUME_TARGETS, plannedOn, readinessSignals, plannedSplitOn,
  sportDay, plannedSession, detectPlateaus,
} from '../engine.js';
import { SESSIONS } from '../data/program.js';
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
      el('h1', { class: 'brandline' },
        el('img', { src: 'assets/icons/mark.svg', alt: '', class: 'brandmark', width: 30, height: 30 }),
        'SMRT.FTNSS'),
      el('div', {},
        el('span', { class: 'pill' }, `Week ${meso.week}`),
        el('span', { class: 'pill' + (meso.isDeload ? ' warn' : '') }, meso.isDeload ? 'Deload' : `Blok ${meso.pos + 1}/4`),
        weekStreak() >= 1 ? el('span', { class: 'pill good' }, `🔥 ${weekStreak()}`) : null)),
    heroRing));
  app.append(syncBar(ctx));

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
  // Check-in alleen tonen op dagen dat je traint — op een sport- of rustdag
  // voegt hij niets toe.
  if (!sportDay(iso) && plannedSession(iso)?.id !== 'rest') app.append(checkinCard(iso, ctx));

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
        el('button', { class: 'btn-sm', onclick: () => { update(st => { st.swaps[iso] = s.id; }); ctx.render(); } }, s.short || s.name.split('·')[1]?.trim() || s.name)),
      get().swaps[iso] ? el('button', { class: 'btn-sm btn-ghost', style: 'color:var(--accent)', onclick: () => { update(st => { delete st.swaps[iso]; }); ctx.render(); } }, '↺ Automatisch') : null),
    explain('Hoe werkt dit?', el('p', { class: 'mb0' },
      'Sla je een zware sessie over, dan verdwijnt die niet: de wachtrij schuift op naar de eerstvolgende dag waarop je genoeg tijd hebt én je spieren hersteld zijn. Een vrije workout telt gewoon mee in je volume en herstel.'))));

  // ---------- Backup ----------
  // Alles staat lokaal. Zonder geëxporteerd bestand ben je alles kwijt bij een
  // nieuwe telefoon of als je websitegegevens wist.
  const dagen = daysSince(S().lastBackupAt);
  const opslag = storageInfo(STORAGE_KEY);
  const heeftLogs = get().logs.length > 0;
  if (heeftLogs && (dagen === null || dagen > 21 || opslag.krap)) {
    app.append(el('div', { class: 'card', style: 'border-color:var(--warn)' },
      cardHead(ICO.scale, opslag.krap ? 'Je opslag raakt vol' : 'Maak een backup'),
      el('p', { class: 'tiny dim' }, opslag.krap
        ? `De app gebruikt ${(opslag.bytes / 1024).toFixed(0)} kB van de ~5 MB die een website mag opslaan. Exporteer een backup en overweeg oude logs op te ruimen.`
        : dagen === null
          ? `Je hebt ${get().logs.length} workouts gelogd en nog nooit een backup gemaakt. Alles staat alleen op dit toestel.`
          : `Laatste backup was ${dagen} dagen geleden. Sindsdien is er weer getraind.`),
      el('button', { class: 'btn-primary btn-block', onclick: () => doeBackup(ctx) }, '⬇ Backup maken'),
      explain('Waarom is dit nodig?', el('p', { class: 'mb0' },
        'De app bewaart een stille reservekopie op je toestel, en zet die automatisch terug als de opslag wordt opgeruimd. '
        + 'Maar dat helpt niet bij een nieuwe telefoon, of als je in Safari je websitegegevens wist — dan gaat ook die kopie mee. '
        + 'Alleen een geëxporteerd bestand overleeft dat.'))));
  }

  // ---------- Onafgemaakte training ----------
  const bezig = get().activeWorkout;
  if (bezig && (Date.now() - bezig.savedAt) < 6 * 3600 * 1000 && bezig.sets?.some(x => x.done)) {
    const sess = SESSIONS[bezig.sessionId];
    const af = bezig.sets.filter(x => x.done).length;
    app.append(el('div', { class: 'card', style: 'border-color:var(--accent)' },
      cardHead(ICO.bolt, 'Training nog bezig'),
      el('p', { class: 'tiny dim' }, `${sess?.name || 'Workout'} — ${af} van de ${bezig.sets.length} sets ingevuld.`),
      el('div', { class: 'row' },
        el('button', { class: 'btn-primary grow', onclick: () => openWorkout(sess, bezig.adjust, ctx, bezig.timeCap) }, '▶ Hervatten'),
        el('button', { class: 'btn-sm', onclick: () => {
          if (confirm('Deze training weggooien? De ingevulde sets verdwijnen dan definitief.')) {
            update(st => { st.activeWorkout = null; }); ctx.render();
          }
        } }, 'Weggooien'))));
  }

  // ---------- Plateaus ----------
  // Stond eerst alleen op Progressie; je moest er zelf naar gaan zoeken.
  const plateaus = detectPlateaus();
  if (plateaus.length) {
    app.append(el('div', { class: 'card', style: 'border-color:var(--warn)' },
      cardHead(ICO.chart, plateaus.length === 1 ? 'Eén oefening loopt vast' : `${plateaus.length} oefeningen lopen vast`),
      plateaus.slice(0, 3).map(p => el('div', { style: 'padding:6px 0;border-bottom:1px solid var(--border)' },
        el('div', {}, p.exercise?.nameNL || p.ex),
        el('div', { class: 'tiny dim' }, `Geen progressie sinds ${fmtDate(p.since).replace(/ \d{4}$/, '')}`))),
      explain('Wat kun je doen?', el('p', { class: 'mb0' },
        'Drie sessies zonder vooruitgang betekent meestal niet dat je te weinig je best doet. '
        + 'Probeer een variant of een andere hoek, maak het zwaarder met tempo (3 seconden laten zakken) '
        + 'in plaats van meer kilo\'s, of neem in de eerstvolgende deloadweek bewust gas terug en bouw opnieuw op.'))));
  }

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
      recent.map(a => el('div', { class: 'exrow', onclick: () => openActivity(a) },
        el('span', { style: 'font-size:1.15rem;margin-right:9px' }, icu.TYPE_ICON[a.type] || icu.TYPE_ICON._),
        el('div', { class: 'grow' },
          el('div', { style: 'font-size:.9rem' }, `${a.name || icu.TYPE_NL[a.type] || a.type || '?'}`.slice(0, 34)),
          el('div', { class: 'mus' }, icu.actSummary(a))),
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

/** Zichtbare syncregel: wanneer voor het laatst opgehaald + knop om te verversen. */
function syncBar(ctx) {
  const bar = el('div', { class: 'syncbar' });
  const draw = (busy = false, err = null) => {
    bar.innerHTML = '';
    const last = S().lastSyncAt;
    const txt = err ? err
      : busy ? 'Bezig met ophalen…'
      : !icu.isConfigured() ? 'intervals.icu niet gekoppeld'
      : last ? `Bijgewerkt ${agoText(last)}`
      : 'Nog niet opgehaald';
    bar.append(
      el('span', { class: 'tiny' + (err ? ' bad' : ' dim') }, txt),
      el('button', {
        class: 'btn-sm' + (busy ? ' busy' : ''),
        disabled: busy,
        onclick: () => doSync(),
      }, busy ? '⟳ Bezig…' : '⟳ Sync'));
  };
  const doSync = async () => {
    if (!icu.isConfigured()) return toast('Vul eerst je intervals.icu-key in bij Instellingen');
    draw(true);
    try {
      await icu.refresh(true);
      update(st => { st.settings.lastSyncAt = new Date().toISOString(); });
      toast('Gegevens bijgewerkt');
      ctx.render();
    } catch (e) {
      draw(false, 'Ophalen mislukt — ' + (e?.message || 'geen verbinding'));
    }
  };
  draw();
  enablePullToRefresh(doSync);
  return bar;
}

function agoText(iso) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'zojuist';
  if (min < 60) return `${min} min geleden`;
  const u = Math.round(min / 60);
  if (u < 24) return `${u} uur geleden`;
  return `${Math.round(u / 24)} dag(en) geleden`;
}

/** Naar beneden trekken bovenaan de pagina = verversen. */
function enablePullToRefresh(onRefresh) {
  if (document.body.dataset.ptr) return;   // maar één keer koppelen
  document.body.dataset.ptr = '1';
  const ind = el('div', { class: 'ptr' }, '⟳ Loslaten om te verversen');
  document.body.append(ind);
  let startY = null, pulling = false;
  // Alleen op het startscherm. Tijdens een training mag dit nooit afgaan:
  // een herteken gooit je lopende sets van het scherm.
  const opStartscherm = () => !!document.querySelector('.syncbar') && !document.querySelector('.player-head');
  addEventListener('touchstart', e => {
    startY = (opStartscherm() && (document.scrollingElement?.scrollTop || 0) <= 0) ? e.touches[0].clientY : null;
  }, { passive: true });
  addEventListener('touchmove', e => {
    if (startY == null) return;
    const d = e.touches[0].clientY - startY;
    if (d > 12) { pulling = true; ind.style.transform = `translateY(${Math.min(d * .5, 64)}px)`; ind.classList.add('on'); }
  }, { passive: true });
  addEventListener('touchend', () => {
    if (pulling && opStartscherm()) { ind.classList.remove('on'); ind.style.transform = ''; onRefresh(); }
    else { ind.classList.remove('on'); ind.style.transform = ''; }
    startY = null; pulling = false;
  });
}

/** Detail van één intervals.icu-activiteit. */
function openActivity(a) {
  const rows = icu.actDetails(a);
  sheet(el('div', {},
    el('h3', {}, `${icu.TYPE_ICON[a.type] || ''} ${a.name || icu.TYPE_NL[a.type] || a.type}`),
    el('div', { class: 'tiny dim' }, fmtDate((a.start_date_local || '').slice(0, 10))
      + ((a.start_date_local || '').slice(11, 16) ? ` · ${a.start_date_local.slice(11, 16)}` : '')),
    rows.big.length ? statRow(rows.big) : null,
    el('div', { class: 'card raised mt' }, rows.list.map(([k, v]) =>
      el('div', { class: 'spread', style: 'padding:7px 0;border-bottom:1px solid var(--border)' },
        el('span', { class: 'tiny dim' }, k),
        el('span', { style: 'font-size:.9rem' }, v)))),
    a.description ? el('p', { class: 'tiny mt' }, a.description) : null));
}

/** Backup exporteren naar een bestand. */
export function doeBackup(ctx) {
  try {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: backupName() });
    document.body.append(a); a.click(); a.remove();
    update(s => { s.settings.lastBackupAt = todayISO(); });
    toast('Backup opgeslagen — bewaar hem ergens buiten je telefoon');
    ctx?.render?.();
  } catch (e) {
    toast('Backup mislukt: ' + (e?.message || e));
  }
}
