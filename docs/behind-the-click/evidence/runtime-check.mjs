import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = new URL('./runtime/', import.meta.url); await mkdir(out, {recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const url=process.env.PREVIEW_URL || 'http://127.0.0.1:4325/experience';
const results=[];
try {
for (const width of [375,768,1440]) for (const theme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme});
  const page=await context.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url); await page.waitForSelector('html.sc-ready'); await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,'horizontal overflow');
  assert.equal(await page.locator('main h1').count(),1);
  await page.screenshot({path:new URL(width+'-'+theme+'-hero.png',out).pathname});
  await page.locator('#mission').scrollIntoViewIfNeeded(); await page.waitForTimeout(850);
  const size=await page.locator('#mission-title').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
  assert.ok(size>=36,'mission title hierarchy');
  await page.screenshot({path:new URL(width+'-'+theme+'-mission.png',out).pathname});
  await page.locator('[data-stop]').click();
  assert.equal(await page.locator('[data-recovery]').getAttribute('data-phase'),'recovering');
  assert.match(await page.locator('[data-recovery-message]').textContent(),/2 replicas ready/);
  assert.equal(await page.locator('[data-stop]').isDisabled(),true);
  await page.locator('[data-reset]').click();
  assert.equal(await page.locator('[data-recovery]').getAttribute('data-phase'),'ready');
  await page.locator('[data-stop]').click();
  await page.waitForFunction(()=>document.querySelector('[data-recovery]').dataset.phase==='ready');
  assert.match(await page.locator('[data-recovery-message]').textContent(),/3 replicas ready/);
  const links=await page.locator('.course-row').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
  assert.equal(links.length,4);
  for(const link of links) assert.equal((await page.request.get(new URL(link,url).href)).status(),200);
  if(width===1440 && theme==='dark') {
    await page.locator('[data-view-3d]').click();
    await page.waitForSelector('[data-scene].is-ready',{timeout:30000});
    await page.waitForTimeout(800);
    await page.screenshot({path:new URL('live-3d.png',out).pathname});
    await page.locator('[data-view-3d]').click();
    assert.equal(await page.locator('[data-view-3d]').getAttribute('aria-pressed'),'false');
    await page.locator('[data-view-3d]').click();
    await page.locator('canvas').evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await page.waitForFunction(()=>!document.querySelector('[data-scene]').classList.contains('is-ready'));
    assert.equal(await page.locator('[data-scene]').evaluate(e=>e.classList.contains('is-ready')),false);
    await page.locator('[data-view-3d]').click();
    await page.waitForSelector('[data-scene].is-ready',{timeout:30000});
  }
  assert.deepEqual(errors,[]);
  results.push({width,theme,overflow:false,recovery:'stop/reset/complete pass',courses:'4 routes HTTP200',pageErrors:errors});
  await context.close();
}
for (const mode of ['reduced','nojs','model-failure','model-failure-mobile']) {
  const context=await browser.newContext({viewport:{width:mode.endsWith('mobile')?375:1440,height:900},colorScheme:mode.endsWith('mobile')?'light':'dark',reducedMotion:mode==='reduced'?'reduce':'no-preference',javaScriptEnabled:mode!=='nojs'});
  const page=await context.newPage();
  if(mode.startsWith('model-failure')) await page.route('**/models/experience/aisle.glb',route=>route.abort());
  await page.goto(url); await page.evaluate(()=>document.fonts.ready);
  const hero=await page.locator('main h1').boundingBox();
  assert.ok(hero && hero.y>=0 && hero.y<900,'hero present at first viewport in '+mode);
  if(!mode.startsWith('model-failure')) {
    await page.screenshot({path:new URL(mode+'.png',out).pathname});
    if(mode==='nojs') assert.equal(await page.locator('[data-stop]').isVisible(),false);
    if(mode==='reduced') assert.equal(await page.locator('[data-view-3d]').isVisible(),false);
  } else {
    await page.locator('[data-view-3d]').click();
    await page.waitForFunction(()=>document.querySelector('[data-view-3d]').textContent.includes('unavailable'));
    assert.equal(await page.locator('.app-stage__body').isVisible(),true);
    await page.screenshot({path:new URL(mode+'.png',out).pathname});
  }
  results.push({mode,result:'pass'}); await context.close();
}
const keyboard=await browser.newPage({viewport:{width:1440,height:900}});
await keyboard.goto(url); await keyboard.keyboard.press('Tab');
assert.equal(await keyboard.evaluate(()=>document.activeElement.textContent),'Skip to content');
await keyboard.keyboard.press('Enter');
results.push({keyboard:'skip link focus and activation pass'});
console.log(JSON.stringify({status:'PASS',cases:results},null,2));
await writeFile(new URL('report.json',out),JSON.stringify({status:'PASS',cases:results},null,2)+'\n');
} finally { await browser.close(); }
