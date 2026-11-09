// Element picker: hover highlight, click to lock, ↑/↓ to resize, Esc to cancel.
// On chat-like pages the hover snaps to whole message blocks (public DOM attrs).

export const MESSAGE_SEL = '[data-testid^="conversation-turn"], [data-message-author-role], article:has([data-message-author-role])';

const TAG_WORDS = {
  P: '段落', H1: '标题', H2: '标题', H3: '标题', H4: '标题', H5: '标题', H6: '标题',
  LI: '列表项', TD: '单元格', TH: '表头', TABLE: '表格', PRE: '代码块', CODE: '代码块',
  IMG: '图片', UL: '列表', OL: '列表', BLOCKQUOTE: '引用', ARTICLE: '文章', SECTION: '区块',
  DIV: '区块', BODY: '整个页面', MAIN: '主要内容', NAV: '导航', ASIDE: '侧栏',
  FIGURE: '插图', FIGCAPTION: '图注', FORM: '表单', DETAILS: '折叠块', SUMMARY: '折叠标题',
  MATH: '公式', SPAN: '文字片段', A: '链接', HEADER: '页头', FOOTER: '页脚', DD: '说明', DT: '术语',
};

// Human words for "what am I about to save", not tag names.
export function describeTarget(el) {
  const msg = el.matches?.(MESSAGE_SEL);
  if (msg) {
    const bits = ['对话消息'];
    if (el.querySelector('table')) bits.push('含表格');
    if (el.querySelector('.katex, math, .mwe-math-element')) bits.push('含公式');
    else if (el.querySelector('pre, code')) bits.push('含代码');
    return bits.slice(0, 3).join(' · ');
  }
  const base = TAG_WORDS[el.tagName] || '区域';
  const extra = el.querySelector?.('table') ? ' · 含表格' : el.querySelector?.('pre') ? ' · 含代码' : '';
  return base + extra;
}

const BLOCK_PARENT = new Set(['P', 'LI', 'TD', 'TH', 'DD', 'DT', 'BLOCKQUOTE', 'FIGCAPTION',
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'ARTICLE', 'SECTION', 'DIV', 'SUMMARY']);
const INLINE_TAGS = new Set(['A', 'B', 'STRONG', 'EM', 'I', 'CODE', 'SPAN', 'SMALL', 'MARK', 'SUB', 'SUP', 'U']);

// Clicking a bold run or a link inside a paragraph should not hand back two words.
// Short inline fragments snap up to the block that actually holds the sentence.
function snapToBlock(el) {
  const tag = el.tagName;
  // Embedded / atomic content is what the user aimed at — never climb out of it.
  if (/^(IMG|SVG|CANVAS|VIDEO|IFRAME|MATH|INPUT|BUTTON|SELECT|TEXTAREA|HR)$/.test(tag)) return el;
  const inline = INLINE_TAGS.has(tag) || getComputedStyle(el).display.startsWith('inline');
  if (!inline) return el;
  const own = (el.textContent || '').trim().length;
  if (own > 40) return el;
  const parent = el.parentElement;
  if (!parent || !BLOCK_PARENT.has(parent.tagName)) return el;
  return (parent.textContent || '').trim().length > own ? parent : el;
}

function snapToMessage(el) {
  try {
    const candidates = el.closest(MESSAGE_SEL);
    if (candidates && candidates !== el && candidates.contains(el) && candidates !== document.body) return candidates;
  } catch { /* :has unsupported → ignore */ }
  return el;
}

export class Picker {
  constructor({onPick, onCancel}) {
    this.onPick = onPick; this.onCancel = onCancel;
    this.active = false; this.raf = 0; this.mx = 0; this.my = 0;
    this.build();
  }
  build() {
    const host = document.createElement('div');
    host.setAttribute('data-pageport', 'picker');
    this.shadow = host.attachShadow({mode: 'open'});
    this.shadow.innerHTML = `
      <style>
        :host{all:initial}
        *{box-sizing:border-box;margin:0;padding:0}
        .box{position:fixed;z-index:2147483645;pointer-events:none;border:2px solid #14161a;border-radius:6px;
             box-shadow:0 0 0 2px rgba(20,22,26,.13),0 0 0 5px rgba(20,22,26,.06);transition:all .04s linear}
        .tag{position:fixed;z-index:2147483646;pointer-events:none;transform:translateY(-137%);
             background:#14161a;color:#fff;font:600 10.5px/1.4 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;
             letter-spacing:.01em;padding:3px 7px;border-radius:4px;white-space:nowrap;
             box-shadow:0 2px 8px rgba(20,22,26,.22)}
        .bar{position:fixed;z-index:2147483647;left:50%;top:14px;transform:translateX(-50%);
             background:#fff;color:#14161a;border:1px solid #e7e7e5;
             font:500 12px/1.5 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;
             padding:7px 14px;border-radius:999px;
             box-shadow:0 10px 28px rgba(20,22,26,.12);white-space:nowrap}
        .bar b{font-weight:640}
        kbd{background:#f2f2ef;border:1px solid #e7e7e5;border-radius:3px;padding:0 4px;
            font:inherit;font-size:10px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#5b6068}
        @media (prefers-color-scheme: dark){
          .box{border-color:#f0f1f3;box-shadow:0 0 0 2px rgba(0,0,0,.45),0 0 0 5px rgba(240,241,243,.12)}
          .tag{background:#f0f1f3;color:#14161a;box-shadow:0 2px 10px rgba(0,0,0,.5)}
          .bar{background:rgba(20,21,25,.92);color:#eef2f7;border-color:rgba(255,255,255,.09);
               backdrop-filter:blur(14px);box-shadow:0 10px 28px rgba(0,0,0,.45)}
          kbd{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.12);color:#a8adb6}
        }
      </style>
      <div class="box" hidden></div><div class="tag" hidden></div>
      <div class="bar"><b>点击</b>选择要保存的区域 · <kbd>↑</kbd> 扩大 <kbd>↓</kbd> 缩小 · <kbd>Esc</kbd> 取消</div>`;
    this.box = this.shadow.querySelector('.box');
    this.tag = this.shadow.querySelector('.tag');
    this.bar = this.shadow.querySelector('.bar');
    document.documentElement.append(host);
    this.host = host;

    this.onMove = e => {
      this.mx = e.clientX; this.my = e.clientY;
      if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.paint(); });
    };
    this.onClick = e => {
      // Let clicks on our own UI (panel) pass through untouched.
      if (e.composedPath().some(n => n instanceof Element && n.hasAttribute?.('data-pageport'))) return;
      e.preventDefault(); e.stopPropagation();
      const el = this.elementAt(); if (!el) return;
      this.stop(); this.onPick(el);
    };
    this.onKey = e => {
      if (!this.active) return;
      if (e.key === 'Escape') { e.preventDefault(); this.stop(); this.onCancel(); return; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const cur = this.current;
        if (!cur) return;
        if (e.key === 'ArrowUp') { if (cur !== document.body && cur.parentElement && cur.parentElement !== document.documentElement) this.set(cur.parentElement); }
        else { const c = [...cur.children].find(x => x.tagName !== 'SCRIPT' && x.tagName !== 'STYLE' && x.tagName !== 'LINK'); if (c) this.set(c); }
      }
    };
    this.onScroll = () => { if (this.active) this.paint(); };
  }
  elementAt() {
    this.host.style.pointerEvents = 'none';
    const el = document.elementFromPoint(this.mx, this.my);
    this.host.style.pointerEvents = '';
    if (!el || el.closest('[data-pageport]')) return null;
    return snapToBlock(snapToMessage(el));
  }
  set(el) {
    this.current = el;
    const r = el.getBoundingClientRect();
    Object.assign(this.box.style, {left: r.x + 'px', top: r.y + 'px', width: r.width + 'px', height: r.height + 'px', display: 'block'});
    this.box.hidden = false;
    this.tag.textContent = describeTarget(el) + ' · ' + Math.round(r.width) + '×' + Math.round(r.height);
    Object.assign(this.tag.style, {left: r.x + 'px', top: Math.max(4, r.y) + 'px', display: 'block'});
  }
  paint() {
    if (!this.active) return;
    const el = this.elementAt();
    if (el) this.set(el);
  }
  start() {
    this.active = true;
    window.addEventListener('mousemove', this.onMove, {capture: true});
    window.addEventListener('click', this.onClick, {capture: true});
    window.addEventListener('mousedown', this.onClick, {capture: true});
    window.addEventListener('keydown', this.onKey, {capture: true});
    window.addEventListener('scroll', this.onScroll, {capture: true, passive: true});
    window.addEventListener('resize', this.onScroll, {capture: true});
    this.paint();
  }
  stop() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('mousemove', this.onMove, {capture: true});
    window.removeEventListener('click', this.onClick, {capture: true});
    window.removeEventListener('mousedown', this.onClick, {capture: true});
    window.removeEventListener('keydown', this.onKey, {capture: true});
    window.removeEventListener('scroll', this.onScroll, {capture: true});
    window.removeEventListener('resize', this.onScroll, {capture: true});
    this.host.remove();
  }
}
