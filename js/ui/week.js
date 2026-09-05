// Weekoverzicht: wachtrij-planning (vooruit gesimuleerd) + gedane workouts + intervals.icu

import { el, DAY_NL, sheet, toast, fmtDate, explain, cardHead, ICO } from './common.js';
import { get, update, todayISO, addDays } from '../state.js';
import { schedule, mondayOf, mesoInfo, plannedOn, SPORT_CHOICES, fixedSportsOn, plannedSession, applyVariant, variantOn, VARIANT_NL, intentOn, setIntent, rotationInfo } from '../engine.js';
import { SESSIONS } from '../data/program.js';
import * as icu from '../icu.js';

export function renderWeek(app, ctx) {
  const today = todayISO();

  const draw = (offsetWeeks = 0) => {
    app.innerHTML = '';
    const mon = addDays(mondayOf(today), offsetWeeks * 7);
    const meso = mesoInfo(mon);

    app.append(el('div', { class: 'hero' },
      el('div', { class: 'spread' },
        el('button', { class: 'btn-sm btn-ghost', onclick: () => draw(offsetWeeks - 1) }, '‹'),
        el('h2', { class: 'mb0' }, `Week ${meso.week}`),
        el('button', { class: 'btn-sm btn-ghost', onclick: () => draw(offsetWeeks + 1) }, '›')),
      el('div', { class: 'center mt' },
        el('span', { class: 'pill' + (meso.isDeload ? ' warn' : '') }, meso.isDeload ? 'Deloadweek' : `Blokweek ${meso.pos + 1}/4`))));

    const cache = get().icuCache;
    // toekomst-simulatie vanaf vandaag t/m einde getoonde week
    const weekEnd = addDays(mon, 6);
    const sim = weekEnd >= today ? schedule(weekEnd, today) : [];
    const simByIso = Object.fromEntries(sim.map(d => [d.iso, d]));

    const card = el('div', { class: 'card' });
    for (let i = 0; i < 7; i++) {
      const iso = addDays(mon, i);
      const logs = get().logs.filter(l => l.date === iso);
      const acts = icu.activitiesOn(cache, iso);
      const isToday = iso === today;
      const d = new Date(iso + 'T12:00:00');

      let title, sub = '', badge = '';
      if (iso < today) {
        // verleden: wat is er echt gebeurd
        if (logs.length) {
          title = logs.map(l => SESSIONS[l.sessionId]?.name || 'Workout').join(' + ');
          badge = '✅';
        } else {
          title = el('span', { class: 'dim' }, '— geen training gelogd');
        }
      } else {
        const day = simByIso[iso];
        const session = applyVariant(SESSIONS[day?.sessionId] || SESSIONS.rest, variantOn(iso));
        title = session.name;
        sub = session.durationMin ? `± ${session.durationMin} min` : 'herstel';
        if (day?.reason) sub += ` · ${day.reason}`;
        if (logs.length) badge = '✅';
      }
      const actLine = acts.length ? acts.map(a => icu.TYPE_NL[a.type] || a.type).join(', ') : null;
      const planned = iso >= today ? plannedOn(iso) : [];
      const planLine = planned.length
        ? planned.map(p => `${icu.TYPE_NL[p.type] || p.type}${p.hard ? ' (stevig)' : ''}`).join(', ')
        : null;

      const rowEl = el('div', { class: 'weekday' + (isToday ? ' today' : ''), style: iso >= today ? 'cursor:pointer' : '' },
        el('div', { class: 'd' }, el('div', { class: 'nm' }, DAY_NL[i]), el('div', { class: 'no' }, d.getDate())),
        el('div', { class: 'what' },
          el('div', { class: 't' }, title),
          el('div', { class: 'tiny dim' }, sub, actLine ? `${sub ? ' · ' : ''}🏃 ${actLine}` : ''),
          planLine ? el('div', { class: 'tiny', style: 'color:var(--warn)' }, `📅 ${planLine}`) : null,
          logs.length ? el('div', { class: 'tiny', style: 'color:var(--accent)' }, logs.map(l => `${l.sets.filter(s => s.done).length} sets gelogd`).join(' · ')) : null),
        el('div', { class: 'badge' }, badge, iso >= today ? el('span', { class: 'dim', style: 'margin-left:6px' }, '›') : ''));
      if (iso >= today) rowEl.addEventListener('click', () => openDayPicker(iso, () => draw(offsetWeeks)));
      card.append(rowEl);
    }
    app.append(card);

    app.append(el('div', { class: 'card' },
      explain('Hoe deze planning werkt',
      el('p', { class: 'mb0' },
        'Geen vaste dagen: de app werkt met een wachtrij (A → B → C). Mis je een sessie, dan schuift alles automatisch op — met bewaking van spierherstel (±48 uur per spiergroep) en een doel van 3 zware sessies per week. ' +
        'Elke 4 opbouwweken bouwt het volume op van rustig (MEV) naar piek (MRV), gevolgd door een deloadweek. Bij aanhoudend slechte vorm of slaap komt de deload eerder. Zware sessies landen alleen op dagen waarop je 40+ minuten hebt ingepland (zie Instellingen).'))));

    // Blokrotatie: welke accessoires nu, en wat er volgend blok verandert.
    const rot = rotationInfo(mon);
    app.append(el('div', { class: 'card' },
      cardHead(ICO.bolt, `Blok ${rot.block} — oefeningen van dit blok`),
      el('p', { class: 'tiny dim' }, 'De compounds (bank, row, press) blijven elk blok staan; de accessoires wisselen na elke deload. Vier weken op dezelfde oefening is wat je nodig hebt om zwaarder te worden — daarna is het menu weer nieuw.'),
      rot.sessions.map(({ session, rows }) => el('div', { class: 'mt' },
        el('h5', { class: 'mb0' }, session.short || session.name),
        el('div', { class: 'tiny dim', style: 'display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;margin-top:4px' },
          el('span', { style: 'font-weight:600' }, 'nu'), el('span', { style: 'font-weight:600' }, 'volgend blok'),
          rows.flatMap(r => [el('span', {}, r.now), el('span', { style: r.now !== r.next ? 'color:var(--primary)' : '' }, r.next)]))))));
  };

  draw(0);
  if (icu.isConfigured()) icu.refresh().then(() => draw(0)).catch(() => {});
}

/** Dag aanpassen: andere sport plannen, kan niet (rustdag), specifieke sessie, of automatisch. */
export function openDayPicker(iso, redraw) {
  const swap = get().swaps[iso];
  const intent = intentOn(iso);
  const fixed = fixedSportsOn(iso);
  const manual = (get().plannedSports || {})[iso] || [];
  const fromIcu = icu.plannedEventsOn(get().icuCache, iso);
  const hasSport = fixed.length + manual.length + fromIcu.length > 0;
  const planned = plannedSession(iso);
  const plannedSess = planned?.session ? applyVariant(planned.session, variantOn(iso)) : null;
  const sessName = plannedSess ? (plannedSess.type === 'rest' ? null : plannedSess.name.replace(/^.*·\s*/, '')) : null;
  const sportNames = [...fixed, ...manual].map(p => `${icu.TYPE_ICON[p.type] || ''} ${icu.TYPE_NL[p.type] || p.type}`).concat(fromIcu.map(p => `📅 ${p.name}`));

  // Kop: wat staat er nu op deze dag? Dat bepaalt wat je waarschijnlijk wilt doen.
  const samenvatting = [
    sportNames.length ? sportNames.join(', ') : null,
    sessName ? `🏋 ${sessName}` : (hasSport ? null : 'rustdag'),
  ].filter(Boolean).join('  ·  ');
  const box = el('div', {},
    el('h3', {}, fmtDate(iso)),
    el('p', { class: 'tiny', style: 'color:var(--primary)' }, samenvatting || 'Niets gepland'));
  const close = sheet(box);
  const done = (msg) => { close(); toast(msg); redraw(); };

  // ---------- sectie: geplande sport (eerst, als die er is) ----------
  const sportSectie = el('div');
  for (const f of fixed) {
    sportSectie.append(el('div', { class: 'card raised' },
      el('div', { class: 'spread' },
        el('span', {}, `${icu.TYPE_ICON[f.type] || ''} ${icu.TYPE_NL[f.type] || f.type}`),
        el('span', { class: 'pill' }, 'vaste dag')),
      el('div', { class: 'row mt' },
        el('button', { class: 'btn-sm grow', onclick: () => {
          update(st => { st.sportSkips[iso] = true; });
          done(`${icu.TYPE_NL[f.type] || f.type} gaat niet door — schema aangepast`);
        } }, 'Gaat niet door'),
        el('button', { class: 'btn-sm grow', onclick: () => openMoveSport(iso, f, done) }, 'Verzetten →'))));
  }
  for (const [idx, p] of manual.entries()) {
    sportSectie.append(el('div', { class: 'card raised' },
      el('div', { class: 'spread' },
        el('span', {}, `${icu.TYPE_ICON[p.type] || ''} ${icu.TYPE_NL[p.type] || p.type}`),
        el('button', { class: 'btn-sm btn-ghost', style: 'color:var(--danger)', onclick: () => {
          update(st => { st.plannedSports[iso].splice(idx, 1); if (!st.plannedSports[iso].length) delete st.plannedSports[iso]; });
          done('Sport verwijderd — schema aangepast');
        } }, '✕ Gaat niet door'))));
  }
  for (const p of fromIcu) {
    sportSectie.append(el('div', { class: 'tiny dim', style: 'padding:4px 0' }, `📅 ${p.name} — uit je intervals.icu-kalender`));
  }
  if (get().sportSkips?.[iso]) {
    sportSectie.append(el('div', { class: 'spread', style: 'padding:6px 0' },
      el('span', { class: 'tiny dim' }, 'Vaste sport staat uit voor deze dag'),
      el('button', { class: 'btn-sm btn-ghost', style: 'color:var(--accent)', onclick: () => {
        update(st => { delete st.sportSkips[iso]; });
        done('Vaste sport weer aan');
      } }, '↺ Terugzetten')));
  }

  // ---------- sectie: krachttraining (kort / volledig / niet) ----------
  const krachtSectie = el('div');
  const kies = (val, msg) => { setIntent(iso, val); done(msg); };
  const opt = (val, icon, label, sub) => el('button', {
    class: 'btn-block mt choice' + (intent === val ? ' on' : ''),
    onclick: () => kies(val, val ? 'Schema aangepast' : 'Terug naar automatische planning'),
  }, el('div', {}, `${icon} ${label}`), el('div', { class: 'tiny dim', style: 'font-weight:400;white-space:normal' }, sub));
  if (sessName) {
    krachtSectie.append(el('div', { class: 'tiny dim', style: 'margin-bottom:4px' },
      `Gepland: ${sessName}${planned.reason ? ` · ${planned.reason}` : ''}`));
  }
  krachtSectie.append(
    opt('full', '💪', 'Volledige sessie', '± 50 min · alles erin. De planner kiest A of B.'),
    opt('short', '⚡', 'Korte sessie', '± 35 min · alleen de compounds. Telt mee voor je weekdoel.'),
    opt('none', '🚫', hasSport ? 'Geen kracht deze dag' : 'Rustdag', 'De sessie schuift naar de eerstvolgende vrije dag.'));
  if (plannedSess?.type === 'heavy') {
    krachtSectie.append(el('button', { class: 'btn-block mt btn-ghost', onclick: () => openMoveSession(iso, plannedSess, done) }, '↷ Verplaatsen naar een andere dag'));
  }
  if (intent || swap || variantOn(iso)) {
    krachtSectie.append(el('button', { class: 'btn-block mt btn-ghost', style: 'color:var(--accent)', onclick: () => {
      update(st => { delete st.variants[iso]; });
      kies(null, 'Terug naar automatische planning');
    } }, '↺ Automatische planning'));
  }

  // ---------- sectie: sport toevoegen ----------
  const sportRow = el('div', { class: 'row wrap' }, SPORT_CHOICES.map(c =>
    el('button', { class: 'btn-sm', onclick: () => {
      update(st => {
        st.plannedSports[iso] = st.plannedSports[iso] || [];
        st.plannedSports[iso].push({ type: c.type, hard: true });
        delete st.sportSkips[iso];
      });
      done('Sport ingepland — kracht schuift op');
    } }, c.label)));

  // Volgorde hangt af van de dag: sportdag → sport eerst; anders kracht eerst en sport-plannen ingeklapt.
  if (hasSport) {
    box.append(el('h5', { class: 'mt' }, 'Je sport deze dag'), sportSectie,
      el('h5', { class: 'mt' }, sessName ? 'Krachttraining erbij' : 'Toch ook krachttraining?'),
      el('p', { class: 'tiny dim' }, sessName ? 'De planner heeft hier al een sessie naast gezet.' : 'Standaard plant de app geen kracht op een sportdag. Wil je toch, kies dan kort of volledig.'),
      krachtSectie,
      explain('Nog een sport plannen', sportRow));
  } else {
    box.append(el('h5', { class: 'mt' }, 'Krachttraining'), krachtSectie,
      el('p', { class: 'tiny dim mt' }, 'De rest van de week schuift vanzelf mee met je keuze.'),
      explain('Sport plannen op deze dag', el('p', { class: 'tiny dim' }, 'Op een sportdag plant de app geen krachtsessie; die schuift door.'), sportRow));
  }
}

/** Krachtsessie naar een andere dag verplaatsen (bijv. vrijdag → zaterdag). */
function openMoveSession(iso, session, done) {
  const box = el('div', {},
    el('h3', {}, `${session.name.replace(/^.*·\s*/, '')} verplaatsen`),
    el('p', { class: 'tiny dim' }, 'Naar welke dag? De oude dag wordt een rustdag; de rest van de week schuift vanzelf mee.'));
  const close2 = sheet(box);
  const today = todayISO();
  const dayName = d => DAY_NL[(new Date(d + 'T12:00:00').getDay() + 6) % 7];
  const order = [1, 2, 3, -1, -2, -3]; // eerst vooruit, dan terug
  for (const off of order) {
    const d = addDays(iso, off);
    if (d < today) continue;
    const sports = plannedOn(d);
    const busy = sports.length ? ` · ${sports.map(p => icu.TYPE_NL[p.type] || p.type).join(', ').toLowerCase()}` : '';
    box.append(el('button', { class: 'btn-block mt', onclick: () => {
      setIntent(iso, 'none'); setIntent(d, session.variant === 'express' ? 'short' : 'full');
      close2(); done(`Verplaatst naar ${dayName(d)}`);
    } }, `${fmtDate(d).replace(/ \d{4}$/, '')}${busy}`));
  }
}

/** Vaste sport naar een andere dag deze week verplaatsen. */
function openMoveSport(iso, f, done) {
  const mon = mondayOf(iso);
  const box = el('div', {},
    el('h3', {}, `${icu.TYPE_NL[f.type] || f.type} verzetten`),
    el('p', { class: 'tiny dim' }, 'Naar welke dag deze week?'));
  const close2 = sheet(box);
  for (let i = 0; i < 7; i++) {
    const d = addDays(mon, i);
    if (d === iso) continue;
    box.append(el('button', { class: 'btn-block mt', onclick: () => {
      update(st => {
        st.sportSkips[iso] = true;                       // originele dag vrij
        st.plannedSports[d] = st.plannedSports[d] || [];
        st.plannedSports[d].push({ type: f.type, hard: true });
      });
      close2(); done('Verzet — schema aangepast');
    } }, `${DAY_NL[i]} · ${fmtDate(d).replace(/ \d{4}$/, '')}`));
  }
}
