// Visual capture built on SnapDOM (MIT, @zumer/snapdom).
import {snapdom} from '@zumer/snapdom';

export async function shootPng(el, {scale = 2} = {}) {
  try {
    const blob = await snapdom.toBlob(el, {format: 'png', scale, embedFonts: true});
    if (!(blob instanceof Blob) || blob.size < 100) throw Error('渲染结果为空');
    return {blob, scale};
  } catch (e) {
    if (scale !== 1) return shootPng(el, {scale: 1}); // huge/complex nodes: retry at 1x
    throw e;
  }
}

export async function shootPngDataUrl(el, opts = {}) {
  const {blob} = await shootPng(el, opts);
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

// Self-contained HTML: the visual capture embedded with metadata. Opens
// anywhere, offline, no dependencies — the reliable "外观" deliverable.
export async function shootHtml(el, meta = {}) {
  const dataUrl = await shootPngDataUrl(el, {scale: meta.scale ?? 2});
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const title = esc(meta.title || '页面快照');
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · PagePort 快照</title>
<style>
 body{margin:0;font:15px/1.6 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;background:#f2f4f8;color:#1d2733}
 header{padding:18px 28px;background:#fff;border-bottom:1px solid #dfe5ee}
 h1{font-size:17px;margin:0 0 4px;font-weight:650}
 .meta{font-size:12.5px;color:#5b6b7e}
 .meta a{color:#3b74d8;text-decoration:none}
 main{padding:28px;display:flex;justify-content:center}
 img{max-width:100%;height:auto;border-radius:10px;box-shadow:0 10px 34px rgba(23,36,58,.14);background:#fff}
 footer{padding:0 28px 26px;font-size:12px;color:#8494a6}
</style></head>
<body>
<header><h1>${title}</h1>
<div class="meta">来源：<a href="${esc(meta.url)}">${esc(meta.url)}</a> · 保存时间：${esc(meta.when)} · PagePort 视觉快照（图片形式，不含页面脚本与交互）</div></header>
<main><img src="${dataUrl}" alt="${title} 的页面快照"></main>
<footer>本文件由 PagePort 生成并自包含，可离线打开与归档。</footer>
</body></html>`;
}
