'use strict';
const message=document.getElementById('message');
function download(name,body,mime){
 const url=URL.createObjectURL(new Blob([body],{type:mime}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 message.textContent='已向浏览器发起下载；请在下载列表确认完成。若受限，可再次点击下载。';
}
(async()=>{
 const payload=await chrome.runtime.sendMessage({type:'getCapture',id:new URLSearchParams(location.search).get('id')});
 if(payload.error)throw Error(payload.error);
 const {report,page,md,svg,format}=payload;
 const info=document.getElementById('report');
 for(const text of [`${report.dimensions.width} × ${report.dimensions.height} px · ${report.stats.elements} 个元素 · ${format.toUpperCase()}`, '仅为 static 静态呈现。可见状态已尽力捕获，未验证原生交互恢复。']){const p=document.createElement('p');p.textContent=text;info.append(p);}
 const details=document.createElement('details');details.open=report.omissions.length>0;
 const summary=document.createElement('summary');summary.textContent=`差异与遗漏（${report.omissions.length} 项）`;details.append(summary);
 const ul=document.createElement('ul');for(const item of report.omissions){const li=document.createElement('li');li.textContent=item;ul.append(li);}details.append(ul);info.append(details);
 const ext=format==='md'?'md':format;
 const body=format==='json'?JSON.stringify(report,null,2):format==='md'?md:format==='svg'?svg:page;
 if(!body)throw Error('SVG 格式只能选择 SVG 根元素，请返回原页重选或改用 HTML。');
 const viewport=document.getElementById('viewport');
 if(format==='html'||format==='svg'){
  const iframe=document.createElement('iframe');iframe.title='安全静态快照预览';iframe.setAttribute('sandbox','');iframe.style.width=`${report.dimensions.width}px`;iframe.style.height=`${report.dimensions.height}px`;iframe.srcdoc=page;viewport.append(iframe);
 }else{const pre=document.createElement('pre');pre.textContent=body;viewport.append(pre);}
 const basename='ui-export-'+report.capturedAt.replace(/[:.]/g,'-');
 document.getElementById('save').disabled=false;document.getElementById('saveReport').disabled=false;
 document.getElementById('save').onclick=()=>download(basename+'.'+ext,body,format==='html'?'text/html;charset=utf-8':format==='svg'?'image/svg+xml;charset=utf-8':format==='json'?'application/json;charset=utf-8':'text/markdown;charset=utf-8');
 document.getElementById('saveReport').onclick=()=>{const {html,text,...metadata}=report;download(basename+'-report.json',JSON.stringify(metadata,null,2),'application/json');};
 message.textContent='捕获完成。检查预览与遗漏后下载。';
})().catch(error=>{message.textContent='预览失败：'+error.message;});
