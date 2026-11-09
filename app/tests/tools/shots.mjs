// Visual pass: light + dark screenshots of the panel on a real page.
// Lives outside tests/artifacts so `node tests/loops.mjs` (which wipes that dir)
// cannot delete it.
// Run: node tests/tools/shots.mjs        PAGE=<url> overrides the target page.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dist = path.join(app, 'dist');
const out = path.join(app, 'tests', 'artifacts', 'shots');
await fs.rm(out, {recursive: true, force: true});
await fs.mkdir(path.join(out, 'profile'), {recursive: true});

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ||
    'E:/30_项目/intelligent-ui-portability-lab/.research/repro/.browsers/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe',
  headless: true, userDataDir: path.join(out, 'profile'),
  args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`, '--no-first-run', '--hide-scrollbars'],
});
const sw = await browser.waitForTarget(t => t.type() === 'service_worker', {timeout: 25000});
const id = new URL(sw.url()).host;
const bcdp = await browser.target().createCDPSession();
const wait = ms => new Promise(r => setTimeout(r, ms));
const sr = (page, fn) => page.evaluate(f => {
  const s = document.querySelector('[data-pageport="panel"]').shadowRoot;
  return new Function('s', 'return (' + f + ')(s)')(s);
}, fn.toString());

const URL_ = process.env.PAGE || 'https://zh.wikipedia.org/wiki/拥塞控制';

// One page load, both themes: reloading twice gets rate-limited.
const page = await browser.newPage();
await page.setViewport({width: 1280, height: 860});
await page.goto(URL_, {waitUntil: 'networkidle2', timeout: 60000});
await wait(800);

const {targetInfos} = await bcdp.send('Target.getTargets', {filter: [{type: 'tab'}]});
const tab = targetInfos.find(t => t.url === page.url());
await bcdp.send('Extensions.triggerAction', {id, targetId: tab.targetId});
await page.waitForSelector('[data-pageport="panel"]', {timeout: 10000});
await wait(400);

const box = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('p')].filter(n => (n.textContent || '').trim().length > 200);
  const p = cands.find(n => n.closest('article, main, #mw-content-text, .content')) || cands[0];
  if (!p) return null;
  p.scrollIntoView({block: 'center'});
  const r = p.getBoundingClientRect();
  return {x: r.x + 40, y: r.y + Math.min(24, r.height / 2)};
});
if (!box) throw new Error('no usable paragraph on ' + URL_);

for (const theme of ['light', 'dark']) {
  await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: theme}]);
  await wait(300);
  await page.evaluate(() => {
    document.querySelector('[data-pageport="panel"]')?.shadowRoot?.getElementById('re')?.click();
  });
  await wait(450);
  await page.screenshot({path: path.join(out, `${theme}-1-pick.png`)});

  await page.mouse.move(box.x, box.y);
  await wait(350);
  await page.mouse.click(box.x, box.y);
  await wait(1200);
  await page.screenshot({path: path.join(out, `${theme}-2-locked.png`)});

  await sr(page, s => s.querySelector('[data-f="png"]').click());
  await wait(1900);
  await page.screenshot({path: path.join(out, `${theme}-3-png.png`)});

  await sr(page, s => s.querySelector('[data-f="html"]').click());
  await wait(700);
  await page.screenshot({path: path.join(out, `${theme}-4-html.png`)});

  await page.setViewport({width: 1280, height: 860, deviceScaleFactor: 2});
  await wait(350);
  const host = await page.$('[data-pageport="panel"]');
  const panel = await host.evaluateHandle(n => n.shadowRoot.querySelector('.panel'));
  await panel.asElement().screenshot({path: path.join(out, `${theme}-5-panel.png`)});
  await page.setViewport({width: 1280, height: 860, deviceScaleFactor: 1});
  console.log(theme, 'done');
}

await browser.close();
