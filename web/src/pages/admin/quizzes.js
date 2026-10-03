import { html, esc, scope } from '../../lib/html.js';
import { subjects, getSubject } from '../../data/index.js';
import { getQuiz } from '../../quizzes/index.js';
import { adminFrame, subjectSwitch } from './ui.js';

// List of every topic with its question count, grouped by subject.
export function render({ subjectId }) {
  const s = getSubject(subjectId) || subjects[0];
  return adminFrame(
    'quizzes',
    { title: 'Quizzes', intro: 'Pick a topic to add or delete its practice questions. Learners see them on the topic’s Practice tab.' },
    html`${subjectSwitch(subjects, s.id, (id) => `#/admin/quizzes/${id}`)}
      <div class="table-wrap card ${scope(s)}">
        <table class="admin-table">
          <thead><tr><th>Topic</th><th class="num">Questions</th><th></th></tr></thead>
          <tbody>${s.topics.map((t) => {
            const n = getQuiz(s.id, t.id)?.questions.length || 0;
            return html`<tr>
              <td class="cell-main"><b>${esc(t.title)}</b><small>${esc(t.level || '')}</small></td>
              <td class="num">${n ? n : '<span class="meta">None</span>'}</td>
              <td class="row-actions"><a class="btn btn-ghost btn-sm" href="#/admin/quiz/${s.id}/${t.id}">${n ? 'Edit questions' : 'Add questions'}</a></td>
            </tr>`;
          })}</tbody>
        </table>
      </div>`,
  );
}
