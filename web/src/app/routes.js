/*
 * Route table. Each page module exports render(params) → HTML string,
 * and optionally mount(root, params, { rerender }) to wire up events after render.
 * Patterns use :name for parameters and a trailing ? for an optional one.
 * Flags: auth: true needs a signed-in user; admin: true needs an admin; guestOnly: true sends signed-in users home;
 *        layout: 'auth' shows the page full screen without the sidebar.
 */
import * as home from '../pages/home.js';
import * as subjects from '../pages/subjects.js';
import * as subject from '../pages/subject.js';
import * as topic from '../pages/topic.js';
import * as games from '../pages/games.js';
import * as game from '../pages/game.js';
import * as practice from '../pages/practice.js';
import * as progress from '../pages/progress.js';
import * as login from '../pages/login.js';
import * as signup from '../pages/signup.js';
import * as reset from '../pages/reset.js';
import * as account from '../pages/account.js';
import * as admin from '../pages/admin/index.js';

export const routes = [
  { name: 'home', path: '', page: home },
  { name: 'subjects', path: 'subjects', page: subjects },
  { name: 'subject', path: 'subject/:subjectId', page: subject },
  { name: 'topic', path: 'topic/:subjectId/:topicId/:tab?', page: topic },
  { name: 'games', path: 'games', page: games },
  { name: 'game', path: 'games/:gameId', page: game },
  { name: 'practice', path: 'practice', page: practice },
  { name: 'progress', path: 'progress', page: progress },
  { name: 'login', path: 'login', page: login, guestOnly: true, layout: 'auth' },
  { name: 'signup', path: 'signup', page: signup, guestOnly: true, layout: 'auth' },
  { name: 'reset', path: 'reset', page: reset, guestOnly: true, layout: 'auth' },
  { name: 'account', path: 'account', page: account, auth: true },
  { name: 'admin', path: 'admin/:section?/:subjectId?/:topicId?', page: admin, auth: true, admin: true },
];
