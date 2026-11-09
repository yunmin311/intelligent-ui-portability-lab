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
    case 'msup': { const c = childArgs(node); return group(c.slice(0, -1).join('')) + '^{' + c.at(-1) + '}'; }
    case 'msub': { const c = childArgs(node); return group(c.slice(0, -1).join('')) + '_{' + c.at(-1) + '}'; }
    case 'msubsup': { const c = childArgs(node);
      return group(c.slice(0, -2).join('')) + '_{' + (c.at(-2) ?? '') + '}^{' + (c.at(-1) ?? '') + '}'; }
    // mfrac's 3rd child is linethickness, not content.
    case 'mfrac': { const c = childArgs(node); return `\\frac{${c[0] ?? ''}}{${c[1] ?? ''}}`; }
    case 'msqrt': return `\\sqrt{${kids(node)}}`;
    case 'mroot': { const c = childArgs(node);
      return '\\sqrt[' + (c.at(-1) ?? '') + ']{' + c.slice(0, -1).join('') + '}'; }
    case 'munder': return (c => c[1] === '‾' ? `\\overline{${c[0]}}` : `${c[0]}_{${c[1]}}`)(childArgs(node));
    case 'mover': return (c => c[1] === '^' ? `\\hat{${c[0]}}` : `${c[0]}^{${c[1]}}`)(childArgs(node));
    case 'munderover': return (c => `${c[0]}_{${c[1]}}^{${c[2]}}`)(childArgs(node));
    case 'mspace': return ' ';
    default: return kids(node) || node.textContent?.trim() || '';
  }
}
// Positional arguments. mrow/mstyle stay ONE argument: mroot/mfrac/msup/msub are
// positional, so flattening an mrow base used to turn `a+b` into two arguments
// and silently drop the tail (sqrt[3]{a+b} came out as sqrt[+]{a}).
function childArgs(node) {
  return [...node.children].map(mathmlToTex);
}

// A scripted base that is not a single token must be braced: x+1^2 ≠ (x+1)^2.
function group(tex) {
  if (!tex) return '';
  if (/^\{[\s\S]*\}$/.test(tex) || /^[A-Za-z0-9]$/.test(tex) || /^\\[A-Za-z]+$/.test(tex)) return tex;
  return '{' + tex + '}';
}

const isMathRootEl = n => n.nodeType === 1 &&
  (n.tagName === 'MATH' || n.classList?.contains('katex') || n.classList?.contains('katex-display'));

// Deep-clone `el` into a sanitized standalone tree and return it.
// Math is swapped for a private-use token (slots) instead of raw LaTeX: turndown
// escapes `[` `]` `*` `_` in text, which silently corrupted every formula that
// contained a bracket (sqrt[3]{...}). Tokens are restored after conversion.
export function cleanClone(el, {keepForms = false, slots = []} = {}) {
  const putMath = tex => {
    const i = slots.length;
    slots.push(tex);
    return document.createTextNode('\uE000' + i + '\uE001');
  };
  // Picking the formula itself (not its paragraph) still has to yield LaTeX.
  if (isMathRootEl(el)) {
    const m = mathText(el);
    if (m) {
      const box = document.createElement('div');
      box.append(putMath(m.display ? '$$\n' + m.tex + '\n$$' : '$' + m.tex + '$'));
      return box;
    }
  }
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
        if (m) { node.replaceChild(putMath(m.display ? '$$\n' + m.tex + '\n$$' : '$' + m.tex + '$'), child); continue; }
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

const BLOCK_TAGS = new Set(['ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'FIGURE', 'FIGCAPTION', 'CENTER',
  'DETAILS', 'SUMMARY', 'DIV', 'DL', 'DD', 'DT', 'FIELDSET', 'FOOTER', 'FORM', 'MAIN', 'NAV', 'SECTION',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HR', 'LI', 'OL', 'UL', 'P', 'PRE', 'TABLE', 'CAPTION',
  'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH', 'MATH', 'BR']);

export function toMarkdown(el, {keepForms = false} = {}) {
  const slots = [];
  const clean = cleanClone(el, {keepForms, slots});
  const wrap = node => { const w = document.createElement('div'); w.append(node); return td.turndown(w); };
  const wrapAll = node => { const w = document.createElement('div'); w.append(...node.childNodes); return td.turndown(w); };
  const kids = [...clean.children];
  // A container of blocks converts child by child, which keeps block separation
  // stable. Anything else (a <p>, heading, <li>, cell — inline-mixed) must be
  // converted as ONE unit: splitting its children used to turn every <b>/<a>
  // into its own paragraph.
  const blocksOnly = kids.length > 0 && kids.every(k => BLOCK_TAGS.has(k.tagName));
  let md;
  if (blocksOnly) {
    const parts = [];
    let textRun = '';
    const flush = () => { if (textRun.trim()) parts.push(wrap(document.createTextNode(textRun))); textRun = ''; };
    for (const child of [...clean.childNodes]) {
      if (child.nodeType === 3) { textRun += child.nodeValue; continue; }
      flush();
      parts.push(wrap(child));
    }
    flush();
    md = parts.join('\n\n');
  } else {
    md = wrapAll(clean);
  }
  md = md.replace(/\n{3,}/g, '\n\n').trim();
  // Restore LaTeX exactly as extracted — after turndown's escaping has run.
  return md.replace(/\uE000(\d+)\uE001/g, (_, i) => slots[Number(i)] ?? '');
}
