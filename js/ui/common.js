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

/** YouTube-embed die pas laadt na een tik (scheelt data & tracking). Zonder video-ID: zoekknop. */
export function videoBlock(exercise) {
  const wrap = el('div', { class: 'video-wrap' });
  if (exercise.video) {
    const thumb = el('button', { class: 'video-thumb', 'aria-label': 'Speel instructievideo af' },
      el('img', { src: `https://i.ytimg.com/vi/${exercise.video}/hqdefault.jpg`, alt: '', loading: 'lazy' }),
      el('span', { class: 'play' }, '▶'),
      el('span', { class: 'tiny', style: 'position:relative' }, 'Instructievideo laden'));
    thumb.addEventListener('click', () => {
      wrap.innerHTML = '';
      wrap.append(el('iframe', {
        src: `https://www.youtube-nocookie.com/embed/${exercise.video}?autoplay=1&rel=0&playsinline=1`,
        allow: 'autoplay; encrypted-media; picture-in-picture',
        allowfullscreen: true,
      }));
    });
    wrap.append(thumb);
  } else {
    const q = encodeURIComponent(exercise.name + ' proper form');
    wrap.append(el('a', { class: 'video-thumb', href: `https://www.youtube.com/results?search_query=${q}`, target: '_blank', rel: 'noopener', style: 'text-decoration:none' },
      el('span', { class: 'play' }, '🔍'),
      el('span', { class: 'tiny', style: 'position:relative' }, 'Nog geen vaste video — zoek op YouTube')));
  }
  return wrap;
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
