/*
 * /api/admin: admin-only changes to topics, quizzes and accounts.
 *   POST   /subjects/:subjectId/topics                 add a topic
 *   PUT    /subjects/:subjectId/topics/:topicId        replace a topic
 *   DELETE /subjects/:subjectId/topics/:topicId        delete a topic and its quiz
 *   POST   /subjects/:subjectId/restore                restore the seed topics and quizzes
 *   PUT    /quizzes/:subjectId/:topicId                replace a topic's questions (empty list removes the quiz)
 *   GET    /users                                      list accounts with topics read
 *   PATCH  /users/:userId                              { role: "admin" | "learner" }
 *   DELETE /users/:userId                              delete an account and its progress
 */
import { Router } from 'express';
import { read, update } from '../db.js';
import { attachUser, requireAdmin, publicUser, isAdmin } from '../middleware/auth.js';
import { topicBody, quizBody, slugify } from '../validation.js';
import { badRequest, notFound } from '../errors.js';
import { seedSubject } from '../seed.js';

export const adminRoutes = Router();
adminRoutes.use(attachUser, requireAdmin);

function findSubject(db, subjectId) {
  const subject = db.subjects.find((s) => s.id === subjectId);
  if (!subject) throw notFound('That subject');
  return subject;
}

function findTopic(subject, topicId) {
  const topic = subject.topics.find((t) => t.id === topicId);
  if (!topic) throw notFound('That topic');
  return topic;
}

/* ---------- Topics ---------- */

adminRoutes.post('/subjects/:subjectId/topics', (req, res) => {
  const fields = topicBody(req.body);
  const result = update((db) => {
    const subject = findSubject(db, req.params.subjectId);
    const taken = new Set(subject.topics.map((t) => t.id));
    const base = slugify(fields.title);
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    const topic = { id, ...fields };
    subject.topics.push(topic);
    return { subject, topic };
  });
  res.status(201).json(result);
});

adminRoutes.put('/subjects/:subjectId/topics/:topicId', (req, res) => {
  const fields = topicBody(req.body);
  const result = update((db) => {
    const subject = findSubject(db, req.params.subjectId);
    const topic = findTopic(subject, req.params.topicId);
    Object.assign(topic, fields);
    return { subject, topic };
  });
  res.json(result);
});

adminRoutes.delete('/subjects/:subjectId/topics/:topicId', (req, res) => {
  const subject = update((db) => {
    const s = findSubject(db, req.params.subjectId);
    findTopic(s, req.params.topicId);
    s.topics = s.topics.filter((t) => t.id !== req.params.topicId);
    if (db.quizzes[s.id]) delete db.quizzes[s.id][req.params.topicId];
    return s;
  });
  res.json({ subject });
});

adminRoutes.post('/subjects/:subjectId/restore', (req, res) => {
  const seed = seedSubject(req.params.subjectId);
  if (!seed.subject) throw notFound('That subject');
  const result = update((db) => {
    const i = db.subjects.findIndex((s) => s.id === req.params.subjectId);
    db.subjects[i] = seed.subject;
    db.quizzes[req.params.subjectId] = seed.quizzes;
    return { subject: seed.subject, quizzes: seed.quizzes };
  });
  res.json(result);
});

/* ---------- Quizzes ---------- */

adminRoutes.put('/quizzes/:subjectId/:topicId', (req, res) => {
  const quiz = quizBody(req.body);
  update((db) => {
    findTopic(findSubject(db, req.params.subjectId), req.params.topicId);
    db.quizzes[req.params.subjectId] ||= {};
    if (quiz.questions.length) db.quizzes[req.params.subjectId][req.params.topicId] = quiz;
    else delete db.quizzes[req.params.subjectId][req.params.topicId];
  });
  res.json({ quiz: quiz.questions.length ? quiz : null });
});

/* ---------- Users ---------- */

adminRoutes.get('/users', (req, res) => {
  const { users, progress } = read();
  res.json({
    users: users.map((u) => ({ ...publicUser(u), topicsRead: Object.keys(progress[u.id]?.read || {}).length })),
  });
});

adminRoutes.patch('/users/:userId', (req, res) => {
  const role = req.body?.role;
  if (!['admin', 'learner'].includes(role)) throw badRequest('invalid-role', 'Role must be admin or learner.');
  const user = update((db) => {
    const u = db.users.find((x) => x.id === req.params.userId);
    if (!u) throw notFound('That account');
    if (role === 'learner' && isAdmin(u) && db.users.filter(isAdmin).length <= 1) {
      throw badRequest('last-admin', 'There must be at least one admin.');
    }
    u.role = role;
    return u;
  });
  res.json({ user: publicUser(user) });
});

adminRoutes.delete('/users/:userId', (req, res) => {
  if (req.params.userId === req.user.id) throw badRequest('self', 'You cannot delete your own account here.');
  update((db) => {
    const before = db.users.length;
    db.users = db.users.filter((u) => u.id !== req.params.userId);
    if (db.users.length === before) throw notFound('That account');
    delete db.progress[req.params.userId];
  });
  res.json({ ok: true });
});
