import {fourierPath,tableOrder} from './recipes.js';
export const trustFixtureURL=url=>{try{const u=new URL(url);return u.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(u.hostname)&&u.pathname==='/selective-interactions.html';}catch{return false;}};
export function nodes(tree){const map=new Map();function walk(n,path){map.set(path,n);n.children?.forEach((c,i)=>walk(c,path+'.'+i));}walk(tree,'0');return map;}
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const text=n=>n.text??n.children.map(text).join('');
export function tableRows(n){if(n.tag!=='tbody'||n.children.length>200||n.children.some(r=>r.tag!=='tr'||r.children.length!==2||r.children.some(c=>c.tag!=='td')))throw Error('表格结构不匹配');return n.children.map(r=>r.children.map(text));}
export function validateBehaviors(s){
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
 const direct=k=>parentPath(b.bindings[k])===b.bindings.root;
 const plain=n=>n.children.every(c=>Object.hasOwn(c,'text'));
 if(!direct('output')||!plain(refs.output))throw Error('输出结构不匹配');
 const controlPosition=k=>direct(k)||(parent(k)?.tag==='label'&&parent(k)?.ns==='html'&&parentPath(parentPath(b.bindings[k]))===b.bindings.root);
 if(b.recipe==='fourier@1'){
  if(!['harmonics','amplitude','phase'].every(controlPosition)||parent('curve')?.tag!=='svg'||parent('curve')?.ns!=='svg'||parentPath(parentPath(b.bindings.curve))!==b.bindings.root)throw Error('Fourier 结构不匹配');
 }else if(!controlPosition('filter')||!direct('sort')||!plain(refs.sort)||refs.body.ns!=='html'||parent('body')?.tag!=='table'||parent('body')?.ns!=='html'||parentPath(parentPath(b.bindings.body))!==b.bindings.root)throw Error('表格结构不匹配');
 // Accept only a finite parser-stable component grammar. Unknown layouts stay static.
 const isText=n=>Object.hasOwn(n,'text');
 const labels=new Set(keys.filter(k=>['harmonics','amplitude','phase','filter'].includes(k)).map(k=>parent(k)).filter(n=>n?.tag==='label'));
 const controls=new Set(keys.filter(k=>['harmonics','amplitude','phase','filter'].includes(k)).map(k=>refs[k]));
 for(const label of labels)if(!label.children.every(n=>isText(n)||controls.has(n)))throw Error('标签结构不匹配');
 const graphic=b.recipe==='fourier@1'?parent('curve'):parent('body');
 const allowedRoot=new Set([...controls,...labels,refs.output,graphic,...(refs.sort?[refs.sort]:[])]);
 if(!refs.root.children.every(n=>isText(n)||allowedRoot.has(n)||(n.ns==='html'&&['h1','h2','h3','h4','p','button'].includes(n.tag)&&plain(n))))throw Error('组件子节点结构不匹配');
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
export function analyze(s,strategy='auto',{confirmDegradation=false}={}){
 if(!['auto','interactive','static'].includes(strategy))throw Error('导出策略不合法');validateBehaviors(s);const map=nodes(s.tree),components=[],covered=new Set();
 for(const b of s.behaviors||[]){Object.values(b.bindings).forEach(p=>covered.add(p));const tested=b.evidence==='fixture-equivalence-v1'&&s.provenance?.status==='captured';components.push({path:b.bindings.root,recipe:b.recipe,capability:strategy==='static'?'static-fallback':tested?'reconstructed-tested':'model-validated',evidence:tested?'owned fixture / finite model / equivalence-v1':'finite model validated locally; source equivalence unverified'});}
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
 const out={...s,schemaVersion:'1.2.0',source:{type:'json',origin:'local'},provenance:{method:'local-file',status:'external-unverified'},behaviors:[],security:{redacted:false,remoteResources:false,scripts:false},omissions:[...new Set([...(s.omissions||[]),'外部来源、脱敏、安全与验证声明未经证明；来源等价声明已丢弃','结构与资源通过本地校验不代表正文或像素已经脱敏'])].slice(-177)};
 for(let i=0;i<candidates.length;i++){try{const b=candidates[i];validateBehaviors({...out,behaviors:[...out.behaviors,b]});out.behaviors.push({...b,evidence:'model-validated-v1'});}catch(error){out.omissions.push(`交互 #${i+1} 静态降级：${error.message}`);}}
 return out;
}
