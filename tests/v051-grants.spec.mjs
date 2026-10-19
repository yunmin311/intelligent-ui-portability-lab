import {test,expect,chromium} from '@playwright/test';
import path from 'node:path';
let context,worker,cdp,page,id,sequence=0;
test.beforeAll(async()=>{
 const extensionPath=path.resolve(process.env.UIP_EXTENSION_PATH||'extension');
 context=await chromium.launchPersistentContext('',{...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{channel:'chromium'}),headless:true,args:['--enable-unsafe-extension-debugging',`--disable-extensions-except=${extensionPath}`,`--load-extension=${extensionPath}`]});
 worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');id=new URL(worker.url()).hostname;cdp=await context.browser().newBrowserCDPSession();page=await context.newPage();
});
test.afterAll(async()=>{await context?.close();});
const grants=()=>worker.evaluate(async()=>{const {sourceGrants=[]}=await chrome.storage.session.get('sourceGrants');return sourceGrants;});
async function openPicker(){
 await page.bringToFront();const {targetInfos}=await cdp.send('Target.getTargets',{filter:[{type:'tab',exclude:false}]});const target=targetInfos.find(t=>t.url===page.url()&&t.embedderData?.tabActive);
 await cdp.send('Extensions.triggerAction',{id,targetId:target.targetId});let popup;
 await expect.poll(async()=>{const all=await cdp.send('Target.getTargets',{filter:[{exclude:false}]});popup=all.targetInfos.find(t=>t.type==='page'&&t.url.endsWith('/popup.html'));return !!popup;}).toBe(true);
 const {sessionId}=await cdp.send('Target.attachToTarget',{targetId:popup.targetId,flatten:false});
 const evaluate=async expression=>{const messageId=++sequence;const reply=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{cdp.off('Target.receivedMessageFromTarget',listener);reject(Error('Popup timeout'));},10000);function listener(e){if(e.sessionId!==sessionId)return;const response=JSON.parse(e.message);if(response.id!==messageId)return;clearTimeout(timer);cdp.off('Target.receivedMessageFromTarget',listener);response.error?reject(Error(response.error.message)):resolve(response.result);}cdp.on('Target.receivedMessageFromTarget',listener);});await cdp.send('Target.sendMessageToTarget',{sessionId,message:JSON.stringify({id:messageId,method:'Runtime.evaluate',params:{expression,awaitPromise:true,returnByValue:true}})});return (await reply).result?.value;};
 await expect.poll(()=>evaluate('document.readyState')).toBe('complete');await evaluate("document.getElementById('controlledSource').checked=true;document.getElementById('choose').click();true");await expect(page.locator('[data-uip-picker]')).toHaveCount(1);
}
test('controlled grants bind a document and expire on cancel, navigation and completion',async()=>{
 await page.goto('http://127.0.0.1:18787/interactive-demo.html');await openPicker();const [first]=await grants();expect(first.documentId).toMatch(/^[a-zA-Z0-9-]+$/);expect(first.origin).toBe('http://127.0.0.1:18787');
 await page.keyboard.press('Escape');await expect.poll(async()=>(await grants()).length).toBe(0);
 await openPicker();const [beforeNavigation]=await grants();await page.goto('http://127.0.0.1:18787/adapters-a.html');await expect.poll(async()=>(await grants()).length).toBe(0);
 await openPicker();const [current]=await grants();expect(current.documentId).not.toBe(beforeNavigation.documentId);
 await page.locator('[data-uip-recipe] h2').first().click();const event=context.waitForEvent('page',p=>p.url().includes('/preview.html'));await page.keyboard.press('Enter');const preview=await event;await expect(preview.locator('#save')).toBeEnabled();await expect.poll(async()=>(await grants()).length).toBe(0);await preview.close();
 const replay=await worker.evaluate(async({current,previous})=>{
  const {captures}=await chrome.storage.session.get('captures');const snapshot=captures.at(-1).snapshot;
  const send=async()=>{const [result]=await chrome.scripting.executeScript({target:{tabId:current.tabId},func:async snapshot=>chrome.runtime.sendMessage({type:'capture',snapshot,format:'html'}),args:[snapshot]});return result.result;};
  const consumed=await send();await chrome.storage.session.set({sourceGrants:[{...current,documentId:previous.documentId}]});const wrongDocument=await send();
  await chrome.storage.session.set({sourceGrants:[{...current,expires:Date.now()-1}]});const expired=await send();return {consumed,wrongDocument,expired};
 },{current,previous:beforeNavigation});
 for(const response of Object.values(replay))expect(response.error).toContain('一次性');
});
