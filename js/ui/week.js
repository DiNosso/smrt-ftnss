// Weekoverzicht: wachtrij-planning (vooruit gesimuleerd) + gedane workouts + intervals.icu

import { el, DAY_NL, sheet, toast, fmtDate } from './common.js';
import { get, update, todayISO, addDays } from '../state.js';
import { schedule, mondayOf, mesoInfo } from '../engine.js';
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

      const rowEl = el('div', { class: 'weekday' + (isToday ? ' today' : ''), style: iso >= today ? 'cursor:pointer' : '' },
        el('div', { class: 'd' }, el('div', { class: 'nm' }, DAY_NL[i]), el('div', { class: 'no' }, d.getDate())),
        el('div', { class: 'what' },
          el('div', { class: 't' }, title),
          el('div', { class: 'tiny dim' }, sub, actLine ? `${sub ? ' · ' : ''}🏃 ${actLine}` : ''),
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

/** Dag aanpassen: kan niet (rustdag), specifieke sessie, of terug naar automatisch. */
function openDayPicker(iso, redraw) {
  const swap = get().swaps[iso];
  const box = el('div', {},
    el('h3', {}, fmtDate(iso)),
    el('p', { class: 'tiny dim' }, 'Pas deze dag aan. Sla je een zware sessie over, dan schuift de wachtrij vanzelf op — je mist niets, het duurt alleen een dagje langer.'));
  const set = (id) => {
    update(st => { if (id) st.swaps[iso] = id; else delete st.swaps[iso]; });
    close(); toast(id ? 'Dag aangepast' : 'Terug naar automatische planning'); redraw();
  };
  box.append(el('button', { class: 'btn-block mt', style: 'border-color:rgba(224,122,122,.4)', onclick: () => set('rest') }, '🚫 Kan niet / rustdag'));
  for (const s of Object.values(SESSIONS).filter(s => s.id !== 'rest')) {
    box.append(el('button', { class: 'btn-block mt' + (swap === s.id ? ' btn-secondary' : ''), onclick: () => set(s.id) }, s.name));
  }
  if (swap) box.append(el('button', { class: 'btn-block mt btn-ghost', style: 'color:var(--accent)', onclick: () => set(null) }, '↺ Automatische planning'));
  const close = sheet(box);
}
