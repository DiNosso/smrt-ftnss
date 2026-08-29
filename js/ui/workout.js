// Workout-player: sets + RIR loggen, rusttimer, supersets, warm-up,
// oefening wisselen, video's, wake lock, PR-detectie, intervals.icu-push.

import { el, videoBlock, demoBlock, visualBlock, fmtTime, toast, sheet, confetti, cardHead, explain, ICO } from './common.js';
import { get, S, update, todayISO } from '../state.js';
import { buildWorkout, recordProgress, detectPRs, warmupFor, alternativesFor, suggestWeight, nextWeight, stepDown, lastSetCue, calibrate, estimateFromKnown, isBodyweightOnly } from '../engine.js';
import { byId, MUSCLE_NL } from '../data/exercises.js';
import { WARMUP } from '../data/program.js';
import { openTV } from './cast.js';
import { connect as tvConnect } from '../tvsync.js';
import * as icu from '../icu.js';

let wakeLock = null;
async function keepAwake() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* ok */ }
}
function releaseWake() { wakeLock?.release?.(); wakeLock = null; }

// iOS staat geluid alleen toe vanuit een AudioContext die tijdens een
// gebruikersactie is aangemaakt. Daarom één keer aanmaken bij de start van de
// workout en hergebruiken, in plaats van bij elke piep een nieuwe.
let audio = null;
export function primeAudio() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch { audio = null; }
}
function tone(freq = 880, dur = 0.12, vol = 0.16) {
  try {
    if (!audio) return;
    if (audio.state === 'suspended') audio.resume();
    const o = audio.createOscillator(), g = audio.createGain();
    o.connect(g); g.connect(audio.destination);
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    o.start(); o.stop(audio.currentTime + dur);
  } catch { /* geluid is nooit noodzakelijk */ }
}
function tick() { tone(660, 0.09, 0.12); navigator.vibrate?.(30); }
function beep() {
  tone(990, 0.18, 0.2);
  setTimeout(() => tone(1320, 0.28, 0.2), 190);
  navigator.vibrate?.([200, 80, 200]);
}

export function openWorkout(session, adjust, ctx, timeCap = null) {
  const app = document.getElementById('app');
  keepAwake();
  primeAudio();

  const startedAt = Date.now();
  const slots = buildWorkout(session, adjust, timeCap);
  // Tv-scherm: stuur de stand mee zolang de workout open staat.
  let tvLink = null;
  if (S().tvEnabled && S().tvPairCode) {
    tvLink = tvConnect(S().tvPairCode, { role: 'phone' });
  }
  const stuurNaarTv = () => { if (!tvLink) return; try { tvLink.publish(tvState()); } catch { /* ok */ } };
  const tvIv = tvLink ? setInterval(stuurNaarTv, 1000) : null;
  const stopTv = () => { clearInterval(tvIv); tvLink?.close(); tvLink = null; };
  const iso = todayISO();
  let tv = null;              // actieve TV-modus
  let restState = null;       // {left, total} voor de TV-weergave
  let refreshProgress = () => {};

  // logstructuur — slotIdx koppelt sets aan hun slot (ook na een swap)
  const sets = [];
  slots.forEach((slot, si) => {
    for (let i = 1; i <= slot.sets; i++) sets.push({ ex: slot.ex, slotIdx: si, set: i, reps: null, weight: slot.suggestion.weight, rir: null, done: false });
  });

  /**
   * Bewaar de lopende training na elke wijziging. Sluit de app af, valt de
   * telefoon in slaap of gaat er iets mis met het scherm, dan staat alles er
   * bij de volgende start nog. Kost niets en voorkomt het ergste dat er in een
   * trainingsapp kan gebeuren: je sets kwijtraken.
   */
  function persist() {
    update(st => {
      st.activeWorkout = {
        sessionId: session.id, startedAt, savedAt: Date.now(),
        adjust, timeCap,
        sets: sets.map(x => ({ ex: x.ex, slotIdx: x.slotIdx, set: x.set, reps: x.reps, weight: x.weight, rir: x.rir, done: x.done })),
        slotEx: slots.map(sl => sl.ex),
      };
    });
  }
  function clearPersisted() { update(st => { st.activeWorkout = null; }); }

  // Eerder afgebroken training van vandaag? Zet de ingevulde sets terug.
  const saved = get().activeWorkout;
  if (saved && saved.sessionId === session.id && (Date.now() - saved.savedAt) < 6 * 3600 * 1000) {
    for (const old of saved.sets) {
      const cur = sets.find(x => x.slotIdx === old.slotIdx && x.set === old.set);
      if (cur) Object.assign(cur, { reps: old.reps, weight: old.weight, rir: old.rir, done: old.done });
    }
    if (saved.sets.some(x => x.done)) {
      setTimeout(() => toast(`Training hervat — ${saved.sets.filter(x => x.done).length} sets stonden al ingevuld`), 400);
    }
  }

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
      if (remain === 3 || remain === 2 || remain === 1) tick();
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
      weightText: nextSet.weight ? `${nextSet.weight} kg · mik op RIR ${slot.rir}` : `mik op RIR ${slot.rir}`,
      rest: slot.rest,
      resting: !!restState,
      restLeft: restState?.left ?? 0,
      doneSets: sets.filter(s => s.done).length,
      totalSets: sets.length,
      elapsed: (Date.now() - startedAt) / 1000,
      nextText: nextSlot ? nextSlot.exercise?.nameNL : null,
      // extra velden voor het losse tv-scherm
      exId: slot.ex,
      clip: !!slot.exercise?.clip,
      demo: !!slot.exercise?.demo,
      thumb: slot.exercise?.video ? `https://i.ytimg.com/vi/${slot.exercise.video}/hqdefault.jpg` : null,
      restUntil: restState ? Date.now() + restState.left * 1000 : 0,
    };
  }
  function toggleTV() {
    if (tv) { tv.close(); tv = null; return; }
    tv = openTV(tvState, { onClose: () => { tv = null; } });
    toast('📺 TV-weergave aan');
  }

  function renderAll() {
    app.innerHTML = '';

    const clock = el('span', { class: 'dim tiny' }, fmtTime((Date.now() - startedAt) / 1000));
    const iv = setInterval(() => {
      if (!document.body.contains(clock)) return clearInterval(iv);
      clock.textContent = fmtTime((Date.now() - startedAt) / 1000);
    }, 1000);

    const progBar = el('div', { class: 'player-progress' }, el('i', { style: 'width:0%' }));
    // Een webapp kan zelf geen AirPlay starten; dat doet iOS. De knop zet de
    // tv-weergave aan en legt uit hoe je spiegelt — anders is niet te raden
    // wat het icoontje doet.
    const tvBtn = el('button', { class: 'btn-sm', style: 'color:var(--accent);border-color:rgba(56,237,208,.4)' });
    tvBtn.innerHTML = ICO.tv + ' <span style="margin-left:4px">TV</span>';
    tvBtn.addEventListener('click', () => {
      if (tv) { toggleTV(); return; }
      openCastHelp();
    });
    app.append(el('div', { class: 'player-head' },
      el('div', { class: 'spread' },
        el('button', { class: 'btn-sm btn-ghost', onclick: () => {
          const ingevuld = sets.filter(x => x.done).length;
          if (!ingevuld || confirm(`Terug naar het startscherm?\n\nJe ${ingevuld} ingevulde sets blijven bewaard — je kunt de training later gewoon hervatten.`)) {
            stopRest(); tv?.close(); releaseWake(); stopTv(); ctx.render();
          }
        } }, '‹ Terug'),
        el('h4', { class: 'mb0' }, session.short || session.name.split('·')[1]?.trim() || session.name),
        el('div', { class: 'row', style: 'gap:4px' }, tvBtn, clock)),
      progBar));
    refreshProgress = () => {
      const done = sets.filter(s => s.done).length;
      progBar.querySelector('i').style.width = `${Math.round((done / Math.max(1, sets.length)) * 100)}%`;
    };
    refreshProgress();

    // Begeleide warming-up: stap voor stap, met timer per onderdeel.
    const ramp = session.type !== 'snack' ? warmupFor(slots) : null;
    if (session.type !== 'snack') {
      app.append(warmupCard(ramp));
    }


    slots.forEach((slot, si) => app.append(slotCard(slot, si)));

    app.append(el('div', { class: 'card' },
      el('button', { class: 'btn-primary btn-block', onclick: finish }, '✓ Workout afronden')));
    markActive();
    window.scrollTo(0, 0);
  }

  /**
   * Begeleide warming-up: één onderdeel tegelijk, met aftelklok en demo.
   * Ingeklapt zodra je klaar bent, zodat het scherm niet vol blijft staan.
   */
  function warmupCard(ramp) {
    const gedaan = new Set();
    const card = el('div', { class: 'card', style: 'border-color:var(--secondary)' });
    const kop = el('div', { class: 'spread' },
      el('h5', { class: 'mb0' }, '🔥 Warming-up'),
      el('span', { class: 'tiny dim' }, '±7 min'));
    const lijst = el('div');
    const klaarBtn = el('button', { class: 'btn-sm btn-block mt' }, 'Warming-up overslaan');
    let ingeklapt = false;

    const teken = () => {
      lijst.innerHTML = '';
      if (ingeklapt) {
        lijst.append(el('p', { class: 'tiny dim mb0' }, `✓ Warming-up afgerond (${gedaan.size}/${WARMUP.length})`));
        return;
      }
      for (const w of WARMUP) {
        const isRamp = w.rampSets && ramp;
        if (w.rampSets && !ramp) continue;
        const af = gedaan.has(w.id);
        const rij = el('div', { class: 'wu' + (af ? ' done' : '') });
        const tijd = el('span', { class: 'wutime' }, `${w.sec}s`);
        const startKnop = el('button', { class: 'btn-sm' }, af ? '✓' : '▶');
        startKnop.addEventListener('click', () => {
          if (af) { gedaan.delete(w.id); teken(); return; }
          startWarmupTimer(w, tijd, () => { gedaan.add(w.id); teken(); });
        });
        const ex = w.ex ? byId[w.ex] : null;
        // DOM-append maakt van null de tekst "null" — dus eerst filteren.
        const beeld = ex ? visualBlock(ex, { tag: '' }) : null;
        rij.append(...[
          el('div', { class: 'wuhead' },
            el('span', { class: 'wufase' }, w.fase),
            el('span', { class: 'grow', style: 'font-size:.92rem' }, w.name),
            tijd, startKnop),
          el('div', { class: 'tiny dim' }, isRamp
            ? `${ramp.sets.map(x => `${x.reps} reps × ${x.weight} kg`).join('  →  ')}  →  werksets met ${ramp.workWeight} kg`
            : w.detail),
          beeld,
          el('div', { class: 'tiny', style: 'color:var(--primary);margin-top:3px' }, w.why),
        ].filter(Boolean));
        lijst.append(rij);
      }
    };
    klaarBtn.addEventListener('click', () => {
      ingeklapt = !ingeklapt;
      klaarBtn.textContent = ingeklapt ? 'Warming-up weer tonen' : 'Warming-up overslaan';
      teken();
    });
    teken();
    card.append(kop, lijst, klaarBtn);
    return card;
  }

  /** Aftelklok voor één warming-up-onderdeel. */
  function startWarmupTimer(w, tijdEl, klaar) {
    let rest = w.sec;
    tijdEl.classList.add('running');
    const iv = setInterval(() => {
      rest -= 1;
      tijdEl.textContent = `${Math.max(0, rest)}s`;
      if (rest === 3 || rest === 2 || rest === 1) tick();
      if (rest <= 0) {
        clearInterval(iv);
        tijdEl.classList.remove('running');
        beep();
        klaar();
      }
    }, 1000);
  }

  /** Uitleg hoe je naar de tv spiegelt, plus de tv-weergave aanzetten. */
  function openCastHelp() {
    const start = el('button', { class: 'btn-primary btn-block mt' }, '📺 TV-weergave aanzetten');
    const close = sheet(el('div', {},
      el('h3', {}, 'Naar je TV'),
      el('p', { class: 'tiny dim' }, 'De app kan zelf geen verbinding met je TV maken — dat doet je telefoon. Je spiegelt je scherm, en de app schakelt dan over naar een weergave die van een afstand leesbaar is.'),
      el('div', { class: 'card raised' },
        el('h5', { class: 'mb0' }, 'Apple TV / AirPlay'),
        el('p', { class: 'tiny dim mb0' }, '1. Veeg van rechtsboven omlaag voor het Bedieningspaneel\n2. Tik op Schermspiegeling\n3. Kies je Apple TV')),
      el('div', { class: 'card raised' },
        el('h5', { class: 'mb0' }, 'Chromecast / Google TV'),
        el('p', { class: 'tiny dim mb0' }, 'Open de Google Home-app → je TV → Mijn scherm casten.')),
      el('p', { class: 'tiny dim' }, 'Zet de spiegeling aan en tik daarna hieronder. Je telefoon blijft gewoon werken om je sets af te vinken.'),
      start));
    start.addEventListener('click', () => { close(); toggleTV(); });
  }

  /** Wat is RIR, en hoe schat je het? */
  function openRirHelp() {
    sheet(el('div', {},
      el('h3', {}, 'Hoeveel had je er nog over?'),
      el('p', { class: 'tiny dim' }, 'Na elke set vul je in hoeveel herhalingen je er nog bij had gekund met goede techniek. Dat heet RIR — reps in reserve. Het is het belangrijkste getal in de app: jouw antwoord bepaalt het gewicht van de volgende keer.'),
      el('div', { class: 'card raised' },
        el('div', { class: 'spread', style: 'padding:5px 0' }, el('b', {}, '0'), el('span', { class: 'tiny dim' }, 'Er kwam er echt geen meer bij')),
        el('div', { class: 'spread', style: 'padding:5px 0' }, el('b', {}, '1'), el('span', { class: 'tiny dim' }, 'Eentje had nog gekund, zwaar')),
        el('div', { class: 'spread', style: 'padding:5px 0' }, el('b', {}, '2'), el('span', { class: 'tiny dim' }, 'Twee erbij, laatste rep vertraagde')),
        el('div', { class: 'spread', style: 'padding:5px 0' }, el('b', {}, '3+'), el('span', { class: 'tiny dim' }, 'Voelde nog comfortabel — te licht'))),
      explain('Ik vind het moeilijk in te schatten', el('div', {},
        el('p', {}, 'Dat is normaal, en onderzoek laat iets nuttigs zien: vrijwel iedereen schat er ongeveer één rep naast, en altijd dezelfde kant op. Mensen dénken dat ze dichter bij spierfalen zitten dan ze werkelijk zijn.'),
        el('p', {}, 'Praktisch: zeg je "nog 2 over", probeer er dan tóch één extra. Lukt dat makkelijk, dan zat je op 3.'),
        el('p', { class: 'mb0' }, 'Het schatten wordt bovendien véél nauwkeuriger dicht bij spierfalen. Daarom staat er in elke sessie één set op RIR 0 — die dient als ijkpunt. Ga daar een keer echt door tot er niks meer komt; daarna weet je hoe de rest voelt.')))));
  }

  function slotCard(slot, si) {
    const ex = slot.exercise;
    const partner = partnerOf(si);
    const card = el('div', { class: 'card' });
    card.append(el('div', { class: 'spread' },
      el('h4', { class: 'mb0' }, ex?.nameNL || slot.ex),
      el('div', {},
        slot.ss ? el('span', { class: 'pill on', style: 'margin-right:6px' }, 'Superset') : null,
        el('span', { class: 'pill', style: 'cursor:pointer', onclick: openRirHelp },
          `doel: ${slot.rir} over`))));
    card.append(el('div', { class: 'tiny dim', style: 'margin-bottom:10px' },
      `${slot.sets} sets × ${slot.reps[0]}-${slot.reps[1]} reps · rust ${fmtTime(slot.rest)}`));

    // korte demo-animatie direct zichtbaar (geen wachten, geen reclame)
    const demo = visualBlock(ex);
    if (demo) card.append(demo);

    if (partner != null) card.append(el('div', { class: 'tiny mt', style: 'color:var(--warn)' },
      `⇉ Superset met ${slots[partner].exercise?.nameNL}: na elke set direct door, rust pas daarna.`));
    if (hasEarlierPartner(si)) card.append(el('div', { class: 'tiny mt', style: 'color:var(--warn)' },
      '⇉ Tweede helft van de superset — na deze set start de rusttimer.'));

    // gewichtsadvies + waarom (RIR-gedreven)
    card.append(el('div', { class: 'mt', style: 'font-weight:600;color:var(--primary);font-size:.92rem' },
      (slot.suggestion.big ? '⏫ ' : slot.suggestion.isUp ? '↗ ' : slot.suggestion.isDown ? '↘ ' : '↳ ') + slot.suggestion.text));
    if (slot.suggestion.why) card.append(el('div', { class: 'tiny dim', style: 'margin-top:3px' }, slot.suggestion.why));
    // Nog geen data van deze oefening? Bied aan om het startgewicht te bepalen.
    if (slot.suggestion.isNew && !slot.suggestion.weight) {
      const est = estimateFromKnown(slot.ex);
      if (est) card.append(el('div', { class: 'tiny', style: 'margin-top:3px;color:var(--primary)' },
        `Schatting op basis van je ${est.from}: ± ${est.weight} kg`));
      card.append(el('button', { class: 'btn-sm mt', onclick: () => openCalibrate(slot, est, (kg) => {
        // Werksets en suggestie bijwerken, daarna opnieuw tekenen.
        slots[si] = { ...slot, suggestion: { ...slot.suggestion, weight: kg, isNew: false,
          text: `${kg} kg — bepaald met een testset`, why: 'Vanaf nu stuurt je RIR het gewicht.' } };
        for (const st of sets) if (st.slotIdx === si && !st.done) st.weight = kg;
        renderAll();
      }) }, '⚖ Startgewicht bepalen'));
    }
    card.append(el('div', { class: 'tiny', style: 'margin-top:6px;color:var(--warn)' }, '🎯 ' + lastSetCue(slot)));
    if (slot.note) card.append(el('p', { class: 'tiny dim mt mb0' }, slot.note));

    // uitleg + wissel
    const actions = el('div', { class: 'row mt' },
      el('button', { class: 'btn-sm', style: 'border-color:rgba(154,224,212,.4);color:var(--primary)', onclick: () => openSwap(si) }, '⇄ Andere oefening'),
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
      el('span', {}), el('span', {}, 'kg'), el('span', {}, 'reps'), el('span', {}, 'over'), el('span', {})));
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
    // Puur lichaamsgewicht: dan is een kg-veld alleen maar verwarrend.
    const isBw = isBodyweightOnly(slot.exercise);
    const wIn = isBw
      ? el('span', { class: 'tiny dim', style: 'text-align:center' }, 'eigen gew.')
      : el('input', { type: 'number', inputmode: 'decimal', step: '0.5', placeholder: 'kg', value: s.weight ?? '' });
    const rIn = el('input', { type: 'number', inputmode: 'numeric', placeholder: `${slot.reps[0]}-${slot.reps[1]}`, value: s.reps ?? '' });
    const rirIn = el('select', { style: 'padding:10px 4px;text-align:center' },
      el('option', { value: '' }, '·'),
      [0, 1, 2, 3, 4, 5].map(v => el('option', { value: v, selected: s.rir === v }, String(v))));
    const btn = el('button', { class: 'done-btn' + (s.done ? ' done' : '') }, '✓');
    if (!isBw) wIn.addEventListener('input', () => { s.weight = wIn.value === '' ? null : parseFloat(wIn.value); persist(); });
    rIn.addEventListener('input', () => { s.reps = rIn.value === '' ? null : parseInt(rIn.value, 10); persist(); });
    rirIn.addEventListener('change', () => { s.rir = rirIn.value === '' ? null : parseInt(rirIn.value, 10); persist(); });
    btn.addEventListener('click', () => {
      if (!s.done) {
        if (s.reps == null) { s.reps = slot.reps[1]; rIn.value = s.reps; } // snel loggen: bovengrens
        if (s.rir == null) { s.rir = slot.rir; rirIn.value = s.rir; }     // aanname: volgens plan
        s.done = true; btn.classList.add('done');
        rowEl.classList.add('filled');
        persist();
        navigator.vibrate?.(12);
        refreshProgress(); markActive();
        autoRegulate(s, slot, slotRows, hintEl);
        const partner = partnerOf(si);
        if (partner != null) {
          toast(`⇉ Direct door: ${slots[partner].exercise?.nameNL} — rust komt daarna`);
        } else {
          startRest(slot.rest);
        }
      } else { s.done = false; btn.classList.remove('done'); persist(); }
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
    const huidig = slot.exercise?.difficulty ?? 3;
    // Makkelijkere varianten bovenaan: de meest voorkomende reden om te
    // wisselen is dat een oefening (nog) niet lukt.
    const alts = alternativesFor(slot.ex, inSession)
      .sort((a, b) => ((a.difficulty ?? 3) - huidig) - ((b.difficulty ?? 3) - huidig) || (a.difficulty ?? 3) - (b.difficulty ?? 3));
    const box = el('div', {}, el('h3', {}, 'Andere oefening'),
      el('p', { class: 'tiny dim' }, `In plaats van ${slot.exercise?.nameNL} — zelfde spiergroep, met jouw materiaal. Je sets en reps blijven staan.`));
    if (!alts.length) box.append(el('p', { class: 'dim' }, 'Geen alternatieven gevonden met je huidige materiaal.'));
    const close = sheet(box);
    for (const alt of alts) {
      const d = alt.difficulty ?? 3;
      const label = d < huidig ? el('span', { class: 'pill good' }, 'makkelijker')
        : d > huidig ? el('span', { class: 'pill warn' }, 'zwaarder')
        : el('span', { class: 'pill' }, 'vergelijkbaar');
      box.append(el('div', { class: 'exrow', onclick: () => {
        slots[si] = { ...slot, ex: alt.id, exercise: alt, suggestion: suggestWeight(alt.id, slot.reps), ss: undefined, note: null };
        for (const s of sets) {
          if (s.slotIdx === si && !s.done) { s.ex = alt.id; s.weight = slots[si].suggestion.weight; }
        }
        persist();
        close(); renderAll();
        toast(`⇄ Gewisseld naar ${alt.nameNL}`);
      } },
        el('div', { class: 'grow' },
          el('div', {}, alt.nameNL),
          el('div', { class: 'mus' }, `${MUSCLE_NL[alt.muscle] || alt.muscle} · ${'●'.repeat(d)}${'○'.repeat(5 - d)}`)),
        label));
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
      releaseWake(); tv?.close(); tv = null; stopTv();
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
        st.activeWorkout = null;   // opgeslagen, dus niets meer te hervatten
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

/**
 * Startgewicht bepalen met één testset. Je doet een set met een gewicht dat je
 * aandurft en vertelt hoeveel reps je haalde en hoeveel je er nog over had.
 */
function openCalibrate(slot, est, apply) {
  const wIn = el('input', { type: 'number', inputmode: 'decimal', step: '0.5',
    placeholder: 'kg', value: est?.weight ?? '' });
  const rIn = el('input', { type: 'number', inputmode: 'numeric', placeholder: 'reps' });
  const rirIn = el('select', {}, [0, 1, 2, 3, 4, 5].map(v =>
    el('option', { value: v, selected: v === 2 }, v === 0 ? '0 — niets meer' : `${v} reps over`)));
  const out = el('div', { class: 'mt' });
  const calc = el('button', { class: 'btn-primary btn-block mt' }, 'Bereken werkgewicht');

  const close = sheet(el('div', {},
    el('h3', {}, 'Startgewicht bepalen'),
    el('p', { class: 'tiny dim' }, `${slot.exercise?.nameNL || slot.ex} — doe één testset met een gewicht dat je zeker aankunt. Stop als je nog een paar reps over hebt; het hoeft niet tot falen.`),
    el('label', {}, 'Gewicht van je testset'), wIn,
    el('label', {}, 'Hoeveel reps haalde je?'), rIn,
    el('label', {}, 'Hoeveel had je er nog over?'), rirIn,
    calc, out));

  calc.addEventListener('click', () => {
    const r = calibrate({ weight: wIn.value, reps: rIn.value, rir: rirIn.value, repRange: slot.reps });
    if (!r) return toast('Vul gewicht en reps in');
    out.innerHTML = '';
    out.append(el('div', { class: 'card raised' },
      el('div', { class: 'spread' },
        el('span', { class: 'tiny dim' }, `Werkgewicht voor ${r.midReps} reps`),
        el('span', { style: 'font-size:1.5rem;color:var(--accent);font-weight:700' }, `${r.weight} kg`)),
      el('p', { class: 'tiny dim mt mb0' }, r.why),
      !r.confident ? el('p', { class: 'tiny mb0', style: 'color:var(--warn)' },
        'Neem dit met een korrel zout — begin liever iets lichter en laat de app het de komende sessies bijstellen.') : null,
      el('button', { class: 'btn-primary btn-block mt', onclick: () => {
        apply(r.weight);
        close(); toast(`Werksets op ${r.weight} kg gezet`);
      } }, `✓ Gebruik ${r.weight} kg`)));
  });
}
