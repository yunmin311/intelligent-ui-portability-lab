import {test,expect,chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {PNG} from 'pngjs';
const evidence=path.resolve(process.env.UIP_EVIDENCE_DIR||'tests/artifacts/v0.5.0');
const extensionPath=path.resolve(process.env.UIP_EXTENSION_PATH||'extension');
let context,cdp,page,extensionId;
let seq=0;
async function popup(format='html',capture=false,controlled=true){
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
 await evaluate(`if(document.getElementById('controlledSource'))document.getElementById('controlledSource').checked=${JSON.stringify(controlled)};document.getElementById('format').value=${JSON.stringify(format)};document.getElementById('choose').click();true`);
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
async function operate(target){
 const tabs=target.locator('[role=tab]');await expect(tabs).toHaveCount(4);await expect(tabs.nth(1)).toHaveAttribute('aria-selected','true');
 await tabs.nth(0).click();await expect(tabs.nth(0)).toHaveAttribute('aria-selected','true');await expect(tabs.nth(3)).toHaveAttribute('aria-selected','true');await tabs.nth(0).press('End');await expect(tabs.nth(1)).toBeFocused();await tabs.nth(1).press('ArrowRight');await expect(tabs.nth(0)).toBeFocused();await tabs.nth(0).press('ArrowLeft');await expect(tabs.nth(1)).toBeFocused();
 const nums=target.locator('input[type=number]'),out=target.locator('output');await expect(nums).toHaveCount(4);
 for(const [a,b,result] of [[.1,.2,'0.3'],[-100,100,'0'],[99.99,-.01,'99.98'],[-100,-100,'-200']]){await nums.nth(0).fill(String(a));await nums.nth(1).fill(String(b));await expect(out.first()).toHaveText(result);await expect(out.nth(1)).toHaveText('3.75');}
 await nums.nth(0).evaluate(e=>{e.value='101';e.dispatchEvent(new Event('input',{bubbles:true}));});await expect(out.first()).toHaveText('-200');
 const toggle=target.locator('input[type=checkbox]');await expect(toggle).toBeChecked();await toggle.focus();await target.keyboard.press('Space');await expect(toggle).not.toBeChecked();await expect(target.getByText('简洁内容',{exact:true})).toBeVisible();await toggle.check();await expect(target.getByText('完整内容与当前状态',{exact:true})).toBeVisible();
 await target.locator('summary').click();await nums.nth(2).fill('5');await expect(out.nth(1)).toHaveText('7.5');await expect(out.first()).toHaveText('-200');await target.locator('summary').click();
}
function pixels(a,b){expect([b.width,b.height]).toEqual([a.width,a.height]);let changed=0,sum=0;for(let i=0;i<a.data.length;i+=4){let d=0;for(let j=0;j<3;j++){const v=Math.abs(a.data[i+j]-b.data[i+j]);d=Math.max(d,v);sum+=v;}if(d>16)changed++;}return {ratio:changed/(a.width*a.height),mae:sum/(a.width*a.height*3),threshold:{ratio:.02,mae:2}};}
for(const variant of ['a','b'])for(const theme of ['light','dark'])test(`v0.5 ${variant}/${theme} adapter JSON→HTML/ZIP offline roundtrip and visual`,async()=>{
 await page.setViewportSize({width:variant==='a'?1200:375,height:900});await page.emulateMedia({colorScheme:theme});await page.goto(`http://127.0.0.1:18787/adapters-${variant}.html`);
 // Run identical source input/output checks before restoring the initial fixture state.
 await operate(page);await page.reload();const source=PNG.sync.read(await page.locator('#adapters').screenshot({path:path.join(evidence,`${variant}-${theme}-source.png`)}));
 const preview=await whole(),raw=await fs.readFile(await save(preview,`${variant}-${theme}.json`),'utf8'),snapshot=JSON.parse(raw);expect(snapshot.schemaVersion).toBe('1.3.0');expect(snapshot.behaviors).toHaveLength(5);expect(snapshot.behaviors.every(b=>b.evidence==='model-validated-v1')).toBe(true);await preview.close();await page.close();
 const imported=await importJSON(raw);await expect(imported.preview.locator('#interactionReport')).not.toContainText('reconstructed-tested');await expect(imported.preview.locator('#interactionReport')).toContainText('model-validated');await imported.preview.locator('#strategy').selectOption('interactive');await expect(imported.preview.locator('#save')).toBeDisabled();await imported.preview.locator('#confirmDegradation').check();await expect(imported.preview.locator('#save')).toBeEnabled();
 const file=await save(imported.preview,`${variant}-${theme}-roundtrip.html`),opened=await context.newPage(),requests=[],errors=[];opened.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});opened.on('pageerror',e=>errors.push(e.message));await opened.setViewportSize({width:variant==='a'?1200:375,height:900});await opened.emulateMedia({colorScheme:theme});await opened.goto('file://'+file);
 await fs.writeFile(path.join(evidence,`${variant}-${theme}-geometry.json`),JSON.stringify(await opened.locator('body>main').evaluate(e=>[e,...e.children].map(n=>({tag:n.tagName,h:n.getBoundingClientRect().height,style:n.getAttribute('style')}))),null,2));const result=pixels(source,PNG.sync.read(await opened.locator('body>main').screenshot({path:path.join(evidence,`${variant}-${theme}-roundtrip.png`)})));expect(result.ratio).toBeLessThan(.02);expect(result.mae).toBeLessThan(2);await operate(opened);
 await imported.preview.locator('#format').selectOption('zip');await expect(imported.preview.locator('#save')).toBeDisabled();await imported.preview.locator('#confirmDegradation').check();await expect(imported.preview.locator('#save')).toBeEnabled();const zip=await save(imported.preview,`${variant}-${theme}.zip`),folder=path.join(evidence,`${variant}-${theme}-unpacked`);const {execFileSync}=await import('node:child_process');execFileSync('python3',['-c','import sys,zipfile,json,hashlib;z=zipfile.ZipFile(sys.argv[1]);assert all(not n.startswith("/") and ".." not in n.split("/") for n in z.namelist());z.extractall(sys.argv[2]);m=json.loads(z.read("manifest.json"));assert all(hashlib.sha256(z.read(e["path"])).hexdigest()==e["sha256"] for e in m["entries"])',zip,folder]);const archive=await context.newPage();archive.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});await archive.goto('file://'+path.join(folder,'index.html'));await operate(archive);expect(requests).toEqual([]);expect(errors).toEqual([]);
 await imported.preview.locator('#strategy').selectOption('static');await expect(imported.preview.locator('#save')).toBeEnabled();await imported.preview.locator('#format').selectOption('html');await expect(imported.preview.locator('#save')).toBeEnabled();const staticFile=await save(imported.preview,`${variant}-${theme}-static.html`);expect(await fs.readFile(staticFile,'utf8')).not.toContain('<script>');const frozen=await context.newPage();await frozen.setViewportSize({width:variant==='a'?1200:375,height:900});await frozen.emulateMedia({colorScheme:theme});await frozen.goto('file://'+staticFile);await expect(frozen.locator('input').first()).toBeDisabled();const stat=pixels(source,PNG.sync.read(await frozen.locator('body>main').screenshot()));expect(stat.ratio).toBeLessThan(.02);expect(stat.mae).toBeLessThan(2);
 await fs.writeFile(path.join(evidence,`${variant}-${theme}-result.json`),JSON.stringify({variant,theme,sourceClosed:true,behaviors:5,html:'PASS',zip:'PASS',static:'PASS',pixel:result,staticPixel:stat,externalRequests:requests,runtimeErrors:errors},null,2));await Promise.all([opened.close(),archive.close(),frozen.close(),imported.preview.close(),imported.importer.close()]);page=await context.newPage();
});

test('page markers do not grant controlled interaction without Popup consent',async()=>{
 await page.goto('http://127.0.0.1:18787/adapters-a.html');await popup('json',false,false);await expect(page.locator('[data-uip-picker]')).toHaveCount(1);await page.locator('[data-uip-recipe] h2').first().click();await page.keyboard.press('ArrowUp');const event=context.waitForEvent('page',p=>p.url().includes('/preview.html'));await page.keyboard.press('Enter');const preview=await event;await expect(preview.locator('#save')).toBeEnabled();const s=JSON.parse(await fs.readFile(await save(preview,'untrusted-markers.json'),'utf8'));expect(s.behaviors).toEqual([]);expect(JSON.stringify(s.tree)).toContain('输入内容已脱敏');await preview.close();
});
