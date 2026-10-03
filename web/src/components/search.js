// Topic search in the top bar. Press "/" anywhere to focus it.
import { esc, scope } from '../lib/html.js';
import { subjects } from '../data/index.js';

function buildIndex() {
  return subjects.flatMap((s) =>
    s.topics.map((t) => ({
      subject: s,
      topic: t,
      text: [t.title, t.blurb, ...(t.tricks || []).map((x) => x.title)].join(' ').toLowerCase(),
    })),
  );
}

export function setupSearch() {
  const input = document.getElementById('search-input');
  const box = document.getElementById('search-results');
  let active = 0;

  function close() {
    box.hidden = true;
    input.value = '';
    input.blur();
  }

  function show() {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      box.hidden = true;
      return;
    }
    const words = q.split(/\s+/);
    // Rebuilt on each search so admin edits show up straight away.
    const items = buildIndex().filter((x) => words.every((w) => x.text.includes(w))).slice(0, 8);
    active = 0;
    box.innerHTML = items.length
      ? items
          .map(
            (x, i) =>
              `<a class="${scope(x.subject)}${i === 0 ? ' active' : ''}" href="#/topic/${x.subject.id}/${x.topic.id}">` +
              `<span class="nav-dot"></span><span>${esc(x.topic.title)}</span><small>${esc(x.subject.name)}</small></a>`,
          )
          .join('')
      : `<div class="search-empty">No topics match “${esc(input.value)}”.</div>`;
    box.hidden = false;
  }

  input.addEventListener('input', show);
  input.addEventListener('focus', show);
  input.addEventListener('keydown', (e) => {
    const links = box.querySelectorAll('a');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!links.length) return;
      links[active].classList.remove('active');
      active = (active + (e.key === 'ArrowDown' ? 1 : links.length - 1)) % links.length;
      links[active].classList.add('active');
    } else if (e.key === 'Enter' && links[active]) {
      location.hash = links[active].getAttribute('href');
      close();
    } else if (e.key === 'Escape') {
      close();
    }
  });
  box.addEventListener('click', close);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search')) box.hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
    if (e.key === '/' && !typing) {
      e.preventDefault();
      input.focus();
    }
  });
}
