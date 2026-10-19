import {getAdapter} from '../core/adapters.js';
// DOM contract extraction is separate from IR/model validation. Markers alone grant no authority.
export function detectCandidates(selected,contract){
 if(!contract.finiteModels)return [];
 return [selected,...selected.querySelectorAll('[data-uip-recipe]')].filter(root=>root.hasAttribute('data-uip-recipe')).map(root=>({root,recipe:root.getAttribute('data-uip-recipe')}));
}
export function componentRoles(root){const roles=new Map();for(const el of root.querySelectorAll('[data-uip-role]'))if(el.closest('[data-uip-recipe]')===root){const key=el.getAttribute('data-uip-role');roles.set(key,[...(roles.get(key)||[]),el]);}return roles;}
export function extractCandidate({root,recipe},captured,paths,evidence){
 const adapter=getAdapter(recipe);if(!adapter)throw Error('未知或不兼容的适配器：'+recipe);
 const roles=componentRoles(root),bindings={root:paths.get(captured.get(root))};
 const arrayRole=Object.fromEntries(Object.entries(adapter.arrayRoles).map(([binding,role])=>[role,binding]));
 for(const [role,elements] of roles){if(arrayRole[role])bindings[arrayRole[role]]=elements.map(el=>paths.get(captured.get(el)));else{if(elements.length!==1)throw Error('重复组件绑定：'+role);bindings[role]=paths.get(captured.get(elements[0]));}}
 const value=k=>{const el=roles.get(k)?.[0];if(!el)throw Error('缺失绑定：'+k);return Number(el.value);};
 let state;
 if(recipe==='fourier@1')state={harmonics:value('harmonics'),amplitude:value('amplitude'),phase:value('phase')};
 else if(recipe==='table@1')state={minimum:value('filter'),direction:root.dataset.direction||'asc'};
 else if(recipe==='tabs@1')state={active:(roles.get('tab')||[]).findIndex(el=>el.getAttribute('aria-selected')==='true')};
 else if(recipe==='calculator@1')state={left:value('left'),right:value('right')};
 else if(recipe==='state@1')state={active:roles.get('control')?.[0]?.checked===true};
 return {recipe,bindings,state,evidence};
}
