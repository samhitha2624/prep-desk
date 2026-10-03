import { authLayout } from '../components/auth-form.js';

// The API does not send email, so an admin sets things right instead.
export function render() {
  return authLayout({
    title: 'Forgot your password?',
    intro: 'Ask an admin to delete your account from the Users page, then sign up again with the same email. Your study progress starts fresh.',
    body: '<a class="btn btn-block" href="#/login">Back to log in</a>',
    footer: 'New here? <a href="#/signup">Create an account</a>',
  });
}
