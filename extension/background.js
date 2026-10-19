import {sourceAdapter} from './src/core/sources.js';
import {externalImport} from './src/core/interactions.js';
import {verifyResources,LIMITS,bytes} from './src/core/ir.js';
import {prune,addSession} from './src/core/session.js';
const results=new Map();let queue=Promise.resolve();
const blocked=host=>host==='chatgpt.com'||host.endsWith('.chatgpt.com')||host==='chat.openai.com'||host.endsWith('.chat.openai.com');
const pageSender=sender=>{try{const u=new URL(sender.url);return sender.tab&&sender.frameId===0&&/^https?:$/.test(u.protocol)&&!blocked(u.hostname);}catch{return false;}};
const extensionPage=(sender,name)=>{try{const u=new URL(sender.url);return u.origin===new URL(chrome.runtime.getURL('/')).origin&&u.pathname==='/'+name;}catch{return false;}};
chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 const task=queue.then(async()=>{
  if(sender.id!==chrome.runtime.id)throw Error('消息来源不合法');
  const fields={capture:['type','snapshot','format'],getCapture:['type','id'],status:['type','tabId'],pickerStatus:['type','status'],sourceContract:['type','tabId','controlled']}[message?.type];
  if(!fields||Object.keys(message).some(k=>!fields.includes(k)))throw Error('消息 schema 不合法');
  if(!message||typeof message!=='object'||bytes(message)>LIMITS.bytes+1000)throw Error('消息超过 4 MB 或格式不合法');
  const saved=await chrome.storage.session.get('captures');let entries=prune(Array.isArray(saved.captures)?saved.captures:[]);await chrome.storage.session.set({captures:entries});
  if(extensionPage(sender,'popup.html')&&message.type==='sourceContract'){
   if(!Number.isInteger(message.tabId)||typeof message.controlled!=='boolean')throw Error('来源契约 schema 不合法');
   const tab=await chrome.tabs.get(message.tabId);sourceAdapter(tab.url);
   const saved=await chrome.storage.session.get('sourceGrants'),grants=(saved.sourceGrants||[]).filter(g=>g.expires>Date.now()&&g.tabId!==tab.id).slice(-19);
   if(message.controlled)grants.push({tabId:tab.id,origin:new URL(tab.url).origin,expires:Date.now()+300000});await chrome.storage.session.set({sourceGrants:grants});return {ok:true};
  }
  if(message.type==='capture'){
   if(!pageSender(sender)&&!extensionPage(sender,'import.html'))throw Error('来源不允许捕获');
   if(!['html','md','json','svg','png','zip'].includes(message.format))throw Error('导出格式不合法');
   let snapshot=await verifyResources(extensionPage(sender,'import.html')&&(message.snapshot?.provenance?.status==='external-unverified'||message.snapshot?.behaviors?.length)?externalImport(message.snapshot):message.snapshot);if(pageSender(sender)&&snapshot.behaviors?.length){const {sourceGrants=[]}=await chrome.storage.session.get('sourceGrants');if(!sourceGrants.some(g=>g.tabId===sender.tab.id&&g.origin===new URL(sender.url).origin&&g.expires>Date.now()))throw Error('来源未获受控 recipe 资格');snapshot={...snapshot,behaviors:snapshot.behaviors.map(b=>({...b,evidence:'model-validated-v1'}))};}
   if(pageSender(sender)&&snapshot.source.origin!==new URL(sender.url).origin)throw Error('来源不一致');
   const id=crypto.randomUUID();entries=addSession(entries,{id,snapshot,format:message.format});await chrome.storage.session.set({captures:entries});
   await chrome.tabs.create({url:chrome.runtime.getURL('preview.html?id='+id)});if(sender.tab)results.set(sender.tab.id,'已捕获 · 请在预览页检查遗漏后下载');return {ok:true,id};
  }
  if(extensionPage(sender,'preview.html')&&message.type==='getCapture'){
   const entry=entries.find(x=>x.id===message.id);if(!entry)return {error:'预览已过期，请重新捕获或导入。'};
   return {snapshot:entry.snapshot,format:entry.format,expiresAt:entry.created+600000};
  }
  if(extensionPage(sender,'popup.html')&&message.type==='status')return {status:results.get(message.tabId)||'就绪 · 仅保存你有权保存的页面区域'};
  if(pageSender(sender)&&message.type==='pickerStatus'&&typeof message.status==='string'&&message.status.length<=200){results.set(sender.tab.id,message.status);return {ok:true};}
  throw Error('不支持的请求或消息来源');
 });queue=task.catch(()=>{});task.then(respond,error=>respond({error:error.message}));return true;
});
chrome.tabs.onRemoved.addListener(id=>results.delete(id));
