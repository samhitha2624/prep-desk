/*
 * Demo backend: the same functions as the API, kept in this browser's localStorage.
 * Used for the shareable preview (VITE_DEMO_MODE=true). Content starts from the API's seed files.
 * Passwords are salted and hashed with PBKDF2, but anyone with the browser can read this store.
 */
import { AppError } from '../auth/errors.js';

const subjectFiles = import.meta.glob('@seed/subjects/*/subject.json', { eager: true, import: 'default' });
const topicFiles = import.meta.glob('@seed/subjects/*/topics/*.json', { eager: true, import: 'default' });
const quizFiles = import.meta.glob('@seed/quizzes/*/*.json', { eager: true, import: 'default' });

const SUBJECT_ORDER = ['aptitude', 'reasoning', 'english'];
const order = (id) => (SUBJECT_ORDER.includes(id) ? SUBJECT_ORDER.indexOf(id) : SUBJECT_ORDER.length);
const clone = (v) => JSON.parse(JSON.stringify(v));
const fileKey = (path) => path.split('/').slice(-2);

function seed() {
  const topics = {};
  for (const [path, data] of Object.entries(topicFiles)) {
    const parts = path.split('/');
    topics[`${parts.at(-3)}/${parts.at(-1).replace('.json', '')}`] = data;
  }
  const subjects = Object.values(subjectFiles)
    .map((s) => ({ ...s, topics: s.topics.map((t) => ({ ...t, ...(topics[`${s.id}/${t.id}`] || {}) })) }))
    .sort((a, b) => order(a.id) - order(b.id));
  const quizzes = {};
  for (const [path, quiz] of Object.entries(quizFiles)) {
    const [subjectId, file] = fileKey(path);
    (quizzes[subjectId] ||= {})[file.replace('.json', '')] = quiz;
  }
  return clone({ subjects, quizzes });
}

const KEYS = { users: 'prepdesk.users.v2', session: 'prepdesk.session.v2', content: 'prepdesk.content.v2' };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new AppError('This browser is blocking site storage, so changes cannot be saved.', 'storage');
  }
}

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
async function hashPassword(password, saltHex) {
  const salt = Uint8Array.from(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return toHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256));
}

const publicUser = (u) => (u ? { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt } : null);
const slugify = (v) =>
  String(v).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'topic';

export function createDemoBackend() {
  const listeners = new Set();
  let current = null;
  const users = () => read(KEYS.users, []);
  const content = () => read(KEYS.content, null) || seed();
  const setUser = (u) => {
    current = publicUser(u);
    write(KEYS.session, u ? { id: u.id } : null);
    listeners.forEach((fn) => fn(current));
    return current;
  };
  const requireAdmin = () => {
    if (current?.role !== 'admin') throw new AppError('Only admins can do that.', 'forbidden', 403);
  };
  const editSubject = (subjectId, fn) => {
    const data = content();
    const subject = data.subjects.find((s) => s.id === subjectId);
    if (!subject) throw new AppError('That subject was not found.', 'not-found', 404);
    const result = fn(subject, data);
    write(KEYS.content, data);
    return result;
  };

  return {
    isDemo: true,

    async init() {
      const session = read(KEYS.session, null);
      current = publicUser(users().find((u) => u.id === session?.id));
      return current;
    },
    currentUser: () => current,
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    async signUp({ name, email, password }) {
      const list = users();
      email = email.toLowerCase();
      if (list.some((u) => u.email === email)) throw new AppError('An account with this email already exists. Log in instead.', 'email-in-use', 409);
      const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
      const user = { id: crypto.randomUUID(), name, email, role: list.length ? 'learner' : 'admin', salt, hash: await hashPassword(password, salt), createdAt: Date.now() };
      write(KEYS.users, [...list, user]);
      return publicUser(user);
    },
    async logIn({ email, password }) {
      const user = users().find((u) => u.email === email.toLowerCase());
      if (!user || (await hashPassword(password, user.salt)) !== user.hash) {
        throw new AppError('That email and password do not match. Check them and try again.', 'wrong-credentials', 400);
      }
      return setUser(user);
    },
    async logOut() {
      setUser(null);
    },
    async updateName(name) {
      const list = users();
      const user = list.find((u) => u.id === current?.id);
      user.name = name;
      write(KEYS.users, list);
      return setUser(user);
    },

    async loadContent() {
      return content();
    },
    async saveTopic(subjectId, fields, topicId) {
      requireAdmin();
      return editSubject(subjectId, (subject) => {
        let topic;
        if (topicId) {
          topic = subject.topics.find((t) => t.id === topicId);
          Object.assign(topic, fields);
        } else {
          const taken = new Set(subject.topics.map((t) => t.id));
          let id = slugify(fields.title);
          for (let n = 2; taken.has(id); n++) id = `${slugify(fields.title)}-${n}`;
          topic = { id, ...fields };
          subject.topics.push(topic);
        }
        return { subject, topic };
      });
    },
    async deleteTopic(subjectId, topicId) {
      requireAdmin();
      return editSubject(subjectId, (subject, data) => {
        subject.topics = subject.topics.filter((t) => t.id !== topicId);
        if (data.quizzes[subjectId]) delete data.quizzes[subjectId][topicId];
        return { subject };
      });
    },
    async restoreSubject(subjectId) {
      requireAdmin();
      const fresh = seed();
      const data = content();
      const subject = fresh.subjects.find((s) => s.id === subjectId);
      data.subjects = data.subjects.map((s) => (s.id === subjectId ? subject : s));
      data.quizzes[subjectId] = fresh.quizzes[subjectId] || {};
      write(KEYS.content, data);
      return { subject, quizzes: data.quizzes[subjectId] };
    },
    async saveQuiz(subjectId, topicId, quiz) {
      requireAdmin();
      return editSubject(subjectId, (subject, data) => {
        data.quizzes[subjectId] ||= {};
        if (quiz.questions.length) data.quizzes[subjectId][topicId] = quiz;
        else delete data.quizzes[subjectId][topicId];
        return { quiz: quiz.questions.length ? quiz : null };
      });
    },

    async listUsers() {
      requireAdmin();
      return users().map((u) => {
        const progress = read(`prepdesk.progress.v1.${u.id}`, null);
        return { ...publicUser(u), topicsRead: Object.keys(progress?.read || {}).length };
      });
    },
    async setRole(id, role) {
      requireAdmin();
      const list = users();
      const user = list.find((u) => u.id === id);
      if (role === 'learner' && user.role === 'admin' && list.filter((u) => u.role === 'admin').length <= 1) {
        throw new AppError('There must be at least one admin.', 'last-admin', 400);
      }
      user.role = role;
      write(KEYS.users, list);
      if (id === current?.id) setUser(user);
      return publicUser(user);
    },
    async deleteUser(id) {
      requireAdmin();
      if (id === current?.id) throw new AppError('You cannot delete your own account here.', 'self', 400);
      write(KEYS.users, users().filter((u) => u.id !== id));
      try {
        localStorage.removeItem(`prepdesk.progress.v1.${id}`);
      } catch {}
      return { ok: true };
    },

    // Progress already lives in this browser, so there is nothing to sync.
    loadProgress: async () => null,
    saveProgress: async () => {},
  };
}
