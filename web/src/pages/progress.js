import { html, esc, scope } from '../lib/html.js';
import { subjectStats, streak } from '../lib/progress.js';
import { subjects } from '../data/index.js';
import { pageHead } from '../components/cards.js';

export function render() {
  const stats = subjects.map((s) => ({ s, st: subjectStats(s) }));
  const done = stats.reduce((n, x) => n + x.st.done, 0);
  const total = stats.reduce((n, x) => n + x.st.total, 0);

  return html`${pageHead({ eyebrow: 'Your study', title: 'Progress', intro: 'Topics you mark as read are saved in this browser.' })}
    <div class="card subject-head summary">
      <div class="subject-stats">
        <div class="stat"><b>${done}</b><span>Topics read</span></div>
        <div class="stat"><b>${total}</b><span>Topics in total</span></div>
        <div class="stat"><b>${streak()}</b><span>Day streak</span></div>
      </div>
    </div>
    <section class="section">
      <div class="section-head"><h2>By subject</h2></div>
      <div class="grid">${stats.map(
        ({ s, st }) => html`<a class="card progress-row ${scope(s)}" href="#/subject/${s.id}">
          <b>${esc(s.name)}</b><div class="bar"><span style="width:${st.pct}%"></span></div><span>${st.done} / ${st.total}</span>
        </a>`,
      )}</div>
    </section>`;
}
