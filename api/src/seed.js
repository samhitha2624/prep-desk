/*
 * Starting content, read from api/data/seed:
 *   subjects/<subject>/subject.json        name, tagline, colour and topic outline
 *   subjects/<subject>/topics/<topic>.json synopsis, formulas and tricks
 *   quizzes/<subject>/<topic>.json         { questions: [...] }
 * Used to create the database on first run and by "Restore original" in the admin dashboard.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seedDir } from './config.js';

const SUBJECT_ORDER = ['aptitude', 'reasoning', 'english'];
const order = (id) => (SUBJECT_ORDER.includes(id) ? SUBJECT_ORDER.indexOf(id) : SUBJECT_ORDER.length);
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const dirs = (dir) => (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []);
const jsonFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : []);

export function loadSeed() {
  const subjectsDir = join(seedDir, 'subjects');
  const subjects = dirs(subjectsDir)
    .map((id) => {
      const subject = readJson(join(subjectsDir, id, 'subject.json'));
      const topicsDir = join(subjectsDir, id, 'topics');
      subject.topics = subject.topics.map((stub) => {
        const file = join(topicsDir, `${stub.id}.json`);
        return existsSync(file) ? { ...stub, ...readJson(file) } : stub;
      });
      return subject;
    })
    .sort((a, b) => order(a.id) - order(b.id));

  const quizzesDir = join(seedDir, 'quizzes');
  const quizzes = {};
  for (const subjectId of dirs(quizzesDir)) {
    for (const file of jsonFiles(join(quizzesDir, subjectId))) {
      (quizzes[subjectId] ||= {})[file.replace(/\.json$/, '')] = readJson(join(quizzesDir, subjectId, file));
    }
  }
  return { subjects, quizzes };
}

export function seedSubject(subjectId) {
  const seed = loadSeed();
  return { subject: seed.subjects.find((s) => s.id === subjectId), quizzes: seed.quizzes[subjectId] || {} };
}
