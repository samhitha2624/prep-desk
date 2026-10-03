/*
 * Quiz player for a topic's Practice tab: one question at a time, instant feedback with the
 * explanation, and a score at the end.
 *   mountQuiz(el, quiz, { subject, topic, onFinish(score, total) })
 */
import { esc } from '../lib/html.js';

export const quizPlayerReady = true;

export function mountQuiz(el, quiz, { onFinish } = {}) {
  const questions = quiz.questions;
  let index = 0;
  let score = 0;
  let answered = false;

  function renderQuestion() {
    const q = questions[index];
    answered = false;
    el.innerHTML = `
      <div class="quiz card">
        <div class="quiz-top">
          <span class="eyebrow">Question ${index + 1} of ${questions.length}</span>
          <span class="meta">Score ${score}</span>
        </div>
        <div class="bar"><span style="width:${(index / questions.length) * 100}%"></span></div>
        <h3 class="quiz-q">${esc(q.q)}</h3>
        <div class="quiz-options" role="group" aria-label="Answer options">
          ${q.options
            .map(
              (opt, i) =>
                `<button type="button" class="quiz-option" data-i="${i}"><span class="quiz-letter">${String.fromCharCode(65 + i)}</span><span>${esc(opt)}</span></button>`,
            )
            .join('')}
        </div>
        <div class="quiz-feedback" hidden></div>
        <div class="quiz-actions"><button type="button" class="btn" id="quiz-next" hidden>${index + 1 === questions.length ? 'See score' : 'Next question'}</button></div>
      </div>`;
  }

  function renderResult() {
    const pct = Math.round((score / questions.length) * 100);
    el.innerHTML = `
      <div class="quiz card quiz-result">
        <span class="eyebrow">Quiz complete</span>
        <h3>You scored ${score} out of ${questions.length}</h3>
        <div class="bar"><span style="width:${pct}%"></span></div>
        <p>${pct >= 80 ? 'Strong work. Try a harder topic next.' : pct >= 50 ? 'Good start. Review the tricks and try again.' : 'Go back over the synopsis and tricks, then have another go.'}</p>
        <div class="quiz-actions"><button type="button" class="btn" id="quiz-retry">Try again</button></div>
      </div>`;
    onFinish?.(score, questions.length);
  }

  function onClick(e) {
    const option = e.target.closest('.quiz-option');
    if (option && !answered) {
      answered = true;
      const q = questions[index];
      const chosen = Number(option.dataset.i);
      const correct = chosen === q.answer;
      if (correct) score++;
      el.querySelectorAll('.quiz-option').forEach((b) => {
        const i = Number(b.dataset.i);
        b.disabled = true;
        b.classList.toggle('is-correct', i === q.answer);
        b.classList.toggle('is-wrong', i === chosen && !correct);
      });
      const fb = el.querySelector('.quiz-feedback');
      fb.className = `quiz-feedback ${correct ? 'good' : 'bad'}`;
      fb.innerHTML = `<b>${correct ? 'Correct.' : `Not quite. The answer is ${esc(q.options[q.answer])}.`}</b>${q.explanation ? ` ${esc(q.explanation)}` : ''}`;
      fb.hidden = false;
      const next = el.querySelector('#quiz-next');
      next.hidden = false;
      next.focus();
      el.querySelector('.meta').textContent = `Score ${score}`;
      return;
    }
    if (e.target.closest('#quiz-next')) {
      index++;
      if (index < questions.length) renderQuestion();
      else renderResult();
    } else if (e.target.closest('#quiz-retry')) {
      index = 0;
      score = 0;
      renderQuestion();
    }
  }

  el.addEventListener('click', onClick);
  renderQuestion();
  return () => el.removeEventListener('click', onClick);
}
