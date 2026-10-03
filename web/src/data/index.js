/*
 * Study content, loaded from the API (GET /api/content) at startup.
 * `subjects` is a live array updated in place, so every page sees admin edits straight away.
 * The starting content lives in api/data/seed; see docs/CONTENT_GUIDE.md.
 */
import { backend } from '../lib/backend/index.js';
import { setQuizzes, setSubjectQuizzes, removeQuiz } from '../quizzes/index.js';

export const subjects = [];
export const LEVELS = ['Foundation', 'Core', 'Advanced'];

export async function loadContent() {
  const data = await backend.loadContent();
  subjects.splice(0, subjects.length, ...data.subjects);
  setQuizzes(data.quizzes);
}

export function getSubject(id) {
  return subjects.find((s) => s.id === id);
}

export function getTopic(subjectId, topicId) {
  return getSubject(subjectId)?.topics.find((t) => t.id === topicId);
}

export function isReady(topic) {
  return Boolean(topic?.synopsis?.length);
}

export function readyTopics() {
  return subjects.flatMap((s) => s.topics.filter(isReady).map((t) => ({ subject: s, topic: t })));
}

/* ---------- Admin edits (the API checks the user is an admin) ---------- */

function replaceSubject(subject) {
  const i = subjects.findIndex((s) => s.id === subject.id);
  if (i >= 0) subjects[i] = subject;
}

// Adds a topic (topicId null) or replaces one. Returns the saved topic, with its id.
export async function saveTopic(subjectId, fields, topicId = null) {
  const { subject, topic } = await backend.saveTopic(subjectId, fields, topicId);
  replaceSubject(subject);
  return topic;
}

export async function deleteTopic(subjectId, topicId) {
  const { subject } = await backend.deleteTopic(subjectId, topicId);
  replaceSubject(subject);
  removeQuiz(subjectId, topicId);
}

// Puts a subject's topics and quizzes back to the seed files.
export async function restoreSubject(subjectId) {
  const { subject, quizzes } = await backend.restoreSubject(subjectId);
  replaceSubject(subject);
  setSubjectQuizzes(subjectId, quizzes);
}
