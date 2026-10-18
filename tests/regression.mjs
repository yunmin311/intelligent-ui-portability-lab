// Regression probe intentionally runs the old picker through its real DOM path.
import {chromium} from '@playwright/test';import fs from 'node:fs';
const browser=await chromium.launch({channel:'chromium',headless:true});
const page=await browser.newPage({viewport:{width:1200,height:900}});await page.goto('http://127.0.0.1:18787/interactive-demo.html');
await page.addScriptTag({path:'tests/baseline/picker-v0.1.js'});
await page.locator('#table-demo h2').hover();const downloadPromise=page.waitForEvent('download');await page.locator('#table-demo h2').click();const d=await downloadPromise;await d.saveAs('tests/evidence/baseline-child.html');
const raw=fs.readFileSync('tests/evidence/baseline-child.html','utf8');console.log(JSON.stringify({regression:'click heading should select entire component',tableIncluded:raw.includes('<table'),brandedHeader:raw.includes('UI Portability Lab · 静态快照')}));
await browser.close();
