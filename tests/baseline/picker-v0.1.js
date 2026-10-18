/* UI Portability Lab: self-contained, user-invoked page element picker.
 * No fetch, no credential access, no history enumeration, no hidden APIs.
 */
(() => {
  'use strict';
  if (globalThis.__uiPortabilityActive) return;
  globalThis.__uiPortabilityActive = true;
  const format = globalThis.__UI_PORTABILITY_FORMAT__ || 'html';
  const hint = document.createElement('div');
  hint.textContent = '选择需要导出的区域 · 单击保存 · Esc 取消';
  hint.setAttribute('role', 'status');
  hint.style.cssText = 'position:fixed!important;top:12px!important;left:50%!important;transform:translateX(-50%)!important;background:#172554!important;color:white!important;font:13px/1.4 system-ui!important;padding:9px 14px!important;border-radius:9px!important;z-index:2147483647!important;pointer-events:none!important;box-shadow:0 3px 12px #0003!important';
  const outline = document.createElement('div');
  outline.style.cssText='position:fixed!important;z-index:2147483646!important;border:3px solid #2563eb!important;box-sizing:border-box!important;background:#3b82f610!important;pointer-events:none!important;display:none!important';
  document.documentElement.append(hint, outline);
  let last = null;
  function point(e) {
    const target = e.target;
    if (!(target instanceof Element) || hint.contains(target) || outline.contains(target)) return;
    last = target;
    const r=target.getBoundingClientRect();
    outline.style.left = r.left+'px'; outline.style.top = r.top+'px';
    outline.style.width = r.width+'px'; outline.style.height=r.height+'px';
    outline.style.display='block';
  }
  function cleanup() {
    window.removeEventListener('pointermove', point, true);
    window.removeEventListener('click', choose, true);
    window.removeEventListener('keydown', key, true);
    hint.remove(); outline.remove();
    globalThis.__uiPortabilityActive = false;
  }
  function key(e){if(e.key==='Escape'){e.preventDefault();cleanup();}}
  const allowedHtml = new Set('article aside blockquote br button caption code dd details div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 header hr i kbd label li main mark ol p pre q s samp section small span strong sub summary sup table tbody td th thead tfoot time tr u ul'.split(' '));
  const allowedSvg = new Set('svg g defs path rect circle ellipse line polyline polygon text tspan linearGradient radialGradient stop clipPath mask pattern title desc'.split(' '));
  const allowedAttributes = new Set('id viewBox width height x y x1 x2 y1 y2 cx cy r rx ry d points transform fill stroke stroke-width stroke-linecap stroke-linejoin opacity fill-opacity stroke-opacity offset stop-color stop-opacity preserveAspectRatio xmlns vector-effect clip-path mask stroke-dasharray stroke-dashoffset text-anchor dominant-baseline role aria-label colspan rowspan'.split(' '));
  const styleProps = ['display','position','box-sizing','color','background-color','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','white-space','width','height','max-width','min-width','min-height','margin','margin-top','margin-right','margin-bottom','margin-left','padding','padding-top','padding-right','padding-bottom','padding-left','border','border-width','border-style','border-color','border-radius','box-shadow','opacity','vertical-align','flex','flex-direction','flex-wrap','align-items','justify-content','gap','grid-template-columns','grid-template-rows','grid-column','grid-row','overflow','text-decoration','object-fit'];
  const rejectTags = new Set('script style iframe frame object embed template link meta base form audio video source track noscript foreignobject animate animatetransform set use'.split(' '));
  const stats = {elements:0, omittedImages:0, canvasImages:0, omittedFrames:0, redactedControls:0, externalLinks:0, truncated:false, svg:0};
  const maxNodes = 5000;
  function cleanStyle(original, copy) {
    const css=getComputedStyle(original);
    for (const name of styleProps) {
      const value=css.getPropertyValue(name).trim();
      if (value && value.length < 260 && !/url\s*\(|expression\s*\(|@import|javascript:|data:/i.test(value)) copy.style.setProperty(name,value);
    }
  }
  function safeClone(node, parentDoc, depth=0) {
    if(depth>75 || stats.elements>maxNodes){stats.truncated=true;return parentDoc.createTextNode('[达到快照安全限制]');}
    if(node.nodeType===Node.TEXT_NODE) return parentDoc.createTextNode(node.nodeValue||'');
    if(node.nodeType!==Node.ELEMENT_NODE) return null;
    const source=node;
    const name=source.localName.toLowerCase();
    if (rejectTags.has(name)) {if(name==='iframe')stats.omittedFrames++;return null;}
    const computed=getComputedStyle(source);
    if(computed.display==='none'||computed.visibility==='hidden'||computed.visibility==='collapse')return null;
    if(['input','textarea','select'].includes(name)) {
      stats.redactedControls++;
      const replacement=parentDoc.createElement('span');
      if(name==='input' && source.type==='range') {
        replacement.textContent=`[滑块: ${source.value}, 范围 ${source.min||'0'}–${source.max||'100'}]`;
      } else if(name==='input' && source.type==='checkbox') {
        replacement.textContent=`[复选框: ${source.checked?'已选择':'未选择'}]`;
      } else replacement.textContent='[输入控件已脱敏]';
      cleanStyle(source,replacement);return replacement;
    }
    if(name==='canvas'){
      const pic=parentDoc.createElement('img');
      try { const data=source.toDataURL('image/png');
        if(data.length>3_000_000)throw new Error('too-large');
        pic.setAttribute('src',data);stats.canvasImages++;
      }catch {pic.replaceWith();return parentDoc.createTextNode('[Canvas 无法安全内嵌]');}
      return pic;
    }
    if(name==='img'){
      const pic=parentDoc.createElement('img');
      const src=source.getAttribute('src')||'';
      if(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(src)&&src.length<3_000_000){pic.setAttribute('src',src);} 
      else {stats.omittedImages++;return parentDoc.createTextNode(`[图片已省略: ${source.getAttribute('alt')||'远程资源'}]`);}
      pic.setAttribute('alt', source.getAttribute('alt') || '');cleanStyle(source,pic);return pic;
    }
    const svg = source.namespaceURI==='http://www.w3.org/2000/svg';
    const tag = svg && allowedSvg.has(name) ? source.localName : allowedHtml.has(name) ? name : 'span';
    const target= svg && allowedSvg.has(name) ? parentDoc.createElementNS('http://www.w3.org/2000/svg',tag) : parentDoc.createElement(tag);
    stats.elements++;
    if(svg && name==='svg') {target.setAttribute('xmlns','http://www.w3.org/2000/svg');stats.svg++;}
    for(const attr of source.attributes){
      if(allowedAttributes.has(attr.name) && !/^on/i.test(attr.name) && !/url\s*\(|javascript:|data:/i.test(attr.value) && attr.value.length<1000) {
        target.setAttribute(attr.name,attr.value);
      } else if((attr.name==='href'||attr.name==='src') && !/^(#|data:)/.test(attr.value)) {stats.externalLinks++;}
    }
    if(!svg)cleanStyle(source,target);
    for(const child of source.childNodes){const cleaned=safeClone(child,parentDoc,depth+1);if(cleaned)target.appendChild(cleaned);}
    return target;
  }
  function escapeHtml(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function safeName(text){return (text||'ui-snapshot').normalize('NFKC').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').slice(0,70) || 'ui-snapshot';}
  function markdown(root){
    const lines=[];
    const inline = n => n.nodeType===3?n.nodeValue.replace(/\s+/g,' '):
      n.nodeType!==1?'':(['br'].includes(n.localName)?'  \n':(n.localName==='strong'?'**':'')+Array.from(n.childNodes).map(inline).join('')+(n.localName==='strong'?'**':''));
    function walk(n){
      if(n.nodeType===3){const t=n.nodeValue.trim();if(t)lines.push(t);return;}
      if(n.nodeType!==1)return;
      const tag=n.localName;
      if(/^h[1-6]$/.test(tag)){lines.push('#'.repeat(Number(tag[1]))+' '+inline(n).trim()+'\n');return;}
      if(tag==='pre'){lines.push('```\n'+n.textContent.trim()+'\n```\n');return;}
      if(tag==='svg'){lines.push('[SVG 图形见 HTML/SVG 导出]');return;}
      if(tag==='table'){
        const rows=Array.from(n.querySelectorAll('tr')).map(r=>Array.from(r.querySelectorAll('th,td')).map(c=>inline(c).trim().replace(/\|/g,'\\|').replace(/\n/g,' ')));
        if(rows.length){const cols=Math.max(...rows.map(r=>r.length));const fill=r=>Array.from({length:cols},(_,i)=>r[i]||'');lines.push('| '+fill(rows[0]).join(' | ')+' |','| '+fill(rows[0]).map(()=> '---').join(' | ')+' |');for(const row of rows.slice(1))lines.push('| '+fill(row).join(' | ')+' |');lines.push('');}return;
      }
      if(tag==='li'){lines.push('- '+inline(n).trim());return;}
      if(['p','blockquote','figcaption'].includes(tag)){lines.push(inline(n).trim()+'\n');return;}
      if(tag==='img'){lines.push('[图片见 HTML 导出]');return;}
      for(const child of n.childNodes)walk(child);
    }
    walk(root);
    return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
  }
  function download(filename, body, mime){
    const blob=new Blob([body],{type:mime});const url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download=filename;
    document.documentElement.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function choose(e) {
    if(!last)return;
    e.preventDefault();e.stopImmediatePropagation();
    const selected=last;cleanup();
    try {
      const safeDoc=document.implementation.createHTMLDocument('Snapshot');
      const cloned=safeClone(selected,safeDoc);
      if(!cloned)throw new Error('这个区域没有可以导出的可见内容');
      const title=safeName(cloned.textContent.trim().slice(0,50));
      const origin = location.origin;
      const capturedAt=new Date().toISOString();
      const fragment=cloned.outerHTML||escapeHtml(cloned.textContent);
      const report={schemaVersion:'0.1.0',kind:'static-snapshot',capturedAt,origin, title, limitations:['不包含原有事件处理函数','没有自动下载跨域图片','输入文本内容已脱敏'],stats,html:fragment,text:cloned.textContent};
      const md=`<!-- UI Portability Lab 静态快照；非官方智能界面源码 -->\n`+markdown(cloned);
      const csp=`default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'`;
      const page=`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>${escapeHtml(title)}</title><style>html{background:#f8fafc}body{box-sizing:border-box;max-width:1100px;margin:24px auto;padding:24px;background:white;color:#1f2937;font:16px/1.5 system-ui;overflow-wrap:anywhere}svg{max-width:100%}*{box-sizing:border-box}</style></head><body><p style="font-size:12px;color:#64748b">UI Portability Lab · 静态快照 · ${escapeHtml(capturedAt)} · 不含原始交互逻辑</p>${fragment}</body></html>`;
      const basename='ui-export-'+Date.now();
      if(format==='md')download(basename+'.md',md,'text/markdown;charset=utf-8');
      else if(format==='json')download(basename+'.json',JSON.stringify(report,null,2),'application/json;charset=utf-8');
      else if(format==='svg'){
        if(cloned.namespaceURI==='http://www.w3.org/2000/svg' && cloned.localName==='svg')download(basename+'.svg',new XMLSerializer().serializeToString(cloned),'image/svg+xml;charset=utf-8');
        else alert('SVG 导出只支持直接选择 SVG 根元素。请选择图形本身，或者使用 HTML 格式。');
      }
      else download(basename+'.html',page,'text/html;charset=utf-8');
    } catch(err){alert('导出失败：'+String(err.message||err));}
  }
  window.addEventListener('pointermove',point,true);
  window.addEventListener('click',choose,true);
  window.addEventListener('keydown',key,true);
})();
