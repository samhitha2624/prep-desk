/*
 * Keeps only simple formatting in synopsis text: paragraphs, bold, italic, lists, line breaks and code.
 * Plain text without tags is split into paragraphs on blank lines.
 */
import { esc } from './html.js';

const ALLOWED = new Set(['P', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'BR', 'CODE', 'SUB', 'SUP']);
// Dropped along with everything inside them.
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'SVG', 'MATH']);

const paragraphs = (text, escape) =>
  text
    .split(/\n\s*\n/)
    .map((para) => `<p>${(escape ? esc(para) : para).replace(/\n/g, '<br>')}</p>`)
    .join('');

export function sanitize(input = '') {
  const text = String(input).trim();
  if (!/<[a-z]/i.test(text)) return paragraphs(text, true);
  // Inline tags only: still split blank lines into paragraphs.
  const source = /<(p|ul|ol)[\s>]/i.test(text) ? text : paragraphs(text, false);
  const doc = new DOMParser().parseFromString(`<body>${source}</body>`, 'text/html');
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (DROP.has(child.tagName.toUpperCase())) {
          child.remove();
          continue;
        }
        walk(child);
        if (!ALLOWED.has(child.tagName.toUpperCase())) child.replaceWith(...child.childNodes);
        else [...child.attributes].forEach((a) => child.removeAttribute(a.name));
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
