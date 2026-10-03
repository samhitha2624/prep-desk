/*
 * Game registry. Joins the catalog with the game folders that exist.
 * Each game folder exports: mount(el, api) → optional cleanup function.
 *   el  — empty container to draw into
 *   api — { subject, done(score) } where done() records study activity
 * Game code is loaded only when someone opens that game.
 */
import { games } from './catalog.js';

const modules = import.meta.glob('./*/index.js');

export function isPlayable(id) {
  return Boolean(modules[`./${id}/index.js`]);
}

export function allGames() {
  return games.map((g) => ({ ...g, playable: isPlayable(g.id) }));
}

export function getGame(id) {
  return allGames().find((g) => g.id === id);
}

export async function loadGame(id) {
  const load = modules[`./${id}/index.js`];
  return load ? load() : null;
}
