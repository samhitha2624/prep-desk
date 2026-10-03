import { html, esc } from '../lib/html.js';
import { currentUser, updateName, logOut, isDemoMode } from '../lib/auth/index.js';
import { subjects } from '../data/index.js';
import { subjectStats, streak } from '../lib/progress.js';
import { pageHead } from '../components/cards.js';
import { initials } from '../components/user-menu.js';
import { toast } from '../components/toast.js';

export function render() {
  const user = currentUser();
  const done = subjects.reduce((n, s) => n + subjectStats(s).done, 0);
  const joined = new Date(user.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return html`${pageHead({ eyebrow: 'Account', title: 'Your account' })}
    <section class="card account-card">
      <div class="account-id">
        <span class="avatar avatar-lg" aria-hidden="true">${esc(initials(user.name))}</span>
        <div>
          <h2>${esc(user.name)}</h2>
          <p>${esc(user.email)}</p>
          <p class="meta"><span>Joined ${joined}</span><span>${done} topics read</span><span>${streak()} day streak</span></p>
        </div>
      </div>
      ${isDemoMode() && '<p class="notice"><b>Demo mode.</b> This account is saved only in this browser. Run the API to keep accounts on the server.</p>'}
    </section>

    <section class="card account-card">
      <h2>Profile</h2>
      <form id="profile-form" class="inline-form" novalidate>
        <div class="field" data-field="name">
          <label for="name">Display name</label>
          <input id="name" name="name" type="text" autocomplete="name" value="${esc(user.name)}">
          <small class="error" role="alert"></small>
        </div>
        <button class="btn" type="submit">Save name</button>
      </form>
    </section>

    <section class="card account-card">
      <h2>Log out</h2>
      <p>Your progress stays saved to your account.</p>
      <button id="logout" class="btn btn-ghost" type="button">Log out</button>
    </section>`;
}

export function mount(root, params, { rerender }) {
  root.querySelector('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = root.querySelector('#name');
    const err = root.querySelector('[data-field="name"] .error');
    if (!input.value.trim()) {
      err.textContent = 'Enter a name.';
      input.focus();
      return;
    }
    try {
      await updateName(input.value);
      toast('Name saved');
      rerender();
    } catch (e2) {
      err.textContent = e2.message;
    }
  });

  root.querySelector('#logout').addEventListener('click', async () => {
    await logOut();
    toast('Logged out');
    location.hash = '#/';
  });
}
