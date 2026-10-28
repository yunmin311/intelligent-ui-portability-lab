// PagePort in-page panel. Closed shadow DOM + constructable stylesheet so the
// page's own CSS and CSP cannot break the UI. No frameworks.
import {toMarkdown} from './convert.js';
import {shootPng, shootPngDataUrl, shootHtml} from './shoot.js';

const CSS = `
:host{all:initial}
*{box-sizing:border-box;margin:0;padding:0;font:inherit;color:inherit}
[hidden]{display:none!important}
.panel{position:fixed;z-index:2147483646;top:14px;right:14px;width:340px;max-width:calc(100vw - 24px);
  background:rgba(23,27,35,.94);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  color:#e8edf4;border:1px solid rgba(255,255,255,.1);border-radius:14px;
  box-shadow:0 18px 50px rgba(5,10,20,.42),0 2px 8px rgba(5,10,20,.28);
  font:13.5px/1.55 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;
  animation:pp-in .16s ease-out}
@keyframes pp-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@media (prefers-color-scheme: light){
  .panel{background:rgba(252,253,255,.97);color:#243041;border-color:rgba(24,34,54,.13);
    box-shadow:0 18px 50px rgba(30,44,68,.18),0 2px 8px rgba(30,44,68,.1)}
}
.head{display:flex;align-items:center;gap:8px;padding:11px 12px 9px 14px;cursor:grab;user-select:none}
.head:active{cursor:grabbing}
.logo{width:18px;height:18px;border-radius:6px;background:linear-gradient(135deg,#ffc95e,#f59e0b);position:relative;flex:none}
.logo::after{content:"";position:absolute;inset:5px 5px 4px;border:1.6px solid rgba(28,21,3,.85);border-top:none;border-radius:0 0 3px 3px}
.name{font-weight:650;letter-spacing:.01em;font-size:13.5px}
.chip{margin-left:2px;font-size:11px;font-weight:550;padding:2px 8px;border-radius:999px;
  background:rgba(255,178,36,.16);color:#ffc95e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}
@media (prefers-color-scheme: light){.chip{background:rgba(245,158,11,.14);color:#a16207}}
.spacer{flex:1}
.icon{width:26px;height:26px;border:0;border-radius:7px;background:transparent;color:inherit;opacity:.62;
  cursor:pointer;display:grid;place-items:center;font-size:15px}
.icon:hover{opacity:1;background:rgba(128,148,178,.16)}
.body{padding:2px 14px 4px}
.target{display:flex;align-items:center;gap:7px;font-size:12px;color:#9aa8bb;padding:4px 1px 8px}
@media (prefers-color-scheme: light){.target{color:#5d6d82}}
.target .dot{width:6px;height:6px;border-radius:50%;background:#ffb224;flex:none}
.preview{border:1px solid rgba(140,160,190,.2);border-radius:10px;background:rgba(255,255,255,.045);
  max-height:38vh;min-height:84px;overflow:auto;padding:10px 12px;white-space:pre-wrap;overflow-wrap:anywhere;
  font:11.5px/1.6 ui-monospace,SFMono-Regular,Consolas,"Cascadia Mono",monospace;color:#c6d1df}
@media (prefers-color-scheme: light){.preview{background:rgba(30,44,68,.045);color:#33465e}}
.preview img{max-width:100%;border-radius:6px;display:block;margin:0 auto}
.preview .empty{color:#7b8aa0;display:grid;place-items:center;min-height:84px;text-align:center;
  font:12.5px/1.6 system-ui,sans-serif;font-family:inherit}
.err{margin-top:8px;color:#ff8d7a;font-size:12px;display:none}
.foot{padding:10px 14px 12px}
.seg{display:flex;background:rgba(140,160,190,.14);border-radius:9px;padding:3px;gap:2px;margin-bottom:10px}
.seg button{flex:1;border:0;background:transparent;color:inherit;opacity:.72;cursor:pointer;
  padding:6px 0;border-radius:7px;font-size:12.5px;font-weight:550}
.seg button.on{background:rgba(255,178,36,.95);color:#221902;opacity:1;font-weight:650;
  box-shadow:0 1px 5px rgba(0,0,0,.25)}
.seg button:disabled{opacity:.32;cursor:not-allowed}
.row{display:flex;gap:8px;align-items:stretch}
button.act{border:1px solid rgba(140,160,190,.28);background:transparent;color:inherit;border-radius:9px;
  padding:0 13px;min-height:38px;font-size:13px;font-weight:550;cursor:pointer}
button.act:hover{background:rgba(140,160,190,.14)}
button.primary{flex:1;border:0;border-radius:9px;background:linear-gradient(135deg,#ffc95e,#f59e0b);
  color:#221902;font-weight:680;font-size:13.5px;cursor:pointer;min-height:38px;
  box-shadow:0 2px 10px rgba(245,158,11,.35)}
button.primary:disabled{opacity:.55;cursor:default}
button.primary.ok{background:linear-gradient(135deg,#5eead4,#10b981);color:#04281f;box-shadow:none}
.status{padding:0 14px 11px;font-size:12px;color:#9aa8bb;min-height:24px}
@media (prefers-color-scheme: light){.status{color:#5d6d82}}
.status.ok{color:#34d399}.status.err{color:#ff8d7a}
.settings{padding:2px 14px 10px;display:grid;gap:8px;border-bottom:1px solid rgba(140,160,190,.16);margin-bottom:6px}
.settings label{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12.5px;color:#9aa8bb}
@media (prefers-color-scheme: light){.settings label{color:#5d6d82}}
.settings select{background:rgba(140,160,190,.14);color:inherit;border:1px solid rgba(140,160,190,.25);
  border-radius:7px;padding:4px 8px;font-size:12.5px}
.hint{position:fixed;z-index:2147483647;left:50%;top:14px;transform:translateX(-50%);
  background:rgba(24,28,36,.94);color:#eef2f7;border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px);
  font:500 13px/1.5 system-ui,"Segoe UI","Microsoft YaHei",sans-serif;padding:9px 16px;border-radius:999px;
  box-shadow:0 8px 28px rgba(0,0,0,.35);white-space:nowrap}
@media (prefers-color-scheme: light){.hint{background:rgba(255,255,255,.97);color:#253141;border-color:rgba(20,30,50,.13)}}
.hint b{color:#ffb224}
.pastearea{width:100%;min-height:110px;resize:vertical;background:rgba(255,255,255,.05);color:#c6d1df;
  border:1px dashed rgba(140,160,190,.4);border-radius:10px;padding:10px 12px;font-size:12.5px;outline:none}
.pastearea:focus{border-color:#ffb224}
@media (prefers-color-scheme: light){.pastearea{background:rgba(30,44,68,.04);color:#33465e}}
.subrow{display:flex;gap:8px;margin-top:8px}
/* ---- Variant "sheet": centered editorial panel (Direction 2) ---- */
:host([data-variant="sheet"]) .panel{width:560px;max-width:calc(100vw - 32px);top:7vh;right:auto;left:50%;transform:translateX(-50%);
  background:#fbfcfe;color:#1f2937;border:1px solid #dfe5ee;border-radius:18px;
  box-shadow:0 30px 80px rgba(24,40,70,.22);font-size:14px}
@media (prefers-color-scheme: dark){:host([data-variant="sheet"]) .panel{background:#1b2129;color:#e2e8f0;border-color:#333d4d}}
:host([data-variant="sheet"]) .head{padding:16px 18px 10px;border-bottom:1px solid rgba(120,140,170,.18)}
:host([data-variant="sheet"]) .logo{width:22px;height:22px;border-radius:7px}
:host([data-variant="sheet"]) .name{font-size:15px;font-weight:680}
:host([data-variant="sheet"]) .body{padding:10px 18px 4px}
:host([data-variant="sheet"]) .preview{max-height:48vh;min-height:120px;border-radius:12px;background:rgba(30,44,68,.035);font-size:12.5px;line-height:1.7}
:host([data-variant="sheet"]) .foot{padding:12px 18px 16px}
:host([data-variant="sheet"]) .seg{margin-bottom:12px;padding:4px;border-radius:11px}
:host([data-variant="sheet"]) .seg button{padding:8px 0;font-size:13.5px}
:host([data-variant="sheet"]) button.primary{min-height:44px;font-size:14.5px}
:host([data-variant="sheet"]) button.act{min-height:44px}
:host([data-variant="sheet"]) .status{padding:0 18px 14px;font-size:12.5px}
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
      <span class="logo"></span><span class="name">PagePort</span>
      <span class="chip" id="chip"></span>
      <span class="spacer"></span>
      <button class="icon" id="gear" title="设置">⚙</button>
      <button class="icon" id="close" title="关闭 (Esc)">×</button>
    </div>
    <div class="settings" id="settings" hidden>
      <label>默认格式
        <select id="setFormat"><option value="md">Markdown</option><option value="png">PNG 图片</option><option value="html">HTML 快照</option></select>
      </label>
      <label>PNG 清晰度
        <select id="setScale"><option value="1">1×（小文件）</option><option value="2" selected>2×（推荐）</option><option value="3">3×（最清晰）</option></select>
      </label>
      <label>面板样式
        <select id="setVariant"><option value="floater" selected>紧凑（角落，不遮挡页面）</option><option value="sheet">大预览（居中）</option></select>
      </label>
    </div>
    <div class="body">
      <div class="target"><span class="dot"></span><span id="targetLabel">在页面上点击，选择要保存的区域</span></div>
      <div class="preview" id="preview"><div class="empty">移动鼠标查看，<br>点击锁定区域</div></div>
      <div class="err" id="err"></div>
      <div class="subrow" id="pasteRow" hidden>
        <textarea class="pastearea" id="pastearea" placeholder="在此按 Ctrl+V 粘贴富文本或截图"></textarea>
      </div>
    </div>
    <div class="foot">
      <div class="seg" id="seg">
        <button data-f="md" class="on">Markdown</button>
        <button data-f="png">PNG 图片</button>
        <button data-f="html">HTML 快照</button>
      </div>
      <div class="row">
        <button class="act" id="re">重新选择</button>
        <button class="act" id="pasteBtn">粘贴导入</button>
        <button class="act" id="copy" hidden>复制</button>
        <button class="primary" id="save">保存到本地 ↓</button>
      </div>
    </div>
    <div class="status" id="status">本地处理 · 不上传 · Esc 关闭</div>
  </div>
  <div class="hint" id="hint" hidden><b>点击</b>选择区域 · <b>↑</b>扩大 · <b>↓</b>缩小 · <b>Esc</b> 取消</div>`;
  document.documentElement.append(host);
  return {host, shadow};
}

export function openPanel({Picker}) {
  const {host, shadow} = mountPanel();
  const $ = id => shadow.getElementById(id);
  const panel = shadow.querySelector('.panel'), chip = $('chip'), preview = $('preview'), errEl = $('err'),
    status = $('status'), seg = $('seg'), saveBtn = $('save'), reBtn = $('re'), copyBtn = $('copy'),
    hint = $('hint'), settings = $('settings'), pasteRow = $('pasteRow'), pastearea = $('pastearea');

  const settingsStore = {
    format: 'md', scale: 2, variant: 'floater',
    async load() { try { Object.assign(this, await chrome.storage.local.get(['format', 'scale', 'variant'])); } catch {} },
    save() { chrome.storage.local.set({format: this.format, scale: this.scale, variant: this.variant}).catch(() => {}); },
  };
  let state = 'pick';           // pick | preview | saving | done
  let target = null;            // locked element
  let selection = null;         // {container} for text-selection mode
  let selOnly = false;
  let format = settingsStore.format;
  let picker = null;
  const cache = new Map();
  let drag = null;

  const fmtMeta = {
    md: {ext: 'md', label: 'Markdown', mime: 'text/markdown;charset=utf-8'},
    png: {ext: 'png', label: 'PNG 图片', mime: 'image/png'},
    html: {ext: 'html', label: 'HTML 快照', mime: 'text/html;charset=utf-8'},
  };

  await_ready();
  async function await_ready() {
    await settingsStore.load();
    format = ['md', 'png', 'html'].includes(settingsStore.format) ? settingsStore.format : 'md';
    $('setFormat').value = format;
    $('setScale').value = String(settingsStore.scale);
    $('setVariant').value = settingsStore.variant === 'sheet' ? 'sheet' : 'floater';
    if ($('setVariant').value === 'sheet') host.setAttribute('data-variant', 'sheet');
    if (!useSelection()) startPick();
  }

  // ---------- mode: picking ----------
  function startPick() {
    state = 'pick'; target = null; selection = null; selOnly = false; cache.clear();
    chip.textContent = '选择区域';
    $('targetLabel').textContent = '在页面上点击，选择要保存的区域';
    preview.hidden = false;
    preview.innerHTML = '<div class="empty">移动鼠标查看，<br>点击锁定区域</div>';
    errEl.style.display = 'none';
    pasteRow.hidden = true;
    reBtn.hidden = true; copyBtn.hidden = true; $('pasteBtn').hidden = false;
    saveBtn.disabled = true; saveBtn.textContent = '保存到本地 ↓'; saveBtn.classList.remove('ok');
    saveBtn.onclick = doSave;
    hint.hidden = false;
    setSeg();
    picker?.stop();
    picker = new Picker({
      onPick: el => { hint.hidden = true; lock(el); },
      onCancel: () => { hint.hidden = true; closeAll(); },
    });
    picker.start();
  }

  // ---------- mode: locked/preview ----------
  function lock(el) {
    state = 'preview'; target = el; cache.clear();
    const msg = el.matches('[data-testid^="conversation-turn"], [data-message-author-role], article:has([data-message-author-role])') || el.querySelector?.('[data-message-author-role]');
    chip.textContent = msg ? '对话消息' : '已选定';
    const r = el.getBoundingClientRect();
    $('targetLabel').textContent = `${el.tagName.toLowerCase()} · ${Math.round(r.width)}×${Math.round(r.height)} px`;
    reBtn.hidden = false;
    saveBtn.disabled = false;
    setSeg(); renderPreview();
  }
  function useSelection() {
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
    const container = document.createElement('div');
    for (let i = 0; i < sel.rangeCount; i++) container.append(sel.getRangeAt(i).cloneContents());
    if (container.textContent.trim().length < 2) return false;
    state = 'preview'; selection = container; selOnly = true; target = null; cache.clear();
    chip.textContent = '文字选区';
    $('targetLabel').textContent = `选区 · 约 ${container.textContent.trim().length} 字（区域选择可获得 PNG）`;
    reBtn.hidden = false;
    setSeg(); renderPreview();
    return true;
  }

  function setSeg() {
    for (const b of seg.children) {
      const f = b.dataset.f;
      const disabled = selOnly && f !== 'md';
      b.disabled = disabled;
      b.classList.toggle('on', f === format);
      b.title = disabled ? '文字选区仅支持 Markdown；需要 PNG 请“重新选择”页面区域' : '';
    }
    copyBtn.hidden = format !== 'md' || state === 'pick';
  }

  async function renderPreview() {
    const key = format;
    errEl.style.display = 'none';
    try {
      if (format === 'md') {
        const md = cache.get('md') ?? toMarkdown(selection || target);
        cache.set('md', md);
        preview.textContent = md.length > 20000 ? md.slice(0, 20000) + '\n…（预览截断，保存为完整内容）' : md || '(空)';
        preview.scrollTop = 0;
      } else if (format === 'png') {
        preview.innerHTML = '<div class="empty">正在生成预览…</div>';
        const thumb = cache.get('thumb') ?? await shootPngDataUrl(target || selection, {scale: 0.35});
        cache.set('thumb', thumb);
        preview.innerHTML = '';
        const img = document.createElement('img');
        img.src = thumb; img.alt = '预览';
        preview.append(img);
      } else {
        preview.innerHTML = '<div class="empty">HTML 快照 = 本区域完整视觉画面 + 标题/来源/时间元数据，<br>单文件自包含、离线可开。保存后可预览效果。</div>';
      }
    } catch (e) {
      preview.innerHTML = '<div class="empty">—</div>';
      errEl.textContent = '预览失败：' + (e.message || e) + '，可换其他格式或区域重试。';
      errEl.style.display = 'block';
    }
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
      if (!blob || blob.size < 32) throw Error('生成的内容为空，请换一个更大的区域');
      const how = await download(blob, filename(meta.ext));
      if (how.startsWith('failed')) throw Error(how.slice(7));
      state = 'done';
      saveBtn.textContent = '✓ 已保存'; saveBtn.classList.add('ok');
      status.className = 'status ok'; status.textContent = `已保存 ${meta.label}（${(blob.size / 1024).toFixed(0)} KB），见浏览器下载；页面可随时关闭。`;
      setTimeout(() => { if (state === 'done') { saveBtn.textContent = '保存到本地 ↓'; saveBtn.classList.remove('ok'); saveBtn.disabled = false; state = 'preview'; status.className = 'status'; status.textContent = '本地处理 · 不上传 · Esc 关闭'; } }, 3200);
    } catch (e) {
      state = 'preview';
      saveBtn.disabled = false; saveBtn.textContent = '保存到本地 ↓';
      status.className = 'status err'; status.textContent = '保存失败：' + (e.message || e) + '（可重试）';
    }
  }

  // ---------- wiring ----------
  seg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    format = b.dataset.f; setSeg(); renderPreview();
  });
  saveBtn.onclick = doSave;
  reBtn.onclick = () => startPick();
  $('pasteBtn').onclick = () => showPaste();
  copyBtn.onclick = async () => {
    try { await navigator.clipboard.writeText(cache.get('md') ?? ''); status.className = 'status ok'; status.textContent = '已复制到剪贴板'; }
    catch { status.className = 'status err'; status.textContent = '复制失败：请改用“保存到本地”'; }
  };
  $('close').onclick = closeAll;
  $('gear').onclick = () => { settings.hidden = !settings.hidden; };
  $('setFormat').onchange = e => { settingsStore.format = e.target.value; settingsStore.save(); };
  $('setScale').onchange = e => { settingsStore.scale = Number(e.target.value); settingsStore.save(); };
  $('setVariant').onchange = e => { settingsStore.variant = e.target.value; settingsStore.save(); host.setAttribute('data-variant', settingsStore.variant); };
  hint.hidden = true;
  // paste mode
  document.addEventListener('keydown', onKey);

  function onKey(e) {
    if (shadow.activeElement === pastearea) return;
    // Preview mode: ↑/↓ widen or shrink the locked region, like the picker.
    if (state === 'preview' && target && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      if (e.key === 'ArrowUp' && target !== document.body && target.parentElement && target.parentElement !== document.documentElement) {
        const next = target.parentElement;
        // Don't climb out of a detected chat message onto the whole page.
        const msg = target.matches?.('[data-message-author-role],[data-testid^="conversation-turn"]');
        if (msg && (next === document.body || !next.querySelector('[data-message-author-role],[data-testid^="conversation-turn"]'))) return;
        e.preventDefault(); lock(next); return;
      }
      if (e.key === 'ArrowDown') {
        const c = [...target.children].find(x => !['SCRIPT', 'STYLE', 'LINK'].includes(x.tagName));
        if (c) { e.preventDefault(); lock(c); return; }
      }
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
    $('targetLabel').textContent = '粘贴富文本、纯文本或截图';
    preview.hidden = true; pasteRow.hidden = false;
    $('pasteBtn').hidden = true; copyBtn.hidden = true;
    setSegForPaste();
    pastearea.focus();
  }
  function setSegForPaste() {
    for (const b of seg.children) {
      const f = b.dataset.f; const dis = f === 'png';
      b.disabled = dis; b.classList.toggle('on', f === format && !dis);
      if (f === 'md' && format === 'png') { format = 'md'; b.classList.add('on'); }
    }
  }
  $('pastearea').addEventListener('paste', async e => {
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
      preview.innerHTML = ''; const im = document.createElement('img'); im.src = dataUrl; preview.append(im);
      $('targetLabel').textContent = `截图 ${bmp.width}×${bmp.height}`;
      cache.set('pngData', dataUrl);
      chip.textContent = '截图';
      saveBtn.disabled = false;
      saveBtn.onclick = () => {
        fetch(dataUrl).then(r => r.blob()).then(b => download(b, filename('png')));
        status.className = 'status ok'; status.textContent = '已保存截图，见浏览器下载。';
      };
      return;
    }
    if (html) container.innerHTML = html; else if (text) container.textContent = text;
    else return;
    preview.hidden = false; pasteRow.hidden = true;
    chip.textContent = '已粘贴';
    const md = toMarkdown(container);
    cache.set('md', md);
    preview.textContent = md.slice(0, 20000);
    $('targetLabel').textContent = `粘贴内容 · 约 ${container.textContent.trim().length} 字`;
    saveBtn.disabled = false;
    saveBtn.onclick = () => { download(new Blob([md], {type: fmtMeta.md.mime}), filename('md')); status.className = 'status ok'; status.textContent = '已保存 Markdown，见浏览器下载。'; };
  });

  // expose for toolbar re-entry
  return {closeAll, showPaste, useSelection, startPick};
}
