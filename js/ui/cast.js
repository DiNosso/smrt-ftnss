// TV-modus: één groot scherm met de huidige oefening, demo, reps, timer en wat er hierna komt.
// Bedoeld om te spiegelen naar de TV (AirPlay-schermsynchronisatie of Chromecast "scherm casten"):
// je cast één keer en de hele training loopt daarna vanzelf mee.

import { el, fmtTime, visualBlock } from './common.js';

export function openTV(getState, { onClose } = {}) {
  const view = el('div', { class: 'tv' });
  const top = el('div', { class: 'tvtop' });
  const main = el('div', { class: 'tvmain' });
  const bar = el('div', { class: 'tvbar' }, el('i', { style: 'width:0%' }));
  const ctl = el('div', { class: 'tvctl' },
    el('button', { class: 'btn-sm', onclick: () => close() }, '✕ Sluit TV-modus'));
  view.append(ctl, top, main, bar);
  document.body.append(view);

  let wakeLock = null;
  (async () => { try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* ok */ } })();

  const close = () => {
    view.remove();
    wakeLock?.release?.();
    clearInterval(tick);
    onClose?.();
  };

  let lastKey = '';
  const render = () => {
    const st = getState();
    if (!st) return close();
    const key = `${st.exId}|${st.setNo}|${st.resting ? 'r' : 'w'}|${Math.round(st.restLeft || 0)}|${st.doneSets}`;
    if (key === lastKey) return;
    lastKey = key;

    top.innerHTML = '';
    top.append(
      el('span', { class: 't' }, st.sessionName),
      el('span', { class: 'tvmeta' }, `set ${st.doneSets}/${st.totalSets}`),
      el('span', { class: 'clock' }, fmtTime(st.elapsed)));

    main.innerHTML = '';
    const vid = el('div', { class: 'tvvid' });
    const demo = st.exercise ? visualBlock(st.exercise, { tag: '' }) : null;
    if (demo) { vid.append(demo); }
    else if (st.exercise?.video) {
      vid.append(el('img', { class: 'on', src: `https://i.ytimg.com/vi/${st.exercise.video}/hqdefault.jpg`, alt: '' }));
    }
    // De clips zijn staand (9:16). Op een liggend tv-scherm zou een brede
    // videokolom dat vullen met zwarte balken links en rechts. Daarom krijgt
    // de kolom de verhouding van het beeld zelf, zodat de ruimte die overblijft
    // naar de reps en de timer gaat — die wil je op afstand kunnen lezen.
    fitVideoColumn(vid);
    const side = el('div', { class: 'tvside' });
    if (st.resting) {
      side.append(
        el('div', { class: 'tvmeta' }, 'Rust'),
        el('div', { class: 'tvbig' }, fmtTime(Math.max(0, st.restLeft))),
        el('div', { class: 'tvmeta' }, `Daarna: set ${st.setNo} · ${st.scheme}`));
    } else {
      side.append(
        el('div', { class: 'tvmeta' }, `Set ${st.setNo} van ${st.setsInExercise}`),
        el('div', { class: 'tvex' }, st.exName),
        el('div', { class: 'tvscheme' }, st.scheme),
        st.weightText ? el('div', { class: 'tvmeta' }, st.weightText) : null,
        el('div', { class: 'tvmeta' }, `Rust na deze set: ${fmtTime(st.rest)}`));
    }
    side.append(el('div', { class: 'tvnext' }, st.nextText ? el('span', {}, 'Hierna: ', el('b', {}, st.nextText)) : el('span', {}, 'Laatste oefening — afmaken!')));
    main.append(vid, side);
    bar.querySelector('i').style.width = `${Math.round((st.doneSets / Math.max(1, st.totalSets)) * 100)}%`;
  };

  const tick = setInterval(render, 400);
  render();
  return { close, render };
}

/** Geef de videokolom de verhouding van het beeld dat erin zit. */
function fitVideoColumn(box) {
  const apply = (w, h) => {
    if (!w || !h) return false;
    box.style.aspectRatio = `${w} / ${h}`;
    box.classList.toggle('portrait', h > w);
    return true;
  };
  const probe = () => {
    const v = box.querySelector('video');
    if (v?.videoWidth) return apply(v.videoWidth, v.videoHeight);
    const img = box.querySelector('img');
    if (img?.naturalWidth) return apply(img.naturalWidth, img.naturalHeight);
    if (v) v.addEventListener('loadedmetadata', probe, { once: true });
    if (img) img.addEventListener('load', probe, { once: true });
    return false;
  };
  if (probe()) return;
  // Kan de clip niet afspelen, dan wisselt clipBlock 'm om voor de animatie.
  // Meet dan opnieuw, zodat het kader alsnog de goede verhouding krijgt.
  const mo = new MutationObserver(() => { if (probe()) mo.disconnect(); });
  mo.observe(box, { childList: true, subtree: true });
  setTimeout(() => mo.disconnect(), 8000);
}
