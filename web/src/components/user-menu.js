// Account area in the top bar: log in / sign up buttons for guests, an avatar menu for signed-in users.
import { esc } from '../lib/html.js';
import { currentUser, logOut, isAdmin } from '../lib/auth/index.js';
import { toast } from './toast.js';

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function renderUserMenu() {
  const el = document.getElementById('user-menu');
  const user = currentUser();
  if (!user) {
    el.innerHTML = `<a class="btn btn-ghost btn-sm" href="#/login">Log in</a><a class="btn btn-sm hide-phone" href="#/signup">Sign up</a>`;
    return;
  }
  const first = user.name.split(/\s+/)[0];
  el.innerHTML = `
    <button class="user-button" id="user-button" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="user-dropdown">
      <span class="avatar" aria-hidden="true">${esc(initials(user.name))}</span><span class="hide-phone">${esc(first)}</span>
    </button>
    <div class="user-dropdown" id="user-dropdown" role="menu" hidden>
      <div class="user-dropdown-head"><b>${esc(user.name)}</b><small>${esc(user.email)}</small></div>
      ${isAdmin(user) ? '<a role="menuitem" href="#/admin">Admin dashboard</a>' : ''}
      <a role="menuitem" href="#/account">Account</a>
      <a role="menuitem" href="#/progress">My progress</a>
      <button role="menuitem" type="button" id="menu-logout">Log out</button>
    </div>`;
}

export function setupUserMenu() {
  document.addEventListener('click', async (e) => {
    const button = document.getElementById('user-button');
    const dropdown = document.getElementById('user-dropdown');
    if (!button || !dropdown) return;
    if (e.target.closest('#user-button')) {
      const open = dropdown.hidden;
      dropdown.hidden = !open;
      button.setAttribute('aria-expanded', String(open));
      return;
    }
    if (e.target.closest('#menu-logout')) {
      await logOut();
      toast('Logged out');
      location.hash = '#/';
    }
    dropdown.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown && !dropdown.hidden) {
      dropdown.hidden = true;
      document.getElementById('user-button')?.focus();
    }
  });
}
