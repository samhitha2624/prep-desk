import { html, esc } from '../lib/html.js';
import { subjects } from '../data/index.js';
import { allGames } from '../games/index.js';
import { gameCard, pageHead } from '../components/cards.js';

export function render() {
  const games = allGames();
  const groups = subjects.map((s) => {
    const list = games.filter((g) => g.subject === s.id);
    return list.length
      ? html`<section class="section"><div class="section-head"><h2>${esc(s.name)}</h2></div><div class="grid grid-3">${list.map(gameCard)}</div></section>`
      : '';
  });
  return html`${pageHead({
    eyebrow: 'Learn by doing',
    title: 'Games',
    intro: 'Short games that turn each concept into a habit. Play one after reading a topic to make the trick stick.',
  })}${groups}`;
}
