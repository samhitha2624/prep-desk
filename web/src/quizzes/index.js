/*
 * Topic quizzes, loaded with the rest of the content from the API.
 * Shape: { subjectId: { topicId: { questions: [{ q, options, answer, explanation }] } } }
 */
import { backend } from '../lib/backend/index.js';

let quizzes = {};

export function setQuizzes(all) {
  quizzes = all || {};
}

export function setSubjectQuizzes(subjectId, list) {
  quizzes[subjectId] = list || {};
}

export function removeQuiz(subjectId, topicId) {
  if (quizzes[subjectId]) delete quizzes[subjectId][topicId];
}

export function getQuiz(subjectId, topicId) {
  const quiz = quizzes[subjectId]?.[topicId];
  return quiz?.questions?.length ? quiz : null;
}

export function allQuizzes() {
  return Object.entries(quizzes).flatMap(([subjectId, list]) =>
    Object.entries(list)
      .filter(([, quiz]) => quiz?.questions?.length)
      .map(([topicId, quiz]) => ({ subjectId, topicId, quiz })),
  );
}

// Admin: replace a topic's questions. An empty list removes the quiz.
export async function saveQuiz(subjectId, topicId, quiz) {
  const saved = await backend.saveQuiz(subjectId, topicId, quiz);
  if (saved.quiz) (quizzes[subjectId] ||= {})[topicId] = saved.quiz;
  else removeQuiz(subjectId, topicId);
}
