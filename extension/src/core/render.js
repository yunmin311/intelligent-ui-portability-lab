import {bindingPaths} from './adapters.js';
import {tableOrder} from './recipes.js';
import {analyze,exportPolicy,nodes,tableRows} from './interactions.js';
import {runtimeSource,runtimeHash} from './runtime-source.js';
import {validateSnapshot,serialize,diagnostic} from './ir.js';
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const csp="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'";
export function fragment(s,{strategy='static'}={}){validateSnapshot(s);const resources=new Map(s.resources.map(r=>[r.id,r]));
 const active=strategy!=='static',analysis=analyze(s,strategy);const hiddenRows=new Set();const treeMap=nodes(s.tree);for(const b of s.behaviors||[]){if(b.recipe==='table@1'){const body=treeMap.get(b.bindings.body),visible=new Set(tableOrder(tableRows(body),b.state));body.children.forEach((_,i)=>{if(!visible.has(i))hiddenRows.add(b.bindings.body+'.'+i);});}}const bindings=new Set(active?(s.behaviors||[]).flatMap(b=>bindingPaths(b.bindings)):[]);
 function render(n,path='0'){if(Object.hasOwn(n,'text'))return escape(n.text);
 const r=resources.get(n.resourceId);const attrs={...n.attrs};if(hiddenRows.has(path))attrs.hidden='';if(bindings.has(path))attrs['data-uip-node']=path;if(n.tag==='details'&&!active)attrs.inert='';if(r)attrs.src=`data:${r.mime};base64,${r.data}`;
 if(n.ns==='svg'&&n.tag==='svg')attrs.xmlns='http://www.w3.org/2000/svg';if(n.ns==='math'&&n.tag==='math')attrs.xmlns='http://www.w3.org/1998/Math/MathML';
 const style={...n.style};
 const recipeAncestor=(s.behaviors||[]).some(b=>b.bindings.root===path||b.bindings.root.startsWith(path+'.'));
 const nativeAncestor=active&&analysis.components.some(c=>c.recipe==='native-details@1'&&(c.path===path||c.path.startsWith(path+'.')));
 // Resolved grid tracks freeze the old height even when height is auto.
 if(active&&recipeAncestor||nativeAncestor){style.height='auto';if(style.display==='grid')style['grid-template-rows']='none';}
 if(active&&(s.behaviors||[]).some(b=>b.recipe==='table@1'&&path.startsWith(b.bindings.root+'.')&&['table','tbody','tr','td','th'].includes(n.tag)))style.height='auto';

 const css=Object.entries(style).map(([k,v])=>`${k}:${v}`).join(';');
 const tag=`<${n.tag}${Object.entries(attrs).map(([k,v])=>` ${k}="${escape(v)}"`).join('')}${css?` style="${escape(css)}"`:''}>`;
 return tag+(['img','input','br','hr'].includes(n.tag)?'':n.children.map((c,i)=>render(c,path+'.'+i)).join('')+`</${n.tag}>`);
 }return render(s.tree);
}
const firstHeading=s=>{const walk=n=>{if(Object.hasOwn(n,'text'))return null;if(/^h[1-4]$/.test(n.tag)){const t=n.children.map(c=>c.text??walk(c)).filter(Boolean).join('').replace(/\s+/g,' ').trim();if(t)return t.slice(0,80);}for(const c of n.children||[]){const r=walk(c);if(r)return r;}return null;};return walk(s.tree);};
export function html(s,{strategy='auto',confirmDegradation=false}={}){const analysis=exportPolicy(s,{strategy,confirmDegradation}),body=fragment(s,{strategy}),behaviors=strategy==='static'?[]:(s.behaviors||[]);const script=behaviors.length?`<script>${runtimeSource}</script>`:'';const policy=csp+(script?`; script-src 'sha256-${runtimeHash}'`:"; script-src 'none'");const title=firstHeading(s)||'界面快照';return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="ui-portability-report" content="${escape(JSON.stringify({...diagnostic(s),interaction:analysis}))}"><meta name="uip-interactions" content="${escape(JSON.stringify(behaviors))}"><title>${escape(title)}</title><style>html,body{margin:0;padding:0;background:${s.background}}body{width:${s.dimensions.width}px}[inert]{pointer-events:none}[hidden]{display:none!important}</style></head><body>${body}${script}</body></html>`;}
export function svg(s){validateSnapshot(s);if(s.tree.ns!=='svg'||s.tree.tag!=='svg')return null;const body=fragment(s);return body.replace(/(<svg[^>]*>)/,`$1<metadata>${escape(JSON.stringify(diagnostic(s)))}</metadata>`);}
const mdText=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/[\\`*_{}\[\]()!#|~]/g,'\\$&');
export function markdown(s,{archive=false}={}){validateSnapshot(s);const {behaviors:_behaviors,...staticSnapshot}=s;const lines=[];
 const text=n=>n.text??n.children.map(text).join('');
 const imageMarker=n=>archive&&n.resourceId?`![本地图片](resources/${n.resourceId}.${extension(s.resources.find(r=>r.id===n.resourceId).mime)})`:'[图片见 HTML 导出]';
 const inline=(n,tableCell=false)=>{
  if(n.tag==='img')return imageMarker(n);
  if(n.tag==='svg'||n.tag==='math')return `[${n.tag}见 HTML 导出]`;
  if(n.tag==='input')return '[静态控件]';
  if(n.text!==undefined)return mdText(n.text).replace(/\s+/g,' ');
  if(n.tag==='br')return '  \n';
  if(n.tag==='code'){const raw=text(n).replace(/\n/g,' '),content=tableCell?raw.replace(/\|/g,'\\|'):raw,fence='`'.repeat(Math.max(1,...[...content.matchAll(/`+/g)].map(m=>m[0].length+1)));const pad=content.startsWith('`')||content.endsWith('`')||(/^ .* $/s.test(content)&&/\S/.test(content))?' ':'';return fence+pad+content+pad+fence;}
  const marker=n.tag==='strong'?'**':['em','i'].includes(n.tag)?'*':'';
  const body=n.children.map(c=>inline(c,tableCell)).join('');return ['sub','sup'].includes(n.tag)?`<${n.tag}>${body}</${n.tag}>`:marker+body+marker;
 };
 const descendants=(n,tag)=>n.children?.flatMap(c=>c.tag===tag?[c]:descendants(c,tag))||[];
 function walk(n){if(n.text!==undefined){const t=mdText(n.text).trim();if(t)lines.push(t);return;}
 const tag=n.tag;
 if(/^h[1-6]$/.test(tag)){lines.push('#'.repeat(Number(tag[1]))+' '+inline(n).trim()+'\n');return;}
 if(tag==='pre'){const fence='`'.repeat(Math.max(3,...[...text(n).matchAll(/`+/g)].map(m=>m[0].length+1)));lines.push(fence+'\n'+text(n)+'\n'+fence+'\n');return;}
 if(tag==='svg'||tag==='math'){lines.push(`[${tag==='svg'?'SVG 图形':'MathML 公式'}见 HTML${archive?'：index.html':''} 导出]`);return;}
 if(tag==='table'){if(descendants(n,'th').concat(descendants(n,'td')).some(c=>Number(c.attrs.colspan||1)>1||Number(c.attrs.rowspan||1)>1)){lines.push(fragment({...staticSnapshot,tree:n},{strategy:'static'})+'\n');return;}const rows=descendants(n,'tr').map(r=>r.children.filter(c=>['td','th'].includes(c.tag)).map(c=>inline(c,true).trim().replace(/\n/g,' ')));if(rows.length){const cols=Math.max(...rows.map(r=>r.length));const fill=r=>Array.from({length:cols},(_,i)=>r[i]||'');lines.push('| '+fill(rows[0]).join(' | ')+' |','| '+fill(rows[0]).map(()=> '---').join(' | ')+' |');rows.slice(1).forEach(r=>lines.push('| '+fill(r).join(' | ')+' |'));lines.push('');}return;}
 if(tag==='ol'||tag==='ul'){
  const integer=(v,fallback)=>v!==undefined&&/^-?\d+$/.test(v)&&Number.isSafeInteger(Number(v))?Number(v):fallback;let number=integer(n.attrs.start,1);
  // CommonMark ignores later markers and accepts only nonnegative, at most nine digit markers.
  if(tag==='ol'){let expected=number;const unsafe=number<0||number>999999999||n.children.filter(c=>c.tag==='li').some(c=>{const actual=integer(c.attrs.value,expected);const changed=actual!==expected||actual<0||actual>999999999;expected=actual+1;return changed;});if(unsafe){lines.push(fragment({...staticSnapshot,tree:n},{strategy:'static'})+'\n');return;}}
  for(const child of n.children){if(child.tag!=='li')continue;number=integer(child.attrs.value,number);const marker=tag==='ol'?String(number++)+'. ':'- ';
   // Render every item as a block, then indent all continuation lines by the marker width.
   const blocks=[];let run=[];const flush=()=>{if(run.length){blocks.push({tag:'p',ns:'html',attrs:{},style:{},children:run});run=[];}};for(const c of child.children){if(c.tag&&/^(p|div|ol|ul|pre|table|blockquote|h[1-6])$/.test(c.tag)){flush();blocks.push(c);}else run.push(c);}flush();
   const inner=markdown({...staticSnapshot,tree:{tag:'div',ns:'html',attrs:{},style:{},children:blocks}} ,{archive}).replace(/^<!--[^\n]*-->\n/,'').trimEnd();
   const parts=inner.split('\n');lines.push(marker+(parts.shift()||''),...parts.map(line=>line?' '.repeat(marker.length)+line:''));
  }lines.push('');return;
 }
 if(tag==='blockquote'){const inner=markdown({...staticSnapshot,tree:{...n,tag:'div'}},{archive}).replace(/^<!--[^\n]*-->\n/,'').trimEnd();lines.push(inner.split('\n').map(line=>'> '+line).join('\n')+'\n');return;}
 if(tag==='li'){lines.push('- '+inline(n).trim());return;}if(['p','figcaption'].includes(tag)){lines.push(inline(n).trim()+'\n');return;}
 if(tag==='input'){lines.push('[静态控件：'+n.attrs.type+' '+(n.attrs.type==='range'?n.attrs.value:Object.hasOwn(n.attrs,'checked')?'已选':'未选')+']');return;}
 if(tag==='img'){lines.push(imageMarker(n));return;}n.children.forEach(walk);
 }walk(s.tree);return `<!-- capability: ${s.capability}; 不含原始交互 -->\n`+lines.join('\n').trim()+'\n';}
export const extension=mime=>({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[mime]);
export function render(s,format,options={}){if(format==='json')return serialize(s);if(format==='html')return html(s,options);if(format==='md')return markdown(s);if(format==='svg'){const out=svg(s);if(!out)throw Error('SVG 格式只能选择 SVG 根元素');return out;}throw Error('不支持的格式');}
