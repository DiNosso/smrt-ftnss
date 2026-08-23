// Workout-player: sets + RIR loggen, rusttimer, supersets, warm-up,
// oefening wisselen, video's, wake lock, PR-detectie, intervals.icu-push.

import { el, videoBlock, demoBlock, fmtTime, toast, sheet, confetti, cardHead, explain, ICO } from './common.js';
import { get, S, update, todayISO } from '../state.js';
import { buildWorkout, recordProgress, detectPRs, warmupFor, alternativesFor, suggestWeight, nextWeight, stepDown, lastSetCue } from '../engine.js';
import { byId, MUSCLE_NL } from '../data/exercises.js';
import { openTV } from './cast.js';
import * as icu from '../icu.js';

let wakeLock = null;
async function keepAwake() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* ok */ }
}
function releaseWake() { wakeLock?.release?.(); wakeLock = null; }

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.15;
    o.start(); o.stop(ctx.currentTime + 0.35);
  } catch { /* ok */ }
  navigator.vibrate?.([200, 80, 200]);
}

export function openWorkout(session, adjust, ctx, timeCap = null) {
  const app = document.getElementById('app');
  keepAwake();

  const startedAt = Date.now();
  const slots = buildWorkout(session, adjust, timeCap);
  const iso = todayISO();
  let tv = null;              // actieve TV-modus
  let restState = null;       // {left, total} voor de TV-weergave
  let refreshProgress = () => {};

  // logstructuur — slotIdx koppelt sets aan hun slot (ook na een swap)
  const sets = [];
  slots.forEach((slot, si) => {
    for (let i = 1; i <= slot.sets; i++) sets.push({ ex: slot.ex, slotIdx: si, set: i, reps: null, weight: slot.suggestion.weight, rir: null, done: false });
  });

  // superset-partners: volgende slot met dezelfde ss-tag
  const partnerOf = si => {
    const tag = slots[si].ss;
    if (!tag) return null;
    for (let j = si + 1; j < slots.length; j++) if (slots[j].ss === tag) return j;
    return null;
  };
  const hasEarlierPartner = si => {
    const tag = slots[si].ss;
    if (!tag) return false;
    return slots.slice(0, si).some(s => s.ss === tag);
  };

  // rusttimer met aftel-ring
  let restEl = null, restIv = null;
  function startRest(seconds) {
    stopRest();
    let remain = seconds;
    const total = seconds;
    restState = { left: remain, total };
    const timeEl = el('span', { class: 'time' }, fmtTime(remain));
    const rr = el('div', { class: 'rring' });
    const C = 2 * Math.PI * 18;
    rr.innerHTML = `<svg viewBox="0 0 42 42"><circle class="t" cx="21" cy="21" r="18" fill="none" stroke-width="3.5"/>
      <circle class="v" cx="21" cy="21" r="18" fill="none" stroke-width="3.5" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="0"/></svg>`;
    const vc = rr.querySelector('.v');
    restEl = el('div', { class: 'resttimer' },
      rr, timeEl,
      el('span', { class: 'tiny dim grow' }, 'Rust — adem uit, volgende set komt eraan'),
      el('button', { class: 'btn-sm', onclick: () => { remain += 30; } }, '+30s'),
      el('button', { class: 'btn-sm btn-ghost', onclick: stopRest }, '✕'));
    document.body.append(restEl);
    document.body.classList.add('resting');
    restIv = setInterval(() => {
      remain -= 1;
      restState = { left: remain, total };
      timeEl.textContent = fmtTime(Math.max(0, remain));
      vc.setAttribute('stroke-dashoffset', (C * (1 - Math.max(0, remain) / total)).toFixed(1));
      if (remain <= 0) { beep(); stopRest(); }
    }, 1000);
  }
  function stopRest() {
    clearInterval(restIv); restEl?.remove(); restEl = null; restState = null;
    document.body.classList.remove('resting');
  }

  // ---- TV-modus ----
  function tvState() {
    const nextSet = sets.find(s => !s.done) || sets[sets.length - 1];
    const si = nextSet.slotIdx;
    const slot = slots[si];
    const inEx = sets.filter(s => s.slotIdx === si);
    const nextSlot = slots[si + 1];
    return {
      sessionName: session.name.replace(/^.*·\s*/, ''),
      exId: slot.ex,
      exercise: slot.exercise,
      exName: slot.exercise?.nameNL || slot.ex,
      setNo: nextSet.set,
      setsInExercise: inEx.length,
      scheme: `${slot.reps[0]}-${slot.reps[1]} reps`,
      weightText: nextSet.weight ? `${nextSet.weight} kg · RIR ${slot.rir}` : `RIR ${slot.rir}`,
      rest: slot.rest,
      resting: !!restState,
      restLeft: restState?.left ?? 0,
      doneSets: sets.filter(s => s.done).length,
      totalSets: sets.length,
      elapsed: (Date.now() - startedAt) / 1000,
      nextText: nextSlot ? nextSlot.exercise?.nameNL : null,
    };
  }
  function toggleTV() {
    if (tv) { tv.close(); tv = null; return; }
    tv = openTV(tvState, { onClose: () => { tv = null; } });
    toast('📺 TV-modus aan — cast/spiegel nu je scherm naar de TV');
  }

  function renderAll() {
    app.innerHTML = '';

    const clock = el('span', { class: 'dim tiny' }, fmtTime((Date.now() - startedAt) / 1000));
    const iv = setInterval(() => {
      if (!document.body.contains(clock)) return clearInterval(iv);
      clock.textContent = fmtTime((Date.now() - startedAt) / 1000);
    }, 1000);

    const progBar = el('div', { class: 'player-progress' }, el('i', { style: 'width:0%' }));
    const tvBtn = el('button', { class: 'btn-sm btn-ghost', title: 'TV-modus' });
    tvBtn.innerHTML = ICO.tv;
    tvBtn.style.color = 'var(--accent)';
    tvBtn.addEventListener('click', toggleTV);
    app.append(el('div', { class: 'player-head' },
      el('div', { class: 'spread' },
        el('button', { class: 'btn-sm btn-ghost', onclick: () => { if (confirm('Workout afbreken? Ingevoerde sets gaan verloren.')) { stopRest(); tv?.close(); releaseWake(); ctx.render(); } } }, '‹ Terug'),
        el('h4', { class: 'mb0' }, session.name.split('·')[1]?.trim() || session.name),
        el('div', { class: 'row', style: 'gap:4px' }, tvBtn, clock)),
      progBar));
    refreshProgress = () => {
      const done = sets.filter(s => s.done).length;
      progBar.querySelector('i').style.width = `${Math.round((done / Math.max(1, sets.length)) * 100)}%`;
    };
    refreshProgress();

    if (session.warmup) {
      app.append(el('div', { class: 'card', style: 'border-color:var(--secondary)' },
        el('h5', {}, '🔥 Warming-up'), el('p', { class: 'tiny dim mb0' }, session.warmup)));
    }

    // automatische warm-up ramp voor de eerste zware lift
    const ramp = session.type !== 'snack' ? warmupFor(slots) : null;
    if (ramp) {
      app.append(el('div', { class: 'card', style: 'border-color:var(--secondary)' },
        el('h5', {}, `🏋️ Opwarmsets · ${ramp.forExercise}`),
        el('p', { class: 'tiny dim mb0' },
          ramp.sets.map(s => `${s.reps} reps × ${s.weight} kg (${s.label})`).join('  →  ') +
          `  →  dan je werksets met ${ramp.workWeight} kg. Opwarmsets tellen niet als werkvolume.`)));
    }

    slots.forEach((slot, si) => app.append(slotCard(slot, si)));

    app.append(el('div', { class: 'card' },
      el('button', { class: 'btn-primary btn-block', onclick: finish }, '✓ Workout afronden')));
    markActive();
    window.scrollTo(0, 0);
  }

  function slotCard(slot, si) {
    const ex = slot.exercise;
    const partner = partnerOf(si);
    const card = el('div', { class: 'card' });
    card.append(el('div', { class: 'spread' },
      el('h4', { class: 'mb0' }, ex?.nameNL || slot.ex),
      el('div', {},
        slot.ss ? el('span', { class: 'pill on', style: 'margin-right:6px' }, 'Superset') : null,
        el('span', { class: 'pill' }, `RIR ${slot.rir}`))));
    card.append(el('div', { class: 'tiny dim', style: 'margin-bottom:10px' },
      `${slot.sets} sets × ${slot.reps[0]}-${slot.reps[1]} reps · rust ${fmtTime(slot.rest)}`));

    // korte demo-animatie direct zichtbaar (geen wachten, geen reclame)
    const demo = demoBlock(ex);
    if (demo) card.append(demo);

    if (partner != null) card.append(el('div', { class: 'tiny mt', style: 'color:var(--warn)' },
      `⇉ Superset met ${slots[partner].exercise?.nameNL}: na elke set direct door, rust pas daarna.`));
    if (hasEarlierPartner(si)) card.append(el('div', { class: 'tiny mt', style: 'color:var(--warn)' },
      '⇉ Tweede helft van de superset — na deze set start de rusttimer.'));

    // gewichtsadvies + waarom (RIR-gedreven)
    card.append(el('div', { class: 'mt', style: 'font-weight:600;color:var(--primary);font-size:.92rem' },
      (slot.suggestion.big ? '⏫ ' : slot.suggestion.isUp ? '↗ ' : slot.suggestion.isDown ? '↘ ' : '↳ ') + slot.suggestion.text));
    if (slot.suggestion.why) card.append(el('div', { class: 'tiny dim', style: 'margin-top:3px' }, slot.suggestion.why));
    card.append(el('div', { class: 'tiny', style: 'margin-top:6px;color:var(--warn)' }, '🎯 ' + lastSetCue(slot)));
    if (slot.note) card.append(el('p', { class: 'tiny dim mt mb0' }, slot.note));

    // uitleg + wissel
    const actions = el('div', { class: 'row mt' },
      el('button', { class: 'btn-sm btn-ghost', onclick: () => openSwap(si) }, '⇄ Wissel'),
      ex?.video ? el('a', { class: 'btn btn-sm btn-ghost', style: 'text-decoration:none', href: `https://www.youtube.com/watch?v=${ex.video}`, target: '_blank', rel: 'noopener' },
        ex.videoSrc === 'bb' ? '▶ Korte clip ↗' : '▶ Video ↗') : null);
    card.append(actions);
    if (ex) card.append(explain('Uitvoering',
      el('p', { class: 'mb0' }, ex.instructions),
      ex.tips ? el('p', { class: 'mt mb0', style: 'color:var(--primary)' }, '💡 ' + ex.tips) : null));

    // setrijen (met RIR) + autoregulatie-hint
    const mySets = sets.filter(s => s.slotIdx === si);
    const slotRows = [];
    const hintEl = el('div', { class: 'tiny mt', style: 'color:var(--warn);display:none' });
    card.append(el('div', { class: 'mt tiny dim', style: 'display:grid;grid-template-columns:40px 1fr 1fr 54px 46px;gap:7px;text-align:center' },
      el('span', {}), el('span', {}, 'kg'), el('span', {}, 'reps'), el('span', {}, 'RIR'), el('span', {})));
    card.append(el('div', {}, mySets.map(s => setRow(s, slot, si, slotRows, hintEl))), hintEl);
    return card;
  }

  // ---- in-sessie autoregulatie ----
  // RIR 0 of gemiste reps → resterende sets lichter (en bij herhaling: laatste set optioneel).
  // RIR ≥4 op de rep-top → volgende set een stap zwaarder.
  function autoRegulate(s, slot, slotRows, hintEl) {
    const isWeighted = s.weight != null && s.weight > 0;
    const missed = s.reps != null && s.reps < slot.reps[0];
    const ground = s.rir === 0;
    const cruised = s.rir != null && s.rir >= 4 && s.reps != null && s.reps >= slot.reps[1];
    const remaining = slotRows.filter(r => !r.s.done);
    const showHint = (msg) => { hintEl.style.display = 'block'; hintEl.textContent = '⚖ Autoregulatie: ' + msg; };

    if ((missed || ground) && remaining.length) {
      slot._downCount = (slot._downCount || 0) + 1;
      if (isWeighted) {
        const nw = stepDown(s.weight);
        if (nw < s.weight) {
          for (const r of remaining) { r.s.weight = nw; r.wIn.value = nw; }
          showHint(`${missed ? 'reps niet gehaald' : 'RIR 0'} — resterende sets naar ${nw} kg, kwaliteit boven ego.`);
          toast(`⚖ Gewicht verlaagd naar ${nw} kg voor de rest van deze oefening`);
        } else {
          showHint('zwaar punt bereikt — hou de resterende sets strak en stop 1-2 reps eerder.');
        }
      } else {
        showHint('zwaar punt bereikt — maak de resterende sets makkelijker (knieën, kleinere ROM) of mik lager in de range.');
      }
      if (slot._downCount >= 2 && remaining.length) {
        const lastRow = remaining[remaining.length - 1];
        lastRow.rowEl.style.opacity = '.45';
        showHint('twee zware signalen — de laatste set is optioneel. Overslaan is hier de slimme keuze.');
      }
    } else if (cruised && remaining.length) {
      const r = remaining[0];
      if (isWeighted) {
        const nw = nextWeight(s.weight);
        if (nw > s.weight) {
          r.s.weight = nw; r.wIn.value = nw;
          showHint(`RIR ${s.rir} op de rep-top — volgende set naar ${nw} kg. Zoek die grens op.`);
          toast(`⚖ Te fris! Volgende set: ${nw} kg`);
        }
      } else {
        showHint(`RIR ${s.rir} op de rep-top — verzwaar de volgende set met een band of 3 sec zakken.`);
      }
    }
  }

  function setRow(s, slot, si, slotRows, hintEl) {
    const isBw = slot.suggestion.weight == null;
    const wIn = el('input', { type: 'number', inputmode: 'decimal', step: '0.5', placeholder: isBw ? 'lich.' : 'kg', value: s.weight ?? '' });
    const rIn = el('input', { type: 'number', inputmode: 'numeric', placeholder: `${slot.reps[0]}-${slot.reps[1]}`, value: s.reps ?? '' });
    const rirIn = el('select', { style: 'padding:10px 4px;text-align:center' },
      el('option', { value: '' }, '·'),
      [0, 1, 2, 3, 4, 5].map(v => el('option', { value: v, selected: s.rir === v }, String(v))));
    const btn = el('button', { class: 'done-btn' + (s.done ? ' done' : '') }, '✓');
    wIn.addEventListener('input', () => { s.weight = wIn.value === '' ? null : parseFloat(wIn.value); });
    rIn.addEventListener('input', () => { s.reps = rIn.value === '' ? null : parseInt(rIn.value, 10); });
    rirIn.addEventListener('change', () => { s.rir = rirIn.value === '' ? null : parseInt(rirIn.value, 10); });
    btn.addEventListener('click', () => {
      if (!s.done) {
        if (s.reps == null) { s.reps = slot.reps[1]; rIn.value = s.reps; } // snel loggen: bovengrens
        if (s.rir == null) { s.rir = slot.rir; rirIn.value = s.rir; }     // aanname: volgens plan
        s.done = true; btn.classList.add('done');
        rowEl.classList.add('filled');
        navigator.vibrate?.(12);
        refreshProgress(); markActive();
        autoRegulate(s, slot, slotRows, hintEl);
        const partner = partnerOf(si);
        if (partner != null) {
          toast(`⇉ Direct door: ${slots[partner].exercise?.nameNL} — rust komt daarna`);
        } else {
          startRest(slot.rest);
        }
      } else { s.done = false; btn.classList.remove('done'); }
    });
    const rowEl = el('div', { class: 'setrow', style: 'grid-template-columns:44px 1fr 1fr 54px 48px' },
      el('span', { class: 'setnum' }, `Set ${s.set}`), wIn, rIn, rirIn, btn);
    slotRows.push({ s, wIn, rIn, rirIn, rowEl });
    return rowEl;
  }

  /** Markeer de eerstvolgende onvoltooide set als 'actief'. */
  function markActive() {
    document.querySelectorAll('.setrow.active').forEach(n => n.classList.remove('active'));
    const idx = sets.findIndex(s => !s.done);
    if (idx < 0) return;
    const rows = document.querySelectorAll('.setrow');
    if (rows[idx]) rows[idx].classList.add('active');
  }

  // ---- oefening wisselen ----
  function openSwap(si) {
    const slot = slots[si];
    const inSession = slots.map(s => s.ex);
    const alts = alternativesFor(slot.ex, inSession);
    const box = el('div', {}, el('h3', {}, 'Wissel oefening'),
      el('p', { class: 'tiny dim' }, `Alternatieven voor ${slot.exercise?.nameNL} — zelfde spiergroep, met jouw materiaal. Sets en reps blijven staan.`));
    if (!alts.length) box.append(el('p', { class: 'dim' }, 'Geen alternatieven gevonden met je huidige materiaal.'));
    const close = sheet(box);
    for (const alt of alts) {
      box.append(el('div', { class: 'exrow', onclick: () => {
        slots[si] = { ...slot, ex: alt.id, exercise: alt, suggestion: suggestWeight(alt.id, slot.reps), ss: undefined, note: null };
        for (const s of sets) {
          if (s.slotIdx === si && !s.done) { s.ex = alt.id; s.weight = slots[si].suggestion.weight; }
        }
        close(); renderAll();
        toast(`⇄ Gewisseld naar ${alt.nameNL}`);
      } },
        el('div', { class: 'grow' },
          el('div', {}, alt.nameNL),
          el('div', { class: 'mus' }, `${MUSCLE_NL[alt.muscle] || alt.muscle} · moeilijkheid ${alt.difficulty || '?'}/5`)),
        el('span', { class: 'dim' }, alt.video ? '🎬' : '›')));
    }
  }

  // ---- afronden ----
  function finish() {
    const doneSets = sets.filter(s => s.done && s.reps);
    if (!doneSets.length && !confirm('Nog geen sets afgevinkt — toch afronden?')) return;
    stopRest();

    let feel = 3;
    const noteIn = el('textarea', { rows: 2, placeholder: 'Notitie (optioneel) — bijv. "schouder voelde stroef bij incline press"' });
    const feelRow = el('div', { class: 'row', style: 'justify-content:space-between' });
    const FEELS = [[1, '🥵 Zwaar'], [2, '😮‍💨'], [3, '🙂 Oké'], [4, '😄'], [5, '🔥 Top']];
    feelRow.append(...FEELS.map(([v, label]) => el('button', {
      class: 'btn-sm' + (v === 3 ? ' btn-secondary' : ''),
      onclick: (e) => { feel = v; feelRow.querySelectorAll('button').forEach(b => b.classList.remove('btn-secondary')); e.currentTarget.classList.add('btn-secondary'); },
    }, label)));

    const saveBtn = el('button', { class: 'btn-primary btn-block mt' }, '✓ Opslaan');
    const closeSheet = sheet(el('div', {},
      el('h3', {}, 'Workout afronden'),
      el('p', { class: 'tiny dim' }, `${doneSets.length} sets · ${Math.round((Date.now() - startedAt) / 60000)} min`),
      el('label', {}, 'Hoe voelde het?'), feelRow,
      el('label', {}, 'Notitie'), noteIn,
      saveBtn));

    saveBtn.addEventListener('click', async () => {
      releaseWake(); tv?.close(); tv = null;
      const log = {
        id: 'log_' + Date.now(),
        date: iso,
        sessionId: session.id,
        sessionName: session.name,
        startedAt,
        durationSec: Math.round((Date.now() - startedAt) / 1000),
        sets: sets.filter(s => s.done),
        feel,
        note: noteIn.value.trim() || null,
      };
      const best = recordProgress(log);
      const prs = detectPRs(log);
      update(st => {
        st.logs.push(log);
        for (const [ex, b] of Object.entries(best)) st.lastWeights[ex] = { weight: b.weight, reps: b.reps, date: iso };
      });
      closeSheet();

      if (prs.length) {
        confetti();
        const names = prs.map(p => `${byId[p.ex]?.nameNL || p.ex} (${p.kind}: ${p.value})`).join(', ');
        toast(`🎉 Nieuw PR! ${names}`);
      }

      if (S().pushToIcu && icu.isConfigured()) {
        if (!prs.length) toast('💪 Gelogd — versturen naar intervals.icu…');
        try {
          const actId = await icu.postWorkout(log, session, slots);
          update(st => { const l = st.logs.find(x => x.id === log.id); if (l) l.icuActivityId = actId; });
          if (!prs.length) toast('✅ Gelogd én naar intervals.icu gestuurd');
        } catch (e) {
          toast('⚠ Gelogd, maar intervals.icu-upload mislukte: ' + e.message);
        }
      } else if (!prs.length) {
        toast(`💪 ${doneSets.length} sets gelogd — sterk!`);
      }
      ctx.render();
    });
  }

  renderAll();
}
