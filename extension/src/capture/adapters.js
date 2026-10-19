import {getAdapter} from '../core/adapters.js';
import {nodes,validateBehaviors} from '../core/interactions.js';
import {fourierPath} from '../core/recipes.js';
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

// Metadata-only structural check precedes state reads, then bounded state/model checks
// precede reading inactive panel text. No candidate marker alone enables capture.
export function prevalidateCandidate(candidate,evidence){
 const {root,recipe}=candidate,adapter=getAdapter(recipe);
 if(!adapter||adapter.native)throw Error('未知或不兼容的适配器：'+recipe);
 const roles=componentRoles(root),defaults=recipe==='fourier@1'?{harmonics:1,amplitude:1,phase:0}:recipe==='table@1'?{minimum:0,direction:'asc'}:recipe==='calculator@1'?{left:0,right:0}:recipe==='tabs@1'?{active:0}:{active:false};
 const identity=new Map();let serial=0;for(const el of [root,...root.querySelectorAll('[id]')])if(el.id){if(identity.has(el.id))identity.set(el.id,null);else identity.set(el.id,'uip-'+serial++);}
 function representation(state,readText){
  const captured=new WeakMap();
  function walk(el,modelText=false){
   if(el.nodeType===3)return {text:readText&&modelText?(el.nodeValue||''):''};
   if(el.nodeType!==1)return null;
   const n={tag:el.localName,ns:el.namespaceURI==='http://www.w3.org/2000/svg'?'svg':'html',attrs:{},children:[],style:{}};captured.set(el,n);
   for(const k of ['type','min','max','step','role','aria-selected','aria-hidden','tabindex','d'])if(el.hasAttribute(k))n.attrs[k]=el.getAttribute(k);
   if(el.id&&identity.get(el.id))n.attrs.id=identity.get(el.id);
   for(const k of ['aria-controls','aria-labelledby'])if(el.hasAttribute(k))n.attrs[k]=identity.get(el.getAttribute(k))||'invalid-reference';
   if(el.hidden)n.attrs.hidden='';
   if(el.localName==='input'){n.attrs.disabled='';if(el.type==='checkbox'){if(el.checked)n.attrs.checked='';}else{const role=el.getAttribute('data-uip-role'),key=role==='filter'?'minimum':role;n.attrs.value=String(state[key]??0);}}
   const role=el.getAttribute('data-uip-role');
   const requiredText=recipe==='calculator@1'&&role==='output'||recipe==='table@1'&&el.localName==='td';
   if(readText&&recipe==='calculator@1'&&role==='output')for(let p=el;p;p=p.parentElement){if(p.hidden||getComputedStyle(p).display==='none'||['hidden','collapse'].includes(getComputedStyle(p).visibility))throw Error('计算输出必须可见');if(p===root)break;}
   // Only finite-model outputs/cells need text. Inactive panel, editable and
   // unrelated text is never consulted merely to validate a candidate.
   n.children=[...el.childNodes].map(child=>walk(child,modelText||requiredText)).filter(Boolean);
   if(!readText&&recipe==='fourier@1'&&role==='curve')n.attrs.d=fourierPath(state);
   if(!readText&&recipe==='calculator@1'&&role==='output')n.children=[{text:String(Number((state.left+state.right).toFixed(2)))}];
   if(!readText&&recipe==='table@1'&&el.localName==='td')n.children=[{text:el.cellIndex===1?'0':'row'}];
   return n;
  }
  const tree=walk(root),paths=new Map([...nodes(tree)].map(([p,n])=>[n,p]));
  // Binding extraction is duplicated only as metadata mapping, never source code.
  const bindings={root:'0'},arrayRole=Object.fromEntries(Object.entries(adapter.arrayRoles).map(([binding,role])=>[role,binding]));
  for(const [role,elements] of roles){if(arrayRole[role])bindings[arrayRole[role]]=elements.map(el=>paths.get(captured.get(el)));else{if(elements.length!==1)throw Error('重复组件绑定：'+role);bindings[role]=paths.get(captured.get(elements[0]));}}
  validateBehaviors({tree,behaviors:[{recipe,bindings,state,evidence}]});
 }
 // For Tabs/state, public ARIA/checked metadata must describe the active branch.
 if(recipe==='tabs@1')defaults.active=(roles.get('tab')||[]).findIndex(el=>el.getAttribute('aria-selected')==='true');
 if(recipe==='state@1')defaults.active=roles.get('control')?.[0]?.checked===true;
 representation(defaults,false);
 const fakeCapture=new WeakMap(),fakePaths=new Map();let i=0;for(const el of [root,...root.querySelectorAll('*')]){const n={};fakeCapture.set(el,n);fakePaths.set(n,String(i++));}
 const behavior=extractCandidate(candidate,fakeCapture,fakePaths,evidence);
 representation(behavior.state,false);
 representation(behavior.state,true);
 return candidate;
}
