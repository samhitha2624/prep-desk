// Shared pieces for the admin screens.
import { html, esc } from '../../lib/html.js';
import { isDemoMode } from '../../lib/auth/index.js';

const SECTIONS = [
  ['overview', 'Overview', '#/admin'],
  ['topics', 'Topics', '#/admin/topics'],
  ['quizzes', 'Quizzes', '#/admin/quizzes'],
  ['users', 'Users', '#/admin/users'],
];

export function adminFrame(active, { title, intro, actions = '' }, body) {
  return html`<div class="admin">
    <div class="admin-head">
      <div class="page-head">
        <div class="eyebrow">Admin</div>
        <h1>${esc(title)}</h1>
        ${intro && `<p>${esc(intro)}</p>`}
      </div>
      ${actions && `<div class="admin-actions">${actions}</div>`}
    </div>
    <nav class="admin-tabs" aria-label="Admin sections">${SECTIONS.map(
      ([id, label, href]) => `<a href="${href}" ${id === active ? 'aria-current="page"' : ''}>${label}</a>`,
    )}</nav>
    ${isDemoMode() && '<p class="notice"><b>Demo mode.</b> Changes are saved in this browser only. Run the API to save them for everyone.</p>'}
    ${body}
  </div>`;
}

// Delete-style buttons need a second click within 4 seconds. Use data-confirm="Click again to delete".
export function bindConfirm(root, selector, onConfirm) {
  root.querySelectorAll(selector).forEach((btn) => {
    let timer = null;
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      if (!btn.classList.contains('armed')) {
        btn.classList.add('armed');
        btn.textContent = btn.dataset.confirm || 'Click again to confirm';
        timer = setTimeout(() => {
          btn.classList.remove('armed');
          btn.textContent = label;
        }, 4000);
        return;
      }
      clearTimeout(timer);
      btn.disabled = true;
      try {
        await onConfirm(btn);
      } finally {
        btn.disabled = false;
        btn.classList.remove('armed');
        btn.textContent = label;
      }
    });
  });
}

export function subjectSwitch(subjects, activeId, hrefFor) {
  return html`<div class="admin-switch" role="tablist">${subjects.map(
    (s) => `<a role="tab" class="chip-tab" href="${hrefFor(s.id)}" aria-selected="${s.id === activeId}">${esc(s.name)}</a>`,
  )}</div>`;
}

export function errorBox(id = 'admin-error') {
  return `<p class="form-error" id="${id}" role="alert" hidden></p>`;
}

export function showError(root, message, id = 'admin-error') {
  const box = root.querySelector(`#${id}`);
  box.textContent = message || '';
  box.hidden = !message;
  if (message) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
