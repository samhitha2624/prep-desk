# Architecture

```
Browser ── web/ (Vite app) ──fetch /api/...──▶ api/ (Express) ──▶ api/data/db.json
```

In development, Vite serves `web/` on port 5173 and forwards `/api` to the API on port 4000. In production, the API serves the built `web/dist` and `/api` from one port, so the login cookie stays on one site.

## Web (`web/`)

### Startup and page flow

1. `index.html` holds the static shell: sidebar, top bar, the `#view` outlet and the phone tab bar.
2. `src/main.js` calls `initAuth()`, which picks the backend and asks the API who is logged in. Then `loadContent()` fetches subjects, topics and quizzes. If the API cannot be reached, a "could not start" screen with a Try again button is shown.
3. Progress for the logged-in account is loaded and merged with this browser's copy.
4. `src/app/router.js` matches `location.hash` against `src/app/routes.js`.
5. The page's `render(params)` returns an HTML string for `#view`. If the page exports `mount(root, params, { rerender })`, it runs next to attach handlers, and may return a cleanup function.
6. `src/components/nav.js` re-renders the sidebar, tab bar and streak.

### Backend layer

Everything that reads or writes data goes through `src/lib/backend/index.js`, which exports one `backend` object:

- `api-backend.js` calls the API with `fetch` and `credentials: 'include'` so the login cookie is sent.
- `demo-backend.js` implements the same functions in `localStorage`, starting from the API's seed files. It is used only when `VITE_DEMO_MODE=true` (the shareable preview) and is left out of normal builds.

`src/lib/auth`, `src/data`, `src/quizzes` and `src/lib/progress.js` sit on top of `backend`, so pages never call `fetch` themselves.

### Routes

| Hash | Page |
| --- | --- |
| `#/` | `pages/home.js` |
| `#/subjects`, `#/subject/:subjectId` | `pages/subjects.js`, `subject.js` |
| `#/topic/:subjectId/:topicId/:tab?` | `pages/topic.js` (`tab` is `tricks` or `practice`) |
| `#/games`, `#/games/:gameId` | `pages/games.js`, `game.js` |
| `#/practice`, `#/progress` | `pages/practice.js`, `progress.js` |
| `#/login`, `#/signup`, `#/reset` | Full-screen auth pages, guests only |
| `#/account` | `pages/account.js` (needs an account) |
| `#/admin/...` | `pages/admin/index.js` (admins only) |

### Data on the web side

- **Content**: `subjects` in `src/data/index.js` is a live array filled from `GET /api/content` and updated in place after admin edits, so every page sees changes at once.
- **Quizzes**: `src/quizzes/index.js`, keyed by subject then topic, played by `src/components/quiz-player.js`.
- **Games**: metadata in `src/games/catalog.js`; each game's code loads only when opened.
- **Progress**: kept in `localStorage` (`prepdesk.progress.v1` for guests, `prepdesk.progress.v1.<userId>` per account). When logged in, it is merged with `GET /api/progress` on login and saved with `PUT /api/progress` shortly after each change, so it follows the learner to other devices.

## API (`api/`)

- `src/app.js` builds the Express app: JSON body limit, cookies, security headers, optional CORS, the four routers, a JSON 404 for unknown `/api` paths, static `web/dist`, and the error handler.
- `src/middleware/auth.js` reads the login cookie into `req.user` and provides `requireUser` and `requireAdmin`.
- `src/routes/` holds `auth.js`, `content.js`, `progress.js` and `admin.js`. Each validates input with `src/validation.js` and throws `HttpError`s from `src/errors.js`, which become `{ error: { code, message } }` responses.
- `src/db.js` keeps `{ users, subjects, quizzes, progress }` in memory and writes it to `data/db.json` after each change (write to a temp file, then rename, so a crash never leaves half a file).

See [API.md](API.md) for every endpoint.

## Styling

All colours come from tokens in `web/src/styles/tokens.css`, with a light set and a dark set that follows the device. Each subject has its own hue: wrapping markup in `.s-apt`, `.s-rsn` or `.s-eng` sets `--c` and `--c-soft`, which chips, tabs and progress bars use. Fonts are Bricolage Grotesque (headings), Figtree (body) and JetBrains Mono (formulas).

## Conventions

- Pages and components build HTML with the `html` tag from `web/src/lib/html.js`. Wrap text in `esc()`. Synopsis bodies go through `sanitize()`.
- Use `scope(subject)` for a subject's colour class.
- Keep page files to one screen; move anything shared into `web/src/components/`.
- API routes stay thin: validate, call `update()`, return JSON. Anything reusable goes in `src/` beside them.
