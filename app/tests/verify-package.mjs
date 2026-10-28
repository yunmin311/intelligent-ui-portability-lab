// Verify the released ZIP: extract, load, pick, save — the actual install path.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); // app/
const repo = path.resolve(root, '..');
const zip = path.join(root, 'dist-release', 'PagePort-v1.0.0-extension.zip');
const work = path.join(root, 'tests', 'artifacts', 'zipcheck');
await fs.rm(work, {recursive: true, force: true});
await fs.mkdir(work, {recursive: true});
execFileSync('python', ['-c', 'import sys,zipfile;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', zip, path.join(work, 'ext')]);
const extensionPath = path.join(work, 'ext');
const CHROME = process.env.CHROME_PATH || 'E:/30_项目/intelligent-ui-portability-lab/.research/repro/.browsers/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe';

const server = http.createServer(async (q, s) => {
  s.setHeader('content-type', 'text/html; charset=utf-8');
  s.end(await fs.readFile(path.join(repo, 'samples', 'source', 'article.html')));
});
await new Promise(r => server.listen(18998, '127.0.0.1', r));
const dlDir = path.join(work, 'downloads');
await fs.mkdir(dlDir, {recursive: true});
await fs.mkdir(path.join(work, 'profile', 'Default'), {recursive: true});
await fs.writeFile(path.join(work, 'profile', 'Default', 'Preferences'), JSON.stringify({download: {default_directory: dlDir, prompt_for_download: false}}));

const browser = await puppeteer.launch({executablePath: CHROME, headless: true, userDataDir: path.join(work, 'profile'),
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`, '--no-first-run']});
const swT = await browser.waitForTarget(t => t.type() === 'service_worker', {timeout: 20000});
const extensionId = new URL(swT.url()).host;
const bcdp = await browser.target().createCDPSession();
const page = await browser.newPage();
await page.setViewport({width: 1280, height: 900});
await page.goto('http://127.0.0.1:18998/', {waitUntil: 'networkidle0'});
const {targetInfos} = await bcdp.send('Target.getTargets', {filter: [{type: 'tab'}]});
await bcdp.send('Extensions.triggerAction', {id: extensionId, targetId: targetInfos.find(t => t.url === page.url()).targetId});
await page.waitForSelector('[data-pageport="panel"]', {timeout: 10000});
const pt = await page.evaluate(() => { const r = [...document.querySelectorAll('h2')].find(h => h.textContent.includes('参数对比')).getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + r.height / 2}; });
await page.mouse.click(pt.x, pt.y);
await page.keyboard.press('ArrowUp');
await new Promise(r => setTimeout(r, 600));
await page.evaluate(() => document.querySelector('[data-pageport="panel"]').shadowRoot.getElementById('save').click());
await new Promise(r => setTimeout(r, 2500));
const md = (await fs.readdir(dlDir)).find(f => f.endsWith('.md'));
const body = md ? await fs.readFile(path.join(dlDir, md), 'utf8') : '';
const ok = body.includes('参数对比') && body.includes('CUBIC');
console.log(ok ? 'ZIP INSTALL CHECK: PASS — ' + md + ' (' + body.length + 'B)' : 'ZIP INSTALL CHECK: FAIL');
await browser.close();
server.close();
process.exit(ok ? 0 : 1);
