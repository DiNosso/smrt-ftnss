// Gedeelde UI-helpers

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer;
export function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = el('div', { class: 'toast' }, msg);
  document.body.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2600);
}

export function sheet(contentEl, { onClose } = {}) {
  const backdrop = el('div', { class: 'sheet-backdrop' });
  const closeBtn = el('button', { class: 'btn-sm btn-ghost sheet-close', 'aria-label': 'Sluiten' }, '✕');
  const box = el('div', { class: 'sheet' }, closeBtn, contentEl);
  const close = () => { backdrop.remove(); box.remove(); onClose?.(); };
  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.body.append(backdrop, box);
  return close;
}

/** YouTube-embed die pas laadt na een tik (scheelt data & tracking). Zonder video-ID: zoekknop.
    Met cast-hulp: open in de YouTube-app (cast naar elke TV) of AirPlay via fullscreen. */
export function videoBlock(exercise) {
  const box = el('div');
  const wrap = el('div', { class: 'video-wrap' });
  box.append(wrap);
  if (exercise.video) {
    const thumb = el('button', { class: 'video-thumb', 'aria-label': 'Speel instructievideo af' },
      el('img', { src: `https://i.ytimg.com/vi/${exercise.video}/hqdefault.jpg`, alt: '', loading: 'lazy' }),
      el('span', { class: 'play' }, '▶'),
      el('span', { class: 'tiny', style: 'position:relative' }, 'Instructievideo laden'));
    thumb.addEventListener('click', () => {
      wrap.innerHTML = '';
      wrap.append(el('iframe', {
        src: `https://www.youtube-nocookie.com/embed/${exercise.video}?autoplay=1&rel=0&playsinline=1`,
        allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
        allowfullscreen: true,
      }));
    });
    wrap.append(thumb);
    box.append(el('div', { class: 'spread', style: 'margin:2px 0 8px' },
      el('span', { class: 'tiny dim' }, '📺 Op TV: fullscreen → AirPlay, of cast via de app'),
      el('a', {
        class: 'btn btn-sm', style: 'text-decoration:none; flex:none',
        href: `https://www.youtube.com/watch?v=${exercise.video}`,
        target: '_blank', rel: 'noopener',
      }, 'Open in YouTube ↗')));
  } else {
    const q = encodeURIComponent(exercise.name + ' proper form');
    wrap.append(el('a', { class: 'video-thumb', href: `https://www.youtube.com/results?search_query=${q}`, target: '_blank', rel: 'noopener', style: 'text-decoration:none' },
      el('span', { class: 'play' }, '🔍'),
      el('span', { class: 'tiny', style: 'position:relative' }, 'Nog geen vaste video — zoek op YouTube')));
  }
  return box;
}

export const DAY_NL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
export const MONTH_NL = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

export function fmtDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  return `${days[d.getDay()]} ${d.getDate()} ${MONTH_NL[d.getMonth()]}`;
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ============================================================
   v2.5 — rijkere UI-componenten
   ============================================================ */

/** Echte video-loop (6 sec, lokaal, geen reclame, geen netwerk). Beste optie. */
export function clipBlock(exercise, { tag = 'Demo' } = {}) {
  if (!exercise?.clip) return null;
  const box = el('div', { class: 'demo clip' });
  const v = el('video', {
    src: `assets/clips/${exercise.id}.mp4`,
    autoplay: true, loop: true, muted: true, playsinline: true, preload: 'metadata',
  });
  v.muted = true; // iOS vereist dit als property, niet alleen als attribuut
  box.append(...[v, tag ? el('span', { class: 'tag' }, tag) : null].filter(Boolean));
  // Kan de browser de clip niet afspelen (codec, offline, kapot bestand)?
  // Dan stilletjes terugvallen op de 2-frame demo in plaats van een leeg vak.
  v.addEventListener('error', () => {
    const fb = demoBlock(exercise, { tag });
    if (fb && box.parentNode) box.replaceWith(fb);
    else box.classList.add('clip-failed');
  }, { once: true });
  // Autoplay kan geweigerd worden; probeer het expliciet nog een keer.
  v.addEventListener('canplay', () => { v.play?.().catch(() => {}); }, { once: true });
  // Geef het kader de verhouding van de clip zelf. De clips zijn staand (9:16);
  // zonder dit staan ze in een liggend kader met zwarte balken ernaast.
  v.addEventListener('loadedmetadata', () => {
    if (v.videoWidth && v.videoHeight) box.style.aspectRatio = `${v.videoWidth} / ${v.videoHeight}`;
  }, { once: true });
  return box;
}

/** Beste beschikbare visual: echte clip > 2-frame demo > niets. */
export function visualBlock(exercise, opts) {
  return clipBlock(exercise, opts) || demoBlock(exercise, opts);
}

/** Korte demo-animatie (2 frames, lokaal, geen reclame). Valt terug op YouTube-thumb. */
export function demoBlock(exercise, { tag = 'Demo' } = {}) {
  if (!exercise?.demo) return null;
  const box = el('div', { class: 'demo' });
  const a = el('img', { src: `assets/demos/${exercise.id}/0.webp`, alt: '', class: 'on', loading: 'lazy' });
  const b = el('img', { src: `assets/demos/${exercise.id}/1.webp`, alt: '', loading: 'lazy' });
  box.append(a, b, el('span', { class: 'tag' }, tag));
  let on = 0;
  const iv = setInterval(() => {
    if (!document.body.contains(box)) return clearInterval(iv);
    on ^= 1;
    a.classList.toggle('on', !on);
    b.classList.toggle('on', !!on);
  }, 850);
  return box;
}

/** Voortgangsring met gradient + gloed. pct 0-100. */
export function ring(pct, big, small, size = 108) {
  const r = 46, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const wrap = el('div', { class: 'ring', style: `width:${size}px;height:${size}px` });
  wrap.innerHTML = `<svg viewBox="0 0 108 108">
      <defs><linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#198775"/><stop offset="100%" stop-color="#38edd0"/>
      </linearGradient></defs>
      <circle class="track" cx="54" cy="54" r="${r}" fill="none" stroke-width="8"/>
      <circle class="val" cx="54" cy="54" r="${r}" fill="none" stroke-width="8"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}"/>
    </svg>`;
  wrap.append(el('div', { class: 'mid' }, el('span', { class: 'n' }, big), el('span', { class: 'l' }, small)));
  requestAnimationFrame(() => { const v = wrap.querySelector('.val'); if (v) v.setAttribute('stroke-dashoffset', off.toFixed(1)); });
  return wrap;
}

/** Statrij met hairline-scheiders. items: [{n, l, accent?}] */
export function statRow(items) {
  return el('div', { class: 'statrow' }, items.map(it =>
    el('div', {}, el('div', { class: 'n' + (it.accent ? ' accent' : '') }, String(it.n)), el('div', { class: 'l' }, it.l))));
}

/** Kaartkop met icoonbadge. */
export function cardHead(iconSvg, title, right) {
  const badge = el('span', { class: 'badge-ico' });
  badge.innerHTML = iconSvg;
  return el('div', { class: 'cardhead' }, badge, el('div', { class: 'grow' }, el('h4', { class: 'mb0' }, title)), right || null);
}

/** Uitklapbare uitleg — houdt schermen rustig. */
export function explain(title, ...content) {
  const d = el('details', { class: 'explain' });
  d.append(el('summary', {}, title), el('div', { class: 'body' }, ...content));
  return d;
}

/** Weekstrip: 7 kolommen. days: [{label, pct, state:'done'|'planned'|'', today}] */
export function weekStrip(days) {
  return el('div', { class: 'weekstrip' }, days.map(d => {
    const bar = el('div', { class: 'bar ' + (d.state || ''), style: 'height:5px' });
    requestAnimationFrame(() => { bar.style.height = Math.max(6, Math.min(100, d.pct)) + '%'; });
    // Sporten van die dag: icoon per sport, fel = stevig, gedimd = licht.
    const sports = (d.sports || []).length
      ? el('div', { class: 'sp' }, (d.sports || []).slice(0, 3).map(sp =>
          el('span', {
            class: 'spi' + (sp.hard ? ' hard' : '') + (sp.planned ? ' planned' : ''),
            title: `${sp.nl}${sp.load ? ` · load ${sp.load}` : ''}${sp.planned ? ' (gepland)' : ''}`,
          }, sp.icon)))
      : el('div', { class: 'sp' });
    const col = el('div', { class: 'col' + (d.today ? ' today' : '') + (d.onClick ? ' tappable' : '') },
      bar, sports, el('span', { class: 'dl' }, d.label));
    if (d.onClick) col.addEventListener('click', d.onClick);
    return col;
  }));
}

/** Getal dat omhoog telt. */
export function countUp(node, to, { dur = 700, decimals = 0, suffix = '' } = {}) {
  const start = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    node.textContent = (to * eased).toFixed(decimals) + suffix;
    if (p < 1 && document.body.contains(node)) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Confetti-uitbarsting bij een PR. */
export function confetti(n = 34) {
  const wrap = el('div', { class: 'confetti-wrap' });
  const colors = ['#38edd0', '#9ae0d4', '#198775', '#e3edeb'];
  for (let i = 0; i < n; i++) {
    const p = el('i', { style: `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${(Math.random() * .35).toFixed(2)}s;transform:translateY(-10vh)` });
    wrap.append(p);
  }
  document.body.append(wrap);
  setTimeout(() => wrap.remove(), 2200);
}

/** Eenvoudig lichaamssilhouet, per spiergroep ingekleurd. levels: {muscle: 0..3} */
export function bodyMap(levels = {}, { height = 132 } = {}) {
  const COL = ['rgba(255,255,255,.05)', 'rgba(25,135,117,.45)', 'rgba(56,237,208,.55)', 'rgba(56,237,208,.95)'];
  const f = m => COL[Math.max(0, Math.min(3, levels[m] ?? 0))];
  // Voorkant: borst, schouders, biceps, core, quads · Achterkant: rug, triceps, billen, hams, kuiten
  const front = `<svg viewBox="0 0 100 210" aria-label="Voorkant">
    <ellipse class="body" cx="50" cy="16" rx="11" ry="13"/>
    <rect class="body" x="45" y="28" width="10" height="8" rx="3"/>
    <path class="mz" fill="${f('shoulders')}" d="M27 42c-6 2-9 7-9 13l11 3 5-15z"/>
    <path class="mz" fill="${f('shoulders')}" d="M73 42c6 2 9 7 9 13l-11 3-5-15z"/>
    <path class="mz" fill="${f('chest')}" d="M34 40h32c3 0 5 3 5 7v10c0 4-3 6-7 6H36c-4 0-6-2-6-6V47c0-4 1-7 4-7z"/>
    <path class="mz" fill="${f('biceps')}" d="M20 57c5 0 8 3 8 9v13c0 4-3 7-7 7s-7-3-7-8l2-16c0-3 1-5 4-5z"/>
    <path class="mz" fill="${f('biceps')}" d="M80 57c-5 0-8 3-8 9v13c0 4 3 7 7 7s7-3 7-8l-2-16c0-3-1-5-4-5z"/>
    <path class="mz" fill="${f('core')}" d="M36 65h28c2 0 3 2 3 4v33c0 3-2 5-5 5H38c-3 0-5-2-5-5V69c0-2 1-4 3-4z"/>
    <path class="body" d="M14 87c-3 8-4 14-4 20 0 3 2 5 5 5s5-2 5-5l2-19z"/>
    <path class="body" d="M86 87c3 8 4 14 4 20 0 3-2 5-5 5s-5-2-5-5l-2-19z"/>
    <path class="mz" fill="${f('quadriceps')}" d="M35 110h13c2 0 3 2 3 4l-2 40c0 4-3 7-7 7s-7-3-7-7l-3-40c0-2 1-4 3-4z"/>
    <path class="mz" fill="${f('quadriceps')}" d="M65 110H52c-2 0-3 2-3 4l2 40c0 4 3 7 7 7s7-3 7-7l3-40c0-2-1-4-3-4z"/>
    <path class="body" d="M37 163h10l-1 36c0 3-2 5-4 5s-4-2-4-5z"/>
    <path class="body" d="M63 163H53l1 36c0 3 2 5 4 5s4-2 4-5z"/>
  </svg>`;
  const back = `<svg viewBox="0 0 100 210" aria-label="Achterkant">
    <ellipse class="body" cx="50" cy="16" rx="11" ry="13"/>
    <rect class="body" x="45" y="28" width="10" height="8" rx="3"/>
    <path class="mz" fill="${f('shoulders')}" d="M27 42c-6 2-9 7-9 13l11 3 5-15z"/>
    <path class="mz" fill="${f('shoulders')}" d="M73 42c6 2 9 7 9 13l-11 3-5-15z"/>
    <path class="mz" fill="${f('back')}" d="M34 40h32c3 0 5 3 5 7l-3 26c-1 5-4 8-9 8H41c-5 0-8-3-9-8l-3-26c0-4 1-7 5-7z"/>
    <path class="mz" fill="${f('triceps')}" d="M20 57c5 0 8 3 8 9v13c0 4-3 7-7 7s-7-3-7-8l2-16c0-3 1-5 4-5z"/>
    <path class="mz" fill="${f('triceps')}" d="M80 57c-5 0-8 3-8 9v13c0 4 3 7 7 7s7-3 7-8l-2-16c0-3-1-5-4-5z"/>
    <path class="mz" fill="${f('back')}" d="M38 82h24c2 0 3 2 3 4v18c0 3-2 5-4 5H39c-2 0-4-2-4-5V86c0-2 1-4 3-4z"/>
    <path class="body" d="M14 87c-3 8-4 14-4 20 0 3 2 5 5 5s5-2 5-5l2-19z"/>
    <path class="body" d="M86 87c3 8 4 14 4 20 0 3-2 5-5 5s-5-2-5-5l-2-19z"/>
    <path class="mz" fill="${f('glutes')}" d="M35 110h30c2 0 3 2 3 4v12c0 6-5 10-11 10h-14c-6 0-11-4-11-10v-12c0-2 1-4 3-4z"/>
    <path class="mz" fill="${f('hamstrings')}" d="M36 138h12c2 0 3 1 3 3l-2 28c0 4-3 7-7 7s-6-3-7-7l-2-28c0-2 1-3 3-3z"/>
    <path class="mz" fill="${f('hamstrings')}" d="M64 138H52c-2 0-3 1-3 3l2 28c0 4 3 7 7 7s6-3 7-7l2-28c0-2-1-3-3-3z"/>
    <path class="mz" fill="${f('calves')}" d="M38 176h9l-1 23c0 3-2 5-4 5s-4-2-4-5z"/>
    <path class="mz" fill="${f('calves')}" d="M62 176h-9l1 23c0 3 2 5 4 5s4-2 4-5z"/>
  </svg>`;
  const wrap = el('div', { class: 'bodymap', style: `--h:${height}px` });
  wrap.innerHTML = front + back;
  wrap.querySelectorAll('svg').forEach(s => { s.style.height = height + 'px'; });
  return wrap;
}

/** Kleine inline-iconen voor kaartkoppen. */
export const ICO = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h7l-1 8 11-12h-7l1-8z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 6.6a5 5 0 0 0-8.8-1.9A5 5 0 0 0 3.2 6.6c-1 3 1.4 5.9 3.6 8 1.6 1.6 3.3 3 5.2 4.4 1.9-1.4 3.6-2.8 5.2-4.4 2.2-2.1 4.6-5 3.6-8z"/></svg>',
  body: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2.2"/><path d="M12 7v7M12 14l-3 6M12 14l3 6M6.5 9.5 12 8l5.5 1.5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="4"/><path d="M8 15a4 4 0 0 1 8 0"/><path d="M12 12V9"/></svg>',
  tv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="13" rx="3"/><path d="M8 21h8"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 14v6"/></svg>',
};
