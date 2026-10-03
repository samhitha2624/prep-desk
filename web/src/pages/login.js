import { logIn, validate } from '../lib/auth/index.js';
import { goAfterAuth, takeFlash } from '../app/navigation.js';
import { esc } from '../lib/html.js';
import { authLayout, field, bindForm } from '../components/auth-form.js';
import { toast } from '../components/toast.js';

let flash = null;

export function render() {
  flash = takeFlash();
  return authLayout({
    title: 'Welcome back',
    intro: 'Log in to pick up where you left off.',
    body: `${flash ? `<p class="form-success" role="status">${esc(flash.message)}</p>` : ''}
      <form novalidate>
        ${field({ id: 'email', label: 'Email', type: 'email', autocomplete: 'email', value: flash?.email || '' })}
        ${field({ id: 'password', label: 'Password', type: 'password', autocomplete: 'current-password' })}
        <a class="forgot" href="#/reset">Forgot password?</a>
        <p class="form-error" role="alert" hidden></p>
        <button class="btn btn-block" type="submit" data-busy="Logging in…">Log in</button>
      </form>`,
    footer: 'New to Prep Desk? <a href="#/signup">Create an account</a>',
  });
}

export function mount(root) {
  bindForm(root, {
    async onSubmit(values, { showErrors }) {
      const errors = validate(values);
      showErrors(errors);
      if (Object.keys(errors).length) return;
      const user = await logIn(values);
      toast(`Welcome back, ${user.name}`);
      goAfterAuth();
    },
  });


  root.querySelector(flash?.email ? '#password' : '#email')?.focus();
}
