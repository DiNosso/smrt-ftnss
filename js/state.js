// Eenvoudige localStorage-state. Alles lokaal, niets verlaat je toestel
// behalve directe calls naar intervals.icu en YouTube.

import { mirror } from './backup.js';

export const VERSION = '2.14.0';

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
    // Vaste sportdagen: [{dow: 0-6 (0=maandag), type: 'Padel'|'Swim'|...}]
    // Op deze dagen plant de app geen krachtsessie.
    fixedSports: [],
    lastSyncAt: null,          // ISO-tijd van de laatste intervals.icu-sync
    tvPairCode: null,          // koppelcode voor het tv-scherm
    tvEnabled: false,          // tv-scherm meesturen tijdens een workout
    lastBackupAt: null,        // ISO-datum laatste backup-export
    // Sync tussen apparaten (iPad ↔ iPhone) via een eigen Supabase-tabel.
    syncUrl: '',               // https://xxxx.supabase.co
    syncKey: '',               // anon/public key
    syncCode: '',              // geheime code die jouw rij afschermt; op elk apparaat dezelfde
    syncEnabled: false,
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
  variants: {},                // {'YYYY-MM-DD': 'express'|'upper'} variant van de sessie op die dag
  dayIntent: {},               // {'YYYY-MM-DD': 'full'|'short'|'none'} jouw wens voor die dag; de planner kiest de sessie
  proposals: {},               // {proposalId: 'accepted'|'dismissed'} planner-voorstellen waar je al op reageerde
  sportSkips: {},              // {'YYYY-MM-DD': true} vaste sport gaat deze dag niet door
  lastWeights: {},             // {exerciseId: {weight, reps, date}}
  icuCache: null,              // {fetchedAt, wellness: [...], activities: [...]}
  activeWorkout: null,         // {sessionId, startedAt, savedAt, sets, adjust, timeCap} lopende training
  updatedAt: 0,                // laatste wijziging (ms) — voor de sync
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

export const STORAGE_KEY = KEY;

let mirrorTimer = null;
export function save() {
  state.updatedAt = Date.now(); // voor sync: wie is het nieuwst?
  const json = JSON.stringify(state);
  try {
    localStorage.setItem(KEY, json);
  } catch (e) {
    // Vol of geblokkeerd: dan is de kopie in IndexedDB je enige redding.
    console.warn('save failed', e);
    state.settings.storageFull = true;
  }
  // Stille kopie, samengevoegd zodat we niet bij elke toetsaanslag schrijven.
  clearTimeout(mirrorTimer);
  mirrorTimer = setTimeout(() => { mirror(json); }, 1500);
  // Sync-module luistert hierop (los gekoppeld, geen import-cirkel).
  try { window.dispatchEvent(new CustomEvent('fait:saved')); } catch { /* ok */ }
}

/** Voor de sync: staat van buiten overnemen zonder de sync opnieuw te triggeren. */
export function replaceState(next, { silent = false } = {}) {
  state = deepMerge(structuredClone(DEFAULTS), next);
  if (silent) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ok */ }
    clearTimeout(mirrorTimer);
    mirrorTimer = setTimeout(() => { mirror(JSON.stringify(state)); }, 1500);
  } else save();
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
