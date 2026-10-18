import {fourierPath,tableOrder} from './recipes.js';
// The only executable export code, built locally and authorized by its exact CSP hash.
const specs=JSON.parse(document.querySelector('meta[name="uip-interactions"]').content);
const get=path=>document.querySelector(`[data-uip-node="${path}"]`);
for(const spec of specs){
 const b=Object.fromEntries(Object.entries(spec.bindings).map(([k,p])=>[k,get(p)])),state={...spec.state};
 if(spec.recipe==='fourier@1'){
  const update=()=>{try{const next={harmonics:Number(b.harmonics.value),amplitude:Number(b.amplitude.value),phase:Number(b.phase.value)};const path=fourierPath(next);b.curve.setAttribute('d',path);b.output.textContent=`N=${next.harmonics} · A=${next.amplitude} · φ=${next.phase}`;Object.assign(state,next);}catch{for(const key of ['harmonics','amplitude','phase'])b[key].value=state[key];}};
  for(const key of ['harmonics','amplitude','phase']){b[key].disabled=false;b[key].addEventListener('input',update);}
 }else if(spec.recipe==='table@1'){
  const rows=[...b.body.children],data=rows.map(row=>[...row.children].map(c=>c.textContent));
  const update=()=>{try{const indices=tableOrder(data,state),visible=new Set(indices);for(let i=0;i<rows.length;i++)rows[i].hidden=!visible.has(i);b.body.replaceChildren(...indices.map(i=>rows[i]),...rows.filter((_,i)=>!visible.has(i)));b.output.textContent=`≥${state.minimum} · ${state.direction}`;}catch{b.filter.value=spec.state.minimum;}};
  b.filter.disabled=false;b.sort.disabled=false;
  b.filter.addEventListener('input',()=>{state.minimum=Number(b.filter.value);update();});b.sort.addEventListener('click',()=>{state.direction=state.direction==='asc'?'desc':'asc';update();});update();
 }
}
