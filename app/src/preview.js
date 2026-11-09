// Panel preview: render a sanitized clone of the selection so people can see what
// they will actually get, instead of reading raw Markdown source.
const DROP = 'script,style,link,meta,iframe,frame,object,embed,video,audio,source,track,noscript,template,dialog';
const MAX_NODES = 2600;
const MAX_CHARS = 6000;

// Only strip what can leak host styling or behaviour. Everything else (svg path
// data, math attributes, colspan) has to survive or the preview lies.
function scrub(root) {
  root.querySelectorAll(DROP).forEach(n => n.remove());
  for (const n of [root, ...root.querySelectorAll('*')]) {
    for (const a of [...n.attributes]) {
      const name = a.name.toLowerCase();
      if (name === 'style' || name === 'class' || name === 'id' || name.startsWith('on')) n.removeAttribute(a.name);
    }
  }
}

export function renderClone(el) {
  if (!el) return null;
  const nodes = el.querySelectorAll ? el.querySelectorAll('*').length : 0;
  if (nodes > MAX_NODES) {
    const box = document.createElement('div');
    box.textContent = (el.textContent || '').trim().slice(0, MAX_CHARS);
    return box;
  }
  const root = el.cloneNode(true);
  scrub(root);
  // Picked <body>/<html>: unwrap so the panel's own typography applies.
  if (/^(BODY|HTML)$/.test(root.tagName)) {
    const box = document.createElement('div');
    box.append(...root.childNodes);
    return box;
  }
  return root;
}
