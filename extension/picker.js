/* UI Portability Lab: self-contained, user-invoked page element picker.
 * No fetch, no credential access, no history enumeration, no hidden APIs.
 */
(() => {
  'use strict';
  globalThis.__uiPortabilityCleanup?.();
  globalThis.__uiPortabilityActive = true;
  const format = globalThis.__UI_PORTABILITY_FORMAT__ || 'html';
  const host = document.createElement('div');
  host.dataset.uipPicker = '';
  host.style.cssText='all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important';
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML=`<style>:host{color-scheme:light dark}.panel{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);max-width:calc(100vw - 32px);background:#202124;color:#fff;font:13px/1.5 system-ui;padding:12px;border:1px solid #5f6368;border-radius:8px;box-shadow:0 3px 16px #0005;pointer-events:auto}button{min-height:44px;padding:6px 12px;margin:8px 4px 0 0;font:inherit;border:1px solid #5f6368;border-radius:4px;background:#303134;color:#fff;cursor:pointer}button:disabled{opacity:.4}button:focus-visible{outline:2px solid #8ab4f8}#outline{position:fixed;border:2px solid #1a73e8;box-sizing:border-box;background:#1a73e815;pointer-events:none;display:none}#label{font-weight:600}#error{color:#ffb4ab;white-space:pre-wrap;max-width:620px}</style><div id="outline"></div><div class="panel"><div id="label">移动指针选择区域，单击锁定</div><div>↑ 扩大到父容器 · ↓ 返回子区域 · Enter 预览 · Esc 取消</div><div id="error" role="status"></div><button id="parent">扩大区域 ↑</button><button id="child">缩小区域 ↓</button><button id="preview">捕获并预览</button><button id="cancel">取消</button></div>`;
  document.documentElement.append(host);
  const outline=shadow.getElementById('outline');
  let last=null, locked=false, trail=[], busy=false;
  function status(text){if(globalThis.chrome?.runtime?.id)chrome.runtime.sendMessage({type:'pickerStatus',status:text}).catch(()=>{});}
  function draw(){
    if(!last?.isConnected){last=null;outline.style.display='none';return;}
    const r=last.getBoundingClientRect();
    Object.assign(outline.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',display:'block'});
    shadow.getElementById('label').textContent=`${locked?'已锁定':'候选'}：${last.localName} · ${Math.round(r.width)} × ${Math.round(r.height)} px`;
    shadow.getElementById('parent').disabled=!last.parentElement||last.parentElement===document.documentElement;
    shadow.getElementById('child').disabled=!trail.length;
  }
  function point(e){
    if(locked||busy||e.composedPath().includes(host))return;
    const target=e.target;
    if(!(target instanceof Element))return;
    // Prefer the nearest semantic component. Generic div layouts remain adjustable.
    last=target.closest('svg,section,article,figure,table,[role="region"],[role="table"],[role="img"]')||target;
    trail=[];draw();
  }
  function parent(){if(last?.parentElement&&last.parentElement!==document.documentElement){trail.push(last);last=last.parentElement;locked=true;draw();}}
  function child(){if(trail.length){last=trail.pop();locked=true;draw();}}
  function cleanup(){
    window.removeEventListener('pointermove',point,true);window.removeEventListener('click',choose,true);
    window.removeEventListener('keydown',key,true);window.removeEventListener('scroll',draw,true);window.removeEventListener('resize',draw);
    host.remove();globalThis.__uiPortabilityActive=false;delete globalThis.__uiPortabilityCleanup;
  }
  globalThis.__uiPortabilityCleanup=cleanup;
  function key(e){
    if(!['Escape','ArrowUp','ArrowDown','Enter'].includes(e.key)||busy)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(e.key==='Escape'){cleanup();status('已取消，可重新选择');}
    else if(e.key==='ArrowUp')parent();else if(e.key==='ArrowDown')child();else capture();
  }
  shadow.getElementById('parent').onclick=parent;shadow.getElementById('child').onclick=child;
  shadow.getElementById('preview').onclick=()=>capture();shadow.getElementById('cancel').onclick=()=>{cleanup();status('已取消，可重新选择');};
  const allowedHtml = new Set('a article aside blockquote br button caption code dd details div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 header hr i kbd label li main mark ol p pre q s samp section small span strong sub summary sup output table tbody td th thead tfoot time tr u ul'.split(' '));
  const allowedSvg = new Set('svg g defs path rect circle ellipse line polyline polygon text tspan lineargradient radialgradient stop clippath mask pattern title desc'.split(' '));
  const allowedAttributes = new Set('viewBox width height x y x1 x2 y1 y2 cx cy r rx ry d points transform fill stroke stroke-width stroke-linecap stroke-linejoin opacity fill-opacity stroke-opacity offset stop-color stop-opacity preserveAspectRatio xmlns vector-effect clip-path mask stroke-dasharray stroke-dashoffset text-anchor dominant-baseline colspan rowspan'.split(' '));
  const styleProps = [ 'visibility','direction','writing-mode','color-scheme','background-image','background-size','background-position','background-repeat','border-collapse','border-spacing','table-layout','caption-side','list-style-type','list-style-position','font-variant','font-stretch','word-break','overflow-wrap','text-indent','text-transform','text-overflow','text-shadow','float','clear','align-self','align-content','justify-items','justify-self','column-gap','row-gap','grid-auto-flow','grid-auto-rows','grid-auto-columns','flex-grow','flex-shrink','flex-basis','order','aspect-ratio','max-height','object-position','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-opacity','stroke-opacity','stop-color','stop-opacity','text-anchor','dominant-baseline','display','position','top','right','bottom','left','z-index','box-sizing','color','background-color','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','white-space','width','height','max-width','min-width','min-height','margin','margin-top','margin-right','margin-bottom','margin-left','padding','padding-top','padding-right','padding-bottom','padding-left','border','border-width','border-style','border-color','border-radius','box-shadow','opacity','vertical-align','flex','flex-direction','flex-wrap','align-items','justify-content','gap','grid-template-columns','grid-template-rows','grid-column','grid-row','overflow','text-decoration','object-fit'];
  const rejectTags = new Set('script style iframe frame object embed template link meta base audio video source track noscript foreignobject animate animatetransform set use'.split(' '));
  const stats = {elements:0, omittedImages:0, canvasImages:0, omittedFrames:0, redactedControls:0, externalLinks:0, truncated:false, svg:0};
  const maxNodes = 5000;
  let visited=0, textBytes=0, started=0;
  const omissions=new Set(['不含原始脚本、事件及计算逻辑；能力等级为 static','自定义字体文件未嵌入；离线端可能使用系统回退字体','只捕获当前已挂载 DOM；不保证虚拟列表、未展开或未加载内容完整']);
  function cleanStyle(original, copy) {
    const css=getComputedStyle(original);
    for (const name of styleProps) {
      const value=css.getPropertyValue(name).trim();
      if (value && value.length < 2000 && !/url\s*\(|expression\s*\(|@import|javascript:|data:/i.test(value)) copy.style.setProperty(name,value);
      else if(value && /url\s*\(/i.test(value)) omissions.add('CSS 外部资源已移除');
    }
  }
  function safeClone(node, parentDoc, depth=0) {
    if(++visited>maxNodes || depth>75 || performance.now()-started>3000) throw Error('捕获超过 5000 节点、75 层或 3 秒限制，请缩小区域；没有生成残缺文件');
    if(node.nodeType===Node.TEXT_NODE){textBytes+=(node.nodeValue||'').length;if(textBytes>1000000)throw Error('文本超过 100 万字符限制，请缩小区域');return parentDoc.createTextNode(node.nodeValue||'');}
    if(node.nodeType!==Node.ELEMENT_NODE) return null;
    const source=node;
    const name=source.localName.toLowerCase();
    if (rejectTags.has(name)) {if(name==='iframe')stats.omittedFrames++;omissions.add('不支持的活动内容已移除：'+name);return null;}
    if(source===host)return null;
    if(source.shadowRoot)omissions.add('Shadow DOM 未捕获');
    if(name.includes('-'))omissions.add('自定义元素或封闭 Shadow DOM 无法保证完整');
    for(const pseudo of ['::before','::after']){const content=getComputedStyle(source,pseudo).content;if(content&&content!=='none'&&content!=='normal')omissions.add('CSS 伪元素内容未捕获');}
    if(source.scrollHeight>source.clientHeight+2&&['auto','scroll','hidden'].includes(getComputedStyle(source).overflowY))omissions.add('滚动/裁剪容器仅保存 DOM，滚动位置未恢复');
    const computed=getComputedStyle(source);
    if(computed.display==='none'||computed.visibility==='hidden'||computed.visibility==='collapse')return null;
    if(['input','textarea','select'].includes(name) || source.isContentEditable) {
      stats.redactedControls++;
      omissions.add('输入及可编辑内容已脱敏；滑块/复选框仅显示安全静态状态');
      if(name==='input' && ['range','checkbox','radio'].includes(source.type)) {
        const replacement=parentDoc.createElement('input');replacement.type=source.type;replacement.disabled=true;
        if(source.type==='range')for(const key of ['min','max','step','value'])replacement.setAttribute(key,String(source[key]).slice(0,30));
        else if(source.checked)replacement.setAttribute('checked','');
        cleanStyle(source,replacement);return replacement;
      }
      const replacement=parentDoc.createElement('span');replacement.textContent='[输入内容已脱敏]';cleanStyle(source,replacement);return replacement;
    }
    if(name==='canvas'){
      const pic=parentDoc.createElement('img');
      try { const data=source.toDataURL('image/png');
        if(data.length>3_000_000)throw new Error('too-large');
        pic.setAttribute('src',data);cleanStyle(source,pic);stats.canvasImages++;omissions.add('Canvas 已转为静态 PNG，不含数据和交互');
      }catch {omissions.add('Canvas 无法读取，已省略');return parentDoc.createTextNode('[Canvas 无法安全内嵌]');}
      return pic;
    }
    if(name==='img'){
      const pic=parentDoc.createElement('img');
      const src=source.getAttribute('src')||'';
      if(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(src)&&src.length<3_000_000){pic.setAttribute('src',src);} 
      else {stats.omittedImages++;omissions.add('远程或非安全内嵌图片已省略');return parentDoc.createTextNode(`[图片已省略: ${source.getAttribute('alt')||'远程资源'}]`);}
      pic.setAttribute('alt', source.getAttribute('alt') || '');cleanStyle(source,pic);return pic;
    }
    if(name==='button')omissions.add('按钮仅为静态外观，点击无原始功能');
    const svg = source.namespaceURI==='http://www.w3.org/2000/svg';
    if(!allowedHtml.has(name)&&!(svg&&allowedSvg.has(name)))omissions.add('不支持的标签已降为文本容器：'+name);
    const tag = svg && allowedSvg.has(name) ? source.localName : allowedHtml.has(name) ? name : 'span';
    const target= svg && allowedSvg.has(name) ? parentDoc.createElementNS('http://www.w3.org/2000/svg',tag) : parentDoc.createElement(tag);
    stats.elements++;
    if(svg && name==='svg') {target.setAttribute('xmlns','http://www.w3.org/2000/svg');stats.svg++;}
    for(const attr of source.attributes){
      if(allowedAttributes.has(attr.name) && !/^on/i.test(attr.name) && !/url\s*\(|javascript:|data:/i.test(attr.value) && attr.value.length<(['d','points'].includes(attr.name)?100000:1000)) {
        target.setAttribute(attr.name,attr.value);
      } else if(allowedAttributes.has(attr.name)&&attr.value.length>=100000){throw Error('SVG 属性超过安全大小限制，请缩小区域');
      } else if(/url\s*\(/i.test(attr.value)){omissions.add('SVG 资源引用已省略（含局部渐变/裁剪）');
      } else if((attr.name==='href'||attr.name==='src') && !/^(#|data:)/.test(attr.value)) {stats.externalLinks++;}
    }
    cleanStyle(source,target);
    if(name==='details'&&source.open)target.setAttribute('open','');
    if(name==='button')target.setAttribute('disabled','');
    if(computed.transform!=='none')omissions.add('CSS 变换不保证保留');
    if(computed.animationName!=='none')omissions.add('动画仅捕获当前计算样式，未保留时间轴');
    for(const child of source.childNodes){const cleaned=safeClone(child,parentDoc,depth+1);if(cleaned)target.appendChild(cleaned);}
    return target;
  }
  function escapeHtml(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  
  function mdText(text){return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/[\\`*_{}\[\]()!#|~]/g,'\\$&');}
  function markdown(root){
    const lines=[];
    const inline = n => n.nodeType===3?mdText(n.nodeValue).replace(/\s+/g,' '):
      n.nodeType!==1?'':(['br'].includes(n.localName)?'  \n':(n.localName==='strong'?'**':'')+Array.from(n.childNodes).map(inline).join('')+(n.localName==='strong'?'**':''));
    function walk(n){
      if(n.nodeType===3){const t=mdText(n.nodeValue).trim();if(t)lines.push(t);return;}
      if(n.nodeType!==1)return;
      const tag=n.localName;
      if(/^h[1-6]$/.test(tag)){lines.push('#'.repeat(Number(tag[1]))+' '+inline(n).trim()+'\n');return;}
      if(tag==='pre'){const fence='`'.repeat(Math.max(3,...Array.from(n.textContent.matchAll(/`+/g),m=>m[0].length+1)));lines.push(fence+'\n'+n.textContent.trim()+'\n'+fence+'\n');return;}
      if(tag==='svg'){lines.push('[SVG 图形见 HTML/SVG 导出]');return;}
      if(tag==='table'){
        const rows=Array.from(n.querySelectorAll('tr')).map(r=>Array.from(r.querySelectorAll('th,td')).map(c=>inline(c).trim().replace(/\n/g,' ')));
        if(rows.length){const cols=Math.max(...rows.map(r=>r.length));const fill=r=>Array.from({length:cols},(_,i)=>r[i]||'');lines.push('| '+fill(rows[0]).join(' | ')+' |','| '+fill(rows[0]).map(()=> '---').join(' | ')+' |');for(const row of rows.slice(1))lines.push('| '+fill(row).join(' | ')+' |');lines.push('');}return;
      }
      if(tag==='li'){lines.push('- '+inline(n).trim());return;}
      if(['p','blockquote','figcaption'].includes(tag)){lines.push(inline(n).trim()+'\n');return;}
      if(tag==='input'){lines.push('[静态控件：'+n.type+' '+(n.type==='range'?n.value:n.checked?'已选':'未选')+']');return;}
      if(tag==='img'){lines.push('[图片见 HTML 导出]');return;}
      for(const child of n.childNodes)walk(child);
    }
    walk(root);
    return lines.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
  }
  function choose(e){
    if(e.composedPath().includes(host))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(busy)return;
    if(!locked)point(e);
    if(last){locked=true;draw();}
  }
  async function capture(){
    if(!last||busy)return;
    busy=true;
    shadow.getElementById('error').textContent='捕获中…';
    status('捕获中…');
    try {
      if(!last.isConnected)throw Error('所选区域已被页面移除，请取消并重新选择');
      const selected=last, rect=selected.getBoundingClientRect();
      if(rect.width<1||rect.height<1)throw Error('区域没有可见尺寸，请重新选择');
      if(rect.width>12000||rect.height>12000)throw Error('区域尺寸超过 12000 px，请缩小区域');
      started=performance.now();visited=0;textBytes=0;for(const key of Object.keys(stats))stats[key]=key==='truncated'?false:0;
      const safeDoc=document.implementation.createHTMLDocument('Snapshot');
      const cloned=safeClone(selected,safeDoc);
      if(!cloned)throw Error('这个区域没有可以导出的可见内容');
      cloned.style.margin='0';
      // Root placement is independent of its original ancestors, dimensions remain fixed.
      cloned.style.position='relative';for(const side of ['top','right','bottom','left'])cloned.style[side]='auto';
      if(getComputedStyle(selected).display==='inline')cloned.style.display='inline-block';
      cloned.style.boxSizing='border-box';cloned.style.width=rect.width+'px';cloned.style.height=rect.height+'px';
      const title='UI snapshot';
      const capturedAt=new Date().toISOString();
      const dimensions={width:Math.ceil(rect.width),height:Math.ceil(rect.height)};
      let background='transparent';
      for(let node=selected;node;node=node.parentElement){const c=getComputedStyle(node).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent'){background=c;break;}}
      if(background==='transparent')background=matchMedia('(prefers-color-scheme: dark)').matches?'#202124':'#fff';
      const fragment=cloned.outerHTML||escapeHtml(cloned.textContent);
      const report={schemaVersion:'0.2.0',kind:'static-snapshot',capability:'static',capturedAt,origin:location.origin,dimensions,limitations:['不是原始交互的无损复制'],stats,omissions:[...omissions],html:fragment,text:cloned.textContent};
      const md='<!-- capability: static; 不含原始交互；遗漏：'+escapeHtml(report.omissions.join('；'))+' -->\n'+markdown(cloned);
      const csp="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'";
      const metadata=escapeHtml(JSON.stringify({capability:'static',omissions:report.omissions}));
      const page=`<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="ui-portability-report" content="${metadata}"><title>${title} · static</title><style>html,body{margin:0;padding:0;background:${background}}body{width:${dimensions.width}px}</style></head><body>${fragment}</body></html>`;
      const svgRoot=cloned.cloneNode(true);
      if(svgRoot.namespaceURI==='http://www.w3.org/2000/svg'&&svgRoot.localName==='svg'){const meta=safeDoc.createElementNS('http://www.w3.org/2000/svg','metadata');meta.textContent=JSON.stringify({capability:'static',omissions:report.omissions});svgRoot.prepend(meta);}
      const svg=cloned.namespaceURI==='http://www.w3.org/2000/svg'&&cloned.localName==='svg'?new XMLSerializer().serializeToString(svgRoot):null;
      if(format==='svg'&&!svg)throw Error('SVG 格式只能选择 SVG 根元素。请移动到图形后锁定，或改用 HTML。');
      if(!globalThis.chrome?.runtime?.id)throw Error('请通过已安装扩展的 Popup 启动捕获；当前不在扩展上下文');
      const response=await chrome.runtime.sendMessage({type:'capture',payload:{report,page,md,svg,format}});
      if(response?.error)throw Error(response.error);
      cleanup();
    }catch(err){
      status('捕获失败：'+String(err.message||err));
      shadow.getElementById('error').textContent='捕获失败：'+String(err.message||err)+'。可重选后再试。';
    }finally{busy=false;}
  }
  window.addEventListener('pointermove',point,true);
  window.addEventListener('click',choose,true);
  window.addEventListener('keydown',key,true);
  window.addEventListener('scroll',draw,true);window.addEventListener('resize',draw);
  status('正在选择 · 单击锁定，↑ 扩大，Enter 预览，Esc 取消');
})();
