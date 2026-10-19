import {fourierPath,tableOrder} from './recipes.js';
import {sumValue} from './adapters.js';
// The only executable export code, built locally and authorized by its exact CSP hash.
const specs=JSON.parse(document.querySelector('meta[name="uip-interactions"]').content);
const get=path=>document.querySelector(`[data-uip-node="${path}"]`);
for(const spec of specs){
 const b=Object.fromEntries(Object.entries(spec.bindings).map(([k,p])=>[k,Array.isArray(p)?p.map(get):get(p)])),state={...spec.state};
 if(spec.recipe==='fourier@1'){
  const update=()=>{try{const next={harmonics:Number(b.harmonics.value),amplitude:Number(b.amplitude.value),phase:Number(b.phase.value)};const path=fourierPath(next);b.curve.setAttribute('d',path);b.output.textContent=`N=${next.harmonics} · A=${next.amplitude} · φ=${next.phase}`;Object.assign(state,next);}catch{for(const key of ['harmonics','amplitude','phase'])b[key].value=state[key];}};
  for(const key of ['harmonics','amplitude','phase']){b[key].disabled=false;b[key].addEventListener('input',update);}
 }else if(spec.recipe==='tabs@1'){
  const update=index=>{state.active=index;b.tabs.forEach((tab,i)=>{const on=i===index;tab.disabled=false;tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;b.panels[i].hidden=!on;b.panels[i].setAttribute('aria-hidden',String(!on));});};
  b.tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>update(i));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(i+1)%b.tabs.length;else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(i+b.tabs.length-1)%b.tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=b.tabs.length-1;else return;event.preventDefault();update(next);b.tabs[next].focus();});});update(state.active);
 }else if(spec.recipe==='calculator@1'){
  const update=()=>{try{if(b.left.value.trim()===''||b.right.value.trim()==='')throw Error('empty');const left=Number(b.left.value),right=Number(b.right.value),result=sumValue(left,right);Object.assign(state,{left,right});b.output.textContent=result;}catch{b.left.value=state.left;b.right.value=state.right;}};
  for(const key of ['left','right']){b[key].disabled=false;b[key].addEventListener('input',update);}
 }else if(spec.recipe==='state@1'){
  const update=()=>{state.active=b.control.checked;b.panels.forEach((panel,i)=>{const on=i===Number(state.active);panel.hidden=!on;panel.setAttribute('aria-hidden',String(!on));});};b.control.disabled=false;b.control.addEventListener('change',update);update();
 }else if(spec.recipe==='table@1'){
  const rows=[...b.body.children],data=rows.map(row=>[...row.children].map(c=>c.textContent));
  const update=()=>{try{const indices=tableOrder(data,state),visible=new Set(indices);for(let i=0;i<rows.length;i++)rows[i].hidden=!visible.has(i);b.body.replaceChildren(...indices.map(i=>rows[i]),...rows.filter((_,i)=>!visible.has(i)));b.output.textContent=`≥${state.minimum} · ${state.direction}`;}catch{b.filter.value=spec.state.minimum;}};
  b.filter.disabled=false;b.sort.disabled=false;
  b.filter.addEventListener('input',()=>{state.minimum=Number(b.filter.value);update();});b.sort.addEventListener('click',()=>{state.direction=state.direction==='asc'?'desc':'asc';update();});update();
 }
}
