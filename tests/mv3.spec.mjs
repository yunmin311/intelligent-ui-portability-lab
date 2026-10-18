import {test,expect,chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {PNG} from 'pngjs';
const evidence=path.resolve('tests/evidence');
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
 await evaluate(`document.getElementById('format').value=${JSON.stringify(format)};document.getElementById('choose').click();true`);
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
 context=await chromium.launchPersistentContext('',{...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{channel:'chromium'}),headless:true,acceptDownloads:true,viewport:{width:1200,height:900},args:['--enable-unsafe-extension-debugging',`--disable-extensions-except=${path.resolve('extension')}`,`--load-extension=${path.resolve('extension')}`]});
 const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');extensionId=new URL(worker.url()).hostname;
 cdp=await context.browser().newBrowserCDPSession();page=await context.newPage();
 await fs.writeFile(path.join(evidence,'runtime.json'),JSON.stringify({browser:context.browser().version(),platform:process.platform,manifest:JSON.parse(await fs.readFile('extension/manifest.json','utf8')),popup:'CDP Extensions.triggerAction on real toolbar tab, Runtime evaluation of actual popup DOM; no permission mocks',date:new Date().toISOString()},null,2));
});
test.afterAll(async()=>{await context?.close();});
test.beforeEach(async()=>{await page.goto('http://127.0.0.1:18787/interactive-demo.html');});
test('real toolbar Popup → selection → preview → download → open + pixel golden',async()=>{
 await popup('html',true);await expect(page.locator('[data-uip-picker]')).toHaveCount(1);
 await page.locator('#table-demo h2').click();await expect(page.locator('[data-uip-picker] #label')).toContainText('section');
 await page.keyboard.press('ArrowUp');await expect(page.locator('[data-uip-picker] #label')).toContainText('body');await page.keyboard.press('ArrowDown');
 await page.screenshot({path:path.join(evidence,'picker.png')});
 const pending=context.waitForEvent('page',p=>p.url().includes('/preview.html'));await page.keyboard.press('Enter');const preview=await pending;await expect(preview.locator('#save')).toBeEnabled();
 await preview.screenshot({path:path.join(evidence,'preview.png'),fullPage:true});
 const reportDownload=preview.waitForEvent('download');await preview.locator('#saveReport').click();const rd=await reportDownload;await rd.saveAs(path.join(evidence,'table-report.json'));const diagnostic=JSON.parse(await fs.readFile(path.join(evidence,'table-report.json'),'utf8'));expect(diagnostic.capability).toBe('static');expect(diagnostic).not.toHaveProperty('html');expect(diagnostic).not.toHaveProperty('text');
 const file=await save(preview,'table.html');const body=await fs.readFile(file,'utf8');expect(body).toContain('TCP');expect(body).not.toContain('<header>');
 const source=await page.locator('#table-demo').screenshot({path:path.join(evidence,'table-source.png')});
 const opened=await context.newPage();const requests=[];opened.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});await opened.goto('file://'+file);await opened.evaluate(()=>document.fonts.ready);
 const output=await opened.locator('body>section').screenshot({path:path.join(evidence,'table-export.png')});
 const a=PNG.sync.read(source),b=PNG.sync.read(output);expect([b.width,b.height]).toEqual([a.width,a.height]);let pixels=0,mae=0;for(let i=0;i<a.data.length;i+=4){let diff=0;for(let j=0;j<3;j++){const delta=Math.abs(a.data[i+j]-b.data[i+j]);mae+=delta;diff=Math.max(diff,delta);}if(diff>16)pixels++;}
 const metrics={width:a.width,height:a.height,changedPixelRatio:pixels/(a.width*a.height),meanAbsoluteChannelError:mae/(a.width*a.height*3),threshold:{ratio:0.015,channel:2},conditions:'same Chromium,1200x900,system fonts,table same state; element clip excludes exterior shadow'};await fs.writeFile(path.join(evidence,'table-diff.json'),JSON.stringify(metrics,null,2));expect(metrics.changedPixelRatio).toBeLessThan(0.015);expect(metrics.meanAbsoluteChannelError).toBeLessThan(2);expect(requests).toEqual([]);
 await opened.close();await preview.close();
});
test('cancel, repeat injection and tab isolation',async()=>{
 await start();await page.keyboard.press('Escape');await expect(page.locator('[data-uip-picker]')).toHaveCount(0);
 await start();await popup();await expect(page.locator('[data-uip-picker]')).toHaveCount(1);
 const other=await context.newPage();await other.goto('http://127.0.0.1:18787/interactive-demo.html');await expect(other.locator('[data-uip-picker]')).toHaveCount(0);await other.close();await page.bringToFront();await page.locator('[data-uip-picker] #cancel').click();await expect(page.locator('[data-uip-picker]')).toHaveCount(0);
});
test('security inputs, hidden content, XSS, URL removal and Markdown escaping',async()=>{
 await page.locator('#security-demo').evaluate(el=>{el.insertAdjacentHTML('beforeend','<p>![remote](https://invalid.example/exfil) &lt;img src=x onerror=alert(9)&gt;</p><div contenteditable>EDITABLE_SECRET</div><iframe srcdoc="&lt;script&gt;alert(1)&lt;/script&gt;"></iframe>');});
 for(const format of ['html','md','json']){
  const preview=await exportTarget('#security-demo h2',format);const file=await save(preview,'security.'+format);const text=await fs.readFile(file,'utf8');
  for(const secret of ['DONT_EXPORT_ME','PRIVATE_NOTE_DO_NOT_EXPORT','HIDDEN_SECRET_DO_NOT_EXPORT','EDITABLE_SECRET','token-secret','?token=SECRET','javascript:alert'])expect(text).not.toContain(secret);
  if(format==='html'){const opened=await context.newPage();await opened.goto('file://'+file);expect(await opened.locator('script,iframe,[onclick],[onerror],[contenteditable],input[type=password]').count()).toBe(0);expect(await opened.locator('[src],[href]').count()).toBe(0);await opened.close();}
  if(format==='md')expect(text).toContain('\\!\\[remote\\]\\(https://invalid.example/exfil\\)');
  if(format==='json'){const report=JSON.parse(text);expect(report.capability).toBe('static');expect(report.omissions.join()).toContain('脱敏');}
  await preview.close();
 }
});
test('changed slider state, SVG paths, canvas, dark mode, narrow container',async()=>{
 await page.emulateMedia({colorScheme:'dark'});await page.addStyleTag({content:'body{background:#17191d;color:#eee}section{background:#22262b;width:620px;box-sizing:border-box;font-family:MissingTestFont,system-ui}'});
 await page.locator('#slider').fill('9');await page.locator('#slider').dispatchEvent('input');
 const d=await page.locator('#wave').getAttribute('d');
 await page.locator('#wave-demo').evaluate(el=>{const c=document.createElement('canvas');c.width=160;c.height=50;c.getContext('2d').fillRect(0,0,80,40);el.append(c);});
 const preview=await exportTarget('#wave-demo h2');const file=await save(preview,'wave-dark.html');const opened=await context.newPage();await opened.emulateMedia({colorScheme:'dark'});await opened.goto('file://'+file);
 await expect(opened.locator('input[type=range]')).toHaveValue('9');await expect(opened.locator('input')).toBeDisabled();expect(await opened.locator('svg path').getAttribute('d')).toBe(d);expect(await opened.locator('svg path').evaluate(e=>getComputedStyle(e).stroke)).toBe('rgb(37, 99, 235)');await expect(opened.locator('img')).toHaveCount(1);await opened.screenshot({path:path.join(evidence,'wave-dark-export.png')});
 expect(await opened.locator('section').evaluate(e=>e.getBoundingClientRect().width)).toBe(620);expect(await opened.locator('section').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(34, 38, 43)');await opened.close();await preview.close();await page.emulateMedia({colorScheme:'light'});
 const svgPreview=await exportTarget('#chart','svg');const svgFile=await save(svgPreview,'wave.svg');expect(await fs.readFile(svgFile,'utf8')).toContain('xmlns="http://www.w3.org/2000/svg"');const svgOpened=await context.newPage();await svgOpened.goto('file://'+svgFile);expect(JSON.parse(await svgOpened.locator('metadata').textContent()).capability).toBe('static');expect(await svgOpened.locator('script,foreignObject,[href],[onload]').count()).toBe(0);await svgOpened.close();await svgPreview.close();
});
test('limits fail clearly; SVG wrong region; expired preview',async()=>{
 await page.locator('#table-demo').evaluate(el=>{for(let i=0;i<5100;i++)el.append(document.createElement('span'));});await start();await page.locator('#table-demo h2').click();await page.keyboard.press('Enter');await expect(page.locator('[data-uip-picker] #error')).toContainText('5000');await page.keyboard.press('Escape');
 await page.reload();await start('svg');await page.locator('#table-demo h2').click();await page.keyboard.press('Enter');await expect(page.locator('[data-uip-picker] #error')).toContainText('SVG 根元素');await page.keyboard.press('Escape');
 const expired=await context.newPage();await expired.goto(`chrome-extension://${extensionId}/preview.html?id=missing`);await expect(expired.locator('#message')).toContainText('过期');await expect(expired.locator('#save')).toBeDisabled();await expired.close();
});
test('SnapDOM controlled comparison and explicit omission reports',async()=>{
 await page.locator('#table-demo').evaluate(el=>el.style.boxShadow='none');
 const golden=await page.locator('#table-demo').screenshot();
 await page.addScriptTag({path:'node_modules/@zumer/snapdom/dist/snapdom.js'});
 const result=await page.evaluate(async()=>{const capture=await snapdom(document.getElementById('table-demo'),{embedFonts:false,dpr:1});const png=await capture.toPng();return {png:png.src,raw:decodeURIComponent(capture.url.split(',')[1])};});
 const png=Buffer.from(result.png.split(',')[1],'base64');await fs.writeFile(path.join(evidence,'snapdom-table.png'),png);
 const a=PNG.sync.read(golden),b=PNG.sync.read(png);let changed=0;if(a.width===b.width&&a.height===b.height){for(let i=0;i<a.data.length;i+=4){if(Math.max(...[0,1,2].map(j=>Math.abs(a.data[i+j]-b.data[i+j])))>16)changed++;}}
 await page.locator('#security-demo').evaluate(el=>{const input=el.querySelector('input[type=text]');input.value='SNAPDOM_VISIBLE_SECRET';});
 const raw=await page.evaluate(async()=>{const capture=await snapdom(document.getElementById('security-demo'),{embedFonts:false,dpr:1});return decodeURIComponent(capture.url.split(',')[1]);});
 const findings={version:'3.3.4',sourceDimensions:[a.width,a.height],snapdomDimensions:[b.width,b.height],changedPixelRatio:a.width===b.width&&a.height===b.height?changed/(a.width*a.height):null,containsForeignObject:result.raw.includes('foreignObject'),unredactedTextInputInCapture:raw.includes('SNAPDOM_VISIBLE_SECRET'),decision:'Keep dev-only. Table baseline already close; raw core is not a sanitizer and captures text input. No product integration.'};
 await fs.writeFile(path.join(evidence,'snapdom-comparison.json'),JSON.stringify(findings,null,2));expect(findings.unredactedTextInputInCapture).toBe(true);
 await page.addStyleTag({content:'#table-demo::before{content:"Pseudo marker"}'});await page.locator('#table-demo').evaluate(el=>{el.insertAdjacentHTML('beforeend','<svg width="60" height="30"><defs><linearGradient id="g"><stop stop-color="red"/></linearGradient></defs><rect width="50" height="20" fill="url(#g)"/></svg>');});
 const preview=await exportTarget('#table-demo h2','json');const file=await save(preview,'omissions.json');const report=JSON.parse(await fs.readFile(file,'utf8'));expect(report.omissions.join()).toContain('伪元素');expect(report.omissions.join()).toContain('渐变');await preview.close();
});
test('ChatGPT gate and browser internal page failure via actual Popup',async()=>{
 await context.route('https://chatgpt.com/**',route=>route.fulfill({body:'<h1>offline gate test</h1>',contentType:'text/html'}));await page.goto('https://chatgpt.com/');let pop=await popup();await expect.poll(()=>pop.evaluate('document.getElementById("status").textContent')).toContain('合规闸门');await cdp.send('Extensions.triggerAction',{id:extensionId,targetId:(await cdp.send('Target.getTargets',{filter:[{type:'tab',exclude:false}]})).targetInfos.find(t=>t.url===page.url()).targetId});
 await page.goto('chrome://version');pop=await popup();await expect.poll(()=>pop.evaluate('document.getElementById("status").textContent')).toContain('HTTP(S)');
});
test('golden grid, formula fallback, checkbox, Markdown table and depth failure',async()=>{
 await page.goto('http://127.0.0.1:18787/golden-components.html');
 await page.locator('#number').fill('7');await page.locator('#number').dispatchEvent('input');
 const preview=await exportTarget('#calculator h2');const file=await save(preview,'calculator.html');
 const opened=await context.newPage();await opened.goto('file://'+file);
 await expect(opened.locator('output')).toHaveText('7² = 49');await expect(opened.locator('input[type=checkbox]')).toBeChecked();await expect(opened.locator('button')).toBeDisabled();
 expect(await opened.locator('.grid').count()).toBe(0); // Source classes are deliberately not copied; computed layout is.
 expect(await opened.locator('output').evaluate(e=>getComputedStyle(e.parentElement).display)).toBe('grid');
 expect(await opened.locator('meta[name=ui-portability-report]').getAttribute('content')).toContain('math');
 await opened.screenshot({path:path.join(evidence,'calculator-export.png')});await opened.close();await preview.close();
 const mdPreview=await exportTarget('#calculator h2','md');const md=await save(mdPreview,'calculator.md');expect(await fs.readFile(md,'utf8')).toContain('a \\| b');await mdPreview.close();
 await popup('html','dark');await page.keyboard.press('Escape');
 await page.locator('#calculator').evaluate(el=>{let parent=el;for(let i=0;i<80;i++){const child=document.createElement('div');parent.append(child);parent=child;}});
 await start();await page.locator('#calculator h2').click();await page.keyboard.press('Enter');await expect(page.locator('[data-uip-picker] #error')).toContainText('75');await page.keyboard.press('Escape');
});
