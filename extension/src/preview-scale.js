// Product display only: never mutate the snapshot or iframe document layout.
export function previewScale(mode, availableWidth, sourceWidth){
 if(mode==='fit')return Math.min(1,Math.max(1,availableWidth)/sourceWidth);
 const n=Number(mode);return [.25,.5,.75,1,1.25,1.5,2].includes(n)?n:1;
}
export function attachPreviewScale(viewport, dimensions){
 const select=document.getElementById('previewScale'),label=document.getElementById('scaleValue');
 const canvas=document.createElement('div');canvas.className='preview-canvas';viewport.append(canvas);
 let frame;
 function update(){
  const ratio=previewScale(select.value,viewport.clientWidth,dimensions.width),height=Math.max(dimensions.height,200);
  canvas.style.width=dimensions.width*ratio+'px';canvas.style.height=height*ratio+'px';
  if(frame)frame.style.transform=`scale(${ratio})`;
  label.textContent=Math.round(ratio*100)+'% · '+dimensions.width+' × '+dimensions.height+' px';
 }
 const observer=new ResizeObserver(update);observer.observe(viewport);select.addEventListener('change',update);
 update();return {mount(next){canvas.replaceChildren(next);frame=next;update();},dispose(){observer.disconnect();select.removeEventListener('change',update);canvas.remove();}};
}
