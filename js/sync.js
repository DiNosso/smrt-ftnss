// Sync tussen apparaten (iPad ↔ iPhone) via een eigen Supabase-tabel.
//
// Model: één rij per sync-code met de volledige app-staat als JSON. Nieuwste
// wint (updatedAt), met één uitzondering: workouts (logs) worden altijd
// samengevoegd op id, zodat een training die je offline op het ene apparaat
// logde nooit verdwijnt door een oudere staat van het andere.
//
// De sync-code is het geheim: de RLS-policy in Supabase laat alleen rijen zien
// waarvan de code overeenkomt met de header x-sync-code. Zonder code: niets.
//
// SQL om de tabel aan te maken staat in Instellingen → Sync (en in de changelog).

import { get, S, update, replaceState, VERSION } from './state.js';

const TABLE = 'smrt_state';
const DEVICE = (() => {
  try {
    let d = localStorage.getItem('fait.device');
    if (!d) { d = Math.random().toString(36).slice(2, 8); localStorage.setItem('fait.device', d); }
    return d;
  } catch { return 'x'; }
})();

let status = { state: 'idle', at: null, msg: '' };
let listeners = [];
export function onStatus(fn) { listeners.push(fn); return () => { listeners = listeners.filter(f => f !== fn); }; }
function setStatus(state, msg = '') { status = { state, at: Date.now(), msg }; for (const f of listeners) f(status); }
export function getStatus() { return status; }

export function isConfigured() {
  const s = S();
  return !!(s.syncEnabled && s.syncUrl && s.syncKey && s.syncCode);
}

export function newSyncCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  const arr = new Uint32Array(20);
  crypto.getRandomValues(arr);
  for (const n of arr) out += chars[n % chars.length];
  return out.replace(/(.{5})(?=.)/g, '$1-');
}

function headers() {
  const s = S();
  return {
    apikey: s.syncKey,
    Authorization: `Bearer ${s.syncKey}`,
    'Content-Type': 'application/json',
    'x-sync-code': s.syncCode,
  };
}
function base() { return S().syncUrl.replace(/\/+$/, '') + `/rest/v1/${TABLE}`; }

/** Wat er meegaat: alles behalve de intervals.icu-cache (groot, per apparaat prima opnieuw op te halen). */
function payload() {
  const st = get();
  const { icuCache, ...rest } = st;
  return rest;
}

let lastPushedJson = null;
let pushTimer = null;
let pulling = false;

export async function push() {
  if (!isConfigured() || pulling) return;
  const data = payload();
  const json = JSON.stringify(data);
  if (json === lastPushedJson) return;
  setStatus('busy', 'versturen…');
  try {
    const res = await fetch(base(), {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ code: S().syncCode, data, updated_at: new Date(data.updatedAt || Date.now()).toISOString(), device: DEVICE, version: VERSION }),
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 120)}`);
    lastPushedJson = json;
    setStatus('ok', 'gesynchroniseerd');
  } catch (e) {
    setStatus('error', e.message);
  }
}

export function schedulePush(delay = 4000) {
  if (!isConfigured()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, delay);
}

/** Logs samenvoegen op id; bij dubbel wint de versie met de meeste afgevinkte sets. */
function mergeLogs(a = [], b = []) {
  const byId = new Map();
  for (const l of [...a, ...b]) {
    const cur = byId.get(l.id);
    if (!cur) { byId.set(l.id, l); continue; }
    const done = x => (x.sets || []).filter(s => s.done).length;
    if (done(l) > done(cur) || (done(l) === done(cur) && (l.icuActivityId && !cur.icuActivityId))) byId.set(l.id, l);
  }
  return [...byId.values()].sort((x, y) => (x.date + (x.startedAt || 0)).localeCompare(y.date + (y.startedAt || 0)));
}

/**
 * Haal de staat van de andere kant op. Is die nieuwer, dan nemen we hem over
 * (met samengevoegde logs). Geeft true terug als er iets veranderd is.
 */
export async function pull({ force = false } = {}) {
  if (!isConfigured()) return false;
  pulling = true;
  setStatus('busy', 'ophalen…');
  try {
    const res = await fetch(`${base()}?code=eq.${encodeURIComponent(S().syncCode)}&select=data,updated_at,device`, { headers: headers() });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 120)}`);
    const rows = await res.json();
    const row = rows[0];
    if (!row?.data) { setStatus('ok', 'nog niets in de cloud — deze kant wordt de bron'); pulling = false; await push(); return false; }
    const remote = row.data;
    const local = get();
    const remoteAt = remote.updatedAt || new Date(row.updated_at).getTime();
    const localAt = local.updatedAt || 0;
    const mergedLogs = mergeLogs(local.logs, remote.logs);
    let changed = false;
    // Vers apparaat zonder eigen workouts neemt altijd de cloud over — anders zou een
    // lege installatie met een nieuwere klok de echte data overschrijven.
    const fresh = !(local.logs || []).length && (remote.logs || []).length;
    if (force || fresh || remoteAt > localAt) {
      // ander apparaat is nieuwer: overnemen, maar eigen sync-instellingen en icu-cache behouden
      const next = { ...remote, logs: mergedLogs, icuCache: local.icuCache };
      next.settings = { ...remote.settings, syncUrl: S().syncUrl, syncKey: S().syncKey, syncCode: S().syncCode, syncEnabled: true };
      replaceState(next, { silent: true });
      changed = true;
      setStatus('ok', `bijgewerkt vanaf ${row.device === DEVICE ? 'dit apparaat' : 'ander apparaat'}`);
    } else if (mergedLogs.length !== local.logs.length) {
      // lokaal is nieuwer maar de andere kant had workouts die wij missen
      update(st => { st.logs = mergedLogs; });
      changed = true;
      setStatus('ok', 'workouts samengevoegd');
    } else {
      setStatus('ok', 'al up-to-date');
    }
    lastPushedJson = null;
    pulling = false;
    if (remoteAt < localAt || changed) await push();
    return changed;
  } catch (e) {
    setStatus('error', e.message);
    pulling = false;
    return false;
  }
}

/** Test de verbinding: tabel bereikbaar en policy in orde? */
export async function test() {
  const res = await fetch(`${base()}?code=eq.${encodeURIComponent(S().syncCode)}&select=updated_at`, { headers: headers() });
  if (res.status === 404) throw new Error('Tabel smrt_state bestaat niet — voer de SQL uit in Supabase');
  if (res.status === 401 || res.status === 403) throw new Error('Key geweigerd (401/403) — controleer de anon key');
  if (!res.ok) throw new Error(`Supabase gaf ${res.status}`);
  return true;
}

/** Bij het inschakelen: welke kant is de bron? 'cloud' haalt op en overschrijft dit apparaat; 'local' zet deze kant in de cloud. */
export async function enable(source) {
  update(st => { st.settings.syncEnabled = true; });
  if (source === 'cloud') return pull({ force: true });
  lastPushedJson = null;
  await push();
  return false;
}

/** Koppel de sync aan de app: pushen na elke wijziging, pullen bij openen/terugkomen. */
export function install(onChanged) {
  window.addEventListener('fait:saved', () => schedulePush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isConfigured()) pull().then(ch => { if (ch) onChanged?.(); });
  });
  if (isConfigured()) pull().then(ch => { if (ch) onChanged?.(); });
}

export const SQL = `create table if not exists smrt_state (
  code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  device text,
  version text
);
alter table smrt_state enable row level security;
create policy "alleen met eigen code" on smrt_state
  for all to anon
  using (code = current_setting('request.headers', true)::json->>'x-sync-code')
  with check (code = current_setting('request.headers', true)::json->>'x-sync-code');`;
