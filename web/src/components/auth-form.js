// Building blocks for the log in, sign up and reset password screens.
import { html, esc } from '../lib/html.js';
import { isDemoMode } from '../lib/auth/index.js';

export function authLayout({ title, intro, body, footer }) {
  return html`<div class="auth">
    <section class="auth-aside" aria-hidden="true">
      <a class="brand" href="#/"><span class="brand-mark">P</span><span class="brand-name">Prep Desk</span></a>
      <div class="auth-pitch">
        <h2>Study smarter for placements and competitive exams.</h2>
        <ul>
          <li><b>30</b> topics across aptitude, reasoning and English</li>
          <li><b>Shortcut tricks</b> with worked examples for each topic</li>
          <li><b>Games and quizzes</b> to lock in every concept</li>
        </ul>
      </div>
      <div class="auth-sample">
        <span>Trick · Percentages</span>
        <code>37.5% of 640 = 3/8 × 640 = 240</code>
      </div>
    </section>
    <section class="auth-main">
      <a class="brand auth-brand-mobile" href="#/"><span class="brand-mark">P</span><span class="brand-name">Prep Desk</span></a>
      <div class="auth-card">
        <div class="auth-head">
          <h1>${esc(title)}</h1>
          ${intro && `<p>${esc(intro)}</p>`}
        </div>
        ${isDemoMode() && `<p class="notice" role="note"><b>Demo mode.</b> Accounts are saved only in this browser. Run the API to keep them on the server.</p>`}
        ${body}
      </div>
      ${footer && `<p class="auth-foot">${footer}</p>`}
      <a class="auth-skip" href="#/">Continue without an account</a>
    </section>
  </div>`;
}

export function field({ id, label, type = 'text', autocomplete, value = '', hint }) {
  const input = `<input id="${id}" name="${id}" type="${type}" autocomplete="${autocomplete || 'off'}" value="${esc(value)}" aria-describedby="${id}-error${hint ? ` ${id}-hint` : ''}">`;
  return html`<div class="field" data-field="${id}">
    <label for="${id}">${esc(label)}</label>
    ${type === 'password'
      ? `<div class="password">${input}<button type="button" class="reveal" data-reveal="${id}" aria-label="Show password" aria-pressed="false">Show</button></div>`
      : input}
    ${hint && `<small id="${id}-hint" class="hint">${esc(hint)}</small>`}
    <small id="${id}-error" class="error" role="alert"></small>
  </div>`;
}

// Wires show/hide buttons, inline errors and the submit state for a form.
export function bindForm(root, { onSubmit }) {
  const form = root.querySelector('form');
  const submit = form.querySelector('[type="submit"]');
  const formError = form.querySelector('.form-error');

  root.querySelectorAll('[data-reveal]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const input = root.querySelector(`#${btn.dataset.reveal}`);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }),
  );

  function showErrors(errors = {}) {
    root.querySelectorAll('.field').forEach((f) => {
      const msg = errors[f.dataset.field] || '';
      f.querySelector('.error').textContent = msg;
      f.classList.toggle('has-error', Boolean(msg));
    });
    const first = Object.keys(errors)[0];
    if (first) root.querySelector(`#${first}`)?.focus();
  }

  function setFormError(message) {
    formError.textContent = message || '';
    formError.hidden = !message;
  }

  form.addEventListener('input', (e) => {
    const f = e.target.closest('.field');
    if (f?.classList.contains('has-error')) {
      f.classList.remove('has-error');
      f.querySelector('.error').textContent = '';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFormError('');
    const values = Object.fromEntries(new FormData(form));
    const label = submit.textContent;
    submit.disabled = true;
    submit.textContent = submit.dataset.busy || 'Please wait…';
    try {
      await onSubmit(values, { showErrors, setFormError });
    } catch (err) {
      setFormError(err.message);
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });

  return { setFormError };
}
