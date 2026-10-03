import { signUp, validate } from '../lib/auth/index.js';
import { setFlash } from '../app/navigation.js';
import { authLayout, field, bindForm } from '../components/auth-form.js';

export function render() {
  return authLayout({
    title: 'Create your account',
    intro: 'Save your progress, keep your streak and track every topic you finish.',
    body: `<form novalidate>
        ${field({ id: 'name', label: 'Full name', autocomplete: 'name' })}
        ${field({ id: 'email', label: 'Email', type: 'email', autocomplete: 'email' })}
        ${field({ id: 'password', label: 'Password', type: 'password', autocomplete: 'new-password', hint: 'At least 8 characters.' })}
        <p class="form-error" role="alert" hidden></p>
        <button class="btn btn-block" type="submit" data-busy="Creating account…">Create account</button>
      </form>`,
    footer: 'Already have an account? <a href="#/login">Log in</a>',
  });
}

export function mount(root) {
  bindForm(root, {
    async onSubmit(values, { showErrors }) {
      const errors = validate(values, { isSignUp: true });
      showErrors(errors);
      if (Object.keys(errors).length) return;
      // The account is created without logging in, so they log in with it next.
      const user = await signUp(values);
      setFlash({ email: user.email, message: `Account created for ${user.email}. Log in to start studying.` });
      location.hash = '#/login';
    },
  });


  root.querySelector('#name')?.focus();
}
