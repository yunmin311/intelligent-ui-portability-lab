// Unique-origin manifest sandbox, no extension API. Parent sends only validated renderer output.
window.addEventListener('message',event=>{
 if(event.source!==parent||event.data?.type!=='render'||typeof event.data.html!=='string'||event.data.html.length>12000000)return;
 document.open();document.write(event.data.html);document.close();
});
parent.postMessage({type:'preview-ready'},'*');
