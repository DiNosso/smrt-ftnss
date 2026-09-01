/**
 * Het tv-scherm. Draait los van de app: dit is een eigen pagina die je op de
 * tv opent (via casten, een browser op een mediaspeler, of gewoon een tablet
 * naast de tv). Hij ontvangt de stand van je telefoon en tekent die groot.
 */

import { connect } from './tvsync.js';

const root = document.getElementById('root');
const statusEl = document.getElementById('status');
const KEY = 'smrtftnss.tv.code';

let sync = null;
let state = null;
let laatsteOntvangst = 0;

/* ---------- Cast-levensverlenging ----------
 * Een Chromecast sluit een ontvanger na ~10 minuten af als er niets "speelt".
 * Door periodiek een piepklein beeldje als media te laden blijft de sessie
 * open. Draait alleen als deze pagina daadwerkelijk op een Chromecast staat.
 */
function houdCastWakker() {
  if (!/CrKey/i.test(navigator.userAgent)) return;   // geen Chromecast: niets doen
  const s = document.createElement('script');
  s.src = 'https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js';
  s.onload = () => {
    try {
      const speler = document.createElement('cast-media-player');
      speler.style.display = 'none';
      document.body.append(speler);
      const ctx = cast.framework.CastReceiverContext.getInstance();
      const pm = ctx.getPlayerManager();
      ctx.start({ disableIdleTimeout: true });
      const tik = () => {
        const r = new cast.framework.messages.LoadRequestData();
        r.autoplay = true;
        r.media = new cast.framework.messages.MediaInformation();
        r.media.contentId = 'assets/icons/icon-192.png';
        r.media.contentType = 'image/png';
        r.media.streamType = cast.framework.messages.StreamType.NONE;
        r.media.metadata = new cast.framework.messages.GenericMediaMetadata();
        r.requestId = 0;
        pm.load(r);
      };
      tik();
      setInterval(tik, 9 * 60 * 1000);
    } catch (e) { console.warn('cast keepalive niet gelukt', e); }
  };
  document.head.append(s);
}

/* ---------- Koppelen ---------- */

function toonKoppelscherm(fout = null) {
  root.innerHTML = '';
  const cijfers = Array.from({ length: 8 }, () => document.createElement('span'));
  const code = document.createElement('div');
  code.className = 'code';
  code.append(...cijfers);

  const box = document.createElement('div');
  box.className = 'pair';
  box.innerHTML = `<h1>Koppel met je telefoon</h1>
    <p>Open SMRT.FTNSS op je telefoon → Instellingen → <b>TV-scherm</b>.
       Typ de koppelcode die daar staat over met je afstandsbediening of toetsenbord.</p>`;
  box.append(code);
  if (fout) {
    const p = document.createElement('p');
    p.style.color = 'var(--danger)';
    p.textContent = fout;
    box.append(p);
  }
  root.append(box);

  let ingevoerd = '';
  const teken = () => cijfers.forEach((c, i) => {
    c.textContent = ingevoerd[i] || '';
    c.classList.toggle('on', i === ingevoerd.length);
  });
  teken();

  addEventListener('keydown', function opToets(e) {
    const t = (e.key || '').toUpperCase();
    if (t === 'BACKSPACE') { ingevoerd = ingevoerd.slice(0, -1); teken(); return; }
    if (!/^[A-Z0-9]$/.test(t)) return;
    ingevoerd += t;
    teken();
    if (ingevoerd.length === 8) {
      removeEventListener('keydown', opToets);
      localStorage.setItem(KEY, ingevoerd);
      start(ingevoerd);
    }
  });
}

/* ---------- Weergave ---------- */

const tijd = s => {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function bouwScherm() {
  root.innerHTML = `
    <div class="screen">
      <div class="top">
        <span class="brand"><img src="assets/icons/mark.svg" alt="">SMRT.FTNSS</span>
        <span class="sess" id="sess"></span>
        <span class="clock" id="clock"></span>
      </div>
      <div class="main">
        <div class="vid" id="vid"></div>
        <div class="info">
          <div class="exname" id="exname">Wachten op je telefoon…</div>
          <div id="mid"></div>
          <div class="meta" id="meta"></div>
          <div class="next" id="next"></div>
        </div>
      </div>
      <div class="bar"><i id="bar" style="width:0%"></i></div>
    </div>`;
}

let huidigeClip = null;
function tekenBeeld(s) {
  const vid = document.getElementById('vid');
  const bron = s.clip ? `assets/clips/${s.exId}.mp4` : null;
  const sleutel = bron || (s.demo ? `demo:${s.exId}` : s.thumb || '');
  if (sleutel === huidigeClip) return;         // niet opnieuw laden bij elke tik
  huidigeClip = sleutel;
  vid.innerHTML = '';
  vid.classList.remove('wide');
  if (bron) {
    const v = document.createElement('video');
    Object.assign(v, { src: bron, autoplay: true, loop: true, muted: true, playsInline: true });
    v.muted = true;
    v.addEventListener('loadedmetadata', () => {
      if (v.videoWidth) vid.style.aspectRatio = `${v.videoWidth} / ${v.videoHeight}`;
    }, { once: true });
    // Kan de tv de clip niet afspelen, dan de 2-frame animatie in plaats van
    // een zwart vlak.
    v.addEventListener('error', () => { huidigeClip = null; tekenBeeld({ ...s, clip: false }); }, { once: true });
    vid.append(v);
  } else if (s.demo) {
    vid.classList.add('wide');
    const a = document.createElement('img'); a.src = `assets/demos/${s.exId}/0.webp`;
    const b = document.createElement('img'); b.src = `assets/demos/${s.exId}/1.webp`;
    b.style.opacity = '0';
    vid.append(a, b);
    let aan = 0;
    setInterval(() => { aan ^= 1; a.style.opacity = aan ? '0' : '1'; b.style.opacity = aan ? '1' : '0'; }, 850);
  } else if (s.thumb) {
    vid.classList.add('wide');
    const i = document.createElement('img'); i.src = s.thumb; vid.append(i);
  }
}

function teken() {
  if (!state) return;
  const s = state;
  document.getElementById('sess').textContent = s.sessionName || '';
  document.getElementById('exname').textContent = s.exName || '';
  tekenBeeld(s);

  const mid = document.getElementById('mid');
  if (s.resting) {
    const over = (s.restUntil - Date.now()) / 1000;
    mid.innerHTML = `<div class="meta">Rust</div><div class="big">${tijd(over)}</div>`;
    document.getElementById('meta').textContent = `Daarna: set ${s.setNo} · ${s.scheme}`;
  } else {
    mid.innerHTML = `<div class="scheme">Set ${s.setNo}/${s.setsInExercise} · ${s.scheme}</div>`;
    document.getElementById('meta').textContent = s.weightText || '';
  }
  document.getElementById('next').innerHTML = s.nextText
    ? `Hierna: <b>${s.nextText}</b>` : 'Laatste oefening';
  document.getElementById('bar').style.width =
    `${Math.round((s.doneSets / Math.max(1, s.totalSets)) * 100)}%`;

  // Verbinding weggevallen? Dim het scherm zodat je dat ziet.
  document.querySelector('.screen')?.classList.toggle('idle', Date.now() - laatsteOntvangst > 90000);
}

function start(code) {
  bouwScherm();
  houdCastWakker();
  setInterval(() => {
    const k = document.getElementById('clock');
    if (k) k.textContent = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    teken();                       // elke seconde: rusttimer loopt lokaal door
  }, 1000);

  sync = connect(code, {
    role: 'tv',
    onState: (s) => { state = s; laatsteOntvangst = Date.now(); teken(); },
    onStatus: (st) => {
      statusEl.textContent = st === 'verbonden' ? `gekoppeld · ${code}` : st;
      statusEl.classList.toggle('bad', st !== 'verbonden');
    },
  });
}

const opgeslagen = new URLSearchParams(location.search).get('code') || localStorage.getItem(KEY);
if (opgeslagen && /^[A-Z0-9]{8}$/.test(opgeslagen)) { localStorage.setItem(KEY, opgeslagen); start(opgeslagen); }
else toonKoppelscherm();

// Code wissen: druk op 0 (of 'c') als je opnieuw wilt koppelen.
addEventListener('keydown', e => {
  if (e.key === 'c' || e.key === 'C') { localStorage.removeItem(KEY); location.href = location.pathname; }
});
