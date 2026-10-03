// Reusable cards and blocks shared across pages.
import { html, esc, scope } from '../lib/html.js';
import { subjectStats } from '../lib/progress.js';
import { getSubject, subjects } from '../data/index.js';

export function subjectCard(s) {
  const st = subjectStats(s);
  const preview = s.topics.slice(0, 4).map((t) => `<li class="chip">${esc(t.title)}</li>`);
  const more = s.topics.length > 4 ? `<li class="chip">+${s.topics.length - 4} more</li>` : '';
  return html`<a class="card subject-card ${scope(s)}" href="#/subject/${s.id}">
    <div class="eyebrow">${st.total} topics · ${st.ready} ready to study</div>
    <h3>${esc(s.name)}</h3>
    <p>${esc(s.tagline)}</p>
    <ul>${preview}${more}</ul>
    <div class="row"><span>${st.done} of ${st.total} read</span><span>${st.pct}%</span></div>
    <div class="bar"><span style="width:${st.pct}%"></span></div>
  </a>`;
}

export function gameCard(g) {
  const s = getSubject(g.subject) || subjects[0];
  return html`<div class="card game-card ${scope(s)}">
    <div class="game-art" aria-hidden="true">${esc(g.preview || g.name)}</div>
    <div class="meta"><span class="chip chip-subject">${esc(s.name)}</span><span>${esc(g.skill)}</span></div>
    <h3>${esc(g.name)}</h3>
    <p>${esc(g.description)}</p>
    <div class="foot">
      <span class="meta">${g.minutes} min</span>
      ${g.playable ? `<a class="btn" href="#/games/${g.id}">Play</a>` : '<span class="chip chip-soon">Coming soon</span>'}
    </div>
  </div>`;
}

export function emptyState({ title, body, action }) {
  return html`<div class="empty">
    <h3>${esc(title)}</h3>
    <p>${esc(body)}</p>
    ${action ? `<a class="btn ${action.primary ? '' : 'btn-ghost'}" href="${action.href}">${esc(action.label)}</a>` : ''}
  </div>`;
}

export function crumbs(items) {
  return html`<nav class="crumbs" aria-label="Breadcrumb">${items
    .map((c) => (c.href ? `<a href="${c.href}">${esc(c.label)}</a>` : `<span>${esc(c.label)}</span>`))
    .join('<span>/</span>')}</nav>`;
}

export function pageHead({ eyebrow, title, intro }) {
  return html`<div class="page-head">
    <div class="eyebrow">${esc(eyebrow)}</div>
    <h1>${esc(title)}</h1>
    ${intro ? `<p>${esc(intro)}</p>` : ''}
  </div>`;
}
