import {raster} from './src/import-raster.js';
import {clipboardInput,fileKind,textMarkup} from './src/import-input.js';
import {job} from './src/jobs.js';
const drop=document.getElementById('drop');
const status=document.getElementById('status'),file=document.getElementById('file'),cancel=document.getElementById('cancel'),paste=document.getElementById('pasteArea');
const quality=document.getElementById('rasterQuality');
let active;
function isolated(text,kind,signal){return new Promise((resolve,reject)=>{
 const frame=document.createElement('iframe');frame.src='import-sandbox.html';frame.setAttribute('sandbox','allow-scripts');frame.style.cssText=`position:fixed;left:-20000px;width:${Math.min(1600,Math.max(320,Number(document.getElementById('width').value)||1200))}px;height:900px`;const nonce=crypto.randomUUID();
 const done=()=>{clearTimeout(timer);window.removeEventListener('message',receive);signal.removeEventListener('abort',abort);frame.remove();};
 const abort=()=>{done();reject(signal.reason||Error('已取消'));};
 const timer=setTimeout(()=>{done();reject(Error('HTML 转换超时，隔离页已移除；请缩小文件'));},15000);
 function receive(e){if(e.source!==frame.contentWindow)return;if(e.data?.type==='sandbox-ready')frame.contentWindow.postMessage({type:'convert',nonce,text,kind,width:parseFloat(frame.style.width)},'*');else if(e.data?.nonce===nonce){done();e.data.error?reject(Error(e.data.error)):resolve(e.data.snapshot);}}
 signal.addEventListener('abort',abort,{once:true});window.addEventListener('message',receive);document.getElementById('sandbox').append(frame);if(signal.aborted)abort();
});}
async function convert(input){
 if(active){status.textContent='正在转换，请等待或先取消，再粘贴新内容。';return;}
 const controller=new AbortController(),{signal}=controller;active=controller;status.dataset.state='loading';file.disabled=true;drop.disabled=true;quality.disabled=true;cancel.hidden=false;paste.setAttribute('aria-busy','true');status.textContent='正在本地解析、净化并校验…';
 try{
 const kind=input.kind,f=input.file;
 if(f&&f.size>(kind==='image'?16000000:kind==='json'?4000000:kind==='text'?4000000:2000000))throw Error('文件超过安全大小限制，请缩小内容');
 let snapshot;
 if(kind==='image')snapshot=await raster(f,{signal,preserveResolution:quality.value==='archive',onProgress:message=>{if(!signal.aborted)status.textContent=message;}});
 else{
 const text=input.text??await f.text();signal.throwIfAborted();
 if(kind==='json'){snapshot=await job({operation:'parse',text},{signal});if(snapshot.requiresSanitizedHTML){snapshot=await isolated(snapshot.requiresSanitizedHTML,'html',signal);snapshot.provenance.method='migrated-v02';snapshot.omissions.push('旧版 0.2 HTML 已重新净化；交互和外部资源状态无法恢复');}}
 else{const markup=kind==='text'?textMarkup(text):text;if(new TextEncoder().encode(markup).length>2000000)throw Error('转换后的 HTML 超过 2 MB，请缩小内容');snapshot=await isolated(markup,kind==='svg'?'svg':'html',signal);
 snapshot.omissions.push(kind==='text'?'纯文本保存：保留文字和换行，不将 HTML 代码解释为标记':'用户提供的富文本：有限结构和安全样式；不证明来源身份，不恢复未知交互');}
 }
 signal.throwIfAborted();await job({operation:'render',snapshot,format:'json'},{signal});signal.throwIfAborted();
 // This final local handoff is atomic; cancellation remains available until it starts.
 cancel.hidden=true;const response=await chrome.runtime.sendMessage({type:'capture',snapshot,format:'html'});if(response.error)throw Error(response.error);status.dataset.state='success';status.textContent='转换完成，已打开预览。检查原貌、差异与遗漏后下载；也可继续粘贴下一份内容。';
 }catch(error){status.dataset.state=signal.aborted?'idle':'error';status.textContent=signal.aborted?'已取消转换，没有创建预览。可重新粘贴或导入。':'导入失败：'+error.message+'。可重新粘贴或选择文件。';}
 finally{if(active===controller){active=null;file.disabled=false;drop.disabled=false;quality.disabled=false;cancel.hidden=true;paste.setAttribute('aria-busy','false');file.value='';}}
}
function acceptFile(f){if(!f)return;try{void convert({kind:fileKind(f.name),file:f});}catch(error){status.dataset.state='error';status.textContent='导入失败：'+error.message;}}
file.onchange=()=>acceptFile(file.files[0]);cancel.onclick=()=>active?.abort(Error('用户取消转换'));
paste.addEventListener('beforeinput',e=>e.preventDefault());
paste.addEventListener('paste',e=>{e.preventDefault();try{void convert(clipboardInput(e.clipboardData));}catch(error){status.dataset.state='error';status.textContent=error.message;}});
drop.ondragover=e=>e.preventDefault();drop.ondrop=e=>{e.preventDefault();if(e.dataTransfer.files.length!==1){status.dataset.state='error';status.textContent='请一次拖入一个文件';return;}acceptFile(e.dataTransfer.files[0]);};drop.onclick=()=>file.click();
window.addEventListener('pagehide',()=>active?.abort(Error('导入页关闭')));

// Focus only on first load so the primary Ctrl+V path needs no extra click.
paste.focus();
