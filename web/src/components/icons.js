// Inline SVG icons. They inherit colour from the surrounding text.
const svg = (body, sw = 2) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  home: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
  book: svg('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5V4.5"/>'),
  game: svg('<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r=".8" fill="currentColor"/><circle cx="18" cy="13.5" r=".8" fill="currentColor"/>'),
  quiz: svg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8M8 15h8"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 3),
  flame: svg('<path d="M12 22c4 0 7-2.7 7-6.7 0-4.3-3.5-6.3-4-10.3-2.5 1.6-4 4-4 6.5-1-.8-1.7-2-2-3.5C7 9.5 5 12 5 15.3 5 19.3 8 22 12 22z"/>'),
  admin: svg('<path d="M12 2 4 5.5v6c0 5 3.4 8.9 8 10.5 4.6-1.6 8-5.5 8-10.5v-6z"/><path d="m9 12 2 2 4-4"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
};
