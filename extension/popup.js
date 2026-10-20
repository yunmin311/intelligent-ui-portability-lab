'use strict';
const button = document.getElementById('choose');
const status = document.getElementById('status');
async function currentTab() { return (await chrome.tabs.query({active:true,currentWindow:true}))[0]; }
currentTab().then(async tab => {
  const result = await chrome.runtime.sendMessage({type:'status',tabId:tab?.id});
  status.textContent = result.status || result.error;
}).catch(error => {status.textContent=error.message;});
button.addEventListener('click', async () => {
  button.disabled = true;
  status.dataset.state='loading';
  status.textContent = '正在启动选择器…';
  try {
    const tab = await currentTab();
    if (!tab || !/^https?:\/\//i.test(tab.url || '')) throw new Error('请打开 HTTP(S) 网页。本地测试请使用 http://127.0.0.1:8765，不能直接双击 fixture 文件。浏览器内部页不允许注入。');
    const host = new URL(tab.url).hostname.toLowerCase();
    if (host === 'chatgpt.com' || host.endsWith('.chatgpt.com') || host === 'chat.openai.com' || host.endsWith('.chat.openai.com')) throw new Error('ChatGPT 合规闸门：尚无已确认的原生 UI 导出授权路径。请在本地测试页面或其他获准页面使用。');
    const format = document.getElementById('format').value;
    const controlled=document.getElementById('controlledSource')?.checked===true;
    const [injectedDocument]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>true});
    if(!injectedDocument?.documentId)throw Error('无法确认当前文档，请刷新后重试');
    const grant=await chrome.runtime.sendMessage({type:'sourceContract',tabId:tab.id,documentId:injectedDocument.documentId,controlled});if(grant.error)throw Error(grant.error);
    const target={tabId:tab.id,documentIds:[injectedDocument.documentId]};
    await chrome.scripting.executeScript({target,func:(f,c)=>{globalThis.__UI_PORTABILITY_FORMAT__=f;globalThis.__UI_PORTABILITY_CONTROLLED__=c;},args:[format,controlled]});
    await chrome.scripting.executeScript({target,files:['picker.js']});
    window.close();
  } catch (error) {
    status.dataset.state='error';
    status.textContent = '无法启动：'+String(error.message || error);
    button.disabled = false;
  }
});

document.getElementById('import').onclick=()=>{chrome.tabs.create({url:chrome.runtime.getURL('import.html')});window.close();};
