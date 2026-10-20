import {test,expect,chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const evidence=path.resolve(process.env.UIP_EVIDENCE_DIR||'tests/artifacts/v0.5.0/composite');
const extensionPath=path.resolve(process.env.UIP_EXTENSION_PATH||'extension');
let context,cdp,page,extensionId;
let seq=0;
async function popup(format='html',capture=false){
 await page.bringToFront();
 const {targetInfos}=await cdp.send('Target.getTargets',{filter:[{type:'tab',exclude:false}]});
 const tab=targetInfos.find(t=>t.url===page.url()&&t.embedderData?.tabActive);
 await cdp.send('Extensions.triggerAction',{id:extensionId,targetId:tab.targetId});
 let pop;
 await expect.poll(async()=>{const all=await cdp.send('Target.getTargets',{filter:[{exclude:false}]});pop=all.targetInfos.find(t=>t.type==='page'&&t.url.endsWith('/popup.html'));return !!pop;}).toBe(true);
 const {sessionId}=await cdp.send('Target.attachToTarget',{targetId:pop.targetId,flatten:false});
 const send=async(method,params={})=>{
  const id=++seq;
  const reply=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{cdp.off('Target.receivedMessageFromTarget',listener);reject(Error('Popup CDP timeout'));},10000);function listener(e){if(e.sessionId!==sessionId)return;const msg=JSON.parse(e.message);if(msg.id!==id)return;clearTimeout(timer);cdp.off('Target.receivedMessageFromTarget',listener);msg.error?reject(Error(msg.error.message)):resolve(msg.result);}cdp.on('Target.receivedMessageFromTarget',listener);});
  await cdp.send('Target.sendMessageToTarget',{sessionId,message:JSON.stringify({id,method,params})});return reply;
 };
 const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result?.value;
 await expect.poll(()=>evaluate('document.readyState')).toBe('complete');
 if(capture==='dark')await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'}]});
 if(capture){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(evidence,capture==='dark'?'popup-dark.png':'popup.png'),Buffer.from(shot.data,'base64'));}
 await evaluate(`document.getElementById('controlledSource').checked=true;document.getElementById('format').value=${JSON.stringify(format)};document.getElementById('choose').click();true`);
 return {evaluate};
}
async function start(format='html'){await popup(format);await expect(page.locator('[data-uip-picker]')).toHaveCount(1);}
async function exportTarget(selector,format='html'){
 await start(format);await page.locator(selector).click();
 const previewEvent=context.waitForEvent('page',p=>p.url().includes('/preview.html'));
 await page.keyboard.press('Enter');const preview=await previewEvent;
 await expect(preview.locator('#save')).toBeEnabled();
 return preview;
}
async function save(preview,name){const pending=preview.waitForEvent('download');await preview.locator('#save').click();const download=await pending;expect(await download.failure()).toBeNull();const target=path.join(evidence,name);await download.saveAs(target);return target;}
test.beforeAll(async()=>{
 await fs.mkdir(evidence,{recursive:true});
 context=await chromium.launchPersistentContext('',{...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{channel:'chromium'}),headless:true,acceptDownloads:true,viewport:{width:1200,height:900},args:['--enable-unsafe-extension-debugging',`--disable-extensions-except=${extensionPath}`,`--load-extension=${extensionPath}`]});
 const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');extensionId=new URL(worker.url()).hostname;
 cdp=await context.browser().newBrowserCDPSession();page=await context.newPage();
 await fs.writeFile(path.join(evidence,'runtime.json'),JSON.stringify({browser:context.browser().version(),platform:process.platform,manifest:JSON.parse(await fs.readFile(path.join(extensionPath,'manifest.json'),'utf8')),popup:'CDP Extensions.triggerAction on real toolbar tab, Runtime evaluation of actual popup DOM; no permission mocks',date:new Date().toISOString()},null,2));
});
test.afterAll(async()=>{await context?.close();});
test.beforeEach(async()=>{await page.goto('http://127.0.0.1:18787/interactive-demo.html');});
async function importJSON(raw){const importer=await context.newPage();await importer.goto(`chrome-extension://${extensionId}/import.html`);const event=context.waitForEvent('page',p=>p.url().includes('/preview.html'));await importer.locator('#file').setInputFiles({name:'roundtrip.json',mimeType:'application/json',buffer:Buffer.from(raw)});const preview=await event;await expect(preview.locator('#save')).toBeEnabled();return {importer,preview};}
async function whole(format='json'){await start(format);await page.locator('[data-uip-recipe] h2').first().click();await page.keyboard.press('ArrowUp');const event=context.waitForEvent('page',p=>p.url().includes('/preview.html'));await page.keyboard.press('Enter');const preview=await event;await expect(preview.locator('#save')).toBeEnabled();return preview;}
async function setRange(target,index,value){await target.locator('input[type=range]').nth(index).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function operateComposite(target){
 const ranges=target.locator('input[type=range]'),tabs=target.getByRole('tab'),toggle=target.locator('input[type=checkbox]'),curve=target.locator('svg path').last(),rows=target.locator('tbody tr:not([hidden])');
 await expect(ranges).toHaveCount(4);await expect(ranges.nth(0)).toHaveValue('8');await expect(ranges.nth(3)).toHaveValue('30');await expect(rows).toHaveText(['丁45','丙40']);await expect(tabs.nth(0)).toHaveAttribute('aria-selected','true');await expect(toggle).toBeChecked();
 const initialCurve=await curve.getAttribute('d');
 // Outer tab keyboard operations must not alter the inner model or its sibling state component.
 await tabs.nth(0).press('End');await expect(tabs.nth(1)).toBeFocused();await expect(target.getByText('独立的曲线说明',{exact:true})).toBeVisible();await expect(ranges.nth(0)).toBeHidden();await expect(rows).toHaveText(['丁45','丙40']);await expect(toggle).toBeChecked();
 await tabs.nth(1).press('ArrowRight');await expect(tabs.nth(0)).toBeFocused();expect(await curve.getAttribute('d')).toBe(initialCurve);
 const {fourierPath}=await import('../extension/src/core/recipes.js');
 for(const values of [[1,.5,-1.2],[12,1.5,3.14]]){
  for(const [index,value] of values.entries())await setRange(target,index,value);
  expect(await curve.getAttribute('d')).toBe(fourierPath({harmonics:values[0],amplitude:values[1],phase:values[2]}));await expect(tabs.nth(0)).toHaveAttribute('aria-selected','true');await expect(toggle).toBeChecked();await expect(rows).toHaveText(['丁45','丙40']);
 }
 const finalCurve=await curve.getAttribute('d');
 // Inner table filter and sort must not change either outer component's selection.
 await target.getByRole('button',{name:'切换升降序'}).click();await expect(rows).toHaveText(['丙40','丁45']);await setRange(target,3,20);await expect(rows).toHaveText(['乙25','丙40','丁45']);await expect(toggle).toBeChecked();await expect(tabs.nth(0)).toHaveAttribute('aria-selected','true');expect(await curve.getAttribute('d')).toBe(finalCurve);
 // Hiding the table through its outer state component preserves inner filter/order and the chart.
 await toggle.focus();await target.keyboard.press('Space');await expect(toggle).not.toBeChecked();await expect(target.getByText('表格已收起',{exact:true})).toBeVisible();await expect(ranges.nth(3)).toBeHidden();expect(await curve.getAttribute('d')).toBe(finalCurve);await expect(tabs.nth(0)).toHaveAttribute('aria-selected','true');
 await toggle.check();await expect(rows).toHaveText(['乙25','丙40','丁45']);await expect(ranges.nth(3)).toHaveValue('20');
 await tabs.nth(1).click();await tabs.nth(0).click();expect(await curve.getAttribute('d')).toBe(finalCurve);await expect(rows).toHaveText(['乙25','丙40','丁45']);
}
for(const [theme,width] of [['light',1200],['dark',375]])test(`v0.5 nested chart/tabs + filtertable/state real MV3 JSON→HTML/ZIP / ${theme}`,async()=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme});await page.goto('http://127.0.0.1:18787/adapters-composite.html');
 const prepare=async()=>{for(const [i,value] of [8,1.3,-.75,30].entries())await setRange(page,i,value);await page.getByRole('button',{name:'切换升降序'}).click();};
 await prepare();await operateComposite(page);await page.reload();await prepare();await page.locator('#composites').screenshot({path:path.join(evidence,`${theme}-source.png`)});
 const captured=await whole(),raw=await fs.readFile(await save(captured,`${theme}-composite.json`),'utf8'),snapshot=JSON.parse(raw);
 expect(snapshot.schemaVersion).toBe('1.4.0');expect(snapshot.behaviors.map(b=>b.recipe)).toEqual(['tabs@1','fourier@1','state@1','table@1']);expect(snapshot.behaviors.every(b=>b.evidence==='model-validated-v1')).toBe(true);
 for(const [outer,inner] of [[snapshot.behaviors[0],snapshot.behaviors[1]],[snapshot.behaviors[2],snapshot.behaviors[3]]])expect(outer.bindings.panels.some(p=>inner.bindings.root.startsWith(p+'.'))).toBe(true);
 await captured.close();await page.close();
 const imported=await importJSON(raw);await expect(imported.preview.locator('#interactionReport')).toContainText('model-validated');await expect(imported.preview.locator('#interactionReport')).not.toContainText('reconstructed-tested');await imported.preview.locator('#strategy').selectOption('interactive');await expect(imported.preview.locator('#save')).toBeEnabled();
 const requests=[],errors=[],monitor=async file=>{const result=await context.newPage();result.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});result.on('pageerror',e=>errors.push(e.message));await result.setViewportSize({width,height:900});await result.emulateMedia({colorScheme:theme});await result.goto('file://'+file);return result;};
 const html=await save(imported.preview,`${theme}-composite.html`),opened=await monitor(html);await operateComposite(opened);await opened.screenshot({path:path.join(evidence,`${theme}-html-operated.png`),fullPage:true});
 await imported.preview.locator('#format').selectOption('zip');await expect(imported.preview.locator('#save')).toBeEnabled();const zip=await save(imported.preview,`${theme}-composite.zip`),folder=path.join(evidence,`${theme}-unpacked`);
 const {execFileSync}=await import('node:child_process');execFileSync('python3',['-c','import sys,zipfile,json,hashlib;z=zipfile.ZipFile(sys.argv[1]);assert all(not n.startswith("/") and ".." not in n.split("/") for n in z.namelist());z.extractall(sys.argv[2]);m=json.loads(z.read("manifest.json"));assert all(hashlib.sha256(z.read(e["path"])).hexdigest()==e["sha256"] for e in m["entries"]);assert z.read("interaction-runtime.js")',zip,folder]);
 const archived=await monitor(path.join(folder,'index.html'));await operateComposite(archived);expect(requests).toEqual([]);expect(errors).toEqual([]);
 await fs.writeFile(path.join(evidence,`${theme}-result.json`),JSON.stringify({theme,width,sourceClosed:true,recipes:snapshot.behaviors.map(b=>b.recipe),html:'PASS',zip:'PASS',scope:'inner chart/table and outer tabs/state independently operated',archiveSHA256:'PASS',externalRequests:requests,runtimeErrors:errors},null,2));
 await Promise.all([opened.close(),archived.close(),imported.preview.close(),imported.importer.close()]);page=await context.newPage();
});
