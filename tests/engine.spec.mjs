import {test,expect} from '@playwright/test';
test('engine-only overlay and semantic container regression (not extension E2E)',async({page})=>{
 await page.goto('/interactive-demo.html');await page.addScriptTag({path:'extension/picker.js'});
 await page.locator('#table-demo h2').hover();await page.locator('#table-demo h2').click();
 await expect(page.locator('[data-uip-picker]')).toBeVisible();
 await expect(page.locator('[data-uip-picker]')).toContainText('预览');
});
