// De "hardcoded slimmigheid": wachtrij-planner, mesocyclus, readiness-regels,
// spierherstel, plateau-detectie, progressie en recomp-bewaking.

import { SESSIONS, DELOAD, PROGRESSION } from './data/program.js';
import { byId, EXERCISES } from './data/exercises.js';
import { get, S, update, todayISO, addDays } from './state.js';
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
  return [...fixedSportsOn(iso), ...manual, ...fromIcu];
}

/**
 * Vaste sportdagen (bijv. elke maandag padel). Slaat de dag over als je hem
 * hebt afgemeld, en ook als je die sport die dag al ergens anders hebt gezet.
 */
export function fixedSportsOn(iso) {
  if (get().sportSkips?.[iso]) return [];
  const dow = dowOf(iso);
  return (S().fixedSports || [])
    .filter(f => f.dow === dow)
    .map(f => ({ type: f.type, hard: true, fixed: true }));
}

/** Staat er op deze dag een sport (vast, zelf ingepland of uit de kalender)? */
export function sportDay(iso) {
  return plannedOn(iso).length > 0;
}

/**
 * Splitst de geplande sporten van een dag in wat er nog moet gebeuren en wat
 * al gedaan is. Zonder dit staat "Fietsen" zowel bij 'al gesport' als bij
 * 'nog gepland' zodra intervals.icu de rit binnenhaalt.
 */
export function plannedSplitOn(iso, cache = get().icuCache) {
  const plan = plannedOn(iso);
  const doneTypes = new Set(icu.doneSportsOn(cache, iso).map(d => d.type));
  const remaining = [], done = [];
  for (const p of plan) (doneTypes.has(icu.normType(p.type)) ? done : remaining).push(p);
  return { remaining, done };
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

// ---------- Beschikbaarheid (minuten per weekdag) ----------

export function dowOf(iso) { return (new Date(iso + 'T12:00:00').getDay() + 6) % 7; } // 0 = maandag

export function minutesOn(iso) {
  const av = S().availability || [60, 15, 60, 15, 60, 30, 0];
  return av[dowOf(iso)] ?? 0;
}

/** Hoeveel zware sessies wil/kan hij deze week kwijt? */
export function heavyTargetForWeek(iso) {
  const av = S().availability || [];
  const longDays = av.filter(m => m >= 40).length;
  const wish = S().heavyPerWeek ?? 3;
  return Math.max(1, Math.min(wish, longDays || 1));
}

/** Geschatte duur van een uitgewerkte sessie in minuten (incl. rust + wisseltijd; supersets delen hun rust). */
export function estimateMinutes(slots) {
  let sec = 0;
  const seen = new Set();
  for (const s of slots) {
    const partner = s.ss ? slots.find(o => o !== s && o.ss === s.ss) : null;
    if (partner && seen.has(s.ss)) continue;
    if (partner) {
      seen.add(s.ss);
      const n = Math.max(s.sets, partner.sets);
      sec += n * (s.rest + 110) + 90; // twee sets werk + loggen per ronde, één rust
    } else {
      sec += s.sets * (s.rest + 55) + 60;
    }
  }
  return Math.round(sec / 60);
}

/** Warming-up (RAMP) kost ook tijd; die hoort bij het tijdsbudget van een zware sessie. */
export const WARMUP_MIN = 8;

const COMPOUND_MUSCLES = new Set(['chest', 'back', 'quadriceps', 'hamstrings', 'glutes', 'full']);
const CORE_MUSCLES = new Set(['core', 'abs']);

/** Compound = meergewrichts-oefening die de grote spiergroepen traint; die blijft bij tijdnood altijd staan. */
const ISOLATION_IDS = new Set(['back_band_pull_apart', 'shoulders_reverse_fly', 'chest_dumbbell_fly', 'chest_band_fly', 'quads_leg_extension', 'hams_leg_curl', 'calves_calf_raise']);
export function isCompound(ex) {
  if (!ex) return false;
  if (ISOLATION_IDS.has(ex.id)) return false;
  if (COMPOUND_MUSCLES.has(ex.muscle)) return true;
  if (ex.muscle === 'shoulders' && (ex.secondary || []).includes('triceps')) return true; // presses
  return false;
}

/**
 * Pas de sessie in de beschikbare tijd. Volgorde (jouw keuze: "isolatie eruit, compounds heel"):
 * 1. isolatie-oefeningen eraf (curls, raises, kickbacks), van achteren naar voren
 * 2. core eraf
 * 3. pas dan sets van de compounds trimmen (hoofdlift houdt 3, rest 2)
 * 4. uiterste nood: compounds van achteren laten vallen (minimaal 2 blijven)
 */
export function fitToTime(slots, maxMin) {
  if (!maxMin || !slots.length) return { slots, trimmed: null };
  let out = slots.map(s => ({ ...s }));
  if (estimateMinutes(out) <= maxMin) return { slots: out, trimmed: null };
  const dropped = [];
  let droppedSets = 0;
  const tier = s => isCompound(s.exercise) ? 2 : CORE_MUSCLES.has(s.exercise?.muscle) ? 1 : 0;
  for (const t of [0, 1]) {
    for (let i = out.length - 1; i >= 0 && estimateMinutes(out) > maxMin; i--) {
      if (tier(out[i]) === t) { dropped.push(out[i]); out.splice(i, 1); }
    }
  }
  for (let guard = 0; guard < 40 && estimateMinutes(out) > maxMin; guard++) {
    let changed = false;
    for (let i = out.length - 1; i >= 0; i--) {
      const floor = i === 0 ? 3 : 2;
      if (out[i].sets > floor) { out[i].sets -= 1; droppedSets++; changed = true; break; }
    }
    if (!changed) break;
  }
  while (estimateMinutes(out) > maxMin && out.length > 2) { dropped.push(out.pop()); }
  const parts = [];
  if (dropped.length) parts.push(`${dropped.length} oefening${dropped.length > 1 ? 'en' : ''} eraf (${dropped.map(d => d.exercise?.short || d.exercise?.nameNL || d.ex).join(', ')})`);
  if (droppedSets) parts.push(`${droppedSets} set${droppedSets > 1 ? 's' : ''} minder op de compounds`);
  return { slots: out, trimmed: parts.length ? `Ingekort: ${parts.join(', ')}.` : null, dropped };
}

// ---------- Wachtrij-planner ----------
// Geen vaste weekdagen meer: A→B→C-cyclus op basis van wat er echt gedaan is.
// Gemiste sessies schuiven vanzelf op; doel = 3 zware sessies per week, liefst om de dag.

const HEAVY_CYCLE = ['sessionA', 'sessionB'];

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
    const logged = get().logs.filter(l => l.date === cursor && SESSIONS[l.sessionId]);
    let pick, reason = '', fromLog = false;
    if (logged.length) {
      // Al getraind op deze dag: dat ís de sessie van vandaag — geen snack er nog achteraan.
      pick = logged[logged.length - 1].sessionId;
      reason = 'vandaag gedaan';
      fromLog = true;
    } else if (swap && SESSIONS[swap]) {
      pick = swap;
      reason = 'handmatig gekozen';
    } else {
      const wkKey = mondayOf(cursor);
      const heavyCount = heavyByWeek[wkKey] || 0;
      const need = Math.max(0, heavyTargetForWeek(cursor) - heavyCount);
      const dow = dowOf(cursor);
      const mins = minutesOn(cursor);
      // hoeveel lange dagen resten er deze week nog (incl. vandaag)?
      const av = S().availability || [];
      let longDaysLeft = 0;
      for (let dd = dow; dd < 7; dd++) if ((av[dd] ?? 0) >= 40) longDaysLeft++;
      const remaining = Math.max(1, longDaysLeft);
      const gap = lastHeavyDate ? daysBetween(lastHeavyDate, cursor) : 99;
      const candidate = nextInCycle(lastHeavyId);
      const recMap = muscleRecoveryMap(cursor, sim);
      const planToday = plannedSummary(cursor);
      const planTomorrow = plannedSummary(addDays(cursor, 1));
      const hasQuads = SESSIONS[candidate].focus.includes('quadriceps');
      let eligible = sessionMusclesReady(SESSIONS[candidate], cursor, recMap);
      // beenwerk niet op/rond een stevige benen-sportdag
      if (hasQuads && (planToday.legHard || planTomorrow.legHard)) eligible = false;
      const mustCatchUp = need >= remaining; // anders haal je het weekdoel niet meer
      if (mins === 0) {
        pick = 'rest';
        reason = 'geen tijd ingepland';
      } else if (planToday.any) {
        // Sportdag: die dag is bezet. Geen krachtsessie, ook geen snack —
        // de wachtrij schuift gewoon door naar de eerstvolgende vrije dag.
        pick = 'rest';
        const nm = planToday.list.map(p => icu.TYPE_NL[p.type] || p.type).join(', ').toLowerCase();
        reason = `${nm} — sportdag`;
      } else if (mins < 40 && need > 0 && eligible && !planToday.hard) {
        pick = lastSnackId === 'snackCore' ? 'snackPump' : 'snackCore';
        reason = `${mins} min beschikbaar — korte sessie`;
      } else if (need > 0 && eligible && !planToday.hard && (gap >= 2 || mustCatchUp)) {
        pick = candidate;
        reason = mustCatchUp && gap < 2 ? 'inhaalsessie (weekdoel)' : (gap >= 7 ? 'opgeschoven sessie' : '');
      } else if (planToday.hard) {
        pick = 'snackMobility';
        const nm = planToday.list.map(p => icu.TYPE_NL[p.type] || p.type).join(', ').toLowerCase();
        reason = `${nm} gepland — kracht schuift op`;
      } else if (need > 0 && !eligible) {
        pick = lastSnackId === 'snackCore' ? 'snackPump' : 'snackCore';
        reason = (hasQuads && planTomorrow.legHard) ? 'morgen zware benen-sport — beenwerk schuift op' : 'spieren nog niet hersteld — zware sessie schuift op';
      } else if (dow === 6 || mins === 0) {
        pick = 'rest';
      } else {
        pick = lastSnackId === 'snackCore' ? 'snackPump' : 'snackCore';
      }
    }
    out.push({ iso: cursor, sessionId: pick, reason });
    // bijwerken van sim-status
    const sess = SESSIONS[pick];
    if (fromLog) {
      // echte logs zitten al in hlogs/heavyByWeek
    } else if (sess.type === 'heavy') {
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

// ---------- Varianten + planner-voorstellen ----------
// Blokken die de planner kan inzetten als de situatie erom vraagt:
//   express = alleen de compounds, ~30 min incl. warming-up (isolatie eruit)
//   upper   = zonder beenwerk (na een zware rit, of vóór een zware benen-sportdag)
// De planner stelt voor; jij bevestigt. Pas dan wordt het schema aangepast.

const LEG_MUSCLES = ['quadriceps', 'hamstrings', 'glutes', 'calves'];
export const VARIANT_NL = { express: 'Express', upper: 'Bovenlichaam' };
export const EXPRESS_CAP = 26; // minuten liften (+ warming-up ≈ 33)

/** Sessie met een variant toegepast. Geeft een nieuwe sessie terug (zelfde id: telt gewoon mee in de A/B-cyclus). */
export function applyVariant(session, variant) {
  if (!session || !variant || session.type !== 'heavy') return session;
  if (variant === 'upper') {
    const slots = session.slots.filter(sl => !LEG_MUSCLES.includes(byId[sl.ex]?.muscle));
    return { ...session, slots, variant, name: session.name + ' (bovenlichaam)', short: (session.short || '') + ' · boven',
      focus: session.focus.filter(m => !LEG_MUSCLES.includes(m)), durationMin: Math.max(25, session.durationMin - 10) };
  }
  if (variant === 'express') {
    return { ...session, variant, name: session.name + ' (express)', short: (session.short || '') + ' · express', durationMin: 35, timeCap: EXPRESS_CAP };
  }
  return session;
}

/** Variant die voor een dag is bevestigd (of null). */
export function variantOn(iso) { return get().variants?.[iso] || null; }

/**
 * Voorstellen van de planner voor vandaag. Elk voorstel: {id, title, why, changes:[tekst], apply:[{iso, session?, variant?}]}.
 * Al beantwoorde voorstellen (state.proposals) komen niet terug.
 */
export function proposals(iso, cache) {
  const out = [];
  const answered = get().proposals || {};
  const push = (p) => { if (!answered[p.id]) out.push(p); };
  const today = todayISO();
  if (iso !== today) return out;
  if (get().logs.some(l => l.date === iso && SESSIONS[l.sessionId]?.type === 'heavy')) return out; // al getraind

  const plan = plannedSession(iso);
  const base = plan?.session;
  const mon = mondayOf(iso);
  const target = heavyTargetForWeek(iso);
  const doneThisWeek = heavyLogs().filter(l => l.date >= mon && l.date <= iso).length;
  const need = Math.max(0, target - doneThisWeek);
  const lastId = heavyLogs().slice(-1)[0]?.sessionId;
  const candidate = nextInCycle(lastId);
  const candName = SESSIONS[candidate]?.short || SESSIONS[candidate]?.name;
  const dayName = d => DAY_FULL[dowOf(d)];
  const minsToday = minutesOn(iso);
  const yday = icu.loadSummary(cache, addDays(iso, -1));
  const planToday = plannedSummary(iso);
  const planTomorrow = plannedSummary(addDays(iso, 1));
  const curVariant = variantOn(iso);

  // Hoeveel dagen (vandaag t/m zondag) staan er nog echt een zware sessie gepland?
  const rest = [];
  for (let d = iso; d <= addDays(mon, 6); d = addDays(d, 1)) rest.push(d);
  const sched = schedule(addDays(mon, 6), iso);
  const heavyPlanned = sched.filter(x => SESSIONS[x.sessionId]?.type === 'heavy').length;

  // 1. Weekdoel haalt niet meer met de dagen die er nog zijn → express op een korte/sportdag
  let catchupDay = null;
  if (need > heavyPlanned) {
    const freeDay = rest.find(d => {
      const s = sched.find(x => x.iso === d);
      return s && SESSIONS[s.sessionId]?.type !== 'heavy' && (minutesOn(d) >= 20 || plannedSummary(d).any) && !get().swaps[d];
    });
    if (freeDay) {
      catchupDay = freeDay;
      const sport = plannedSummary(freeDay);
      const sportNm = sport.any ? sport.list.map(p => icu.TYPE_NL[p.type] || p.type).join(', ').toLowerCase() : null;
      push({
        id: `catchup:${freeDay}:${candidate}`,
        title: `Weekdoel in gevaar: nog ${need} sessie${need > 1 ? 's' : ''}, ${heavyPlanned} ingepland`,
        why: sportNm
          ? `${dayName(freeDay)} is een ${sportNm}-dag. Een express-sessie (~35 min, alleen de compounds) past daar prima naast: compounds houden de prikkel, isolatie laat je liggen.`
          : `${dayName(freeDay)} heb je ${minutesOn(freeDay)} min. Genoeg voor een express-sessie: compounds heel, isolatie eruit.`,
        changes: [`${dayName(freeDay)}: ${candName} · Express (~35 min)`],
        apply: [{ iso: freeDay, session: candidate, variant: 'express' }],
      });
    }
  }

  // 2. Vandaag zware sessie gepland, maar benen zijn gisteren/morgen zwaar belast → bovenlichaam-versie
  if (base?.type === 'heavy' && curVariant !== 'upper' && (yday.legHeavy && yday.hard || planTomorrow.legHard)) {
    const legs = base.slots.filter(sl => LEG_MUSCLES.includes(byId[sl.ex]?.muscle)).map(sl => byId[sl.ex]?.nameNL || sl.ex);
    if (legs.length) {
      push({
        id: `upper:${iso}`,
        title: yday.legHeavy && yday.hard ? `Gisteren zwaar gefietst (load ${yday.load})` : 'Morgen zware benen-sport',
        why: `Je benen krijgen hun prikkel al van het fietsen. Vandaag alleen bovenlichaam: ${legs.join(' en ')} eruit, de rest gewoon voluit. Het beenwerk komt in de volgende sessie terug.`,
        changes: [`Vandaag: ${base.short || base.name} · Bovenlichaam (${legs.join(', ')} eruit)`],
        apply: [{ iso, variant: 'upper' }],
      });
    }
  }

  // 3. Vandaag te weinig tijd voor de volledige sessie, maar er is wel een sessie nodig → express in plaats van snack
  if (base?.type !== 'heavy' && need > 0 && minsToday >= 20 && minsToday < 40 && !get().swaps[iso] && !planToday.hard && catchupDay !== iso) {
    push({
      id: `express:${iso}:${candidate}`,
      title: `Vandaag ${minsToday} min — express in plaats van een snack?`,
      why: `Een korte sessie met alleen de compounds geeft meer dan een snack: je hoofdliften krijgen hun sets, en je weekdoel (${target} sessies) blijft haalbaar.`,
      changes: [`Vandaag: ${candName} · Express (~35 min)`],
      apply: [{ iso, session: candidate, variant: 'express' }],
    });
  }

  return out;
}

const DAY_FULL = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

/** Voorstel doorvoeren: sessie + variant op de betreffende dagen zetten. */
export function acceptProposal(p) {
  update(st => {
    for (const a of p.apply) {
      if (a.session) st.swaps[a.iso] = a.session;
      if (a.variant) st.variants[a.iso] = a.variant;
    }
    st.proposals[p.id] = 'accepted';
  });
}
export function dismissProposal(p) {
  update(st => { st.proposals[p.id] = 'dismissed'; });
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

  // Al gedaan vandaag: geen readiness-gedoe meer, en zeker geen extra snack.
  if (get().logs.some(l => l.date === iso && l.sessionId === base.id)) {
    return { session: applyVariant(base, variantOn(iso)), base, level: 'go', done: true, adjust: { setFactor: mesoFactor, rirBonus: mesoRir, restBonus: 0 }, deload, form, meso, plannerReason: planned.reason,
      reasons: ['Vandaag al gedaan — herstel is nu het werk. Eten, slapen, morgen weer.'] };
  }

  if (level === 'go' && reasons.filter(r => !r.startsWith('Planner') && !r.startsWith('Opbouwweek')).length === 0 && base.type === 'heavy') {
    const f = form != null ? ` (vorm ${form > 0 ? '+' + form : form}${sleep != null ? `, ${sleep.toFixed(1)}u slaap` : ''})` : '';
    reasons.unshift(`Je bent er klaar voor${f} — voluit trainen.`);
  }

  const variant = variantOn(iso);
  if (variant && session.id === base.id) { session = applyVariant(session, variant); reasons.push(`Variant bevestigd: ${VARIANT_NL[variant]}.`); }
  return { session, base, level, reasons, adjust, deload, form, meso, plannerReason: planned.reason, variant };
}

/**
 * Gestructureerde onderbouwing van de readiness-score: elk signaal met zijn
 * waarde en of het meetelde. Voor het "waar is dit op gebaseerd?"-scherm.
 */
export function readinessSignals(iso, cache) {
  const out = [];
  const add = (label, value, state, note) => out.push({ label, value, state, note });

  // intervals.icu
  const form = icu.form(cache);
  add('Vorm (fitness − vermoeidheid)',
    form == null ? 'geen data' : (form > 0 ? '+' + form : String(form)),
    form == null ? 'none' : form <= -25 ? 'bad' : form <= -12 ? 'warn' : 'good',
    form == null ? 'Koppel intervals.icu om dit mee te laten wegen.' : 'Onder −12 traint de app lichter, onder −25 rust.');

  const sleep = icu.sleepHours(cache, iso);
  const ci = get().checkins?.[iso];
  if (sleep != null) {
    add('Slaap afgelopen nacht', `${sleep.toFixed(1)} uur`,
      sleep < 5.5 ? 'bad' : sleep < 7 ? 'warn' : 'good',
      'Onder 7 uur verschuift herstel volgens je rapport van vet naar spier.');
  } else if (ci?.sleepScore != null) {
    add('Slaap (check-in)', `${ci.sleepScore}/5`, ci.sleepScore <= 2 ? 'warn' : 'good', 'Uit je eigen check-in — intervals.icu had geen slaapdata.');
  } else {
    add('Slaap', 'geen data', 'none', 'Vul de check-in in of koppel een slaaptracker aan intervals.icu.');
  }

  const rhr = icu.todayVsAvg7(cache, 'restingHR', iso);
  if (rhr?.today != null && rhr.avg != null) {
    const hi = rhr.today >= rhr.avg + 5;
    add('Rusthartslag', `${Math.round(rhr.today)} (gem. ${Math.round(rhr.avg)})`, hi ? 'warn' : 'good',
      hi ? 'Meer dan 5 slagen boven je gemiddelde: je herstelt nog.' : 'In lijn met je gemiddelde.');
  }
  const hrv = icu.todayVsAvg7(cache, 'hrv', iso);
  if (hrv?.today != null && hrv.avg != null) {
    const low = hrv.today <= hrv.avg * 0.8;
    add('HRV', `${Math.round(hrv.today)} (gem. ${Math.round(hrv.avg)})`, low ? 'warn' : 'good',
      low ? 'Ruim onder je gemiddelde — teken van stress of onvoldoende herstel.' : 'Normaal niveau.');
  }

  // eigen invoer
  const tired = get().tired[iso];
  add('Hoe jij je voelt', tired === 'kapot' ? 'kapot' : tired === 'moe' ? 'beetje moe' : (ci?.motivation != null ? `motivatie ${ci.motivation}/5` : 'niets gemeld'),
    tired === 'kapot' ? 'bad' : (tired === 'moe' || (ci?.motivation ?? 5) <= 2) ? 'warn' : 'good',
    'Jouw eigen inschatting weegt altijd het zwaarst.');

  const sore = Object.entries(ci?.soreness || {}).filter(([, v]) => v);
  if (sore.length) {
    add('Spierpijn', sore.map(([m, v]) => `${m}${v === 2 ? ' (fors)' : ''}`).join(', '), 'warn',
      'Overschrijft de theoretische herstelklok: die spieren worden overgeslagen.');
  }

  // belasting
  const yday = icu.loadSummary(cache, addDays(iso, -1));
  if (yday.count) {
    add('Gisteren gesport', `${yday.names.join(', ')} · load ${yday.load}`, yday.hard ? 'warn' : 'good',
      yday.hard ? 'Stevige belasting: vandaag iets lichter.' : 'Lichte belasting, geen probleem.');
  }
  const today = icu.loadSummary(cache, iso);
  const split = plannedSplitOn(iso, cache);
  if (today.count) {
    add('Vandaag al gesport', `${today.names.join(', ')} · load ${today.load}`, today.hard ? 'warn' : 'good',
      split.done.length
        ? `Stond ingepland en is afgevinkt: ${split.done.map(p => icu.TYPE_NL[p.type] || p.type).join(', ')}.`
        : '');
  }
  if (split.remaining.length) {
    add('Nog gepland vandaag', split.remaining.map(p => `${icu.TYPE_NL[p.type] || p.type}${p.hard ? ' (stevig)' : ''}`).join(', '),
      split.remaining.some(p => p.hard) ? 'warn' : 'good', 'De planner zet je krachtsessie hieromheen.');
  }

  // programma
  const meso = mesoInfo(iso);
  add('Plek in het blok', meso.isDeload ? 'Deloadweek' : `Blokweek ${meso.pos + 1} van 4`, meso.isDeload ? 'warn' : 'good', meso.label);
  add('Beschikbare tijd vandaag', minutesOn(iso) ? `${minutesOn(iso)} min` : 'geen tijd ingepland',
    minutesOn(iso) === 0 ? 'bad' : minutesOn(iso) >= 40 ? 'good' : 'warn', 'Aan te passen in Instellingen.');

  return out;
}

/** Werk de sessie-slots uit incl. aanpassingen, tijdlimiet en gewichtssuggesties. */
export function buildWorkout(session, adjust = { setFactor: 1, rirBonus: 0, restBonus: 0 }, timeCapMin = null) {
  let built = session.slots.map(slot => {
    const ex = byId[slot.ex];
    const sets = Math.max(1, Math.round(slot.sets * (adjust.setFactor ?? 1)));
    const rir = Math.min(5, slot.rir + (adjust.rirBonus ?? 0));
    // Rust boven de 90 seconden levert geen meetbare extra spiergroei op
    // (Singer 2024). Langer rusten bij vermoeidheid mag, maar we kappen het af:
    // 3,5 minuut tussen sets eet je hele tijdsbudget op.
    const rest = Math.min(slot.rest + (adjust.restBonus ?? 0), 165);
    return { ...slot, exercise: ex, sets, rir, rest, suggestion: suggestWeight(slot.ex, slot.reps) };
  });
  if (timeCapMin) {
    const fitted = fitToTime(built, timeCapMin);
    built = fitted.slots;
    if (fitted.trimmed) built.trimmedNote = fitted.trimmed;
    built.dropped = fitted.dropped || [];
  }
  return built;
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

/** Sets van de meest recente sessie waarin deze oefening voorkwam. */
export function lastSessionSets(exId) {
  const logs = [...get().logs].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = logs.length - 1; i >= 0; i--) {
    const sets = logs[i].sets.filter(s => s.done && s.reps && s.ex === exId);
    if (sets.length) return { date: logs[i].date, sets };
  }
  return null;
}

/**
 * RIR-gedreven progressie. Jouw gelogde inspanning stuurt het volgende gewicht —
 * niet alleen of de rep-range vol was. Zo blijf je elke sessie tegen (verantwoord)
 * spierfalen aan trainen in plaats van eindeloos in een te licht gewicht hangen.
 *
 * gemiddelde RIR ≥ 3,5 → 2 stappen zwaarder (was duidelijk te licht)
 * gemiddelde RIR ≥ 2,5 → 1 stap zwaarder, ook als de range nog niet vol was
 * gemiddelde RIR 1-2   → klassieke double progression (range vol → 1 stap)
 * gemiddelde RIR 0 + reps onder de range → 1 stap terug, techniek herstellen
 */
export function suggestWeight(exId, repRange) {
  const ex = byId[exId];
  const isBodyweight = ex && ex.equipment.every(q => ['bodyweight', 'resistanceBands', 'abWheel', 'pullUpBar'].includes(q));
  const last = get().lastWeights[exId];
  const prev = lastSessionSets(exId);

  if (!last && !prev) {
    return {
      weight: null, isNew: true,
      text: isBodyweight ? 'Lichaamsgewicht — noteer je reps' : 'Kies een gewicht waarmee je nét de reps haalt',
      why: 'Eerste keer: mik op een gewicht waarbij set 1 aanvoelt als 2 reps over.',
    };
  }

  // gemiddelde RIR van de vorige sessie (alleen als hij echt gelogd is)
  let avgRir = null, topReps = 0, minReps = 99;
  if (prev) {
    const rirs = prev.sets.map(s => s.rir).filter(r => r != null);
    if (rirs.length) avgRir = rirs.reduce((t, r) => t + r, 0) / rirs.length;
    for (const s of prev.sets) { topReps = Math.max(topReps, s.reps); minReps = Math.min(minReps, s.reps); }
  }
  const w = last?.weight ?? (prev ? Math.max(0, ...prev.sets.map(s => s.weight || 0)) : 0);
  const reps = last?.reps ?? topReps;
  const rangeFull = reps >= repRange[1];

  // --- lichaamsgewicht/band: sturen op reps en tempo ---
  if (isBodyweight) {
    if (avgRir != null && avgRir >= 3.5) return { weight: w || null, isUp: true, text: `Vorige keer ${reps} reps met ${avgRir.toFixed(0)} in reserve — véél te licht`, why: 'Maak het zwaarder: band erbij, 3 sec zakken, of pauze onderin. Mik op RIR 1.' };
    if (rangeFull) return { weight: w || null, isUp: true, text: `Vorige keer ${reps} reps — range vol`, why: 'Verzwaren: band, tempo (3 sec zakken) of een moeilijkere variant.' };
    return { weight: w || null, text: `Vorige keer ${reps} reps — pak er 1-2 bij`, why: 'Blijf binnen de range tot je de bovengrens haalt.' };
  }

  // --- met gewicht ---
  if (avgRir != null && avgRir >= 3.5 && w) {
    const nw = nextWeight(nextWeight(w));
    if (nw > w) return { weight: nw, isUp: true, big: true, text: `${nw} kg — twee stappen omhoog`, why: `Je had vorige keer gemiddeld ${avgRir.toFixed(1)} reps over. Dat is ver van spierfalen: te licht om te groeien.` };
  }
  if (avgRir != null && avgRir >= 2.5 && w) {
    const nw = nextWeight(w);
    if (nw > w) return { weight: nw, isUp: true, text: `${nw} kg — omhoog`, why: `Gemiddeld ${avgRir.toFixed(1)} reps over vorige keer; je kunt dichter tegen falen aan.` };
  }
  // Zwaarste dumbbell bereikt terwijl je nog reps over hebt: gewicht is geen
  // knop meer, dus stuur op reps, tempo en moeilijkere varianten.
  if (avgRir != null && avgRir >= 2.5 && w && nextWeight(w) === w) {
    return {
      weight: w, isUp: true, atMax: true,
      text: `${w} kg — je zwaarste dumbbell`,
      why: `Nog ${avgRir.toFixed(1)} reps over, maar zwaarder heb je niet. Maak het moeilijker in plaats van zwaarder: `
        + `3 seconden laten zakken, 1 seconde pauze op het zwaarste punt, of eenzijdig uitvoeren. `
        + `Werk anders door tot ${repRange[1] + 4} reps voor je de oefening wisselt.`,
    };
  }
  if (avgRir != null && avgRir <= 0.2 && minReps < repRange[0] && w) {
    const nw = stepDown(w);
    if (nw < w) return { weight: nw, isDown: true, text: `${nw} kg — stapje terug`, why: 'Vorige keer ging je stuk vóór de rep-range. Iets lichter, strakke techniek, dan weer omhoog.' };
    return { weight: w, text: `${w} kg — houden`, why: 'Vorige keer zwaar; consolideer dit gewicht eerst.' };
  }
  if (rangeFull && w) {
    const nw = nextWeight(w);
    if (nw > w) return { weight: nw, isUp: true, text: `${nw} kg — range was vol`, why: `Vorige keer ${reps}×${w} kg gehaald. Double progression: gewicht omhoog, reps mogen weer laag beginnen.` };
    return { weight: w, isUp: true, text: `${w} kg — zwaarste dumbbell`, why: 'Meer reps, langzamer zakken of pauze bovenin als extra prikkel.' };
  }
  return {
    weight: w || null,
    text: `${w} kg — mik op ${Math.min(reps + 1, repRange[1])} reps`,
    why: avgRir != null ? `Vorige keer ${reps} reps met RIR ${avgRir.toFixed(1)} — precies goed, bouw rep voor rep op.` : `Vorige keer ${reps} reps. Eén rep meer is al progressie.`,
  };
}

/** Coach-tekst voor de laatste set van een oefening: verantwoord tot dicht bij falen. */
export function lastSetCue(slot) {
  if (slot.rir <= 1) return 'Laatste set: geef alles tot je techniek breekt — dát is het punt waar de groei zit.';
  return `Laatste set: mag 1 rep dichter tegen falen dan de vorige (RIR ${Math.max(0, slot.rir - 1)}).`;
}

/** Inspanningskwaliteit: hoeveel van je sets landden in de effectieve zone (RIR 0-3)? */
export function effortQuality(days = 14) {
  const from = addDays(todayISO(), -days);
  let effective = 0, junk = 0, failure = 0, total = 0;
  for (const log of get().logs) {
    if (log.date < from) continue;
    for (const s of log.sets) {
      if (!s.done || s.rir == null) continue;
      total++;
      if (s.rir <= 3) effective++; else junk++;
      if (s.rir <= 1) failure++;
    }
  }
  if (!total) return null;
  return {
    total, effective, junk, failure,
    pctEffective: Math.round((effective / total) * 100),
    pctFailure: Math.round((failure / total) * 100),
    advice: junk / total > 0.35
      ? 'Meer dan een derde van je sets bleef ver van spierfalen (RIR 4+). Dat is volgens je rapport "junk volume": de prikkel is te klein om te groeien. Ga zwaarder — de app stelt het nu vanzelf voor.'
      : failure / total < 0.2
        ? 'Je traint netjes, maar zelden echt tegen je grens aan. Pak op de laatste set van elke oefening bewust RIR 0-1.'
        : 'Sterk: je sets landen consequent in de zone waar spiergroei gebeurt.',
  };
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
  const first = slots.find(s => s.suggestion?.weight && s.suggestion.weight >= 6);
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

/**
 * Startgewicht bepalen voor een oefening waar je nog geen data van hebt.
 * Je doet één testset met een gewicht dat je aandurft, telt je reps en schat
 * hoeveel je er nog over had (RIR). Daaruit volgt je geschatte 1RM (Epley),
 * en daaruit het gewicht voor je echte werksets.
 *
 *   reps tot falen = gedane reps + RIR
 *   e1RM           = gewicht × (1 + repsTotFalen / 30)
 *   werkgewicht    = e1RM / (1 + (doelreps + doelRIR) / 30)
 */
export function calibrate({ weight, reps, rir, repRange, targetRir = 2 }) {
  const w = Number(weight), r = Number(reps), ri = Number(rir);
  if (!(w > 0) || !(r > 0) || ri < 0) return null;
  const toFailure = r + ri;
  const oneRm = w * (1 + toFailure / 30);
  const midReps = Math.round((repRange[0] + repRange[1]) / 2);
  const raw = oneRm / (1 + (midReps + targetRir) / 30);
  const work = roundToStep(raw);
  return {
    e1rm: Math.round(oneRm * 10) / 10,
    midReps,
    weight: work,
    // Hoe zeker is dit? Een testset ver van falen zegt weinig.
    confident: toFailure <= 15 && ri <= 4,
    why: toFailure > 15
      ? `Je deed ${r} reps met nog ${ri} over — dat is een uithoudingsset. De schatting klopt beter met een zwaardere testset.`
      : ri > 4
        ? `Je had nog ${ri} reps over. Ver van falen schat onnauwkeurig; pak volgende keer wat zwaarder.`
        : `${r} reps met ${ri} over = ${toFailure} tot spierfalen. Geschatte 1RM ${Math.round(oneRm)} kg.`,
  };
}

/**
 * Grove schatting op basis van een oefening die je al wél kent, via bekende
 * krachtverhoudingen. Alleen als vertrekpunt — de testset is nauwkeuriger.
 */
const RATIO = {
  chest_dumbbell_bench_press: 1,
  chest_incline_dumbbell_press: 0.85,
  chest_dumbbell_fly: 0.5,
  shoulders_dumbbell_press: 0.65,
  shoulders_arnold_press: 0.6,
  shoulders_lateral_raise: 0.3,
  shoulders_front_raise: 0.3,
  shoulders_reverse_fly: 0.3,
  back_dumbbell_row: 0.95,
  biceps_dumbbell_curl: 0.4,
  biceps_hammer_curl: 0.45,
  biceps_concentration_curl: 0.33,
  biceps_incline_curl: 0.35,
  triceps_overhead_extension: 0.4,
  triceps_kickback: 0.25,
};

export function estimateFromKnown(exId) {
  const target = RATIO[exId];
  if (!target) return null;
  const lw = get().lastWeights;
  let best = null;
  for (const [id, ratio] of Object.entries(RATIO)) {
    if (id === exId || !lw[id]?.weight) continue;
    const est = (lw[id].weight / ratio) * target;
    // pak de bekende oefening die qua verhouding het dichtst bij ligt
    const dist = Math.abs(Math.log(ratio / target));
    if (!best || dist < best.dist) best = { dist, from: id, weight: roundToStep(est) };
  }
  if (!best) return null;
  return { weight: best.weight, from: byId[best.from]?.nameNL || best.from };
}

/**
 * Strong-export (CSV) inlezen om baselines op te halen. Strong exporteert
 * kolommen als: Date, Workout Name, Exercise Name, Set Order, Weight, Reps, RPE.
 * We nemen per oefening de zwaarste set en zetten die in lastWeights, zodat
 * de app meteen een startgewicht heeft in plaats van "eerste keer".
 */
export function parseStrongCsv(text) {
  const rows = csvRows(text);
  if (rows.length < 2) return { matched: [], unmatched: [], sets: 0 };
  const head = rows[0].map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const col = (...names) => {
    for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i; }
    return -1;
  };
  const iDate = col('date'), iEx = col('exercise name', 'exercise'),
        iW = col('weight', 'weight (kg)'), iR = col('reps'), iRpe = col('rpe');
  if (iEx < 0 || iW < 0 || iR < 0) return { error: 'Kolommen niet herkend — is dit een Strong-export?' };

  const best = {};   // strongNaam -> {weight, reps, date}
  let sets = 0;
  for (const r of rows.slice(1)) {
    const name = (r[iEx] || '').trim();
    const w = parseFloat(r[iW]), rep = parseInt(r[iR], 10);
    if (!name || !(w > 0) || !(rep > 0)) continue;
    sets++;
    const date = (r[iDate] || '').slice(0, 10);
    const score = w * (1 + rep / 30);           // e1RM als maat voor "zwaarste"
    if (!best[name] || score > best[name].score) best[name] = { weight: w, reps: rep, date, score };
  }

  const matched = [], unmatched = [];
  const perId = {};   // meerdere Strong-namen kunnen op dezelfde oefening uitkomen
  for (const [name, b] of Object.entries(best)) {
    const id = matchExercise(name);
    if (!id) { unmatched.push({ name, ...b }); continue; }
    const cand = { id, name, nameNL: byId[id].nameNL, ...b, odd: implausible(id, b.weight) };
    const cur = perId[id];
    // Het meest recente wint; bij gelijke datum de zwaarste set.
    if (!cur || (cand.date || '') > (cur.date || '') ||
        ((cand.date || '') === (cur.date || '') && cand.score > cur.score)) {
      if (cur) unmatched.push({ name: cur.name, weight: cur.weight, reps: cur.reps, date: cur.date, dupe: true });
      perId[id] = cand;
    } else {
      unmatched.push({ name, ...b, dupe: true });
    }
  }
  matched.push(...Object.values(perId));
  matched.sort((a, b) => a.nameNL.localeCompare(b.nameNL));
  const newest = matched.reduce((t, m) => (m.date > t ? m.date : t), '');
  return { matched, unmatched, sets, ...staleness(newest) };
}

/**
 * Strong-oefeningnaam koppelen aan een oefening in de app.
 *
 * Fuzzy matchen op woorden gaat hier mis: "Bicep Curl" en "Dumbbell Curl"
 * delen één woord, "Overhead Press" en "Dumbbell Shoulder Press" geen enkel,
 * terwijl ze wél hetzelfde zijn. En "Incline Bench Press" lijkt juist heel erg
 * op "Bench Press" terwijl het een andere oefening is. Daarom een expliciete
 * tabel: voorspelbaar en te controleren.
 *
 * De sleutel is de Strong-naam zonder materiaal-achtervoegsel, in kleine
 * letters. Alleen oefeningen die met eigen materiaal te doen zijn.
 */
const STRONG_ALIAS = {
  // borst
  'bench press': 'chest_dumbbell_bench_press',
  'chest press': 'chest_dumbbell_bench_press',
  'incline bench press': 'chest_incline_dumbbell_press',
  'incline chest press': 'chest_incline_dumbbell_press',
  'chest fly': 'chest_dumbbell_fly',
  'incline chest fly': 'chest_dumbbell_fly',
  'push up': 'chest_push_up',
  'pushup': 'chest_push_up',
  // rug
  'bent over row': 'back_dumbbell_row',
  'bent over one arm row': 'back_dumbbell_row',
  'one arm row': 'back_dumbbell_row',
  'dumbbell row': 'back_dumbbell_row',
  'seated row': 'back_band_row',
  'inverted row': 'back_dumbbell_row',
  // schouders
  'overhead press': 'shoulders_dumbbell_press',
  'shoulder press': 'shoulders_dumbbell_press',
  'military press': 'shoulders_dumbbell_press',
  'arnold press': 'shoulders_arnold_press',
  'lateral raise': 'shoulders_lateral_raise',
  'front raise': 'shoulders_front_raise',
  'reverse fly': 'shoulders_reverse_fly',
  'rear delt fly': 'shoulders_reverse_fly',
  // biceps
  'bicep curl': 'biceps_dumbbell_curl',
  'biceps curl': 'biceps_dumbbell_curl',
  'curl': 'biceps_dumbbell_curl',
  'hammer curl': 'biceps_hammer_curl',
  'concentration curl': 'biceps_concentration_curl',
  'incline curl': 'biceps_incline_curl',
  'incline bicep curl': 'biceps_incline_curl',
  'spider curl': 'biceps_spider_curl',
  'preacher curl': 'biceps_concentration_curl',
  // triceps
  'triceps extension': 'triceps_overhead_extension',
  'tricep extension': 'triceps_overhead_extension',
  'overhead triceps extension': 'triceps_overhead_extension',
  'skullcrusher': 'triceps_overhead_extension',
  'triceps pushdown': 'triceps_band_pushdown',
  'tricep pushdown': 'triceps_band_pushdown',
  'triceps kickback': 'triceps_kickback',
  'tricep kickback': 'triceps_kickback',
  // benen
  'squat': 'quads_goblet_squat',
  'goblet squat': 'quads_goblet_squat',
  'front squat': 'quads_goblet_squat',
  'bulgarian split squat': 'quads_bulgarian_split_squat',
  'split squat': 'quads_bulgarian_split_squat',
  'lunge': 'quads_lunge',
  'walking lunge': 'quads_lunge',
  'reverse lunge': 'quads_lunge',
  'step up': 'glutes_step_up',
  'sumo squat': 'glutes_sumo_squat',
  'romanian deadlift': 'hams_stiff_leg_deadlift',
  'stiff leg deadlift': 'hams_stiff_leg_deadlift',
  'deadlift': 'hams_stiff_leg_deadlift',
  'hip thrust': 'glutes_single_leg_hip_thrust',
  'glute bridge': 'glutes_glute_bridge',
  'leg curl': 'hams_nordic_curl',
  'seated leg curl': 'hams_nordic_curl',
  // kuiten, core, full body
  'standing calf raise': 'calves_single_leg_raise',
  'seated calf raise': 'calves_seated_raise',
  'calf raise': 'calves_single_leg_raise',
  'crunch': 'core_crunch',
  'plank': 'core_plank',
  'russian twist': 'core_russian_twist',
  'ab wheel': 'core_ab_wheel',
  'hanging leg raise': 'core_lying_leg_raise',
  'leg raise': 'core_lying_leg_raise',
  'mountain climber': 'core_mountain_climber',
  'kettlebell swing': 'full_kettlebell_swing',
  'burpee': 'full_burpee',
  'farmers walk': 'forearms_farmer_walk',
};

/** Strong zet het materiaal tussen haakjes: "Bench Press (Dumbbell)". */
function strongKey(name) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')          // materiaal-achtervoegsel weg
    .replace(/\s*-\s*[a-z\s]+$/, ' ')  // "- Wide Grip" e.d. weg
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Welk materiaal noemt Strong? Bepaalt of de oefening thuis te doen is. */
function strongEquipment(name) {
  const m = name.toLowerCase().match(/\(([^)]+)\)/);
  if (!m) return null;
  const t = m[1];
  if (t.includes('dumbbell')) return 'dumbbells';
  if (t.includes('kettlebell')) return 'kettlebell';
  if (t.includes('band')) return 'resistanceBands';
  if (t.includes('bodyweight')) return 'bodyweight';
  if (t.includes('barbell')) return 'barbell';
  if (t.includes('cable')) return 'cableMachine';
  if (t.includes('machine') || t.includes('smith') || t.includes('plate')) return 'machine';
  return null;
}

function matchExercise(strongName) {
  const id = STRONG_ALIAS[strongKey(strongName)];
  if (!id || !byId[id]) return null;
  const ex = byId[id];

  const myEq = new Set(S().equipment || []);
  if (S().hasPullUpBar) myEq.add('pullUpBar');
  if (!ex.equipment.every(q => myEq.has(q))) return null;

  // Het gewicht moet overdraagbaar zijn. 30 kg op een curlmachine zegt niets
  // over dumbbells, en 60 kg op een Smith-squat al helemaal niet: hefboom,
  // geleiding en eigen gewicht verschillen te veel. Alleen vrij gewicht telt.
  const se = strongEquipment(strongName);
  if (se === 'machine' || se === 'cableMachine' || se === 'barbell') return null;
  if (se && !ex.equipment.includes(se) && !(se === 'bodyweight' && ex.equipment.includes('bodyweight'))) return null;
  if (!se && !ex.equipment.includes('bodyweight')) return null;

  return id;
}

/**
 * Hoe oud is deze data, en wat betekent dat voor je startgewicht?
 *
 * Kracht loopt terug als je lang niet traint. Hoeveel precies verschilt per
 * persoon, maar terugkomen op je oude gewichten is een slecht startpunt: je
 * pezen en gewrichten lopen achter op wat je spieren nog "kennen". Beter licht
 * beginnen en de RIR-motor het in een paar weken laten opbouwen — dat gaat
 * sneller dan de eerste keer opbouwen, want de aanleg is er nog.
 */
export function staleness(newestIso) {
  if (!newestIso) return { months: null, factor: 1, note: null };
  const months = Math.round((Date.now() - new Date(newestIso + 'T12:00:00').getTime()) / 2629800000);
  let factor = 1, note = null;
  if (months >= 12) {
    factor = 0.6;
    note = `Je laatste gelogde training is ruim ${Math.floor(months / 12)} jaar geleden. Begin op ongeveer 60% — de app werkt je in een paar weken terug omhoog.`;
  } else if (months >= 6) {
    factor = 0.75;
    note = `Je laatste gelogde training is ${months} maanden geleden. Begin op ongeveer 75%.`;
  } else if (months >= 3) {
    factor = 0.85;
    note = `Je laatste gelogde training is ${months} maanden geleden. Begin iets lichter, rond 85%.`;
  }
  return { months, factor, note };
}

/** Startgewichten wegschrijven, eventueel geschaald na een lange pauze. */
export function scaleBaselines(list, factor) {
  return list.map(b => ({ ...b, weight: roundToStep(b.weight * factor), original: b.weight }));
}

/**
 * Ziet dit gewicht er raar uit voor deze oefening? Strong-namen matchen niet
 * altijd perfect, en een verkeerde koppeling levert een onmogelijk gewicht op.
 */
function implausible(exId, weight) {
  const ex = byId[exId];
  if (!ex) return null;
  const inv = (S().dumbbellWeights || '').split(/[,;\s]+/).map(Number).filter(n => n > 0);
  if (ex.equipment.includes('dumbbells')) {
    const max = inv.length ? Math.max(...inv) : 45;
    if (weight > max) return `Zwaarder dan je zwaarste dumbbell (${max} kg) — waarschijnlijk verkeerd gekoppeld.`;
  }
  if (ex.equipment.includes('kettlebell') && weight > 40) {
    return 'Zwaar voor een kettlebell — controleer of dit klopt.';
  }
  return null;
}

/** Geselecteerde baselines wegschrijven. */
export function applyBaselines(list) {
  update(st => {
    for (const b of list) {
      st.lastWeights[b.id] = { weight: b.weight, reps: b.reps, date: b.date || todayISO() };
    }
  });
}

/** Minimale CSV-lezer die aanhalingstekens en komma's binnen velden aankan. */
function csvRows(text) {
  const rows = []; let row = [], cell = '', q = false;
  const src = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',' || c === ';') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

/** Puur lichaamsgewicht? Dan heeft een gewicht invullen geen zin. */
/** Kg die één set daadwerkelijk verplaatst: bij twee dumbbells log je het gewicht per stuk, dus ×2 voor volume. */
export function setKg(s) {
  return (s.weight || 0) * (byId[s.ex]?.dumbbells || 1);
}

/** Tonnage (kg × reps) van een log, met dubbele dumbbells meegeteld. */
export function logTonnage(log) {
  return Math.round(log.sets.reduce((t, s) => t + (s.done ? setKg(s) * (s.reps || 0) : 0), 0));
}

export function isBodyweightOnly(ex) {
  if (!ex) return false;
  return ex.equipment.every(q => ['bodyweight', 'pullUpBar', 'bench', 'inclineBench', 'abWheel'].includes(q));
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
