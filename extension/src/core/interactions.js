import {fourierPath,tableOrder} from './recipes.js';
import {getAdapter,bindingPaths,sumValue} from './adapters.js';
export {getAdapter,bindingPaths} from './adapters.js';
export {ownedFixtureURL as trustFixtureURL} from './sources.js';
export function nodes(tree){const map=new Map();function walk(n,path){map.set(path,n);n.children?.forEach((c,i)=>walk(c,path+'.'+i));}walk(tree,'0');return map;}
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const text=n=>n.text??n.children.map(text).join('');
export function tableRows(n){if(n.tag!=='tbody'||n.children.length>200||n.children.some(r=>r.tag!=='tr'||r.children.length!==2||r.children.some(c=>c.tag!=='td')))throw Error('表格结构不匹配');return n.children.map(r=>r.children.map(text));}
function validateLegacyBehaviors(s){
 const bs=s.behaviors||[];if(!Array.isArray(bs)||bs.length>20)throw Error('交互数量超限');const map=nodes(s.tree),used=new Set();
 for(const b of bs){if(!exact(b,['recipe','bindings','state','evidence'])||!['fixture-equivalence-v1','model-validated-v1'].includes(b.evidence))throw Error('交互证据字段不合法');
 const keys=b.recipe==='fourier@1'?['root','harmonics','amplitude','phase','curve','output']:b.recipe==='table@1'?['root','filter','sort','body','output']:null;if(!keys||!exact(b.bindings,keys))throw Error('交互 recipe 不支持');
 if(new Set(Object.values(b.bindings)).size!==keys.length)throw Error('交互绑定重复');
 for(const root of used){if(root===b.bindings.root||root.startsWith(b.bindings.root+'.')||b.bindings.root.startsWith(root+'.'))throw Error('组件绑定范围重叠');}
 const refs={};for(const k of keys){const path=b.bindings[k];if(typeof path!=='string'||!/^0(?:\.\d{1,4}){0,75}$/.test(path)||!map.has(path)||used.has(path))throw Error('交互绑定不合法');if(k!=='root'&&!path.startsWith(b.bindings.root+'.'))throw Error('绑定超出组件');refs[k]=map.get(path);used.add(path);}
 if(refs.root.ns!=='html'||!['section','div','article'].includes(refs.root.tag)||refs.output.tag!=='output'||refs.output.ns!=='html')throw Error('组件结构不匹配');
 // Finite recipes require parser-stable topology, not merely paths within a root.
 const parentPath=p=>p.slice(0,p.lastIndexOf('.')),parent=k=>map.get(parentPath(b.bindings[k]));
 for(let p=parentPath(b.bindings.root);p;p=parentPath(p)){const n=map.get(p);if(n?.ns!=='html'||!['main','section','div','article','aside','header','figure','details'].includes(n.tag))throw Error('组件祖先结构不匹配');}
 const safeWrappers=new Set(['div','section','header','label','ul','ol','li']);
 const belowRoot=p=>{for(let q=p;q!==b.bindings.root;q=parentPath(q)){if(!q||!map.has(q)||map.get(q).ns!=='html'||!safeWrappers.has(map.get(q).tag))return false;}return true;};
 const direct=k=>belowRoot(parentPath(b.bindings[k]));
 const plain=n=>n.children.every(c=>Object.hasOwn(c,'text'));
 if(!direct('output')||!plain(refs.output))throw Error('输出结构不匹配');
 const controlPosition=k=>direct(k)||(parent(k)?.tag==='label'&&parent(k)?.ns==='html'&&parentPath(parentPath(b.bindings[k]))===b.bindings.root);
 if(b.recipe==='fourier@1'){
  if(!['harmonics','amplitude','phase'].every(controlPosition)||parent('curve')?.tag!=='svg'||parent('curve')?.ns!=='svg'||!belowRoot(parentPath(parentPath(b.bindings.curve))))throw Error('Fourier 结构不匹配');
 }else if(!controlPosition('filter')||!direct('sort')||!plain(refs.sort)||refs.body.ns!=='html'||parent('body')?.tag!=='table'||parent('body')?.ns!=='html'||!belowRoot(parentPath(parentPath(b.bindings.body))))throw Error('表格结构不匹配');
 // Accept only a finite parser-stable component grammar. Unknown layouts stay static.
 const isText=n=>Object.hasOwn(n,'text');
 const labels=new Set(keys.filter(k=>['harmonics','amplitude','phase','filter'].includes(k)).map(k=>parent(k)).filter(n=>n?.tag==='label'));
 const controls=new Set(keys.filter(k=>['harmonics','amplitude','phase','filter'].includes(k)).map(k=>refs[k]));
 for(const label of labels)if(!label.children.every(n=>isText(n)||controls.has(n)))throw Error('标签结构不匹配');
 const graphic=b.recipe==='fourier@1'?parent('curve'):parent('body');
 const allowedRoot=new Set([...controls,...labels,refs.output,graphic,...(refs.sort?[refs.sort]:[])]);
 const safeChild=n=>isText(n)||allowedRoot.has(n)||(n.ns==='html'&&['h1','h2','h3','h4','p','button'].includes(n.tag)&&plain(n))||(n.ns==='html'&&safeWrappers.has(n.tag)&&n.children.every(safeChild));
 if(!refs.root.children.every(safeChild))throw Error('组件子节点结构不匹配');
 if(b.recipe==='fourier@1'){
  const svgTags=new Set(['svg','g','path','rect','circle','line','polyline','polygon','ellipse','text','tspan','defs','lineargradient','radialgradient','stop','clippath','mask','title','desc']);
  const svgSafe=n=>isText(n)||(n.ns==='svg'&&svgTags.has(n.tag.toLowerCase())&&n.children.every(svgSafe));
  if(!svgSafe(graphic))throw Error('SVG 子树结构不匹配');
 }else{
  const row=n=>n.ns==='html'&&n.tag==='tr'&&n.children.every(c=>c.ns==='html'&&['td','th'].includes(c.tag)&&plain(c));
  if(!graphic.children.every(n=>n.ns==='html'&&(['thead','tbody','tfoot'].includes(n.tag)?n.children.every(row):n.tag==='caption'&&plain(n))))throw Error('表格子树结构不匹配');
 }
 const range=(n,min,max,step,value)=>{if(n.ns!=='html'||n.tag!=='input'||n.attrs.type!=='range'||Number(n.attrs.min)!==min||Number(n.attrs.max)!==max||Number(n.attrs.step)!==step||Number(n.attrs.value)!==value)throw Error('滑块模型不匹配');};
 if(b.recipe==='fourier@1'){
 if(!exact(b.state,['harmonics','amplitude','phase']))throw Error('Fourier 状态字段不合法');const d=fourierPath(b.state);if(refs.curve.tag!=='path'||refs.curve.ns!=='svg'||refs.curve.attrs.d!==d)throw Error('曲线与模型不一致');
 if(Math.abs(b.state.amplitude*10-Math.round(b.state.amplitude*10))>1e-8||Math.abs(b.state.phase*100-Math.round(b.state.phase*100))>1e-8)throw Error('数值不符合滑块步长');
 range(refs.harmonics,1,12,1,b.state.harmonics);range(refs.amplitude,0,1.5,0.1,b.state.amplitude);range(refs.phase,-3.14,3.14,0.01,b.state.phase);
 }else{if(!exact(b.state,['minimum','direction'])||refs.sort.tag!=='button'||refs.sort.ns!=='html'||!Number.isInteger(b.state.minimum))throw Error('表格状态字段不合法');tableOrder(tableRows(refs.body),b.state);range(refs.filter,0,50,1,b.state.minimum);}
 }return bs;
}
export function validateBehaviors(s){
 const bs=s.behaviors||[];if(!Array.isArray(bs)||bs.length>20)throw Error('交互数量超限');const map=nodes(s.tree);
 for(const b of bs){
  const adapter=getAdapter(b?.recipe);if(!adapter||adapter.native||!exact(b,['recipe','bindings','state','evidence'])||!['fixture-equivalence-v1','model-validated-v1'].includes(b.evidence)||!exact(b.bindings,adapter.bindings))throw Error('交互 recipe 或字段不支持');
  const paths=bindingPaths(b.bindings);if(new Set(paths).size!==paths.length)throw Error('交互绑定重复');
  for(const path of paths)if(typeof path!=='string'||!/^0(?:\.\d{1,4}){0,75}$/.test(path)||!map.has(path)||path!==b.bindings.root&&!path.startsWith(b.bindings.root+'.'))throw Error('交互绑定不合法或超出组件');
  for(const p of paths.filter(p=>p!==b.bindings.root))for(const q of paths.filter(q=>q!==b.bindings.root))if(p!==q&&p.startsWith(q+'.'))throw Error('组件结构不匹配：绑定节点不能相互嵌套');
  if(['fourier@1','table@1'].includes(b.recipe)){validateLegacyBehaviors({...s,behaviors:[b]});continue;}
  if(!exact(b.state,adapter.state))throw Error('状态字段不合法');
  for(const key of adapter.arrays)if(!Array.isArray(b.bindings[key])||b.bindings[key].length<2||b.bindings[key].length>12)throw Error('数组绑定数量不合法');
  const refs=Object.fromEntries(Object.entries(b.bindings).map(([k,v])=>[k,Array.isArray(v)?v.map(p=>map.get(p)):map.get(v)]));
  const html=n=>n?.ns==='html',plain=n=>n.children.every(c=>Object.hasOwn(c,'text'));
  if(!html(refs.root)||!['div','section','article'].includes(refs.root.tag))throw Error('组件根结构不匹配');
  const parent=p=>p.slice(0,p.lastIndexOf('.')),wrappers=new Set(['main','div','section','article','aside','header','figure','label','ul','ol','li','details']);
  for(const path of paths)for(let p=parent(path);p;p=parent(p)){const n=map.get(p);if(!html(n)||(!wrappers.has(n.tag)&&!b.bindings.panels?.includes(p)))throw Error('组件祖先结构不匹配');}
  const panelTopology=n=>{if(n.text!==undefined)return;const blocks=new Set(['div','section','article','main','aside','header','figure','p','h1','h2','h3','h4','h5','h6','ul','ol','li','table','details']);if(n.ns==='html'&&['p','span','strong','em','code','output','button','label','h1','h2','h3','h4','h5','h6'].includes(n.tag)){for(const [,c] of nodes(n))if(c!==n&&c.ns==='html'&&(blocks.has(c.tag)||n.tag==='button'&&['button','input','details'].includes(c.tag)))throw Error('面板后代结构会被 HTML 解析器改写');}const tableChildren={table:['caption','colgroup','thead','tbody','tfoot'],thead:['tr'],tbody:['tr'],tfoot:['tr'],tr:['td','th'],colgroup:['col']};if(tableChildren[n.tag]&&n.children.some(c=>c.text!==undefined?c.text.trim():!tableChildren[n.tag].includes(c.tag)))throw Error('面板表格结构不稳定');n.children.forEach(panelTopology);};
  const visible=(n,on)=>{panelTopology(n);if(!html(n)||!['div','section','article'].includes(n.tag)||Object.hasOwn(n.attrs,'hidden')===on||n.attrs['aria-hidden']!==String(!on))throw Error('面板可见状态不匹配');};
  const local=(n,key,target)=>{if(n.attrs[key]!==undefined&&(!/^uip-\d+$/.test(n.attrs[key])||n.attrs[key]!==target.attrs.id))throw Error('ARIA 引用不匹配');};
  if(b.recipe==='calculator@1'){
   const result=sumValue(b.state.left,b.state.right);
   for(const key of ['left','right']){const n=refs[key];if(!html(n)||n.tag!=='input'||n.attrs.type!=='number'||n.attrs.disabled!==''||Number(n.attrs.min)!==-100||Number(n.attrs.max)!==100||Number(n.attrs.step)!==.01||n.attrs.value.trim()===''||Number(n.attrs.value)!==b.state[key])throw Error('计算输入模型不匹配');}
   if(!html(refs.output)||refs.output.tag!=='output'||!plain(refs.output)||text(refs.output)!==result)throw Error('计算输出不匹配');
  }else if(b.recipe==='tabs@1'){
   if(refs.tabs.length!==refs.panels.length||!Number.isInteger(b.state.active)||b.state.active<0||b.state.active>=refs.tabs.length)throw Error('Tabs 状态不合法');
   refs.tabs.forEach((n,i)=>{const on=i===b.state.active,p=refs.panels[i];if(!html(n)||n.tag!=='button'||!plain(n)||n.attrs.role!=='tab'||n.attrs['aria-selected']!==String(on)||n.attrs.tabindex!==(on?'0':'-1')||p.attrs.role!=='tabpanel')throw Error('Tabs 结构或状态不匹配');visible(p,on);local(n,'aria-controls',p);local(p,'aria-labelledby',n);});
  }else{
   if(typeof b.state.active!=='boolean'||refs.panels.length!==2||!html(refs.control)||refs.control.tag!=='input'||refs.control.attrs.type!=='checkbox'||Object.hasOwn(refs.control.attrs,'checked')!==b.state.active)throw Error('布尔状态模型不匹配');
   refs.panels.forEach((n,i)=>visible(n,i===Number(b.state.active)));
  }
 }
 for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){
  const a=bs[i],b=bs[j],ar=a.bindings.root,br=b.bindings.root;
  if(ar===br||bindingPaths(a.bindings).some(p=>bindingPaths(b.bindings).includes(p)))throw Error('组件绑定范围重叠');
  const check=(outer,inner)=>{if(!inner.bindings.root.startsWith(outer.bindings.root+'.'))return;const panels=outer.bindings.panels||[];if(!panels.some(p=>inner.bindings.root.startsWith(p+'.')))throw Error('嵌套组件必须位于独立面板');for(const p of bindingPaths(outer.bindings))if(p.startsWith(inner.bindings.root+'.'))throw Error('交叉组件绑定');};check(a,b);check(b,a);
 }return bs;
}
export function analyze(s,strategy='auto',{confirmDegradation=false}={}){
 if(!['auto','interactive','static'].includes(strategy))throw Error('导出策略不合法');validateBehaviors(s);const map=nodes(s.tree),components=[],covered=new Set();
 for(const b of s.behaviors||[]){bindingPaths(b.bindings).forEach(p=>covered.add(p));const tested=b.evidence==='fixture-equivalence-v1'&&s.provenance?.status==='captured';components.push({path:b.bindings.root,recipe:b.recipe,capability:strategy==='static'?'static-fallback':tested?'reconstructed-tested':'model-validated',evidence:tested?'owned fixture / finite model / equivalence-v1':'finite model validated locally; source equivalence unverified'});}
 const nativeStable=path=>{for(let p=path;p;p=p.slice(0,p.lastIndexOf('.'))){const n=map.get(p);if(n?.ns!=='html'||!['main','section','div','article','aside','header','figure','figcaption','blockquote','details','ul','ol','li','dl','dt','dd'].includes(n.tag))return false;}return true;};
 for(const [path,n] of map){if(n.tag==='details'){const stable=nativeStable(path);components.push({path,recipe:'native-details@1',capability:strategy==='static'||!stable?'static-fallback':'native-preserved',evidence:stable?'browser details/summary; no source script':'parser-stable HTML ancestry not verified',...(!stable?{reason:'折叠结构无法确认，静态降级'}:{})});}else if(['input','button'].includes(n.tag)&&!covered.has(path))components.push({path,capability:'static-fallback',reason:'未知行为，未恢复来源事件或计算逻辑'});}
 const active=components.filter(c=>c.capability!=='static-fallback').length,unsupported=components.filter(c=>c.capability==='static-fallback').length;
 const requiresConfirmation=strategy==='interactive'&&active>0&&unsupported>0,degradationConfirmed=requiresConfirmation&&confirmDegradation===true;
 const blockedReason=strategy==='interactive'&&!active?'没有可恢复交互，请选择 Auto 或 Static':requiresConfirmation&&!degradationConfirmed?'存在不可恢复组件，请显式确认静态降级':'';
 return {strategy,capability:active?(unsupported?'partial-interactive':'selective-interactive'):(s.capability||'static'),components,recoverable:active,staticComponents:unsupported,requiresConfirmation,degradationConfirmed,exportable:!blockedReason,blockedReason,limitations:['仅有列出的原生/受控 recipe 可交互；其余为静态外观','模型校验不等于来源行为等价证明；不是原始程序或响应式规则的无损复制']};
}
export function exportPolicy(s,options={}){const report=analyze(s,options.strategy||'auto',options);if(!report.exportable)throw Error(report.blockedReason);return report;}
export function externalImport(s){
 // File claims never become authority. Every candidate is checked against our finite model.
 const candidates=s.behaviors||[];if(!Array.isArray(candidates)||candidates.length>20)throw Error('交互数量超限');
 const out={...s,schemaVersion:'1.3.0',source:{type:'json',origin:'local'},provenance:{method:'local-file',status:'external-unverified'},behaviors:[],security:{redacted:false,remoteResources:false,scripts:false},omissions:[...new Set([...(s.omissions||[]),'外部来源、脱敏、安全与验证声明未经证明；来源等价声明已丢弃','结构与资源通过本地校验不代表正文或像素已经脱敏'])].slice(-177)};
 for(let i=0;i<candidates.length;i++){try{const b=candidates[i];validateBehaviors({...out,behaviors:[...out.behaviors,b]});out.behaviors.push({...b,evidence:'model-validated-v1'});}catch(error){out.omissions.push(`交互 #${i+1} 静态降级：${error.message}`);}}
 return out;
}
