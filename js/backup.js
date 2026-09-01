/**
 * Vangnet voor je data.
 *
 * Alles staat in localStorage, en dat is kwetsbaarder dan het lijkt: het heeft
 * een limiet van ongeveer 5 MB, en Safari mag de opslag van een website
 * opruimen als er lang niet gekeken wordt of als de telefoon krap zit. Voor een
 * trainingslog dat je jaren wil bijhouden is dat te wankel.
 *
 * Daarom drie lagen:
 *  1. Een stille kopie in IndexedDB — veel ruimer, en wordt niet als eerste
 *     geraakt als localStorage vol loopt.
 *  2. Automatisch terugzetten als localStorage leeg blijkt maar de kopie er nog is.
 *  3. Een herinnering om af en toe een echt bestand te exporteren, want alleen
 *     dat overleeft het wissen van je websitegegevens of een nieuwe telefoon.
 */

const DB = 'smrtftnss';
const STORE = 'backup';

function open() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode);
    const s = t.objectStore(STORE);
    const out = fn(s);
    t.oncomplete = () => res(out?.result ?? null);
    t.onerror = () => rej(t.error);
  });
}

/** Stille kopie wegschrijven. Faalt nooit hard — dit mag de app niet ophouden. */
export async function mirror(json) {
  try {
    await tx('readwrite', s => s.put({ at: Date.now(), json }, 'latest'));
  } catch (e) { console.warn('kopie mislukt', e); }
}

/** De laatste kopie ophalen, of null. */
export async function readMirror() {
  try { return await tx('readonly', s => s.get('latest')); }
  catch { return null; }
}

/**
 * Draait vóór de app opstart: is localStorage leeg terwijl er wel een kopie is,
 * dan is de opslag opgeruimd en zetten we hem terug.
 */
export async function restoreIfLost(key) {
  try {
    const nu = localStorage.getItem(key);
    if (nu && nu.length > 40) return null;          // er staat gewoon data
    const kopie = await readMirror();
    if (!kopie?.json) return null;
    localStorage.setItem(key, kopie.json);
    return { at: kopie.at, bytes: kopie.json.length };
  } catch { return null; }
}

/** Hoeveel ruimte gebruikt de app, en zit dat tegen de grens aan? */
export function storageInfo(key) {
  let bytes = 0;
  try { bytes = (localStorage.getItem(key) || '').length; } catch { /* ok */ }
  const limiet = 5 * 1024 * 1024;
  return { bytes, pct: Math.round((bytes / limiet) * 100), krap: bytes > limiet * 0.7 };
}

/** Dagen sinds de laatste geëxporteerde backup. null = nog nooit. */
export function daysSince(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso + 'T12:00:00').getTime()) / 86400000);
}

/** Bestandsnaam met datum, zodat exports niet over elkaar heen schrijven. */
export function backupName() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `smrtftnss-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
}
