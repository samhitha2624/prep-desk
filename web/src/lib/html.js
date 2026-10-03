// Escapes text for safe insertion into HTML.
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Template tag that joins arrays and drops null/undefined/false. Values are NOT escaped; wrap text in esc().
export function html(strings, ...values) {
  return strings.reduce((out, str, i) => {
    const v = values[i - 1];
    const part = Array.isArray(v) ? v.join('') : v == null || v === false ? '' : v;
    return out + part + str;
  });
}

// Maps a subject's colour key to its CSS scope class.
const SCOPES = { apt: 's-apt', rsn: 's-rsn', eng: 's-eng' };
export function scope(subject) {
  return SCOPES[subject?.color] || 's-apt';
}
