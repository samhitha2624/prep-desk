# Content guide

Most content can be managed in the app's admin dashboard (see ADMIN_GUIDE.md). This guide covers the seed files in `api/data/seed/` that the API starts from, and how games are added to the web app.

The seed is copied into `api/data/db.json` the first time the API runs. After that, edits to the seed show up only when an admin uses **Restore original** for that subject, or when you delete `db.json` to start fresh.

Run `npm run check:content` after any change here. It reports missing fields, unknown topic ids and broken quiz answers.

## Subjects and topic outline

`api/data/seed/subjects/<subject>/subject.json` sets the subject's name and the order of its topics.

```json
{
  "id": "aptitude",
  "name": "Aptitude",
  "tagline": "Numbers, shortcuts and speed for quantitative sections.",
  "color": "apt",
  "topics": [
    { "id": "percentages", "title": "Percentages", "blurb": "One-line summary shown in lists.", "level": "Foundation", "minutes": 12 }
  ]
}
```

- `color` is `apt`, `rsn` or `eng`.
- `level` is `Foundation`, `Core` or `Advanced`. The subject page groups topics by level.
- Topic `id` is lowercase with dashes and must match the topic's file name.

## Topic notes

`api/data/seed/subjects/<subject>/topics/<topic-id>.json` holds the study material. Creating this file is what turns a topic from "Coming soon" into "Ready".

```json
{
  "synopsis": [
    { "heading": "What a percentage is", "body": "<p>HTML is allowed here: <b>bold</b>, <i>italic</i>, lists.</p>" }
  ],
  "formulas": [
    { "label": "Percent change", "value": "(New − Old) ÷ Old × 100" }
  ],
  "tricks": [
    { "title": "Swap the numbers", "body": "x% of y equals y% of x.", "example": "18% of 50 = 50% of 18 = 9" }
  ]
}
```

- **synopsis**: two to five short sections that explain the concept. Shown on the Synopsis tab.
- **formulas**: the rules worth memorising. Shown in the Key rules panel.
- **tricks**: shortcuts, each with a worked one-line example. Shown on the Tricks tab, used for "Trick of the day" and searchable.

## Quizzes

`api/data/seed/quizzes/<subject>/<topic-id>.json`:

```json
{
  "questions": [
    {
      "q": "What is 37.5% of 640?",
      "options": ["220", "240", "250", "260"],
      "answer": 1,
      "explanation": "37.5% is 3/8, and 3/8 × 640 = 240."
    }
  ]
}
```

`answer` is the zero-based index of the correct option. Quizzes play on the topic's Practice tab through `web/src/components/quiz-player.js`.

## Games

1. Add an entry to `web/src/games/catalog.js` with `id`, `name`, `subject`, `skill`, `description`, `preview` (short text shown on the card) and `minutes`.
2. Create `web/src/games/<id>/index.js`:

```js
export function mount(el, api) {
  el.innerHTML = '<p>Game goes here</p>';
  // call api.done(score) when a round ends to count today towards the streak
  return () => { /* optional cleanup: stop timers, remove listeners */ };
}
```

The game shows "Coming soon" until that folder exists. Games can put their own styles in a CSS file next to `index.js` and import it from there.
