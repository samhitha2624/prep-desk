// Checks and cleans request bodies. Each function returns a clean object or throws a 400 with a readable message.
import { badRequest } from './errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const LEVELS = ['Foundation', 'Core', 'Advanced'];

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export function signupBody(body = {}) {
  const name = text(body.name, 80);
  const email = text(body.email, 254).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!name) throw badRequest('invalid-name', 'Enter your name.');
  if (!EMAIL_RE.test(email)) throw badRequest('invalid-email', 'Enter a valid email address, like name@example.com.');
  if (password.length < 8) throw badRequest('weak-password', 'Use at least 8 characters for your password.');
  if (password.length > 200) throw badRequest('weak-password', 'Use a password under 200 characters.');
  return { name, email, password };
}

export function loginBody(body = {}) {
  const email = text(body.email, 254).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) throw badRequest('wrong-credentials', 'Enter your email and password.');
  return { email, password };
}

export function nameBody(body = {}) {
  const name = text(body.name, 80);
  if (!name) throw badRequest('invalid-name', 'Enter a name.');
  return name;
}

// A list of objects with string fields; rows with every field empty are dropped.
function rows(list, fields, required, label) {
  if (list == null) return [];
  if (!Array.isArray(list)) throw badRequest('invalid-topic', `${label} must be a list.`);
  return list
    .map((item) => Object.fromEntries(fields.map(([k, max]) => [k, text(item?.[k], max)]).filter(([, v]) => v)))
    .filter((item) => Object.keys(item).length)
    .map((item, i) => {
      const missing = required.filter((k) => !item[k]);
      if (missing.length) throw badRequest('invalid-topic', `${label} ${i + 1}: fill in ${missing.join(' and ')}.`);
      return item;
    });
}

export function topicBody(body = {}) {
  const title = text(body.title, 120);
  if (!title) throw badRequest('invalid-topic', 'Enter a title.');
  const level = LEVELS.includes(body.level) ? body.level : 'Foundation';
  const minutes = Math.min(120, Math.max(1, Math.round(Number(body.minutes) || 10)));
  return {
    title,
    blurb: text(body.blurb, 240),
    level,
    minutes,
    synopsis: rows(body.synopsis, [['heading', 160], ['body', 8000]], ['heading', 'body'], 'Synopsis'),
    formulas: rows(body.formulas, [['label', 160], ['value', 400]], ['label', 'value'], 'Key rule'),
    tricks: rows(body.tricks, [['title', 160], ['body', 2000], ['example', 400]], ['title', 'body'], 'Trick'),
  };
}

export function quizBody(body = {}) {
  if (!Array.isArray(body.questions)) throw badRequest('invalid-quiz', 'Send a list of questions.');
  if (body.questions.length > 100) throw badRequest('invalid-quiz', 'A quiz can have up to 100 questions.');
  const questions = body.questions.map((q, i) => {
    const label = `Question ${i + 1}`;
    const question = text(q?.q, 1000);
    const options = Array.isArray(q?.options) ? q.options.map((o) => text(o, 300)).filter(Boolean).slice(0, 6) : [];
    const answer = Number(q?.answer);
    if (!question) throw badRequest('invalid-quiz', `${label}: write the question.`);
    if (options.length < 2) throw badRequest('invalid-quiz', `${label}: add at least two options.`);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) throw badRequest('invalid-quiz', `${label}: select the correct answer.`);
    const explanation = text(q?.explanation, 2000);
    return { q: question, options, answer, ...(explanation && { explanation }) };
  });
  return { questions };
}

export function progressBody(body = {}) {
  const read = {};
  for (const [key, ts] of Object.entries(body.read || {}).slice(0, 2000)) {
    if (/^[a-z0-9-]+\/[a-z0-9-]+$/.test(key) && Number.isFinite(ts)) read[key] = ts;
  }
  const days = (Array.isArray(body.days) ? body.days : []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-60);
  const last = typeof body.last === 'string' && /^[a-z0-9-]+\/[a-z0-9-]+$/.test(body.last) ? body.last : null;
  return { read, days, last };
}

export function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'topic'
  );
}
