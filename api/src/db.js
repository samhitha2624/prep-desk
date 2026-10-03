/*
 * A small JSON-file database. Fine for a single server and a few thousand learners; swap for
 * PostgreSQL or MongoDB later by reimplementing these functions.
 *
 * Shape of data/db.json:
 *   { users: [{ id, name, email, role, passwordHash, createdAt }],
 *     subjects: [{ id, name, tagline, color, topics: [...] }],
 *     quizzes: { subjectId: { topicId: { questions: [...] } } },
 *     progress: { userId: { read, last, days } } }
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { dataFile } from './config.js';
import { loadSeed } from './seed.js';

let data = null;

function load() {
  if (data) return data;
  if (existsSync(dataFile)) {
    data = JSON.parse(readFileSync(dataFile, 'utf8'));
  } else {
    const seed = loadSeed();
    data = { users: [], subjects: seed.subjects, quizzes: seed.quizzes, progress: {} };
    persist();
  }
  return data;
}

// Write to a temp file, then rename, so a crash never leaves a half-written database.
function persist() {
  mkdirSync(dirname(dataFile), { recursive: true });
  const tmp = `${dataFile}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, dataFile);
}

// Read access to the current data. Do not mutate the result; use update().
export function read() {
  return load();
}

// Runs fn with the data, saves, and returns fn's result. Node runs this synchronously, so writes never interleave.
export function update(fn) {
  const result = fn(load());
  persist();
  return result;
}

// For tests: start over with fresh seed data.
export function resetForTests() {
  const seed = loadSeed();
  data = { users: [], subjects: seed.subjects, quizzes: seed.quizzes, progress: {} };
  persist();
}
