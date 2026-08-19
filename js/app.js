// SMRT.FTNSS — router en tabbar

import { el } from './ui/common.js';
import { get, S, update, todayISO } from './state.js';
import { renderToday } from './ui/today.js';
import { renderWeek } from './ui/week.js';
import { renderLibrary } from './ui/library.js';
import { renderProgress } from './ui/progress.js';
import { renderSettings } from './ui/settings.js';
import { applyCustomData } from './engine.js';

applyCustomData();

const TABS = [
  { id: 'today', label: 'Vandaag', ico: '⚡', render: renderToday },
  { id: 'week', label: 'Week', ico: '🗓', render: renderWeek },
  { id: 'library', label: 'Oefeningen', ico: '📚', render: renderLibrary },
  { id: 'progress', label: 'Progressie', ico: '📈', render: renderProgress },
  { id: 'settings', label: 'Instellingen', ico: '⚙️', render: renderSettings },
];

let current = location.hash.replace('#', '') || 'today';
if (!TABS.some(t => t.id === current)) current = 'today';

const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');

export function nav(id) {
  current = id;
  location.hash = id;
  render();
}

export function render() {
  // programma-start vastleggen bij eerste gebruik
  if (!S().programStart) update(s => { s.settings.programStart = todayISO(); });

  tabbar.innerHTML = '';
  for (const t of TABS) {
    tabbar.append(el('button', { class: t.id === current ? 'active' : '', onclick: () => nav(t.id) },
      el('span', { class: 'ico' }, t.ico), t.label));
  }
  app.innerHTML = '';
  app.scrollTop = 0;
  window.scrollTo(0, 0);
  const tab = TABS.find(t => t.id === current);
  tab.render(app, { nav, render });
}

addEventListener('hashchange', () => {
  const id = location.hash.replace('#', '');
  if (TABS.some(t => t.id === id) && id !== current) { current = id; render(); }
});

render();
