import { html, esc, scope } from '../lib/html.js';
import { subjectStats, isRead } from '../lib/progress.js';
import { getSubject, isReady, LEVELS } from '../data/index.js';
import { crumbs } from '../components/cards.js';
import { icons } from '../components/icons.js';
import * as notFound from './not-found.js';

function topicRow(s, t) {
  const ready = isReady(t);
  const done = isRead(s.id, t.id);
  const tag = ready ? 'a' : 'div';
  return html`<${tag} class="card topic-row ${ready ? '' : 'is-soon'}" ${ready && `href="#/topic/${s.id}/${t.id}"`}>
    <span class="topic-check ${done && 'done'}" aria-label="${done ? 'Read' : 'Not read yet'}">${icons.check}</span>
    <div><h4>${esc(t.title)}</h4><p>${esc(t.blurb)}</p></div>
    <div class="topic-side">
      ${ready ? '<span class="chip chip-ready">Ready</span>' : '<span class="chip chip-soon">Coming soon</span>'}
      <span class="meta">${t.minutes || 10} min</span>
    </div>
  </${tag}>`;
}

export function render({ subjectId }) {
  const s = getSubject(subjectId);
  if (!s) return notFound.render();
  const st = subjectStats(s);

  const blocks = LEVELS.map((level) => {
    const topics = s.topics.filter((t) => (t.level || 'Foundation') === level);
    return topics.length ? html`<div class="level-block"><h3>${level}</h3>${topics.map((t) => topicRow(s, t))}</div>` : '';
  });

  return html`<div class="${scope(s)} contents">
    ${crumbs([{ label: 'Home', href: '#/' }, { label: s.name }])}
    <section class="card subject-head">
      <div class="eyebrow">Subject</div>
      <h1>${esc(s.name)}</h1>
      <p>${esc(s.tagline)}</p>
      <div class="subject-stats">
        <div class="stat"><b>${st.total}</b><span>Topics</span></div>
        <div class="stat"><b>${st.ready}</b><span>Ready to study</span></div>
        <div class="stat"><b>${st.done}</b><span>Read</span></div>
      </div>
      <div class="bar"><span style="width:${st.pct}%"></span></div>
    </section>
    ${blocks}
  </div>`;
}
