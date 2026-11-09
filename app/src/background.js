// PagePort service worker: inject the save overlay; deliver downloads.
'use strict';
const RESTRICTED = /^(chrome|edge|about|devtools|view-source|chrome-extension):/i;

chrome.action.onClicked.addListener(async tab => {
  if (!tab?.id) return;
  const url = tab.url || tab.pendingUrl || '';
  if (RESTRICTED.test(url) || url === '') {
    chrome.tabs.create({url: 'pages/landing.html?from=' + encodeURIComponent(url || 'about:blank')});
    return;
  }
  try {
    await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['content.js']});
  } catch (e) {
    // file:// without the user's "allow file URLs" switch, web store, and similar.
    chrome.tabs.create({url: 'pages/landing.html?error=' + encodeURIComponent(String(e.message || e))});
  }
});

// Reliable file delivery from content contexts (SingleFile-style): the data URL
// is handed to chrome.downloads, which shows the standard shelf and retry.
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg?.type !== 'pp-download') return;
  (async () => {
    if (typeof msg.name !== 'string' || msg.name.length > 200 || /[\\/:*?"<>|]/.test(msg.name)) throw Error('文件名不合法');
    if (typeof msg.base64 !== 'string' || msg.base64.length > 40 * 1024 * 1024) throw Error('文件过大');
    const mime = typeof msg.mime === 'string' && /^[\w.+-]+\/[\w.+-]+$/.test(msg.mime) ? msg.mime : 'application/octet-stream';
    const id = await chrome.downloads.download({url: `data:${mime};base64,${msg.base64}`, filename: msg.name, saveAs: false});
    return {ok: true, id};
  })().then(respond, e => respond({error: String(e.message || e)}));
  return true;
});
