// Weekoverzicht: wachtrij-planning (vooruit gesimuleerd) + gedane workouts + intervals.icu

import { el, DAY_NL, sheet, toast, fmtDate } from './common.js';
import { get, update, todayISO, addDays } from '../state.js';
import { schedule, mondayOf, mesoInfo, plannedOn, SPORT_CHOICES } from '../engine.js';
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
        const session = SESSIONS[day?.sessionId] || SESSIONS.rest;
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
      el('h5', {}, 'Hoe deze planning werkt'),
      el('p', { class: 'tiny dim mb0' },
        'Geen vaste dagen: de app werkt met een wachtrij (A → B → C). Mis je een sessie, dan schuift alles automatisch op — met bewaking van spierherstel (±48 uur per spiergroep) en een doel van 3 zware sessies per week. ' +
        'Elke 4 opbouwweken bouwt het volume op van rustig (MEV) naar piek (MRV), gevolgd door een deloadweek. Bij aanhoudend slechte vorm of slaap komt de deload eerder.')));
  };

  draw(0);
  if (icu.isConfigured()) icu.refresh().then(() => draw(0)).catch(() => {});
}

/** Dag aanpassen: andere sport plannen, kan niet (rustdag), specifieke sessie, of automatisch. */
function openDayPicker(iso, redraw) {
  const swap = get().swaps[iso];
  const box = el('div', {},
    el('h3', {}, fmtDate(iso)),
    el('p', { class: 'tiny dim' }, 'Plan een andere sport of pas de krachtsessie aan. De wachtrij plant er automatisch omheen — een gemiste sessie schuift gewoon op.'));
  const close = sheet(box);
  const done = (msg) => { close(); toast(msg); redraw(); };

  // --- andere sport plannen ---
  box.append(el('h5', { class: 'mt' }, 'Andere sport plannen'));
  const manual = (get().plannedSports || {})[iso] || [];
  const fromIcu = icu.plannedEventsOn(get().icuCache, iso);
  for (const [idx, p] of manual.entries()) {
    box.append(el('div', { class: 'spread', style: 'padding:6px 0' },
      el('span', {}, `${icu.TYPE_NL[p.type] || p.type} ${p.hard ? '· stevig' : '· licht'}`),
      el('button', { class: 'btn-sm btn-ghost', style: 'color:var(--danger)', onclick: () => {
        update(st => { st.plannedSports[iso].splice(idx, 1); if (!st.plannedSports[iso].length) delete st.plannedSports[iso]; });
        done('Sport verwijderd');
      } }, '✕')));
  }
  for (const p of fromIcu) {
    box.append(el('div', { class: 'tiny dim', style: 'padding:4px 0' }, `📅 ${p.name} (uit intervals.icu-kalender)`));
  }
  let pickedSport = null;
  const sportRow = el('div', { class: 'row wrap' }, SPORT_CHOICES.map(c =>
    el('button', { class: 'btn-sm', onclick: (e) => {
      pickedSport = c.type;
      sportRow.querySelectorAll('button').forEach(b => b.classList.remove('btn-secondary'));
      e.currentTarget.classList.add('btn-secondary');
      intensityRow.style.display = 'flex';
    } }, c.label)));
  const addSport = (hard) => {
    if (!pickedSport) return;
    update(st => {
      st.plannedSports[iso] = st.plannedSports[iso] || [];
      st.plannedSports[iso].push({ type: pickedSport, hard });
    });
    done('Sport ingepland — schema aangepast');
  };
  const intensityRow = el('div', { class: 'row mt', style: 'display:none' },
    el('button', { class: 'btn-sm grow', onclick: () => addSport(false) }, 'Licht / rustig'),
    el('button', { class: 'btn-sm grow', onclick: () => addSport(true) }, 'Stevig / lang'));
  box.append(sportRow, intensityRow);

  // --- krachtsessie aanpassen ---
  box.append(el('h5', { class: 'mt' }, 'Krachtsessie'));
  const set = (id) => {
    update(st => { if (id) st.swaps[iso] = id; else delete st.swaps[iso]; });
    done(id ? 'Dag aangepast' : 'Terug naar automatische planning');
  };
  box.append(el('button', { class: 'btn-block mt', style: 'border-color:rgba(224,122,122,.4)', onclick: () => set('rest') }, '🚫 Kan niet / rustdag'));
  for (const s of Object.values(SESSIONS).filter(s => s.id !== 'rest')) {
    box.append(el('button', { class: 'btn-block mt' + (swap === s.id ? ' btn-secondary' : ''), onclick: () => set(s.id) }, s.name));
  }
  if (swap) box.append(el('button', { class: 'btn-block mt btn-ghost', style: 'color:var(--accent)', onclick: () => set(null) }, '↺ Automatische planning'));
}
