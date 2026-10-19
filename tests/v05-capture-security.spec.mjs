import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
// Direct source-module browser tests isolate capture security from packaging/toolbar behavior.
test.beforeEach(async({page})=>{
 await page.route('**/capture-security/**',async route=>{const name=new URL(route.request().url()).pathname.split('/capture-security/')[1];if(!/^(capture|core)\/[a-z-]+\.js$/.test(name))return route.abort();await route.fulfill({contentType:'text/javascript',body:await fs.readFile(path.resolve('extension/src',name),'utf8')});});
 await page.goto('/interactive-demo.html');
});
const capture=page=>page.evaluate(async()=>{const {captureElement}=await import('/capture-security/capture/dom.js');return captureElement(document.getElementById('target'),{controlled:true});});
test('capture omits ordinary unsupported ARIA roles and tabindex while retaining finite states',async({page})=>{
 await page.setContent('<main id="target" style="width:600px;height:200px"><div role="region" tabindex="1">region</div><button role="button">press</button><span role="presentation" aria-selected="bogus" aria-hidden="sometimes">text</span><div role="tablist" tabindex="0"><button role="tab" aria-selected="true" tabindex="-1">tab</button></div></main>');
 const s=await capture(page),children=s.tree.children;expect(children[0].attrs.role).toBeUndefined();expect(children[0].attrs.tabindex).toBeUndefined();expect(children[1].attrs.role).toBeUndefined();expect(children[2].attrs).not.toHaveProperty('aria-hidden');expect(children[2].attrs).not.toHaveProperty('aria-selected');expect(children[3].attrs).toMatchObject({role:'tablist',tabindex:'0'});expect(children[3].children[0].attrs).toMatchObject({role:'tab','aria-selected':'true',tabindex:'-1'});
});
test('duplicate source IDs remove ambiguous identifiers and references without failing capture',async({page})=>{
 await page.setContent('<main id="target" style="width:600px;height:200px"><div id="duplicate">one</div><div id="duplicate">two</div><div id="unique" aria-controls="duplicate" aria-labelledby="duplicate">refs</div><div aria-controls="unique">safe</div></main>');
 const s=await capture(page),c=s.tree.children;expect(c[0].attrs.id).toBeUndefined();expect(c[1].attrs.id).toBeUndefined();expect(c[2].attrs['aria-controls']).toBeUndefined();expect(c[2].attrs['aria-labelledby']).toBeUndefined();expect(c[3].attrs['aria-controls']).toBe(c[2].attrs.id);expect(s.omissions.some(x=>x.includes('重复来源 ID'))).toBe(true);
});
test('node-budget preflight and abortion run before recipe scans',async({page})=>{
 const result=await page.evaluate(async()=>{const {captureElement}=await import('/capture-security/capture/dom.js');document.body.innerHTML='<main id="target" style="width:600px;height:200px"></main>';const selected=document.getElementById('target');selected.append(...Array.from({length:5001},()=>document.createElement('div')));let queries=0;const original=Element.prototype.querySelectorAll;Element.prototype.querySelectorAll=function(selector){if(selector.includes('data-uip'))queries++;return original.call(this,selector);};let budget,aborted;try{await captureElement(selected,{controlled:true});}catch(e){budget=e.message;}selected.replaceChildren();const controller=new AbortController();controller.abort();try{await captureElement(selected,{controlled:true,signal:controller.signal});}catch(e){aborted=e.name;}return {queries,budget,aborted};});
 expect(result.queries).toBe(0);expect(result.budget).toContain('5000');expect(result.aborted).toBe('AbortError');
});
test('recipe candidate budget fails before role scans',async({page})=>{
 const result=await page.evaluate(async()=>{const {captureElement}=await import('/capture-security/capture/dom.js');document.body.innerHTML='<main id="target" style="width:600px;height:200px"></main>';const selected=document.getElementById('target');for(let i=0;i<21;i++){const n=document.createElement('div');n.dataset.uipRecipe='calculator@1';selected.append(n);}let roleQueries=0;const original=Element.prototype.querySelectorAll;Element.prototype.querySelectorAll=function(selector){if(selector==='[data-uip-role]')roleQueries++;return original.call(this,selector);};try{await captureElement(selected,{controlled:true});}catch(e){return {message:e.message,roleQueries};}});
 expect(result.message).toContain('20');expect(result.roleQueries).toBe(0);
});
