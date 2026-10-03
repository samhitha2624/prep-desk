import { html, esc } from '../../lib/html.js';
import { listUsers, deleteUser, setRole, isAdmin, currentUser } from '../../lib/auth/index.js';
import { initials } from '../../components/user-menu.js';
import { toast } from '../../components/toast.js';
import { adminFrame, bindConfirm, errorBox, showError } from './ui.js';

export function render() {
  return adminFrame(
    'users',
    {
      title: 'Users',
      intro: 'Everyone with an account. Admins can open this dashboard.',
    },
    html`${errorBox()}
      <div class="table-wrap card"><table class="admin-table">
        <thead><tr><th>Name</th><th>Role</th><th>Joined</th><th class="num">Topics read</th><th></th></tr></thead>
        <tbody id="user-rows"><tr><td colspan="5" class="meta">Loading accounts…</td></tr></tbody>
      </table></div>`,
  );
}

export async function mount(root, params, { rerender }) {
  const body = root.querySelector('#user-rows');
  let users;
  try {
    users = await listUsers();
  } catch (e) {
    body.innerHTML = '';
    return showError(root, e.message);
  }
  const me = currentUser();
  users.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  body.innerHTML = users.length
    ? users
        .map((u) => {
          const admin = isAdmin(u);
          const self = u.id === me.id;
          const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
          return html`<tr>
            <td class="cell-user"><span class="avatar" aria-hidden="true">${esc(initials(u.name || u.email))}</span>
              <div class="cell-main"><b>${esc(u.name || '—')}${self && ' <span class="meta">(you)</span>'}</b><small>${esc(u.email)}</small></div></td>
            <td>${admin ? '<span class="chip chip-admin">Admin</span>' : '<span class="chip">Learner</span>'}</td>
            <td>${joined}</td>
            <td class="num">${u.topicsRead ?? 0}</td>
            <td class="row-actions">
              <button class="btn btn-ghost btn-sm" type="button" data-role="${u.id}" data-to="${admin ? 'learner' : 'admin'}">${admin ? 'Remove admin' : 'Make admin'}</button>
              ${!self && `<button class="btn btn-danger btn-sm" type="button" data-delete="${u.id}" data-confirm="Confirm delete">Delete</button>`}
            </td>
          </tr>`;
        })
        .join('')
    : '<tr><td colspan="5" class="meta">No accounts yet.</td></tr>';

  body.querySelectorAll('[data-role]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      try {
        await setRole(btn.dataset.role, btn.dataset.to);
        toast(btn.dataset.to === 'admin' ? 'Admin access given' : 'Admin access removed');
        if (btn.dataset.role === me.id && btn.dataset.to !== 'admin') location.hash = '#/';
        else rerender();
      } catch (e) {
        showError(root, e.message);
      }
    }),
  );
  bindConfirm(body, '[data-delete]', async (btn) => {
    try {
      await deleteUser(btn.dataset.delete);
      toast('Account deleted');
      rerender();
    } catch (e) {
      showError(root, e.message);
    }
  });
}
