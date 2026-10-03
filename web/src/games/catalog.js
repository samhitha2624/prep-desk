/*
 * Game catalog: what shows on the Games page.
 * A game becomes playable once src/games/<id>/index.js exists and exports mount(el, api).
 * Until then it shows as "Coming soon".
 */
export const games = [
  {
    id: 'speed-math',
    name: 'Speed Math',
    subject: 'aptitude',
    skill: 'Mental arithmetic',
    description: 'Solve percentage and multiplication sums against a 60-second clock.',
    preview: '12 × 15 = ?',
    minutes: 1,
  },
  {
    id: 'pattern-finder',
    name: 'Pattern Finder',
    subject: 'reasoning',
    skill: 'Series and sequences',
    description: 'Spot the rule and pick the next term before the streak breaks.',
    preview: '2, 6, 12, 20, ?',
    minutes: 3,
  },
  {
    id: 'word-match',
    name: 'Word Match',
    subject: 'english',
    skill: 'Vocabulary',
    description: 'Pair each word with its synonym on a flip-card board.',
    preview: 'ABATE ↔ LESSEN',
    minutes: 4,
  },
];
