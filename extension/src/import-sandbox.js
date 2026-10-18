import {rasterDimensions} from './core/raster.js';
import {captureElement} from './capture/dom.js';
import {allowedHtml,allowedSvg,allowedMath,allowedAttributes,styleProps,safeCss,SVG,MATH} from './core/policy.js';
// Unique-origin manifest sandbox: no extension APIs. Raw markup is NEVER mounted.
let active=false;
function sanitize(text,type){
 const doc=new DOMParser().parseFromString(text,type==='svg'?'image/svg+xml':'text/html');if(doc.querySelector('parsererror'))throw Error('SVG 解析失败');
 const styles=[];let count=0;
 const filter=style=>{const out=[];for(const key of style){const v=style.getPropertyValue(key);if((styleProps.includes(key)||/^--[a-z0-9-]+$/i.test(key))&&safeCss(v))out.push(key+':'+v);}return out.join(';');};
 function clone(n,depth=0){if(++count>5000||depth>75)throw Error('导入超过 5000 节点或 75 层');if(n.nodeType===3)return document.createTextNode(n.nodeValue);if(n.nodeType!==1)return null;
 const name=n.localName.toLowerCase();if(name==='style'){const sheet=new CSSStyleSheet();sheet.replaceSync(n.textContent.slice(0,200000));function rules(items){for(const rule of items){if(rule.type===1&&rule.selectorText.length<500&&!/[<>@]/.test(rule.selectorText))styles.push(rule.selectorText.replace(/\bbody\b/g,'.uip-import-body')+'{'+filter(rule.style)+'}');else if(rule.type===4&&matchMedia(rule.conditionText).matches)rules(rule.cssRules);}}rules(sheet.cssRules);return null;}
 const ns=n.namespaceURI;const allowed=ns===SVG?allowedSvg.has(name):ns===MATH?allowedMath.has(name):allowedHtml.has(name)||['body','img','input','textarea','select'].includes(name);
 if(!allowed)return null;
 const el=document.createElementNS(ns,name==='body'?'div':n.localName);
 for(const a of n.attributes){if(['class','id'].includes(a.name)&&a.value.length<200)el.setAttribute(a.name,a.value);else if(a.name==='style')el.setAttribute('style',filter(n.style));else if(a.name==='src'&&name==='img'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(a.value)&&a.value.length<2000000){const parts=a.value.split(',');rasterDimensions(Uint8Array.from(atob(parts[1]),c=>c.charCodeAt(0)),parts[0].slice(5,-7));el.setAttribute('src',a.value);}else if((allowedAttributes.has(a.name)||['type','min','max','step','value','checked','open','disabled','gradientUnits','gradientTransform','clipPathUnits'].includes(a.name))&&a.value.length<100000&&((['d','points'].includes(a.name)&&!/[<>\\@]|url\s*\(/i.test(a.value))||safeCss(a.value)||/^url\(#[\w-]+\)$/.test(a.value))&&!/[<>]/.test(a.value))el.setAttribute(a.name,a.value);}
 if(name==='body')el.classList.add('uip-import-body');
 if(name==='input'&&!['range','radio','checkbox'].includes(el.getAttribute('type')))el.setAttribute('type','text');
 if(n.hasAttribute('contenteditable'))el.setAttribute('contenteditable','true');
 for(const c of n.childNodes){const out=clone(c,depth+1);if(out)el.append(out);}return el;}
 const root=type==='svg'?doc.documentElement:doc.body;
 // Include head CSS but never head active content, links or URLs.
 if(type!=='svg')for(const st of doc.head.querySelectorAll('style'))clone(st);
 const safe=clone(root);if(!safe)throw Error('没有可导入内容');const style=document.createElement('style');style.textContent=styles.join('\n');document.head.append(style);return safe;
}
window.addEventListener('message',async event=>{
 if(event.source!==parent||active||!event.data||event.data.type!=='convert')return;active=true;
 const {nonce,text,kind,width}=event.data;
 try{
 if(typeof text!=='string'||text.length>2000000||!['html','svg'].includes(kind))throw Error('文件超过 2 MB 或类型不支持');
 document.body.style.cssText='margin:0;width:'+Math.min(1600,Math.max(320,Number(width)||1200))+'px';
 const safe=sanitize(text,kind);document.body.replaceChildren(safe);
 const snapshot=await captureElement(safe,{source:{type:kind,origin:'local'},method:'local-file'});
 snapshot.omissions.push('文件中的脚本、事件、远程资源与不支持的样式规则已移除；导入不能证明内容所有权');
 parent.postMessage({nonce,snapshot},'*');
 }catch(error){parent.postMessage({nonce,error:error.message},'*');}finally{active=false;}
});
parent.postMessage({type:'sandbox-ready'},'*');
