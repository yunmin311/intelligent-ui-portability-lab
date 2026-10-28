// Element picker: hover highlight, click to lock, ↑/↓ to resize, Esc to cancel.
// On chat-like pages the hover snaps to whole message blocks (public DOM attrs).

const MESSAGE_SEL = '[data-testid^="conversation-turn"], [data-message-author-role], article:has([data-message-author-role])';

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
        .box{position:fixed;z-index:2147483645;pointer-events:none;border:2px solid #ffb224;border-radius:6px;
             box-shadow:0 0 0 2px rgba(0,0,0,.25),0 0 18px rgba(255,178,36,.45);transition:all .05s ease}
        .tag{position:fixed;z-index:2147483646;pointer-events:none;transform:translateY(-130%);
             background:#ffb224;color:#1c1503;font:600 11px/1.4 system-ui,sans-serif;padding:3px 8px;border-radius:5px;white-space:nowrap}
        .bar{position:fixed;z-index:2147483647;left:50%;top:14px;transform:translateX(-50%);
             background:rgba(24,28,36,.94);color:#eef2f7;border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px);
             font:500 13px/1.5 system-ui,"Segoe UI","Microsoft YaHei",sans-serif;padding:9px 16px;border-radius:999px;
             box-shadow:0 8px 28px rgba(0,0,0,.35);white-space:nowrap}
        .bar b{color:#ffb224;font-weight:650}
        kbd{background:rgba(255,255,255,.12);border-radius:4px;padding:1px 5px;font:inherit;font-size:11px}
        @media (prefers-color-scheme: light){
          .bar{background:rgba(255,255,255,.96);color:#253141;border-color:rgba(20,30,50,.12)}
          kbd{background:rgba(20,30,50,.08)}
        }
      </style>
      <div class="box" hidden></div><div class="tag" hidden></div>
      <div class="bar">点击选择要保存的区域 · <kbd>↑</kbd> 扩大 <kbd>↓</kbd> 缩小 · <kbd>Esc</kbd> 取消</div>`;
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
    return snapToMessage(el);
  }
  set(el) {
    this.current = el;
    const r = el.getBoundingClientRect();
    Object.assign(this.box.style, {left: r.x + 'px', top: r.y + 'px', width: r.width + 'px', height: r.height + 'px', display: 'block'});
    this.box.hidden = false;
    const msg = el.matches(MESSAGE_SEL) || el.querySelector?.(MESSAGE_SEL);
    this.tag.textContent = el.tagName.toLowerCase().replace('#', '') + (el.id ? '#' + el.id.slice(0, 18) : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 1).join('') : '') + (msg ? ' · 对话消息' : '');
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
