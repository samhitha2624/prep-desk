# Prep Desk

A study app for aptitude, reasoning and English. Each topic has a short synopsis, shortcut tricks and key rules, with learning games, topic quizzes and progress tracking around them. Learners sign up and log in, and admins manage topics, quizzes and accounts from a dashboard. It works on phones and desktops.

The project has two parts:

| Folder | What it is | Built with |
| --- | --- | --- |
| `web/` | The frontend people use in the browser | Plain JavaScript modules and [Vite](https://vite.dev), no UI framework |
| `api/` | The backend: accounts, study content, admin changes and saved progress | Node.js and [Express](https://expressjs.com), data kept in a JSON file |

## Getting started

Requires Node.js 20.12 or newer. From the project folder:

```bash
npm install     # installs both web/ and api/
npm run dev     # starts the API on :4000 and the web app on :5173
```

Open http://localhost:5173 and create an account. **The first account becomes the admin.**

| Command | What it does |
| --- | --- |
| `npm run dev` | API and web dev server together, with live reload |
| `npm run dev:api` / `npm run dev:web` | Just one of them |
| `npm test` | API tests |
| `npm run build` | Builds the web app into `web/dist` |
| `npm start` | Runs the API, which also serves `web/dist` at http://localhost:4000 |
| `npm run build:demo` | Builds a version that needs no server (accounts and edits stay in the browser) |
| `npm run check:content` | Validates the seed content and quiz files |

To run it like production: `npm run build`, then `npm start`, and open http://localhost:4000.

## Open in VS Code

1. Unzip `prep-desk.zip` and open the `prep-desk` folder in VS Code (File → Open Folder).
2. Accept the recommended extensions when prompted (Prettier and EditorConfig).
3. Open a terminal (Terminal → New Terminal) and run `npm install`, then `npm run dev`.

Terminal → Run Task has the same commands (Start web + API, Run API tests, Build web and more). Run and Debug → **Debug API** starts the API with breakpoints.

## Project structure

```
prep-desk/
├── package.json             Runs both parts (npm workspaces)
├── scripts/dev.js           Starts API + web together for npm run dev
├── docs/                    Guides (see below)
├── .vscode/                 VS Code settings, tasks, debugger and extension picks
│
├── web/                     FRONTEND
│   ├── index.html           App shell (sidebar, top bar, tab bar)
│   ├── vite.config.js       Dev server (forwards /api to :4000) and build settings
│   ├── .env.example         API address, demo mode, require login
│   ├── public/              Static files (favicon)
│   └── src/
│       ├── main.js          Entry point: backend → content → router
│       ├── config.js        Reads web/.env
│       ├── app/             Hash router, route table, return-after-login
│       ├── pages/           One file per screen; admin/ holds the dashboard
│       ├── components/      Nav, search, cards, user menu, auth forms, quiz player
│       ├── lib/
│       │   ├── backend/     api-backend.js (talks to the API), demo-backend.js (browser only)
│       │   ├── auth/        Sign up, log in, roles
│       │   ├── progress.js  Read topics and streak, synced to the API when logged in
│       │   ├── sanitize.js  Cleans synopsis HTML
│       │   └── html.js      Template helper and escaping
│       ├── data/            Subjects and topics loaded from the API
│       ├── quizzes/         Quizzes loaded from the API
│       ├── games/           Game catalog and one folder per game
│       └── styles/          Tokens, layout, components, pages, responsive
│
└── api/                     BACKEND
    ├── .env.example         Port, login secret, admin emails, data file, CORS
    ├── src/
    │   ├── server.js        Starts the server
    │   ├── app.js           Express app: security headers, routes, serves web/dist
    │   ├── config.js        Reads api/.env
    │   ├── db.js            JSON-file database (data/db.json)
    │   ├── seed.js          Starting content
    │   ├── validation.js    Checks every request body
    │   ├── auth/            Password hashing and signed login tokens
    │   ├── middleware/      Who is logged in, admin check, rate limit
    │   └── routes/          auth, content, progress, admin
    ├── data/
    │   ├── seed/            Starting subjects, topics and quizzes (JSON)
    │   └── db.json          Created on first run; holds accounts and edits (not in git)
    ├── scripts/check-content.js
    └── test/api.test.js
```

## Where things go

| I want to… | Edit |
| --- | --- |
| Add, edit or delete topics, quizzes or accounts | Log in as an admin and open the dashboard ([docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md)) |
| Change the starting content | `api/data/seed/` ([docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)) |
| Add an API endpoint | `api/src/routes/`, mounted in `api/src/app.js` ([docs/API.md](docs/API.md)) |
| Add a screen | A file in `web/src/pages/`, listed in `web/src/app/routes.js` |
| Add a game | `web/src/games/catalog.js` plus `web/src/games/<id>/index.js` |
| Change colours or fonts | `web/src/styles/tokens.css` |
| Make every page need an account | `VITE_REQUIRE_LOGIN=true` in `web/.env` |
| Make someone an admin | Users screen in the dashboard, or `ADMIN_EMAILS` in `api/.env` |

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how web and api fit together
- [docs/API.md](docs/API.md): endpoints, accounts and security, deploying
- [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md): using the admin dashboard
- [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md): content, quiz and game file formats
