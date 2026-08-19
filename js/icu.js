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

  const [wellness, activities] = await Promise.all([
    apiGet(`/athlete/${athlete}/wellness?oldest=${oldest42}&newest=${today}`),
    apiGet(`/athlete/${athlete}/activities?oldest=${oldest10}&newest=${today}`),
  ]);

  const cacheObj = { fetchedAt: Date.now(), wellness, activities };
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

export const TYPE_NL = {
  Ride: 'Fietsen', VirtualRide: 'Fietsen (indoor)', Run: 'Hardlopen', Swim: 'Zwemmen',
  Padel: 'Padel', Tennis: 'Tennis', WeightTraining: 'Krachttraining', Walk: 'Wandelen',
  Workout: 'Workout', Yoga: 'Yoga', Hike: 'Hiken',
};
