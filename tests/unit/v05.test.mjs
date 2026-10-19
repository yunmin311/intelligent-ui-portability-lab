import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBehaviors,externalImport,bindingPaths,getAdapter} from '../../extension/src/core/interactions.js';
import {sumValue} from '../../extension/src/core/adapters.js';
const node=(tag,attrs={},children=[])=>({tag,ns:'html',attrs,style:{},children});
const text=value=>({text:value});
function calculator(){return {schemaVersion:'1.3.0',tree:node('section',{},[node('input',{type:'number',disabled:'',min:'-100',max:'100',step:'0.01',value:'1.1'}),node('input',{type:'number',disabled:'',min:'-100',max:'100',step:'0.01',value:'2.2'}),node('output',{},[text('3.3')])]),behaviors:[{recipe:'calculator@1',bindings:{root:'0',left:'0.0',right:'0.1',output:'0.2'},state:{left:1.1,right:2.2},evidence:'model-validated-v1'}]};}
function tabs(){return {tree:node('section',{},[node('button',{disabled:'',role:'tab','aria-selected':'true',tabindex:'0','aria-controls':'uip-2',id:'uip-0'},[text('A')]),node('button',{disabled:'',role:'tab','aria-selected':'false',tabindex:'-1','aria-controls':'uip-3',id:'uip-1'},[text('B')]),node('div',{role:'tabpanel','aria-hidden':'false',id:'uip-2','aria-labelledby':'uip-0'}),node('div',{role:'tabpanel','aria-hidden':'true',hidden:'',id:'uip-3','aria-labelledby':'uip-1'})]),behaviors:[{recipe:'tabs@1',bindings:{root:'0',tabs:['0.0','0.1'],panels:['0.2','0.3']},state:{active:0},evidence:'model-validated-v1'}]};}
test('versioned registry is closed and flattened bindings retain array targets',()=>{assert.equal(getAdapter('constructor'),null);assert.equal(getAdapter('tabs@2'),null);assert.ok(Object.isFrozen(getAdapter('tabs@1')));assert.deepEqual(bindingPaths(tabs().behaviors[0].bindings),['0','0.0','0.1','0.2','0.3']);});
test('fixed calculator rounds the sum and rejects nonnumeric, bounds, step and source expressions',()=>{assert.equal(sumValue(.1,.2),'0.3');assert.equal(sumValue(-100,100),'0');for(const value of [NaN,Infinity,101,'1',.001])assert.throws(()=>sumValue(value,0));assert.doesNotThrow(()=>validateBehaviors(calculator()));for(const mutate of [s=>s.behaviors[0].state.left='1.1',s=>s.behaviors[0].state.expression='alert(1)',s=>s.tree.children[2].children[0].text='3.3000000001',s=>s.behaviors[0].bindings.left='0.2']){const s=calculator();mutate(s);assert.throws(()=>validateBehaviors(s));}});
test('tabs require matching finite selection, local ARIA and independent array bindings',()=>{assert.doesNotThrow(()=>validateBehaviors(tabs()));for(const mutate of [s=>s.behaviors[0].state.active=2,s=>s.behaviors[0].bindings.tabs[1]='0.0',s=>s.behaviors[0].bindings.panels.pop(),s=>s.tree.children[0].attrs['aria-controls']='external',s=>delete s.tree.children[3].attrs.hidden,s=>s.tree.children[1].attrs.tabindex='0']){const s=tabs();mutate(s);assert.throws(()=>validateBehaviors(s));}});
test('boolean two-panel model requires checkbox and exact visible state',()=>{const s={tree:node('div',{},[node('input',{type:'checkbox',disabled:'',checked:''}),node('section',{'aria-hidden':'true',hidden:''}),node('section',{'aria-hidden':'false'})]),behaviors:[{recipe:'state@1',bindings:{root:'0',control:'0.0',panels:['0.1','0.2']},state:{active:true},evidence:'model-validated-v1'}]};assert.doesNotThrow(()=>validateBehaviors(s));s.behaviors[0].state.active='true';assert.throws(()=>validateBehaviors(s));});
test('nested recipes in panels are independent; cross-scope references fail',()=>{const s=tabs(),c=calculator();s.tree.children[2].children.push(c.tree);const b=c.behaviors[0];b.bindings=Object.fromEntries(Object.entries(b.bindings).map(([k,p])=>[k,'0.2.0'+p.slice(1)]));s.behaviors.push(b);assert.doesNotThrow(()=>validateBehaviors(s));s.behaviors[0].bindings.tabs[0]=b.bindings.left;assert.throws(()=>validateBehaviors(s));});
test('import independently downgrades invalid candidates and drops source equivalence',()=>{const s=calculator();s.behaviors[0].evidence='fixture-equivalence-v1';s.behaviors.push({...s.behaviors[0],recipe:'calculator@99'});const out=externalImport(s);assert.equal(out.schemaVersion,'1.3.0');assert.equal(out.behaviors.length,1);assert.equal(out.behaviors[0].evidence,'model-validated-v1');assert.equal(out.provenance.status,'external-unverified');assert.equal(out.omissions.length,3);});

import {validateSnapshot,migrate} from '../../extension/src/core/ir.js';
import {parseSnapshot} from '../../extension/src/core/import-snapshot.js';
import {fragment} from '../../extension/src/core/render.js';
const snapshot=s=>({...s,kind:'ui-portability-snapshot',schemaVersion:'1.3.0',capability:'static',createdAt:'2026-10-19T00:00:00Z',source:{type:'page',origin:'http://localhost:18787'},dimensions:{width:600,height:300},background:'#fff',resources:[],provenance:{method:'sanitized-dom',status:'captured'},omissions:[],limitations:[],security:{redacted:true,remoteResources:false,scripts:false}});
test('IR1.3 import roundtrip validates numeric controls, flattened render markers and migration',async()=>{const s=snapshot(calculator());assert.equal(validateSnapshot(s),s);const out=await parseSnapshot(JSON.stringify(s));assert.equal(out.behaviors[0].recipe,'calculator@1');assert.equal(out.provenance.status,'external-unverified');const rendered=fragment(snapshot(tabs()),{strategy:'auto'});assert.equal((rendered.match(/data-uip-node=/g)||[]).length,5);for(const version of ['1.0.0','1.1.0','1.2.0']){const old=snapshot(calculator());old.schemaVersion=version;delete old.behaviors;assert.equal(migrate(old).schemaVersion,'1.3.0');}for(const mutate of [x=>x.tree.children[0].attrs.value='NaN',x=>x.tree.children[0].attrs.value='101',x=>x.tree.children[0].attrs.value='alert(1)',x=>x.tree.children[0].attrs.min='0']){const bad=snapshot(calculator());mutate(bad);assert.throws(()=>validateSnapshot(bad));}});

import {sourceAdapter} from '../../extension/src/core/sources.js';
test('localhost filenames and page markers never grant source equivalence or controlled authority',()=>{
 for(const url of ['http://localhost:59999/adapters-a.html','http://127.0.0.1:18787/selective-interactions.html','https://example.test/component']){
  assert.equal(sourceAdapter(url).finiteModels,false);
  const contract=sourceAdapter(url,{controlled:true});assert.equal(contract.finiteModels,true);assert.equal(contract.evidence,'model-validated-v1');
 }
 assert.throws(()=>sourceAdapter('https://chatgpt.com/'));
});
test('panel grammar rejects parser reparenting and exposes no hidden content through model activation',()=>{
 for(const mutate of [s=>s.tree.children[2].tag='p',s=>s.tree.children[2].children=[node('p',{},[node('div',{},[text('hidden secret')])])],s=>s.tree.children[2].children=[node('button',{},[node('button',{},[text('nested')])])]]){
  const s=tabs();mutate(s);assert.throws(()=>validateBehaviors(s));assert.equal(externalImport(s).behaviors.length,0);
 }
});
test('static renderer retains authored fixed height and grid tracks',()=>{
 const s=snapshot(calculator());s.tree.style={height:'300px',display:'grid','grid-template-rows':'100px 100px 100px'};
 const output=fragment(s,{strategy:'static'});assert.match(output,/height:300px/);assert.match(output,/grid-template-rows:100px 100px 100px/);
});

test('static and active modes preserve authored fixed panel dimensions',()=>{const s=snapshot(tabs());s.tree.children[2].style.height='300px';for(const strategy of ['static','auto'])assert.match(fragment(s,{strategy}),/height:300px/);});
