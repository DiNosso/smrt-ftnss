// Oefeningenbibliotheek met filters en video's

import { el, videoBlock, demoBlock, sheet, toast } from './common.js';
import { EXERCISES, MUSCLE_NL, EQUIPMENT_NL, byId } from '../data/exercises.js';
import { get, S, update } from '../state.js';
import { exerciseHistory } from '../engine.js';
import { openExerciseProgress } from './progress.js';

let activeMuscle = null;
let onlyMyEquipment = true;

export function renderLibrary(app) {
  const draw = () => {
    app.innerHTML = '';
    app.append(el('div', { class: 'hero spread' },
      el('h2', { class: 'mb0' }, 'Oefeningen'),
      el('button', { class: 'btn-sm', onclick: () => openNewExercise(draw) }, '+ Eigen oefening')));

    // filters
    const muscles = [...new Set(EXERCISES.map(e => e.muscle))];
    const bar = el('div', { class: 'filterbar' },
      el('span', { class: 'pill' + (activeMuscle === null ? ' on' : ''), onclick: () => { activeMuscle = null; draw(); } }, 'Alles'),
      muscles.map(m => el('span', { class: 'pill' + (activeMuscle === m ? ' on' : ''), onclick: () => { activeMuscle = m; draw(); } }, MUSCLE_NL[m] || m)));
    app.append(bar);

    const eqToggle = el('div', { class: 'habit' },
      el('input', { type: 'checkbox', checked: onlyMyEquipment, onchange: e => { onlyMyEquipment = e.target.checked; draw(); } }),
      el('span', { class: 'tiny dim' }, 'Alleen met mijn materiaal'));
    app.append(eqToggle);

    const myEq = new Set(S().equipment);
    if (S().hasPullUpBar) myEq.add('pullUpBar');

    const list = EXERCISES.filter(e => {
      if (activeMuscle && e.muscle !== activeMuscle) return false;
      if (onlyMyEquipment && !e.equipment.every(q => myEq.has(q))) return false;
      return true;
    });

    const card = el('div', { class: 'card' });
    if (!list.length) card.append(el('p', { class: 'dim mb0' }, 'Niets gevonden met dit filter.'));
    for (const ex of list) {
      card.append(el('div', { class: 'exrow', onclick: () => openDetail(ex) },
        el('div', { class: 'grow' },
          el('div', {}, ex.nameNL),
          el('div', { class: 'mus' }, `${MUSCLE_NL[ex.muscle] || ex.muscle} · ${ex.equipment.map(q => EQUIPMENT_NL[q] || q).join(', ')}`)),
        el('span', { class: 'dim' }, ex.demo ? '▶' : ex.video ? '🎬' : '›')));
    }
    app.append(card);
    app.append(el('p', { class: 'tiny dim center' }, `${list.length} oefeningen`));
  };
  draw();
}

function openDetail(ex) {
  const box = el('div', {},
    el('h3', {}, ex.nameNL),
    el('div', { class: 'tiny dim' }, `${MUSCLE_NL[ex.muscle] || ex.muscle}${ex.secondary?.length ? ' · ook: ' + ex.secondary.map(m => MUSCLE_NL[m] || m).join(', ') : ''}`),
    el('div', { class: 'mt' }, ex.equipment.map(q => el('span', { class: 'pill' }, EQUIPMENT_NL[q] || q))),
    demoBlock(ex) || videoBlock(ex),
    el('p', { class: 'tiny mt' }, ex.instructions),
    ex.demo && ex.video ? el('a', { class: 'btn btn-sm btn-ghost', style: 'text-decoration:none', href: `https://www.youtube.com/watch?v=${ex.video}`, target: '_blank', rel: 'noopener' }, '▶ Uitgebreide video ↗') : null,
    ex.tips ? el('p', { class: 'tiny', style: 'color:var(--primary)' }, '💡 ' + ex.tips) : null,
    el('div', { class: 'tiny dim' }, `Moeilijkheid: ${'●'.repeat(ex.difficulty || 1)}${'○'.repeat(5 - (ex.difficulty || 1))} · herstel ±${ex.recoveryHours} uur`));
  if (exerciseHistory(ex.id).length) {
    box.append(el('button', { class: 'btn-secondary btn-block mt', onclick: () => openExerciseProgress(ex.id) }, '📈 Bekijk je progressie'));
  }
  sheet(box);
}

/** Eigen oefening toevoegen. */
function openNewExercise(redraw) {
  const nameIn = el('input', { placeholder: 'Naam (bijv. "Pull-up aan het rek")' });
  const muscleSel = el('select', {}, Object.entries(MUSCLE_NL).map(([k, v]) => el('option', { value: k }, v)));
  const instrIn = el('textarea', { rows: 3, placeholder: 'Korte uitvoeringsinstructie' });
  const videoIn = el('input', { placeholder: 'YouTube video-ID (optioneel)' });
  const EQ_CHOICES = ['bodyweight', 'dumbbells', 'kettlebell', 'resistanceBands', 'bench', 'abWheel', 'pullUpBar'];
  const eqChecks = {};
  const eqBox = el('div', { class: 'row wrap mt' }, EQ_CHOICES.map(q => {
    const cb = el('input', { type: 'checkbox', checked: q === 'bodyweight' });
    eqChecks[q] = cb;
    return el('label', { class: 'row', style: 'width:auto;margin:0;font-size:.85rem;color:var(--text)' }, cb, EQUIPMENT_NL[q]);
  }));
  const saveBtn = el('button', { class: 'btn-primary btn-block mt' }, '✓ Toevoegen');
  const close = sheet(el('div', {},
    el('h3', {}, 'Eigen oefening'),
    el('label', {}, 'Naam'), nameIn,
    el('label', {}, 'Spiergroep'), muscleSel,
    el('label', {}, 'Materiaal'), eqBox,
    el('label', {}, 'Instructie'), instrIn,
    el('label', {}, 'YouTube-ID'), videoIn,
    saveBtn));
  saveBtn.addEventListener('click', () => {
    const name = nameIn.value.trim();
    if (!name) return toast('Geef de oefening een naam');
    const id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (byId[id]) return toast('Er bestaat al een oefening met deze naam');
    const ex = {
      id, name, nameNL: name,
      muscle: muscleSel.value, secondary: [],
      equipment: EQ_CHOICES.filter(q => eqChecks[q].checked),
      difficulty: 2, video: videoIn.value.trim() || null,
      instructions: instrIn.value.trim() || 'Eigen oefening.',
      recoveryHours: 36, custom: true,
    };
    if (!ex.equipment.length) ex.equipment = ['bodyweight'];
    EXERCISES.push(ex); byId[id] = ex;
    update(s => { s.customExercises.push(ex); });
    close(); toast('Oefening toegevoegd'); redraw();
  });
}
