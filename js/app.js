// SMRT.FTNSS — router en tabbar

import { el, toast } from './ui/common.js';
import { get, S, update, todayISO } from './state.js';
import { renderToday } from './ui/today.js';
import { renderWeek } from './ui/week.js';
import { renderLibrary } from './ui/library.js';
import { renderProgress } from './ui/progress.js';
import { renderSettings } from './ui/settings.js';
import { applyCustomData } from './engine.js';

applyCustomData();

// Strakke lijn-iconen (feather-stijl) i.p.v. emoji's
const svg = (inner, fill = false) =>
  `<svg viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="${fill ? 'none' : 'currentColor'}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const ICONS = {
  today: svg('<path d="M13 2 3 14h7l-1 8 11-12h-7l1-8z"/>', true),
  week: svg('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M16 2v4M8 2v4M3 9.5h18"/>'),
  library: svg('<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>'),
  progress: svg('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
  settings: svg('<path d="M4 21v-6M4 9V3M12 21v-9M12 6V3M20 21v-4M20 11V3"/><path d="M2 15h4M10 8h4M18 17h4"/>'),
};

const TABS = [
  { id: 'today', label: 'Vandaag', render: renderToday },
  { id: 'week', label: 'Week', render: renderWeek },
  { id: 'library', label: 'Oefeningen', render: renderLibrary },
  { id: 'progress', label: 'Progressie', render: renderProgress },
  { id: 'settings', label: 'Instellingen', render: renderSettings },
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
    const b = el('button', { class: t.id === current ? 'active' : '', onclick: () => nav(t.id) });
    b.innerHTML = ICONS[t.id];
    b.append(t.label);
    tabbar.append(b);
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

// Is de opslag opgeruimd en teruggezet? Dat moet je weten, want dan is er
// mogelijk iets van de laatste sessie verloren.
if (window.__HERSTELD) {
  const { at } = window.__HERSTELD;
  setTimeout(() => toast(`Opslag was gewist — je gegevens zijn teruggezet vanaf de reservekopie van ${new Date(at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}`), 800);
}
