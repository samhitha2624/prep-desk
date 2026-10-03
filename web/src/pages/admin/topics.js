import { html, esc, scope } from '../../lib/html.js';
import { subjects, getSubject, isReady, deleteTopic, restoreSubject } from '../../data/index.js';
import { getQuiz } from '../../quizzes/index.js';
import { toast } from '../../components/toast.js';
import { adminFrame, bindConfirm, subjectSwitch, errorBox, showError } from './ui.js';

export function render({ subjectId }) {
  const s = getSubject(subjectId) || subjects[0];
  return adminFrame(
    'topics',
    {
      title: 'Topics',
      intro: 'Add, edit or delete topics. A topic is visible to learners once it has at least one synopsis section.',
      actions: `<a class="btn" href="#/admin/topic/${s.id}/new">Add topic</a>`,
    },
    html`${subjectSwitch(subjects, s.id, (id) => `#/admin/topics/${id}`)}
      ${errorBox()}
      <div class="table-wrap card ${scope(s)}">
        <table class="admin-table">
          <thead><tr><th>Topic</th><th>Level</th><th>Status</th><th class="num">Tricks</th><th class="num">Questions</th><th></th></tr></thead>
          <tbody>${s.topics.map((t) => {
            const quiz = getQuiz(s.id, t.id);
            return html`<tr>
              <td class="cell-main"><b>${esc(t.title)}</b><small>${esc(t.blurb || '')}</small></td>
              <td>${esc(t.level || 'Foundation')}</td>
              <td>${isReady(t) ? '<span class="chip chip-ready">Ready</span>' : '<span class="chip chip-soon">Coming soon</span>'}</td>
              <td class="num">${t.tricks?.length || 0}</td>
              <td class="num">${quiz?.questions.length || 0}</td>
              <td class="row-actions">
                <a class="btn btn-ghost btn-sm" href="#/admin/topic/${s.id}/${t.id}">Edit</a>
                <a class="btn btn-ghost btn-sm" href="#/admin/quiz/${s.id}/${t.id}">Quiz</a>
                <button class="btn btn-danger btn-sm" type="button" data-delete="${t.id}" data-confirm="Confirm delete">Delete</button>
              </td>
            </tr>`;
          })}</tbody>
        </table>
        ${!s.topics.length && '<p class="empty-row">No topics yet. Use Add topic to create the first one.</p>'}
      </div>
      <div class="card restore">
        <div><h3>Restore original ${esc(s.name)} content</h3><p>Undo every change made to this subject and go back to the topics that shipped with the app. Quizzes are restored too.</p></div>
        <button class="btn btn-danger" type="button" id="restore" data-confirm="Click again to restore">Restore original</button>
      </div>`,
  );
}

export function mount(root, { subjectId }, { rerender }) {
  const s = getSubject(subjectId) || subjects[0];
  bindConfirm(root, '[data-delete]', async (btn) => {
    const id = btn.dataset.delete;
    const title = s.topics.find((t) => t.id === id)?.title;
    try {
      await deleteTopic(s.id, id);
      toast(`Deleted ${title}`);
      rerender();
    } catch (e) {
      showError(root, e.message);
    }
  });
  bindConfirm(root, '#restore', async () => {
    try {
      await restoreSubject(s.id);
      toast(`${s.name} restored`);
      rerender();
    } catch (e) {
      showError(root, e.message);
    }
  });
}
