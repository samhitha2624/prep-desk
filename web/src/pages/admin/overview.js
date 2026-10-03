import { html, esc, scope } from '../../lib/html.js';
import { subjects, isReady } from '../../data/index.js';
import { getQuiz } from '../../quizzes/index.js';
import { listUsers } from '../../lib/auth/index.js';
import { adminFrame } from './ui.js';

function subjectCounts(s) {
  const ready = s.topics.filter(isReady).length;
  const tricks = s.topics.reduce((n, t) => n + (t.tricks?.length || 0), 0);
  const questions = s.topics.reduce((n, t) => n + (getQuiz(s.id, t.id)?.questions.length || 0), 0);
  return { total: s.topics.length, ready, tricks, questions };
}

export function render() {
  const rows = subjects.map((s) => ({ s, c: subjectCounts(s) }));
  const sum = (k) => rows.reduce((n, r) => n + r.c[k], 0);

  return adminFrame(
    'overview',
    {
      title: 'Dashboard',
      intro: 'Manage study topics, tricks, quizzes and the people using Prep Desk.',
      actions: '<a class="btn" href="#/admin/topic/aptitude/new">Add topic</a>',
    },
    html`<div class="stat-tiles">
        <div class="card tile"><span>Topics ready</span><b>${sum('ready')}<small> / ${sum('total')}</small></b></div>
        <div class="card tile"><span>Tricks</span><b>${sum('tricks')}</b></div>
        <div class="card tile"><span>Quiz questions</span><b>${sum('questions')}</b></div>
        <div class="card tile"><span>Accounts</span><b id="user-count">…</b></div>
      </div>

      <section class="section">
        <div class="section-head"><h2>Content by subject</h2></div>
        <div class="table-wrap card">
          <table class="admin-table">
            <thead><tr><th>Subject</th><th class="num">Topics</th><th class="num">Ready</th><th class="num">Tricks</th><th class="num">Questions</th><th>Completion</th><th></th></tr></thead>
            <tbody>${rows.map(({ s, c }) => {
              const pct = c.total ? Math.round((c.ready / c.total) * 100) : 0;
              return html`<tr class="${scope(s)}">
                <td><span class="nav-dot"></span><b>${esc(s.name)}</b></td>
                <td class="num">${c.total}</td><td class="num">${c.ready}</td><td class="num">${c.tricks}</td><td class="num">${c.questions}</td>
                <td><div class="bar"><span style="width:${pct}%"></span></div><small class="meta">${pct}% written</small></td>
                <td class="row-actions"><a class="btn btn-ghost btn-sm" href="#/admin/topics/${s.id}">Manage</a></td>
              </tr>`;
            })}</tbody>
          </table>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Topics still to write</h2></div>
        <div class="todo-list">${rows.map(
          ({ s }) => html`<div class="card todo ${scope(s)}">
            <h3>${esc(s.name)}</h3>
            <ul>${s.topics
              .filter((t) => !isReady(t))
              .slice(0, 5)
              .map((t) => html`<li><a href="#/admin/topic/${s.id}/${t.id}">${esc(t.title)}</a></li>`)}</ul>
            ${s.topics.every(isReady) && '<p class="meta">Every topic is written.</p>'}
          </div>`,
        )}</div>
      </section>`,
  );
}

export async function mount(root) {
  try {
    const users = await listUsers();
    root.querySelector('#user-count').textContent = users.length;
  } catch {
    root.querySelector('#user-count').textContent = '—';
  }
}
