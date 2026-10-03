// Sidebar (desktop), bottom tab bar (phone) and streak badge. Re-rendered on every route change.
import { html, esc, scope } from '../lib/html.js';
import { subjectStats, streak } from '../lib/progress.js';
import { subjects } from '../data/index.js';
import { icons } from './icons.js';
import { isAdmin } from '../lib/auth/index.js';

export function renderNav(route) {
  const section = route.name;
  const activeSubject = route.params.subjectId || null;
  const current = (on) => (on ? 'aria-current="page"' : '');

  const link = (id, href, label, icon) =>
    `<a class="nav-link" href="${href}" ${current(section === id)}>${icons[icon]}${label}</a>`;

  document.getElementById('nav-main').innerHTML = link('home', '#/', 'Home', 'home');

  document.getElementById('nav-subjects').innerHTML =
    '<div class="nav-label">Subjects</div>' +
    subjects
      .map((s) => {
        const st = subjectStats(s);
        return html`<a class="nav-link ${scope(s)}" href="#/subject/${s.id}" ${current(activeSubject === s.id)}>
          <span class="nav-dot"></span>${esc(s.name)}<span class="nav-count">${st.done}/${st.total}</span></a>`;
      })
      .join('');

  document.getElementById('nav-more').innerHTML =
    '<div class="nav-label">Learn by doing</div>' +
    link('games', '#/games', 'Games', 'game') +
    link('practice', '#/practice', 'Practice', 'quiz') +
    link('progress', '#/progress', 'Progress', 'chart') +
    (isAdmin() ? '<div class="nav-label nav-label-gap">Admin</div>' + link('admin', '#/admin', 'Dashboard', 'admin') : '');

  const tab = (href, label, icon, on) => `<a href="${href}" ${current(on)}>${icons[icon]}${label}</a>`;
  document.getElementById('tabbar').innerHTML =
    tab('#/', 'Home', 'home', section === 'home') +
    tab('#/subjects', 'Study', 'book', section === 'subjects' || Boolean(activeSubject)) +
    tab('#/games', 'Games', 'game', section === 'games' || section === 'game') +
    tab('#/practice', 'Practice', 'quiz', section === 'practice') +
    tab('#/progress', 'Progress', 'chart', section === 'progress');

  document.getElementById('streak').innerHTML = `${icons.flame}<b>${streak()}</b><span>day streak</span>`;
}
