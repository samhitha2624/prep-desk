import { html } from '../lib/html.js';
import { subjects } from '../data/index.js';
import { subjectCard, pageHead } from '../components/cards.js';

export function render() {
  return html`${pageHead({ eyebrow: 'Study', title: 'Subjects', intro: 'Pick a subject to see every topic, from the basics to exam-level questions.' })}
    <div class="grid grid-3">${subjects.map(subjectCard)}</div>`;
}
