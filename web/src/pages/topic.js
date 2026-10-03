import { html, esc, scope } from '../lib/html.js';
import { sanitize } from '../lib/sanitize.js';
import { isRead, toggleRead, setLastTopic, recordActivity } from '../lib/progress.js';
import { getSubject, getTopic, isReady } from '../data/index.js';
import { getQuiz } from '../quizzes/index.js';
import { crumbs, emptyState } from '../components/cards.js';
import { icons } from '../components/icons.js';
import { toast } from '../components/toast.js';
import { quizPlayerReady, mountQuiz } from '../components/quiz-player.js';
import * as notFound from './not-found.js';

const TABS = ['synopsis', 'tricks', 'practice'];

function synopsisPanel(t) {
  // Synopsis bodies allow a small set of formatting tags; everything else is stripped.
  return t.synopsis.map((sec) => html`<article class="card prose"><h3>${esc(sec.heading)}</h3>${sanitize(sec.body)}</article>`);
}

function tricksPanel(t) {
  return (t.tricks || []).map(
    (tr, i) => html`<article class="card trick">
      <div class="trick-num">${i + 1}</div>
      <div>
        <h3>${esc(tr.title)}</h3>
        <p>${esc(tr.body)}</p>
        ${tr.example && `<div class="example">${esc(tr.example)}</div>`}
      </div>
    </article>`,
  );
}

function practicePanel(s, t) {
  if (quizPlayerReady && getQuiz(s.id, t.id)) return '<div id="quiz-root"></div>';
  return emptyState({
    title: 'Practice questions are coming',
    body: 'Each topic will get a short quiz with worked explanations. For now, read the tricks and try the related game.',
    action: { href: '#/games', label: 'Browse games' },
  });
}

function sidebar(s, t, ready) {
  const done = isRead(s.id, t.id);
  const idx = s.topics.indexOf(t);
  const next = [...s.topics.slice(idx + 1), ...s.topics.slice(0, idx)].find(isReady);
  return html`<aside class="aside">
    ${ready && html`<div class="card">
      <h3>${done ? 'You have read this topic' : 'Finished reading?'}</h3>
      <button id="mark-read" class="btn ${done && 'btn-done'}" type="button">${done ? `${icons.check} Marked as read` : 'Mark as read'}</button>
    </div>`}
    ${t.formulas?.length > 0 && html`<div class="card formula-list"><h3>Key rules</h3>${t.formulas.map(
      (f) => html`<div class="formula"><span>${esc(f.label)}</span><code>${esc(f.value)}</code></div>`,
    )}</div>`}
    ${next && html`<div class="card"><a class="next-link" href="#/topic/${s.id}/${next.id}"><small>Next topic</small><b>${esc(next.title)} →</b></a></div>`}
  </aside>`;
}

export function render({ subjectId, topicId, tab }) {
  const s = getSubject(subjectId);
  const t = getTopic(subjectId, topicId);
  if (!s || !t) return notFound.render();

  const active = TABS.includes(tab) ? tab : 'synopsis';
  const ready = isReady(t);
  const quiz = getQuiz(s.id, t.id);
  const base = `#/topic/${s.id}/${t.id}`;
  const labels = {
    synopsis: 'Synopsis',
    tricks: `Tricks (${(t.tricks || []).length})`,
    practice: `Practice${quiz ? ` (${quiz.questions.length})` : ''}`,
  };

  let panel;
  if (!ready) {
    panel = emptyState({
      title: 'Notes for this topic are on the way',
      body: 'The synopsis and tricks for this topic are being written. Try one of the ready topics in the meantime.',
      action: { href: `#/subject/${s.id}`, label: `Back to ${s.name}` },
    });
  } else if (active === 'tricks') panel = tricksPanel(t);
  else if (active === 'practice') panel = practicePanel(s, t);
  else panel = synopsisPanel(t);

  return html`<div class="${scope(s)} contents">
    ${crumbs([{ label: 'Home', href: '#/' }, { label: s.name, href: `#/subject/${s.id}` }, { label: t.title }])}
    <div class="page-head">
      <div class="eyebrow">${esc(s.name)} · ${esc(t.level || 'Foundation')}</div>
      <h1>${esc(t.title)}</h1>
      <p>${esc(t.blurb)}</p>
      <div class="meta"><span>${t.minutes || 10} min read</span><span>${(t.tricks || []).length} tricks</span><span>${(t.formulas || []).length} key rules</span></div>
    </div>
    <div class="topic-layout">
      <div class="topic-main">
        ${ready && html`<div class="tabs" role="tablist">${TABS.map(
          (id) => `<a class="tab" role="tab" href="${base}${id === 'synopsis' ? '' : `/${id}`}" aria-selected="${active === id}">${labels[id]}</a>`,
        )}</div>`}
        <div class="panel">${panel}</div>
      </div>
      ${sidebar(s, t, ready)}
    </div>
  </div>`;
}

export function mount(root, { subjectId, topicId }, { rerender }) {
  const t = getTopic(subjectId, topicId);
  if (!isReady(t)) return;
  setLastTopic(subjectId, topicId);

  root.querySelector('#mark-read')?.addEventListener('click', () => {
    toast(toggleRead(subjectId, topicId) ? 'Marked as read' : 'Marked as unread');
    rerender();
  });

  const quizRoot = root.querySelector('#quiz-root');
  if (quizRoot) {
    return mountQuiz(quizRoot, getQuiz(subjectId, topicId), { subject: getSubject(subjectId), topic: t, onFinish: () => recordActivity() });
  }
}
