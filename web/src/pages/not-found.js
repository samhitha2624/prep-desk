import { emptyState } from '../components/cards.js';

export function render() {
  return emptyState({ title: 'That page does not exist', body: 'The link may be out of date.', action: { href: '#/', label: 'Go home', primary: true } });
}
