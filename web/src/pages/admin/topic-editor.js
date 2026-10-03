import { html, esc } from '../../lib/html.js';
import { subjects, getSubject, getTopic, saveTopic, LEVELS } from '../../data/index.js';
import { toast } from '../../components/toast.js';
import { adminFrame, errorBox, showError } from './ui.js';
import * as notFound from '../not-found.js';

// Repeating groups in the form. Each field is [key, label, kind].
const GROUPS = {
  synopsis: {
    title: 'Synopsis',
    help: 'Short sections that explain the concept. Blank lines start a new paragraph. You can also use <b>, <i>, <ul> and <li>.',
    add: 'Add section',
    fields: [['heading', 'Heading', 'input'], ['body', 'Text', 'textarea']],
    required: ['heading', 'body'],
  },
  formulas: {
    title: 'Key rules',
    help: 'Formulas and rules worth memorising. Shown in the side panel.',
    add: 'Add rule',
    fields: [['label', 'Name', 'input'], ['value', 'Rule or formula', 'input']],
    required: ['label', 'value'],
  },
  tricks: {
    title: 'Tricks',
    help: 'Shortcuts, each with a one-line worked example.',
    add: 'Add trick',
    fields: [['title', 'Title', 'input'], ['body', 'How it works', 'textarea'], ['example', 'Example (optional)', 'input']],
    required: ['title', 'body'],
  },
};

let uid = 0;
function itemHtml(group, item = {}) {
  const g = GROUPS[group];
  const n = ++uid;
  return html`<div class="repeat-item card" data-item>
    <div class="repeat-fields">${g.fields.map(([key, label, kind]) => {
      const id = `${group}-${key}-${n}`;
      const value = esc(item[key] || '');
      return html`<div class="field ${kind === 'textarea' && 'field-wide'}">
        <label for="${id}">${label}</label>
        ${kind === 'textarea' ? `<textarea id="${id}" data-key="${key}" rows="4">${value}</textarea>` : `<input id="${id}" data-key="${key}" type="text" value="${value}">`}
      </div>`;
    })}</div>
    <button type="button" class="btn btn-ghost btn-sm remove" data-remove>Remove</button>
  </div>`;
}

function groupHtml(group, items) {
  const g = GROUPS[group];
  return html`<section class="editor-group">
    <div class="editor-group-head"><div><h2>${g.title}</h2><p>${esc(g.help)}</p></div></div>
    <div class="repeat-list" data-list="${group}">${(items || []).map((it) => itemHtml(group, it))}</div>
    <button type="button" class="btn btn-ghost" data-add="${group}">+ ${g.add}</button>
  </section>`;
}

export function render({ subjectId, topicId }) {
  const s = getSubject(subjectId);
  const isNew = topicId === 'new';
  const t = isNew ? { level: 'Foundation', minutes: 10, synopsis: [{}], formulas: [], tricks: [{}] } : getTopic(subjectId, topicId);
  if (!s || !t) return notFound.render();

  return adminFrame(
    'topics',
    {
      title: isNew ? `New ${s.name} topic` : `Edit ${t.title}`,
      intro: isNew ? 'Fill in the details, then save. Leave the synopsis empty to list the topic as coming soon.' : `${s.name} topic`,
      actions: `<a class="btn btn-ghost" href="#/admin/topics/${s.id}">Back to topics</a>${!isNew ? `<a class="btn btn-ghost" href="#/topic/${s.id}/${t.id}">View page</a>` : ''}`,
    },
    html`<form id="topic-form" class="editor" novalidate>
      <section class="editor-group">
        <div class="editor-group-head"><div><h2>Details</h2></div></div>
        <div class="card editor-details">
          <div class="field field-wide"><label for="t-title">Title</label><input id="t-title" type="text" value="${esc(t.title || '')}" required></div>
          <div class="field field-wide"><label for="t-blurb">One-line summary</label><input id="t-blurb" type="text" value="${esc(t.blurb || '')}" placeholder="Shown in topic lists"></div>
          <div class="field"><label for="t-subject">Subject</label>
            <select id="t-subject" ${!isNew && 'disabled'}>${subjects.map((x) => `<option value="${x.id}" ${x.id === s.id ? 'selected' : ''}>${esc(x.name)}</option>`)}</select></div>
          <div class="field"><label for="t-level">Level</label>
            <select id="t-level">${LEVELS.map((l) => `<option ${l === t.level ? 'selected' : ''}>${l}</option>`)}</select></div>
          <div class="field"><label for="t-minutes">Reading time (minutes)</label><input id="t-minutes" type="number" min="1" max="120" value="${t.minutes || 10}"></div>
        </div>
      </section>
      ${groupHtml('synopsis', t.synopsis)}
      ${groupHtml('formulas', t.formulas)}
      ${groupHtml('tricks', t.tricks)}
      ${errorBox()}
      <div class="editor-save">
        <button class="btn" type="submit">${isNew ? 'Create topic' : 'Save changes'}</button>
        <a class="btn btn-ghost" href="#/admin/topics/${s.id}">Cancel</a>
      </div>
    </form>`,
  );
}

function collect(root, group) {
  const g = GROUPS[group];
  const items = [];
  const problems = [];
  root.querySelectorAll(`[data-list="${group}"] [data-item]`).forEach((el, i) => {
    const item = {};
    el.querySelectorAll('[data-key]').forEach((input) => {
      const v = input.value.trim();
      if (v) item[input.dataset.key] = v;
    });
    if (!Object.keys(item).length) return; // empty rows are ignored
    const missing = g.required.filter((k) => !item[k]);
    if (missing.length) problems.push(`${g.title} ${i + 1}: fill in ${missing.map((k) => g.fields.find((f) => f[0] === k)[1].toLowerCase()).join(' and ')}.`);
    items.push(item);
  });
  return { items, problems };
}

export function mount(root, { subjectId, topicId }) {
  const form = root.querySelector('#topic-form');
  if (!form) return;
  const isNew = topicId === 'new';

  form.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) {
      const list = root.querySelector(`[data-list="${add.dataset.add}"]`);
      list.insertAdjacentHTML('beforeend', itemHtml(add.dataset.add));
      list.lastElementChild.querySelector('input, textarea')?.focus();
    }
    const remove = e.target.closest('[data-remove]');
    if (remove) remove.closest('[data-item]').remove();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = root.querySelector('#t-title').value.trim();
    const parts = Object.fromEntries(Object.keys(GROUPS).map((g) => [g, collect(root, g)]));
    const problems = [!title && 'Enter a title.', ...Object.values(parts).flatMap((p) => p.problems)].filter(Boolean);
    if (problems.length) return showError(root, problems.join(' '));
    showError(root, '');

    const target = isNew ? root.querySelector('#t-subject').value : subjectId;
    const topic = {
      title,
      blurb: root.querySelector('#t-blurb').value.trim(),
      level: root.querySelector('#t-level').value,
      minutes: Math.max(1, Number(root.querySelector('#t-minutes').value) || 10),
      synopsis: parts.synopsis.items,
      formulas: parts.formulas.items,
      tricks: parts.tricks.items,
    };

    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await saveTopic(target, topic, isNew ? null : topicId);
      toast(isNew ? `Created ${title}` : 'Changes saved');
      location.hash = `#/admin/topics/${target}`;
    } catch (err) {
      showError(root, err.message);
    } finally {
      button.disabled = false;
    }
  });
}
