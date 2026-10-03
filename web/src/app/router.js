// Hash router: #/subject/aptitude → { name: 'subject', params: { subjectId: 'aptitude' } }.
import { routes } from './routes.js';
import * as notFound from '../pages/not-found.js';

function match(pattern, parts) {
  const keys = pattern ? pattern.split('/') : [];
  const required = keys.filter((k) => !k.endsWith('?')).length;
  if (parts.length < required || parts.length > keys.length) return null;
  const params = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const part = parts[i];
    if (key.startsWith(':')) {
      if (part !== undefined) params[key.slice(1).replace('?', '')] = decodeURIComponent(part);
    } else if (key !== part) {
      return null;
    }
  }
  return params;
}

export function resolve(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  for (const route of routes) {
    const params = match(route.path, parts);
    if (params) return { ...route, params };
  }
  return { name: 'not-found', page: notFound, params: {} };
}

export function startRouter(onRoute) {
  const run = () => onRoute(resolve(location.hash));
  window.addEventListener('hashchange', run);
  run();
}
