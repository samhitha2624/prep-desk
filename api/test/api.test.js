// End-to-end API tests against a real server on a random port with a throwaway database.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'prepdesk-test-'));
process.env.DATA_FILE = join(dir, 'db.json');
process.env.AUTH_SECRET = 'test-secret';

const { createApp } = await import('../src/app.js');
const { resetForTests } = await import('../src/db.js');

let server;
let base;

before(async () => {
  resetForTests();
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => {
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

// Tiny client that keeps the session cookie like a browser would.
function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
    return { status: res.status, body: await res.json() };
  };
}

const admin = client();
const learner = client();

test('health check', async () => {
  const r = await client()('GET', '/health');
  assert.equal(r.status, 200);
});

test('content is public and seeded', async () => {
  const r = await client()('GET', '/content');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.subjects.map((s) => s.id), ['aptitude', 'reasoning', 'english']);
  assert.equal(r.body.quizzes.aptitude.percentages.questions.length, 3);
});

test('sign up validates input', async () => {
  const r = await client()('POST', '/auth/signup', { name: '', email: 'bad', password: 'short' });
  assert.equal(r.status, 400);
  assert.equal(r.body.error.code, 'invalid-name');
});

test('first account is admin, sign up does not log in', async () => {
  const r = await admin('POST', '/auth/signup', { name: 'Samhita', email: 'Sam@Example.com', password: 'secret123' });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.role, 'admin');
  assert.equal(r.body.user.email, 'sam@example.com');
  assert.equal((await admin('GET', '/auth/me')).body.user, null);
});

test('duplicate email is rejected', async () => {
  const r = await client()('POST', '/auth/signup', { name: 'Other', email: 'sam@example.com', password: 'secret123' });
  assert.equal(r.status, 409);
});

test('log in with wrong and right password', async () => {
  assert.equal((await admin('POST', '/auth/login', { email: 'sam@example.com', password: 'nope-nope' })).status, 400);
  const r = await admin('POST', '/auth/login', { email: 'sam@example.com', password: 'secret123' });
  assert.equal(r.status, 200);
  assert.equal((await admin('GET', '/auth/me')).body.user.name, 'Samhita');
});

test('second account is a learner and cannot use admin routes', async () => {
  await learner('POST', '/auth/signup', { name: 'Ravi', email: 'ravi@example.com', password: 'password1' });
  await learner('POST', '/auth/login', { email: 'ravi@example.com', password: 'password1' });
  assert.equal((await learner('GET', '/auth/me')).body.user.role, 'learner');
  assert.equal((await learner('GET', '/admin/users')).status, 403);
  assert.equal((await client()('GET', '/admin/users')).status, 401);
});

test('admin adds, edits and deletes a topic', async () => {
  const created = await admin('POST', '/admin/subjects/aptitude/topics', {
    title: 'Profit & Loss Basics',
    level: 'Core',
    synopsis: [{ heading: 'CP and SP', body: 'Profit = SP − CP' }],
    tricks: [{ title: '', body: '' }],
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.topic.id, 'profit-loss-basics');
  assert.equal(created.body.topic.tricks.length, 0);

  const bad = await admin('PUT', '/admin/subjects/aptitude/topics/profit-loss-basics', { title: 'X', tricks: [{ title: 'No body' }] });
  assert.equal(bad.status, 400);

  const edited = await admin('PUT', '/admin/subjects/aptitude/topics/profit-loss-basics', { title: 'Profit and Loss', minutes: 15 });
  assert.equal(edited.body.topic.title, 'Profit and Loss');
  assert.equal(edited.body.topic.id, 'profit-loss-basics');

  const deleted = await admin('DELETE', '/admin/subjects/aptitude/topics/averages');
  assert.ok(!deleted.body.subject.topics.some((t) => t.id === 'averages'));
  assert.equal((await admin('DELETE', '/admin/subjects/aptitude/topics/averages')).status, 404);
});

test('admin saves and removes a quiz', async () => {
  const bad = await admin('PUT', '/admin/quizzes/reasoning/direction-sense', { questions: [{ q: 'Q', options: ['a'], answer: 0 }] });
  assert.equal(bad.status, 400);
  const ok = await admin('PUT', '/admin/quizzes/reasoning/direction-sense', {
    questions: [{ q: 'Facing North, turn right twice. Which way?', options: ['North', 'South'], answer: 1 }],
  });
  assert.equal(ok.status, 200);
  assert.equal((await client()('GET', '/content')).body.quizzes.reasoning['direction-sense'].questions.length, 1);
  await admin('PUT', '/admin/quizzes/reasoning/direction-sense', { questions: [] });
  assert.equal((await client()('GET', '/content')).body.quizzes.reasoning['direction-sense'], undefined);
});

test('restore brings back seed content', async () => {
  const r = await admin('POST', '/admin/subjects/aptitude/restore');
  const ids = r.body.subject.topics.map((t) => t.id);
  assert.ok(ids.includes('averages'));
  assert.ok(!ids.includes('profit-loss-basics'));
});

test('progress is saved per learner', async () => {
  const put = await learner('PUT', '/progress', { read: { 'aptitude/percentages': 1, 'bad key': 2 }, days: ['2026-10-03', 'x'], last: 'aptitude/percentages' });
  assert.deepEqual(Object.keys(put.body.progress.read), ['aptitude/percentages']);
  assert.deepEqual((await learner('GET', '/progress')).body.progress.days, ['2026-10-03']);
  assert.deepEqual((await admin('GET', '/progress')).body.progress.read, {});
});

test('admin manages users', async () => {
  const list = await admin('GET', '/admin/users');
  const ravi = list.body.users.find((u) => u.email === 'ravi@example.com');
  assert.equal(ravi.topicsRead, 1);
  const me = list.body.users.find((u) => u.email === 'sam@example.com');

  assert.equal((await admin('PATCH', `/admin/users/${me.id}`, { role: 'learner' })).body.error.code, 'last-admin');
  assert.equal((await admin('PATCH', `/admin/users/${ravi.id}`, { role: 'admin' })).body.user.role, 'admin');
  assert.equal((await admin('DELETE', `/admin/users/${me.id}`)).body.error.code, 'self');
  assert.equal((await admin('DELETE', `/admin/users/${ravi.id}`)).status, 200);
  assert.equal((await learner('GET', '/auth/me')).body.user, null);
});

test('log out clears the session', async () => {
  await admin('POST', '/auth/logout');
  assert.equal((await admin('GET', '/auth/me')).body.user, null);
});

test('tampered session cookie is ignored', async () => {
  const r = await fetch(`${base}/auth/me`, { headers: { Cookie: 'prepdesk_session=eyJzdWIiOiJ4In0.fake' } });
  assert.equal((await r.json()).user, null);
});
