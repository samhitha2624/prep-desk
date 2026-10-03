// Remembers where to go after logging in, so a redirect to the login page can come back.
let returnTo = null;

export function setReturnTo(hash) {
  returnTo = hash && !/^#\/(login|signup|reset)/.test(hash) ? hash : null;
}

export function goAfterAuth() {
  const target = returnTo || '#/';
  returnTo = null;
  location.hash = target;
}

// One-time message for the next page, such as "Account created" on the login screen.
let flash = null;

export function setFlash(value) {
  flash = value;
}

export function takeFlash() {
  const value = flash;
  flash = null;
  return value;
}
