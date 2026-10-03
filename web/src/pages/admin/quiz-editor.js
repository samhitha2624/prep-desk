import { html, esc } from '../../lib/html.js';
import { getSubject, getTopic } from '../../data/index.js';
import { getQuiz, saveQuiz } from '../../quizzes/index.js';
import { toast } from '../../components/toast.js';
import { adminFrame, errorBox, showError } from './ui.js';
import * as notFound from '../not-found.js';

const OPTION_COUNT = 4;
let uid = 0;

function questionHtml(q = { options: [], answer: 0 }) {
  const n = ++uid;
  return html`<div class="card question" data-question>
    <div class="question-head"><b class="question-num"></b><button type="button" class="btn btn-ghost btn-sm" data-remove>Delete question</button></div>
    <div class="field"><label for="q-${n}">Question</label><textarea id="q-${n}" data-q rows="2">${esc(q.q || '')}</textarea></div>
    <fieldset class="options">
      <legend>Options <small>Select the correct answer</small></legend>
      ${Array.from({ length: OPTION_COUNT }, (_, i) => html`<div class="option-row">
        <input type="radio" name="answer-${n}" id="a-${n}-${i}" value="${i}" ${q.answer === i && 'checked'} aria-label="Option ${String.fromCharCode(65 + i)} is correct">
        <label class="option-letter" for="a-${n}-${i}">${String.fromCharCode(65 + i)}</label>
        <input type="text" data-option="${i}" value="${esc(q.options[i] || '')}" placeholder="Option ${String.fromCharCode(65 + i)}${i > 1 ? ' (optional)' : ''}" aria-label="Option ${String.fromCharCode(65 + i)}">
      </div>`)}
    </fieldset>
    <div class="field"><label for="e-${n}">Explanation <small class="meta">shown after answering</small></label><textarea id="e-${n}" data-explanation rows="2">${esc(q.explanation || '')}</textarea></div>
  </div>`;
}

export function render({ subjectId, topicId }) {
  const s = getSubject(subjectId);
  const t = getTopic(subjectId, topicId);
  if (!s || !t) return notFound.render();
  const quiz = getQuiz(s.id, t.id);
  const questions = quiz?.questions?.length ? quiz.questions : [undefined];

  return adminFrame(
    'quizzes',
    {
      title: `${t.title} quiz`,
      intro: `${s.name} · ${quiz?.questions.length || 0} saved questions`,
      actions: `<a class="btn btn-ghost" href="#/admin/quizzes/${s.id}">Back to quizzes</a><a class="btn btn-ghost" href="#/topic/${s.id}/${t.id}/practice">Try it</a>`,
    },
    html`<form id="quiz-form" class="editor" novalidate>
      <div class="question-list">${questions.map((q) => questionHtml(q))}</div>
      <button type="button" class="btn btn-ghost" id="add-question">+ Add question</button>
      ${errorBox()}
      <div class="editor-save">
        <button class="btn" type="submit">Save quiz</button>
        <a class="btn btn-ghost" href="#/admin/quizzes/${s.id}">Cancel</a>
      </div>
    </form>`,
  );
}

function renumber(root) {
  root.querySelectorAll('[data-question]').forEach((el, i) => {
    el.querySelector('.question-num').textContent = `Question ${i + 1}`;
  });
}

export function mount(root, { subjectId, topicId }) {
  const form = root.querySelector('#quiz-form');
  if (!form) return;
  const list = root.querySelector('.question-list');
  renumber(root);

  root.querySelector('#add-question').addEventListener('click', () => {
    list.insertAdjacentHTML('beforeend', questionHtml());
    renumber(root);
    list.lastElementChild.querySelector('textarea').focus();
  });
  list.addEventListener('click', (e) => {
    if (!e.target.closest('[data-remove]')) return;
    e.target.closest('[data-question]').remove();
    renumber(root);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const problems = [];
    const questions = [];
    root.querySelectorAll('[data-question]').forEach((el, i) => {
      const q = el.querySelector('[data-q]').value.trim();
      const raw = [...el.querySelectorAll('[data-option]')].map((input) => input.value.trim());
      const picked = el.querySelector('input[type="radio"]:checked');
      const explanation = el.querySelector('[data-explanation]').value.trim();
      if (!q && raw.every((o) => !o) && !explanation) return; // empty question card is ignored
      const label = `Question ${i + 1}`;
      if (!q) problems.push(`${label}: write the question.`);
      if (raw.filter(Boolean).length < 2) problems.push(`${label}: add at least two options.`);
      if (!picked) problems.push(`${label}: select the correct answer.`);
      else if (!raw[Number(picked.value)]) problems.push(`${label}: the correct answer is empty.`);
      // Drop empty options and keep the answer pointing at the same text.
      const options = raw.filter(Boolean);
      const answer = picked ? options.indexOf(raw[Number(picked.value)]) : -1;
      questions.push({ q, options, answer, ...(explanation && { explanation }) });
    });
    if (problems.length) return showError(root, problems.join(' '));
    showError(root, '');

    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await saveQuiz(subjectId, topicId, { questions });
      toast(questions.length ? `Saved ${questions.length} question${questions.length === 1 ? '' : 's'}` : 'Quiz removed');
      location.hash = `#/admin/quizzes/${subjectId}`;
    } catch (err) {
      showError(root, err.message);
    } finally {
      button.disabled = false;
    }
  });
}
