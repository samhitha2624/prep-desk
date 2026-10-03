# API

The backend in `api/` is a Node.js + Express server. It stores everything in one JSON file (`api/data/db.json`), created from `api/data/seed/` the first time it runs. All routes are under `/api`, take and return JSON, and report problems as:

```json
{ "error": { "code": "wrong-credentials", "message": "That email and password do not match." } }
```

## Endpoints

| Method and path | Who | What it does |
| --- | --- | --- |
| `GET /api/health` | Anyone | `{ "ok": true }` |
| `POST /api/auth/signup` | Anyone | `{ name, email, password }` creates an account (201). It does not log in; the app sends people to the login page next. |
| `POST /api/auth/login` | Anyone | `{ email, password }` sets the login cookie and returns `{ user }` |
| `POST /api/auth/logout` | Anyone | Clears the login cookie |
| `GET /api/auth/me` | Anyone | `{ user }`, or `{ user: null }` when logged out |
| `PATCH /api/auth/me` | Logged in | `{ name }` changes your display name |
| `GET /api/content` | Anyone | `{ subjects, quizzes }`: every subject with its topics, and every quiz |
| `GET /api/progress` | Logged in | `{ progress: { read, last, days } }` |
| `PUT /api/progress` | Logged in | Replaces your saved progress |
| `POST /api/admin/subjects/:subjectId/topics` | Admin | Adds a topic. The id is made from the title. Returns `{ subject, topic }`. |
| `PUT /api/admin/subjects/:subjectId/topics/:topicId` | Admin | Replaces a topic's fields |
| `DELETE /api/admin/subjects/:subjectId/topics/:topicId` | Admin | Deletes a topic and its quiz |
| `POST /api/admin/subjects/:subjectId/restore` | Admin | Puts a subject's topics and quizzes back to the seed files |
| `PUT /api/admin/quizzes/:subjectId/:topicId` | Admin | `{ questions }` replaces a quiz. An empty list removes it. |
| `GET /api/admin/users` | Admin | Every account with role, join date and topics read |
| `PATCH /api/admin/users/:userId` | Admin | `{ role: "admin" \| "learner" }`. There must always be at least one admin. |
| `DELETE /api/admin/users/:userId` | Admin | Deletes an account and its progress. You cannot delete yourself. |

A user looks like `{ id, name, email, role, createdAt }`, where `role` is `admin` or `learner`. Topic and quiz shapes are in [CONTENT_GUIDE.md](CONTENT_GUIDE.md).

## Accounts and security

- **Passwords** are hashed with scrypt and a random salt per account. The plain password is never stored.
- **Logging in** sets an `httpOnly`, `SameSite=Lax` cookie named `prepdesk_session` holding a signed token (HMAC-SHA256) that lasts 30 days. Browser JavaScript cannot read it. In production it is also `Secure`.
- **The signing secret** is `AUTH_SECRET` in `api/.env`. In development it is generated into `api/data/.secret` if empty. In production the server refuses to start without it. Changing it logs everyone out.
- **Admins** are the first account ever created, anyone listed in `ADMIN_EMAILS`, and anyone an admin promotes on the Users screen. The server checks the role on every admin request; hiding the dashboard in the browser is only for convenience.
- **Log in and sign up** are limited to 20 attempts per IP address every 15 minutes.
- **Every request body** is validated in `api/src/validation.js`. Synopsis HTML is cleaned again in the browser before it is shown.
- **Forgotten passwords:** the API does not send email. An admin deletes the account and the learner signs up again. Adding email reset means adding a mail service and a reset-token route.

## Settings (`api/.env`)

Copy `api/.env.example` to `api/.env`. Everything is optional in development.

| Setting | Default | Meaning |
| --- | --- | --- |
| `PORT` | `4000` | Port to listen on |
| `AUTH_SECRET` | generated | Secret that signs login cookies. Required in production. |
| `ADMIN_EMAILS` | none | Comma-separated emails that are always admins |
| `DATA_FILE` | `data/db.json` | Where the database lives |
| `CORS_ORIGIN` | none | Set this only if the web app is hosted on a different domain from the API |
| `NODE_ENV` | `development` | `production` turns on secure cookies and requires `AUTH_SECRET` |

To start over with fresh data, stop the API and delete `api/data/db.json`.

## Deploying

The simplest setup is one server that runs everything:

```bash
npm install
npm run build                                   # makes web/dist
NODE_ENV=production AUTH_SECRET=<long random value> npm start
```

The API serves the web app at `/` and the API at `/api`. Put it behind HTTPS (most hosts such as Render, Railway or a VPS with Caddy do this for you). Keep `api/data/` on a persistent disk so accounts survive restarts, and back up `db.json`.

To host the web app separately (for example on Netlify), build it with `VITE_API_URL=https://your-api.example.com/api` in `web/.env`, and set `CORS_ORIGIN` on the API to the web app's address. Both should be on HTTPS.

The JSON file suits a class or a small group. For many users, swap `api/src/db.js` for a real database (SQLite or PostgreSQL); the routes only use `read()` and `update()`, so nothing else needs to change.

## Tests

`npm test` runs `api/test/api.test.js` with Node's built-in test runner. Each test starts the app on a temporary data file, so your own `db.json` is never touched.
