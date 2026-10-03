import { html, esc, scope } from '../lib/html.js';
import { getSubject, getTopic } from '../data/index.js';
import { allQuizzes } from '../quizzes/index.js';
import { pageHead, emptyState } from '../components/cards.js';

export function render() {
  const list = allQuizzes()
    .map(({ subjectId, topicId, quiz }) => ({ s: getSubject(subjectId), t: getTopic(subjectId, topicId), quiz }))
    .filter((x) => x.s && x.t);

  const body = list.length
    ? html`<div class="grid grid-2">${list.map(
        ({ s, t, quiz }) => html`<a class="card topic-row ${scope(s)}" href="#/topic/${s.id}/${t.id}/practice">
          <span class="nav-dot"></span>
          <div><h4>${esc(t.title)}</h4><p>${esc(s.name)} · ${quiz.questions.length} questions</p></div>
          <span class="chip chip-subject">Start</span>
        </a>`,
      )}</div>`
    : emptyState({
        title: 'Topic quizzes are on the way',
        body: 'Every topic will get a short quiz with an explanation for each answer, and your scores will show up under Progress.',
        action: { href: '#/subjects', label: 'Study a topic first' },
      });

  return html`${pageHead({
    eyebrow: 'Learn by doing',
    title: 'Practice',
    intro: 'Test yourself topic by topic. Each answer comes with the shortcut that solves it fastest.',
  })}${body}`;
}
