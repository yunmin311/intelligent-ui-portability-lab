import {nodes,validateBehaviors} from '../core/interactions.js';
import {sourceAdapter} from '../core/sources.js';
import {detectCandidates,componentRoles,extractCandidate,prevalidateCandidate} from './adapters.js';
import {allowedHtml,allowedSvg,allowedMath,allowedAttributes,styleProps,rejectTags,SVG,MATH,safeCss,localReference,inheritedStyleProps} from '../core/policy.js';
import {validateSnapshot,sha256,LIMITS,VERSION} from '../core/ir.js';
export async function captureElement(selected,{signal,exclude,onProgress=()=>{},source={type:'page',origin:location.origin},method='sanitized-dom',controlled=false}={}){
 if(!selected?.isConnected)throw Error('所选区域已被页面移除');
 const rect=selected.getBoundingClientRect();if(rect.width<1||rect.height<1||rect.width>LIMITS.dimension||rect.height>LIMITS.dimension)throw Error('区域尺寸须在 1–100000 px 之间');
 const captured=new WeakMap();
 const contract=sourceAdapter(location.href,{controlled,file:method!=='sanitized-dom'});
 const originallyHidden=new Set(),controlledPanels=new Set();
 let visited=0,textSize=0,resourceSize=0;const resources=[],ids=new Map(),ambiguousIDs=new Set();
 const stats={elements:0,omittedImages:0,canvasImages:0,omittedFrames:0,redactedControls:0,externalLinks:0,truncated:false,svg:0};
 const omissions=new Set(['未保存来源脚本和事件；可恢复的原生行为与自有 recipe 以交互报告为准','自定义字体文件未嵌入；离线端可能使用系统回退字体','只捕获当前已挂载 DOM；不保证虚拟列表、未展开或未加载内容完整','正文和 Canvas 中的敏感信息不能自动识别，请下载前检查']);
 // Bound preflight BEFORE style traversal; do not confuse cooperative yielding with a hard timeout.
 const scan=[{node:selected,depth:0}];let seen=0;
 while(scan.length){const {node,depth}=scan.pop();if(++seen>5000||depth>75)throw Error('捕获超过 5000 节点或 75 层，请缩小区域');if(node.nodeType===1&&node.id){if(ids.has(node.id))ambiguousIDs.add(node.id);else ids.set(node.id,'uip-'+ids.size);}signal?.throwIfAborted();const enqueue=child=>{if(seen+scan.length>=5000)throw Error('捕获超过 5000 节点或 75 层，请缩小区域');scan.push({node:child,depth:depth+1});};if(node.childNodes)for(const child of node.childNodes)enqueue(child);if(node.shadowRoot)enqueue(node.shadowRoot);if(seen%64===0){await new Promise(r=>setTimeout(r,0));signal?.throwIfAborted();}}

 for(const id of ambiguousIDs)ids.delete(id);if(ambiguousIDs.size)omissions.add('重复来源 ID 的标识与引用已移除，避免绑定到错误节点');
 signal?.throwIfAborted();
 const detected=detectCandidates(selected,contract);if(detected.length>20)throw Error('组件候选超过 20 个，请缩小区域');
 const candidates=[];for(const c of detected){try{candidates.push(prevalidateCandidate(c,contract.evidence));}catch(error){omissions.add(`组件 ${c.recipe} 静态降级（预验证）：${error.message}`);}}
 const controlledNumbers=new Set(candidates.filter(c=>c.recipe==='calculator@1').flatMap(c=>[...(componentRoles(c.root).get('left')||[]),...(componentRoles(c.root).get('right')||[])]));
 signal?.throwIfAborted();
 function cssValue(value){if(/url\s*\(/i.test(value)){const match=value.match(/^url\(["']?(?:[^#"')]*#)([^"')]+)["']?\)$/);if(match&&ids.has(match[1]))return `url(#${ids.get(match[1])})`;omissions.add('CSS/SVG 外部或缺失资源引用已移除');return null;}return safeCss(value)?value:null;}
 // MathML layout is font-metric driven; pinned box sizes would flatten fractions
 // and radicals once the offline machine's math font differs from the capturer's.
 const mathLayoutSkip=new Set(['width','height','min-width','min-height','max-width','max-height','margin','margin-top','margin-right','margin-bottom','margin-left','padding','padding-top','padding-right','padding-bottom','padding-left','line-height','vertical-align']);
 const sideNone=(css,name)=>{const m=name.match(/^border-(top|right|bottom|left)-(width|style|color)$/);return !!m&&css.getPropertyValue('border-'+m[1]+'-style')==='none';};
 function styles(css,inherited={},skip){const out={};for(const name of styleProps){if(skip?.has(name)||sideNone(css,name))continue;const v=css.getPropertyValue(name).trim();const safe=cssValue(v);if(v&&safe){// Explicit inherit still overrides UA rules and SVG presentation attributes.
 if(inheritedStyleProps.has(name)&&Object.hasOwn(inherited,name)&&inherited[name]===v)out[name]='inherit';else out[name]=safe;}}return out;}
 async function resource(data,mime){if(data.length>LIMITS.resource||(resourceSize+=data.length)>2500000)throw Error('内嵌资源超过安全大小限制');const raw=Uint8Array.from(atob(data),c=>c.charCodeAt(0));const r={id:'r'+resources.length,mime,data,sha256:await sha256(raw),status:'captured'};resources.push(r);return r.id;}
 function node(tag='span',ns='html'){return {tag,ns,attrs:{},style:{},children:[],evidence:{status:'captured',method:'computed-dom'}};}
 // Inactive branches are never revealed in the source DOM: no MutationObserver,
 // toggle, layout or page-business side effects are triggered during capture.
 async function clone(original,depth=0,inherited={}){
 if(++visited>5000||depth>75)throw Error('捕获超过 5000 节点或 75 层');if(visited%16===0){onProgress(visited);await new Promise(r=>setTimeout(r,0));}signal?.throwIfAborted();
 if(original.nodeType===3){const text=original.nodeValue||'';textSize+=text.length;if(textSize>1000000)throw Error('文本超过 100 万字符限制');return {text};}if(original.nodeType!==1||original===exclude)return null;
 const name=original.localName.toLowerCase();if(rejectTags.has(name)){if(name==='iframe')stats.omittedFrames++;omissions.add('不支持的活动内容已移除：'+name);return null;}
 const css=getComputedStyle(original);if(css.display==='none'&&!originallyHidden.has(original)||['hidden','collapse'].includes(css.visibility))return null;
 const ns=original.namespaceURI===SVG?'svg':original.namespaceURI===MATH?'math':'html';
 let target=node();captured.set(original,target);target.style=styles(css,inherited,ns==='math'?mathLayoutSkip:undefined);if(originallyHidden.has(original)&&target.style.display==='none')delete target.style.display;stats.elements++;
 const childInherited={...inherited};for(const k in target.style)if(inheritedStyleProps.has(k))childInherited[k]=css.getPropertyValue(k).trim();
 if(controlledPanels.has(original)){
  // Typed OM preserves authored auto without replacing deliberate fixed panel heights.
  try{const authored=original.computedStyleMap?.().get('height');if(authored?.toString()==='auto')target.style.height='auto';else if(!authored)omissions.add('当前浏览器无法确认面板自然高度，保留捕获尺寸');}catch{omissions.add('当前浏览器无法确认面板自然高度，保留捕获尺寸');}
 }
 if(['input','textarea','select'].includes(name)||original.isContentEditable){stats.redactedControls++;target.evidence={status:'unsupported',method:'redacted'};omissions.add('输入及可编辑内容已脱敏；未知控件仅显示安全静态状态');if(name==='input'&&(['range','checkbox','radio'].includes(original.type)||original.type==='number'&&controlledNumbers.has(original))){target.tag='input';target.component='control';target.attrs={type:original.type,disabled:''};if(['range','number'].includes(original.type))for(const k of ['min','max','step','value'])target.attrs[k]=String(original[k]).slice(0,30);else if(original.checked)target.attrs.checked='';}else target.children=[{text:'[输入内容已脱敏]'}];return target;}
 if(name==='canvas'){
  if(original.width*original.height>1000000||original.width>4096||original.height>4096){omissions.add('Canvas 超过 100 万像素，已省略');return {...target,children:[{text:'[Canvas 超过安全像素限制]'}]};}
  try{const blob=await new Promise(resolve=>original.toBlob(resolve,'image/png'));signal?.throwIfAborted();if(!blob||blob.size>1400000)throw Error('Canvas too large');const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});target.tag='img';target.evidence={status:'captured',method:'rasterized'};target.resourceId=await resource(data,'image/png');stats.canvasImages++;omissions.add('Canvas 已转为静态 PNG，不含数据和交互');return target;}catch(e){if(signal?.aborted)throw e;omissions.add('Canvas 无法读取，已省略');target.children=[{text:'[Canvas 无法安全内嵌]'}];return target;}
 }
 if(name==='img'){const src=original.getAttribute('src')||'';const m=src.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i);if(m){target.tag='img';target.attrs.alt=(original.getAttribute('alt')||'').slice(0,1000);target.resourceId=await resource(m[2],m[1].toLowerCase());}else{stats.omittedImages++;omissions.add('远程或非安全内嵌图片已省略');target.evidence={status:'unsupported',method:'placeholder'};target.children=[{text:'[图片已省略]'}];}return target;}
 const supported=ns==='svg'?allowedSvg.has(name):ns==='math'?allowedMath.has(name):allowedHtml.has(name);
 if(supported){target.tag=ns==='svg'?original.localName:name;target.ns=ns;}else{target.evidence={status:'unsupported',method:'placeholder'};omissions.add('不支持的标签已降为文本容器：'+name);}
 target.component=ns==='svg'?'graphic':ns==='math'?'formula':name==='table'?'table':'container';if(name==='svg')stats.svg++;
 if(original.id&&ids.has(original.id))target.attrs.id=ids.get(original.id);
 if(originallyHidden.has(original))target.attrs.hidden='';
 const finiteAttributes={role:['tab','tabpanel','tablist'],'aria-selected':['true','false'],'aria-hidden':['true','false'],tabindex:['0','-1']};
 for(const [key,allowed] of Object.entries(finiteAttributes)){const value=original.getAttribute(key);if(allowed.includes(value))target.attrs[key]=value;}
 for(const key of ['aria-controls','aria-labelledby']){const value=original.getAttribute(key);if(value&&ids.has(value))target.attrs[key]=ids.get(value);}
 for(const attr of original.attributes){if(['role','aria-selected','aria-hidden','tabindex','hidden','aria-controls','aria-labelledby'].includes(attr.name))continue;if(allowedAttributes.has(attr.name)||['gradientUnits','gradientTransform','clipPathUnits','maskUnits','patternUnits'].includes(attr.name)){if(attr.value.length>=(['d','points'].includes(attr.name)?100000:1000))throw Error('SVG 属性超过安全大小限制');const v=['d','points'].includes(attr.name)&&!/url\s*\(|javascript:|data:|[<>\\@]/i.test(attr.value)?attr.value:cssValue(attr.value);if(v&&!/[<>]/.test(v))target.attrs[attr.name]=v;}else if(['href','src'].includes(attr.name))stats.externalLinks++;}
 if(original.hasAttribute('colspan')||original.hasAttribute('rowspan'))omissions.add('Markdown 合并单元格保留为安全 HTML 表格；纯 Markdown 阅读器可能不渲染，视觉以 HTML 为准');
 if(name==='details'&&original.open)target.attrs.open='';if(name==='button'){target.attrs.disabled='';omissions.add('不恢复来源按钮事件；仅明确列出的自有 recipe 可以启用');}
 if(css.animationName!=='none')omissions.add('动画仅捕获当前计算样式，未保留时间轴');
 const children=original.shadowRoot?.childNodes||original.childNodes;if(original.shadowRoot){target.evidence={status:'captured',method:'flattened-shadow'};}if(original.shadowRoot)omissions.add('开放 Shadow DOM 已展开为静态节点；slot 分发和封闭 Shadow DOM 不保证完整');else if(name.includes('-'))omissions.add('封闭 Shadow DOM 或自定义组件内部不可确认');
 const pseudos=[];
 for(const pseudo of ['::before','::after']){const p=getComputedStyle(original,pseudo);if(p.content&&p.content!=='none'&&p.content!=='normal'){
 try{const content=JSON.parse(p.content);if(typeof content!=='string')throw Error();const replacement=node('span');replacement.evidence={status:'captured',method:'generated-pseudo'};replacement.style=styles(p,childInherited);replacement.children=[{text:content}];pseudos.push([pseudo,replacement]);}catch{omissions.add('复杂 CSS 伪元素（计数器/图像/多段内容）未捕获');}}}
 if(pseudos.find(x=>x[0]==='::before'))target.children.push(pseudos.find(x=>x[0]==='::before')[1]);
 // Read mounted descendants without toggling source details: toggle handlers may mutate or fetch.
 for(const c of children){const out=await clone(c,depth+1,childInherited);if(out)target.children.push(out);}
 if(pseudos.find(x=>x[0]==='::after'))target.children.push(pseudos.find(x=>x[0]==='::after')[1]);
 if(original.scrollTop||original.scrollLeft){target.state={scrollTop:original.scrollTop,scrollLeft:original.scrollLeft};const wrapper=node('div');wrapper.evidence={status:'captured',method:'scroll-flattened'};for(const k of ['display','flex-direction','flex-wrap','align-items','justify-content','gap','grid-template-columns','grid-template-rows','column-gap','row-gap'])if(target.style[k])wrapper.style[k]=target.style[k];wrapper.style.width=(original.scrollWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight))+'px';wrapper.style.height=(original.scrollHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom))+'px';wrapper.style.transform=`translate(${-original.scrollLeft}px, ${-original.scrollTop}px)`;wrapper.style['transform-origin']='0px 0px';wrapper.children=target.children;target.children=[wrapper];target.style.display='block';target.style.overflow='hidden';omissions.add('滚动当前偏移已静态展开；后续滚动和粘性定位不恢复');}
 return target;
 }
 // Only an explicitly controlled contract permits mounted inactive model content.
 for(const c of candidates){if(['tabs@1','state@1'].includes(c.recipe))for(const el of componentRoles(c.root).get('panel')||[])controlledPanels.add(el);if(!['table@1','tabs@1','state@1'].includes(c.recipe))continue;for(const el of c.root.querySelectorAll(c.recipe==='table@1'?'tr[hidden]':'[data-uip-role="panel"][hidden]')){if(el.closest('[data-uip-recipe]')!==c.root)continue;originallyHidden.add(el);}}
 const treeCaptured=await clone(selected);let tree=treeCaptured;if(!tree)throw Error('这个区域没有可以导出的可见内容');
 const rootCss=getComputedStyle(selected),rootWidth=rootCss.transform==='none'?rect.width:(selected.offsetWidth||rect.width),rootHeight=rootCss.transform==='none'?rect.height:(selected.offsetHeight||rect.height);
 Object.assign(tree.style,{'margin':'0','position':'relative','top':'auto','right':'auto','bottom':'auto','left':'auto','box-sizing':'border-box','width':rootWidth+'px','height':rootHeight+'px'});if(rootCss.display==='inline')tree.style.display='inline-block';
 if(rootCss.transform!=='none'){
 const matrix=new DOMMatrix(rootCss.transform);
 if(matrix.is2D&&selected.offsetWidth){const [ox,oy]=rootCss.transformOrigin.split(' ').map(parseFloat);const corners=[[0,0],[rootWidth,0],[0,rootHeight],[rootWidth,rootHeight]].map(([x,y])=>({x:matrix.a*(x-ox)+matrix.c*(y-oy)+ox+matrix.e,y:matrix.b*(x-ox)+matrix.d*(y-oy)+oy+matrix.f}));const minX=Math.min(...corners.map(p=>p.x)),minY=Math.min(...corners.map(p=>p.y));tree.style.transform=`matrix(${matrix.a},${matrix.b},${matrix.c},${matrix.d},${matrix.e+ox-matrix.a*ox-matrix.c*oy-minX},${matrix.f+oy-matrix.b*ox-matrix.d*oy-minY})`;tree.style['transform-origin']='0px 0px';const wrapper=node('div');wrapper.style={width:rect.width+'px',height:rect.height+'px',overflow:'hidden'};wrapper.children=[tree];tree=wrapper;}
 else{tree.style.transform='none';omissions.add('根节点 3D/SVG 变换未复原，已降级为未变换布局');}
 }

 let background='transparent';for(let el=selected;el;el=el.parentElement){const c=getComputedStyle(el).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'&&c!=='transparent'){background=c;break;}}if(background==='transparent')background=matchMedia('(prefers-color-scheme: dark)').matches?'#202124':'#fff';
 const behaviors=[],paths=new Map([...nodes(tree)].map(([p,n])=>[n,p]));
 for(const candidate of candidates){try{const behavior=extractCandidate(candidate,captured,paths,contract.evidence);validateBehaviors({tree,behaviors:[...behaviors,behavior]});behaviors.push(behavior);}catch(error){
 // Source can mutate across cooperative yields. Discard the entire privileged
 // capture and redo default redaction, rather than retaining prevalidated data.
 const fallback=await captureElement(selected,{signal,exclude,onProgress,source,method,controlled:false});fallback.omissions.push(`组件 ${candidate.recipe} 捕获期间改变，已重新按默认脱敏捕获：${error.message}`);return validateSnapshot(fallback);}}
 const s={schemaVersion:VERSION,behaviors,kind:'ui-portability-snapshot',capability:'static',createdAt:new Date().toISOString(),source,dimensions:{width:Math.ceil(rect.width),height:Math.ceil(rect.height)},background,tree,resources,provenance:{method,status:'captured'},stats,omissions:[...omissions],limitations:['不是原始交互的无损复制','固定尺寸静态布局；不保证完整响应式规则'],security:{redacted:true,remoteResources:false,scripts:false}};
 return validateSnapshot(s);
}
