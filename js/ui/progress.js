// Progressie: weekvolume vs doelen, fitness/vorm-grafiek, per-oefening progressie

import { el, fmtDate, sheet, toast, cardHead, explain, bodyMap, statRow, ICO } from './common.js';
import { get, S, update, todayISO } from '../state.js';
import { weeklyVolume, VOLUME_TARGETS, weightTrend, detectPlateaus, rebuildLastWeights, exerciseHistory, exercisePRs, e1rm, volumeHistory, effortQuality, muscleStatus } from '../engine.js';
import { MUSCLE_NL, byId } from '../data/exercises.js';
import { SESSIONS } from '../data/program.js';
import * as icu from '../icu.js';

// Serie-kleuren: gevalideerd (CVD + contrast) op donker oppervlak
const C_CTL = '#1aa68f'; // Fitness (CTL)
const C_ATL = '#cb7c36'; // Vermoeidheid (ATL)

export function renderProgress(app, ctx) {
  app.append(el('div', { class: 'hero' }, el('h2', { class: 'mb0' }, 'Progressie')));

  // --- Inspanningskwaliteit (RIR) ---
  const eq = effortQuality(14);
  if (eq) {
    app.append(el('div', { class: 'card' },
      cardHead(ICO.bolt, 'Inspanning (14 dagen)',
        el('span', { class: 'pill ' + (eq.pctEffective >= 70 ? 'good' : 'warn') }, `${eq.pctEffective}% effectief`)),
      statRow([
        { n: eq.total, l: 'sets met RIR' },
        { n: eq.pctEffective + '%', l: 'in de zone', accent: eq.pctEffective >= 70 },
        { n: eq.pctFailure + '%', l: 'tegen falen' },
      ]),
      el('p', { class: 'tiny mt mb0', style: eq.pctEffective >= 70 ? 'color:var(--primary)' : 'color:var(--warn)' }, eq.advice),
      explain('Waarom dit telt', el('p', { class: 'mb0' },
        'Je rapport noemt sets met 5+ reps in reserve "junk volume": ze kosten tijd en herstel, maar geven te weinig prikkel om te groeien. Sets met RIR 0-3 zitten in de effectieve zone; de laatste set van elke oefening mag richting RIR 0-1. Hoe eerlijker je je RIR logt, hoe beter de app je volgende gewicht kiest.'))));
  }

  // --- Spierkaart ---
  const volNow = weeklyVolume(todayISO());
  const lv = {};
  for (const [m, [lo, hi]] of Object.entries(VOLUME_TARGETS)) {
    const v = volNow[m] || 0;
    lv[m] = v === 0 ? 0 : v < lo ? 1 : v <= hi ? 2 : 3;
  }
  if (get().logs.length) {
    app.append(el('div', { class: 'card' },
      cardHead(ICO.body, 'Spiergroepen deze week'),
      bodyMap(lv, { height: 168 }),
      el('div', { class: 'bodylegend' },
        el('span', {}, el('i', { style: 'background:rgba(255,255,255,.05)' }), 'niet'),
        el('span', {}, el('i', { style: 'background:rgba(25,135,117,.45)' }), 'onder doel'),
        el('span', {}, el('i', { style: 'background:rgba(56,237,208,.55)' }), 'op doel'),
        el('span', {}, el('i', { style: 'background:rgba(56,237,208,.95)' }), 'boven doel'))));
  }

  // --- Weekvolume per spiergroep ---
  const vol = weeklyVolume(todayISO());
  const volCard = el('div', { class: 'card' }, el('h4', {}, 'Weekvolume (sets per spiergroep)'));
  const entries = Object.entries(VOLUME_TARGETS);
  for (const [muscle, [lo, hi]] of entries) {
    const v = Math.round((vol[muscle] || 0) * 10) / 10;
    const pct = Math.min(100, (v / hi) * 100);
    const cls = v > hi ? 'over' : v >= lo ? 'good' : '';
    volCard.append(el('div', { class: 'bar' },
      el('span', { class: 'nm' }, MUSCLE_NL[muscle] || muscle),
      el('div', { class: 'track' }, el('div', { class: `fill ${cls}`, style: `width:${pct}%` })),
      el('span', { class: 'val' }, `${v} / ${lo}-${hi}`)));
  }
  volCard.append(explain('Over deze doelen', el('p', { class: 'mb0' }, 'Doelen uit je rapport: borst 12-16, armen 8-12 werksets per week. Groen = in de sweet spot, geel = boven de MRV-grens (meer is dan niet beter).')));
  app.append(volCard);

  // --- Volume-historie (8 weken, per spiergroep) ---
  if (get().logs.length) {
    let volMuscle = 'chest';
    const volHistCard = el('div', { class: 'card' });
    const drawVolHist = () => {
      volHistCard.innerHTML = '';
      volHistCard.append(el('h4', {}, 'Volume-historie (8 weken)'));
      volHistCard.append(el('div', { class: 'filterbar' },
        Object.keys(VOLUME_TARGETS).map(m => el('span', {
          class: 'pill' + (m === volMuscle ? ' on' : ''),
          onclick: () => { volMuscle = m; drawVolHist(); },
        }, MUSCLE_NL[m] || m))));
      const hist = volumeHistory(volMuscle, 8);
      const [lo, hi] = VOLUME_TARGETS[volMuscle];
      const maxV = Math.max(hi + 2, ...hist.map(h => h.sets));
      for (const h of hist) {
        const pct = Math.min(100, (h.sets / maxV) * 100);
        const cls = h.sets > hi ? 'over' : h.sets >= lo ? 'good' : '';
        volHistCard.append(el('div', { class: 'bar' },
          el('span', { class: 'nm' }, `wk ${h.monday.slice(5)}${h.current ? ' ←' : ''}`),
          el('div', { class: 'track' }, el('div', { class: `fill ${cls}`, style: `width:${pct}%` })),
          el('span', { class: 'val' }, `${h.sets}`)));
      }
      const cur = hist[hist.length - 1];
      if (cur && cur.sets > hi) {
        volHistCard.append(el('p', { class: 'tiny mt mb0', style: 'color:var(--warn)' },
          `⚠ Deze week ${cur.sets} sets ${MUSCLE_NL[volMuscle].toLowerCase()} — boven de MRV-grens (${hi}). Meer is hier niet beter: junk volume, gewrichtsstress en stagnatie liggen op de loer.`));
      } else {
        volHistCard.append(el('p', { class: 'tiny dim mt mb0' }, `Doelzone ${MUSCLE_NL[volMuscle].toLowerCase()}: ${lo}-${hi} sets/week.`));
      }
    };
    drawVolHist();
    app.append(volHistCard);
  }

  // --- intervals.icu fitness/vorm ---
  const icuBox = el('div');
  app.append(icuBox);
  const drawIcu = (cache) => {
    icuBox.innerHTML = '';
    if (!icu.isConfigured()) {
      icuBox.append(el('div', { class: 'card' }, el('h4', {}, 'Fitness & vorm'),
        el('p', { class: 'tiny dim mb0' }, 'Koppel intervals.icu in Instellingen om hier je fitness (CTL), vermoeidheid (ATL) en vorm te zien.')));
      return;
    }
    const w = (cache?.wellness || []).filter(x => x.ctl != null).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    if (!w.length) { icuBox.append(el('div', { class: 'card' }, el('p', { class: 'tiny dim mb0' }, 'Nog geen wellness-data opgehaald.'))); return; }

    const form = icu.form(cache);
    const card = el('div', { class: 'card' },
      el('div', { class: 'spread' },
        el('h4', { class: 'mb0' }, 'Fitness & vorm (42 dagen)'),
        el('span', { class: 'pill ' + (form <= -12 ? 'warn' : form >= 5 ? 'good' : '') }, `vorm ${form > 0 ? '+' + form : form}`)));
    card.append(lineChart(w));
    card.append(el('div', { class: 'row mt tiny' },
      el('span', {}, el('span', { style: `color:${C_CTL}` }, '━'), ' Fitness (CTL)'),
      el('span', {}, el('span', { style: `color:${C_ATL}` }, '━'), ' Vermoeidheid (ATL)')));
    card.append(explain('Wat betekent vorm?', el('p', { class: 'mb0' }, 'Vorm = fitness (CTL) − vermoeidheid (ATL), rechtstreeks uit intervals.icu. Onder −12 plant de app automatisch lichter, onder −25 schrijft hij rust voor, en bij vijf dagen gemiddeld onder −15 komt je deloadweek naar voren.')));
    icuBox.append(card);
  };
  drawIcu(get().icuCache);
  if (icu.isConfigured()) icu.refresh().then(drawIcu).catch(() => {});

  // --- Gewicht & recomp ---
  const wBox = el('div');
  app.append(wBox);
  const drawWeight = (cache) => {
    wBox.innerHTML = '';
    const trend = weightTrend(cache);
    const card = el('div', { class: 'card' }, el('h4', {}, 'Gewicht & recomp'));
    if (trend.latest) {
      card.append(el('div', { class: 'statgrid' },
        el('div', { class: 'stat' }, el('div', { class: 'v' }, trend.latest.kg.toFixed(1)), el('div', { class: 'l' }, 'laatste (kg)')),
        el('div', { class: 'stat' }, el('div', { class: 'v' }, trend.nowAvg ? trend.nowAvg.toFixed(1) : '—'), el('div', { class: 'l' }, '7d gemiddeld')),
        el('div', { class: 'stat' }, el('div', { class: 'v' }, trend.pctPerWeek != null ? `${trend.pctPerWeek > 0 ? '+' : ''}${trend.pctPerWeek.toFixed(2)}%` : '—'), el('div', { class: 'l' }, 'per week'))));
      if (trend.series.length >= 3) card.append(weightChart(trend.series));
    } else {
      card.append(el('p', { class: 'tiny dim' }, 'Nog geen gewichtsdata. Log je gewicht in intervals.icu (wellness) of hieronder — een paar keer per week wegen is genoeg voor een betrouwbare trend.'));
    }
    if (trend.message) {
      card.append(el('p', { class: 'tiny mt', style: trend.status === 'too_fast' || trend.status === 'stalled' ? 'color:var(--warn)' : 'color:var(--primary)' }, trend.message));
    }
    // lichaamsmaten (maandcheck)
    const meas = Object.entries(get().measurements || {}).sort((a, b) => a[0].localeCompare(b[0]));
    if (meas.length) {
      const last = meas[meas.length - 1];
      const prev = meas.length > 1 ? meas[meas.length - 2] : null;
      const delta = prev && prev[1].waist && last[1].waist ? (last[1].waist - prev[1].waist) : null;
      card.append(el('div', { class: 'spread mt', style: 'padding:5px 0;border-top:1px solid var(--border)' },
        el('span', { class: 'tiny dim' }, 'Taille (maandcheck)'),
        el('span', { class: 'tiny', style: 'color:var(--primary)' },
          `${last[1].waist} cm${delta != null ? ` (${delta > 0 ? '+' : ''}${delta.toFixed(1)} t.o.v. vorige)` : ''}`)));
    }

    // handmatige weging
    const wIn = el('input', { type: 'number', step: '0.1', inputmode: 'decimal', placeholder: 'kg', style: 'width:100px' });
    card.append(el('div', { class: 'row mt' }, wIn,
      el('button', { class: 'btn-sm btn-secondary', onclick: () => {
        const kg = parseFloat(wIn.value);
        if (!kg || kg < 30 || kg > 250) return toast('Vul een gewicht in kg in');
        update(s => { s.weights[todayISO()] = kg; });
        toast('Gewicht gelogd'); ctx.render();
      } }, '+ Weeg-moment loggen')));
    wBox.append(card);
  };
  drawWeight(get().icuCache);

  // --- Plateaus ---
  const plateaus = detectPlateaus();
  if (plateaus.length) {
    app.append(el('div', { class: 'card', style: 'border-color:var(--warn)' },
      el('h4', {}, '⚠ Plateaus'),
      plateaus.map(p => el('div', { style: 'padding:6px 0;border-bottom:1px solid var(--border)' },
        el('div', {}, p.exercise?.nameNL || p.ex),
        el('div', { class: 'tiny dim' }, p.advice)))));
  }

  // --- Per-oefening laatste prestaties ---
  const lw = get().lastWeights;
  const exIds = Object.keys(lw).sort((a, b) => (lw[b].date || '').localeCompare(lw[a].date || ''));
  const exCard = el('div', { class: 'card' }, el('h4', {}, 'Per oefening'));
  if (!exIds.length) exCard.append(el('p', { class: 'tiny dim mb0' }, 'Nog geen workouts gelogd — na je eerste sessie zie je hier per oefening je progressie, e1RM en PR\'s.'));
  for (const id of exIds.slice(0, 20)) {
    const e = byId[id]; const p = lw[id];
    exCard.append(el('div', { class: 'exrow', onclick: () => openExerciseProgress(id) },
      el('div', { class: 'grow' },
        el('div', {}, e?.nameNL || id),
        el('div', { class: 'mus' }, `laatste: ${p.reps} reps${p.weight ? ' × ' + p.weight + ' kg' : ''}`)),
      el('span', { class: 'dim' }, '📈')));
  }
  app.append(exCard);

  // --- Historie (klikbaar: bekijken, bewerken, verwijderen) ---
  const logs = [...get().logs].reverse().slice(0, 15);
  const histCard = el('div', { class: 'card' }, el('h4', {}, 'Laatste workouts'));
  if (!logs.length) histCard.append(el('p', { class: 'tiny dim mb0' }, 'Nog niets gelogd.'));
  for (const l of logs) {
    const setCount = l.sets.filter(s => s.done).length;
    const tonnage = Math.round(l.sets.reduce((t, s) => t + (s.done ? (s.weight || 0) * (s.reps || 0) : 0), 0));
    const sessName = SESSIONS[l.sessionId]?.name?.split('·')[1]?.trim() || (l.sessionId === 'adhoc' ? 'Vrije workout' : l.sessionId);
    histCard.append(el('div', { class: 'exrow', onclick: () => openLog(l, ctx) },
      el('div', { class: 'grow' },
        el('div', {}, `${fmtDate(l.date)} · ${sessName}`),
        el('div', { class: 'mus' }, `${setCount} sets · ${Math.round(l.durationSec / 60)} min${tonnage ? ' · ' + tonnage + ' kg' : ''}${l.icuActivityId ? ' · ↑ intervals.icu' : ''}${l.note ? ' · 📝' : ''}`)),
      el('span', { class: 'dim' }, '›')));
  }
  app.append(histCard);
}

/** Log-detail: sets bewerken, notitie, verwijderen. */
function openLog(log, ctx) {
  const box = el('div', {}, el('h3', {}, fmtDate(log.date)));
  const inputs = [];
  let currentEx = null;
  for (const s of log.sets) {
    if (s.ex !== currentEx) {
      currentEx = s.ex;
      box.append(el('h5', { class: 'mt' }, byId[s.ex]?.nameNL || s.ex));
    }
    const wIn = el('input', { type: 'number', step: '0.5', value: s.weight ?? '', placeholder: 'kg' });
    const rIn = el('input', { type: 'number', value: s.reps ?? '', placeholder: 'reps' });
    inputs.push({ s, wIn, rIn });
    box.append(el('div', { class: 'setrow', style: 'grid-template-columns:44px 1fr 1fr' },
      el('span', { class: 'setnum' }, `Set ${s.set}`), wIn, rIn));
  }
  const noteIn = el('textarea', { rows: 2, placeholder: 'Notitie' });
  noteIn.value = log.note || '';
  box.append(el('label', {}, 'Notitie'), noteIn);

  const saveBtn = el('button', { class: 'btn-primary btn-block mt' }, '✓ Wijzigingen opslaan');
  const delBtn = el('button', { class: 'btn-danger btn-block mt' }, 'Workout verwijderen');
  box.append(saveBtn, delBtn);
  const close = sheet(box);

  saveBtn.addEventListener('click', () => {
    update(st => {
      const l = st.logs.find(x => x.id === log.id);
      if (!l) return;
      for (const { s, wIn, rIn } of inputs) {
        const target = l.sets.find(x => x.ex === s.ex && x.set === s.set);
        if (target) {
          target.weight = wIn.value === '' ? null : parseFloat(wIn.value);
          target.reps = rIn.value === '' ? null : parseInt(rIn.value, 10);
          target.done = !!target.reps;
        }
      }
      l.note = noteIn.value.trim() || null;
      rebuildLastWeights(st);
    });
    close(); toast('Workout bijgewerkt'); ctx.render();
  });

  delBtn.addEventListener('click', async () => {
    if (!confirm('Deze workout verwijderen?')) return;
    const icuId = log.icuActivityId;
    update(st => {
      st.logs = st.logs.filter(x => x.id !== log.id);
      rebuildLastWeights(st);
    });
    if (icuId) icu.deleteActivity(icuId).catch(() => {});
    close(); toast('Workout verwijderd'); ctx.render();
  });
}

/** Per-oefening progressie: e1RM/reps-grafiek + PR's. Ook gebruikt vanuit de bibliotheek. */
export function openExerciseProgress(exId) {
  const ex = byId[exId];
  const hist = exerciseHistory(exId);
  const prs = exercisePRs(exId);
  const box = el('div', {}, el('h3', {}, ex?.nameNL || exId));
  if (!hist.length) {
    box.append(el('p', { class: 'dim' }, 'Nog geen sets gelogd voor deze oefening.'));
    sheet(box); return;
  }
  const weighted = hist.some(h => h.e1rm);
  box.append(el('p', { class: 'tiny dim' }, weighted
    ? 'Geschatte 1RM (Epley) per sessie — de eerlijkste maat voor krachtprogressie over reps én gewicht heen.'
    : 'Beste aantal reps per sessie.'));
  const series = hist.map(h => ({ iso: h.date, kg: weighted ? (h.e1rm || 0) : h.reps }));
  if (series.length >= 2) box.append(weightChart(series));
  else box.append(el('p', { class: 'tiny dim' }, `Eén meting: ${weighted ? hist[0].e1rm + ' kg e1RM' : hist[0].reps + ' reps'} — na je volgende sessie verschijnt hier de grafiek.`));
  if (prs) {
    box.append(el('h5', { class: 'mt' }, '🏆 Records'));
    const rows = [];
    if (prs.maxW.weight) rows.push(['Zwaarste gewicht', `${prs.maxW.weight} kg × ${prs.maxW.reps} (${prs.maxW.date.slice(5)})`]);
    if (prs.maxE) rows.push(['Beste e1RM', `${prs.maxE.e1rm} kg (${prs.maxE.date.slice(5)})`]);
    rows.push(['Meeste reps', `${prs.maxReps.reps}${prs.maxReps.weight ? ' × ' + prs.maxReps.weight + ' kg' : ''} (${prs.maxReps.date.slice(5)})`]);
    rows.push(['Sessies gelogd', String(prs.count)]);
    for (const [k, v] of rows) box.append(el('div', { class: 'spread', style: 'padding:5px 0;border-bottom:1px solid var(--border)' },
      el('span', { class: 'tiny dim' }, k), el('span', { class: 'tiny', style: 'color:var(--primary)' }, v)));
  }
  sheet(box);
}

/** Compacte gewichtstrend-chart (één serie). */
function weightChart(series) {
  const W = 520, H = 120, P = { l: 38, r: 10, t: 10, b: 18 };
  const last90 = series.slice(-90);
  const kgs = last90.map(p => p.kg);
  const yMin = Math.floor(Math.min(...kgs) - 0.5), yMax = Math.ceil(Math.max(...kgs) + 0.5);
  const x = i => P.l + (i / Math.max(1, last90.length - 1)) * (W - P.l - P.r);
  const y = v => H - P.b - ((v - yMin) / Math.max(0.1, yMax - yMin)) * (H - P.t - P.b);
  const path = last90.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join('');
  const dots = last90.length <= 30 ? last90.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="2.5" fill="${C_CTL}"/>`).join('') : '';
  return el('div', { class: 'chart', style: 'height:120px', html:
    `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" role="img" aria-label="Gewichtstrend">
      <line x1="${P.l}" y1="${y(yMin)}" x2="${W - P.r}" y2="${y(yMin)}" stroke="var(--border)"/>
      <line x1="${P.l}" y1="${y(yMax)}" x2="${W - P.r}" y2="${y(yMax)}" stroke="var(--border)"/>
      <text x="${P.l - 6}" y="${y(yMin) + 3}" text-anchor="end" font-size="9" fill="var(--text-dim)">${yMin}</text>
      <text x="${P.l - 6}" y="${y(yMax) + 3}" text-anchor="end" font-size="9" fill="var(--text-dim)">${yMax}</text>
      <path d="${path}" fill="none" stroke="${C_CTL}" stroke-width="2" stroke-linejoin="round"/>
      ${dots}
      <text x="${P.l}" y="${H - 4}" font-size="9" fill="var(--text-dim)">${last90[0].iso.slice(5)}</text>
      <text x="${W - P.r}" y="${H - 4}" text-anchor="end" font-size="9" fill="var(--text-dim)">${last90[last90.length - 1].iso.slice(5)}</text>
    </svg>` });
}

/** Kleine SVG-lijnchart voor CTL/ATL met tap-tooltip. */
function lineChart(wellness) {
  const W = 520, H = 170, P = { l: 30, r: 10, t: 10, b: 20 };
  const xs = wellness.map((_, i) => i);
  const all = wellness.flatMap(d => [d.ctl || 0, d.atl || 0]);
  const yMax = Math.max(10, Math.ceil(Math.max(...all) / 10) * 10);
  const x = i => P.l + (i / Math.max(1, xs.length - 1)) * (W - P.l - P.r);
  const y = v => H - P.b - (v / yMax) * (H - P.t - P.b);

  const path = key => wellness.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key] || 0).toFixed(1)}`).join('');
  const gridLines = [0, 0.5, 1].map(f => {
    const v = Math.round(yMax * f);
    return `<line x1="${P.l}" y1="${y(v)}" x2="${W - P.r}" y2="${y(v)}" stroke="var(--border)" stroke-width="1"/>
            <text x="${P.l - 6}" y="${y(v) + 3}" text-anchor="end" font-size="9" fill="var(--text-dim)">${v}</text>`;
  }).join('');

  const first = wellness[0]?.id, last = wellness[wellness.length - 1]?.id;
  const svg = el('div', { class: 'chart', html:
    `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" role="img" aria-label="Fitness en vermoeidheid over 42 dagen">
      ${gridLines}
      <path d="${path('ctl')}" fill="none" stroke="${C_CTL}" stroke-width="2" stroke-linejoin="round"/>
      <path d="${path('atl')}" fill="none" stroke="${C_ATL}" stroke-width="2" stroke-linejoin="round"/>
      <text x="${P.l}" y="${H - 6}" font-size="9" fill="var(--text-dim)">${String(first).slice(5)}</text>
      <text x="${W - P.r}" y="${H - 6}" text-anchor="end" font-size="9" fill="var(--text-dim)">${String(last).slice(5)}</text>
      <line id="cross" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" stroke="var(--text-dim)" stroke-width="1" opacity="0"/>
      <text id="tip" x="0" y="${P.t + 8}" font-size="10" fill="var(--text)" opacity="0"></text>
    </svg>` });

  const node = svg.querySelector('svg');
  node.addEventListener('pointermove', ev => {
    const rect = node.getBoundingClientRect();
    const px = (ev.clientX - rect.left) / rect.width * W;
    const i = Math.max(0, Math.min(xs.length - 1, Math.round((px - P.l) / (W - P.l - P.r) * (xs.length - 1))));
    const d = wellness[i];
    const cross = node.querySelector('#cross'), tip = node.querySelector('#tip');
    cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', '.6');
    tip.textContent = `${String(d.id).slice(5)} · CTL ${Math.round(d.ctl)} · ATL ${Math.round(d.atl)}`;
    const anchor = x(i) > W * 0.6 ? 'end' : 'start';
    tip.setAttribute('text-anchor', anchor);
    tip.setAttribute('x', anchor === 'end' ? x(i) - 6 : x(i) + 6);
    tip.setAttribute('opacity', '1');
  });
  node.addEventListener('pointerleave', () => {
    node.querySelector('#cross').setAttribute('opacity', '0');
    node.querySelector('#tip').setAttribute('opacity', '0');
  });
  return svg;
}
