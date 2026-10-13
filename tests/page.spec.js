import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const manifest=JSON.parse(await readFile('public/mediauto-ai/manifest.json','utf8'));
const ready = async mount => expect(mount).toHaveAttribute('data-state','ready');
test('all source pairs: dimensions, source hashes, manifest registration',async()=>{
 expect(manifest.pairs).toHaveLength(16);
 for(const pair of manifest.pairs){
  expect(pair.base_canvas_identical||pair.same_viewport).toBe(true);
  for(const side of ['before','after']){
   const file=await readFile(`public/mediauto-ai/${pair[side]}`);
   expect(createHash('sha256').update(file).digest('hex')).toBe(pair[`${side}_sha256`]);
   expect([file.readUInt32BE(16),file.readUInt32BE(20)]).toEqual([1600,1000]);
  }
 }
});
test('all 16 pairs, simultaneous changes, identical geometry, keyboard and mouse endpoints',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const fetched=[];page.on('request',r=>{if(r.url().includes('/images/'))fetched.push(r.url());});
 await page.setViewportSize({width:1440,height:1000});await page.goto('/');
 const hero=page.locator('#hero-viewer'); await ready(hero);
 expect(fetched).toHaveLength(2);
 await page.screenshot({path:'test-results/desktop-hero.png'});
 const mount=page.locator('#feature-viewer');await mount.scrollIntoViewIfNeeded();await ready(mount);
 for(const pair of manifest.pairs){
  const [group,variant]=pair.feature.split(' · ');
  await page.locator('#feature-nav').getByRole('button',{name:group,exact:true}).click();
  await page.locator('#variant-controls').getByRole('button',{name:variant||'세포 라벨',exact:true}).click();
  await mount.locator(`[data-view="${pair.view}"]`).click();
  await expect(mount).toHaveAttribute('data-pair',pair.id);await ready(mount);
  const result=await mount.locator('.image-layers').evaluate(el=>[...el.querySelectorAll('img')].map(i=>({src:i.src,rect:JSON.stringify(i.getBoundingClientRect().toJSON()),width:i.naturalWidth,height:i.naturalHeight})));
  expect(result[0].src.endsWith(pair.web.before)).toBe(true);expect(result[1].src.endsWith(pair.web.after)).toBe(true);expect(result[0].rect).toEqual(result[1].rect);
  const range=mount.getByRole('slider');await expect(range).toHaveValue('50');
  await range.focus();await page.keyboard.press('Home');await expect(range).toHaveValue('0');
  await expect(mount.locator('.before')).toHaveCSS('clip-path','inset(0px 100% 0px 0px)');
  await page.keyboard.press('End');await expect(range).toHaveValue('100');
  await expect(mount.locator('.before')).toHaveCSS('clip-path','inset(0px 0% 0px 0px)');
  await page.keyboard.press('ArrowLeft');await expect(range).toHaveValue('99');
  await mount.locator('.reset-position').click();await expect(range).toHaveValue('50');
 }
 const range=mount.getByRole('slider');const box=await range.boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x,box.y+box.height/2);await expect(range).toHaveValue('0');await page.mouse.move(box.x+box.width,box.y+box.height/2);await expect(range).toHaveValue('100');await page.mouse.up();
 await mount.locator('.reset-position').click();await page.screenshot({path:'test-results/desktop-page.png',fullPage:true});
 for(const href of await page.locator('a[href^="#"]').evaluateAll(els=>els.map(e=>e.getAttribute('href')).filter(h=>h!=='#'))){expect(await page.locator(href).count()).toBe(1);}
 expect(errors).toEqual([]);
});
test('loading waits for both images, failure retry, latest selection wins',async({page})=>{
 let release;const gate=new Promise(r=>release=r);
 await page.route('**/images/he-breast-context/after.webp',async route=>{await gate;await route.continue();});
 await page.goto('/',{waitUntil:'domcontentloaded'});const hero=page.locator('#hero-viewer');await expect(hero).toHaveAttribute('data-state','loading');
 await expect(hero.getByRole('slider')).toBeDisabled();await expect(hero.locator('.image-layers')).toBeHidden();release();await ready(hero);
 await page.unroute('**/images/he-breast-context/after.webp');
 await page.route('**/images/he-breast-detail/after.webp',r=>r.abort());
 await hero.getByRole('button',{name:'확대 영역',exact:true}).click();await expect(hero).toHaveAttribute('data-state','error');await expect(hero.locator('.image-layers')).toBeHidden();await expect(hero.getByRole('slider')).toBeDisabled();
 await page.unroute('**/images/he-breast-detail/after.webp');await hero.getByRole('button',{name:'다시 시도'}).click();await ready(hero);
 await page.route('**/images/he-breast-context/after.webp',async r=>{await new Promise(resolve=>setTimeout(resolve,600));await r.continue();});
 await hero.locator('[data-view=context]').click();await hero.locator('[data-view=detail]').click();await ready(hero);await page.waitForTimeout(800);
 await expect(hero).toHaveAttribute('data-pair','he-breast-detail');expect(await hero.locator('img.after').getAttribute('src')).toContain('he-breast-detail/after.webp');
});
test('mobile touch, no overflow or loading shift, reduced motion, contact dialog',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();await page.goto('/');const hero=page.locator('#hero-viewer');await ready(hero);
 const stage=hero.locator('.image-stage');await stage.scrollIntoViewIfNeeded();const before=await stage.boundingBox();
 const cdp=await context.newCDPSession(page);const y=before.y+before.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:before.x+before.width*.5,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:before.x+before.width*.8,y}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(hero.getByRole('slider')).toHaveValue('80');
 await hero.locator('[data-view=detail]').click();await ready(hero);const after=await stage.boundingBox();expect(before.height).toEqual(after.height);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const explorer=page.locator('#feature-viewer');await explorer.scrollIntoViewIfNeeded();await ready(explorer);
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile-page.png',fullPage:true});
 await page.locator('#contact-unconfigured').click();await expect(page.locator('dialog')).toBeVisible();await page.getByRole('button',{name:'확인',exact:true}).click();await expect(page.locator('dialog')).not.toBeVisible();
 await context.close();
});
test('manifest error is retryable and deployment in nested path resolves assets',async({page})=>{
 await page.route('**/manifest.json',r=>r.abort());await page.goto('/');await expect(page.locator('#hero-viewer')).toContainText('비교 정보를 불러오지 못했습니다');
 await page.unroute('**/manifest.json');await page.getByRole('button',{name:'다시 시도'}).click();await ready(page.locator('#hero-viewer'));
 // Emulate a static host mounting the identical build under /products/mediauto/.
 await page.route('**/products/mediauto/**',async route=>{const url=new URL(route.request().url());url.pathname=url.pathname.replace('/products/mediauto/','/');const response=await route.fetch({url:url.href});await route.fulfill({response});});
 await page.goto('/products/mediauto/');await ready(page.locator('#hero-viewer'));expect(await page.locator('#hero-viewer img.before').getAttribute('src')).toContain('/products/mediauto/public/mediauto-ai/images/');
});
