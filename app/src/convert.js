// HTML → Markdown conversion built on turndown (MIT) with PagePort rules:
// KaTeX/MathML become LaTeX, junk is dropped, links/images absolutized.
import TurndownService from 'turndown';
import {gfm} from 'turndown-plugin-gfm';

const DROP_TAGS = new Set(['script', 'style', 'noscript', 'link', 'meta', 'template', 'iframe', 'frame', 'object', 'embed', 'audio', 'video', 'source', 'track', 'button', 'select', 'dialog', 'nav', 'aside']);
const FORM_TAGS = new Set(['input', 'textarea']);

function isHidden(el) {
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
  const cs = getComputedStyle(el);
  return cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0;
}

function mathText(el) {
  // KaTeX renders both MathML (with the original LaTeX) and visual HTML.
  const katex = el.querySelectorAll?.('.katex-mathml annotation[encoding="application/x-tex"]');
  if (katex?.length) {
    for (const a of katex) {
      const tex = a.textContent.trim();
      const display = a.closest('.katex-display') || a.closest('math')?.getAttribute('display') === 'block';
      return {tex, display: !!display};
    }
  }
  const math = el.matches?.('math') ? el : el.querySelector?.('math');
  if (math) {
    return {tex: mathmlToTex(math), display: math.getAttribute('display') === 'block'};
  }
  return null;
}

// Best-effort MathML → linear LaTeX. Covers the constructs LLM answers and
// encyclopedic pages actually use; anything exotic falls back to its text.
export function mathmlToTex(node) {
  const kids = n => [...n.children].map(mathmlToTex).join('');
  switch (node.tagName) {
    case 'math': return kids(node);
    case 'mrow': case 'mstyle': case 'mpadded': case 'menclose': return kids(node);
    case 'mi': case 'mn': return node.textContent.trim();
    case 'mo': return node.textContent.trim() === '−' ? '-' : node.textContent.trim();
    case 'mtext': return '\\text{' + node.textContent.trim() + '}';
    case 'msup': return kids(node).startsWith('\\left') ? kids(node) : (c => `${c[0]}^{${c[1]}}`)(childArgs(node));
    case 'msub': return (c => `${c[0]}_{${c[1]}}`)(childArgs(node));
    case 'msubsup': return (c => `${c[0]}_{${c[1]}}^{${c[2]}}`)(childArgs(node));
    case 'mfrac': return (c => `\\frac{${c[0]}}{${c[1]}}`)(childArgs(node));
    case 'msqrt': return `\\sqrt{${kids(node)}}`;
    case 'mroot': return (c => `\\sqrt[${c[1]}]{${c[0]}}`)(childArgs(node));
    case 'munder': return (c => c[1] === '‾' ? `\\overline{${c[0]}}` : `${c[0]}_{${c[1]}}`)(childArgs(node));
    case 'mover': return (c => c[1] === '^' ? `\\hat{${c[0]}}` : `${c[0]}^{${c[1]}}`)(childArgs(node));
    case 'munderover': return (c => `${c[0]}_{${c[1]}}^{${c[2]}}`)(childArgs(node));
    case 'mspace': return ' ';
    default: return kids(node) || node.textContent?.trim() || '';
  }
}
function childArgs(node) {
  const acc = [];
  const walk = n => {
    if (n.tagName === 'mrow' || n.tagName === 'mstyle') { [...n.children].forEach(walk); return; }
    acc.push(mathmlToTex(n));
  };
  [...node.children].forEach(walk);
  return acc;
}

// Deep-clone `el` into a sanitized standalone tree and return it.
export function cleanClone(el, {keepForms = false} = {}) {
  const root = el.cloneNode(true);
  // Hidden subtrees are decided on the LIVE original (the clone has no layout).
  // Parallel walk of original + clone: whatever is hidden in the original is
  // removed at the matching clone position. No index bookkeeping.
  const prune = (orig, cl) => {
    if (orig.nodeType !== 1) return;
    if (isHidden(orig)) { cl.remove(); return; }
    const oc = [...orig.children], cc = [...cl.children];
    for (let i = 0; i < oc.length && i < cc.length; i++) prune(oc[i], cc[i]);
  };
  prune(el, root);

  const walk = node => {
    for (const child of [...node.children]) {
      const tag = child.tagName.toLowerCase();
      // KaTeX / MathML → LaTeX, converted IN PLACE at whatever depth it sits.
      // Containers are never collapsed: recursion reaches the math node itself.
      const isMathRoot = tag === 'math' || (tag === 'span' && (child.classList.contains('katex') || child.classList.contains('katex-display')));
      if (isMathRoot) {
        const m = mathText(child);
        if (m) { node.replaceChild(document.createTextNode((m.display ? '$$\n' + m.tex + '\n$$' : '$' + m.tex + '$')), child); continue; }
      }
      if (DROP_TAGS.has(tag) || (!keepForms && FORM_TAGS.has(tag))) { child.remove(); continue; }
      walk(child);
    }
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');
      if (href && !/^(https?:|mailto:|#)/i.test(href)) { try { node.setAttribute('href', new URL(href, location.href).href); } catch { /* keep */ } }
      if (href?.startsWith('javascript:')) node.removeAttribute('href');
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || node.getAttribute('data-src') || '';
      if (src && !/^https?:/i.test(src) && !src.startsWith('data:')) { try { node.setAttribute('src', new URL(src, location.href).href); } catch { /* keep */ } }
      node.removeAttribute('srcset'); node.removeAttribute('loading');
    }
  };
  walk(root);
  return root;
}

const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
});
td.use(gfm);
td.addRule('dropEmptyLinks', {filter: n => n.nodeName === 'A' && !n.getAttribute('href'), replacement: (c, n) => n.textContent});
td.addRule('imgAlt', {filter: 'img', replacement: (c, n) => `![${(n.getAttribute('alt') || '图片').replace(/[\[\]]/g, '')}](${n.getAttribute('src') || ''})`});

export function toMarkdown(el, {keepForms = false} = {}) {
  const clean = cleanClone(el, {keepForms});
  // turndown drops root-level siblings after a table; convert each top-level
  // child separately and join, which also gives stable block separation.
  const parts = [];
  let textRun = '';
  const flush = () => { if (textRun.trim()) { const w = document.createElement('div'); w.append(textRun); parts.push(td.turndown(w)); } textRun = ''; };
  for (const child of [...clean.childNodes]) {
    if (child.nodeType === 3) { textRun += child.nodeValue; continue; }
    flush();
    // Wrap in a div: turndown skips the root node's own rule (fenced code etc.)
    const w = document.createElement('div');
    w.append(child);
    parts.push(td.turndown(w));
  }
  flush();
  let md = parts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  return md;
}
