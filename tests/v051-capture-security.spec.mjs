import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
test.beforeEach(async({page})=>{
 await page.route('**/capture-security/**',async route=>{const name=new URL(route.request().url()).pathname.split('/capture-security/')[1];if(!/^(capture|core)\/[a-z-]+\.js$/.test(name))return route.abort();await route.fulfill({contentType:'text/javascript',body:await fs.readFile(path.resolve('extension/src',name),'utf8')});});
 await page.goto('/interactive-demo.html');
});
const calculator='<section data-uip-recipe="calculator@1"><input data-uip-role="left" type="number" min="-100" max="100" step=".01" value="72.31"><input data-uip-role="right" type="number" min="-100" max="100" step=".01" value="1"><output data-uip-role="output">73.31</output></section>';
const tabs=hidden=>`<section data-uip-recipe="tabs@1"><div role="tablist"><button data-uip-role="tab" role="tab" aria-selected="true" tabindex="0">A</button><button data-uip-role="tab" role="tab" aria-selected="false" tabindex="-1">B</button></div><section data-uip-role="panel" role="tabpanel" aria-hidden="false">shown</section><section data-uip-role="panel" role="tabpanel" aria-hidden="true" hidden>${hidden}</section></section>`;
async function capture(page,markup){await page.setContent(`<main id="target" style="width:600px;min-height:200px">${markup}</main>`);return page.evaluate(async()=>{const {captureElement}=await import('/capture-security/capture/dom.js');const selected=document.getElementById('target');let changes=0;const observer=new MutationObserver(records=>changes+=records.length);observer.observe(selected,{attributes:true,subtree:true,childList:true});const s=await captureElement(selected,{controlled:true});await Promise.resolve();observer.disconnect();return {s,changes};});}
test('invalid calculator markers cannot retain numerical private input values',async({page})=>{
 const {s}=await capture(page,calculator.replace('73.31','invalid-model'));
 expect(s.behaviors).toEqual([]);expect(JSON.stringify(s.tree)).not.toContain('72.31');expect(JSON.stringify(s.tree)).toContain('输入内容已脱敏');expect(s.omissions.join('\n')).toContain('预验证');
});
test('invalid Tabs bindings never reveal or copy inactive text',async({page})=>{
 const {s,changes}=await capture(page,tabs('HIDDEN_PRIVATE_TEXT').replace('aria-selected="false"','aria-selected="true"'));
 expect(s.behaviors).toEqual([]);expect(JSON.stringify(s.tree)).not.toContain('HIDDEN_PRIVATE_TEXT');expect(changes).toBe(0);
});
test('valid controlled inactive panel capture never mutates source DOM',async({page})=>{
 const {s,changes}=await capture(page,tabs('allowed inactive panel'));
 expect(s.behaviors).toHaveLength(1);expect(JSON.stringify(s.tree)).toContain('allowed inactive panel');expect(changes).toBe(0);
});
test('state change after prevalidation discards privileged capture and recaptures redacted',async({page})=>{
 await page.setContent(`<main id="target" style="width:600px;min-height:200px">${'<p>filler</p>'.repeat(30)}${calculator}</main>`);
 const s=await page.evaluate(async()=>{const {captureElement}=await import('/capture-security/capture/dom.js');let changed=false;return captureElement(document.getElementById('target'),{controlled:true,onProgress:()=>{if(!changed){changed=true;document.querySelector('output').textContent='changed';}}});});
 expect(s.behaviors).toEqual([]);expect(JSON.stringify(s.tree)).not.toContain('72.31');expect(JSON.stringify(s.tree)).toContain('输入内容已脱敏');expect(s.omissions.join('\n')).toContain('重新按默认脱敏');
});
test('cross component binding and illegal state cannot reveal hidden data',async({page})=>{
 const {s}=await capture(page,tabs(`${calculator.replace('72.31','101').replace('73.31','102')}hidden-sensitive`).replace('data-uip-role="tab" role="tab" aria-selected="true"','data-uip-role="alien" role="tab" aria-selected="true"'));
 expect(s.behaviors).toEqual([]);expect(JSON.stringify(s.tree)).not.toContain('hidden-sensitive');expect(JSON.stringify(s.tree)).not.toContain('101');
});
test('candidate prevalidation never reads inactive panel or unrelated hidden text',async({page})=>{
 const result=await page.evaluate(async({calculator,tabs})=>{
  const {prevalidateCandidate}=await import('/capture-security/capture/adapters.js');
  let reads=0;const watch=root=>{const secret=root.querySelector('[hidden]')?.firstChild;if(secret)Object.defineProperty(secret,'nodeValue',{get(){reads++;throw Error('hidden text was read');}});};
  const host=document.createElement('main');document.body.append(host);host.innerHTML=calculator.replace('73.31','bad').replace('</section>','<div hidden>unrelated secret</div></section>');watch(host);let invalid;
  try{prevalidateCandidate({root:host.firstElementChild,recipe:'calculator@1'},'model-validated-v1');}catch(e){invalid=e.message;}
  host.innerHTML=tabs;watch(host);prevalidateCandidate({root:host.firstElementChild,recipe:'tabs@1'},'model-validated-v1');return {reads,invalid};
 },{calculator,tabs:tabs('secret panel')});
 expect(result.reads).toBe(0);expect(result.invalid).toContain('计算输出不匹配');
});
