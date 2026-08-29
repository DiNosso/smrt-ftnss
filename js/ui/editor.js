// Programma-editor: sessies aanpassen (oefeningen, sets/reps/rust, volgorde).
// Wijzigingen worden als override opgeslagen; "herstel standaard" zet terug.

import { el, sheet, toast } from './common.js';
import { get, S, update } from '../state.js';
import { SESSIONS } from '../data/program.js';
import { EXERCISES, byId, MUSCLE_NL } from '../data/exercises.js';

const DEFAULTS = JSON.parse(JSON.stringify(SESSIONS)); // originele definities vastleggen bij load

export function openEditor(ctx) {
  const app = document.getElementById('app');

  const drawList = () => {
    app.innerHTML = '';
    app.append(el('div', { class: 'player-head spread' },
      el('button', { class: 'btn-sm btn-ghost', onclick: () => ctx.render() }, '‹ Terug'),
      el('h4', { class: 'mb0' }, 'Programma bewerken'),
      el('span', {})));
    app.append(el('p', { class: 'tiny dim' }, 'Tik op een sessie om oefeningen, sets, reps en rust aan te passen. De planner en het volume-advies rekenen automatisch met je wijzigingen.'));
    const card = el('div', { class: 'card' });
    for (const s of Object.values(SESSIONS)) {
      if (s.id === 'rest') continue;
      const overridden = !!get().sessionOverrides[s.id];
      card.append(el('div', { class: 'exrow', onclick: () => drawSession(s.id) },
        el('div', { class: 'grow' },
          el('div', {}, s.name),
          el('div', { class: 'mus' }, `${s.slots.length} oefeningen · ${s.slots.reduce((t, x) => t + x.sets, 0)} sets${overridden ? ' · aangepast' : ''}`)),
        el('span', { class: 'dim' }, '›')));
    }
    app.append(card);
    window.scrollTo(0, 0);
  };

  const drawSession = (sessionId) => {
    const session = SESSIONS[sessionId];
    // werk-kopie van de slots
    const slots = JSON.parse(JSON.stringify(session.slots));
    app.innerHTML = '';
    app.append(el('div', { class: 'player-head spread' },
      el('button', { class: 'btn-sm btn-ghost', onclick: drawList }, '‹ Sessies'),
      el('h4', { class: 'mb0' }, session.short || session.name),
      el('span', {})));

    const listCard = el('div', { class: 'card' });
    const redrawSlots = () => {
      listCard.innerHTML = '';
      slots.forEach((slot, i) => {
        const ex = byId[slot.ex];
        const setsIn = el('input', { type: 'number', value: slot.sets, min: 1, max: 8, style: 'width:52px;text-align:center' });
        const repLo = el('input', { type: 'number', value: slot.reps[0], style: 'width:52px;text-align:center' });
        const repHi = el('input', { type: 'number', value: slot.reps[1], style: 'width:52px;text-align:center' });
        const restIn = el('input', { type: 'number', value: slot.rest, step: 15, style: 'width:64px;text-align:center' });
        setsIn.addEventListener('change', () => { slot.sets = Math.max(1, parseInt(setsIn.value) || 1); });
        repLo.addEventListener('change', () => { slot.reps[0] = parseInt(repLo.value) || 1; });
        repHi.addEventListener('change', () => { slot.reps[1] = parseInt(repHi.value) || slot.reps[0]; });
        restIn.addEventListener('change', () => { slot.rest = parseInt(restIn.value) || 60; });
        listCard.append(el('div', { style: 'padding:10px 0;border-bottom:1px solid var(--border)' },
          el('div', { class: 'spread' },
            el('button', { class: 'btn-sm btn-ghost grow', style: 'text-align:left', onclick: () => pickExercise(nw => { slot.ex = nw; redrawSlots(); }) },
              (ex?.nameNL || slot.ex) + ' ⌄'),
            el('div', {},
              el('button', { class: 'btn-sm btn-ghost', onclick: () => { if (i > 0) { [slots[i - 1], slots[i]] = [slots[i], slots[i - 1]]; redrawSlots(); } } }, '↑'),
              el('button', { class: 'btn-sm btn-ghost', onclick: () => { if (i < slots.length - 1) { [slots[i + 1], slots[i]] = [slots[i], slots[i + 1]]; redrawSlots(); } } }, '↓'),
              el('button', { class: 'btn-sm btn-ghost', style: 'color:var(--danger)', onclick: () => { slots.splice(i, 1); redrawSlots(); } }, '✕'))),
          el('div', { class: 'row tiny dim mt', style: 'gap:6px;flex-wrap:wrap' },
            'sets', setsIn, 'reps', repLo, '–', repHi, 'rust', restIn, 's')));
      });
      listCard.append(el('button', { class: 'btn-sm mt', onclick: () => pickExercise(nw => {
        slots.push({ ex: nw, sets: 3, reps: [8, 12], rir: 2, rest: 120 });
        redrawSlots();
      }) }, '+ Oefening toevoegen'));
    };
    redrawSlots();
    app.append(listCard);

    const saveBtn = el('button', { class: 'btn-primary btn-block', onclick: () => {
      if (!slots.length) return toast('Een sessie heeft minstens één oefening nodig');
      const focus = [...new Set(slots.map(s => byId[s.ex]?.muscle).filter(m => m && m !== 'fullBody'))];
      update(st => { st.sessionOverrides[sessionId] = { slots, focus }; });
      SESSIONS[sessionId] = { ...SESSIONS[sessionId], slots, focus };
      toast('Sessie opgeslagen'); drawList();
    } }, '✓ Opslaan');
    const resetBtn = el('button', { class: 'btn-danger btn-block mt', onclick: () => {
      update(st => { delete st.sessionOverrides[sessionId]; });
      SESSIONS[sessionId] = JSON.parse(JSON.stringify(DEFAULTS[sessionId]));
      toast('Standaard hersteld'); drawList();
    } }, '↺ Herstel standaard');
    app.append(el('div', { class: 'card' }, saveBtn, resetBtn));
    window.scrollTo(0, 0);
  };

  drawList();
}

/** Oefening-kiezer (gefilterd op eigen materiaal, met zoekveld). */
function pickExercise(onPick) {
  const myEq = new Set(S().equipment);
  if (S().hasPullUpBar) myEq.add('pullUpBar');
  const pool = EXERCISES.filter(e => e.equipment.every(q => myEq.has(q)));
  const searchIn = el('input', { placeholder: 'Zoek oefening…' });
  const listBox = el('div', { style: 'max-height:50dvh;overflow-y:auto' });
  const close = sheet(el('div', {}, el('h3', {}, 'Kies oefening'), searchIn, el('div', { class: 'mt' }, listBox)));
  const draw = () => {
    const q = searchIn.value.trim().toLowerCase();
    listBox.innerHTML = '';
    for (const e of pool.filter(e => !q || e.nameNL.toLowerCase().includes(q) || e.name.toLowerCase().includes(q))) {
      listBox.append(el('div', { class: 'exrow', onclick: () => { close(); onPick(e.id); } },
        el('div', { class: 'grow' }, el('div', {}, e.nameNL), el('div', { class: 'mus' }, MUSCLE_NL[e.muscle] || e.muscle)),
        el('span', { class: 'dim' }, '›')));
    }
  };
  searchIn.addEventListener('input', draw);
  draw();
}
