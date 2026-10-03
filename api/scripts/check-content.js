// Validates the seed content and quiz files in api/data/seed. Run with: npm run check:content
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'seed');
const LEVELS = ['Foundation', 'Core', 'Advanced'];
const errors = [];
let topicsReady = 0;
let topicsTotal = 0;
let quizCount = 0;

const read = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    errors.push(`${file}: ${e.message}`);
    return null;
  }
};
const need = (cond, msg) => cond || errors.push(msg);

const subjectsDir = join(root, 'subjects');
for (const subjectId of readdirSync(subjectsDir)) {
  const dir = join(subjectsDir, subjectId);
  const subject = read(join(dir, 'subject.json'));
  if (!subject) continue;
  need(subject.id === subjectId, `${subjectId}/subject.json: id must be "${subjectId}"`);
  need(['apt', 'rsn', 'eng'].includes(subject.color), `${subjectId}/subject.json: color must be apt, rsn or eng`);

  const ids = new Set();
  for (const t of subject.topics || []) {
    topicsTotal++;
    const where = `${subjectId}/subject.json → ${t.id}`;
    need(/^[a-z0-9-]+$/.test(t.id || ''), `${where}: id must be lowercase-with-dashes`);
    need(!ids.has(t.id), `${where}: duplicate id`);
    ids.add(t.id);
    need(t.title, `${where}: missing title`);
    need(LEVELS.includes(t.level), `${where}: level must be one of ${LEVELS.join(', ')}`);
  }

  const topicsDir = join(dir, 'topics');
  if (!existsSync(topicsDir)) continue;
  for (const file of readdirSync(topicsDir).filter((f) => f.endsWith('.json'))) {
    const id = file.replace(/\.json$/, '');
    const where = `${subjectId}/topics/${file}`;
    need(ids.has(id), `${where}: no topic "${id}" in ${subjectId}/subject.json`);
    const topic = read(join(topicsDir, file));
    if (!topic) continue;
    need(Array.isArray(topic.synopsis) && topic.synopsis.length, `${where}: synopsis needs at least one section`);
    (topic.synopsis || []).forEach((s, i) => need(s.heading && s.body, `${where}: synopsis[${i}] needs heading and body`));
    (topic.formulas || []).forEach((f, i) => need(f.label && f.value, `${where}: formulas[${i}] needs label and value`));
    (topic.tricks || []).forEach((t, i) => need(t.title && t.body, `${where}: tricks[${i}] needs title and body`));
    topicsReady++;
  }
}

const quizDir = join(root, 'quizzes');
for (const subjectId of existsSync(quizDir) ? readdirSync(quizDir).filter((f) => !f.includes('.')) : []) {
  for (const file of readdirSync(join(quizDir, subjectId)).filter((f) => f.endsWith('.json'))) {
    const where = `quizzes/${subjectId}/${file}`;
    need(existsSync(join(subjectsDir, subjectId, 'subject.json')), `${where}: unknown subject "${subjectId}"`);
    const quiz = read(join(quizDir, subjectId, file));
    if (!quiz) continue;
    quizCount++;
    (quiz.questions || []).forEach((q, i) => {
      need(q.q && Array.isArray(q.options) && q.options.length >= 2, `${where}: question ${i + 1} needs q and 2+ options`);
      need(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < (q.options || []).length, `${where}: question ${i + 1} answer is out of range`);
    });
  }
}

console.log(`Topics: ${topicsReady} ready of ${topicsTotal}. Quizzes: ${quizCount}.`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('Content OK.');
