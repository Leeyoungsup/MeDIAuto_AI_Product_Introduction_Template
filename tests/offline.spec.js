import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
test('double-click HTML works offline with all sixteen comparisons', async ({ browser }) => {
 const context = await browser.newContext({ offline: true });
 const page = await context.newPage();
 const errors=[]; const requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url())) requests.push(r.url());});
 await page.goto(pathToFileURL(resolve('MeDIAuto-AI.html')).href);
 await expect(page.locator('#hero-viewer')).toHaveAttribute('data-state','ready');
 const mount=page.locator('#feature-viewer'); await mount.scrollIntoViewIfNeeded();
 const manifest=JSON.parse(await readFile('public/mediauto-ai/manifest.json','utf8'));
 for(const pair of manifest.pairs){
  const [group,variant]=pair.feature.split(' · ');
  await page.locator('#feature-nav').getByRole('button',{name:group,exact:true}).click();
  await page.locator('#variant-controls').getByRole('button',{name:variant||'세포 라벨',exact:true}).click();
  await mount.locator(`[data-view="${pair.view}"]`).click();
  await expect(mount).toHaveAttribute('data-pair',pair.id);
  await expect(mount).toHaveAttribute('data-state','ready');
  await expect(mount.getByRole('slider')).toHaveValue('50');
  await mount.getByRole('slider').focus();await page.keyboard.press('Home');await expect(mount.getByRole('slider')).toHaveValue('0');
  await page.keyboard.press('End');await expect(mount.getByRole('slider')).toHaveValue('100');
 }
 await page.locator('#review').scrollIntoViewIfNeeded();
 expect(await page.locator('.review-image img').evaluate(async img=>{await img.decode();return img.naturalWidth>0;})).toBe(true);
 expect(requests).toEqual([]);expect(errors).toEqual([]);
 await context.close();
});
