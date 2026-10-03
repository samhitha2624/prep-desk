import { html, esc, scope } from '../lib/html.js';
import { recordActivity } from '../lib/progress.js';
import { getSubject, subjects } from '../data/index.js';
import { getGame, loadGame } from '../games/index.js';
import { crumbs, emptyState } from '../components/cards.js';
import * as notFound from './not-found.js';

export function render({ gameId }) {
  const g = getGame(gameId);
  if (!g) return notFound.render();
  const s = getSubject(g.subject) || subjects[0];
  return html`<div class="${scope(s)} contents">
    ${crumbs([{ label: 'Home', href: '#/' }, { label: 'Games', href: '#/games' }, { label: g.name }])}
    <div class="page-head">
      <div class="eyebrow">${esc(s.name)} · ${esc(g.skill)}</div>
      <h1>${esc(g.name)}</h1>
      <p>${esc(g.description)}</p>
    </div>
    ${g.playable
      ? '<div id="game-root" class="card game-stage"></div>'
      : emptyState({ title: 'This game is being built', body: 'Check back soon. The other subjects have games on the way too.', action: { href: '#/games', label: 'All games' } })}
  </div>`;
}

export async function mount(root, { gameId }) {
  const el = root.querySelector('#game-root');
  if (!el) return;
  const g = getGame(gameId);
  const mod = await loadGame(gameId);
  return mod?.mount(el, { subject: getSubject(g.subject), done: () => recordActivity() });
}
