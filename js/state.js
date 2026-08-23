// Eenvoudige localStorage-state. Alles lokaal, niets verlaat je toestel
// behalve directe calls naar intervals.icu en YouTube.

export const VERSION = '2.5.2';

const KEY = 'fait.v1';

const DEFAULTS = {
  settings: {
    name: 'Niels',
    weightKg: 80,
    icuApiKey: '',
    icuAthleteId: '0',
    equipment: ['dumbbells', 'bench', 'inclineBench', 'bodyweight', 'kettlebell', 'resistanceBands', 'abWheel'],
    hasPullUpBar: false,
    weightStepKg: 2,
    dumbbellWeights: '',       // bijv. "4,6,8,10,12,16,20" → exacte suggesties
    programStart: null,        // ISO-datum van week 1, maandag
    goalMode: 'recomp',        // 'recomp' | 'cut' | 'maintain'
    pushToIcu: true,           // afgeronde workouts naar intervals.icu sturen
    lastMonthCheck: null,      // ISO-datum laatste maandcheck
    // Beschikbaarheid: minuten per weekdag (index 0 = maandag). 0 = geen tijd.
    availability: [60, 15, 60, 15, 60, 30, 0],
    heavyPerWeek: 3,           // gewenst aantal zware sessies per week
    dailyHang: false,          // dagelijks hangen tonen (alleen zinvol met stang/rek)
    lastBackupAt: null,        // ISO-datum laatste backup-export
  },
  weights: {},                 // {'YYYY-MM-DD': kg} handmatige wegingen
  checkins: {},                // {'YYYY-MM-DD': {motivation: 1-5, sleepScore: 1-5, soreness: {muscle: 0|1|2}}}
  plannedSports: {},           // {'YYYY-MM-DD': [{type: 'Swim'|'Ride'|..., hard: bool}]} zelf ingepland
  measurements: {},            // {'YYYY-MM-DD': {waist: cm}} maandcheck-metingen
  customExercises: [],         // eigen oefeningen
  sessionOverrides: {},        // {sessionId: {slots: [...], ...}} bewerkte sessies
  logs: [],                    // {id, date: 'YYYY-MM-DD', sessionId, startedAt, durationSec, sets: [{ex, set, reps, weight, done}], feeling}
  habits: {},                  // {'YYYY-MM-DD': {hang: true, protein: true, sleep: true}}
  tired: {},                   // {'YYYY-MM-DD': 'moe'|'kapot'} handmatige override
  swaps: {},                   // {'YYYY-MM-DD': sessionId} handmatig gewisselde dagen
  lastWeights: {},             // {exerciseId: {weight, reps, date}}
  icuCache: null,              // {fetchedAt, wellness: [...], activities: [...]}
};

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return deepMerge(structuredClone(DEFAULTS), parsed);
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function deepMerge(base, over) {
  for (const k of Object.keys(over || {})) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      deepMerge(base[k], over[k]);
    } else {
      base[k] = over[k];
    }
  }
  return base;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('save failed', e); }
}

export function get() { return state; }
export const S = () => state.settings;

export function update(fn) { fn(state); save(); }

export function todayISO(d = new Date()) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function exportData() {
  return JSON.stringify(state, null, 2);
}

export function importData(json) {
  const parsed = JSON.parse(json);
  state = deepMerge(structuredClone(DEFAULTS), parsed);
  save();
}
