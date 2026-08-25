// intervals.icu API-client — draait volledig in de browser (API ondersteunt CORS).
// Auth: Basic met username "API_KEY" en je persoonlijke key (Settings → Developer op intervals.icu).

import { get, S, update, todayISO, addDays } from './state.js';

const BASE = 'https://intervals.icu/api/v1';
const CACHE_TTL_MIN = 30;

function authHeader() {
  const key = S().icuApiKey?.trim();
  if (!key) return null;
  return 'Basic ' + btoa('API_KEY:' + key);
}

export function isConfigured() { return !!S().icuApiKey?.trim(); }

async function apiGet(path) {
  const auth = authHeader();
  if (!auth) throw new Error('Geen API-key ingesteld');
  const res = await fetch(BASE + path, { headers: { Authorization: auth } });
  if (res.status === 401 || res.status === 403) throw new Error('API-key niet geldig (401)');
  if (!res.ok) throw new Error('intervals.icu gaf status ' + res.status);
  return res.json();
}

/** Haal wellness (CTL/ATL/vorm) + activiteiten op; cache 30 min. */
export async function refresh(force = false) {
  const cache = get().icuCache;
  if (!force && cache && (Date.now() - cache.fetchedAt) < CACHE_TTL_MIN * 60000) return cache;
  if (!isConfigured()) return null;

  const athlete = S().icuAthleteId?.trim() || '0';
  const today = todayISO();
  const oldest42 = addDays(today, -42);
  const oldest10 = addDays(today, -10);
  const next10 = addDays(today, 10);

  const [wellness, activities, events] = await Promise.all([
    apiGet(`/athlete/${athlete}/wellness?oldest=${oldest42}&newest=${today}`),
    apiGet(`/athlete/${athlete}/activities?oldest=${oldest10}&newest=${today}`),
    apiGet(`/athlete/${athlete}/events?oldest=${today}&newest=${next10}`).catch(() => []),
  ]);

  const cacheObj = { fetchedAt: Date.now(), wellness, activities, events };
  update(s => { s.icuCache = cacheObj; });
  return cacheObj;
}

/** Meest recente wellness-record met ctl/atl. */
export function latestWellness(cache) {
  const w = cache?.wellness;
  if (!Array.isArray(w) || !w.length) return null;
  const sorted = [...w].filter(x => x.ctl != null).sort((a, b) => String(b.id).localeCompare(String(a.id)));
  return sorted[0] || null;
}

/** Vorm (TSB) = CTL - ATL. Negatief = vermoeid, positief = fris. */
export function form(cache) {
  const w = latestWellness(cache);
  if (!w || w.ctl == null || w.atl == null) return null;
  return Math.round((w.ctl - w.atl) * 10) / 10;
}

/** Activiteiten van een bepaalde dag (lokale datum). */
export function activitiesOn(cache, iso) {
  const acts = cache?.activities;
  if (!Array.isArray(acts)) return [];
  return acts.filter(a => (a.start_date_local || '').slice(0, 10) === iso);
}

/** Ride en VirtualRide (of Run en TrailRun) zijn hetzelfde bij het matchen van plan vs. gedaan. */
export function normType(t) {
  const s = String(t || '');
  if (s.includes('Ride')) return 'Ride';
  if (s.includes('Run')) return 'Run';
  return s;
}

/** Sporten die je op een dag daadwerkelijk deed, samengevat per type (voor de weekstrip). */
export function doneSportsOn(cache, iso) {
  const byType = new Map();
  for (const a of activitiesOn(cache, iso)) {
    const t = normType(a.type);
    const cur = byType.get(t) || { type: t, load: 0, seconds: 0, count: 0 };
    cur.load += a.icu_training_load || 0;
    cur.seconds += a.moving_time || a.elapsed_time || 0;
    cur.count += 1;
    byType.set(t, cur);
  }
  return [...byType.values()].map(x => ({
    type: x.type,
    nl: TYPE_NL[x.type] || x.type,
    icon: TYPE_ICON[x.type] || TYPE_ICON._,
    load: Math.round(x.load),
    minutes: Math.round(x.seconds / 60),
    count: x.count,
    hard: x.load >= 70 || x.seconds >= 5400,
  }));
}

/** Was gisteren (of vandaag al) een zware sessie? Geeft {hard, load, names, legHeavy} terug. */
export function loadSummary(cache, iso) {
  const acts = activitiesOn(cache, iso);
  let load = 0; const names = []; let seconds = 0; let legHeavy = false;
  const LEG_TYPES = ['Ride', 'VirtualRide', 'Run', 'TrailRun', 'Hike', 'Soccer', 'Padel', 'Tennis'];
  for (const a of acts) {
    load += a.icu_training_load || 0;
    seconds += a.moving_time || a.elapsed_time || 0;
    names.push(a.name || a.type || 'activiteit');
    if (LEG_TYPES.some(t => (a.type || '').includes(t))) legHeavy = true;
  }
  const hard = load >= 70 || seconds >= 5400; // >70 TSS of >1,5 uur
  return { hard, load: Math.round(load), names, seconds, legHeavy, count: acts.length };
}

// ---------- Wellness-helpers (slaap, rust-HR, HRV, gewicht) ----------

function wellnessOn(cache, iso) {
  const w = cache?.wellness;
  if (!Array.isArray(w)) return null;
  return w.find(x => String(x.id).slice(0, 10) === iso) || null;
}

/** Slaap (uren) van afgelopen nacht (record van vandaag). */
export function sleepHours(cache, iso) {
  const rec = wellnessOn(cache, iso);
  if (!rec || rec.sleepSecs == null) return null;
  return rec.sleepSecs / 3600;
}

/** 7-daags gemiddelde van een wellness-veld (t/m gisteren). */
export function avg7(cache, field, iso) {
  const w = cache?.wellness;
  if (!Array.isArray(w)) return null;
  const from = iso.slice(0, 10);
  const vals = w
    .filter(x => { const d = String(x.id).slice(0, 10); return d < from && x[field] != null; })
    .sort((a, b) => String(b.id).localeCompare(String(a.id)))
    .slice(0, 7)
    .map(x => x[field]);
  if (!vals.length) return null;
  return vals.reduce((t, v) => t + v, 0) / vals.length;
}

/** Vandaag vs. 7-daags gemiddelde van een veld. */
export function todayVsAvg7(cache, field, iso) {
  const rec = wellnessOn(cache, iso);
  return { today: rec ? rec[field] : null, avg: avg7(cache, field, iso) };
}

/** Gemiddelde vorm (ctl−atl) over de laatste N dagen. */
export function avgFormDays(cache, iso, n = 5) {
  const w = cache?.wellness;
  if (!Array.isArray(w)) return null;
  const vals = w
    .filter(x => String(x.id).slice(0, 10) <= iso && x.ctl != null && x.atl != null)
    .sort((a, b) => String(b.id).localeCompare(String(a.id)))
    .slice(0, n)
    .map(x => x.ctl - x.atl);
  if (vals.length < 3) return null;
  return vals.reduce((t, v) => t + v, 0) / vals.length;
}

// ---------- Workouts terugschrijven ----------

/**
 * Stuur een afgeronde krachtsessie naar intervals.icu als handmatige activiteit.
 * Load-schatting: TSS ≈ duur(u) × (RPE/10)² × 100, RPE = 10 − gemiddelde RIR.
 */
export async function postWorkout(log, session, slots) {
  const auth = authHeader();
  if (!auth) throw new Error('Geen API-key');
  const athlete = S().icuAthleteId?.trim() || '0';

  const doneSets = (log.sets || []).filter(s => s.done);
  // echte RIR per set (indien gelogd) wint van de geplande RIR
  const loggedRirs = doneSets.map(s => s.rir).filter(r => r != null);
  const avgRir = loggedRirs.length
    ? loggedRirs.reduce((t, r) => t + r, 0) / loggedRirs.length
    : (slots?.length ? slots.reduce((t, s) => t + s.rir, 0) / slots.length : 2);
  const rpe = Math.max(5, Math.min(10, 10 - avgRir));
  const hours = Math.max(log.durationSec, 600) / 3600; // minimaal 10 min
  const load = Math.round(hours * Math.pow(rpe / 10, 2) * 100);
  const tonnage = Math.round(doneSets.reduce((t, s) => t + (s.weight || 0) * (s.reps || 0), 0));

  const start = new Date(log.startedAt || Date.now());
  const pad = n => String(n).padStart(2, '0');
  const startLocal = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}:00`;

  const body = {
    type: 'WeightTraining',
    start_date_local: startLocal,
    moving_time: log.durationSec,
    elapsed_time: log.durationSec,
    name: `SMRT.FTNSS · ${session.name.split('·')[1]?.trim() || session.name}`,
    description: `${doneSets.length} sets` + (tonnage ? ` · ${tonnage} kg totaal` : '') + (log.note ? `\n${log.note}` : ''),
    icu_training_load: load,
    session_rpe: Math.round(rpe),
    kg_lifted: tonnage || undefined,
    external_id: 'fait_' + log.id,
  };

  const res = await fetch(`${BASE}/athlete/${athlete}/activities/manual`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('intervals.icu gaf status ' + res.status);
  const created = await res.json();
  update(s => { s.icuCache = null; }); // vorm is veranderd → cache verversen
  return created?.id ?? created?.icu_activity_id ?? null;
}

/** Verwijder een eerder gepushte activiteit (bij verwijderen van een log). */
export async function deleteActivity(activityId) {
  const auth = authHeader();
  if (!auth || !activityId) return;
  await fetch(`${BASE}/activity/${activityId}`, { method: 'DELETE', headers: { Authorization: auth } }).catch(() => {});
  update(s => { s.icuCache = null; });
}

export const TYPE_ICON = {
  Ride: '\u{1F6B4}', VirtualRide: '\u{1F6B4}', Run: '\u{1F3C3}', TrailRun: '\u{1F3C3}',
  Swim: '\u{1F3CA}', Padel: '\u{1F3BE}', Tennis: '\u{1F3BE}', WeightTraining: '\u{1F3CB}',
  Walk: '\u{1F6B6}', Hike: '\u{1F97E}', Yoga: '\u{1F9D8}', Workout: '\u26A1', Rowing: '\u{1F6A3}',
  _: '\u25CF',
};

export const TYPE_NL = {
  Ride: 'Fietsen', VirtualRide: 'Fietsen (indoor)', Run: 'Hardlopen', Swim: 'Zwemmen',
  Padel: 'Padel', Tennis: 'Tennis', WeightTraining: 'Krachttraining', Walk: 'Wandelen',
  Workout: 'Workout', Yoga: 'Yoga', Hike: 'Hiken',
};

/** Geplande kalender-events (intervals.icu) op een dag — genegeerd: notities en eigen krachtsessies. */
export function plannedEventsOn(cache, iso) {
  const evs = cache?.events;
  if (!Array.isArray(evs)) return [];
  return evs.filter(e =>
    (e.start_date_local || '').slice(0, 10) === iso &&
    (e.category === 'WORKOUT' || e.category === 'RACE' || e.type) &&
    e.category !== 'NOTE' &&
    e.type && e.type !== 'WeightTraining'
  ).map(e => ({
    type: e.type,
    name: e.name || TYPE_NL[e.type] || e.type,
    hard: (e.icu_training_load || 0) >= 70 || (e.moving_time || 0) >= 5400 || e.category === 'RACE',
    source: 'icu',
  }));
}

// ---------- Activiteit-weergave ----------

const fmtDur = sec => {
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h ? `${h}u ${String(m).padStart(2, '0')}m` : `${m} min`;
};

/** Korte regel onder een activiteit in de lijst. */
export function actSummary(a) {
  const bits = [(a.start_date_local || '').slice(5, 10).split('-').reverse().join('-')];
  const sec = a.moving_time || a.elapsed_time || 0;
  if (sec) bits.push(fmtDur(sec));
  if (a.distance) bits.push((a.distance / 1000).toFixed(1) + ' km');
  if (a.icu_training_load) bits.push('load ' + Math.round(a.icu_training_load));
  return bits.join(' · ');
}

/**
 * Alles wat intervals.icu over een activiteit weet, in leesbare vorm.
 * Lege velden vallen weg — niet elke sport levert dezelfde data.
 */
export function actDetails(a) {
  const sec = a.moving_time || a.elapsed_time || 0;
  const km = a.distance ? a.distance / 1000 : 0;
  const big = [];
  if (sec) big.push({ n: fmtDur(sec), l: 'duur' });
  if (km) big.push({ n: km.toFixed(1), l: 'km' });
  if (a.icu_training_load) big.push({ n: Math.round(a.icu_training_load), l: 'load' });

  const L = [];
  const add = (k, v) => { if (v != null && v !== '' && v !== 0) L.push([k, v]); };

  if (km && sec) {
    if (/Run|Walk|Hike|Swim/.test(a.type || '')) {
      const spk = sec / km;
      add('Tempo', `${Math.floor(spk / 60)}:${String(Math.round(spk % 60)).padStart(2, '0')} /km`);
    } else {
      add('Snelheid', (km / (sec / 3600)).toFixed(1) + ' km/u');
    }
  }
  add('Hoogtemeters', a.total_elevation_gain ? Math.round(a.total_elevation_gain) + ' m' : null);
  add('Hartslag gem.', a.average_heartrate ? Math.round(a.average_heartrate) + ' bpm' : null);
  add('Hartslag max', a.max_heartrate ? Math.round(a.max_heartrate) + ' bpm' : null);
  add('Vermogen gem.', a.icu_average_watts ? Math.round(a.icu_average_watts) + ' W' : null);
  add('Genormaliseerd', a.icu_weighted_avg_watts ? Math.round(a.icu_weighted_avg_watts) + ' W' : null);
  add('Intensiteit', a.icu_intensity ? Math.round(a.icu_intensity) + '%' : null);
  add('Calorieën', a.calories ? Math.round(a.calories) + ' kcal' : null);
  add('Cadans', a.average_cadence ? Math.round(a.average_cadence) : null);
  add('Gevoel', a.feel ? `${a.feel}/5` : null);
  add('Ervaren zwaarte', a.icu_rpe ? `RPE ${a.icu_rpe}` : null);
  add('Fitness (CTL)', a.icu_ctl ? Math.round(a.icu_ctl) : null);
  add('Vermoeidheid (ATL)', a.icu_atl ? Math.round(a.icu_atl) : null);
  if (a.icu_hr_zone_times?.length) {
    const z = a.icu_hr_zone_times;
    const tot = z.reduce((t, x) => t + (x || 0), 0);
    if (tot) add('Hartslagzones', z.map((x, i) => `Z${i + 1} ${Math.round((x || 0) / tot * 100)}%`).filter((_, i) => z[i]).join(' · '));
  }
  add('Type', TYPE_NL[a.type] || a.type);
  return { big, list: L };
}
