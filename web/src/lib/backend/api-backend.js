// Talks to the Prep Desk API (api/). The session lives in an httpOnly cookie set by the server.
import { apiUrl } from '../../config.js';
import { AppError, NETWORK_MESSAGE } from '../auth/errors.js';

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(apiUrl + path, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AppError(NETWORK_MESSAGE, 'network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AppError(data.error?.message || 'Something went wrong. Try again.', data.error?.code, res.status);
  return data;
}

export function createApiBackend() {
  const listeners = new Set();
  let current = null;
  const setUser = (user) => {
    current = user;
    listeners.forEach((fn) => fn(current));
    return user;
  };

  return {
    isDemo: false,

    async init() {
      try {
        current = (await request('GET', '/auth/me')).user;
      } catch {
        current = null;
      }
      return current;
    },
    currentUser: () => current,
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    signUp: async (body) => (await request('POST', '/auth/signup', body)).user,
    logIn: async (body) => setUser((await request('POST', '/auth/login', body)).user),
    async logOut() {
      await request('POST', '/auth/logout');
      setUser(null);
    },
    updateName: async (name) => setUser((await request('PATCH', '/auth/me', { name })).user),

    loadContent: () => request('GET', '/content'),
    saveTopic: (subjectId, fields, topicId) =>
      topicId
        ? request('PUT', `/admin/subjects/${subjectId}/topics/${topicId}`, fields)
        : request('POST', `/admin/subjects/${subjectId}/topics`, fields),
    deleteTopic: (subjectId, topicId) => request('DELETE', `/admin/subjects/${subjectId}/topics/${topicId}`),
    restoreSubject: (subjectId) => request('POST', `/admin/subjects/${subjectId}/restore`),
    saveQuiz: (subjectId, topicId, quiz) => request('PUT', `/admin/quizzes/${subjectId}/${topicId}`, quiz),

    listUsers: async () => (await request('GET', '/admin/users')).users,
    setRole: async (id, role) => {
      const { user } = await request('PATCH', `/admin/users/${id}`, { role });
      if (id === current?.id) setUser(user);
      return user;
    },
    deleteUser: (id) => request('DELETE', `/admin/users/${id}`),

    loadProgress: async () => (await request('GET', '/progress')).progress,
    saveProgress: (progress) => request('PUT', '/progress', progress),
  };
}
