/*
 * Admin dashboard. One route, several screens:
 *   #/admin                               overview
 *   #/admin/topics/:subjectId?            topic list
 *   #/admin/topic/:subjectId/:topicId     topic editor ("new" to add one)
 *   #/admin/quizzes/:subjectId?           quiz list
 *   #/admin/quiz/:subjectId/:topicId      quiz editor
 *   #/admin/users                         accounts
 */
import * as overview from './overview.js';
import * as topics from './topics.js';
import * as topicEditor from './topic-editor.js';
import * as quizzes from './quizzes.js';
import * as quizEditor from './quiz-editor.js';
import * as users from './users.js';
import * as notFound from '../not-found.js';

const SCREENS = { '': overview, topics, topic: topicEditor, quizzes, quiz: quizEditor, users };
const screen = (section = '') => SCREENS[section] || notFound;

export function render(params) {
  return screen(params.section).render(params);
}

export function mount(root, params, ctx) {
  return screen(params.section).mount?.(root, params, ctx);
}
