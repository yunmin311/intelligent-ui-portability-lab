// PagePort in-page panel. Closed-ish shadow DOM + constructable stylesheet so the
// page's own CSS and CSP cannot break the UI. No frameworks.
//
// Two skins, one structure:
//   light  → "precision instrument": neutral hairlines, tab underline, ink button
//   dark   → "command surface": frosted glass, kbd badges, light button
// The layout does not change between themes on purpose — only the material does.
import {toMarkdown} from './convert.js';
import {shootPng, shootPngDataUrl, shootHtml} from './shoot.js';
import {renderClone} from './preview.js';
import {describeTarget} from './picker.js';

const CSS = `
:host{all:initial}
*{box-sizing:border-box;margin:0;padding:0;font:inherit;color:inherit}
[hidden]{display:none!important}

.panel{
  --bg:#ffffff;--fg:#14161a;--fg-2:#5b6068;--fg-3:#9a9a93;
  --line:#e7e7e5;--line-2:#efefed;--surface:#fcfcfb;
  --accent:#14161a;--on-accent:#ffffff;
  --chip:#f2f2ef;--chip-fg:#6a6f78;
  --ok:#0f9d63;--bad:#d0463a;
  --shadow:0 1px 2px rgba(20,22,26,.05),0 14px 36px -18px rgba(20,22,26,.26);
  --radius:10px;--mono:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;
  position:fixed;z-index:2147483646;top:14px;right:14px;
  width:344px;max-width:calc(100vw - 24px);
  background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:var(--radius);
  box-shadow:var(--shadow);overflow:hidden;color-scheme:light;
  font:13px/1.55 system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
  animation:pp-in .16s ease-out;
}
@keyframes pp-in{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
@media (prefers-color-scheme: dark){
  .panel{
    --bg:rgba(20,21,25,.92);--fg:#e9eaec;--fg-2:#a8adb6;--fg-3:#7c818a;
    --line:rgba(255,255,255,.09);--line-2:rgba(255,255,255,.055);--surface:rgba(255,255,255,.03);
    --accent:#f0f1f3;--on-accent:#14161a;
    --chip:rgba(255,255,255,.06);--chip-fg:#a8adb6;
    --ok:#4ecb8d;--bad:#ff8a7a;
    --shadow:0 30px 60px -20px rgba(0,0,0,.7),0 0 0 1px rgba(0,0,0,.35);
    --radius:14px;color-scheme:dark;
    backdrop-filter:blur(22px) saturate(1.15);-webkit-backdrop-filter:blur(22px) saturate(1.15);
  }
}

/* ---------- header ---------- */
.head{display:flex;align-items:center;gap:8px;padding:10px 10px 10px 13px;
  border-bottom:1px solid var(--line-2);cursor:grab;user-select:none}
.head:active{cursor:grabbing}
.mark{width:15px;height:15px;border-radius:3.5px;background:var(--fg);position:relative;flex:none}
.mark::after{content:"";position:absolute;left:3.6px;right:3.6px;top:4.1px;height:1.7px;border-radius:1px;
  background:var(--bg);box-shadow:0 3.4px 0 var(--bg)}
.name{font-size:12.5px;font-weight:640;letter-spacing:-.005em}
.chip{font-size:10.5px;padding:1.5px 7px;border-radius:999px;background:var(--chip);color:var(--chip-fg);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:132px}
.grow{flex:1}
.icon{width:24px;height:24px;border:0;border-radius:6px;background:transparent;color:var(--fg-3);
  cursor:pointer;display:grid;place-items:center;font-size:13px;line-height:1}
.icon:hover{color:var(--fg);background:var(--chip)}

/* ---------- settings ---------- */
.settings{padding:9px 13px 10px;display:grid;gap:6px;border-bottom:1px solid var(--line-2)}
.settings label{display:flex;align-items:center;justify-content:space-between;gap:10px;
  font-size:11.5px;color:var(--fg-2)}
.settings select{appearance:none;-webkit-appearance:none;background:transparent;border:0;color:var(--fg);
  font-family:inherit;font-size:11.5px;padding:2px 15px 2px 0;cursor:pointer;
  background-repeat:no-repeat;background-position:right 2px center;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M1 1l3 3 3-3' fill='none' stroke='%239a9a93' stroke-width='1.2' stroke-linecap='round'/%3E%3C/svg%3E")}

/* ---------- selection meta ---------- */
.meta{padding:12px 13px 0}
.meta-k{font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--fg-3);margin-bottom:4px}
.meta-v{display:flex;align-items:baseline;gap:8px;font-size:13px;font-weight:520;letter-spacing:-.005em}
.meta-n{margin-left:auto;font-family:var(--mono);font-size:10.5px;color:var(--fg-3);
  font-variant-numeric:tabular-nums;letter-spacing:-.02em}

/* ---------- preview ---------- */
.preview{margin:9px 13px 0;border:1px solid var(--line-2);border-radius:7px;background:var(--surface);
  padding:10px 11px;max-height:152px;overflow:auto}
.preview::-webkit-scrollbar{width:8px;height:8px}
.preview::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px}
.empty{display:grid;place-items:center;gap:3px;min-height:62px;text-align:center}
.empty .t{font-size:12.5px;color:var(--fg-2)}
.empty .s{font-size:10.5px;color:var(--fg-3)}
.doc{font-size:12px;line-height:1.62;color:var(--fg);overflow-wrap:anywhere}
.doc>*:first-child{margin-top:0}
.doc>*:last-child{margin-bottom:0}
.doc h1,.doc h2,.doc h3,.doc h4,.doc h5,.doc h6{font-size:12.5px;font-weight:640;line-height:1.35;margin:0 0 5px}
.doc p{margin:0 0 5px}
.doc ul,.doc ol{margin:0 0 5px;padding-left:15px}
.doc li{margin:1px 0}
.doc table{border-collapse:collapse;width:100%;font-size:10.5px;margin:3px 0 6px}
.doc th,.doc td{border:1px solid var(--line);padding:3px 5px;text-align:left;vertical-align:top}
.doc th{background:var(--chip);font-weight:600}
.doc pre{font-family:var(--mono);font-size:10.5px;line-height:1.5;background:var(--surface);
  border:1px solid var(--line-2);border-radius:5px;padding:7px 8px;overflow:auto;margin:3px 0 6px}
.doc code{font-family:var(--mono);font-size:10.5px;background:var(--chip);border-radius:3px;padding:0 3px}
.doc pre code{background:none;padding:0}
.doc img{max-width:100%;height:auto;border-radius:4px;display:block;margin:4px auto;background:#fff}
.doc a{color:inherit;text-decoration:underline;text-underline-offset:2px;text-decoration-color:var(--fg-3)}
.doc blockquote{border-left:2px solid var(--line);padding-left:8px;margin:4px 0;color:var(--fg-2)}
.doc hr{border:0;border-top:1px solid var(--line);margin:8px 0}
.doc math{font-size:13px}
.doc input,.doc textarea,.doc select,.doc button,.doc progress{background:transparent;border:1px solid var(--line);
  border-radius:3px;color:inherit;font-size:10px;height:1.1em;min-width:1.4em;padding:0;appearance:none}
.doc svg{max-width:100%;height:auto}

/* html snapshot "file card" */
.hcard .t{font-size:12.5px;font-weight:600;margin-bottom:7px;line-height:1.4}
.hrow{display:flex;align-items:baseline;gap:8px;font-size:11px;padding:1.5px 0;color:var(--fg-3)}
.hrow b{margin-left:auto;color:var(--fg-2);font-weight:520;max-width:62%;text-align:right;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hnote{margin-top:8px;padding-top:7px;border-top:1px solid var(--line-2);font-size:10.5px;color:var(--fg-3)}

.err{display:none;margin:8px 13px 0;font-size:11px;line-height:1.5;color:var(--bad)}

/* ---------- paste ---------- */
.paste{margin:9px 13px 0}
.pastearea{width:100%;min-height:92px;resize:vertical;background:var(--surface);color:var(--fg);
  border:1px dashed var(--line);border-radius:7px;padding:9px 10px;font-family:inherit;font-size:12px;
  line-height:1.6;outline:none}
.pastearea:focus{border-style:solid;border-color:var(--fg-3)}
.pastearea::placeholder{color:var(--fg-3)}

/* ---------- quiet actions ---------- */
.tools{display:flex;gap:14px;padding:9px 13px 0}
.tools button{background:none;border:0;color:var(--fg-3);font-size:11px;font-family:inherit;
  cursor:pointer;padding:0;border-bottom:1px solid transparent;transition:color .12s}
.tools button:hover{color:var(--fg);border-bottom-color:var(--line)}

/* ---------- format tabs ---------- */
.formats{display:flex;margin:8px 13px 0;border-bottom:1px solid var(--line-2)}
.formats button{position:relative;flex:1;display:flex;align-items:center;justify-content:center;gap:5px;
  background:none;border:0;padding:0 0 7px;margin-bottom:-1px;font-family:inherit;font-size:12px;
  color:var(--fg-3);cursor:pointer}
.formats button::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;border-radius:1px;
  background:transparent}
.formats button .k{font-family:var(--mono);font-size:9px;line-height:1.5;color:var(--fg-3);
  border:1px solid var(--line);border-radius:3px;padding:0 3px;min-width:13px;text-align:center}
.formats button.on{color:var(--fg);font-weight:600}
.formats button.on::after{background:var(--fg)}
.formats button.on .k{border-color:var(--fg);color:var(--fg)}
.formats button:disabled{opacity:.32;cursor:not-allowed}
@media (prefers-color-scheme: dark){
  .formats{border-bottom:0;gap:4px}
  .formats button{padding:6px 0;margin-bottom:0;border-radius:6px}
  .formats button.on{box-shadow:inset 0 0 0 1px var(--line)}
}

/* ---------- primary ---------- */
.go{display:block;width:calc(100% - 26px);margin:11px 13px 0;height:36px;border:0;border-radius:8px;
  background:var(--accent);color:var(--on-accent);font-family:inherit;font-size:12.5px;font-weight:600;
  letter-spacing:.01em;cursor:pointer;transition:opacity .13s}
.go:hover:not(:disabled){opacity:.86}
.go:disabled{opacity:.34;cursor:default}
.go.ok{background:var(--ok);color:#fff;opacity:1}
.status{padding:8px 13px 11px;font-size:10.5px;color:var(--fg-3);text-align:center;min-height:29px}
.status.ok{color:var(--ok)}
.status.err{color:var(--bad)}

/* ---------- pick hint ---------- */
.hint{position:fixed;z-index:2147483647;left:50%;top:14px;transform:translateX(-50%);
  padding:7px 14px;border-radius:999px;white-space:nowrap;
  font:500 12px/1.5 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;
  background:rgba(20,21,25,.92);color:#eef2f7;border:1px solid rgba(255,255,255,.09);
  backdrop-filter:blur(14px);box-shadow:0 10px 28px rgba(0,0,0,.34)}
.hint b{font-weight:640}
.hint kbd{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:3px;
  padding:0 4px;font:inherit;font-size:10px;font-family:ui-monospace,Consolas,monospace;color:#a8adb6}
@media (prefers-color-scheme: light){
  .hint{background:rgba(255,255,255,.97);color:#14161a;border-color:#e7e7e5;
    box-shadow:0 10px 28px rgba(20,22,26,.12)}
  .hint kbd{background:#f2f2ef;border-color:#e7e7e5;color:#5b6068}
}
`;

export function mountPanel() {
  const host = document.createElement('div');
  host.setAttribute('data-pageport', 'panel');
  const shadow = host.attachShadow({mode: 'open'});
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(CSS);
  shadow.adoptedStyleSheets = [sheet];
  shadow.innerHTML = `
  <div class="panel" part="panel">
    <div class="head">
      <span class="mark"></span><span class="name">PagePort</span>
      <span class="chip" id="chip"></span>
      <span class="grow"></span>
      <button class="icon" id="gear" title="设置">⚙</button>
      <button class="icon" id="close" title="关闭 (Esc)">✕</button>
    </div>
    <div class="settings" id="settings" hidden>
      <label>默认格式
        <select id="setFormat"><option value="md">Markdown</option><option value="png">图片</option><option value="html">网页快照</option></select>
      </label>
      <label>图片清晰度
        <select id="setScale"><option value="1">1× 小文件</option><option value="2" selected>2× 推荐</option><option value="3">3× 最清晰</option></select>
      </label>
    </div>
    <div class="meta">
      <div class="meta-k">已选内容</div>
      <div class="meta-v"><span id="targetLabel">在页面上点击选择</span><span class="meta-n" id="targetSize"></span></div>
    </div>
    <div class="preview" id="preview"><div class="empty"><div class="t">把鼠标移到要保存的内容上</div><div class="s">点击锁定 · ↑ 扩大 · ↓ 缩小</div></div></div>
    <div class="err" id="err"></div>
    <div class="paste" id="pasteRow" hidden>
      <textarea class="pastearea" id="pastearea" placeholder="在这里按 Ctrl+V 粘贴富文本或截图"></textarea>
    </div>
    <div class="tools" id="tools">
      <button id="re" hidden>重新选择</button>
      <button id="pasteBtn">粘贴导入</button>
      <button id="copy" hidden>复制 Markdown</button>
    </div>
    <div class="formats" id="seg">
      <button data-f="md" class="on"><span>Markdown</span><span class="k">1</span></button>
      <button data-f="png"><span>图片</span><span class="k">2</span></button>
      <button data-f="html"><span>网页快照</span><span class="k">3</span></button>
    </div>
    <button class="go" id="save">保存到本地</button>
    <div class="status" id="status">本地处理 · 不上传</div>
  </div>
  <div class="hint" id="hint" hidden><b>点击</b>选择区域 · <kbd>↑</kbd> 扩大 <kbd>↓</kbd> 缩小 · <kbd>Esc</kbd> 取消</div>`;
  document.documentElement.append(host);
  return {host, shadow};
}

const FMT_KEYS = ['md', 'png', 'html'];

export function openPanel({Picker}) {
  const {host, shadow} = mountPanel();
  const $ = id => shadow.getElementById(id);
  const panel = shadow.querySelector('.panel'), chip = $('chip'), preview = $('preview'), errEl = $('err'),
    status = $('status'), seg = $('seg'), saveBtn = $('save'), reBtn = $('re'), copyBtn = $('copy'),
    hint = $('hint'), settings = $('settings'), pasteRow = $('pasteRow'), pastearea = $('pastearea');

  const settingsStore = {
    format: 'md', scale: 2,
    async load() { try { Object.assign(this, await chrome.storage.local.get(['format', 'scale'])); } catch {} },
    save() { chrome.storage.local.set({format: this.format, scale: this.scale}).catch(() => {}); },
  };
  let state = 'pick';           // pick | preview | saving | done | paste
  let target = null;
  let selection = null;
  let selOnly = false;
  let format = settingsStore.format;
  let picker = null;
  const cache = new Map();

  const fmtMeta = {
    md: {ext: 'md', label: 'Markdown', mime: 'text/markdown;charset=utf-8'},
    png: {ext: 'png', label: '图片', mime: 'image/png'},
    html: {ext: 'html', label: '网页快照', mime: 'text/html;charset=utf-8'},
  };

  await_ready();
  async function await_ready() {
    await settingsStore.load();
    format = FMT_KEYS.includes(settingsStore.format) ? settingsStore.format : 'md';
    $('setFormat').value = format;
    $('setScale').value = String(settingsStore.scale);
    if (!useSelection()) startPick();
  }

  const idleStatus = () => { status.className = 'status'; status.textContent = '本地处理 · 不上传'; };

  // ---------- mode: picking ----------
  function startPick() {
    state = 'pick'; target = null; selection = null; selOnly = false; cache.clear();
    chip.textContent = '选择区域';
    $('targetLabel').textContent = '还没有选中';
    $('targetSize').textContent = '';
    preview.hidden = false;
    preview.innerHTML = '<div class="empty"><div class="t">把鼠标移到要保存的内容上</div><div class="s">点击锁定 · ↑ 扩大 · ↓ 缩小</div></div>';
    errEl.style.display = 'none';
    pasteRow.hidden = true;
    reBtn.hidden = true; copyBtn.hidden = true; $('pasteBtn').hidden = false;
    saveBtn.disabled = true; saveBtn.textContent = '保存到本地'; saveBtn.classList.remove('ok');
    saveBtn.onclick = doSave;
    idleStatus();
    hint.hidden = false;
    setSeg();
    picker?.stop();
    picker = new Picker({
      onPick: el => { hint.hidden = true; lock(el); },
      onCancel: () => { hint.hidden = true; closeAll(); },
    });
    picker.start();
  }

  // ---------- mode: locked ----------
  function lock(el) {
    state = 'preview'; target = el; selection = null; selOnly = false; cache.clear();
    const isMsg = el.matches?.('[data-testid^="conversation-turn"], [data-message-author-role]');
    chip.textContent = isMsg ? '对话消息' : '已选定';
    $('targetLabel').textContent = describeTarget(el);
    $('targetSize').textContent = sizeLabel(el);
    reBtn.hidden = false;
    saveBtn.disabled = false;
    idleStatus();
    setSeg(); renderPreview();
  }

  function sizeLabel(el) {
    const chars = (el.textContent || '').replace(/\s+/g, ' ').trim().length;
    if (chars > 60 && chars < 200000) return chars.toLocaleString('zh-CN') + ' 字';
    const r = el.getBoundingClientRect();
    return Math.round(r.width) + '×' + Math.round(r.height);
  }

  function useSelection() {
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
    const container = document.createElement('div');
    for (let i = 0; i < sel.rangeCount; i++) container.append(sel.getRangeAt(i).cloneContents());
    if (container.textContent.trim().length < 2) return false;
    state = 'preview'; selection = container; selOnly = true; target = null; cache.clear();
    chip.textContent = '文字选区';
    $('targetLabel').textContent = '选中的文字';
    $('targetSize').textContent = container.textContent.trim().length.toLocaleString('zh-CN') + ' 字';
    reBtn.hidden = false;
    saveBtn.disabled = format === 'png';
    setSeg(); renderPreview();
    return true;
  }

  function setSeg() {
    for (const b of seg.children) {
      const f = b.dataset.f;
      const disabled = selOnly && f !== 'md';
      b.disabled = disabled;
      b.classList.toggle('on', f === format);
      b.title = disabled ? '文字选区只能存为 Markdown；要截图请重新选择页面区域' : '';
    }
    copyBtn.hidden = format !== 'md' || state === 'pick';
  }

  async function renderPreview() {
    errEl.style.display = 'none';
    setSeg();
    try {
      if (format === 'md') {
        const src = selection || target;
        const md = cache.get('md') ?? toMarkdown(src);
        cache.set('md', md);
        if (!md) { preview.innerHTML = '<div class="empty"><div class="t">这里没有可提取的文字</div><div class="s">试试选择更大的区域，或改用「图片」</div></div>'; return; }
        preview.innerHTML = '';
        const doc = document.createElement('div');
        doc.className = 'doc';
        doc.append(renderClone(src) ?? document.createTextNode(md.slice(0, 4000)));
        preview.append(doc);
        preview.scrollTop = 0;
      } else if (format === 'png') {
        preview.innerHTML = '<div class="empty"><div class="s">正在生成预览…</div></div>';
        const thumb = cache.get('thumb') ?? await shootPngDataUrl(target || selection, {scale: 0.35});
        cache.set('thumb', thumb);
        preview.innerHTML = '';
        const img = document.createElement('img');
        img.src = thumb; img.alt = '预览';
        img.style.maxWidth = '100%'; img.style.borderRadius = '4px'; img.style.display = 'block';
        img.style.background = '#fff';
        img.style.background = '#fff';
        preview.append(img);
      } else {
        preview.innerHTML = '';
        preview.append(htmlCard());
      }
    } catch (e) {
      preview.innerHTML = '<div class="empty"><div class="s">—</div></div>';
      errEl.textContent = '预览失败：' + (e.message || e) + '，可以换个格式或区域重试。';
      errEl.style.display = 'block';
    }
  }

  // What the snapshot file will contain, stated as a file — not as prose.
  function htmlCard() {
    const card = document.createElement('div');
    card.className = 'hcard';
    const when = new Date().toLocaleString('zh-CN', {hour12: false});
    const row = (k, v) => {
      const d = document.createElement('div'); d.className = 'hrow';
      const a = document.createElement('span'); a.textContent = k;
      const b = document.createElement('b'); b.textContent = v; b.title = v;
      d.append(a, b); return d;
    };
    const t = document.createElement('div');
    t.className = 't';
    t.textContent = (document.title || '未命名页面').slice(0, 80);
    const note = document.createElement('div');
    note.className = 'hnote';
    note.textContent = '一个文件：页面画面 + 标题与来源；不含脚本，离线可开';
    card.append(t, row('来源', location.host), row('保存时间', when), note);
    return card;
  }

  // ---------- save ----------
  function filename(ext) {
    const base = (document.title || 'page').replace(/[\\/:*?"<>|#]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'page';
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `${base} ${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
  }
  function download(blob, name) {
    // Preferred: background chrome.downloads (reliable, shows in the shelf).
    // Fallback: page-context anchor click.
    return new Promise(resolve => {
      const fr = new FileReader();
      fr.onload = async () => {
        try {
          const b64 = String(fr.result).split(',')[1];
          const resp = await chrome.runtime.sendMessage({type: 'pp-download', name, mime: blob.type, base64: b64});
          if (resp?.ok) { resolve('downloads'); return; }
        } catch { /* fall through */ }
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = name; a.rel = 'noopener';
          document.documentElement.append(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          resolve('anchor');
        } catch (e) { resolve('failed:' + (e.message || e)); }
      };
      fr.readAsDataURL(blob);
    });
  }
  async function doSave() {
    if (state !== 'preview' || saveBtn.disabled) return;
    state = 'saving';
    saveBtn.disabled = true; saveBtn.textContent = '正在生成…';
    status.className = 'status'; status.textContent = '正在本地生成文件…';
    const meta = fmtMeta[format];
    try {
      let blob;
      if (format === 'md') blob = new Blob([cache.get('md') ?? toMarkdown(selection || target)], {type: meta.mime});
      else if (format === 'png') { const out = await shootPng(target, {scale: settingsStore.scale}); blob = out.blob; }
      else if (format === 'html') blob = new Blob([await shootHtml(target, {title: document.title, url: location.href, when: new Date().toLocaleString('zh-CN'), scale: settingsStore.scale})], {type: meta.mime});
      // A single formula or a one-line quote is legitimate: only refuse empty output.
      const minBytes = format === 'png' ? 100 : 4;
      if (!blob || blob.size < minBytes) throw Error('这一段没有可保存的内容，换一个区域试试');
      const how = await download(blob, filename(meta.ext));
      if (how.startsWith('failed')) throw Error(how.slice(7));
      state = 'done';
      saveBtn.textContent = '✓ 已保存'; saveBtn.classList.add('ok');
      status.className = 'status ok'; status.textContent = `已保存 ${meta.label} · ${(blob.size / 1024).toFixed(0)} KB`;
      setTimeout(() => {
        if (state === 'done') {
          saveBtn.textContent = '保存到本地'; saveBtn.classList.remove('ok');
          saveBtn.disabled = false; state = 'preview'; idleStatus();
        }
      }, 3200);
    } catch (e) {
      state = 'preview';
      saveBtn.disabled = false; saveBtn.textContent = '保存到本地';
      status.className = 'status err'; status.textContent = '保存失败：' + (e.message || e) + '（可重试）';
    }
  }

  // ---------- wiring ----------
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    format = b.dataset.f;
    setSeg();
    // While picking (or pasting) there is nothing to preview yet: just remember it.
    if (state === 'preview') renderPreview();
  });
  saveBtn.onclick = doSave;
  reBtn.onclick = () => startPick();
  $('pasteBtn').onclick = () => showPaste();
  copyBtn.onclick = async () => {
    try { await navigator.clipboard.writeText(cache.get('md') ?? ''); status.className = 'status ok'; status.textContent = '已复制到剪贴板'; }
    catch { status.className = 'status err'; status.textContent = '复制失败，请改用保存'; }
  };
  $('close').onclick = closeAll;
  $('gear').onclick = () => { settings.hidden = !settings.hidden; };
  $('setFormat').onchange = e => { settingsStore.format = e.target.value; settingsStore.save(); };
  $('setScale').onchange = e => { settingsStore.scale = Number(e.target.value); settingsStore.save(); };
  hint.hidden = true;
  document.addEventListener('keydown', onKey);

  function onKey(e) {
    if (shadow.activeElement === pastearea) return;
    const ae = document.activeElement;
    if (ae && (ae.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))) return;

    // Preview mode: ↑/↓ widen or shrink the locked region, like the picker.
    if (state === 'preview' && target && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      if (e.key === 'ArrowUp' && target !== document.body && target.parentElement && target.parentElement !== document.documentElement) {
        const next = target.parentElement;
        const msg = target.matches?.('[data-message-author-role],[data-testid^="conversation-turn"]');
        if (msg && (next === document.body || !next.querySelector('[data-message-author-role],[data-testid^="conversation-turn"]'))) return;
        e.preventDefault(); lock(next); return;
      }
      if (e.key === 'ArrowDown') {
        const c = [...target.children].find(x => !['SCRIPT', 'STYLE', 'LINK'].includes(x.tagName));
        if (c) { e.preventDefault(); lock(c); return; }
      }
    }

    // 1 / 2 / 3 pick a format, Enter saves — the kbd badges in the panel.
    if (state === 'preview' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const i = FMT_KEYS.indexOf(FMT_KEYS[Number(e.key) - 1] || '');
      if (e.key >= '1' && e.key <= '3' && i >= 0) {
        const f = FMT_KEYS[i];
        if (!(selOnly && f !== 'md')) { e.preventDefault(); format = f; renderPreview(); }
        return;
      }
      if (e.key === 'Enter' && !saveBtn.disabled) { e.preventDefault(); doSave(); return; }
    }

    if (e.key !== 'Escape') return;
    if (picker?.active) return; // picker handles its own Esc
    closeAll();
  }
  function closeAll() {
    picker?.stop(); picker = null;
    document.removeEventListener('keydown', onKey);
    host.remove();
  }

  // drag
  let drag = null;
  shadow.querySelector('.head').addEventListener('pointerdown', e => {
    if (e.target.closest('.icon')) return;
    const r = panel.getBoundingClientRect();
    drag = {dx: e.clientX - r.left, dy: e.clientY - r.top};
    panel.setPointerCapture(e.pointerId);
  });
  panel.addEventListener('pointermove', e => {
    if (!drag) return;
    const x = Math.min(Math.max(4, e.clientX - drag.dx), innerWidth - 80);
    const y = Math.min(Math.max(4, e.clientY - drag.dy), innerHeight - 60);
    panel.style.left = x + 'px'; panel.style.top = y + 'px'; panel.style.right = 'auto';
  });
  panel.addEventListener('pointerup', () => { drag = null; });

  // paste import
  function showPaste() {
    picker?.stop(); picker = null; hint.hidden = true;
    state = 'paste';
    chip.textContent = '粘贴导入';
    $('targetLabel').textContent = '粘贴的内容';
    $('targetSize').textContent = '';
    preview.hidden = true; pasteRow.hidden = false;
    $('pasteBtn').hidden = true; copyBtn.hidden = true;
    for (const b of seg.children) {
      const f = b.dataset.f, dis = f === 'png';
      b.disabled = dis; b.classList.toggle('on', f === format && !dis);
      if (f === 'md' && format === 'png') { format = 'md'; b.classList.add('on'); }
    }
    saveBtn.disabled = true; saveBtn.textContent = '保存到本地'; saveBtn.classList.remove('ok');
    saveBtn.onclick = doSave;
    idleStatus();
    pastearea.focus();
  }
  pastearea.addEventListener('paste', async e => {
    e.preventDefault();
    const dt = e.clipboardData; if (!dt) return;
    const imgItem = [...dt.items].find(i => i.kind === 'file' && /^image\/png$/i.test(i.type));
    const html = dt.getData('text/html'), text = dt.getData('text/plain');
    const container = document.createElement('div');
    if (imgItem) {
      const bmp = await createImageBitmap(imgItem.getAsFile());
      const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
      c.getContext('2d').drawImage(bmp, 0, 0);
      const dataUrl = c.toDataURL('image/png');
      preview.hidden = false; pasteRow.hidden = true;
      preview.innerHTML = ''; const im = document.createElement('img'); im.src = dataUrl;
      im.style.maxWidth = '100%'; im.style.borderRadius = '4px'; im.style.display = 'block';
      im.style.background = '#fff';
      im.style.background = '#fff';
      preview.append(im);
      $('targetLabel').textContent = '粘贴的截图';
      $('targetSize').textContent = bmp.width + '×' + bmp.height;
      chip.textContent = '截图';
      saveBtn.disabled = false;
      saveBtn.onclick = () => {
        fetch(dataUrl).then(r => r.blob()).then(b => download(b, filename('png')));
        status.className = 'status ok'; status.textContent = '已保存截图';
      };
      return;
    }
    if (html) container.innerHTML = html; else if (text) container.textContent = text;
    else return;
    preview.hidden = false; pasteRow.hidden = true;
    chip.textContent = '已粘贴';
    const md = toMarkdown(container);
    cache.set('md', md);
    preview.innerHTML = '';
    const doc = document.createElement('div');
    doc.className = 'doc';
    doc.append(renderClone(container) ?? document.createTextNode(md.slice(0, 4000)));
    preview.append(doc);
    $('targetLabel').textContent = '粘贴的内容';
    $('targetSize').textContent = container.textContent.trim().length.toLocaleString('zh-CN') + ' 字';
    saveBtn.disabled = false;
    saveBtn.onclick = () => { download(new Blob([md], {type: fmtMeta.md.mime}), filename('md')); status.className = 'status ok'; status.textContent = '已保存 Markdown'; };
  });

  // expose for toolbar re-entry
  return {closeAll, showPaste, useSelection, startPick};
}
