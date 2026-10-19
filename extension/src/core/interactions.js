import {fourierPath,tableOrder} from './recipes.js';
export const trustFixtureURL=url=>{try{const u=new URL(url);return u.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(u.hostname)&&u.pathname==='/selective-interactions.html';}catch{return false;}};
export function nodes(tree){const map=new Map();function walk(n,path){map.set(path,n);n.children?.forEach((c,i)=>walk(c,path+'.'+i));}walk(tree,'0');return map;}
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const text=n=>n.text??n.children.map(text).join('');
export function tableRows(n){if(n.tag!=='tbody'||n.children.length>200||n.children.some(r=>r.tag!=='tr'||r.children.length!==2||r.children.some(c=>c.tag!=='td')))throw Error('表格结构不匹配');return n.children.map(r=>r.children.map(text));}
export function validateBehaviors(s){
 const bs=s.behaviors||[];if(!Array.isArray(bs)||bs.length>20)throw Error('交互数量超限');const map=nodes(s.tree),used=new Set();
 for(const b of bs){if(!exact(b,['recipe','bindings','state','evidence'])||b.evidence!=='fixture-equivalence-v1')throw Error('交互证据字段不合法');
 const keys=b.recipe==='fourier@1'?['root','harmonics','amplitude','phase','curve','output']:b.recipe==='table@1'?['root','filter','sort','body','output']:null;if(!keys||!exact(b.bindings,keys))throw Error('交互 recipe 不支持');
 if(new Set(Object.values(b.bindings)).size!==keys.length)throw Error('交互绑定重复');
 const refs={};for(const k of keys){const path=b.bindings[k];if(typeof path!=='string'||!/^0(?:\.\d{1,4}){0,75}$/.test(path)||!map.has(path)||used.has(path))throw Error('交互绑定不合法');if(k!=='root'&&!path.startsWith(b.bindings.root+'.'))throw Error('绑定超出组件');refs[k]=map.get(path);used.add(path);}
 if(refs.root.ns!=='html'||!['section','div','article'].includes(refs.root.tag)||refs.output.tag!=='output')throw Error('组件结构不匹配');
 const range=(n,min,max,step,value)=>{if(n.tag!=='input'||n.attrs.type!=='range'||Number(n.attrs.min)!==min||Number(n.attrs.max)!==max||Number(n.attrs.step)!==step||Number(n.attrs.value)!==value)throw Error('滑块模型不匹配');};
 if(b.recipe==='fourier@1'){
 if(!exact(b.state,['harmonics','amplitude','phase']))throw Error('Fourier 状态字段不合法');const d=fourierPath(b.state);if(refs.curve.tag!=='path'||refs.curve.ns!=='svg'||refs.curve.attrs.d!==d)throw Error('曲线与模型不一致');
 range(refs.harmonics,1,12,1,b.state.harmonics);range(refs.amplitude,0,1.5,0.1,b.state.amplitude);range(refs.phase,-3.14,3.14,0.01,b.state.phase);
 }else{if(!exact(b.state,['minimum','direction'])||refs.sort.tag!=='button')throw Error('表格状态字段不合法');tableOrder(tableRows(refs.body),b.state);range(refs.filter,0,50,1,b.state.minimum);}
 }return bs;
}
export function analyze(s,strategy='auto'){
 if(!['auto','interactive','static'].includes(strategy))throw Error('导出策略不合法');validateBehaviors(s);const map=nodes(s.tree),components=[],covered=new Set();
 for(const b of s.behaviors||[]){Object.values(b.bindings).forEach(p=>covered.add(p));components.push({path:b.bindings.root,recipe:b.recipe,capability:strategy==='static'?'static-fallback':'reconstructed-tested',evidence:'owned fixture / finite model / equivalence-v1'});}
 for(const [path,n] of map){if(n.tag==='details')components.push({path,recipe:'native-details@1',capability:strategy==='static'?'static-fallback':'native-preserved',evidence:'browser details/summary; no source script'});else if(['input','button'].includes(n.tag)&&!covered.has(path))components.push({path,capability:'static-fallback',reason:'未知行为，未恢复来源事件或计算逻辑'});}
 const active=components.filter(c=>c.capability!=='static-fallback').length,unsupported=components.filter(c=>c.capability==='static-fallback').length;
 return {strategy,capability:active?(unsupported?'partial-interactive':'selective-interactive'):(s.capability||'static'),components,limitations:['仅有列出的原生/受控 recipe 可交互；其余为静态外观','不是原始界面程序或响应式规则的无损复制']};
}
export function externalImport(s){
 // Freeze finite model state before discarding its behavioral authority.
 // Validate first at the caller; never execute supplied code or trust evidence labels.
 if(s.behaviors?.length){s=structuredClone(s);const map=nodes(s.tree);
 for(const b of s.behaviors){if(!['fourier@1','table@1'].includes(b.recipe))continue;
 for(const [path,n] of map){if(!n.style)continue;if(path===b.bindings.root||b.bindings.root.startsWith(path+'.')){n.style.height='auto';if(n.style.display==='grid')n.style['grid-template-rows']='none';}
 if(b.recipe==='table@1'&&path.startsWith(b.bindings.root+'.')&&['table','tbody','tr','td','th'].includes(n.tag))n.style.height='auto';}
 if(b.recipe==='table@1'){const body=map.get(b.bindings.body),visible=new Set(tableOrder(tableRows(body),b.state));body.children.forEach((row,i)=>{if(!visible.has(i))row.style.display='none';});}
 }}
 // No external assertion is a trust token. Keep visual content; discard behavioral authority.
 return {...s,schemaVersion:'1.1.0',source:{type:'json',origin:'local'},provenance:{method:'local-file',status:'external-unverified'},behaviors:[],security:{redacted:false,remoteResources:false,scripts:false},omissions:[...(s.omissions||[]).slice(0,196),'外部来源、脱敏、安全与验证声明未经证明；已丢弃交互 recipe 声明','结构与资源通过本地校验不代表正文或像素已经脱敏']};
}
