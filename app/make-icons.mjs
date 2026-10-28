// One-time icon rasterizer: SVG -> PNG at required sizes via Chrome for Testing.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const svg = await fs.readFile(path.join(root, 'assets', 'icon.svg'), 'utf8');
const exe = 'E:/30_项目/intelligent-ui-portability-lab/.research/repro/.browsers/chrome/win64-156.0.8078.47/chrome-win64/chrome.exe';
const browser = await puppeteer.launch({executablePath: exe, headless: true});
const page = await browser.newPage();
for (const size of [16, 32, 48, 128]) {
  const sized = svg.replace('width="128" height="128"', `width="${size}" height="${size}"`);
  await page.setViewport({width: size, height: size});
  await page.goto('data:image/svg+xml;base64,' + Buffer.from(sized).toString('base64'));
  await page.screenshot({path: path.join(root, 'assets', `icon${size}.png`), omitBackground: true});
  console.log('icon' + size + '.png');
}
await browser.close();
