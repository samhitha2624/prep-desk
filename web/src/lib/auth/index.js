/*
 * Accounts, used by the rest of the app.
 *   await initAuth()          once at startup; returns the signed-in user or null
 *   currentUser()             { id, name, email, role, createdAt } or null
 *   onAuthChange(fn)          called with the user (or null) after log in and log out
 *   signUp, logIn, logOut, updateName
 *   isAdmin(user), and for admins: listUsers, setRole, deleteUser
 */
import { backend, initBackend } from '../backend/index.js';

export async function initAuth() {
  await initBackend();
  return backend.init();
}

export const isDemoMode = () => backend.isDemo;
export const currentUser = () => backend.currentUser();
export const onAuthChange = (fn) => backend.onChange(fn);
export const isAdmin = (user = currentUser()) => user?.role === 'admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same rules as the API, so most mistakes are caught before a request is sent.
export function validate({ name, email, password }, { isSignUp } = {}) {
  const errors = {};
  if (isSignUp && !name?.trim()) errors.name = 'Enter your name.';
  if (!EMAIL_RE.test(email?.trim() || '')) errors.email = 'Enter a valid email address, like name@example.com.';
  if (isSignUp ? (password || '').length < 8 : !password) errors.password = isSignUp ? 'Use at least 8 characters for your password.' : 'Enter your password.';
  return errors;
}

export const signUp = ({ name, email, password }) => backend.signUp({ name: name.trim(), email: email.trim(), password });
export const logIn = ({ email, password }) => backend.logIn({ email: email.trim(), password });
export const logOut = () => backend.logOut();
export const updateName = (name) => backend.updateName(name.trim());

// Admin only.
export const listUsers = () => backend.listUsers();
export const setRole = (id, role) => backend.setRole(id, role);
export const deleteUser = (id) => backend.deleteUser(id);
