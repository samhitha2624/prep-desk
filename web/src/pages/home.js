import { html, esc } from '../lib/html.js';
import { lastTopic } from '../lib/progress.js';
import { currentUser } from '../lib/auth/index.js';
import { subjects, getSubject, getTopic, readyTopics } from '../data/index.js';
import { allGames } from '../games/index.js';
import { subjectCard, gameCard } from '../components/cards.js';

// Picks one trick per day from every finished topic.
function trickOfTheDay() {
  const pool = readyTopics().flatMap(({ subject, topic }) => (topic.tricks || []).map((trick) => ({ subject, trick })));
  if (!pool.length) return null;
  return pool[Math.floor(Date.now() / 86400000) % pool.length];
}

export function render() {
  const last = lastTopic();
  const lastT = last && getTopic(last.subjectId, last.topicId);
  const resume = lastT ? { subject: getSubject(last.subjectId), topic: lastT } : readyTopics()[0];
  const tod = trickOfTheDay();
  const user = currentUser();
  const eyebrow = user ? `Welcome back, ${user.name.split(/\s+/)[0]}` : lastT ? 'Continue where you left off' : 'Start here';

  return html`
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">${esc(eyebrow)}</div>
        <h1>Aptitude, reasoning and English in one study desk.</h1>
        <p>Read a short synopsis, learn the shortcut tricks, then lock it in with a game or a quick quiz.</p>
        <div class="hero-actions">
        ${resume && `<a class="btn" href="#/topic/${resume.subject.id}/${resume.topic.id}">${lastT ? 'Resume' : 'Begin with'} ${esc(resume.topic.title)}</a>`}
        ${!user && '<a class="btn btn-on-brand" href="#/signup">Create a free account</a>'}
        </div>
      </div>
      ${tod && html`<div class="tod">
        <div class="eyebrow">Trick of the day · ${esc(tod.subject.name)}</div>
        <h3>${esc(tod.trick.title)}</h3>
        <p>${esc(tod.trick.body)}</p>
        ${tod.trick.example && `<code>${esc(tod.trick.example)}</code>`}
      </div>`}
    </section>

    <section class="section">
      <div class="section-head"><h2>Subjects</h2></div>
      <div class="grid grid-3">${subjects.map(subjectCard)}</div>
    </section>

    <section class="section">
      <div class="section-head"><h2>Learn with games</h2><a href="#/games">All games</a></div>
      <div class="grid grid-3">${allGames().map(gameCard)}</div>
    </section>`;
}
