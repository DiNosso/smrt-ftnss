// De "hardcoded slimmigheid": wachtrij-planner, mesocyclus, readiness-regels,
// spierherstel, plateau-detectie, progressie en recomp-bewaking.

import { SESSIONS, DELOAD, PROGRESSION } from './data/program.js';
import { byId, EXERCISES } from './data/exercises.js';
import { get, S, todayISO, addDays } from './state.js';
import * as icu from './icu.js';

// ---------- Custom data (eigen oefeningen + bewerkte sessies) ----------
// Bij het opstarten worden custom oefeningen en sessie-aanpassingen uit de
// lokale opslag in de (muteerbare) modules gemengd.

export function applyCustomData() {
  const st = get();
  for (const ce of (st.customExercises || [])) {
    if (!byId[ce.id]) EXERCISES.push(ce);
    byId[ce.id] = ce;
  }
  for (const [id, ov] of Object.entries(st.sessionOverrides || {})) {
    if (SESSIONS[id]) SESSIONS[id] = { ...SESSIONS[id], ...ov };
  }
}

// ---------- Datums & weken ----------

export function mondayOf(iso) {
  const d = new Date(iso + 'T12:00:00');
  const dow = (d.getDay() + 6) % 7; // 0 = maandag
  return addDays(iso, -dow);
}

export function weekNumber(iso) {
  const start = S().programStart;
  if (!start) return 1;
  const diff = (new Date(mondayOf(iso)) - new Date(mondayOf(start))) / 86400000;
  return Math.max(1, Math.round(diff / 7) + 1);
}

function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }

// ---------- Mesocyclus (blok van 5 weken: MEV → MRV → deload) ----------

export function mesoInfo(iso) {
  const wk = weekNumber(iso);
  const pos = (wk - 1) % 5; // 0..4
  const FACTORS = [0.85, 1.0, 1.1, 1.2, DELOAD.setFactor];
  const RIR = [1, 0, 0, 0, DELOAD.rirBonus];
  const LABELS = [
    'Opbouwweek 1 — rustig starten (~MEV), techniek scherp',
    'Opbouwweek 2 — normaal volume',
    'Opbouwweek 3 — volume omhoog richting MRV',
    'Opbouwweek 4 — piekweek: maximaal productief volume',
    DELOAD.note,
  ];
  return { week: wk, pos, isDeload: pos === 4, setFactor: FACTORS[pos], rirBonus: RIR[pos], label: LABELS[pos] };
}

export function isDeloadWeek(iso) { return mesoInfo(iso).isDeload; }

// ---------- Spierherstel uit logs ----------

/** Per spiergroep: tot wanneer (ms epoch) nog niet hersteld, o.b.v. logs t/m gisteren. */
export function muscleRecoveryMap(uptoIso, extraSim = []) {
  const map = {}; // muscle -> readyAt (ms)
  const consider = [...get().logs, ...extraSim];
  for (const log of consider) {
    if (log.date > uptoIso) continue;
    const perMuscle = {}; // muscle -> {hours, sets}
    for (const s of (log.sets || [])) {
      if (!s.done) continue;
      const ex = byId[s.ex];
      if (!ex || !ex.recoveryHours) continue;
      const m = ex.muscle;
      perMuscle[m] = perMuscle[m] || { hours: 0, sets: 0 };
      perMuscle[m].hours = Math.max(perMuscle[m].hours, ex.recoveryHours);
      perMuscle[m].sets += 1;
    }
    // gesimuleerde (toekomstige) sessies: focus-spieren standaard 44u
    if (log.simFocus) for (const m of log.simFocus) perMuscle[m] = { hours: 44, sets: 4 };
    const start = new Date(log.date + 'T19:00:00').getTime(); // aanname: training 's avonds
    for (const [m, info] of Object.entries(perMuscle)) {
      const extra = info.sets >= 6 ? 12 : 0; // veel sets → langer herstel
      const readyAt = start + (info.hours + extra) * 3600000;
      map[m] = Math.max(map[m] || 0, readyAt);
    }
  }
  // check-in spierpijn overschrijft de theoretische klok:
  // niveau 1 = morgen pas weer, niveau 2 = overmorgen pas weer
  for (const [d, ci] of Object.entries(get().checkins || {})) {
    if (d > uptoIso || daysBetween(d, uptoIso) > 3) continue;
    for (const [m, level] of Object.entries(ci.soreness || {})) {
      if (!level) continue;
      const readyAt = new Date(addDays(d, level) + 'T08:00:00').getTime();
      map[m] = Math.max(map[m] || 0, readyAt);
    }
  }
  return map;
}

export function muscleStatus(iso = todayISO()) {
  const map = muscleRecoveryMap(iso);
  const now = Date.now();
  const groups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'core', 'quadriceps'];
  return groups.map(m => {
    const readyAt = map[m] || 0;
    const hoursLeft = Math.max(0, Math.ceil((readyAt - now) / 3600000));
    return { muscle: m, ready: hoursLeft === 0, hoursLeft };
  });
}

function sessionMusclesReady(session, dayIso, recMap) {
  const dayEnd = new Date(dayIso + 'T18:00:00').getTime();
  return session.focus.every(m => (recMap[m] || 0) <= dayEnd);
}

// ---------- Geplande andere sporten (handmatig + intervals.icu-kalender) ----------

const LEG_SPORTS = ['Ride', 'VirtualRide', 'Run', 'TrailRun', 'Hike', 'Padel', 'Tennis', 'Soccer'];

export const SPORT_CHOICES = [
  { type: 'Swim', label: '🏊 Zwemmen' },
  { type: 'Ride', label: '🚴 Fietsen' },
  { type: 'Padel', label: '🎾 Padel' },
  { type: 'Run', label: '🏃 Hardlopen' },
  { type: 'Walk', label: '🚶 Wandelen' },
  { type: 'Workout', label: '⭐ Anders' },
];

/** Geplande sporten op een dag: zelf ingepland + intervals.icu-kalender. */
export function plannedOn(iso) {
  const manual = (get().plannedSports || {})[iso] || [];
  const fromIcu = icu.plannedEventsOn(get().icuCache, iso);
  return [...manual, ...fromIcu];
}

function plannedSummary(iso) {
  const p = plannedOn(iso);
  return {
    any: p.length > 0,
    hard: p.some(x => x.hard),
    legHard: p.some(x => x.hard && LEG_SPORTS.includes(x.type)),
    list: p,
  };
}

// ---------- Wachtrij-planner ----------
// Geen vaste weekdagen meer: A→B→C-cyclus op basis van wat er echt gedaan is.
// Gemiste sessies schuiven vanzelf op; doel = 3 zware sessies per week, liefst om de dag.

const HEAVY_CYCLE = ['sessionA', 'sessionB', 'sessionC'];

function heavyLogs() {
  return get().logs
    .filter(l => SESSIONS[l.sessionId]?.type === 'heavy' && (l.sets || []).some(s => s.done))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function nextInCycle(lastId) {
  if (!lastId) return HEAVY_CYCLE[0];
  const i = HEAVY_CYCLE.indexOf(lastId);
  return HEAVY_CYCLE[(i + 1) % HEAVY_CYCLE.length];
}

/**
 * Simuleer de planning van vandaag t/m `targetIso`.
 * Retourneert per dag {iso, sessionId, reason} — verleden komt uit de logs.
 */
export function schedule(targetIso, fromIso = todayISO()) {
  const out = [];
  const hlogs = heavyLogs();
  let lastHeavyDate = hlogs.length ? hlogs[hlogs.length - 1].date : null;
  let lastHeavyId = hlogs.length ? hlogs[hlogs.length - 1].sessionId : null;
  let lastSnackId = null;
  const sim = []; // gesimuleerde "logs" voor herstel-berekening

  // zware sessies per week (echte logs)
  const heavyByWeek = {};
  for (const l of hlogs) {
    const wk = mondayOf(l.date);
    heavyByWeek[wk] = (heavyByWeek[wk] || 0) + 1;
  }

  let cursor = fromIso;
  while (cursor <= targetIso) {
    const swap = get().swaps[cursor];
    let pick, reason = '';
    if (swap && SESSIONS[swap]) {
      pick = swap;
      reason = 'handmatig gekozen';
    } else {
      const wkKey = mondayOf(cursor);
      const heavyCount = heavyByWeek[wkKey] || 0;
      const need = Math.max(0, 3 - heavyCount);
      const dow = (new Date(cursor + 'T12:00:00').getDay() + 6) % 7; // 0=ma
      const remaining = 7 - dow;
      const gap = lastHeavyDate ? daysBetween(lastHeavyDate, cursor) : 99;
      const candidate = nextInCycle(lastHeavyId);
      const recMap = muscleRecoveryMap(cursor, sim);
      const planToday = plannedSummary(cursor);
      const planTomorrow = plannedSummary(addDays(cursor, 1));
      const hasQuads = SESSIONS[candidate].focus.includes('quadriceps');
      let eligible = sessionMusclesReady(SESSIONS[candidate], cursor, recMap);
      // beenwerk niet op/rond een stevige benen-sportdag
      if (hasQuads && (planToday.legHard || planTomorrow.legHard)) eligible = false;
      const mustCatchUp = need >= remaining; // anders haal je de 3 niet meer
      if (need > 0 && eligible && !planToday.hard && (gap >= 2 || mustCatchUp)) {
        pick = candidate;
        reason = mustCatchUp && gap < 2 ? 'inhaalsessie (weekdoel)' : (gap >= 7 ? 'opgeschoven sessie' : '');
      } else if (planToday.hard) {
        pick = 'snackMobility';
        const nm = planToday.list.map(p => icu.TYPE_NL[p.type] || p.type).join(', ').toLowerCase();
        reason = `${nm} gepland — kracht schuift op`;
      } else if (need > 0 && !eligible) {
        pick = lastSnackId === 'snackCore' ? 'snackPump' : 'snackCore';
        reason = (hasQuads && planTomorrow.legHard) ? 'morgen zware benen-sport — beenwerk schuift op' : 'spieren nog niet hersteld — zware sessie schuift op';
      } else if (dow === 6) {
        pick = 'rest';
      } else {
        pick = lastSnackId === 'snackCore' ? 'snackPump' : 'snackCore';
      }
    }
    out.push({ iso: cursor, sessionId: pick, reason });
    // bijwerken van sim-status
    const sess = SESSIONS[pick];
    if (sess.type === 'heavy') {
      const wkKey = mondayOf(cursor);
      heavyByWeek[wkKey] = (heavyByWeek[wkKey] || 0) + 1;
      lastHeavyDate = cursor; lastHeavyId = pick;
      sim.push({ date: cursor, sets: [], simFocus: sess.focus });
    } else if (sess.type === 'snack') {
      lastSnackId = pick;
    }
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** Geplande sessie voor vandaag of een toekomstige dag. */
export function plannedSession(iso) {
  const today = todayISO();
  if (iso < today) return null; // verleden = logs
  const day = schedule(iso, today).pop();
  return { session: SESSIONS[day.sessionId], reason: day.reason };
}

// ---------- Readiness-regels ----------

/**
 * Advies voor vandaag: sessie + niveau + redenen + aanpassingen.
 * level: 'go' | 'lighter' | 'easy' | 'rest'
 */
export function advise(iso, cache) {
  const planned = plannedSession(iso);
  const base = planned.session;
  const reasons = [];
  let level = 'go';
  const bump = (to) => { const order = ['go', 'lighter', 'easy', 'rest']; if (order.indexOf(to) > order.indexOf(level)) level = to; };

  if (planned.reason) reasons.push(`Planner: ${planned.reason}.`);

  // 1. Handmatig
  const tired = get().tired[iso];
  if (tired === 'kapot') { reasons.push('Je hebt aangegeven dat je kapot bent.'); bump('rest'); }
  else if (tired === 'moe') { reasons.push('Je hebt aangegeven dat je moe bent.'); bump('lighter'); }

  // 1b. Dagelijkse check-in (motivatie, slaap-fallback, spierpijn)
  const checkin = get().checkins?.[iso];
  if (checkin) {
    if (checkin.motivation != null && checkin.motivation <= 2) {
      reasons.push(checkin.motivation === 1
        ? 'Motivatie op 1 — een korte, lichtere sessie is vandaag een overwinning. Begin gewoon; stoppen mag altijd.'
        : 'Motivatie is laag — iets lichter trainen houdt de gewoonte heel.');
      bump('lighter');
    }
    const soreFocus = base.focus.filter(m => (checkin.soreness || {})[m]);
    if (soreFocus.length && base.type === 'heavy') {
      reasons.push(`Spierpijn gemeld in ${soreFocus.length} van de spiergroepen van deze sessie — de planner heeft hier rekening mee gehouden.`);
    }
  }

  // 2. Vorm (CTL−ATL)
  const form = icu.form(cache);
  if (form != null) {
    if (form <= -25) { reasons.push(`Je vorm is ${form} — diep in de vermoeidheid.`); bump('rest'); }
    else if (form <= -12) { reasons.push(`Je vorm is ${form} — je draagt duidelijke vermoeidheid mee.`); bump('lighter'); }
  }

  // 3. Slaap (uit intervals.icu wellness) — de grootste multiplier volgens je rapport
  const sleep = icu.sleepHours(cache, iso);
  const sleepAvg = icu.avg7(cache, 'sleepSecs', iso);
  if (sleep == null && checkin?.sleepScore != null && checkin.sleepScore <= 2) {
    reasons.push('Check-in: slecht geslapen — trainen mag, maar iets lichter en vanavond op tijd naar bed.');
    bump('lighter');
  }
  if (sleep != null) {
    if (sleep < 5.5) { reasons.push(`Maar ${sleep.toFixed(1)} uur geslapen — vandaag geen zware prikkel én geen agressief calorietekort (rapport: spierafbraak +60%).`); bump('easy'); }
    else if (sleep < 7) { reasons.push(`${sleep.toFixed(1)} uur geslapen (<7u) — trainen mag, maar iets lichter en vanavond op tijd naar bed.`); bump('lighter'); }
  }
  if (sleepAvg != null && sleepAvg / 3600 < 6.5) {
    reasons.push(`Gemiddeld ${(sleepAvg / 3600).toFixed(1)} uur slaap deze week — structureel te kort; overweeg een rustiger week.`);
    bump('lighter');
  }

  // 4. Rust-HR / HRV afwijking
  const rhr = icu.todayVsAvg7(cache, 'restingHR', iso);
  if (rhr && rhr.today != null && rhr.avg != null && rhr.today >= rhr.avg + 5) {
    reasons.push(`Rusthartslag ${rhr.today} vs. gemiddeld ${Math.round(rhr.avg)} — je lichaam vraagt om rust.`);
    bump('lighter');
  }
  const hrv = icu.todayVsAvg7(cache, 'hrv', iso);
  if (hrv && hrv.today != null && hrv.avg != null && hrv.today <= hrv.avg * 0.8) {
    reasons.push(`HRV ${Math.round(hrv.today)} flink onder je gemiddelde (${Math.round(hrv.avg)}).`);
    bump('lighter');
  }

  // 4b. Vandaag/morgen andere sport gepland
  const planToday = plannedSummary(iso);
  const planTomorrow = plannedSummary(addDays(iso, 1));
  if (planToday.any) {
    const nm = planToday.list.map(p => icu.TYPE_NL[p.type] || p.type).join(', ').toLowerCase();
    if (planToday.hard) reasons.push(`Vandaag staat ${nm} (stevig) gepland — de planner heeft je krachtsessie daaromheen gezet.`);
    else reasons.push(`Vandaag ook ${nm} gepland (licht) — prima te combineren, houd gewoon wat over.`);
  }
  if (planTomorrow.legHard && base.type === 'heavy' && base.focus.includes('quadriceps')) {
    reasons.push('Morgen zware benen-sport gepland — doe het beenwerk vandaag rustig aan.');
  }

  // 5. Zware activiteit gisteren / vandaag
  const yday = icu.loadSummary(cache, addDays(iso, -1));
  if (yday.hard && base.type === 'heavy') {
    reasons.push(`Gisteren al flink belast (${yday.names.join(', ')}, load ${yday.load}).`);
    bump('lighter');
  }
  const today = icu.loadSummary(cache, iso);
  if (today.hard && base.type === 'heavy') {
    reasons.push(`Vandaag al een stevige sessie gedaan (${today.names.join(', ')}).`);
    bump('easy');
  }
  if (yday.legHeavy && base.type === 'heavy' && base.focus.includes('quadriceps') && level === 'go') {
    reasons.push('Gisteren flinke beenbelasting — beenwerk vandaag lichter.');
    bump('lighter');
  }

  // 6. Mesocyclus + vermoeidheids-deload
  const meso = mesoInfo(iso);
  let mesoFactor = meso.setFactor, mesoRir = meso.rirBonus, deload = meso.isDeload;
  const formAvg = icu.avgFormDays(cache, iso, 5);
  if (!deload && formAvg != null && formAvg <= -15) {
    deload = true; mesoFactor = DELOAD.setFactor; mesoRir = DELOAD.rirBonus;
    reasons.push(`Vermoeidheids-deload: je vorm was gemiddeld ${formAvg.toFixed(0)} over de laatste 5 dagen — deze week bewust licht, ook al is het geen geplande deloadweek.`);
  } else if (base.type === 'heavy') {
    reasons.push(meso.label + '.');
  }

  // Niveau → sessie + aanpassing
  let session = base;
  let adjust = { setFactor: mesoFactor, rirBonus: mesoRir, restBonus: 0 };
  if (base.type === 'heavy') {
    if (level === 'rest') {
      session = SESSIONS.snackMobility;
      reasons.push('Advies: vandaag alleen mobiliteit — de zware sessie schuift automatisch op.');
    } else if (level === 'easy') {
      session = SESSIONS.snackPump;
      reasons.push('Advies: vandaag een lichte snack; de zware sessie schuift automatisch op.');
    } else if (level === 'lighter') {
      adjust = { setFactor: mesoFactor * 0.75, rirBonus: mesoRir + 1, restBonus: 30 };
      reasons.push('Advies: zelfde sessie, maar minder sets en iets verder van spierfalen.');
    }
  }

  if (level === 'go' && reasons.filter(r => !r.startsWith('Planner') && !r.startsWith('Opbouwweek')).length === 0 && base.type === 'heavy') {
    const f = form != null ? ` (vorm ${form > 0 ? '+' + form : form}${sleep != null ? `, ${sleep.toFixed(1)}u slaap` : ''})` : '';
    reasons.unshift(`Je bent er klaar voor${f} — voluit trainen.`);
  }

  return { session, base, level, reasons, adjust, deload, form, meso, plannerReason: planned.reason };
}

/** Werk de sessie-slots uit incl. aanpassingen en gewichtssuggesties. */
export function buildWorkout(session, adjust = { setFactor: 1, rirBonus: 0, restBonus: 0 }) {
  return session.slots.map(slot => {
    const ex = byId[slot.ex];
    const sets = Math.max(1, Math.round(slot.sets * (adjust.setFactor ?? 1)));
    const rir = Math.min(5, slot.rir + (adjust.rirBonus ?? 0));
    const rest = slot.rest + (adjust.restBonus ?? 0);
    return { ...slot, exercise: ex, sets, rir, rest, suggestion: suggestWeight(slot.ex, slot.reps) };
  });
}

// ---------- Progressie (double progression + dumbbell-inventaris) ----------

function dumbbellSteps() {
  const raw = (S().dumbbellWeights || '').trim();
  if (!raw) return null;
  const list = raw.split(/[,;\s]+/).map(Number).filter(n => n > 0).sort((a, b) => a - b);
  return list.length ? list : null;
}

export function nextWeight(current) {
  const inv = dumbbellSteps();
  if (inv) {
    const higher = inv.find(w => w > current + 0.01);
    return higher ?? current; // zwaarste al bereikt
  }
  return current + (S().weightStepKg || PROGRESSION.weightStepKg);
}

/** Eerstvolgende lagere dumbbell (of −stap), voor autoregulatie omlaag. */
export function stepDown(current) {
  const inv = dumbbellSteps();
  if (inv) {
    const lower = [...inv].reverse().find(w => w < current - 0.01);
    return lower ?? current;
  }
  return Math.max(1, current - (S().weightStepKg || PROGRESSION.weightStepKg));
}

export function suggestWeight(exId, repRange) {
  const last = get().lastWeights[exId];
  const ex = byId[exId];
  const isBodyweight = ex && ex.equipment.every(q => ['bodyweight', 'resistanceBands', 'abWheel', 'pullUpBar'].includes(q));
  if (!last) return { weight: null, text: isBodyweight ? 'Lichaamsgewicht' : 'Kies een gewicht waarmee je nét de reps haalt', isNew: true };
  if (!isBodyweight && last.reps >= repRange[1]) {
    const nw = nextWeight(last.weight);
    if (nw > last.weight) return { weight: nw, text: `${nw} kg (vorige keer ${last.reps}×${last.weight} kg — range vol, dus omhoog!)`, isUp: true };
    return { weight: last.weight, text: `${last.weight} kg — zwaarste dumbbell bereikt: meer reps, langzamer tempo of pauze bovenin`, isUp: true };
  }
  if (isBodyweight) {
    if (last.reps >= repRange[1]) return { weight: last.weight || null, text: `Vorige keer ${last.reps} reps — probeer zwaarder (band/tempo) of meer reps`, isUp: true };
    return { weight: last.weight || null, text: `Vorige keer ${last.reps} reps — probeer er 1-2 meer` };
  }
  return { weight: last.weight, text: `${last.weight} kg (vorige keer ${last.reps} reps — mik op ${Math.min(last.reps + 1, repRange[1])})` };
}

/** Beste set per oefening uit een log. */
export function recordProgress(log) {
  const best = {};
  for (const s of log.sets) {
    if (!s.done || !s.reps) continue;
    const cur = best[s.ex];
    const score = (s.weight || 0) * 1000 + s.reps;
    if (!cur || score > cur.score) best[s.ex] = { score, weight: s.weight || 0, reps: s.reps };
  }
  return best;
}

/** Herbereken lastWeights uit alle logs (na bewerken/verwijderen van historie). */
export function rebuildLastWeights(state) {
  const lw = {};
  const sorted = [...state.logs].sort((a, b) => a.date.localeCompare(b.date));
  for (const log of sorted) {
    const best = recordProgress(log);
    for (const [ex, b] of Object.entries(best)) lw[ex] = { weight: b.weight, reps: b.reps, date: log.date };
  }
  state.lastWeights = lw;
}

// ---------- Plateau-detectie ----------

/** Oefeningen die 3+ zware sessies niet vooruit zijn gegaan. */
export function detectPlateaus() {
  const perEx = {}; // ex -> [{date, score}]
  const sorted = [...get().logs].sort((a, b) => a.date.localeCompare(b.date));
  for (const log of sorted) {
    const best = recordProgress(log);
    for (const [ex, b] of Object.entries(best)) {
      (perEx[ex] = perEx[ex] || []).push({ date: log.date, score: b.score, weight: b.weight, reps: b.reps });
    }
  }
  const plateaus = [];
  for (const [ex, hist] of Object.entries(perEx)) {
    if (hist.length < 3) continue;
    const last3 = hist.slice(-3);
    const noProgress = last3[2].score <= last3[0].score;
    if (noProgress) {
      plateaus.push({
        ex, exercise: byId[ex],
        since: last3[0].date,
        advice: 'Al 3 sessies geen progressie. Probeer: een variant (bijv. andere hoek), 3 sec zakken (tempo), of neem in de volgende deload bewust gas terug en bouw opnieuw op.',
      });
    }
  }
  return plateaus;
}

// ---------- Weekvolume ----------

export function weeklyVolume(iso) {
  const mon = mondayOf(iso);
  const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const vol = {};
  for (const log of get().logs) {
    if (!days.includes(log.date)) continue;
    for (const s of log.sets) {
      if (!s.done) continue;
      const ex = byId[s.ex];
      if (!ex) continue;
      vol[ex.muscle] = (vol[ex.muscle] || 0) + 1;
      for (const sec of ex.secondary || []) vol[sec] = (vol[sec] || 0) + 0.5;
    }
  }
  return vol;
}

export const VOLUME_TARGETS = { chest: [12, 16], biceps: [8, 12], triceps: [8, 12], core: [8, 14], back: [8, 14], shoulders: [6, 12], quadriceps: [4, 8] };

// ---------- Recomp / gewichtstrend ----------

/** Gewichtsreeks: wellness-gewicht (intervals.icu) aangevuld met handmatige metingen. */
export function weightSeries(cache) {
  const points = {}; // iso -> kg
  for (const w of (cache?.wellness || [])) {
    if (w.weight) points[String(w.id).slice(0, 10)] = w.weight;
  }
  for (const [iso, kg] of Object.entries(get().weights || {})) points[iso] = kg;
  return Object.entries(points).map(([iso, kg]) => ({ iso, kg })).sort((a, b) => a.iso.localeCompare(b.iso));
}

/** Trend: 7-daags gemiddelde nu vs. een week eerder → %/week + bewaking. */
export function weightTrend(cache) {
  const series = weightSeries(cache);
  if (series.length < 2) return { series, status: 'insufficient' };
  const today = todayISO();
  const avg = (from, to) => {
    const pts = series.filter(p => p.iso >= from && p.iso <= to);
    return pts.length ? pts.reduce((t, p) => t + p.kg, 0) / pts.length : null;
  };
  const nowAvg = avg(addDays(today, -6), today) ?? series[series.length - 1].kg;
  const prevAvg = avg(addDays(today, -13), addDays(today, -7));
  const latest = series[series.length - 1];
  if (prevAvg == null) return { series, latest, nowAvg, status: 'building' };
  const pctPerWeek = ((nowAvg - prevAvg) / prevAvg) * 100;
  const goal = S().goalMode || 'recomp';
  let status = 'ok', message = null;
  if (pctPerWeek <= -0.7) {
    status = 'too_fast';
    message = `Je verliest ${Math.abs(pctPerWeek).toFixed(1)}%/week — sneller dan de 0,7%-grens uit je rapport. Risico op spierverlies: eet iets meer (vooral eiwit) en bewaak je slaap.`;
  } else if (goal === 'cut') {
    // stagnatie-check over ~4 weken
    const fourWk = avg(addDays(today, -27), addDays(today, -21));
    if (fourWk != null && Math.abs(nowAvg - fourWk) / fourWk < 0.004) {
      status = 'stalled';
      message = 'Al ~4 weken geen daling. Overweeg −100 kcal per dag (bijv. één snack minder) — kleine stap, opnieuw meten.';
    }
  } else if (pctPerWeek < -0.1 && pctPerWeek > -0.7) {
    message = `Mooi tempo: ${Math.abs(pctPerWeek).toFixed(1)}%/week — precies de recomp-zone uit je rapport.`;
  }
  return { series, latest, nowAvg, prevAvg, pctPerWeek, status, message };
}

// ---------- Per-oefening historie, e1RM en PR's ----------

/** Geschatte 1RM (Epley). Alleen zinvol bij gewicht > 0. */
export function e1rm(weight, reps) {
  if (!weight || !reps) return null;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/** Historie per oefening: beste set per sessie, chronologisch. */
export function exerciseHistory(exId) {
  const out = [];
  const sorted = [...get().logs].sort((a, b) => a.date.localeCompare(b.date));
  for (const log of sorted) {
    let best = null;
    for (const s of log.sets) {
      if (!s.done || !s.reps || s.ex !== exId) continue;
      const score = (s.weight || 0) * 1000 + s.reps;
      if (!best || score > best.score) best = { score, weight: s.weight || 0, reps: s.reps };
    }
    if (best) out.push({ date: log.date, weight: best.weight, reps: best.reps, e1rm: e1rm(best.weight, best.reps) });
  }
  return out;
}

/** PR-overzicht voor een oefening. */
export function exercisePRs(exId) {
  const hist = exerciseHistory(exId);
  if (!hist.length) return null;
  const maxW = hist.reduce((a, b) => (b.weight > a.weight ? b : a));
  const maxE = hist.filter(h => h.e1rm).reduce((a, b) => (!a || b.e1rm > a.e1rm ? b : a), null);
  const maxReps = hist.reduce((a, b) => (b.reps > a.reps ? b : a));
  return { maxW, maxE, maxReps, count: hist.length };
}

/** Nieuwe PR's in een zojuist opgeslagen log (t.o.v. eerdere logs). */
export function detectPRs(log) {
  const prs = [];
  const prior = get().logs.filter(l => l.id !== log.id && l.date <= log.date);
  const best = recordProgress(log);
  for (const [exId, b] of Object.entries(best)) {
    let prevMaxW = 0, prevMaxE = 0, prevMaxReps = 0, seen = false;
    for (const l of prior) {
      for (const s of l.sets) {
        if (!s.done || !s.reps || s.ex !== exId) continue;
        seen = true;
        prevMaxW = Math.max(prevMaxW, s.weight || 0);
        prevMaxReps = Math.max(prevMaxReps, s.reps);
        prevMaxE = Math.max(prevMaxE, e1rm(s.weight, s.reps) || 0);
      }
    }
    if (!seen) continue; // eerste keer is geen PR
    const newE = e1rm(b.weight, b.reps) || 0;
    if (b.weight > prevMaxW) prs.push({ ex: exId, kind: 'gewicht', value: `${b.weight} kg` });
    else if (newE > prevMaxE && newE > 0) prs.push({ ex: exId, kind: 'e1RM', value: `${newE} kg` });
    else if (!b.weight && b.reps > prevMaxReps) prs.push({ ex: exId, kind: 'reps', value: `${b.reps} reps` });
  }
  return prs;
}

// ---------- Volume-historie & streaks ----------

/** Sets per week voor één spiergroep, laatste n weken (incl. huidige). */
export function volumeHistory(muscle, nWeeks = 8) {
  const today = todayISO();
  const out = [];
  for (let i = nWeeks - 1; i >= 0; i--) {
    const mon = addDays(mondayOf(today), -7 * i);
    const vol = weeklyVolume(mon);
    out.push({ monday: mon, sets: Math.round((vol[muscle] || 0) * 10) / 10, current: i === 0 });
  }
  return out;
}

/** Aantal opeenvolgende afgeronde weken (t/m vorige week) met ≥3 zware sessies. */
export function weekStreak() {
  const today = todayISO();
  let streak = 0;
  for (let i = 1; i <= 52; i++) {
    const mon = addDays(mondayOf(today), -7 * i);
    const end = addDays(mon, 6);
    const heavy = get().logs.filter(l => l.date >= mon && l.date <= end && SESSIONS[l.sessionId]?.type === 'heavy' && l.sets.some(s => s.done)).length;
    if (heavy >= 3) streak++;
    else break;
  }
  return streak;
}

// ---------- Warm-up & alternatieven ----------

function roundToStep(w) {
  const raw = (S().dumbbellWeights || '').trim();
  if (raw) {
    const inv = raw.split(/[,;\s]+/).map(Number).filter(n => n > 0).sort((a, b) => a - b);
    if (inv.length) {
      // dichtstbijzijnde beschikbare dumbbell
      return inv.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a));
    }
  }
  return Math.max(2, Math.round(w / 2) * 2);
}

/** Warm-up ramp voor de eerste zware oefening met gewicht. */
export function warmupFor(slots) {
  const first = slots.find(s => s.suggestion?.weight && s.suggestion.weight >= 10);
  if (!first) return null;
  const w = first.suggestion.weight;
  return {
    forExercise: first.exercise?.nameNL || first.ex,
    sets: [
      { reps: 8, weight: roundToStep(w * 0.5), label: '±50%' },
      { reps: 4, weight: roundToStep(w * 0.75), label: '±75%' },
    ],
    workWeight: w,
  };
}

/** Gelijkwaardige alternatieven voor een oefening (zelfde spiergroep, jouw materiaal). */
export function alternativesFor(exId, excludeIds = []) {
  const orig = byId[exId];
  if (!orig) return [];
  const myEq = new Set(S().equipment);
  if (S().hasPullUpBar) myEq.add('pullUpBar');
  return EXERCISES
    .filter(e => e.id !== exId && e.muscle === orig.muscle && !excludeIds.includes(e.id)
      && e.equipment.every(q => myEq.has(q)))
    .sort((a, b) => Math.abs((a.difficulty || 3) - (orig.difficulty || 3)) - Math.abs((b.difficulty || 3) - (orig.difficulty || 3)))
    .slice(0, 8);
}

// ---------- Ad-hoc workout ----------

/** Bouw een vrije sessie van gekozen oefeningen (telt mee in volume/herstel/intervals.icu, niet in de A→B→C-cyclus). */
export function adhocSession(exIds) {
  return {
    id: 'adhoc',
    type: 'adhoc',
    name: 'Vrije workout',
    focus: [...new Set(exIds.map(id => byId[id]?.muscle).filter(Boolean))],
    durationMin: null,
    description: 'Vrije sessie — jouw keuze. Telt gewoon mee in je weekvolume, spierherstel en intervals.icu.',
    warmup: null,
    slots: exIds.map(id => ({ ex: id, sets: 3, reps: [8, 15], rir: 2, rest: 120 })),
  };
}

export function proteinTarget(cache) {
  const series = weightSeries(cache);
  const kg = series.length ? series[series.length - 1].kg : (S().weightKg || 80);
  return { kg, grams: Math.round(kg * 2) };
}
