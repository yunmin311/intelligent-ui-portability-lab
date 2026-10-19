import {test,expect,chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {PNG} from 'pngjs';
const evidence=path.resolve(process.env.UIP_EVIDENCE_DIR||'tests/artifacts/v0.5.1');
const extensionPath=path.resolve(process.env.UIP_EXTENSION_PATH||'extension');
let context,cdp,page,extensionId;
let seq=0;
async function popup(){
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
 await evaluate("document.getElementById('import').click();true");
 return {evaluate};
}
test.beforeAll(async()=>{
 await fs.mkdir(evidence,{recursive:true});
 context=await chromium.launchPersistentContext('',{...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{channel:'chromium'}),headless:true,acceptDownloads:true,viewport:{width:1200,height:900},args:['--enable-unsafe-extension-debugging',`--disable-extensions-except=${extensionPath}`,`--load-extension=${extensionPath}`]});
 const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');extensionId=new URL(worker.url()).hostname;
 cdp=await context.browser().newBrowserCDPSession();page=await context.newPage();
 await fs.writeFile(path.join(evidence,'runtime.json'),JSON.stringify({browser:context.browser().version(),platform:process.platform,manifest:JSON.parse(await fs.readFile(path.join(extensionPath,'manifest.json'),'utf8')),popup:'CDP Extensions.triggerAction on real toolbar tab, Runtime evaluation of actual popup DOM; no permission mocks',date:new Date().toISOString()},null,2));
});
test.afterAll(async()=>{await context?.close();});
test.beforeEach(async()=>{await page.goto('http://127.0.0.1:18787/interactive-demo.html');});
async function importer(){const event=context.waitForEvent('page',p=>p.url().includes('/import.html'));await popup();const p=await event;await p.waitForLoadState('load');await expect(p.locator('#pasteArea')).toBeVisible();return p;}
async function paste(p,{html='',text='',image,unsupported=false}={}){await p.locator('#pasteArea').evaluate((el,data)=>{const dt=new DataTransfer();if(data.image){const raw=Uint8Array.from(atob(data.image),c=>c.charCodeAt(0));dt.items.add(new File([raw],'clipboard.png',{type:'image/png'}));}else if(data.unsupported)dt.items.add(new File(['x'],'a.gif',{type:'image/gif'}));else{if(data.html)dt.setData('text/html',data.html);if(data.text)dt.setData('text/plain',data.text);}el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));},{html,text,image,unsupported});}
async function converted(p,data){const e=context.waitForEvent('page',p=>p.url().includes('/preview.html'));await paste(p,data);const preview=await e;await expect(preview.locator('#save')).toBeEnabled();return preview;}
async function download(p,name,format='html'){await p.locator('#format').selectOption(format);await expect(p.locator('#save')).toBeEnabled();const e=p.waitForEvent('download');await p.locator('#save').click();const d=await e;expect(await d.failure()).toBeNull();const file=path.join(evidence,name);await d.saveAs(file);return file;}
async function offline(file){const p=await context.newPage(),requests=[],errors=[];p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});p.on('pageerror',e=>errors.push(e.message));await p.goto('file://'+file);return {p,requests,errors};}
test('v051 real Popup → text paste → HTML/Markdown, literal markup and independent offline files',async()=>{
 const p=await importer();await p.screenshot({path:path.join(evidence,'import-light.png'),fullPage:true});await p.emulateMedia({colorScheme:'dark'});await p.setViewportSize({width:375,height:900});await p.screenshot({path:path.join(evidence,'import-dark-narrow.png'),fullPage:true});
 const text='\n\n中文笔记\n\n\n\n<script>globalThis.PWN=1</script>\n  保留缩进\n';await page.bringToFront();await page.evaluate(text=>{const t=document.createElement('textarea');t.id='clipboard-source';t.value=text;document.body.append(t);},text);await page.locator('#clipboard-source').focus();await page.keyboard.press('Control+A');await page.keyboard.press('Control+C');await p.bringToFront();await p.locator('#pasteArea').focus();const ready=context.waitForEvent('page',p=>p.url().includes('/preview.html'));await p.keyboard.press('Control+V');const preview=await ready;await expect(preview.locator('#save')).toBeEnabled();const html=await download(preview,'paste-text.html'),md=await download(preview,'paste-text.md','md');await p.close();await preview.close();const out=await offline(html);await expect(out.p.locator('pre')).toHaveText(text);expect(await out.p.evaluate(()=>globalThis.PWN)).toBeUndefined();expect(await fs.readFile(md,'utf8')).toContain(text);expect(out.requests).toEqual([]);await out.p.close();
});
test('v051 rich HTML paste sanitization, native details, semantic Markdown, no recipe authority',async()=>{
 const p=await importer();await p.locator('summary').click();await p.locator('#width').fill('600');const preview=await converted(p,{html:`<h1>智能界面示例（合成验收样本）</h1><table><tr><th>参数</th><th>值</th></tr><tr><td>谐波</td><td>3</td></tr></table><pre><code>x &lt; 5\n  中文</code></pre><details><summary>展开</summary><p>详情正文</p></details><script>globalThis.PWN=1</script><img src="https://evil.invalid/track"><svg onload="globalThis.PWN=1"><script>alert(1)</script></svg><div data-uip-recipe="calculator@1"><input type="number" value="98765"></div>`});
 const file=await download(preview,'paste-rich.html'),md=await download(preview,'paste-rich.md','md'),json=await download(preview,'paste-rich.json','json');const s=JSON.parse(await fs.readFile(json,'utf8'));expect(s.dimensions.width).toBe(600);expect(s.source).toEqual({type:'html',origin:'local'});expect(s.behaviors).toEqual([]);expect(JSON.stringify(s)).not.toContain('98765');const out=await offline(file);await out.p.locator('summary').click();await expect(out.p.getByText('详情正文')).toBeVisible();expect(await out.p.evaluate(()=>globalThis.PWN)).toBeUndefined();expect(out.requests).toEqual([]);expect(out.errors).toEqual([]);expect(await fs.readFile(md,'utf8')).toContain('| 参数 | 值 |');await out.p.screenshot({path:path.join(evidence,'paste-rich-offline.png'),fullPage:true});await Promise.all([out.p.close(),preview.close(),p.close()]);
});
test('v051 screenshot paste scales 4K safely; HTML/ZIP/notes resource survives import close and hashes match',async()=>{
 const p=await importer();const image=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=3840;c.height=2160;const x=c.getContext('2d');x.fillStyle='#18222d';x.fillRect(0,0,c.width,c.height);x.fillStyle='#fff';x.font='80px sans-serif';x.fillText('Synthetic UI · 合成截图',100,200);x.fillStyle='#77aaff';x.fillRect(100,300,2000,500);return c.toDataURL('image/png').split(',')[1];});
 const preview=await converted(p,{image});await expect(preview.locator('#capability')).toHaveText('visual-only');await expect(preview.locator('#report')).toContainText('3840');const html=await download(preview,'paste-screenshot.html'),zip=await download(preview,'paste-screenshot.zip','zip');await expect(preview.locator('#format option[value=md]')).toBeDisabled();await Promise.all([p.close(),preview.close()]);
 const folder=path.join(evidence,'screenshot-unpacked');const {execFileSync}=await import('node:child_process');execFileSync('python3',['-c',String.raw`import sys,zipfile,json,hashlib,re,pathlib
z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;z.extractall(sys.argv[2]);m=json.loads(z.read('manifest.json'));assert all(hashlib.sha256(z.read(e['path'])).hexdigest()==e['sha256'] for e in m['entries']);md=z.read('notes.md').decode();refs=re.findall(r'!\[[^\]]*\]\(([^)]+)\)',md);assert len(refs)==1 and refs[0] in z.namelist()
`,zip,folder]);
 for(const file of [html,path.join(folder,'index.html')]){const out=await offline(file);await expect(out.p.locator('img')).toBeVisible();const dims=await out.p.locator('img').evaluate(e=>[e.naturalWidth,e.naturalHeight]);expect(dims[0]*dims[1]).toBeLessThanOrEqual(1000000);expect(out.requests).toEqual([]);expect(out.errors).toEqual([]);await out.p.screenshot({path:path.join(evidence,file===html?'screenshot-offline.png':'screenshot-zip-offline.png')});await out.p.close();}
});
test('v051 empty/unsupported/oversize/cancel/repeated paste recover without stale preview',async()=>{
 const p=await importer();await paste(p);await expect(p.locator('#status')).toContainText('没有');await paste(p,{unsupported:true});await expect(p.locator('#status')).toContainText('不支持');await paste(p,{text:'x'.repeat(1000001)});await expect(p.locator('#status')).toContainText('100 万');
 await p.evaluate(()=>{const el=document.getElementById('pasteArea');const dt=new DataTransfer();dt.setData('text/html','<div>'+Array.from({length:1000},()=>'<p>正文</p>').join('')+'</div>');el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));document.getElementById('cancel').click();});await expect(p.locator('#status')).toContainText('已取消');await expect(p.locator('#sandbox iframe')).toHaveCount(0);
 const a=await converted(p,{text:'第一次'});const b=await converted(p,{text:'第二次'});const out=await offline(await download(b,'retry.html'));await expect(out.p.locator('pre')).toHaveText('第二次');await Promise.all([a.close(),b.close(),out.p.close(),p.close()]);
});

test('v051 file and drop reuse paste pipeline; oversized image rejects before preview',async()=>{
 const p=await importer();
 await p.locator('#file').setInputFiles({name:'too-big.png',mimeType:'image/png',buffer:Buffer.alloc(16000001)});await expect(p.locator('#status')).toContainText('超过');await expect(p.locator('#file')).toBeEnabled();
 const e=context.waitForEvent('page',p=>p.url().includes('/preview.html'));
 await p.locator('#drop').evaluate(el=>{const dt=new DataTransfer();dt.items.add(new File(['拖放文字\n第二行'],'note.txt',{type:'text/plain'}));el.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));});const v=await e;await expect(v.locator('#save')).toBeEnabled();const out=await offline(await download(v,'drop-text.html'));await expect(out.p.locator('pre')).toHaveText('拖放文字\n第二行');await Promise.all([out.p.close(),v.close(),p.close()]);
});
