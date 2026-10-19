// Clipboard data is supplied only by the foreground paste handler; no clipboard API.
export function clipboardInput(data){
 if(!data)throw Error('浏览器没有提供本次粘贴数据');
 const files=[...(data.items||[])].filter(i=>i.kind==='file');
 if(files.length){if(files.length!==1||!/^image\/(png|jpeg|webp)$/i.test(files[0].type))throw Error('不支持的剪贴板文件；请粘贴一张 PNG/JPEG/WebP 图片');const file=files[0].getAsFile();if(!file)throw Error('无法读取本次图片');return {kind:'image',file};}
 const html=data.getData('text/html')||'',text=data.getData('text/plain')||'';
 if(html.trim())return {kind:'html',text:html};if(text)return {kind:'text',text};throw Error('剪贴板没有可导入内容，请复制文字或截图');
}
export function fileKind(name){const ext=name.split('.').pop().toLowerCase();if(['png','jpg','jpeg','webp'].includes(ext))return 'image';if(['html','htm'].includes(ext))return 'html';if(['svg','json'].includes(ext))return ext;if(['txt','md'].includes(ext))return 'text';throw Error('不支持此文件类型');}
export function textMarkup(text){if(text.length>1000000)throw Error('纯文本超过 100 万字符，请缩小范围');return '<pre style="white-space:pre-wrap;overflow-wrap:anywhere"><span></span>'+text.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</pre>';}
