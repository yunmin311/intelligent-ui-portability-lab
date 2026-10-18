'use strict';
// Ephemeral coordination only. No browsing collection, persistent content or network.
const captures = new Map();
const results = new Map();
const blocked = host => host === 'chatgpt.com' || host.endsWith('.chatgpt.com') || host === 'chat.openai.com' || host.endsWith('.chat.openai.com');
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  (async () => {
    for (const [key, value] of captures) if (Date.now() - value.created > 600000) captures.delete(key);
    if (message.type === 'capture') {
      const url = new URL(sender.url);
      if (!sender.tab || sender.frameId !== 0 || !/^https?:$/.test(url.protocol) || blocked(url.hostname)) throw Error('来源不允许捕获');
      const payload = message.payload;
      if (!payload || typeof payload.page !== 'string' || new TextEncoder().encode(JSON.stringify(payload)).byteLength > 12000000) throw Error('快照超过 12 MB 限制');
      if (captures.size >= 3) captures.delete(captures.keys().next().value);
      const id = crypto.randomUUID();
      captures.set(id, {payload, created:Date.now()});
      await chrome.tabs.create({url:chrome.runtime.getURL(`preview.html?id=${id}`)});
      results.set(sender.tab.id, '已捕获 · 请在预览页检查遗漏后下载');
      return {ok:true};
    }
    if (sender.url?.startsWith(chrome.runtime.getURL('preview.html')) && message.type === 'getCapture') {
      return captures.get(message.id)?.payload || {error:'预览已过期或扩展后台已重启，请回原页面重新捕获。'};
    }
    if (sender.url === chrome.runtime.getURL('popup.html') && message.type === 'status') return {status:results.get(message.tabId) || '就绪 · 仅保存你有权保存的页面区域'};
    if (sender.tab && message.type === 'pickerStatus') { results.set(sender.tab.id, String(message.status).slice(0,200)); return {ok:true}; }
    throw Error('不支持的请求');
  })().then(respond, error => respond({error:error.message}));
  return true;
});
chrome.tabs.onRemoved.addListener(id => results.delete(id));
